import { WORKSPACE_UI_CONTRACT, isWorkspaceUiContract, type WorkspaceUiContract } from "@/lib/workspace-ui-contract";

const UI_ENDPOINT = "https://orbyven.ro/api/desktop/ui";
const CACHE_KEY = "orbyven-desktop-ui-contract-v1";

function readCachedContract(): WorkspaceUiContract | null {
  try {
    const value = localStorage.getItem(CACHE_KEY);
    if (!value) return null;
    const parsed: unknown = JSON.parse(value);
    return isWorkspaceUiContract(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function getInitialUiContract(): WorkspaceUiContract {
  return readCachedContract() ?? WORKSPACE_UI_CONTRACT;
}

export async function loadLiveUiContract(): Promise<WorkspaceUiContract> {
  try {
    const response = await fetch(UI_ENDPOINT, {
      method: "GET",
      cache: "no-store",
      credentials: "omit",
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error("UI contract unavailable");
    const parsed: unknown = await response.json();
    if (!isWorkspaceUiContract(parsed)) throw new Error("Invalid UI contract");
    localStorage.setItem(CACHE_KEY, JSON.stringify(parsed));
    return parsed;
  } catch {
    return getInitialUiContract();
  }
}
