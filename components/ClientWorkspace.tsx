"use client";

import BrandLogo from "@/components/BrandLogo";
import WorkspaceShell from "@/components/WorkspaceShell";
import WorkspaceStateScreen from "@/components/WorkspaceStateScreen";
import { orbyvenSupabase } from "@/lib/orbyven-supabase";
import { getCurrentWorkspace, type OrbyvenWorkspace } from "@/lib/orbyven-workspace";
import { workspaceThemeVars, type WorkspaceTheme } from "@/lib/workspace-ui";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function ClientWorkspace() {
  const router = useRouter();
  const [workspace, setWorkspace] = useState<OrbyvenWorkspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [theme, setTheme] = useState<WorkspaceTheme>("dark");

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const nextWorkspace = await getCurrentWorkspace();
      if (!nextWorkspace) {
        const { data: authData, error: authError } = await orbyvenSupabase.auth.getUser();
        if (authError) throw authError;
        if (!authData.user) {
          router.replace("/workspace/login");
          return;
        }
        setLoadError("Contul este autentificat, dar nu are încă un workspace ORBYVEN atribuit.");
        setLoading(false);
        return;
      }
      setWorkspace(nextWorkspace);
    } catch (error) {
      console.error(error);
      setLoadError("Workspace-ul nu a putut fi încărcat. Încearcă din nou.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("orbyven-dashboard-theme");
    if (savedTheme === "light" || savedTheme === "dark") setTheme(savedTheme);
    const timer = window.setTimeout(() => void loadWorkspace(), 0);
    return () => window.clearTimeout(timer);
  }, [loadWorkspace]);

  const logout = async () => {
    await orbyvenSupabase.auth.signOut();
    router.replace("/workspace/login");
  };

  const vars = workspaceThemeVars(theme);

  if (loading) {
    return <WorkspaceStateScreen vars={vars} theme={theme} title="Se pregătește workspace-ul..." />;
  }

  if (loadError || !workspace) {
    return (
      <WorkspaceStateScreen
        vars={vars}
        theme={theme}
        title="Workspace indisponibil"
        description={loadError}
        actionLabel="Încearcă din nou"
        onAction={loadWorkspace}
        secondaryLabel="Delogare"
        onSecondary={logout}
      />
    );
  }

  return (
    <WorkspaceShell
      initialWorkspace={workspace}
      brand={(shellTheme) => <BrandLogo compact theme={shellTheme} />}
      onLogout={logout}
    />
  );
}
