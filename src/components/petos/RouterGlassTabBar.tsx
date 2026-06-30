import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import GlassTabBar from "./GlassTabBar";
import AddRecordSheet from "./AddRecordSheet";

const TAB_TO_PATH = {
  home: "/app",
  records: "/app/records/list",
  add: "/app/add",
  ai: "/app/insights",
  mine: "/app/mine",
} as const;

type TabKey = keyof typeof TAB_TO_PATH;

function pathToTabKey(pathname: string): TabKey | "" {
  if (pathname === "/app" || pathname === "/app/") return "home";
  if (pathname.startsWith("/app/records") || pathname.startsWith("/app/timeline")) return "records";
  if (pathname.startsWith("/app/insights") || pathname.startsWith("/app/ai") || pathname.startsWith("/app/chat")) return "ai";
  if (pathname.startsWith("/app/mine")) return "mine";
  if (pathname.startsWith("/app/add")) return "add";
  return "";
}

export default function RouterGlassTabBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const activeKey = pathToTabKey(location.pathname);
  const [showAddSheet, setShowAddSheet] = useState(false);

  return (
    <>
      <GlassTabBar
        activeKey={activeKey}
        onChange={(key) => {
          if (key === "add") {
            setShowAddSheet(true);
            return;
          }
          const path = TAB_TO_PATH[key as TabKey];
          if (path) navigate(path);
        }}
      />
      <AddRecordSheet
        open={showAddSheet}
        onClose={() => setShowAddSheet(false)}
      />
    </>
  );
}
