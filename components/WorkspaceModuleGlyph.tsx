import type { OrbyvenModuleId } from "@/lib/orbyven-modules";

const modulePaths: Record<OrbyvenModuleId, string> = {
  overview: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
  leads: "M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2z M9 10a4 4 0 1 0 0-8a4 4 0 0 0 0 8z M18 8a3 3 0 0 1 0 6 M18 16a4 4 0 0 1 4 4",
  tasks: "M8 3h8v3H8z M8 5H5v16h14V5h-3 M9 12l2 2 4-4 M9 18h6",
  calendar: "M3 5h18v16H3z M3 10h18 M7 2v6 M17 2v6 M8 15h3 M8 18h3",
  estimates: "M5 2h10l4 4 4v16H5z M15 2v5h4 M8 12h8 M8 16h8 M8 19h5".replace("4 4", "l4 4"),
  documents: "M5 3h10l4 4v14H5z M15 3v5h4 M8 12h8 M8 16h8",
  inventory: "M4 6h16v14H4z M7 6V3h10v3 M8 10h8 M8 14h3 M14 14h2 M8 18h8",
  expenses: "M3 6h18v14H3z M3 10h18 M16 16h3 M6 3h12",
  thermal: "M3 20h18 M5 20V9l7-6 7 6v11 M8 20v-5h8v5 M7 11h10 M12 8v5",
  team: "M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 10a4 4 0 1 0 0-8a4 4 0 0 0 0 8 M18 8a3 3 0 0 1 0 6 M18 16a4 4 0 0 1 4 4",
};

export default function WorkspaceModuleGlyph({
  id,
  className = "h-[16px] w-[16px] shrink-0",
}: {
  id: OrbyvenModuleId;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d={modulePaths[id]} />
    </svg>
  );
}
