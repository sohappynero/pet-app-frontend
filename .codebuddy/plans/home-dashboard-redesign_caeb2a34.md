---
name: home-dashboard-redesign
overview: 将 HomePetOS 首页从现有列表式布局改造为截图中的圆形仪表板风格，包含中心宠物圆环、浮动功能卡片区、左侧导航栏、底部时间线四大模块
design:
  architecture:
    framework: react
  fontSystem:
    fontFamily: PingFang SC
    heading:
      size: 28px
      weight: 700
    subheading:
      size: 15px
      weight: 600
    body:
      size: 12px
      weight: 400
  colorSystem:
    primary:
      - "#17A2B8"
      - "#138496"
      - "#20C997"
    background:
      - "#E8F4F8"
      - "#FFFFFF"
      - "#FFB5BA"
      - "#F0F9FF"
    text:
      - "#1A3A4A"
      - "#6B8A9A"
      - "#FFFFFF"
    functional:
      - "#FF8A95"
      - "#4ECDC4"
      - "#FFD93D"
todos:
  - id: create-dashboard-css
    content: 创建 home-dashboard.css 样式文件，定义欢迎卡片、工具栏、侧边导航、圆环仪表盘、浮动卡片、时间线的完整样式体系
    status: completed
  - id: rewrite-home-page
    content: 重写 HomePetOS.tsx 为 Dashboard 布局：欢迎区+工具栏+侧边导航+圆环(宠物头像环+状态环+名字)+5张浮动卡片(含API数据)+底部时间线，卡片点击直接navigate不加按钮
    status: completed
    dependencies:
      - create-dashboard-css
  - id: lint-verify
    content: 运行 lint 和类型检查验证无报错，确认组件渲染正常
    status: completed
    dependencies:
      - rewrite-home-page
---

## 产品概述

将当前宠物管理 App 的首页（HomePetOS）从「问候+Hero卡+打卡+统计」的纵向列表布局，改造为参考截图的**圆形仪表盘 Dashboard 风格**。核心视觉是一个以选中宠物为中心的圆环，周围环绕多张浮动功能卡片（各项记录），底部为时间线。

## 核心功能需求

### 布局改造（6 大区块）

1. **左上角欢迎卡片** — 青色(teal)圆角大卡片，显示 "Good Afternoon, {用户名}"，替代原有纯文字问候
2. **右上角工具栏** — 3 个白色圆形图标按钮：搜索、消息、通知（搜索和通知暂为占位）
3. **左侧垂直导航栏** — 5 个青色圆形图标按钮，纵向排列（首页/网格/文件夹/日历/设置），其中首页高亮
4. **中心圆环仪表盘（核心）**：

- 内圈白底圆：显示 "Patient Name" + 当前宠物名称（如 Lily）
- 中环粉红渐变环形：4 个状态标签围绕分布（绝育状态/疫苗/芯片/主人名），数据来自 selectedPet 对象
- 外圈弧形排列：所有宠物头像围成一圈（复用 pets 数组），选中的宠物头像突出显示

5. **浮动功能卡片（5 张）**：围绕中心散布，每张卡片包含标题 + 数值/描述 + 图标：

- **预约记录 (Appointments)** — 显示提醒数量或就诊次数，点击跳转 `/app/timeline/records`
- **饮食记录 (Diet)** — 显示最近饮食状态，点击跳转 `/app/timeline/add-record`（diet 类型）
- **体检记录 (Check-Ups)** — 显示体检次数，点击跳转 `/app/timeline/records`
- **诊断信息 (Diagnosis)** — 显示 AI 分析健康等级或最近诊断，青色高亮卡片，点击跳转 `/app/insights`
- **检测记录 (Tests)** — 显示体重/观察记录数，点击跳转 `/app/timeline/records`

6. **底部时间线** — 白色横条显示当天日期（24 Mar）+ 时间轴刻度（10:30 ~ 15:30）+ 各时段关联的宠物头像

### 交互约束

- **所有浮动卡片本身可点击跳转**（整张卡片作为可点击区域），卡片上**不显示跳转按钮**
- 点击宠物头像圆环中的其他头像 = 切换宠物（复用 setPetId）
- 跳转按钮后续会放到另外位置，本阶段只做卡片点击跳转

### 数据来源（全部复用现有 API/Hook）

- `useShell()` → pets / selectedPet / selectedPetId / setPetId / nickname
- `fetchAnalysisDashboard(selectedPet.id)` → 健康分数、疫苗提醒、驱虫提醒、核心健康指标
- `fetchReminders(phone, selectedPetId, "pending")` → 待处理提醒数（用于 Appointments 卡片数值）
- Pet 对象自身字段 → neutered(绝育)、breed(品种)、age(年龄) 用于圆环标签

## 技术栈

- 前端框架：React 18 + TypeScript
- 样式方案：**CSS Modules 新文件** `home-dashboard.css`（独立于 petos.css，避免污染现有样式系统）+ CSS 自定义属性（复用 tokens.css 变量）
- 图标库：lucide-react（项目已有依赖）
- 数据层：useShell hook + fetchAnalysisDashboard / fetchReminders（已有 API）

## 实现方案

### 架构策略

将 HomePetOS.tsx 重写为新版 Dashboard 布局，保留原有的空状态逻辑和宠物切换能力。新增独立的样式文件避免影响其他页面。

### 关键技术决策

1. **圆环仪表盘实现** — 使用纯 CSS 实现（border-radius + conic-gradient 或多层 div 叠加），不用 Canvas/SVG 库，保证性能和可维护性。外圈宠物头像用绝对定位 + trigonometry 计算（或固定 8 个位置均匀分布）。
2. **浮动卡片定位** — 使用 CSS `position: absolute` 相对于中心容器定位，配合轻微旋转角度（rotate）模拟截图中的散落效果。响应式适配时回退为 flex 网格。
3. **底部时间线** — 横向滚动容器，用 flex 均匀分布时间节点，每个节点下方挂载宠物小头像。
4. **数据加载** — 复用现有 useEffect 模式，在 selectedPet 切换时并行请求 fetchAnalysisDashboard 和 fetchReminders，填充各卡片数值。
5. **GlassNav 替换** — 截图中没有使用毛玻璃导航条，而是自定义的欢迎卡片 + 工具栏 + 左侧导航。保留 GlassNav 组件导入但不在新版布局中使用（或改为右侧工具栏区域）。

### 性能考量

- 圆环动画仅用 CSS transform，不触发 layout
- 图片懒 loading（宠物头像）
- API 并行请求（Promise.all）
- 浮动卡片使用 will-change: transform 优化 hover 动效

## 目录结构

```
src/pages/HomePetOS.tsx          # [MODIFY] 重写为 Dashboard 布局，新组件结构
src/styles/home-dashboard.css    # [NEW] 首页 Dashboard 专用样式（约 400-500 行）
src/components/petos/            # 保持不变
src/styles/petos.css             # 保持不变（Dashboard 用独立样式文件）
```

## 关键代码结构

```typescript
// 浮动卡片数据类型
interface FloatingCard {
  id: string;
  title: string;
  subtitle?: string;       // 如 "Protein low"
  value?: string | number; // 如 "200"、"20"、"68"
  icon: LucideIcon;
  variant: 'default' | 'highlight' | 'striped'; // default=white, highlight=teal, striped=条纹背景
  onClick: () => void;     // 直接 navigate，无内部跳转按钮
}

// 圆环状态标签类型
interface RingLabel {
  key: string;
  label: string;           // "Neutered" / "Vaccinated" / "Chipped" / "Owner"
  value: string;          // "Yes" / "2024-03" / pet owner name
}
```

## 设计风格：宠物医疗仪表盘 (Pet Medical Dashboard)

整体采用**清新医疗感 + 温暖宠物元素**的融合风格：

### 视觉基调

- **主色调**：Teal 青 (#17A2B8) 作为主题色，传达专业医疗感
- **辅助色**：粉红渐变 (#FFB5BA → #FF8A95) 作为中心圆环色，柔和温暖
- **背景色**：极浅蓝灰 (#E8F4F8)，干净通透
- **卡片色**：纯白底 + 极淡阴影，轻盈悬浮感

### 页面规划（单页 6 区块）

#### Block 1: 左上角欢迎卡片

- 圆角 24px，Teal 渐变背景 (#138496 → #17A2B8)
- 白色文字："Good Afternoon," 小字 + 用户名大字粗体
- 尺寸约 200x90px，位于页面左上角

#### Block 2: 右上角工具栏

- 3 个白色圆形按钮（直径 40px），横向排列
- 图标：Search / Mail / Bell（lucide-react）
- 白色背景 + 浅影，间距 10px
- 位于页面右上角，与欢迎卡片同一水平线

#### Block 3: 左侧垂直导航

- 5 个圆形按钮纵向排列，直径 44px
- 背景 Teal 色，白色图标
- 选中项（首页）有外发光环
- 图标：Home / Grid / Folder / Calendar / Settings
- 整体包裹在浅色胶囊形容器中（圆角 22px）

#### Block 4: 中心圆环仪表盘（核心视觉）

- **外层**：8 个宠物头像围成半径 ~160px 的圆圈（均匀分布，每个间隔 45°）
- **中层**：粉红渐变环形（内径 140px 外径 220px），4 个标签文字沿环分布
- **内层**：白色实心圆（直径 130px），居中显示 "Patient Name" 小字 + 宠物名大字
- 选中的宠物头像放大 1.2x + Teal 边框高亮

#### Block 5: 浮动功能卡片（5 张散布）

围绕圆环以不同角度和偏移量定位：

- **Appointments 卡片**（左上方 rotate -6°）：白色圆角，时钟图标 + "Appointments" 标题 + 数值
- **Diet 卡片**（左下方 rotate 4°）：白色圆角，餐具图标 + "Diet" + 副标题
- **Check-Ups 卡片**（右上方 rotate -3°）：条纹浅粉背景，心形图标 + "Check-Ups" + 数值
- **Diagnosis 卡片**（右中方 rotate 5°）：Teal 高亮背景白字，剪贴板图标 + "Diagnosis" + 描述
- **Tests 卡片**（右下方 rotate -4°）：白色圆角，烧瓶图标 + "Tests" + 数值
- 每张卡片：圆角 18px，宽约 120px，padding 14px，微投影

#### Block 6: 底部时间线

- 固定底部白色横条（height 72px，圆角 20px）
- 左侧显示日期大字 "24" + "Mar"
- 横向时间轴节点（10:30 / 12:40 / 13:30 / 14:50 / 15:30）
- 每个节点下有小圆点标记 + 宠物头像（32px）
- 当前时刻节点用 Teal 色高亮 + 放大头像

## Skill 使用

### frontend-design

- **Purpose**: 生成高质量的前端界面代码，确保 Dashboard 的视觉效果达到截图水准（圆环仪表盘、浮动卡片、色彩搭配、微交互动效）
- **Expected Outcome**: 产出符合设计规范的 React + TypeScript 组件代码和 CSS 样式，视觉品质接近截图的医疗仪表盘风格

### impeccable

- **Purpose**: 对生成的 Dashboard UI 进行精细化打磨——视觉层次、间距节奏、圆环动画流畅度、卡片悬浮交互细节、响应式适配
- **Expected Output**: 确保 UI 在视觉层面达到 premium 级别，无粗糙边缘，动效自然流畅