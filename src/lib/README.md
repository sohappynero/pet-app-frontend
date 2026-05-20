# 自动 Token 刷新机制

这个项目实现了自动 Token 刷新机制，当 API 请求返回 401 错误时，会自动尝试刷新 Token 而不是直接跳转到登录页面。

## 功能特点

1. **自动刷新**: 当收到 401 响应时，自动调用刷新接口获取新的 Token
2. **并发处理**: 防止多个请求同时刷新 Token，避免重复刷新
3. **队列化**: 刷新过程中的其他请求会被队列化，等待刷新完成
4. **无缝重试**: 刷新成功后自动重试原始请求
5. **优雅降级**: 刷新失败时才跳转到登录页面

## 实现原理

### 核心组件

1. **api.ts** - 核心 API 请求处理
   - 修改了 `request` 函数，添加了 401 错误处理
   - 实现了 `refreshToken` 函数用于刷新 Token
   - 使用发布-订阅模式处理并发请求

2. **auth.ts** - 全局认证管理
   - 提供了全局的 Token 刷新功能
   - 管理刷新状态和订阅者

3. **WithErrorHandling.tsx** - 错误边界组件
   - 提供了 `APIErrorHandler` 组件用于处理 API 错误
   - 提供了 `ErrorBoundary` 组件用于捕获组件错误

### 工作流程

1. 发起 API 请求
2. 如果收到 401 响应：
   - 检查是否已经在刷新中
   - 如果在刷新中，将请求加入队列等待
   - 如果不在刷新中，开始刷新流程
3. 调用刷新接口获取新 Token
4. 更新本地存储的 Token
5. 通知所有等待的请求
6. 使用新 Token 重试原始请求
7. 如果刷新失败，跳转到登录页面

## 使用方法

### 基本使用

```typescript
import { APIErrorHandler } from '../components/WithErrorHandling';

function MyComponent() {
  const [data, setData] = useState(null);
  
  const loadData = async (handleError: (error: Error) => Promise<void>) => {
    try {
      const response = await fetch('/api/endpoint');
      setData(response.data);
    } catch (err) {
      if (err instanceof Error) {
        await handleError(err);
      }
    }
  };
  
  return (
    <APIErrorHandler>
      {(handleError) => (
        <button onClick={() => loadData(handleError)}>
          加载数据
        </button>
      )}
    </APIErrorHandler>
  );
}
```

### 直接使用 API 函数

所有 API 函数已经集成了自动刷新机制，可以直接使用：

```typescript
import { fetchPets } from '../lib/api';

async function loadPets() {
  try {
    const response = await fetchPets('1234567890');
    // 处理数据
  } catch (err) {
    // 如果是 401 错误，会自动刷新并重试
    // 如果刷新失败，会抛出错误
    console.error('请求失败:', err);
  }
}
```

### 自定义刷新逻辑

如果需要自定义刷新逻辑，可以修改 `auth.ts` 文件：

```typescript
export async function customRefreshToken(): Promise<string> {
  // 自定义刷新逻辑
  const newToken = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getCurrentToken()}`
    }
  });
  
  // 更新 Token
  updateToken(newToken);
  return newToken;
}
```

## 注意事项

1. **刷新接口**: 确保后端提供了刷新 Token 的接口（`/api/v1/auth/refresh`）
2. **Token 存储**: 新 Token 会自动更新到本地存储
3. **错误处理**: 刷新失败时会跳转到登录页面
4. **并发请求**: 多个 401 请求会被正确处理，不会重复刷新
5. **性能考虑**: 刷新过程中请求会被延迟，但这是必要的

## 测试

项目包含了测试页面，可以通过以下方式访问：

```
/token-refresh-test
```

这个页面提供了两个测试按钮：
1. 测试正常 API 调用
2. 模拟 401 错误处理

## 配置

如果需要修改刷新行为，可以修改以下配置：

- **刷新接口 URL**: 在 `api.ts` 中修改 `API_BASE_URL`
- **刷新超时时间**: 可以添加超时处理
- **Token 过期检测**: 可以添加 Token 过期时间检测
- **重试次数**: 可以添加重试机制

## 兼容性

- React 18+
- TypeScript
- 现代浏览器

## 许可证

MIT License