import { useCallback, useEffect, useMemo, useState } from "react";
import { loadWorkspaceActivity, type WorkspaceActivityItem } from "@/lib/modules/activity";
import type { OrbyvenModuleId } from "@/lib/orbyven-modules";
import type { OrbyvenWorkspace } from "@/lib/orbyven-workspace";

type Props = {
  organizationId: string;
  locale: string;
  timeZone: string;
  role: OrbyvenWorkspace["membership"]["role"];
  enabledModules: OrbyvenModuleId[];
  onOpenModule: (moduleId: OrbyvenModuleId) => void;
};

export default function DesktopActivityCenter({
  organizationId,
  locale,
  timeZone,
  role,
  enabledModules,
  onOpenModule,
}: Props) {
  const [items, setItems] = useState<WorkspaceActivityItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const canAccessFinances = ["owner", "admin", "manager"].includes(role);
  const urgentCount = useMemo(
    () => items.filter((item) => item.level === "urgent").length,
    [items],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setItems(await loadWorkspaceActivity(
        organizationId,
        enabledModules,
        canAccessFinances,
        locale,
        timeZone,
      ));
    } catch (cause) {
      console.error("Desktop activity center:", cause);
      setError("Atenționările nu au putut fi actualizate.");
    } finally {
      setLoading(false);
    }
  }, [organizationId, enabledModules, canAccessFinances, locale, timeZone]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    const refresh = window.setInterval(() => void load(), 5 * 60 * 1000);
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearTimeout(timer);
      window.clearInterval(refresh);
      window.removeEventListener("focus", onFocus);
    };
  }, [load]);

  const openItem = (item: WorkspaceActivityItem) => {
    setOpen(false);
    onOpenModule(item.module);
  };

  return (
    <div className="desktop-activity">
      <button
        type="button"
        className="icon-button activity-trigger"
        aria-label="Deschide atenționările"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span aria-hidden="true">◔</span>
        {items.length > 0 && (
          <span className={"activity-count " + (urgentCount ? "urgent" : "")}>
            {items.length > 99 ? "99+" : items.length}
          </span>
        )}
      </button>

      {open && (
        <>
          <button className="popover-backdrop" aria-label="Închide atenționările" onClick={() => setOpen(false)} />
          <section className="activity-popover" role="dialog" aria-label="Atenționări ORBYVEN">
            <header className="activity-popover-head">
              <div>
                <p className="eyebrow">ORBYVEN · AUTOMATION</p>
                <h2>Ce necesită atenție</h2>
                <p>Semnale cross-module și următorul pas potrivit.</p>
              </div>
              <button className="icon-button" type="button" disabled={loading} onClick={() => void load()}>↻</button>
            </header>
            <div className="activity-popover-body">
              {loading && !items.length ? (
                <p className="activity-empty">Se verifică activitatea...</p>
              ) : error ? (
                <p className="activity-error">{error}</p>
              ) : items.length ? (
                <div className="activity-list">
                  {items.map((item) => (
                    <button key={item.key} className="activity-item" onClick={() => openItem(item)}>
                      <span className={"activity-level " + item.level} />
                      <span className="activity-copy">
                        <strong>{item.title}</strong>
                        <small>{item.meta}</small>
                      </span>
                      <span className="activity-action">{item.actionLabel || "Deschide"} →</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="activity-empty-card">
                  <strong>Totul este în ordine.</strong>
                  <span>Nu există semnale operaționale care cer intervenție.</span>
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
