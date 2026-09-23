/** The same CSS-only orbital backdrop for login and authenticated workspace. */
export default function WorkspaceOrbitBackground({ fixed = false }: { fixed?: boolean }) {
  return (
      <div aria-hidden="true" className={fixed ? "pointer-events-none fixed inset-0 z-0 overflow-hidden" : "pointer-events-none absolute inset-0 z-0 overflow-hidden"}
        <div className="absolute inset-0" style={{
          background: [
            "radial-gradient(ellipse 48% 43% at 12% 35%, rgba(29,78,235,0.27), transparent 83%)",
            "radial-gradient(ellipse 44% 42% at 87% 65%, rgba(79,50,192,0.26), transparent 82%)",
            "radial-gradient(ellipse 38% 31% at 56% 93%, rgba(26,63,168,0.13), transparent 83%)",
            "linear-gradient(140deg, #0a1022 0%, #070a15 51%, #0a0e20 100%)",
          ].join(","),
        }} />
        <div className="absolute left-[-12%] top-[16%] h-[38%] w-[48%] rounded-full opacity-75 md:blur-[65px]" style={{
          background: "radial-gradient(ellipse at center,rgba(47,94,245,0.31),rgba(30,59,145,0.08) 44%,transparent 72%)",
        }} />
        <div className="absolute right-[-14%] top-[39%] h-[42%] w-[55%] rounded-full opacity-65 md:blur-[80px]" style={{
          background: "radial-gradient(ellipse at center,rgba(100,61,247,0.24),rgba(62,56,153,0.07) 44%,transparent 74%)",
        }} />
        <div className="absolute -right-[min(44vw,550px)] -top-[min(55vw,690px)] aspect-square w-[clamp(650px,80vw,1200px)] rounded-full border border-[#4964ff]/45 shadow-[0_0_44px_rgba(56,69,255,0.25),inset_0_0_46px_rgba(56,69,255,0.07)]" />
        <div className="absolute -bottom-[min(60vw,750px)] -left-[min(48vw,630px)] aspect-square w-[clamp(680px,84vw,1280px)] rounded-full border border-[#5777ff]/55 shadow-[0_0_50px_rgba(55,93,255,0.25),inset_0_0_55px_rgba(40,78,244,0.08)]" />
      </div> 
  );
}
