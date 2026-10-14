# 本地 aar 依赖

## 支付宝 SDK（必需，否则支付功能无法编译）

支付宝**不把 Android SDK 发布到 Maven**，只能从商户后台手动下载，所以 aar 必须提交进 Git。

### 获取步骤

1. 登录 [支付宝开放平台](https://open.alipay.com/) → 控制台 → 进入对应应用（APPID `2021007102638012`）
2. 找到「APP 支付」能力 → SDK 下载 → 选 **Android 客户端 SDK**
3. 解压后把 `alipaySdk-*.aar` 放到当前目录（`android/app/libs/`）
4. 无需改 build.gradle，已配置 `fileTree(include: ['*.aar'], dir: 'libs')` 自动收录

### 验证集成成功

`AlipayPlugin.java` 里 `import com.alipay.sdk.app.PayTask` 能解析即说明 aar 已就位。
aar 缺失时该 import 编译报错；若绕过编译运行，`PayTask` 会抛 `NoClassDefFoundError`，
插件已捕获 `Throwable` 并通过 `call.reject` 回传，不会静默失败。

### 注意

- aar 文件名带版本号，升级时**删掉旧的**再放新的，否则会重复类冲突
- 支付宝 SDK 已包含所需的 ProGuard 规则，`minifyEnabled false` 时无需额外配置；
  将来开启混淆需补 `-keep class com.alipay.** { *; }`
