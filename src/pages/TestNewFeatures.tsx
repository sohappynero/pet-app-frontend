import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useShell } from '../hooks/useShell';

export default function TestNewFeatures() {
  const navigate = useNavigate();
  const { pets, selectedPet } = useShell();

  return (
    <div className="test-new-features">
      <div className="test-header">
        <h2>测试新功能</h2>
        <button onClick={() => navigate('/app/pets')} className="back-button">
          返回首页
        </button>
      </div>

      <div className="test-content">
        <div className="feature-test">
          <h3>新增功能测试</h3>
          <p>首页已添加以下新功能：</p>
          <ul>
            <li>🍽️ 饮食记录</li>
            <li>💅 美容医护记录</li>
          </ul>
          <p>这些功能都集成在首页的快速操作区域中。</p>
        </div>

        {pets.length > 0 && (
          <div className="current-pet-info">
            <h3>当前宠物信息</h3>
            <p>宠物名称：{selectedPet?.name}</p>
            <p>宠物种类：{selectedPet?.species}</p>
            <p>宠物年龄：{selectedPet?.age}</p>
          </div>
        )}

        <div className="navigation-test">
          <h3>导航测试</h3>
          <p>点击以下按钮测试导航功能：</p>
          <div className="button-group">
            <button 
              onClick={() => navigate('/app/add-record')}
              className="test-button"
            >
              测试添加记录页面
            </button>
            <button 
              onClick={() => navigate('/app/records')}
              className="test-button"
            >
              测试记录列表页面
            </button>
          </div>
        </div>
      </div>

      <div className="feature-description">
        <h3>功能说明</h3>
        <ul>
          <li><strong>饮食记录</strong>：记录宠物的饮食情况，包括食物种类、喂食时间、食量等信息</li>
          <li><strong>美容医护</strong>：记录宠物的美容和医疗护理，包括洗澡、美容、体检、用药等信息</li>
          <li><strong>快速操作</strong>：首页的快速操作区域现在包含7个功能入口，在大屏幕上显示为一行，在小屏幕上自动换行显示</li>
          <li><strong>响应式设计</strong>：布局会根据屏幕大小自动调整，确保在各种设备上都有良好的显示效果</li>
        </ul>
      </div>
    </div>
  );
}