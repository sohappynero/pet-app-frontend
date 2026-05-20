---
name: ai-pet-chat-system
overview: 在现有 PetChat 聊天界面基础上，分三阶段实现"AI 宠物情绪解读 + 拟人化表达"系统：第一阶段实现图片心声功能，第二阶段实现 AI 吐槽功能，第三阶段实现声音翻译功能。保持现有 UI 风格不变，新增 AI 功能入口和交互。
design:
  architecture:
    framework: react
  styleKeywords:
    - 温暖治愈系
    - 日系萌系
    - 微信聊天范式
    - 毛玻璃效果
    - 圆润UI
    - 微妙渐变
    - 呼吸动画
    - 沉浸式体验
  fontSystem:
    fontFamily: PingFang SC, Helvetica Neue, sans-serif
    heading:
      size: 22px
      weight: 800
    subheading:
      size: 16px
      weight: 600
    body:
      size: 14.5px
      weight: 400
  colorSystem:
    primary:
      - "#8B7355"
      - "#D4A574"
      - "#A67B5B"
    background:
      - "#FAF7F5"
      - "#FFFFFF"
      - "#F5EBE0"
    text:
      - "#5C4A32"
      - "#8B7355"
      - "#A69076"
    functional:
      - "#4ADE80"
      - "#FB923C"
      - "#F87171"
      - "#60A5FA"
todos:
  - id: phase1-foundation
    content: 创建基础架构：types.ts 新增类型定义 + pet-prompt.ts Prompt 工程模块 + pet-mind.api.ts API 服务层框架
    status: completed
  - id: phase1-ui-redesign
    content: 使用 [skill:frontend-design] 重构 PetChat 主界面：新 Header + 功能快捷入口栏 + 重构消息列表 + 新底部操作区
    status: completed
    dependencies:
      - phase1-foundation
  - id: phase1-photo-upload
    content: 实现 PhotoUploader 组件：拖拽上传 + 拍照选择 + 图片预览 + base64 编码
    status: completed
    dependencies:
      - phase1-ui-redesign
  - id: phase1-photo-analysis
    content: 实现图片心声完整流程：上传 → 分析 Loading 态 → AI 返回 → PhotoMindResult 结果展示卡 + 打字机动画
    status: completed
    dependencies:
      - phase1-photo-upload
  - id: phase2-roast-system
    content: 实现 AI 吐槽系统：pet-prompt.ts 人格引擎 + generatePetRoast() API + PetRoastCard 组件 + 主动消息注入
    status: completed
    dependencies:
      - phase1-photo-analysis
  - id: phase2-memory-context
    content: 实现长期记忆 + 上下文系统：localStorage 聊天持久化 + 宠物状态画像构建 + 时间触发机制
    status: completed
    dependencies:
      - phase2-roast-system
  - id: phase3-sound-translate
    content: 实现声音翻译功能：音频上传 UI + PetVoiceBubble 组件 + translatePetSound() API + 情绪规则引擎
    status: completed
    dependencies:
      - phase2-memory-context
  - id: polish-test
    content: 使用 [MCP:Playwright] 进行整体验证：布局测试 + 交互流程测试 + 响应式适配检查 + 性能优化
    status: completed
    dependencies:
      - phase3-sound-translate
---

## 产品概述

"AI 宠物情绪解读 + 拟人化表达" 系统 -- 通过宠物声音、照片、健康数据、用户互动行为，生成 "像宠物真的在说话" 的 AI 内容。基于现有宠物聊天界面（PetChat）进行重新设计和功能扩展，其他页面保持不变。

## 核心功能

### 第一阶段：宠物照片心声（优先实现）

- 用户上传/拍摄宠物照片
- 系统分析表情、姿态、情绪氛围
- AI 生成 "宠物内心 OS"（拟人化、可爱、有性格）
- 输出示例："别拍了，我刚睡醒。"
- 支持猫/狗，可扩展其他宠物

### 第二阶段：AI 宠物吐槽 / 主动表达

- 基于宠物健康数据（体重、食欲、心情等）、最近互动记录、活动量
- AI 自动生成 "宠物想说的话"
- 定时/触发式主动消息推送至聊天界面
- 内置宠物人格系统 + 长期记忆能力
- 输出示例："主人最近都不陪我..."、"我今天超想出去玩！"

### 第三阶段：宠物声音翻译

- 上传宠物音频（mp3/wav/m4a）
- 音频特征分析 + 情绪判断（excited/anxious/hungry/lonely/angry/happy）
- AI 生成宠物语言翻译 + 互动建议
- 返回情绪结果、评分、AI 翻译文案、建议行为

## Prompt 核心要求

所有 AI 输出必须：**拟人化、可爱、有情绪、有宠物性格、不像 AI 助手、不长篇大论**

## 技术栈

- **前端框架**: React 18 + TypeScript (现有)
- **构建工具**: Vite 5 (现有)
- **样式方案**: 自定义 CSS + Tailwind CSS (现有，pet-chat.css 模式)
- **图标库**: lucide-react (现有)
- **路由**: React Router v6 + AppShell 嵌套布局 (现有)
- **状态管理**: useState/useEffect + ShellContext (现有模式)
- **API 层**: fetch 封装 + Token 刷新 (复用 api.ts 模式)

## 技术架构

### 架构设计思路

遵循现有项目架构模式（参考 `pet3d.api.ts` 的多后端适配模式），采用分层架构：

```
┌─────────────────────────────────────────────┐
│              PetChat 页面层                   │
│  ┌─────────┐ ┌──────────┐ ┌──────────────┐ │
│  │图片心声  │ │ AI吐槽   │ │ 聊天消息列表  │ │
│  │上传组件  │ │主动表达  │ │ + 输入区域    │ │
│  └────┬────┘ └────┬─────┘ └──────────────┘ │
├───────┼──────────┼─────────────────────────┤
│       ▼          ▼                          │
│  ┌─────────────────────────────────────┐    │
│  │        pet-mind.api.ts              │    │
│  │  (AI 宠物心灵 API 服务层)            │    │
│  │  - analyzePhotoMind() 图片心声      │    │
│  │  - generatePetRoast() AI吐槽        │    │
│  │  - translatePetSound() 声音翻译     │    │
│  └──────────────┬──────────────────────┘    │
│                 │                            │
│  ┌──────────────▼──────────────────────┐    │
│  │       pet-prompt.ts                 │    │
│  │  (Prompt 工程模块)                  │    │
│  │  - buildPhotoMindPrompt()           │    │
│  │  - buildPetRoastPrompt()            │    │
│  │  - buildSoundTranslatePrompt()     │    │
│  │  - PET_PERSONALITIES 人格配置       │    │
│  └─────────────────────────────────────┘    │
├─────────────────────────────────────────────┤
│         复用现有基础设施                     │
│  api.ts (fetch + Token) / session.ts       │
│  ShellContext / useShell / types.ts        │
└─────────────────────────────────────────────┘
```

### 多后端适配策略（沿用 pet3d.api.ts 模式）

1. **优先**: 通义千问 Qwen-VL (视觉) + Qwen (文本) API
2. **备选**: OpenAI GPT-4 Vision API
3. **降级**: Mock 模拟数据（演示/开发用，确保功能可用）

### 数据流设计

```
用户操作 → 组件事件 → pet-mind.api.ts → 构建 Prompt → 调用 AI API
                                                    ↓
                                              解析响应
                                                    ↓
                                            更新聊天消息状态
                                                    ↓
                                              渲染到 UI
```

### 关键技术决策

1. **图片处理**: fileToBase64 (复用 pet3d.api.ts 已有函数)
2. **API 调用模式**: request() 函数封装 (复用 api.ts)，支持 onProgress 进度回调
3. **状态管理**: 全部使用组件内 useState，通过 props/callback 通信
4. **消息存储**: localStorage 缓存聊天历史（与现有 session 模式一致）
5. **人格系统**: 基于 Pet 数据（species/breed/name/gender）动态构建人格 Prompt

## 实现细节

### Phase 1: 图片心声功能核心逻辑

1. 用户点击相机按钮 / 拖拽上传宠物照片
2. 前端预览 + base64 编码
3. 调用 AI 视觉 API 分析图片：

- 检测宠物种类（猫/狗/其他）
- 分析表情（开心/困倦/好奇/委屈/兴奋...）
- 分析姿态（躺着/坐着/奔跑/歪头...）
- 分析环境氛围（户外/室内/舒适/紧张...）

4. 将分析结果注入 Prompt 模板
5. AI 生成拟人化 "宠物内心 OS"
6. 以宠物聊天气泡形式展示结果

### Phase 2: AI 吐槽功能核心逻辑

1. 从 ShellContext 获取 selectedPet + health records
2. 从 localStorage 读取近期聊天/互动频率
3. 构建宠物 "当前状态画像"：

- 最近一次健康记录（体重变化、食欲、心情）
- 距上次互动时间
- 今日活跃度评估
- 宠物性格标签

4. 注入人格化 Prompt 模板
5. AI 生成 1-3 条 "宠物想说的话"
6. 以主动消息形式插入聊天列表

### Phase 3: 声音翻译功能核心逻辑

1. 用户上传音频文件 (mp3/wav/m4a)
2. 前端验证格式和大小
3. 后端音频处理（ffmpeg 转码 + librosa 特征提取）-- 此部分需后端配合
4. 情绪规则引擎匹配（频率/音调/时长 → 情绪类型）
5. AI 生成拟人化翻译 + 互动建议
6. 展示为特殊声音消息气泡

## 目录结构

```
d:\codebuddy\frontend\
├── src/
│   ├── types.ts                          # [MODIFY] 新增 PetMind 相关类型
│   ├── pages/
│   │   └── PetChat.tsx                   # [MODIFY] 重构：集成三大 AI 功能
│   ├── lib/
│   │   ├── api.ts                        # [MODIFY] 可选：添加 pet-mind API 端点
│   │   ├── pet3d.api.ts                  # [REFERENCE] 参考其多后端适配模式
│   │   ├── pet-mind.api.ts               # [NEW] AI 宠物心灵 API 服务层
│   │   └── pet-prompt.ts                 # [NEW] Prompt 工程模块
│   ├── components/
│   │   ├── PetChat/
│   │   │   ├── PhotoUploader.tsx          # [NEW] 图片上传组件（拖拽+拍照+预览）
│   │   │   ├── PhotoMindResult.tsx        # [NEW] 图片心声分析结果展示
│   │   │   ├── PetVoiceBubble.tsx         # [NEW] 宠物声音消息气泡
│   │   │   ├── PetRoastCard.tsx           # [NEW] AI 吐槽卡片组件
│   │   │   ├── ChatMessageList.tsx        # [NEW] 消息列表（重构自原内联代码）
│   │   │   └── ChatInputArea.tsx          # [NEW] 输入区域（话筒+输入框+发送+相册）
│   │   └── ... (其他组件不变)
│   └── pet-chat.css                       # [MODIFY] 新增组件样式
```

## 关键类型定义

```typescript
// === 宠物心声相关类型 ===
type PetEmotion = 
  | 'happy' | 'sleepy' | 'curious' | 'sad' 
  | 'excited' | 'hungry' | 'lonely' | 'angry' 
  | 'anxious' | 'playful' | 'relaxed';

type PetPosture = 
  | 'sitting' | 'lying' | 'standing' | 'running' 
  | 'tilting_head' | 'stretching' | 'curling' | 'jumping';

interface PhotoMindAnalysis {
  species: 'cat' | 'dog' | 'other';
  emotion: PetEmotion;
  confidence: number; // 0-100
  posture: PetPosture;
  sceneDescription: string; // 场景描述
  innerVoice: string; // "别拍了，我刚睡醒。"
  suggestions: string[]; // 互动建议
}

// === AI 吐槽相关类型 ===
interface PetPersonality {
  name: string;
  species: 'cat' | 'dog';
  traits: string[]; // ['粘人', '贪吃', '高冷', ...]
  speakingStyle: string; // 说话风格描述
  catchphrases: string[]; // 口头禅
}

interface PetRoastMessage {
  id: number;
  text: string;
  timestamp: string;
  triggerType: 'idle_too_long' | 'low_activity' | 'health_change' | 'time_based' | 'mood_based';
  mood: PetEmotion;
}

// === 声音翻译相关类型 ===
type SoundEmotion = 
  | 'excited' | 'anxious' | 'hungry' 
  | 'lonely' | 'angry' | 'happy';

interface SoundTranslation {
  originalFile: string;
  emotion: SoundEmotion;
  emotionScore: number; // 0-100
  translation: string; // AI 翻译的宠物语言
  suggestedAction: string; // 建议互动行为
  audioFeatures?: {
    duration: number;
    avgPitch: number;
    intensity: number;
  };
}
```

## 设计风格定位

采用 **温暖治愈系宠物社交风格**（Warm & Healing Pet Social Style），融合微信聊天交互范式 + 日系萌系 UI 元素。整体氛围温馨柔和，以米色/棕色/奶油色为主色调，配合微妙的渐变光效和圆润的 UI 元素，营造 "和毛孩子对话" 的沉浸感。

## 页面规划（共 4 个页面/视图）

### 页面 1：宠物聊天主界面（PetChat 主页改造）

核心页面，整合所有 AI 功能入口和聊天交互。

**Block 1 - 顶部 Header 区域**
保留现有的渐变背景头部，包含：宠物头像（带浮动 emoji 特效）、宠物名称、"和毛孩子的心灵对话" 副标题。右侧增加一个 **设置齿轮图标**（可切换宠物人格偏好）。下方的心情栏改为 **实时情绪指示器**（从最新 AI 分析结果驱动，显示当前情绪 emoji + 一句话描述）。

**Block 2 - 功能快捷入口栏**
新增水平滚动的功能入口条，位于 header 和消息区之间：

- [相机图标] 拍照解读心声
- [图片图标] 选图解读心声  
- [气泡图标] AI 吐槽/主动表达
- [波形图标] 声音翻译（Phase 3）
每个入口带小标签文字，圆角胶囊按钮风格，渐变底色区分功能。

**Block 3 - 聊天消息列表区**
重构消息展示，支持多种消息类型：

- 文字消息气泡（用户发送，保持现有棕色渐变风格）
- 宠物回复气泡（白色底 + 左侧小三角 + 宠物头像）
- **图片心声分析卡**（新增）：左侧缩略图 + 右侧分析结果（情绪 tag + 内心 OS 文字 + 建议）
- **AI 吐槽消息**（新增）：特殊样式的宠物气泡，带 "💭 正在想..." 打字动画前缀
- **声音翻译消息**（Phase 3 新增）：波形可视化 + 情绪色块 + 翻译文字

**Block 4 - 底部输入操作区**
重新设计的底部工具栏，从左到右：

- [🎤 圆形话筒] 语音输入（已有，保持微信风格）
- [📷 相册按钮] 打开图片选择器 → 触发图片心声
- [═══ 输入框 ═══] 文字输入
- [➤ 发送按钮] 圆形发送

额外：当进入 "图片心声模式" 时，底部变为图片上传区域（拖拽区 + 预览 + "开始解读" 按钮）。当进入 "声音翻译模式" 时，底部变为音频上传区。

### 页面 2：图片心声分析中（Overlay/Modal）

全屏/半屏覆盖层的加载分析状态：

- 中央显示上传的宠物照片（带呼吸光效边框）
- 下方 3 步进度指示器：[分析表情 ✅] → [理解情绪 ⏳] → [生成内心OS...]
- 底部显示有趣的 loading 文案轮播："宝贝正在思考怎么形容这张脸..." / "正在解读毛孩子的微表情..."
- 保持半透明背景看到聊天界面

### 页面 3：图片心声结果详情（展开视图）

点击消息列表中的图片心声卡后的展开视图：

- 大图展示区（宠物照片）
- 分析结果面板：
- 情绪标签（彩色 pill badge）
- 姿态识别结果
- "宠物内心 OS" 大字展示（打字机动画效果）
- AI 给主人的建议（卡片列表）
- 底部操作：「分享到聊天」/「再拍一张」/「保存」

### 页面 4：AI 吐槽设置（可选设置面板）

从 Header 设置图标进入：

- 宠物性格调节滑块（粘人 ← → 独立）
- 说话风格选项（傲娇/温柔/活泼/高冷）
- 主动发言频率（每 X 小时 / 仅打开时）
- 长期记忆开关

## 设计细节要点

- **圆角体系**: 统一使用 12px(小)/16px(中)/20px(大)/22px(输入框)/50%(圆形按钮) 的圆角层级
- **阴影层次**: 轻柔阴影 `0 2px 12px rgba(160,130,100,0.08)` 用于卡片，`0 4px 20px rgba(160,130,100,0.15)` 用于悬浮元素
- **动效原则**: 所有交互元素都有 0.2s-0.35s ease 过渡；新消息有 slide-in + fade 动画；loading 有 pulse/breathe 动效
- **色彩一致性**: 主色 #8B7355(深棕) / #D4A574(暖棕金) / #A67B5B(中棕)；背景 #FAF7F5(奶白)；强调色按情绪动态变化

## Skill 扩展

- **frontend-design**
- 用途: 设计并生成高质量的前端 UI 组件，特别是 PetChat 页面的重新设计和子组件（PhotoUploader、PhotoMindResult、PetRoastCard 等）的可视化实现
- 预期产出: 生产级别的 React + TypeScript 组件代码，包含完整样式和交互动效

## MCP 扩展

- **Hyperbrowser MCP Server** (browser_use_agent / claude_computer_use_agent)
- 用途: 在开发完成后进行浏览器端自动化测试，验证 PetChat 页面的交互流程（图片上传、AI 分析结果展示、聊天消息渲染等）
- 预期产出: 截据截图 + 功能验证报告

- **MCP Server Playwright**
- 用途: 本地开发服务器的 UI 测试，验证页面布局在不同尺寸下的表现
- 预期产出: 响应式布局测试结果