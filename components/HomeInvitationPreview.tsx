type InvitationKind = "wedding" | "baptism" | "birthday";

/** Lightweight invitation mockups based on the real wedding, baptism and 18th-birthday models. */
export default function HomeInvitationPreview({ kind }: { kind: InvitationKind }) {
  if (kind === "wedding") {
    return (
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden bg-[#eee2cd] text-[#4d3925]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_25%_13%,#fff9ee_0%,transparent_57%),radial-gradient(ellipse_at_85%_85%,#d4b987_0%,transparent_58%)]" />
        <div className="absolute inset-[12px] rounded-[24px] border border-[#ab8953]/55 sm:inset-[18px]" />
        <div className="absolute inset-[19px] rounded-[20px] border border-[#ab8953]/20 sm:inset-[25px]" />
        <div className="relative flex h-full flex-col items-center justify-center px-6 pb-20 text-center">
          <p className="text-[9px] font-semibold uppercase tracking-[.28em] text-[#9a764b]">O invitație specială</p>
          <div className="my-5 flex items-center gap-3 text-[#a77b32]"><span className="h-px w-9 bg-current opacity-45" />✦<span className="h-px w-9 bg-current opacity-45" /></div>
          <p className="font-serif text-[24px] italic leading-tight">Mire</p>
          <p className="my-1 font-serif text-[29px] italic text-[#ac874d]">&amp;</p>
          <p className="font-serif text-[28px] italic leading-tight">Mireasă</p>
          <p className="mt-5 text-[9px] uppercase tracking-[.22em] text-[#826b4b]">Cu drag, vă invităm</p>
        </div>
      </div>
    );
  }

  if (kind === "baptism") {
    return (
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden bg-[#f8e8e8] text-[#6f414c]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_22%_16%,#fffdfa_0%,transparent_51%),radial-gradient(ellipse_at_85%_82%,#e5b1bd_0%,transparent_55%)]" />
        <div className="absolute inset-[12px] rounded-[24px] border border-[#b5848b]/45 sm:inset-[18px]" />
        <div className="absolute left-1/2 top-1/2 h-[300px] w-[255px] -translate-x-1/2 -translate-y-[58%] rounded-t-[130px] rounded-b-[22px] border border-white/85 bg-white/25 shadow-[0_18px_75px_rgba(126,73,87,.12)]" />
        <div className="relative flex h-full flex-col items-center justify-center px-5 pb-20 text-center">
          <p className="text-[9px] font-semibold uppercase tracking-[.23em] text-[#a87682]">Un început frumos</p>
          <p className="mt-7 font-serif text-[24px] italic">Botezul micuței</p>
          <p className="mt-1 font-serif text-[38px] italic leading-tight text-[#ae7383]">Anastasia</p>
          <p className="mt-6 text-2xl text-[#b58b5d]">✦ ♡ ✦</p>
          <p className="mt-4 text-[9px] uppercase tracking-[.18em]">O zi plină de iubire</p>
        </div>
      </div>
    );
  }

  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden bg-[#100d21] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(164,112,255,.35),transparent_57%),radial-gradient(ellipse_at_90%_75%,rgba(97,60,229,.48),transparent_62%),linear-gradient(145deg,#17102b,#08070f)]" />
      <div className="absolute inset-[12px] rounded-[24px] border border-[#ba9eff]/40 sm:inset-[18px]" />
      <div className="absolute inset-[19px] rounded-[20px] border border-white/10 sm:inset-[25px]" />
      <div className="relative flex h-full flex-col items-center justify-center px-5 pb-20 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[.35em] text-[#c6a8ff]">MIDNIGHT</p>
        <p className="my-1 text-[clamp(96px,10vw,170px)] font-black leading-none tracking-[-.1em] text-[#e1d3ff]">18</p>
        <span className="h-px w-24 bg-[#a88aff]/75" />
        <p className="mt-6 text-[10px] font-semibold uppercase tracking-[.3em]">You're invited</p>
        <p className="mt-3 text-[9px] tracking-[.15em] text-[#c0b4d7]">A NIGHT TO REMEMBER</p>
      </div>
    </div>
  );
}
