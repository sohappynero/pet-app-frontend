---
name: redesign-cards-ghibli-handcraft-style
overview: 将首页8个快速记录卡片从"科技感3D玻璃"风格全面重设计为「宫崎骏手绘治愈风」——温暖奶油色系、水彩纸张纹理、自然手绘图标、有机圆润形状，去除所有AI生成的模板感，让界面有温度、有故事感、高端且可爱。保留AI分析卡片。
design:
  architecture:
    framework: react
  styleKeywords:
    - 吉卜力治愈风
    - 手绘有机感
    - 温暖奶油色系
    - 纸张水彩纹理
    - 自然元素装饰
    - 低饱和温暖色
  fontSystem:
    fontFamily: Georgia, 'Times New Roman', serif
    heading:
      size: 18px
      weight: 700
    subheading:
      size: 13px
      weight: 400
    body:
      size: 12px
      weight: 400
  colorSystem:
    primary:
      - "#87CEEB"
      - "#B39DDB"
      - "#FFCDD2"
      - "#A5D6A7"
      - "#FFE0B2"
      - "#F8BBD0"
      - "#C8E6C9"
      - "#CE93D8"
    background:
      - "#FFF8E7"
      - "#FEF9F3"
    text:
      - "#5D4037"
      - "#8D6E63"
todos:
  - id: redesign-jsx-visual
    content: 重构Pets.tsx中8个卡片的左侧视觉区：移除ph3d-tc-visual/orb/sphere 3D球体结构，替换为ghibli-visual + ghibli-icon手绘图标容器，每张卡片使用独特Lucide图标
    status: pending
  - id: rewrite-css-ghibli
    content: 全面重写index.css样式：删除所有ph3d-tc-*样式规则，重写为ghibli-*样式系统，实现温暖奶油背景、纸张纹理、有机非对称圆角、多层次柔和阴影
    status: pending
    dependencies:
      - redesign-jsx-visual
  - id: update-color-variables
    content: 更新8张卡片的CSS变量配色方案：从冷色调渐变改为宫崎骏温暖自然色系，每张卡片定义--ghibli-primary/--ghibli-secondary/--ghibli-status变量
    status: pending
    dependencies:
      - rewrite-css-ghibli
  - id: add-natural-decorations
    content: 为8张卡片添加独特的自然元素装饰：使用CSS伪元素在每张卡片不同位置添加树叶/云朵/花瓣/星星剪影，增强治愈感
    status: pending
    dependencies:
      - rewrite-css-ghibli
  - id: implement-hover-animations
    content: 实现宫崎骏风格微动效：卡片hover纸片飘起效果(translateY+轻微旋转)、图标缩放、进度条流畅填充、装饰元素缓慢漂浮动画
    status: pending
    dependencies:
      - rewrite-css-ghibli
  - id: verify-ghibli-design
    content: 验证渲染效果：确认8张卡片均为治愈风格、无3D球体、配色温暖自然、纸张纹理可见、自然装饰显示、hover动效流畅、lint检查0错误
    status: pending
    dependencies:
      - add-natural-decorations
      - implement-hover-animations
---

## 需求：宫崎骏风格卡片重设计

将首页8个快速记录卡片从"课程卡片风格"重设计为**宫崎骏手绘治愈风格**，去除AI味。

**核心需求**：

1. 移除3D玻璃球体视觉区
2. 宫崎骏风格：温暖自然、手绘有机感、纸张质感
3. 去除AI味：避免通用渐变/玻璃态/几何图形
4. 高端且可爱，适合女性宠物主人
5. 保留全部8张卡片（含AI分析卡片）

**当前状态**：

- `src/pages/Pets.tsx` 第291-458行：8个卡片，左侧 `ph3d-tc-visual > ph3d-tc-orb > ph3d-tc-sphere` 3D球体结构
- `src/index.css` 第9422行起：`.ph3d-tech-card` 样式，冷色调配色，科技感强

**目标设计**：

- 左侧视觉区：手绘风格图标容器（每张卡片独特自然主题图标）
- 色彩：低饱和温暖色系（奶油白、鼠尾草绿、暖棕、天空蓝、杏色）
- 质感：纸张/水彩纹理背景（CSS radial-gradient模拟）
- 形状：有机圆润（非对称border-radius）
- 装饰：微妙自然元素（CSS伪元素实现树叶/云朵/花瓣剪影）

## 技术方案

**修改文件**：`src/pages/Pets.tsx` + `src/index.css`

**JSX改动（Pets.tsx 第291-458行）**：

- 移除：`ph3d-tc-visual > ph3d-tc-orb > ph3d-tc-sphere` 3D球体结构
- 替换为：`ghibli-visual > ghibli-icon` 手绘图标容器
- 每张卡片使用不同Lucide图标（Scale/Shield/Heart/Apple/Scissors/Eye/Brain等）

**CSS改动（index.css 第9422行起）**：

- 删除所有 `.ph3d-tc-*` 样式规则
- 新增 `.ghibli-*` 样式系统：
- 温暖奶油背景 `#FFF8E7`
- 纸张纹理：`radial-gradient` 多层叠加
- 有机非对称圆角 `border-radius: 20px 24px 22px 26px`
- 多层次柔和阴影（3层box-shadow营造纸片感）
- 手绘风图标样式（轻微旋转、温暖渐变背景）
- 自然装饰伪元素（树叶/云朵/花瓣剪影）
- 微动效（卡片hover纸片飘起、图标缩放、装饰漂浮）
- 8张卡片温暖配色方案（CSS变量）

## 宫崎骏手绘治愈风设计

### 设计理念

将吉卜力动画的自然美学——温暖光线、柔软云朵、郁郁葱葱的森林——应用于宠物健康卡片，创造有温度、有故事感的治愈系界面。

### 视觉方案

**卡片布局**：保持左侧视觉区（80px宽）+ 右侧纵向堆叠内容

**左侧视觉区**：

- 60×60px图标容器，圆角18px
- 温暖渐变背景 + 内部Lucide图标（CSS处理为手绘风）
- 轻微旋转(-2°~2°)模拟手绘不完美感

**右侧内容区**：

1. 主标题：18px/700，深棕色 `#5D4037`
2. 副标题：13px/400，中灰色 `#8D6E63`
3. 进度条：8px高，温暖渐变填充，顶部纸张纹理高光
4. 元信息行：状态badge + 百分比，space-between
5. 操作按钮：右对齐pill，温暖渐变背景，hover反色

**色彩系统（低饱和温暖色）**：

| 卡片 | 主色 | 辅色 |
| --- | --- | --- |
| 体重 | 天空蓝 `#87CEEB` | 薄荷绿 `#98D8C8` |
| 疫苗 | 薰衣草紫 `#B39DDB` | 天空蓝 `#81D4FA` |
| 驱虫 | 樱花粉 `#FFCDD2` | 杏色 `#FFE0B2` |
| 体检 | 薄荷绿 `#A5D6A7` | 天空蓝 `#80CBC4` |
| 饮食 | 杏色 `#FFE0B2` | 蜜桃橙 `#FFCCBC` |
| 美容 | 珠光粉 `#F8BBD0` | 薰衣草紫 `#D1C4E9` |
| 观察 | 嫩草绿 `#C8E6C9` | 天空蓝 `#B3E5FC` |
| AI | 魔法紫 `#CE93D8` | 天空蓝 `#90CAF9` |


**质感与装饰**：

- 纸张纹理背景（CSS径向渐变模拟水彩纸张）
- 有机非对称圆角（不是完美几何圆）
- 多层次柔和阴影（模拟纸片层叠感）
- 自然装饰伪元素（每张卡片不同位置添加树叶/云朵/花瓣剪影）

**动效设计**：

- 卡片hover：translateY(-2px) + 轻微旋转(0.5°) 模拟纸片飘起
- 图标hover：scale(1.05) + 旋转回归0°
- 装饰元素：缓慢漂浮动画（translate + rotate）