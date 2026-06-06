#!/usr/bin/env python3
"""牛马回家 — 从参考图抠出透明 sprite 帧并打包 spritesheet。
参考图是连续米黄纸面、带编号/文字标注。做法：
  1. 从四边 flood-fill 去米黄纸背景（区域生长，扛暗角渐变）。
  2. 连通域找角色块：面积大的当"帧锚点"，小碎片(枪/飞溅)并入最近锚点。
  3. 剔除编号 badge / 底部文字（小且在头顶上方或贴底）。
  4. 以脚底中点为锚，统一画布尺寸 → 输出等距 spritesheet + 单帧 PNG。
"""
import sys, json
import numpy as np
from PIL import Image
from scipy import ndimage

def bg_removed_rgba(path, b_thr=100, s_thr=80):
    rgb = np.asarray(Image.open(path).convert('RGB')).astype(np.int16)
    bright = rgb.max(2); sat = rgb.max(2) - rgb.min(2)
    fillable = (bright > b_thr) & (sat < s_thr)
    lbl, _ = ndimage.label(fillable)
    border = set(lbl[0, :]) | set(lbl[-1, :]) | set(lbl[:, 0]) | set(lbl[:, -1])
    border.discard(0)
    bg = np.isin(lbl, list(border))
    fg = ~bg
    fg = ndimage.binary_closing(fg, iterations=2)
    fg = ndimage.binary_opening(fg, iterations=1)
    return rgb.astype('uint8'), fg

def find_frames(fg, anchor_min=25000, part_min=1200):
    lbl, n = ndimage.label(fg)
    comps = []
    for i in range(1, n + 1):
        ys, xs = np.where(lbl == i)
        comps.append(dict(id=i, area=len(xs),
                          x0=xs.min(), x1=xs.max()+1, y0=ys.min(), y1=ys.max()+1,
                          cx=xs.mean(), cy=ys.mean()))
    anchors = [c for c in comps if c['area'] >= anchor_min]
    parts   = [c for c in comps if part_min <= c['area'] < anchor_min]
    frames = []
    for a in anchors:
        ids = {a['id']}
        ax0, ay0, ax1, ay1 = a['x0'], a['y0'], a['x1'], a['y1']
        ah = ay1 - ay0
        head_line = ay0 + 0.18 * ah          # 头顶线：上方的小块=编号badge，剔除
        for p in parts:
            near_x = (p['cx'] > ax0 - 45) and (p['cx'] < ax1 + 45)
            near_y = (p['cy'] > ay0 - 30) and (p['cy'] < ay1 + 60)
            below_head = p['cy'] > head_line
            if near_x and near_y and below_head:
                ids |= {p['id']}
                ax0, ay0 = min(ax0, p['x0']), min(ay0, p['y0'])
                ax1, ay1 = max(ax1, p['x1']), max(ay1, p['y1'])
        frames.append(dict(ids=ids, x0=ax0, y0=ay0, x1=ax1, y1=ay1,
                           anchor_cx=a['cx'], anchor_cy=a['cy']))
    # 阅读顺序：先按行(y)聚类，再按列(x)
    ys = sorted(f['anchor_cy'] for f in frames)
    # 行分界：最大 y 间隙
    row_split = None
    gaps = [(ys[i+1]-ys[i], (ys[i+1]+ys[i])/2) for i in range(len(ys)-1)]
    if gaps:
        row_split = max(gaps)[1]
    def key(f):
        row = 0 if (row_split is None or f['anchor_cy'] < row_split) else 1
        return (row, f['anchor_cx'])
    frames.sort(key=key)
    return lbl, frames

def crop_frame(rgb, lbl, frame, pad=6):
    mask = np.isin(lbl, list(frame['ids']))
    x0,y0,x1,y1 = frame['x0'],frame['y0'],frame['x1'],frame['y1']
    x0,y0 = max(0,x0-pad), max(0,y0-pad)
    x1,y1 = min(rgb.shape[1],x1+pad), min(rgb.shape[0],y1+pad)
    sub_rgb = rgb[y0:y1, x0:x1]
    sub_a = (mask[y0:y1, x0:x1] * 255).astype('uint8')
    rgba = np.dstack([sub_rgb, sub_a])
    return Image.fromarray(rgba, 'RGBA')

def pack(frames_img, names, out_png, out_json, align='bottom'):
    cw = max(im.width for im in frames_img)
    ch = max(im.height for im in frames_img)
    cw += cw % 2; ch += ch % 2
    sheet = Image.new('RGBA', (cw*len(frames_img), ch), (0,0,0,0))
    meta = dict(frameWidth=cw, frameHeight=ch, frames={})
    for i,(im,nm) in enumerate(zip(frames_img, names)):
        x = i*cw + (cw-im.width)//2          # 水平居中
        y = ch - im.height if align=='bottom' else (ch-im.height)//2  # 脚底对齐
        sheet.paste(im, (x,y), im)
        meta['frames'][nm] = i
    sheet.save(out_png)
    json.dump(meta, open(out_json,'w'), ensure_ascii=False, indent=2)
    return cw, ch

JOBS = {
  'player': dict(src='graphics/牛马原型.png',
     names=['idle','run1','run2','run3','run4','run5','portal_shoot','ink_cast','jump']),
  'boss': dict(src='graphics/老板(巡逻者).png',
     names=['idle_right','walk_right1','walk_right2','walk_right3','walk_right4','walk_right5','alert',
            'idle_left','walk_left1','walk_left2','walk_left3','walk_left4','walk_left5']),
}

def main():
    for tag, job in JOBS.items():
        rgb, fg = bg_removed_rgba(job['src'])
        lbl, frames = find_frames(fg)
        print(f"{tag}: 期望 {len(job['names'])} 帧, 检测到 {len(frames)} 帧")
        if len(frames) != len(job['names']):
            print(f"  ⚠ 帧数不符! bboxes:")
            for f in frames: print(f"   x[{f['x0']}-{f['x1']}] y[{f['y0']}-{f['y1']}]")
        imgs = [crop_frame(rgb, lbl, f) for f in frames]
        cw,ch = pack(imgs, job['names'][:len(imgs)],
                     f'graphics/sprites/{tag}.png', f'graphics/sprites/{tag}.json')
        print(f"  → graphics/sprites/{tag}.png  cell={cw}x{ch}  帧数={len(imgs)}")
        # 调试接触表(棋盘格底)
        cols=min(7,len(imgs)); rows=(len(imgs)+cols-1)//cols
        contact=Image.new('RGB',(cw*cols,ch*rows),(40,40,46))
        for i in range(0,cw*cols,16):
            for j in range(0,ch*rows,16):
                if (i//16+j//16)%2: 
                    for xx in range(i,min(i+16,cw*cols)):
                        for yy in range(j,min(j+16,ch*rows)): contact.putpixel((xx,yy),(60,60,68))
        for i,im in enumerate(imgs):
            contact.paste(im,((i%cols)*cw,(i//cols)*ch),im)
        contact.save(f'/tmp/contact_{tag}.png')
    print("done")

if __name__=='__main__':
    main()
