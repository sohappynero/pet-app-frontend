import { HashRouter, Navigate, Outlet, Route, Routes, useParams, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import AppShell from "./components/AppShell";
import { getSessionUser } from "./lib/session";
import { refreshToken } from "./lib/api";
import AddRecord from "./pages/AddRecord";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Mine from "./pages/Mine";
import Pets from "./pages/Pets";
import Records from "./pages/Records";
import RecordDetail from "./pages/RecordDetail";
import BeautyAnalysis from "./pages/BeautyAnalysis";
import RecordsCalendar from "./pages/RecordsCalendar";
import Register from "./pages/Register";
import Reminders from "./pages/Reminders";
import ReminderSettings from "./pages/ReminderSettings";
import FeedbackCenter from "./pages/FeedbackCenter";
import HelpCenter from "./pages/HelpCenter";
import PrivacySettings from "./pages/PrivacySettings";
import PetChat from "./pages/PetChat";
import VipSubscribe from "./pages/VipSubscribe";
import FeatureVote from "./pages/FeatureVote";
import WeightTrendAnalysis from "./pages/WeightTrendAnalysis";
import HealthReportAnalysis from "./pages/HealthReportAnalysis";
import DietAnalysis from "./pages/DietAnalysis";
import ExerciseAnalysis from "./pages/ExerciseAnalysis";
import HomePetOS from "./pages/HomePetOS";
import AiAnalysis from "./pages/AiAnalysis";
import AiHub from "./pages/AiHub";
import VipHub from "./pages/VipHub";
import Timeline from "./pages/Timeline";

// 判断登录态：有 token 直接ok；无 token 但有 refresh_token 则尝试自动续期
function useAuthState() {
  const [state, setState] = useState<"checking" | "ok" | "no">("checking");

  useEffect(() => {
    const user = getSessionUser();
    if (user?.token) {
      setState("ok");
      return;
    }

    // 无 user/token，但有 refresh_token → 尝试启动自动续期
    const rt = localStorage.getItem("pet_refresh_token_v1");
    if (!rt) {
      setState("no");
      return;
    }

    refreshToken()
      .then(() => setState("ok"))
      .catch(() => setState("no"));
  }, []);

  return state;
}

function AuthLoading() {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      color: "#5C635D"
    }}>
      加载中…
    </div>
  );
}

function RequireAuth() {
  const state = useAuthState();
  if (state === "checking") return <AuthLoading />;
  if (state === "no") return <Navigate to="/login" replace />;
  return <Outlet />;
}

// 根路径智能入口：已登录进主页，未登录去登录页（修复冷启动无条件跳登录页的问题）
function RootRedirect() {
  const state = useAuthState();
  if (state === "checking") return <AuthLoading />;
  if (state === "no") return <Navigate to="/login" replace />;
  return <Navigate to="/app" replace />;
}

function RedirectRecordDetail() {
  const { id } = useParams();
  const [search] = useSearchParams();
  const qs = search.toString();
  return <Navigate to={`/app/timeline/record/${id}${qs ? `?${qs}` : ""}`} replace />;
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<RequireAuth />}>
          <Route path="/app" element={<AppShell />}>
            {/* Home */}
            <Route index element={<HomePetOS />} />

            {/* Records (记录 Tab) */}
            <Route path="records" element={<Timeline />} />
            <Route path="records/list" element={<Records />} />
            <Route path="records/detail/:id" element={<RecordDetail />} />
            <Route path="records/add" element={<AddRecord />} />
            <Route path="records/calendar" element={<RecordsCalendar />} />

            {/* AI Tab */}
            <Route path="ai" element={<AiHub />} />
            <Route path="chat" element={<AiHub />} />

            {/* 会员专区 (从我的页面进入) */}
            <Route path="insights" element={<VipHub />} />
            <Route path="insights/analysis" element={<AiAnalysis />} />
            <Route path="insights/beauty" element={<BeautyAnalysis />} />
            <Route path="insights/weight" element={<WeightTrendAnalysis />} />
            <Route path="insights/health" element={<HealthReportAnalysis />} />
            <Route path="insights/diet" element={<DietAnalysis />} />
            <Route path="insights/exercise" element={<ExerciseAnalysis />} />

            {/* Timeline legacy */}
            <Route path="timeline" element={<Timeline />} />
            <Route path="timeline/records" element={<Records />} />
            <Route path="timeline/record/:id" element={<RecordDetail />} />
            <Route path="timeline/add-record" element={<AddRecord />} />
            <Route path="timeline/calendar" element={<RecordsCalendar />} />

            {/* Mine */}
            <Route path="mine" element={<Mine />} />
            <Route path="mine/pets" element={<Pets />} />
            <Route path="mine/reminders" element={<Reminders />} />
            <Route path="mine/reminder-settings" element={<ReminderSettings />} />
            <Route path="mine/vip" element={<VipSubscribe />} />
            <Route path="mine/privacy" element={<PrivacySettings />} />
            <Route path="mine/help" element={<HelpCenter />} />
            <Route path="mine/feedback" element={<FeedbackCenter />} />
            <Route path="mine/feature-vote" element={<FeatureVote />} />

            {/* Onboarding */}
            <Route path="pets/add" element={<Dashboard />} />

            {/* Legacy redirects */}
            <Route path="records" element={<Navigate to="/app/timeline/records" replace />} />
            <Route path="record/:id" element={<RedirectRecordDetail />} />
            <Route path="add-record" element={<Navigate to="/app/timeline/add-record" replace />} />
            <Route path="records-calendar" element={<Navigate to="/app/timeline/calendar" replace />} />
            <Route path="reminders" element={<Navigate to="/app/mine/reminders" replace />} />
            <Route path="pets" element={<Navigate to="/app/mine/pets" replace />} />
            <Route path="beauty-analysis" element={<Navigate to="/app/insights/beauty" replace />} />
            <Route path="weight-trend-analysis" element={<Navigate to="/app/insights/weight" replace />} />
            <Route path="health-report-analysis" element={<Navigate to="/app/insights/health" replace />} />
            <Route path="diet-analysis" element={<Navigate to="/app/insights/diet" replace />} />
            <Route path="exercise-analysis" element={<Navigate to="/app/insights/exercise" replace />} />
            <Route path="reminder-settings" element={<Navigate to="/app/mine/reminder-settings" replace />} />
            <Route path="feedback" element={<Navigate to="/app/mine/feedback" replace />} />
            <Route path="help" element={<Navigate to="/app/mine/help" replace />} />
            <Route path="privacy" element={<Navigate to="/app/mine/privacy" replace />} />
            <Route path="vip-subscribe" element={<Navigate to="/app/mine/vip" replace />} />
            <Route path="feature-vote" element={<Navigate to="/app/mine/feature-vote" replace />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
