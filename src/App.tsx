import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import AppShell from "./components/AppShell";
import { getSessionUser } from "./lib/session";
import AddRecord from "./pages/AddRecord";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Mine from "./pages/Mine";
import Pets from "./pages/Pets";
import Records from "./pages/Records";
import AiAnalysis from "./pages/AiAnalysis";
import BeautyAnalysis from "./pages/BeautyAnalysis";
import RecordsCalendar from "./pages/RecordsCalendar";
import Register from "./pages/Register";
import Reminders from "./pages/Reminders";
import ReminderSettings from "./pages/ReminderSettings";
import FeedbackCenter from "./pages/FeedbackCenter";
import HelpCenter from "./pages/HelpCenter";
import PrivacySettings from "./pages/PrivacySettings";
import TokenRefreshTest from "./pages/TokenRefreshTest";
import TestNewFeatures from "./pages/TestNewFeatures";
import PetChat from "./pages/PetChat";
import WeightTrendAnalysis from "./pages/WeightTrendAnalysis";
import HealthReportAnalysis from "./pages/HealthReportAnalysis";
import DietAnalysis from "./pages/DietAnalysis";
import ExerciseAnalysis from "./pages/ExerciseAnalysis";

function RequireAuth() {
  const user = getSessionUser();
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<RequireAuth />}>
          <Route path="/app" element={<AppShell />}>
            <Route index element={<Dashboard />} />
            <Route path="mine" element={<Mine />} />
            <Route path="pets" element={<Pets />} />
            <Route path="records" element={<Records />} />
            <Route path="records-calendar" element={<RecordsCalendar />} />
            <Route path="add-record" element={<AddRecord />} />
            <Route path="reminders" element={<Reminders />} />
            <Route path="ai-analysis" element={<AiAnalysis />} />
            <Route path="beauty-analysis" element={<BeautyAnalysis />} />
            <Route path="weight-trend-analysis" element={<WeightTrendAnalysis />} />
            <Route path="health-report-analysis" element={<HealthReportAnalysis />} />
            <Route path="diet-analysis" element={<DietAnalysis />} />
            <Route path="exercise-analysis" element={<ExerciseAnalysis />} />
            <Route path="reminder-settings" element={<ReminderSettings />} />
            <Route path="feedback" element={<FeedbackCenter />} />
            <Route path="help" element={<HelpCenter />} />
            <Route path="privacy" element={<PrivacySettings />} />
            <Route path="chat" element={<PetChat />} />
          </Route>
        </Route>

        <Route path="token-refresh-test" element={<TokenRefreshTest />} />
        <Route path="test-new-features" element={<TestNewFeatures />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
