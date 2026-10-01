"use client";

import WorkspaceShell from "@/components/WorkspaceShell";
import { useRouter } from "next/navigation";

export default function ClientWorkspace() {
  const router = useRouter();

  return (
    <WorkspaceShell
      onUnauthenticated={() => router.replace("/workspace/login")}
      onSignedOut={() => router.replace("/workspace/login")}
      onOpenPath={(href) => router.push(href)}
    />
  );
}
