"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const products = [
  { id: 1, name: "Blush Garden", price: 189, note: "trandafiri · lisianthus · verdeață", tone: "#d88e9c" },
  { id: 2, name: "Ivory Morning", price: 169, note: "trandafiri crem · eustoma · eucalyptus", tone: "#d8c8a9" },
  { id: 3, name: "Wild Romance", price: 229, note: "mix sezonier · texturi naturale", tone: "#9c6374" },
  { id: 4, name: "Soft Peony", price: 249, note: "bujori · flori delicate · satin", tone: "#e6a7b4" },
  { id: 5, name: "Green Atelier", price: 159, note: "verde decorativ · flori albe", tone: "#78957d" },
  { id: 6, name: "Noir Rose", price: 279, note: "trandafiri roșu închis · ambalaj premium", tone: "#713746" },
  { id: 7, name: "Mini Fleur", price: 119, note: "buchet compact · cadou rapid", tone: "#c9938b" },
  { id: 8, name: "Table Bloom", price: 319, note: "aranjament de masă · vas inclus", tone: "#a3736a" },
];

export default function FlorarieBragadiruTemplate() {
  const [cart, setCart] = useState<number[]>([]);
  const [message, setMessage] = useState("");
  const [wrap, setWrap] = useState("Panglică satinată");
  const total = useMemo(() => cart.reduce((sum, id) => sum + (products.find((item) => item.id === id)?.price ?? 0), 0), [cart]);

  return (
    <main className="min-h-screen bg-[#f7f1ef] text-[#24352b]">
      <header className="sticky top-0 z-30 border-b border-[#24352b]/10 bg-[#f7f1ef]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/templates" className="text-xs font-semibold uppercase tracking-[0.18em] text-[#24352b]/60">← Templates</Link>
          <div className="font-serif text-2xl tracking-[-0.04em]">Maison Fleur</div>
          <div className="rounded-full border border-[#24352b]/10 bg-white/55 px-4 py-2 text-xs font-semibold">Coș · {cart.length}</div>
        </div>
      </header>

      <section className="relative overflow-hidden px-5 py-20 sm:px-8 md:py-28">
        <div className="pointer-events-none absolute right-[-8%] top-[-12%] h-[520px] w-[520px] rounded-full bg-[#b76279]/12 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-[-24%] left-[-10%] h-[460px] w-[460px] rounded-full bg-[#456b53]/10 blur-[120px]" />
        <div className="relative mx-auto grid max-w-[1440px] gap-12 lg:grid-cols-[1.08fr_.92fr] lg:items-center">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#7b3445]">Florărie boutique · Bragadiru</p>
            <h1 className="mt-6 max-w-4xl font-serif text-[clamp(58px,8vw,118px)] leading-[0.82] tracking-[-0.065em]">Flori care spun ceva înaintea mesajului.</h1>
            <p className="mt-8 max-w-xl text-[16px] leading-7 text-[#24352b]/62">Buchete și aranjamente pregătite local, cu personalizare simplă și livrare la domiciliu în Bragadiru și împrejurimi.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#shop" className="rounded-full bg-[#24352b] px-6 py-3 text-sm font-semibold text-white">Vezi colecția</a>
              <a href="#personalizare" className="rounded-full border border-[#24352b]/15 bg-white/45 px-6 py-3 text-sm font-semibold">Personalizează</a>
            </div>
          </div>

          <div className="relative min-h-[520px] overflow-hidden rounded-[42px] border border-[#24352b]/10 bg-[#efe1dd] p-7 shadow-[0_30px_90px_rgba(54,35,39,.12)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_65%_22%,rgba(183,98,121,.24),transparent_30%),radial-gradient(circle_at_25%_75%,rgba(69,107,83,.20),transparent_35%)]" />
            <div className="relative flex h-full min-h-[466px] flex-col justify-between">
              <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.18em] text-[#24352b]/50">
                <span>Seasonal edit</span><span>08 produse</span>
              </div>
              <div className="mx-auto flex h-72 w-72 items-center justify-center rounded-full border border-[#7b3445]/10 bg-white/35 shadow-inner">
                <div className="relative h-48 w-48">
                  {[0,1,2,3,4,5,6,7,8].map((n) => (
                    <span key={n} className="absolute h-20 w-20 rounded-full border border-white/55" style={{ backgroundColor: n % 3 === 0 ? "#be7184" : n % 3 === 1 ? "#e4b3bd" : "#78957d", left: 58 + Math.cos(n * 0.7) * 55, top: 58 + Math.sin(n * 0.7) * 55, opacity: .82 }} />
                  ))}
                  <span className="absolute left-[76px] top-[74px] h-20 w-20 rounded-full bg-[#f1ded7]" />
                </div>
              </div>
              <div>
                <p className="font-serif text-4xl tracking-[-0.04em]">Aranjamente create la comandă.</p>
                <p className="mt-3 text-sm leading-6 text-[#24352b]/55">Alegi direcția, mesajul și ambalajul. Restul rămâne în mâna floristului.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="shop" className="border-y border-[#24352b]/10 bg-white/35 px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-[1440px]">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#7b3445]">Colecție demo</p>
              <h2 className="mt-4 font-serif text-[clamp(44px,6vw,76px)] leading-[0.9] tracking-[-0.055em]">Alege buchetul.</h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-[#24352b]/55">Prețuri și produse demonstrative pentru template-ul ORBYVEN.</p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <article key={product.id} className="group overflow-hidden rounded-[28px] border border-[#24352b]/10 bg-[#fbf7f5]">
                <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden" style={{ background: `radial-gradient(circle at 50% 45%, ${product.tone}55, transparent 48%), linear-gradient(145deg,#f4e8e4,#eee0dc)` }}>
                  <div className="h-32 w-32 rounded-full border border-white/55" style={{ backgroundColor: product.tone, opacity: .78 }} />
                  <div className="absolute h-24 w-24 translate-x-10 -translate-y-5 rounded-full border border-white/55 bg-[#f1cbd1]/80" />
                  <div className="absolute h-20 w-20 -translate-x-12 translate-y-8 rounded-full border border-white/55 bg-[#78957d]/70" />
                </div>
                <div className="p-5">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#24352b]/40">Maison Fleur</p>
                  <h3 className="mt-2 text-xl font-semibold tracking-[-0.035em]">{product.name}</h3>
                  <p className="mt-2 min-h-10 text-xs leading-5 text-[#24352b]/55">{product.note}</p>
                  <div className="mt-5 flex items-center justify-between">
                    <span className="font-semibold">{product.price} lei</span>
                    <button onClick={() => setCart((items) => [...items, product.id])} className="rounded-full bg-[#24352b] px-4 py-2 text-xs font-semibold text-white transition group-hover:-translate-y-0.5">Adaugă</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="personalizare" className="px-5 py-20 sm:px-8 md:py-28">
        <div className="mx-auto grid max-w-[1440px] gap-8 rounded-[38px] border border-[#24352b]/10 bg-[#eadbd7] p-6 sm:p-9 lg:grid-cols-[.85fr_1.15fr] lg:p-12">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#7b3445]">Personalizare</p>
            <h2 className="mt-5 max-w-xl font-serif text-[clamp(44px,6vw,74px)] leading-[0.9] tracking-[-0.055em]">Detaliile fac cadoul personal.</h2>
            <p className="mt-6 max-w-md text-sm leading-7 text-[#24352b]/58">Alege ambalajul, lasă un mesaj și vezi sumarul coșului. Checkout-ul este demonstrativ.</p>
          </div>
          <div className="rounded-[28px] bg-[#fbf7f5] p-5 sm:p-7">
            <label className="text-xs font-semibold">Ambalaj</label>
            <select value={wrap} onChange={(e) => setWrap(e.target.value)} className="mt-2 w-full rounded-2xl border border-[#24352b]/10 bg-white px-4 py-3 text-sm outline-none">
              <option>Panglică satinată</option>
              <option>Hârtie kraft premium</option>
              <option>Cutie cadou</option>
            </select>
            <label className="mt-5 block text-xs font-semibold">Mesaj pe felicitare</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Scrie mesajul..." className="mt-2 min-h-28 w-full resize-y rounded-2xl border border-[#24352b]/10 bg-white px-4 py-3 text-sm outline-none" />
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-[#24352b]/10 bg-white p-4">
                <p className="text-[9px] uppercase tracking-[0.14em] text-[#24352b]/40">Livrare</p>
                <p className="mt-2 text-sm font-semibold">Bragadiru · domiciliu</p>
              </div>
              <div className="rounded-2xl border border-[#24352b]/10 bg-white p-4">
                <p className="text-[9px] uppercase tracking-[0.14em] text-[#24352b]/40">Ambalaj</p>
                <p className="mt-2 text-sm font-semibold">{wrap}</p>
              </div>
            </div>
            <div className="mt-5 flex items-end justify-between border-t border-[#24352b]/10 pt-5">
              <div>
                <p className="text-xs text-[#24352b]/50">{cart.length} produse</p>
                <p className="mt-1 text-2xl font-semibold">{total} lei</p>
              </div>
              <button disabled={!cart.length} className="rounded-full bg-[#7b3445] px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-35">Checkout demo →</button>
            </div>
            {message && <p className="mt-4 rounded-2xl bg-[#24352b]/5 px-4 py-3 text-xs leading-5 text-[#24352b]/60">Felicitare: „{message}”</p>}
          </div>
        </div>
      </section>
    </main>
  );
}
