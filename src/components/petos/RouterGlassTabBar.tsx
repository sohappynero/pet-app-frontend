import { useLocation, useNavigate } from "react-router-dom";
import GlassTabBar from "./GlassTabBar";

const TAB_TO_PATH = {
  home: "/app",
  insights: "/app/insights",
  timeline: "/app/timeline",
  mine: "/app/mine",
} as const;

type TabKey = keyof typeof TAB_TO_PATH;

function pathToTabKey(pathname: string): TabKey | "" {
  if (pathname === "/app" || pathname === "/app/") return "home";
  if (pathname.startsWith("/app/insights")) return "insights";
  if (pathname.startsWith("/app/timeline")) return "timeline";
  if (pathname.startsWith("/app/mine")) return "mine";
  return "";
}

export default function RouterGlassTabBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const activeKey = pathToTabKey(location.pathname);

  return (
    <GlassTabBar
      activeKey={activeKey}
      onChange={(key) => {
        const path = TAB_TO_PATH[key as TabKey];
        if (path) navigate(path);
      }}
    />
  );
}
