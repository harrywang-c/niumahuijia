#!/usr/bin/env python3
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import math
import random

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parent
INPUT_DIR = ROOT / "generated"
OUTPUT_DIR = ROOT / "generated_with_text"
FONT_CANDIDATES = [
    "/System/Library/Fonts/STHeiti Medium.ttc",
    "/System/Library/Fonts/Hiragino Sans GB.ttc",
    "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
]


@dataclass(frozen=True)
class TextBlock:
    page: int
    box: tuple[float, float, float, float]
    text: str
    size: int
    fill: tuple[int, int, int] = (12, 10, 8)
    stroke: tuple[int, int, int] | None = None
    align: str = "center"
    anchor: str = "center"
    box_style: str | None = None
    rotate: float = 0
    vertical: bool = False


BLOCKS = [
    TextBlock(1, (0.06, 0.07, 0.31, 0.20), "这是一个\n普通的周五……", 50, align="left"),
    TextBlock(1, (0.10, 0.25, 0.27, 0.31), "SKETCH DAILY LIFE 2026", 22),
    TextBlock(1, (0.43, 0.09, 0.59, 0.18), "19:00", 76, stroke=(244, 229, 190)),
    TextBlock(1, (0.70, 0.08, 0.91, 0.20), "下班！！！", 74, stroke=(244, 229, 190)),
    TextBlock(1, (0.69, 0.22, 0.83, 0.28), "已连续工作11小时", 28, box_style="caption"),
    TextBlock(2, (0.06, 0.10, 0.24, 0.24), "回家\n只需要\n走出这扇门——", 38, box_style="caption", align="left"),
    TextBlock(2, (0.43, 0.11, 0.61, 0.19), "老板：晚点走～", 34, rotate=-10),
    TextBlock(2, (0.60, 0.22, 0.76, 0.30), "今晚全员加班！", 30, rotate=7),
    TextBlock(2, (0.37, 0.33, 0.49, 0.40), "[群消息] 99+", 29, rotate=-5),
    TextBlock(2, (0.55, 0.42, 0.69, 0.49), "19:30 会议", 31, rotate=5),
    TextBlock(2, (0.50, 0.05, 0.66, 0.10), "叮叮叮——！", 36, stroke=(244, 229, 190), rotate=-5),
    TextBlock(2, (0.74, 0.52, 0.94, 0.63), "小明，今晚的需求……", 34, box_style="bubble"),
    TextBlock(2, (0.69, 0.69, 0.82, 0.77), "不要说出来", 32, box_style="caption"),
    TextBlock(3, (0.06, 0.05, 0.29, 0.15), "这条路\n怎么走都走不出去……", 38, align="left"),
    TextBlock(3, (0.66, 0.06, 0.91, 0.14), "滴——", 54, stroke=(244, 229, 190), align="left"),
    TextBlock(3, (0.66, 0.84, 0.95, 0.94), "泪水，是有分量的", 38),
    TextBlock(4, (0.10, 0.07, 0.26, 0.15), "墨迹连成了路\n泪水开了门", 34, box_style="bubble"),
    TextBlock(4, (0.37, 0.08, 0.63, 0.16), "画线 → 引导泪水 → 穿越传送门 → 回家", 34, box_style="caption"),
    TextBlock(4, (0.72, 0.08, 0.92, 0.16), "回家的路\n要靠自己铺。", 34, box_style="caption"),
    TextBlock(4, (0.22, 0.80, 0.78, 0.91), "【开始回家】", 84, stroke=(244, 229, 190)),
]


def font_path() -> str:
    for candidate in FONT_CANDIDATES:
        if Path(candidate).exists():
            return candidate
    raise FileNotFoundError("No usable Chinese font found.")


def load_font(size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(font_path(), size=size)


def wrap_text(text: str, font: ImageFont.FreeTypeFont, max_width: int) -> list[str]:
    lines: list[str] = []
    for raw_line in text.splitlines():
        if not raw_line:
            lines.append("")
            continue
        line = ""
        for char in raw_line:
            trial = line + char
            width = font.getbbox(trial)[2]
            if width <= max_width or not line:
                line = trial
            else:
                lines.append(line)
                line = char
        lines.append(line)
    return lines


def draw_panel_text(draw: ImageDraw.ImageDraw, block: TextBlock, width: int, height: int) -> None:
    x1, y1, x2, y2 = [int(v) for v in (
        block.box[0] * width,
        block.box[1] * height,
        block.box[2] * width,
        block.box[3] * height,
    )]
    pad = max(10, int(height * 0.014))

    if block.box_style:
        radius = max(10, int(height * 0.025))
        if block.box_style == "bubble":
            draw.rounded_rectangle((x1, y1, x2, y2), radius=radius, fill=(239, 221, 181), outline=(8, 8, 8), width=5)
        else:
            draw.rounded_rectangle((x1, y1, x2, y2), radius=radius // 2, fill=(236, 216, 174), outline=(8, 8, 8), width=4)

    font_size = block.size
    while font_size >= 16:
        font = load_font(font_size)
        lines = wrap_text(block.text, font, max(1, x2 - x1 - pad * 2))
        line_heights = [font.getbbox(line or "字")[3] - font.getbbox(line or "字")[1] for line in lines]
        text_height = int(sum(line_heights) + (len(lines) - 1) * font_size * 0.22)
        if text_height <= y2 - y1 - pad * 2:
            break
        font_size -= 2
    else:
        font = load_font(16)
        lines = wrap_text(block.text, font, max(1, x2 - x1 - pad * 2))
        line_heights = [font.getbbox(line or "字")[3] - font.getbbox(line or "字")[1] for line in lines]
        text_height = int(sum(line_heights) + (len(lines) - 1) * 16 * 0.22)

    if block.anchor == "top":
        y = y1 + pad
    else:
        y = y1 + max(pad, (y2 - y1 - text_height) // 2)

    line_gap = int(font_size * 0.22)
    for line, line_height in zip(lines, line_heights):
        bbox = font.getbbox(line)
        text_width = bbox[2] - bbox[0]
        if block.align == "left":
            x = x1 + pad
        elif block.align == "right":
            x = x2 - pad - text_width
        else:
            x = x1 + (x2 - x1 - text_width) // 2
        stroke_width = max(0, int(font_size * 0.08)) if block.stroke else 0
        draw.text(
            (x, y),
            line,
            font=font,
            fill=block.fill,
            stroke_width=stroke_width,
            stroke_fill=block.stroke or block.fill,
        )
        y += line_height + line_gap


def render_rotated_text(base: Image.Image, block: TextBlock, width: int, height: int) -> None:
    x1, y1, x2, y2 = [int(v) for v in (
        block.box[0] * width,
        block.box[1] * height,
        block.box[2] * width,
        block.box[3] * height,
    )]
    temp = Image.new("RGBA", (x2 - x1, y2 - y1), (0, 0, 0, 0))
    draw = ImageDraw.Draw(temp)
    local = TextBlock(
        block.page,
        (0, 0, 1, 1),
        block.text,
        block.size,
        block.fill,
        block.stroke,
        block.align,
        block.anchor,
        block.box_style,
    )
    draw_panel_text(draw, local, temp.width, temp.height)
    rotated = temp.rotate(block.rotate, expand=True, resample=Image.Resampling.BICUBIC)
    px = x1 - (rotated.width - temp.width) // 2
    py = y1 - (rotated.height - temp.height) // 2
    base.alpha_composite(rotated, (px, py))


def draw_handmade_marks(draw: ImageDraw.ImageDraw, width: int, height: int) -> None:
    random.seed(20260606 + width + height)
    for _ in range(36):
        x = random.randint(0, width)
        y = random.randint(0, height)
        length = random.randint(8, 22)
        angle = random.uniform(-0.8, 0.8)
        x2 = int(x + math.cos(angle) * length)
        y2 = int(y + math.sin(angle) * length)
        draw.line((x, y, x2, y2), fill=(15, 13, 10, 40), width=1)


def render_page(page: int) -> Path:
    src = INPUT_DIR / f"opening_comic_page_{page:02d}.png"
    image = Image.open(src).convert("RGBA")
    draw = ImageDraw.Draw(image)
    width, height = image.size
    draw_handmade_marks(draw, width, height)
    for block in [item for item in BLOCKS if item.page == page]:
        if block.rotate:
            render_rotated_text(image, block, width, height)
        else:
            draw_panel_text(draw, block, width, height)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    out = OUTPUT_DIR / f"opening_comic_page_{page:02d}_with_text.png"
    image.convert("RGB").save(out, "PNG")
    return out


def main() -> None:
    for page in range(1, 5):
        print(render_page(page))


if __name__ == "__main__":
    main()
