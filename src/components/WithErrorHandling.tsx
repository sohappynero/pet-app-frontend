import { Component, ErrorInfo, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { refreshTokenGlobal } from '../lib/auth';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>出错了</h2>
          <p>{this.state.error?.message || '发生未知错误'}</p>
        </div>
      );
    }

    return this.props.children;
  }
}

interface APIErrorHandlerProps {
  children: (handleError: (error: Error) => Promise<void>) => ReactNode;
}

export function APIErrorHandler({ children }: APIErrorHandlerProps) {
  const navigate = useNavigate();

  const handleError = async (error: Error): Promise<void> => {
    if (error.message.includes('401') || error.message.includes('未授权')) {
      try {
        await refreshTokenGlobal();
        // 刷新成功，继续执行原来的操作
      } catch (refreshError) {
        // 刷新失败，跳转到登录页
        navigate('/login');
      }
    } else {
      // 其他错误直接抛出
      throw error;
    }
  };

  return children(handleError);
}