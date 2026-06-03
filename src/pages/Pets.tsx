import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  Bell,
  Camera,
  Check,
  ChevronDown,
  Eye,
  FileText,
  Heart,
  PawPrint,
  Scale,
  Scissors,
  Shield,
  Sparkles,
  Stethoscope,
  TrendingUp,
  Utensils,
  X,
} from "lucide-react";
import { useShell } from "../hooks/useShell";
import { fetchReminders, fetchRecords, fetchWeights, getLocalToday, fetchAnalysisDashboard } from "../lib/api";
import PetPhotoAvatar from "../components/PetPhotoAvatar";
import { Generate3DButton } from "../components/Pet3DAvatarGenerator";
import { handleAvatarUpload as unifiedHandleUpload, getLocalAvatar, handleAvatarFileUpload, clearLocalAvatar } from "../lib/pet-avatar";

function petEmoji(species?: string) {
  if (species === "cat") return "🐱";
  if (species === "other") return "🐰";
  return "🐕";
}

/**
 * 判断是否为"名字圆形头像"标记（后端返回的 __name_circle__）
 */
function isNameCircleMarker(url?: string | null): boolean {
  return url === "__name_circle__";
}

/**
 * 渲染名字圆形头像组件
 * 当后端返回 __name_circle__ 标记时使用
 */
function PetNameCircle({ name, size = 44 }: { name: string; size?: number }) {
  const char = (name || "宠").charAt(0).toUpperCase();
  return (
    <span
      className="pet-name-circle"
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.42),
        lineHeight: `${size}px`,
      }}
      title={name}
    >
      {char}
    </span>
  );
}

// ── 主页 ──────────────────────────────────────────────────────────────────────
export default function Pets() {
  const navigate = useNavigate();
  const { phone, pets, selectedPet, selectedPetId, setPetId, refreshPets } = useShell();
  const [switchOpen, setSwitchOpen] = useState(false);
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [pendingCount, setPendingCount] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [weightRecords, setWeightRecords] = useState(0);
  const [healthScore, setHealthScore] = useState(0);
  const [scoreGrade, setScoreGrade] = useState("");

  const currentPet = useMemo(() => selectedPet || pets[0] || null, [selectedPet, pets]);

  // 初始化时从 localStorage 读取已保存的头像
  useEffect(() => {
    if (currentPet) {
      const saved = getLocalAvatar(currentPet.id);
      if (saved) setLocalAvatarUrl(saved);
    }
  }, [currentPet?.id, pets]);

  // 合并头像 URL（优先级：localStorage > 后端resolved_url > 服务端原始数据）
  const displayPet = useMemo(() => {
    if (!currentPet) return null;
    // 1. 本地缓存（用户刚上传的，最高优先级）
    const local = localAvatarUrl || getLocalAvatar(currentPet.id);
    if (local) return { ...currentPet, image_url: local };
    // 2. 后端解析后的默认头像 URL（含品种默认图回退）
    if (currentPet._resolved_avatar_url) return { ...currentPet, image_url: currentPet._resolved_avatar_url };
    // 3. 原始数据
    return currentPet;
  }, [currentPet, localAvatarUrl, pets]);

  const activePetId = selectedPetId ?? pets[0]?.id;
  const extraPetCount = Math.max(0, pets.length - 1);

  // 获取待处理提醒数
  useEffect(() => {
    if (!currentPet) return;
    const run = async () => {
      try {
        const remindersResp = await fetchReminders(phone, currentPet.id, "pending");
        setPendingCount((remindersResp.data || []).length); // 统计所有 pending 状态的提醒
      } catch { /* ignore */ }
    };
    run();
  }, [phone, currentPet?.id]);

  // 获取健康概览统计数据（总记录数、体重记录[pet_weight_records表]、健康评分）
  useEffect(() => {
    if (!currentPet || !phone) return;
    const run = async () => {
      // 总记录数
      try {
        const resp = await fetchRecords(phone, currentPet.id, "all");
        setTotalRecords(resp.data?.length || 0);
      } catch { /* ignore */ }

      // 体重数据：使用独立的 pet_weight_records 表（fetchWeights API）
      try {
        const wResp = await fetchWeights(currentPet.id);
        const wList: any[] = wResp?.data || wResp || [];
        setWeightRecords(wList.length);
      } catch { /* weight 获取失败不影响其他统计 */ }

      // ★ 健康评分：优先使用后端6维度加权评分引擎
      try {
        const analysisData = await fetchAnalysisDashboard(currentPet.id);
        setHealthScore(analysisData.overall_score || 0);
        setScoreGrade(analysisData.score_grade || "");
      } catch {
        // 降级兜底：后端不可用时使用前端简单算法
        try {
          const resp = await fetchRecords(phone, currentPet.id, "all");
          const records: any[] = resp.data || [];
          if (records.length === 0) { setHealthScore(0); return; }
          let score = 60;
          score = Math.min(100, score + Math.min(20, records.length * 2));
          const types = new Set(records.map((r: any) => r.record_type || r.type));
          score = Math.min(100, score + (types.size - 1) * 5);
          // 有体重记录时加分
          if (weightRecords > 0) score = Math.min(100, score + 5);
          setHealthScore(score);
          setScoreGrade("");
        } catch { /* ignore */ }
      }
    };
    run();
  }, [phone, currentPet?.id]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  };

  if (!currentPet) {
    return (
      <main className="pet-home-page">
        <section className="pet-home-empty">
          <div className="pet-home-empty-icon">
            <PawPrint size={22} />
          </div>
          <h3>还没有宠物档案</h3>
          <p>请先添加宠物后，再查看首页健康概览。</p>
          <button type="button" className="pet-home-view-all" onClick={() => navigate("/app?add=1")}>
            去添加宠物
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="ph3d-page">
      {/* ═══ 顶部 Hero 区域 - 3D宠物展示 ═══ */}
      <section className="ph3d-hero">
        <div className="ph3d-hero-bg">
          <div className="ph3d-hero-gradient" />
          <div className="ph3d-hero-orb ph3d-orb-1" />
          <div className="ph3d-hero-orb ph3d-orb-2" />
          <div className="ph3d-hero-orb ph3d-orb-3" />
          <div className="ph3d-hero-grid-pattern" />
        </div>
        
        <div className="ph3d-hero-inner">
          {/* 左侧文字 */}
          <div className="ph3d-hero-text">
            <div className="ph3d-hero-badge">
              <Sparkles size={12} />
              <span>健康管家</span>
            </div>
            <h1 className="ph3d-hero-title">
              宠物健康<br /><span className="ph3d-title-accent">管理中心</span>
            </h1>
            <p className="ph3d-hero-desc">为爱宠记录每一个健康时刻</p>
            
            {/* 当前宠物信息 */}
            <div className="ph3d-pet-card">
              <label htmlFor="pets-page-avatar-input" className="ph3d-pet-avatar-wrap" style={{ cursor: "pointer", position: "relative" }}>
                {displayPet?.image_url ? (
                  isNameCircleMarker(displayPet.image_url) ? (
                    <PetNameCircle name={currentPet?.name || '宠物'} size={44} />
                  ) : (
                    <img
                      src={displayPet.image_url}
                      alt={`${currentPet?.name} avatar`}
                      style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover" }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent && !parent.querySelector('.pet-name-circle')) {
                          const fb = document.createElement('span');
                          fb.className = 'pet-name-circle';
                          fb.style.cssText = 'width:44px;height:44px;font-size:18px;line-height:44px;';
                          fb.textContent = (currentPet?.name || '宠').charAt(0).toUpperCase();
                          parent.insertBefore(fb, e.currentTarget);
                        }
                      }}
                    />
                  )
                ) : (
                  currentPet?._resolved_avatar_url && !isNameCircleMarker(currentPet._resolved_avatar_url) ? (
                    <img src={currentPet._resolved_avatar_url} alt={`${currentPet?.name} default`}
                      style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover" }}
                      onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  ) : (
                    <PetNameCircle name={currentPet?.name || '宠物'} size={44} />
                  )
                )}
                <span className="ph3d-pet-online" />
              </label>
              <input
                type="file"
                accept="image/*"
                id="pets-page-avatar-input"
                style={{ display: "none" }}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file || !currentPet) return;
                  // 使用新的文件上传方式（multipart → 后端新 API）
                  const result = await handleAvatarFileUpload(file, currentPet.id, (url) => {
                    // 乐观更新：立即显示压缩后的预览图（毫秒级响应）
                    setLocalAvatarUrl(url);
                    // 注意：不在此处调用 refreshPets()！
                    // 原因：此时 API 请求还在飞行中，DB 还是旧值
                    // refreshPets 移到下面的 upload 完成后统一调用
                  });
                  // 上传完成后：用后端返回的最终URL同步state（确保与localStorage一致）
                  if (result.serverSynced && result.finalUrl && result.finalUrl !== localAvatarUrl) {
                    setLocalAvatarUrl(result.finalUrl);
                    refreshPets();
                  }
                  if (result.error) showToast(result.error);
                  // 重置 file input，允许重复选择同一文件
                  e.target.value = '';
                }}
              />
              <div className="ph3d-pet-detail">
                <strong className="ph3d-pet-name">{currentPet?.name || '我的宠物'}</strong>
                <span className="ph3d-pet-meta">{currentPet?.breed || '健康档案'}</span>
              </div>
              <button type="button" className="ph3d-switch-btn" onClick={() => setSwitchOpen(true)}>
                {extraPetCount > 0 && <span className="ph3d-switch-badge">+{extraPetCount}</span>}
                <ChevronDown size={16} className={switchOpen ? "rotated" : ""} />
              </button>
            </div>
          </div>

          {/* 右侧宠物照片 - 使用 PetPhotoAvatar 组件（支持模板图/名字圆形自动降级） */}
          <div className="ph3d-hero-visual">
            <div className="ph3d-char-stage">
              {currentPet && (
                <PetPhotoAvatar pet={displayPet} size="default" className="hero-circular-avatar" />
              )}
            </div>
            {/* 浮动装饰元素 */}
            <div className="ph3d-float-deco ph3d-float-heart"><Heart size={14} /></div>
            <div className="ph3d-float-deco ph3d-float-star"><Sparkles size={14} /></div>
            <div className="ph3d-float-deco ph3d-float-paw"><PawPrint size={14} /></div>
          </div>
        </div>
      </section>

      {/* ═══ 快速记录区域（宫崎骏手绘治愈风）═══ */}
      <section className="ghibi-quick-section">
        <div className="ghibi-section-head">
          <h3 className="ghibi-section-title">快速记录</h3>
          <span className="ghibi-section-sub">一键记录宠物的健康数据</span>
        </div>

        <div className="ghibi-card-list">
          {/* 体重记录 */}
          <button type="button" className="ghibi-card ghibi-card-weight" onClick={() => navigate(`/app/add-record?type=weight&pet_id=${currentPet?.id}`)}>
            <div className="ghibi-card-icon-wrap ghibli-icon-handdrawn">
              <Scale size={24} strokeWidth={1.5} className="ghibi-card-icon" />
            </div>
            <div className="ghibi-card-content">
              <h4 className="ghibi-card-title">体重记录</h4>
              <p className="ghibi-card-desc">追踪体重变化趋势</p>
              <div className="ghibi-card-footer">
                <span className="ghibi-card-badge">追踪中</span>
                <span className="ghibi-card-arrow">→</span>
              </div>
            </div>
            <div className="ghibi-card-deco ghibi-deco-leaf" />
          </button>

          {/* 疫苗记录 */}
          <button type="button" className="ghibi-card ghibi-card-vaccine" onClick={() => navigate(`/app/add-record?type=vaccine&pet_id=${currentPet?.id}`)}>
            <div className="ghibi-card-icon-wrap ghibli-icon-handdrawn">
              <Shield size={24} strokeWidth={1.5} className="ghibi-card-icon" />
            </div>
            <div className="ghibi-card-content">
              <h4 className="ghibi-card-title">疫苗记录</h4>
              <p className="ghibi-card-desc">管理疫苗接种时间</p>
              <div className="ghibi-card-footer">
                <span className="ghibi-card-badge">管理中</span>
                <span className="ghibi-card-arrow">→</span>
              </div>
            </div>
            <div className="ghibi-card-deco ghibi-deco-flower" />
          </button>

          {/* 驱虫记录 */}
          <button type="button" className="ghibi-card ghibi-card-deworm" onClick={() => navigate(`/app/add-record?type=deworm&pet_id=${currentPet?.id}`)}>
            <div className="ghibi-card-icon-wrap ghibli-icon-handdrawn">
              <Shield size={24} strokeWidth={1.5} className="ghibi-card-icon" />
            </div>
            <div className="ghibi-card-content">
              <h4 className="ghibi-card-title">驱虫记录</h4>
              <p className="ghibi-card-desc">体内外驱虫计划</p>
              <div className="ghibi-card-footer">
                <span className="ghibi-card-badge">计划中</span>
                <span className="ghibi-card-arrow">→</span>
              </div>
            </div>
            <div className="ghibi-card-deco ghibi-deco-star" />
          </button>

          {/* 体检记录 */}
          <button type="button" className="ghibi-card ghibi-card-checkup" onClick={() => navigate(`/app/add-record?type=checkup&pet_id=${currentPet?.id}`)}>
            <div className="ghibi-card-icon-wrap ghibli-icon-handdrawn">
              <Heart size={24} strokeWidth={1.5} className="ghibi-card-icon" />
            </div>
            <div className="ghibi-card-content">
              <h4 className="ghibi-card-title">体检记录</h4>
              <p className="ghibi-card-desc">定期检查档案</p>
              <div className="ghibi-card-footer">
                <span className="ghibi-card-badge">档案中</span>
                <span className="ghibi-card-arrow">→</span>
              </div>
            </div>
            <div className="ghibi-card-deco ghibi-deco-cloud" />
          </button>

          {/* 饮食记录 */}
          <button type="button" className="ghibi-card ghibi-card-diet" onClick={() => navigate(`/app/add-record?type=diet&pet_id=${currentPet?.id}`)}>
            <div className="ghibi-card-icon-wrap ghibli-icon-handdrawn">
              <Utensils size={24} strokeWidth={1.5} className="ghibi-card-icon" />
            </div>
            <div className="ghibi-card-content">
              <h4 className="ghibi-card-title">饮食记录</h4>
              <p className="ghibi-card-desc">每日饮食与营养</p>
              <div className="ghibi-card-footer">
                <span className="ghibi-card-badge">追踪中</span>
                <span className="ghibi-card-arrow">→</span>
              </div>
            </div>
            <div className="ghibi-card-deco ghibi-deco-leaf" />
          </button>

          {/* 美容护理 */}
          <button type="button" className="ghibi-card ghibi-card-beauty" onClick={() => navigate(`/app/add-record?type=beauty&pet_id=${currentPet?.id}`)}>
            <div className="ghibi-card-icon-wrap ghibli-icon-handdrawn">
              <Scissors size={24} strokeWidth={1.5} className="ghibi-card-icon" />
            </div>
            <div className="ghibi-card-content">
              <h4 className="ghibi-card-title">美容护理</h4>
              <p className="ghibi-card-desc">洗浴美容与护理</p>
              <div className="ghibi-card-footer">
                <span className="ghibi-card-badge">护理中</span>
                <span className="ghibi-card-arrow">→</span>
              </div>
            </div>
            <div className="ghibi-card-deco ghibi-deco-sparkle" />
          </button>

          {/* 日常观察 */}
          <button type="button" className="ghibi-card ghibi-card-obs" onClick={() => navigate(`/app/add-record?type=observation&pet_id=${currentPet?.id}`)}>
            <div className="ghibi-card-icon-wrap ghibli-icon-handdrawn">
              <Eye size={24} strokeWidth={1.5} className="ghibi-card-icon" />
            </div>
            <div className="ghibi-card-content">
              <h4 className="ghibi-card-title">日常观察</h4>
              <p className="ghibi-card-desc">行为与健康状态</p>
              <div className="ghibi-card-footer">
                <span className="ghibi-card-badge">观察中</span>
                <span className="ghibi-card-arrow">→</span>
              </div>
            </div>
            <div className="ghibi-card-deco ghibi-deco-petal" />
          </button>

          {/* 智能分析 */}
          <button type="button" className="ghibi-card ghibi-card-ai" onClick={() => navigate("/app/ai-analysis")}>
            <div className="ghibi-card-icon-wrap ghibli-icon-handdrawn ghibli-icon-magic">
              <Sparkles size={24} strokeWidth={1.5} className="ghibi-card-icon" />
            </div>
            <div className="ghibi-card-content">
              <h4 className="ghibi-card-title">智能分析</h4>
              <p className="ghibi-card-desc">AI健康洞察报告</p>
              <div className="ghibi-card-footer">
                <span className="ghibi-card-badge ghibi-badge-magic">AI 分析</span>
                <span className="ghibi-card-arrow">→</span>
              </div>
            </div>
            <div className="ghibi-card-deco ghibi-deco-magic" />
          </button>
        </div>
      </section>

      {/* 切换宠物弹窗 */}
      {switchOpen && (
        <div className="ph3d-modal-overlay" onClick={() => setSwitchOpen(false)}>
          <div className="ph3d-modal" onClick={e => e.stopPropagation()}>
            <div className="ph3d-modal-header">
              <div className="ph3d-modal-icon">
                <PawPrint size={20} />
              </div>
              <div>
                <h4 className="ph3d-modal-title">选择宠物</h4>
                <p className="ph3d-modal-sub">当前有 {pets.length} 只宠物</p>
              </div>
              <button type="button" className="ph3d-modal-close" onClick={() => setSwitchOpen(false)} aria-label="关闭">
                <X size={18} />
              </button>
            </div>
            <div className="ph3d-modal-list">
              {pets.map(p => {
                const active = p.id === activePetId;
                // 头像优先级：localStorage 缓存 > 后端解析URL > 原始数据
                // 与主页面 displayPet 保持一致（第50-59行）
                const localCached = getLocalAvatar(p.id);
                const petAvatarUrl = localCached || p._resolved_avatar_url || p.image_url;
                return (
                  <button key={p.id} type="button" className={`ph3d-modal-item ${active ? "active" : ""}`} onClick={() => {
                    setPetId(p.id);
                    setLocalAvatarUrl(null);
                    setSwitchOpen(false);
                  }}>
                    <span className="ph3d-modal-avatar" title={`DEBUG: avatarUrl=${petAvatarUrl || 'EMPTY'}, resolved=${p._resolved_avatar_url || 'NONE'}`}>
                      {/* DEBUG: 2024-05-24 代码已更新 - 如看到此注释说明新代码生效 */}
                      {petAvatarUrl ? (
                        isNameCircleMarker(petAvatarUrl) ? (
                          <PetNameCircle name={p.name || '宠物'} size={40} />
                        ) : (
                          <img
                            src={petAvatarUrl}
                            alt={p.name}
                            style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
                            onError={(e) => { e.currentTarget.style.display = "none"; }}
                          />
                        )
                      ) : (
                        // 无头像数据时：用 _resolved_avatar_url 或名字圆
                        p._resolved_avatar_url && !isNameCircleMarker(p._resolved_avatar_url) ? (
                          <img src={p._resolved_avatar_url} alt={p.name}
                            style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
                            onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                        ) : (
                          <PetNameCircle name={p.name || '宠物'} size={40} />
                        )
                      )}
                    </span>
                    <div className="ph3d-modal-info">
                      <strong>{p.name}</strong>
                      <span>{p.breed || '宠物'}</span>
                    </div>
                    {active ? <span className="ph3d-modal-check"><Check size={15} /></span> : null}
                  </button>
                );
              })}
            </div>
            <button type="button" className="ph3d-add-pet-btn" onClick={() => { setSwitchOpen(false); navigate("/app?add=1"); }}>
              <PawPrint size={16} />
              添加新宠物
            </button>
          </div>
        </div>
      )}

      {/* Toast 提示 */}
      {toast && <div className="qm-toast">{toast}</div>}
    </main>
  );
}

