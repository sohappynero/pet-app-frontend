import { useNavigate } from "react-router-dom";
import { Scale, UtensilsCrossed, Syringe, Bug, Stethoscope, ClipboardCheck, Sparkles, Eye, X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

const RECORD_TYPES = [
  { key: "weight", label: "体重", icon: Scale, color: "#6366F1" },
  { key: "diet", label: "喂食", icon: UtensilsCrossed, color: "#F59E0B" },
  { key: "vaccine", label: "疫苗", icon: Syringe, color: "#10B981" },
  { key: "deworm", label: "驱虫", icon: Bug, color: "#8B5CF6" },
  { key: "visit", label: "就诊", icon: Stethoscope, color: "#EF4444" },
  { key: "checkup", label: "体检", icon: ClipboardCheck, color: "#3B82F6" },
  { key: "beauty", label: "美容", icon: Sparkles, color: "#EC4899" },
  { key: "observation", label: "观察", icon: Eye, color: "#14B8A6" },
] as const;

export default function AddRecordSheet({ open, onClose }: Props) {
  const navigate = useNavigate();

  if (!open) return null;

  const handleSelect = (type: string) => {
    onClose();
    navigate(`/app/records/add?type=${type}`);
  };

  return (
    <>
      {/* backdrop */}
      <div
        className="fixed inset-0 z-[998] bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      {/* sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-[999] bg-white rounded-t-[20px] px-5 pt-5 pb-8 shadow-[0_-8px_30px_rgba(0,0,0,0.12)]"
        style={{ animation: "modal-slide-up 0.24s ease" }}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-gray-800">添加记录</h3>
          <button
            type="button"
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100"
            onClick={onClose}
            aria-label="关闭"
          >
            <X size={18} color="#666" />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {RECORD_TYPES.map(({ key, label, icon: Icon, color }) => (
            <button
              key={key}
              type="button"
              className="flex flex-col items-center gap-2 py-3 rounded-xl bg-gray-50 active:bg-gray-100 transition-colors"
              onClick={() => handleSelect(key)}
            >
              <div
                className="w-11 h-11 flex items-center justify-center rounded-full"
                style={{ backgroundColor: `${color}15` }}
              >
                <Icon size={22} color={color} />
              </div>
              <span className="text-xs text-gray-700 font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
