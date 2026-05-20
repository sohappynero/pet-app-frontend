import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Bell, Trash2, RotateCcw } from "lucide-react";

const RING_OPTIONS = ["默认铃声", "柔和铃声", "提醒铃声", "紧急铃声"];
const VIBRATE_SHORT = ["轻微", "中等", "强烈"];

type NotifyMode = "sound" | "vibrate";

export default function ReminderSettings() {
  const navigate = useNavigate();

  const [notifyEnabled, setNotifyEnabled] = useState(true);
  const [notifyMode, setNotifyMode]       = useState<NotifyMode>("sound");
  const [selectedRing, setSelectedRing]   = useState("提醒铃声");
  const [selectedVibrate, setSelectedVibrate] = useState("轻微");
  const [advanceDay, setAdvanceDay]       = useState(1);
  const [snoozeMins, setSnoozeMins]       = useState(5);

  const doneCount = 10;
  const overdueCount = 5;

  const handleSave = () => { navigate(-1); };

  return (
    <div className="rs-page">
      <div className="rs-header">
        <button className="rs-back-btn" onClick={() => navigate(-1)} aria-label="返回">
          <ChevronLeft size={22} />
        </button>
        <span className="rs-header-title">提醒设置</span>
      </div>

      <div className="rs-body">

        {/* 通知设置 */}
        <div className="rs-card">
          <div className="rs-section-title">
            <Bell size={18} className="rs-section-icon" />
            <span>通知设置</span>
          </div>

          <div className="rs-row">
            <div className="rs-row-left">
              <span className="rs-row-label">启用通知</span>
              <span className="rs-row-desc">接收提醒推送通知</span>
            </div>
            <button
              className={`rs-toggle ${notifyEnabled ? "on" : ""}`}
              onClick={() => setNotifyEnabled((v) => !v)}
              aria-label="启用通知"
            >
              <span className="rs-toggle-thumb" />
            </button>
          </div>
        </div>

        {/* 提醒方式 */}
        <div className="rs-card">
          <div className="rs-section-title" style={{ marginBottom: 12 }}>
            <span>提醒方式</span>
          </div>

          {/* 声音提醒 选项卡 */}
          <div
            className={`rs-mode-card ${notifyMode === "sound" ? "active" : ""}`}
            onClick={() => setNotifyMode("sound")}
          >
            <div className="rs-mode-header">
              <span className={`rs-radio ${notifyMode === "sound" ? "on" : ""}`} />
              <div className="rs-mode-info">
                <span className="rs-mode-label">声音提醒</span>
                <span className="rs-mode-desc">提醒时播放提示音</span>
              </div>
            </div>

            {notifyMode === "sound" && (
              <>
                <div className="rs-mode-divider" />
                <p className="rs-sub-label" style={{ marginTop: 10 }}>选择铃声</p>
                <div className="rs-option-list">
                  {RING_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      className={`rs-option-btn ${selectedRing === opt ? "active" : ""}`}
                      onClick={(e) => { e.stopPropagation(); setSelectedRing(opt); }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div style={{ height: 10 }} />

          {/* 震动提醒 选项卡 */}
          <div
            className={`rs-mode-card ${notifyMode === "vibrate" ? "active" : ""}`}
            onClick={() => setNotifyMode("vibrate")}
          >
            <div className="rs-mode-header">
              <span className={`rs-radio ${notifyMode === "vibrate" ? "on" : ""}`} />
              <div className="rs-mode-info">
                <span className="rs-mode-label">震动提醒</span>
                <span className="rs-mode-desc">提醒时震动设备</span>
              </div>
            </div>

            {notifyMode === "vibrate" && (
              <>
                <div className="rs-mode-divider" />
                <p className="rs-sub-label" style={{ marginTop: 10 }}>震动强度</p>
                <div className="rs-vibrate-row">
                  {VIBRATE_SHORT.map((opt) => (
                    <button
                      key={opt}
                      className={`rs-vibrate-btn ${selectedVibrate === opt ? "active" : ""}`}
                      onClick={(e) => { e.stopPropagation(); setSelectedVibrate(opt); }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* 提前提醒 & 贪睡 */}
        <div className="rs-card">
          <div className="rs-row">
            <div className="rs-row-left">
              <span className="rs-row-label">提前提醒</span>
              <span className="rs-row-desc">在提醒日期前多少天开始通知</span>
            </div>
            <div className="rs-stepper">
              <button className="rs-stepper-btn" onClick={() => setAdvanceDay((v) => Math.max(0, v - 1))}>−</button>
              <span className="rs-stepper-val">{advanceDay} 天</span>
              <button className="rs-stepper-btn" onClick={() => setAdvanceDay((v) => v + 1)}>+</button>
            </div>
          </div>
          <div className="rs-divider" />
          <div className="rs-row">
            <div className="rs-row-left">
              <span className="rs-row-label">贪睡时间</span>
              <span className="rs-row-desc">忽略提醒后多久再次通知</span>
            </div>
            <div className="rs-stepper">
              <button className="rs-stepper-btn" onClick={() => setSnoozeMins((v) => Math.max(1, v - 1))}>−</button>
              <span className="rs-stepper-val">{snoozeMins} 分钟</span>
              <button className="rs-stepper-btn" onClick={() => setSnoozeMins((v) => v + 1)}>+</button>
            </div>
          </div>
        </div>

        {/* 高级设置 */}
        <div className="rs-card">
          <div className="rs-section-title">
            <Trash2 size={18} className="rs-section-icon" />
            <span>高级设置</span>
          </div>

          <button className="rs-action-row">
            <span>清除所有已完成提醒</span>
            <span className="rs-action-badge">共 {doneCount} 条</span>
          </button>

          <div className="rs-divider" />

          <button className="rs-action-row">
            <span>清除所有过期提醒</span>
            <span className="rs-action-badge">共 {overdueCount} 条</span>
          </button>

          <div className="rs-divider" />

          <button className="rs-action-row rs-reset-row">
            <RotateCcw size={16} />
            <span>重置默认设置</span>
          </button>
        </div>

      </div>

      {/* 底部保存按钮 */}
      <div className="rs-footer">
        <button className="rs-save-btn" onClick={handleSave}>保存设置</button>
      </div>
    </div>
  );
}
