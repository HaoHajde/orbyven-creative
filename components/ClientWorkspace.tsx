"use client";

import WorkspaceShell from "@/components/WorkspaceShell";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

export default function ClientWorkspace() {
  const router = useRouter();
  const goToLogin = useCallback(() => {
    router.replace("/workspace/login");
  }, [router]);
  const openPath = useCallback((href: string) => {
    router.push(href);
  }, [router]);

  return (
    <WorkspaceShell
      onUnauthenticated={goToLogin}
      onSignedOut={goToLogin}
      onOpenPath={openPath}
    />
  );
}
