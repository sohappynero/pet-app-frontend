import { useOutletContext } from "react-router-dom";
import type { ShellContext } from "../components/AppShell";

export function useShell() {
  return useOutletContext<ShellContext>();
}
