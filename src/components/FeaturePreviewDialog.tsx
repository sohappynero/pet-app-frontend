import { useEffect } from "react";
import { X } from "lucide-react";

// key → 预览文件路径映射
const PREVIEW_MAP: Record<string, string> = {
  pet_location: "/previews/preview-pet-location.html",
  city_chat: "/previews/preview-city-chat.html",
  pet_match: "/previews/preview-pet-match.html",
};

interface Props {
  open: boolean;
  candidateKey: string;
  candidateTitle: string;
  onClose: () => void;
}

export default function FeaturePreviewDialog({
  open,
  candidateKey,
  candidateTitle,
  onClose,
}: Props) {
  // 锁定背景滚动
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const previewUrl = PREVIEW_MAP[candidateKey];

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* 遮罩 */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* 弹窗内容 */}
      <div className="relative mt-12 mx-3 mb-6 flex-1 flex flex-col rounded-2xl bg-white overflow-hidden shadow-2xl">
        {/* 顶部栏 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              {candidateTitle}
            </h3>
            <p className="text-[10px] text-gray-400 mt-0.5">概念预览 · 最终效果可能有所不同</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* iframe 展示预览 */}
        {previewUrl ? (
          <iframe
            src={previewUrl}
            className="flex-1 w-full border-0"
            title={`${candidateTitle} 概念预览`}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            暂无预览
          </div>
        )}
      </div>
    </div>
  );
}

// 判断某个候选功能是否有预览可用
export function hasPreview(key: string): boolean {
  return key in PREVIEW_MAP;
}
