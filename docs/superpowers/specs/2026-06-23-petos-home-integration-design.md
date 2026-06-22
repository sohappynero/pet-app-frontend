# PetOS 首页接入设计 — Sub-A.1

**日期**：2026-06-23
**主题**：PetOS 视觉系统接管真实首页 + 上线毛玻璃 4 Tab Bar
**前置**：[2026-06-22 首页重设计 spec](./2026-06-22-home-redesign-design.md) 已落地 token + home-mock + 通用 UI 组件；本期接续，把视觉真正接到默认路由。

---

## 1. 背景

当前状态：

- `/app` 默认页是 `Dashboard`（添加宠物 4 步表单）。已登录有宠物的用户进去仍然看到"被要求添加宠物"的表单或空 Shell。
- `AppShell.tsx` 维护着一套 **5 列旧 Tab Bar**（首页 / 健康记录 / 会员专区 / 提醒 / 我的），"首页" Tab 实际指向 `/app/pets`（宠物列表），不是 `/app`。
- 已经完成的 PetOS 视觉演示页 `HomePetOS.tsx` 挂在 `/app/petos`，硬编码"奶昔/100%/8.2kg/35min"，没有人访问。
- `lib/home.mock.ts` 已经实现 `getDailyDigest / getCheckInStatus / postCheckIn / getDailyTip`，但**没有任何页面 import 它**。

本期目标：让 PetOS 接管 `/app` 默认页 + 上线 PetOS 4 Tab Bar，让用户登录后第一屏就是 PetOS 视觉，而不是表单。

## 2. 范围

### 在本期

1. `/app` 默认页从 `Dashboard` 切到 `HomePetOS`
2. `HomePetOS` 接 `home.mock.ts` 数据 + 当前登录用户的 `selectedPet`，替代硬编码
3. 处理"无宠物"零数据态：PetOS 风格欢迎屏 + 暖橙 CTA"添加我的第一个宠物" → 跳 `/app/pets/add`
4. 多宠物切换条：Hero 卡上方水平滚动小头像，多于 1 只才显示
5. `AppShell` 旧 5 列 Tab Bar 下线，换成 PetOS `GlassTabBar`
6. 新建占位页 `Insights.tsx` / `Timeline.tsx`：PetOS 视觉空壳 + "敬请期待" 文案
7. 旧 `Dashboard` 路由从 `/app` 移到 `/app/pets/add`，**内部不重写**
8. 清理路由：删除 `/app/petos`（视觉演示作废）、`/app/ai-analysis`、`token-refresh-test`、`test-new-features`

### 不在本期（明确排除）

- ❌ `Mine.tsx` 内部重写（仍是旧视觉，留给后续刀）
- ❌ 其他 26 个页面归属哪个 Tab 的实际路由迁移（这是 Sub-A.2）
- ❌ `Dashboard` 4 步表单重做（这是 Sub-A.3）
- ❌ 健康分真实计算逻辑（后端没接口，本期硬编码 100）
- ❌ 拍照打卡 / 一拍一选完整交互（CTA 只是按钮，点击行为留给后续刀）
- ❌ 后端 API 改动
- ❌ 296KB `index.css` 清理
- ❌ 暗色模式、主题色切换

### 关系网

```
2026-06-22 首页重设计 spec        ← 已完成 token + home-mock + UI 组件
2026-06-23 PetOS 视觉系统          ← 已完成 tokens 增补 + petos.css + 3 组件 + HomePetOS 演示页
└─ Sub-A.1 PetOS 首页接入（本 spec） ← 本期
   ├─ Sub-A.2 现有页面归属 Tab 整理 ← 后续
   └─ Sub-A.3 添加宠物 4 步表单重做 ← 后续
```

## 3. 设计

### 3.1 路由表

```
/app                  → HomePetOS（接管，替代 Dashboard）
/app/insights         → Insights（新增，PetOS 占位）
/app/timeline         → Timeline（新增，PetOS 占位）
/app/mine             → Mine（不动，旧视觉）
/app/pets/add         → Dashboard（从 /app 移过来，内部不动）

/app/petos            → 删除（视觉演示作废）
/app/ai-analysis      → 删除（功能由 Insights 替代）
/token-refresh-test   → 删除（开发页）
/test-new-features    → 删除（开发页）

其他 26 个页面路由不动。
```

### 3.2 AppShell 改动

| 现状 | 改成 |
|---|---|
| 5 列 Tab Bar，lucide-react 图标 + 凸起会员按钮 | 4 Tab `GlassTabBar`，毛玻璃岛屿，emoji 图标 |
| 首页 Tab → `/app/pets` | 首页 Tab → `/app` |
| "无宠物 + 在 `/app`" 走 onboarding 模式（隐藏 Tab Bar） | 删除 `isOnboardingMode` 的旧触发条件；零数据态由 `HomePetOS` 自己渲染，Tab Bar 一直显示。**保留 `.onboarding-mode` wrap 的全屏样式机制**，但触发条件改为 `path === "/app/pets/add"`，让旧 4 步表单仍走全屏 |
| `hideTabBar` 白名单（`/app/feedback` `/app/help` `/app/add-record` `/app/record/`） | 保留，并补 `/app/pets/add`（旧 Dashboard 新路径） |

`ShellContext` 接口（pets、selectedPetId、selectedPet、refreshPets、setPetId）保持不变，HomePetOS 通过 `useShell()` 直接消费。

### 3.3 HomePetOS 数据接入

**数据源**

| 字段 | 来源 |
|---|---|
| 宠物名 | `selectedPet.name` |
| AI 气泡话术 | `getDailyDigest(selectedPet).speaks` |
| AI 气泡时间戳 | `digest.generatedAt`，渲染成"刚刚 / 几分钟前"相对时间 |
| 健康分 | 本期硬编码 `100`，留 prop 入口给后续刀 |
| 状态文字 | 健康分硬编码所以也硬编码 `"状态正常"` |
| 7 日体重 | `selectedPet.weight_kg`（不为 null 时显示，为 null 时显示 `--`） |
| 今日运动 | 本期硬编码 `35min / 达成 ✓`，留 prop 入口 |
| 打卡 CTA 文案 | `getCheckInStatus(selectedPet.id)` 决定：未打卡显示"📸 给我留个影"，已有照片显示"今日已记录"+ 缩略图小角标 |

**加载策略**

- `useEffect` on `selectedPet?.id`：调 `getDailyDigest` + `getCheckInStatus`，存入 component state
- 加载中：Hero 数字显示 `--`、气泡文字 skeleton（不闪烁）
- 失败：mock 层不会抛错（内部 try-catch 兜底），不需要错误态
- 切换宠物：重新触发 effect

**问候语逻辑**

- `早安 ☀️` (5-12)、`午安 🌤️` (12-18)、`晚安 🌙` (18-5)
- 用 `user.nickname` 替代硬编码 "nero"

### 3.4 多宠物切换条 `PetSwitcher`

**位置**：Hero 卡上方，问候语下方

**显隐**：`pets.length > 1` 才渲染

**结构**：
- 横向滚动容器，左右贴边内边距 14px
- 每只宠物一个圆形头像 48×48（如果 `pet.avatar` 有用图片，否则用 emoji fallback）
- 当前选中：4px 暖橙描边 + 名字加粗
- 未选中：纯灰边 + 名字次级色
- 点击 → 调 `setPetId(pet.id)`

**Props**

```ts
interface PetSwitcherProps {
  pets: Pet[];
  selectedPetId: number | null;
  onSelect: (id: number) => void;
}
```

不依赖 router，可独立测。

### 3.5 零数据态 `HomeEmpty`

**触发条件**：`pets.length === 0`

**渲染**（在 HomePetOS 内部分支，不独立文件）：
- 顶部 GlassNav 照常显示（PetOS 品牌）
- 中央：奶白底 + 一段欢迎文案 + 暖橙大按钮"添加我的第一个宠物"
- 按钮点击 → `navigate("/app/pets/add")`
- 不显示 Hero / AI 气泡 / Mini Stats（这些都需要宠物数据）
- 底部 GlassTabBar 显示，4 Tab 可切换（点 Insights / Timeline 看到对应占位页）

**文案草稿**
```
🐾
还没添加宠物
带它来认识 PetOS 吧～

[添加我的第一个宠物 →]
```

### 3.6 占位页 Insights / Timeline

两页结构一致：

```tsx
<div className="petos-page">
  <div className="petos-content">
    <GlassNav />
    <div className="petos-greet">
      <div className="petos-greet__name">洞察</div>  {/* 或 "成长" */}
    </div>
    <div className="petos-empty-state">
      💡 / 📖
      <h2>AI 健康洞察</h2>
      <p>正在筹备中，敬请期待</p>
    </div>
  </div>
  <GlassTabBar activeKey="insights" onChange={... } />
</div>
```

`GlassTabBar.onChange` 通过 `useNavigate` 路由跳转，4 Tab 切换通过 URL 完成，不靠 state（保证刷新页面 / 后退仍然对）。

新增 css 类 `.petos-empty-state`：居中、灰图标、副标题克制、不抢戏。

### 3.7 GlassTabBar 接路由

当前 `GlassTabBar` 是 controlled 组件（受控 activeKey + onChange）。本期升级为：

- 仍然 controlled，**但**在 AppShell 里包一层 `<RouterGlassTabBar />` 适配器，把 URL pathname 映射成 `activeKey`，把 `onChange` 桥接到 `navigate(...)`
- 4 Tab 的路由映射写死在适配器里：

```ts
const TAB_TO_PATH = {
  home: "/app",
  insights: "/app/insights",
  timeline: "/app/timeline",
  mine: "/app/mine",
};

function pathToTabKey(pathname: string): string | null {
  if (pathname === "/app" || pathname === "/app/") return "home";
  if (pathname.startsWith("/app/insights")) return "insights";
  if (pathname.startsWith("/app/timeline")) return "timeline";
  if (pathname.startsWith("/app/mine")) return "mine";
  return null;  // 当前页不属于任何 Tab，4 Tab 都不高亮
}
```

`GlassTabBar` 本身不依赖 router，保持可测；适配器（在 AppShell 内或新建 `RouterGlassTabBar.tsx`）负责胶水。

### 3.8 隐藏 Tab Bar 的页面

继续走 AppShell 现有的 `hideTabBar` 白名单（避免 record 详情 / 添加记录这种全屏页底部被遮挡），白名单内追加 `/app/pets/add`（旧 Dashboard 4 步表单页，全屏 onboarding）。

## 4. 文件改动清单

### 新建

```
src/pages/Insights.tsx                  # PetOS 占位页
src/pages/Timeline.tsx                  # PetOS 占位页
src/components/petos/PetSwitcher.tsx    # 多宠物切换条
src/components/petos/RouterGlassTabBar.tsx  # 路由适配器（也可内联在 AppShell）
```

### 修改

```
src/App.tsx
  - 路由表更新（/app 接 HomePetOS、新增 insights/timeline、Dashboard 移到 /app/pets/add、删除废弃路由）

src/components/AppShell.tsx
  - 移除 isOnboardingMode 分支
  - 移除旧 5 列 Tab Bar
  - 装入 RouterGlassTabBar
  - hideTabBar 白名单追加 /app/pets/add

src/pages/HomePetOS.tsx
  - 接 useShell() 拿 pets + selectedPet
  - 接 home.mock.ts 拿 digest + checkin
  - 时段问候逻辑
  - pets.length === 0 时渲染 HomeEmpty 分支
  - pets.length > 1 时在 Hero 上方渲染 PetSwitcher

src/styles/petos.css
  - 新增 .petos-pet-switcher 横滚条样式
  - 新增 .petos-empty-state 空状态样式
```

### 不动

- `src/styles/tokens.css`（已经够用）
- `src/components/petos/GlassNav.tsx` / `HeroCard.tsx` / `GlassTabBar.tsx`（接口已足够）
- `src/lib/home.mock.ts`（已就绪）
- `src/components/ui/Card.tsx` / `SpeechBubble.tsx`（已就绪）
- 现有 26 个页面（路由位置不动）
- `src/index.css`

### 删除

- `src/pages/AiAnalysis.tsx` 路由项（页面文件留着，等 Sub-A.2 决定是否物理删除）
- `TestNewFeatures` / `TokenRefreshTest` 路由项

## 5. 验收

实施完成后用户在浏览器里能确认：

1. 登录后落地 `/app`，**看到的是 PetOS 视觉首页**（毛玻璃 Nav、Hero 大头像浮动、CTA 暖橙、底部 Tab Bar 岛屿），不再是添加宠物表单
2. 已登录无宠物用户落地 `/app`，**看到 PetOS 零数据态**（暖橙 CTA"添加我的第一个宠物"），点击跳到 `/app/pets/add` 走旧 4 步表单
3. 多宠主用户进 `/app`，Hero 上方有一行水平滚动的宠物头像，点击切换会刷新 Hero 数字 + 气泡话术
4. 底部 4 Tab 切换工作：首页 / 洞察 / 成长 / 我的都能跳到对应路径
5. 洞察 / 成长 Tab 显示 PetOS 风格的"敬请期待"占位页
6. 我的 Tab 仍然显示现有 Mine.tsx 内容（视觉旧但能用）
7. 单宠主 / 默认情况下不显示宠物切换条
8. Hero 气泡话术随宠物 / 打卡状态变化（拍了照、选了 3 气泡后调用 `postCheckIn` 不在本期，但**预留** `digest.speaks` 已经能反映当前 mock 层状态）
9. 旧 `/app/petos` / `/app/ai-analysis` / `/token-refresh-test` / `/test-new-features` 访问 404 或重定向

## 6. 测试

本期不要求严格 TDD，但下列最低验证必须做：

- `npm run build`：tsc 干净，0 类型错误
- 浏览器实跑 `npm run dev`：
  - 有宠物用户：进 `/app` 看到 PetOS 首页 + Tab Bar
  - 无宠物用户：进 `/app` 看到零数据态 → 点击进 `/app/pets/add` → 表单仍可工作 → 添加成功后回到 `/app` 看到正常首页
  - 切 Tab：4 个都能跳，URL 同步变化，刷新页面后 Tab 高亮态正确
- 多宠物：用至少 2 只宠物的账号验证切换条出现 + 点击切换

不在本期写新 Playwright 测试（6/22 已经为 token / Card / SpeechBubble 写了视觉基线；新增的 PetSwitcher / HeroCard / GlassTabBar / Insights / Timeline 这次先不补基线，等 Sub-A.4 一拍一选交互完整后一起补）。

## 7. 风险

- **风险 1：旧 `Dashboard` 在 `/app/pets/add` 路径下样式可能错位**（旧 Dashboard 依赖 `onboarding-mode` 的全屏 wrap）。
  - 缓解：见 3.2，`.onboarding-mode` wrap 的全屏样式机制保留，仅把触发条件从"无宠物 + `/app`"改为"`path === "/app/pets/add"`"。同时 `hideTabBar` 白名单加 `/app/pets/add`，确保 4 步表单仍走全屏布局。
- **风险 2：旧 5 Tab 里"会员专区"和"健康记录"按钮入口消失**，用户在 Sub-A.2 完成前可能找不到这些功能。
  - 缓解：本期是过渡态。Mine Tab 仍能进，里面有"我的宠物 / 提醒"等次级入口；其余功能短期通过 URL 直访仍可用。Sub-A.2 负责把所有入口归位。
- **风险 3：`Pets.tsx`（宠物列表）原本通过旧 Tab Bar "首页" 入口访问，现在没了入口**。
  - 缓解：用户进入 `/app/pets/add` 走的是 onboarding 表单，宠物列表 `/app/pets` 短期通过"我的 → 我的宠物"入口（如果 Mine 已经有此入口）或临时不暴露；正式入口归位由 Sub-A.2 处理。

## 8. 后续刀法（明确不在本期）

- **Sub-A.2**：把现有 26 个页面按 4 Tab IA 重新归属（成长 = 记录类、洞察 = AI 分析类、我的 = 设置类）。包括路径变更 + 二级页归属。
- **Sub-A.3**：`Dashboard` 4 步添加宠物表单重做成 PetOS 视觉。
- **Sub-A.4**：拍照打卡 + 一拍一选完整交互（接 `home.mock.ts` 的 `postCheckIn`）。
- **Sub-A.5**：健康分真实计算后端接口接入。
- **Sub-A.6**：`Mine.tsx` 内部 PetOS 化重写。
