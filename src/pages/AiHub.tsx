import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Camera, Images, Smile, Loader2, Send } from "lucide-react";
import { useShell } from "../hooks/useShell";
import { getLocalAvatar } from "../lib/pet-avatar";
import { chatWithPet, fetchPhotoMind } from "../lib/pet-mind.api";
import type { QuotaError } from "../lib/pet-mind.api";
import QuotaHintModal from "../components/PetChat/QuotaHintModal";


interface ChatMsg {
  role: "user" | "pet";
  text: string;
  photoUrl?: string;
}

export default function AiHub() {
  const navigate = useNavigate();
  const { selectedPet } = useShell();
  const petName = selectedPet?.name || "宠物";
  const petImage = selectedPet?.image_url || getLocalAvatar(selectedPet?.id ?? 0) || "";

  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [quotaErrorData, setQuotaErrorData] = useState<QuotaError | null>(null);

  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || !selectedPet || sending) return;
    const msg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: msg }]);
    setSending(true);
    try {
      const res = await chatWithPet(selectedPet.id, msg);
      setMessages((prev) => [...prev, { role: "pet", text: res.reply || "..." }]);
    } catch {
      setMessages((prev) => [...prev, { role: "pet", text: "网络不太好，稍后再试吧~" }]);
    } finally {
      setSending(false);
    }
  }, [input, selectedPet, sending]);

  const handlePhotoUpload = async (file: File) => {
    if (!selectedPet) return;
    setIsAnalyzing(true);
    try {
      const res = await fetchPhotoMind({ pet: selectedPet, imageFile: file });
      if (res.success && res.result) {
        const text = `${res.result.expression}，${res.result.posture}，心情${res.result.mood}。${res.result.mindOs || ""}`;
        setMessages((prev) => [
          ...prev,
          { role: "user", text: "📷 [发送了一张照片]", photoUrl: res.photoUrl || URL.createObjectURL(file) },
          { role: "pet", text },
        ]);
      } else if (res.quotaError) {
        setQuotaErrorData(res.quotaError);
        setShowQuotaModal(true);
      } else {
        setMessages((prev) => [...prev, { role: "pet", text: res.error || "照片分析失败，请重试" }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "pet", text: "照片分析异常，请检查网络" }]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // --- PLACEHOLDER_RENDER ---
  if (!selectedPet) {
    return (
      <div className="petos-page">
        <div className="petos-content">
          <GlassNav rightSlot={null} />
          <div className="petos-greet">
            <div className="petos-greet__name">AI 伙伴</div>
            <div className="petos-greet__hi" style={{ marginTop: 4 }}>请先选择一只宠物</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="petos-page" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div className="petos-content" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        <div className="petos-greet">
          <div className="petos-greet__name">AI 伙伴</div>
          <div className="petos-greet__hi" style={{ marginTop: 4 }}>和{petName}聊聊天，或拍张照读懂TA的心</div>
        </div>

        {/* Chat area */}
        <div className="ai-hub-chat" style={{ flex: 1, overflowY: "auto", padding: "0 16px 16px" }}>
          {messages.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--color-text-secondary, #999)" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🐾</div>
              <p style={{ fontSize: 14 }}>发条消息或拍张照片开始互动吧</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  maxWidth: "75%",
                  padding: "10px 14px",
                  borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  background: msg.role === "user" ? "var(--color-primary, #6366F1)" : "var(--color-surface, #F3F4F6)",
                  color: msg.role === "user" ? "#fff" : "var(--color-text-primary, #1F2937)",
                  fontSize: 14,
                  lineHeight: 1.5,
                }}
              >
                {msg.photoUrl && (
                  <img src={msg.photoUrl} alt="" style={{ width: "100%", borderRadius: 8, marginBottom: 6 }} />
                )}
                {msg.text}
              </div>
            </div>
          ))}
          {(sending || isAnalyzing) && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#999", fontSize: 13 }}>
              <Loader2 size={14} className="spin" />
              <span>{isAnalyzing ? "正在分析照片..." : `${petName}正在思考...`}</span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input bar */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8, padding: "12px 16px",
          borderTop: "1px solid var(--color-border, #E5E7EB)", background: "var(--color-bg, #fff)",
        }}>
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", border: "none", background: "#F3F4F6", cursor: "pointer" }}
            aria-label="拍照"
          >
            <Camera size={18} color="#6B7280" />
          </button>
          <button
            type="button"
            onClick={() => galleryRef.current?.click()}
            style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", border: "none", background: "#F3F4F6", cursor: "pointer" }}
            aria-label="相册"
          >
            <Images size={18} color="#6B7280" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
            placeholder={`对${petName}说点什么...`}
            style={{
              flex: 1, height: 38, borderRadius: 19, border: "1px solid #E5E7EB",
              padding: "0 14px", fontSize: 14, outline: "none",
            }}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || sending}
            style={{
              width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
              borderRadius: "50%", border: "none",
              background: input.trim() ? "#6366F1" : "#E5E7EB",
              cursor: input.trim() ? "pointer" : "default",
            }}
            aria-label="发送"
          >
            <Send size={16} color={input.trim() ? "#fff" : "#9CA3AF"} />
          </button>
        </div>

        {/* Hidden file inputs */}
        <input type="file" accept="image/*" capture="environment" ref={cameraRef} style={{ display: "none" }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f); e.target.value = ""; }} />
        <input type="file" accept="image/*" ref={galleryRef} style={{ display: "none" }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f); e.target.value = ""; }} />
      </div>

      {showQuotaModal && quotaErrorData && (
        <QuotaHintModal quota={quotaErrorData} onClose={() => setShowQuotaModal(false)} />
      )}
    </div>
  );
}
