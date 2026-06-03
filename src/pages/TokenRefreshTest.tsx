import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchPets } from '../lib/api';
import { APIErrorHandler } from '../components/WithErrorHandling';
import type { Pet } from '../types';

export default function TokenRefreshTest() {
  const navigate = useNavigate();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string>('');

  // 模拟一个会返回 401 的请求
  const testUnauthorizedRequest = async (handleError: (error: Error) => Promise<void>) => {
    setLoading(true);
    setError(null);
    setTestResult('');
    
    try {
      // 这里可以模拟一个会返回 401 的请求
      // 实际项目中，这可能是任何 API 调用
    // 测试 401 处理
      
      // 模拟一个会失败的请求（实际项目中替换为真实的 API 调用）
      // const response = await fetch('/api/test-unauthorized');
      // if (!response.ok) {
      //   throw new Error('模拟的 401 错误');
      // }
      
      setTestResult('测试完成 - 没有收到 401 错误');
    } catch (err) {
      if (err instanceof Error) {
        await handleError(err);
        setError(err.message);
        setTestResult(`错误处理: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // 测试正常的 API 调用
  const testNormalRequest = async (handleError: (error: Error) => Promise<void>) => {
    setLoading(true);
    setError(null);
    setTestResult('');
    
    try {
      const response = await fetchPets('1234567890'); // 使用示例手机号
      setPets(response.data || []);
      setTestResult('正常请求成功');
    } catch (err) {
      if (err instanceof Error) {
        await handleError(err);
        setError(err.message);
        setTestResult(`错误处理: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="token-refresh-test">
      <div className="test-header">
        <h2>Token 自动刷新测试</h2>
        <button onClick={() => navigate('/app')} className="back-button">
          返回首页
        </button>
      </div>
      
      <div className="test-sections">
        <div className="test-section">
          <h3>测试 1: 正常 API 调用</h3>
          <p>测试正常的 API 调用，验证 Token 刷新机制是否正常工作。</p>
          <button 
            onClick={() => testNormalRequest(handleError)}
            disabled={loading}
            className="test-button"
          >
            {loading ? '加载中...' : '测试正常请求'}
          </button>
        </div>
        
        <div className="test-section">
          <h3>测试 2: 模拟 401 错误</h3>
          <p>模拟 401 错误，测试自动刷新机制。</p>
          <button 
            onClick={() => testUnauthorizedRequest(handleError)}
            disabled={loading}
            className="test-button"
          >
            {loading ? '测试中...' : '测试 401 处理'}
          </button>
        </div>
      </div>
      
      {error && (
        <div className="error-message">
          <h3>错误:</h3>
          <p className="error-text">{error}</p>
        </div>
      )}
      
      {testResult && (
        <div className="test-result">
          <h3>测试结果:</h3>
          <p className="result-text">{testResult}</p>
        </div>
      )}
      
      {pets.length > 0 && (
        <div className="pets-display">
          <h3>获取到的宠物数据:</h3>
          <ul className="pets-list">
            {pets.map(pet => (
              <li key={pet.id} className="pet-item">
                <div className="pet-info">
                  <span className="pet-name">{pet.name}</span>
                  <span className="pet-species">{pet.species}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="explanation">
        <h3>说明:</h3>
        <ul className="explanation-list">
          <li>这个页面用于测试 Token 自动刷新机制</li>
          <li>当 API 请求返回 401 错误时，系统会自动尝试刷新 Token</li>
          <li>如果刷新成功，会自动重试原始请求</li>
          <li>如果刷新失败，会自动跳转到登录页面</li>
          <li>刷新过程中，其他请求会被队列化，等待刷新完成</li>
        </ul>
      </div>
    </div>
  );
}