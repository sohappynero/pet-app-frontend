import React, { useState } from 'react';
import { APIErrorHandler } from '../components/WithErrorHandling';
import { fetchPets } from '../lib/api';

export default function TokenRefreshExample() {
  const [pets, setPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPets = async (handleError: (error: Error) => Promise<void>) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetchPets('1234567890'); // 使用示例手机号
      setPets(response.data || []);
    } catch (err) {
      if (err instanceof Error) {
        await handleError(err);
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="token-refresh-example">
      <h2>Token 自动刷新示例</h2>
      
      <APIErrorHandler>
        {(handleError) => (
          <div>
            <button 
              onClick={() => loadPets(handleError)}
              disabled={loading}
            >
              {loading ? '加载中...' : '加载宠物数据'}
            </button>
            
            {error && (
              <div className="error-message">
                错误: {error}
              </div>
            )}
            
            {pets.length > 0 && (
              <div className="pets-list">
                <h3>宠物列表:</h3>
                <ul>
                  {pets.map(pet => (
                    <li key={pet.id}>
                      {pet.name} - {pet.species}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </APIErrorHandler>
      
      <div className="explanation">
        <h3>说明:</h3>
        <ul>
          <li>这个示例展示了如何使用自动 Token 刷新机制</li>
          <li>当 API 请求返回 401 错误时，会自动尝试刷新 Token</li>
          <li>如果刷新成功，会自动重试原始请求</li>
          <li>如果刷新失败，会自动跳转到登录页面</li>
        </ul>
      </div>
    </div>
  );
}