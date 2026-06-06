# 牛马回家 — 美术换皮 + 关卡打磨 设计文档

> 版本：2026-06-06
> 范围：把闲置的手绘资源接进游戏、全局统一「阴雨夜打工人」基调、修复已知崩溃、按需打磨关卡设计。
> 前置决定（已与用户确认）：① 全面换皮到阴雨夜；② 角色帧动画全上；③ KPI 等掉落物全关卡通用；④ 不加检查点、整体难度略升。

---

## 1. 背景与现状问题

游戏机制完整可玩（墨水画桥/挡视线、双色传送门、老板视线潜行），但「皮」严重落后于已交付的美术：

1. **美术精神分裂**：标题页/结算页/`背景.jpg` 是阴雨夜压抑基调；但 Tutorial/Level1 关卡是阳光蓝天绿草地，连关卡之间都不统一（L2/L3 已是暗色 KPI 雨）。
2. **角色是代码简笔**：`sprites.js` 用 `fillRect/fillEllipse` 画 player 和 "cowboy"，与手绘 sprite 无关；且守卫设定是"牛仔"，而交付美术是"光头西装胖老板"。
3. **资源闲置**：`牛马原型.png`(9帧)、`老板(巡逻者).png`(13帧)、`场景内可用道具.png`、`老板说的话.png`(对话气泡) 全未使用。
4. **运行时崩溃**：`DebugPortalLevelScene._buildBackground()` 调用 `addRainCityBackdrop()`，该函数**全项目未定义** → **Level2/Level3 一进入即 `ReferenceError` 崩溃**。`tests/ui-art.test.js` 与代码已不一致（测试要求不要调它，代码还在调）。
5. **结算页是空头支票**：`结算页面.png` 展示"回家用时/眼泪剩余/传送次数/评级"，但 `addSettlementWinScreen` 只贴静态图，这些数字从未被统计或渲染。
6. **关卡设计**：新机制无教学铺垫（视线、掉落、传送带都"不教就考"）；Level1 中段 800–2148px 纯跑路空走廊；Level1 终点"墨水挡视线"教学与"传送门跳过"解法自相矛盾；传送带体感怪（速度被强行覆盖，无法逆走）；Tutorial/Level1 无 R 重开键、墨水画废可能软锁。

> 注：`docs/art-design-spec.md` 为旧规范（牛仔守卫、阳光草地、`assets/` 目录），已被后续交付的雨夜手绘资源取代。本文档在美术方向上以**已交付的 `graphics/` 资源**为准。

---

## 2. 范围

### In（本次要做）
- 资源管线：离线抠图脚本，从参考图切出透明 sprite/道具 PNG。
- 资源层重写：`sprites.js` → 加载真图 + 注册帧动画。
- 玩家帧动画状态机（idle/run/jump/ink-cast/portal-shoot）。
- 老板换皮：胖老板 sprite + 走路/警觉动画 + 被发现弹对话气泡。
- 雨夜背景：补 `addRainCityBackdrop()`（修复 L2/L3 崩溃），用 `背景.jpg` 视差。
- Tutorial/Level1 重新换皮到雨夜城市；`💩` → 井盖/坑洞道具图。
- KPI 掉落抽成 `WorkloadSystem`，全关卡通用；Level1 中段加 KPI gauntlet；Tutorial 加掉落教学。
- 结算页真统计（用时/墨水剩余%/传送次数/评级）。
- 传送带体感重做（叠加漂移而非覆盖速度）。
- 每个新机制首次出现加教学铺垫。
- Level1 终点修复（让墨水挡视线成为真解法）。
- 整体难度略升。
- 一致性修复：全关卡 R 重开、防软锁、移除重叠平台。
- `tests/ui-art.test.js` 与最终代码同步。

### Out（明确不做 — YAGNI）
- 不改墨水/传送门/视线**核心机制**逻辑（只换皮 + 调参数）。
- 不加检查点（用户选择保留"死亡重开"并提升难度）。
- 不动标题页/结算页底图（已在用图）。
- 不引入新机制（天花板传送门、定时墙、钥匙门等 `mechanics.md` 待定项不在本次）。
- 不引入构建工具/打包器，保持全局脚本结构。

---

## 3. 架构

无打包器，`index.html` 按依赖顺序加载全局脚本。按职责分层：

```
[资源层]  assets.js（替代 sprites.js）
    preloadGameAssets(scene)   加载 spritesheet / 背景 / 道具图（幂等）
    createAnimations(scene)    一次性注册所有帧动画（幂等）
    keepProceduralFallback     抠图失败时回退到现有 procedural 纹理（降级不崩）

[系统层]  scene 作用域的纯类，互不耦合，通过 scene 通信
    InkSystem        墨水（眼泪）         — 不变
    PortalSystem     传送门              — 不变（仅尊重 view-limit 不变量）
    GuardSystem      老板巡逻+视线+气泡   — 换皮：sprite/动画/对话气泡
    WorkloadSystem   KPI/OKR/DDL 掉落     — 新增：从 DebugPortalLevelScene 抽出
    PlayerAnim       玩家动画状态机       — 新增

[场景层]  数据驱动
    TitleScene / TutorialScene / Level1Scene
    DebugPortalLevelScene → Level2/Level3（只传 cfg）
    关卡用 cfg 声明：platforms / guards / drops / portalHints / teach
    Tutorial、Level1 也改为携带 drops 配置（接 WorkloadSystem）

[UI 层]  uiArt.js
    标题 / 结算（含真统计渲染）/ 雨夜背景 helper / HUD / 教学提示 / 对话气泡
```

**三条原则**：
1. **数据驱动关卡** — 给任意关卡加 KPI 掉落 = 加一行 `drops` 配置。
2. **资源离线处理** — 抠图/打包在 Python 脚本里离线完成，产物 PNG 提交进 `graphics/sprites/`，运行时只加载。
3. **系统各管一摊** — `WorkloadSystem` 只管掉落，`PlayerAnim` 只管动画切换。

---

## 4. 资源管线（核心难点）

参考图带编号 badge、文字标注、米黄纸背景，不能直接用。

**脚本** `tools/extract_sprites.py`（用 `.venv` 的 PIL，放项目内）：

1. **切帧**：按行列网格从 `牛马原型.png`(1485×1059, 6+3 布局) 切 9 帧、`老板(巡逻者).png`(1672×941, 7+6 布局) 切 13 帧；从 `场景内可用道具.png` 切所需道具（井盖、坑洞、裂缝、KPI 纸等）。
2. **去背景**：**四角/四边 flood-fill** 将米黄纸背景填透明。角色有完整深色描边，从角落往内填不会吃到角色内部白色高光（比"按颜色阈值抠"更安全）。
3. **清理**：裁掉编号 badge 与底部文字标注，只留角色。
4. **对齐**：以**脚底中点为锚点**统一各帧画布尺寸，保证逐帧动画不抖。
5. **打包**：输出等距 spritesheet（固定 cell 尺寸）到 `graphics/sprites/`，便于 Phaser `load.spritesheet`。
6. **命名**：全英文小写下划线，如 `player.png` / `boss.png` / `props/manhole.png`。

**验收闸**：脚本产物先**肉眼验收抠图质量**（透明边缘干净、无背景残留、无吃掉角色像素），通过后才接代码。失败则迭代脚本参数；多次失败的降级方案见 §10 风险。

帧映射（player.png）：`idle, run1..run5, portal_shoot, ink_cast, jump`。
帧映射（boss.png）：`idle_right, walk_right1..5, idle_left, walk_left1..5, alert`。

---

## 5. 详细设计

### 5.1 资源层 `assets.js`
- `preloadGameAssets(scene)`：`scene.load.spritesheet('player', ...)`、`'boss'`、背景图、道具图、对话气泡图；幂等（已存在则跳过）。
- `createAnimations(scene)`：注册 `player_idle/run/jump/ink/portal`、`boss_walk/alert`；幂等（`scene.anims.exists` 守卫）。
- 保留现有 procedural `house/portalBlue/portalOrange/grass/brick/spike` 作为后备纹理；player/boss 优先用真图，加载失败回退 procedural（不崩）。
- 删除/弃用 `_playerTex`、`_cowboyTex`（被真图取代）。

### 5.2 玩家动画状态机 `PlayerAnim`
- 输入：scene 的玩家速度、`onGround`、InkSystem.drawing、PortalSystem 刚射击事件。
- 状态优先级：`portal_shoot`(瞬时) > `ink_cast`(drawing 中) > `jump`(离地) > `run`(有水平速度) > `idle`。
- 输出：`player.play(key, true)`；左右用 `setFlipX`。
- 瞬时动作（射门/吐墨）播完回到基础状态。

### 5.3 `GuardSystem` 换皮
- `'cowboy'` 纹理 → `'boss'` spritesheet。
- 巡逻移动时播 `boss_walk`，按 `facing` 翻转；静止播 `idle`。
- **发现玩家瞬间**：切 `alert` 帧 + 在老板头顶弹对话气泡（`老板说的话` 资源，文案随机：加班吗 / 晚点走 / 到哪了），短暂停顿再触发 `_resetLevel`，给玩家"被抓"的反馈帧。
- 视线锥颜色/透明度在雨夜背景上重新校准对比度。

### 5.4 `WorkloadSystem`（从 `DebugPortalLevelScene` 抽出）
- 把 `_scheduleDrop / _warnDrop / _spawnDrop / _syncDrops / _checkWorkloadHits` 迁入新类 `WorkloadSystem(scene, dropsConfig)`。
- `DebugPortalLevelScene` 改为 `new WorkloadSystem(this, this.cfg.drops)`，行为不变（回归保证）。
- 掉落物文字 → 可选用 `场景内可用道具.png` 的 KPI 纸贴图（带文字回退）。
- Tutorial/Level1 通过传入 `drops` 配置即可获得掉落。

### 5.5 雨夜背景 `addRainCityBackdrop(scene)`（uiArt.js 新增，修复崩溃）
- 用 `背景.jpg`（深色雨城）做多层视差铺底，铺满 `LEVEL_WIDTH`。
- 叠加雨滴粒子（轻量、`setScrollFactor` 分层）。
- Tutorial/Level1 的 `_buildBackground` 改调此函数，删除阳光天空/雪山/草地/白云代码。
- 平台贴图从亮绿草地 → 暗色城市地块（与 L2/L3 `_addPlatform` 风格统一）。

### 5.6 结算页真统计
- 各关卡 `create` 记录 `startTime`；通关时计算：用时、墨水剩余 `inkSystem.getRatio()`、传送次数 `portalSystem.shotCount`。
- 评级规则（示例，可调）：综合用时 + 墨水剩余 + 传送次数 → "下班达人 / 准点下班 / 加班狗"。
- `addSettlementWinScreen(scene, { stats })`：在底图既定坐标叠加文字（用 `结算页面.png` 的版式位置）。

### 5.7 传送带体感重做
- 现状 bug：`_applyConveyorsToBody` 每帧 `setVelocity(x = c.speed)`，**覆盖**玩家输入 → 无法逆走、发涩。
- 改为**漂移叠加**：仅当玩家"踩在"带子上（在 x 区间内、脚底接近带面顶部、`onGround`）时，把 `c.speed` 作为漂移**加到** `_move` 计算出的目标速度上，而非覆盖；逆走时玩家速度可抵消漂移。
- 掉落物（workload）保持被带子推动的行为。

### 5.8 关卡设计改动
**教学铺垫**（每个新机制首次出现）：
- Tutorial：在现有 5 条提示后追加"小心头顶掉落"的 KPI 掉落练习（安全可躲）+"前方有老板，别进黄光"视线练习（一个静止、可轻松绕过的老板）。
- 关卡用 `teach` 配置声明触发点与文案（数据驱动，复用 Tutorial 的提示框组件）。

**Level1 中段 KPI gauntlet**：
- 800–2148px 空走廊加 3–4 个 `drops`（KPI/OKR/DDL，带预警线），把死亡走廊变成躲砸落的段落。掉落节奏可躲、不依赖运气。

**Level1 终点修复**（让墨水挡视线成为真解法，尊重 `mechanics.md` 不变量）：
- 调整终点几何：使"传送门跳过老板"不再是无脑捷径（例如目标落点被墙遮挡需先移步看台、或落点处于老板视锥内）；而**用墨水画在视锥上挡住视线**通过，成为最省墨、最直接的解法。
- 维持"墙高 ≈ 跳高+5px、跳顶点才能射过墙"与"传送门不能隔屏盲射"两条不变量。

**整体难度略升**：收紧各关 `inkMax`、加密/加快部分掉落、微调老板视锥范围与巡逻——以"略升"为度，逐关验证可通关。

### 5.9 一致性 / bug 修复
- Tutorial/Level1 加 `R 重开` 与 `Esc 返回标题`（对齐 Debug 关）。
- 防软锁：墨水不足以完成必需桥时给"墨不够，按 R 重来"提示；或保证 `inkMax` 对必经坑有冗余。
- 移除 Level1 重叠平台（`800–1184` 与 `1050–2106` 合并为不重叠段）。

### 5.10 测试同步
- 修 `tests/ui-art.test.js`：使断言与"`addRainCityBackdrop` 已定义并被调用、`Level1` 行为"与最终代码一致。
- 为 `WorkloadSystem`、`PlayerAnim`、结算统计、传送带漂移补静态/单元测试（沿用现有 `node --test` 文件读断言风格 + 可单测的纯函数）。
- 目标：`node --test` 全绿。

---

## 6. 必须保留的不变量（来自 `mechanics.md`）
1. 墙 `label:'wall'` 阻挡玩家/墨水/传送门射线；墙高 ≈ 跳高(65px)+5px，跳到顶点俯射才能越墙。
2. 传送门射击落点必须在相机视口内（含 60px 边距），否则红闪取消——不可隔屏盲射。
3. 墨水桥 `label:'ink'` 可作为传送门落点。
4. 改 Level1 终点几何时不得破坏上述关系。

---

## 7. 验收标准
- `node --test` 全部通过。
- 手动跑 Title → Tutorial → Level1 → Level2 → Level3：
  - 全程雨夜基调统一，无阳光草地残留。
  - player/boss 为手绘 sprite 且帧动画正常（跑/跳/画墨/射门、老板走路/警觉+气泡）。
  - Level2/Level3 不再崩溃。
  - KPI 等掉落在全关卡可见；Level1 中段 gauntlet 成立。
  - 结算页显示真实统计数字。
  - 传送带可逆走、不发涩。
  - 每关可 R 重开；无明显软锁。
- 截图留档对比换皮前后。

---

## 8. 实施阶段建议（交由 writing-plans 细化）
1. **资源管线**：抠图脚本 + 产物，肉眼验收（闸）。
2. **资源层 + 动画**：`assets.js` + `PlayerAnim`，player/boss 上真图。
3. **修崩溃 + 雨夜背景**：`addRainCityBackdrop`，L2/L3 恢复；同步测试。
4. **系统**：`WorkloadSystem` 抽取（回归 L2/L3）、`GuardSystem` 气泡、传送带漂移。
5. **换皮 Tutorial/Level1**：背景/平台/危险物，加 drops 与教学。
6. **关卡设计**：Level1 gauntlet + 终点修复 + 难度略升 + 一致性修复。
7. **结算统计**。
8. **测试补齐 + 全量手动验收**。

---

## 9. 风险
- **抠图质量**：flood-fill 可能在背景与角色描边接触处残留或啃边。缓解：脚本可调容差 + 逐帧人工验收；降级方案：单帧静态 sprite（弃逐帧）仍优于现状 procedural。
- **帧对齐抖动**：以脚底锚点统一画布缓解。
- **难度调参**：每关需实际验证可通关，避免"略升"变"劝退"（尤其无检查点）。
- **抽取回归**：`WorkloadSystem` 抽取后 L2/L3 行为须与现状逐项对齐。
