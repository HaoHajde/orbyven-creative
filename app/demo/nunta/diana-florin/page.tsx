"use client";

import Image from "next/image";
import Link from "next/link";
import { Bodoni_Moda, DM_Sans } from "next/font/google";
import { useEffect, useRef, useState } from "react";

const uiFont = DM_Sans({
  subsets: ["latin"],
  variable: "--font-ui",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const editorialFont = Bodoni_Moda({
  subsets: ["latin"],
  variable: "--font-editorial",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const WEDDING_DATE = new Date(2026, 9, 10, 18, 0, 0).getTime();

const locations = [
  {
    number: "01",
    title: "Cununia religioasă",
    time: "15:00",
    place: "Biserica Sfânta Treime (Catedrala), Fetești",
    maps: "https://www.google.com/maps/place/Catedrala/@44.4117732,27.7727713,13z/data=!4m10!1m2!2m1!1sBiserica+Sfanta+Treime+Fetesti!3m6!1s0x40b07aac7e52b18f:0xbeae41493a7bc7be!8m2!3d44.4118209!4d27.8263579!15sCh5CaXNlcmljYSBTZmFudGEgVHJlaW1lIEZldGVzdGlaICIeYmlzZXJpY2Egc2ZhbnRhIHRyZWltZSBmZXRlc3RpkgEGY2h1cmNomgEjQ2haRFNVaE5NRzluUzBWSlEwRm5TVVJHTW5FMmRFVjNFQUXgAQD6AQQIABAn!16s%2Fg%2F1thl3y2z?entry=ttu&g_ep=EgoyMDI2MDYyMS4wIKXMDSoASAFQAw%3D%3D",
  },
  {
    number: "02",
    title: "Petrecerea",
    time: "19:00",
    place: "Restaurant Golf, Coloniști",
    maps: "https://www.google.com/maps/search/?api=1&query=Restaurant+Golf+Colonisti",
  },
];

function GoldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-3">
      <span className="h-px w-8 bg-[#b88a35]/55" />
      <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#956d27]">
        {children}
      </span>
      <span className="h-px w-8 bg-[#b88a35]/55" />
    </div>
  );
}

function SectionTitle({
  eyebrow,
  title,
  italic,
  description,
}: {
  eyebrow: string;
  title: string;
  italic?: string;
  description?: string;
}) {
  return (
    <div className="mx-auto mb-10 max-w-3xl text-center md:mb-14">
      <GoldLabel>{eyebrow}</GoldLabel>
      <h2 className="font-editorial mt-6 text-[3.4rem] font-medium leading-[0.9] tracking-[-0.055em] text-[#17130f] sm:text-6xl md:text-[5rem]">
        {title}
        {italic && (
          <span className="block bg-gradient-to-r from-[#8e6722] via-[#d6b760] to-[#9b7228] bg-clip-text font-normal italic text-transparent">
            {italic}
          </span>
        )}
      </h2>
      {description && (
        <p className="mx-auto mt-6 max-w-2xl text-[14px] font-medium leading-7 text-[#686158] md:text-[16px] md:leading-8">
          {description}
        </p>
      )}
    </div>
  );
}

export default function Home() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const [name, setName] = useState("");
  const [guests, setGuests] = useState(1);
  const [message, setMessage] = useState("");
  const [attending, setAttending] = useState(true);
  const [locationsVisible, setLocationsVisible] = useState(false);
  const [countdownVisible, setCountdownVisible] = useState(false);
  const [finalVisible, setFinalVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const updateCountdown = () => {
      const distance = WEDDING_DATE - Date.now();

      if (distance <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((distance / (1000 * 60)) % 60),
        seconds: Math.floor((distance / 1000) % 60),
      });
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const cards = document.querySelectorAll(".story-card");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("visible");
        });
      },
      { threshold: 0.16 }
    );

    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const section = document.getElementById("locatii");
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setLocationsVisible(true);
      },
      { threshold: 0.12 }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const section = document.getElementById("countdown");
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setCountdownVisible(true);
      },
      { threshold: 0.12 }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const section = document.getElementById("multumire");
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setFinalVisible(true);
      },
      { threshold: 0.15 }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  const startMusic = () => {
    if (!audioRef.current) return;
    audioRef.current.volume = 0.25;
    audioRef.current
      .play()
      .then(() => setIsPlaying(true))
      .catch(() => {});
  };

  const toggleMusic = () => {
    if (!audioRef.current) return;

    if (audioRef.current.paused) {
      audioRef.current.play();
      setIsPlaying(true);
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // DEMO ONLY:
    // Nu trimitem nimic către baza de date a invitației reale.
    setFinalVisible(true);

    setTimeout(() => {
      document.getElementById("multumire")?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 300);

    setName("");
    setGuests(1);
    setMessage("");
    setAttending(true);
  };

  const inputClass =
    "w-full rounded-[20px] border border-[#ae8438]/15 bg-white/72 px-4 py-4 text-[14px] font-medium text-[#24201a] outline-none shadow-[inset_0_1px_0_rgba(255,255,255,.85)] backdrop-blur-xl transition duration-300 placeholder:text-[#9c958c] hover:bg-white/84 focus:border-[#b68a3a]/45 focus:bg-white/92 focus:ring-4 focus:ring-[#b68a3a]/10";

  const timeUnits = [
    { label: "Zile", value: timeLeft.days },
    { label: "Ore", value: timeLeft.hours },
    { label: "Minute", value: timeLeft.minutes },
    { label: "Secunde", value: timeLeft.seconds },
  ];

  return (
    <main
      className={`${uiFont.variable} ${editorialFont.variable} relative isolate min-h-screen overflow-x-hidden text-[#1b1814]`}
      style={{ fontFamily: "var(--font-ui)", backgroundColor: "#f6f0e5" }}
    >
      {/* DEMO CONTROL — independent from the live wedding invitation */}
      <Link
        href="/templates"
        className="fixed bottom-5 left-5 z-[70] inline-flex items-center gap-2 rounded-full border border-black/10 bg-black/88 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-white shadow-[0_14px_40px_rgba(0,0,0,.18)] backdrop-blur-2xl transition duration-300 hover:-translate-y-0.5 hover:bg-black"
      >
        <span aria-hidden="true">←</span>
        Demo template
      </Link>

      {/* GUARANTEED VISIBLE BACKGROUND — image + CSS fallback */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-55"
          style={{ backgroundImage: "url('/demo/nunta/diana-florin/mobile-bg1.png?v=40')" }}
        />

        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 12% 12%, rgba(255,255,255,.95) 0, rgba(255,255,255,.25) 24%, transparent 44%), radial-gradient(circle at 88% 28%, rgba(218,183,103,.30) 0, rgba(218,183,103,.08) 22%, transparent 45%), radial-gradient(circle at 35% 82%, rgba(255,255,255,.82) 0, rgba(255,255,255,.12) 26%, transparent 50%), linear-gradient(135deg, rgba(255,255,255,.28), rgba(245,232,202,.10))",
          }}
        />

        <div className="absolute -left-24 top-[22%] h-[340px] w-[340px] rounded-full bg-white/45 blur-[110px]" />
        <div className="absolute -right-28 top-[55%] h-[420px] w-[420px] rounded-full bg-[#d6b05a]/18 blur-[125px]" />
      </div>

      {/* APPLE-LIKE FLOATING NAV */}
      <nav className="fixed left-1/2 top-3 z-50 w-[calc(100%-18px)] max-w-[980px] -translate-x-1/2 sm:top-4 sm:w-[calc(100%-32px)]">
        <div className="flex h-[62px] items-center rounded-[24px] border border-white/80 bg-white/64 px-3 shadow-[0_16px_50px_rgba(80,59,25,.12),inset_0_1px_0_rgba(255,255,255,.95)] backdrop-blur-[30px] backdrop-saturate-150 sm:px-5">
          <a href="#acasa" className="hidden min-w-[110px] items-center gap-2 sm:flex">
            <span className="font-editorial text-[27px] font-semibold leading-none tracking-[-0.06em] text-[#1d1914]">D</span>
            <span className="font-editorial text-[18px] italic text-[#b88a35]">&amp;</span>
            <span className="font-editorial text-[27px] font-semibold leading-none tracking-[-0.06em] text-[#1d1914]">F</span>
          </a>

          <div className="mx-auto flex items-center gap-0.5 text-[9px] font-bold tracking-[-0.01em] text-[#625d56] sm:text-[10px] md:text-[11px]">
            {[
              ["Acasă", "#acasa"],
              ["Poveste", "#poveste"],
              ["Countdown", "#countdown"],
              ["Locații", "#locatii"],
              ["Confirmare", "#rsvp"],
            ].map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="rounded-full px-2.5 py-2.5 transition duration-300 hover:bg-white/80 hover:text-[#191612] md:px-3.5"
              >
                {label}
              </a>
            ))}
          </div>

          <div className="hidden min-w-[110px] justify-end sm:flex">
            <span className="rounded-full border border-[#b88a35]/15 bg-[#b88a35]/8 px-3 py-2 text-[9px] font-bold uppercase tracking-[0.16em] text-[#8b6728]">
              10.10.26
            </span>
          </div>
        </div>
      </nav>

      <div className="relative z-10">
        {/* HERO */}
        <section id="acasa" className="relative flex min-h-screen scroll-mt-24 items-center px-4 pb-16 pt-24 sm:px-6">
          <div className="mx-auto w-full max-w-[1240px]">
            <div className="relative overflow-hidden rounded-[38px] border border-white/78 bg-white/24 shadow-[0_36px_100px_rgba(69,49,20,.18),inset_0_1px_0_rgba(255,255,255,.95)] backdrop-blur-[18px] md:rounded-[54px]">
              <div className="absolute inset-0 bg-gradient-to-br from-white/38 via-white/10 to-[#d0a551]/8" />

              <div className="relative grid min-h-[78vh] items-stretch lg:grid-cols-[1.02fr_.98fr]">
                <div className="flex items-center px-7 py-14 text-center sm:px-10 md:px-14 lg:text-left xl:px-20">
                  <div className="w-full">
                    <div className="mb-7 flex justify-center lg:justify-start">
                      <GoldLabel>Invitația noastră</GoldLabel>
                    </div>

                    <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.19em] text-[#776b5b] sm:text-[13px]">
                      Cu emoție și bucurie, noi,
                    </p>

                    <h1 className="font-editorial text-[5rem] font-medium leading-[0.73] tracking-[-0.075em] text-[#18140f] sm:text-[6.8rem] md:text-[8rem] lg:text-[7.2rem] xl:text-[8.5rem]">
                      Diana
                      <span className="my-2 block bg-gradient-to-r from-[#8f6721] via-[#d5b65e] to-[#9b7126] bg-clip-text text-[0.42em] font-normal italic tracking-[-0.03em] text-transparent">
                        &amp;
                      </span>
                      Florin
                    </h1>

                    <p className="mx-auto mt-8 max-w-[510px] text-[14px] font-medium leading-7 text-[#5e574f] sm:text-[15px] md:leading-8 lg:mx-0">
                      O zi. Două suflete. O promisiune pentru totdeauna. Vă invităm să ne fiți alături pe 10 Octombrie 2026.
                    </p>

                    <div className="mt-9 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                      <a
                        href="#poveste"
                        onClick={startMusic}
                        className="group inline-flex items-center gap-3 rounded-full bg-[#1d1914] px-6 py-3.5 text-[11px] font-bold text-white shadow-[0_14px_34px_rgba(31,25,19,.22)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#2a241d]"
                      >
                        Descoperă povestea
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 transition group-hover:translate-x-0.5">→</span>
                      </a>

                      <span className="rounded-full border border-white/80 bg-white/52 px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#8a672b] shadow-sm backdrop-blur-xl">
                        Fetești · România
                      </span>
                    </div>
                  </div>
                </div>

                <div className="relative min-h-[500px] lg:min-h-full">
                  <Image
                    src="/demo/nunta/diana-florin/couple1.jpeg"
                    alt="Diana și Florin"
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover object-[center_16%]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1e180d]/25 via-transparent to-white/5" />
                  <div className="absolute inset-y-0 left-0 hidden w-24 bg-gradient-to-r from-white/55 to-transparent lg:block" />

                  <div className="absolute bottom-5 left-5 right-5 rounded-[28px] border border-white/55 bg-white/44 p-5 shadow-[0_16px_44px_rgba(38,29,17,.16)] backdrop-blur-[24px] sm:bottom-7 sm:left-7 sm:right-7 sm:p-6">
                    <div className="flex items-end justify-between gap-5">
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-[0.26em] text-[#856326]">Save the date</p>
                        <p className="font-editorial mt-2 text-[2.6rem] font-semibold leading-none tracking-[-0.055em] text-[#1b1712] sm:text-[3.3rem]">10.10.2026</p>
                      </div>
                      <p className="font-editorial text-[2.6rem] italic leading-none text-[#b88a35]">D&amp;F</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STORY */}
        <section id="poveste" className="scroll-mt-24 px-4 py-20 sm:px-6 md:py-28">
          <div className="mx-auto max-w-[1180px]">
            <SectionTitle
              eyebrow="Povestea noastră"
              title="Un drum,"
              italic="două suflete."
              description="Două suflete, două drumuri și o întâlnire care a schimbat totul. Din zâmbete, răbdare și iubire s-a născut povestea pe care astăzi o ducem mai departe, împreună."
            />

            <div className="grid gap-6 lg:grid-cols-2">
              <article className="story-card group overflow-hidden rounded-[38px] border border-white/72 bg-white/38 shadow-[0_24px_70px_rgba(75,55,24,.13),inset_0_1px_0_rgba(255,255,255,.95)] backdrop-blur-[22px]">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image src="/demo/nunta/diana-florin/diana.jpeg" alt="Diana" fill sizes="(max-width:1024px) 100vw,50vw" className="object-cover object-center transition duration-700 group-hover:scale-[1.025]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#20190d]/28 via-transparent to-transparent" />
                  <span className="absolute left-5 top-5 rounded-full border border-white/55 bg-white/48 px-3.5 py-2 text-[9px] font-bold uppercase tracking-[0.19em] text-[#7d5f2c] backdrop-blur-xl">01 · Diana</span>
                </div>
                <div className="p-7 sm:p-9">
                  <h3 className="font-editorial text-[3.2rem] font-medium leading-[0.88] tracking-[-0.05em] text-[#18140f] sm:text-[3.8rem]">
                    Povestea <span className="italic text-[#b88a35]">Dianei</span>
                  </h3>
                  <p className="mt-6 text-[14px] font-medium leading-7 text-[#625b53] sm:text-[15px] sm:leading-8">
                    Diana este sufletul blând și cald al poveștii noastre. Prin zâmbetul ei, prin răbdare și prin felul în care aduce liniște în jur, a transformat fiecare zi într-un motiv de bucurie. Alături de ea, iubirea a devenit acasă.
                  </p>
                </div>
              </article>

              <article className="story-card group overflow-hidden rounded-[38px] border border-white/72 bg-white/38 shadow-[0_24px_70px_rgba(75,55,24,.13),inset_0_1px_0_rgba(255,255,255,.95)] backdrop-blur-[22px]" style={{ transitionDelay: "180ms" }}>
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image src="/demo/nunta/diana-florin/florin.jpeg" alt="Florin" fill sizes="(max-width:1024px) 100vw,50vw" className="object-cover object-center transition duration-700 group-hover:scale-[1.025]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#20190d]/28 via-transparent to-transparent" />
                  <span className="absolute right-5 top-5 rounded-full border border-white/55 bg-white/48 px-3.5 py-2 text-[9px] font-bold uppercase tracking-[0.19em] text-[#7d5f2c] backdrop-blur-xl">02 · Florin</span>
                </div>
                <div className="p-7 text-right sm:p-9">
                  <h3 className="font-editorial text-[3.2rem] font-medium leading-[0.88] tracking-[-0.05em] text-[#18140f] sm:text-[3.8rem]">
                    Povestea lui <span className="italic text-[#b88a35]">Florin</span>
                  </h3>
                  <p className="mt-6 text-[14px] font-medium leading-7 text-[#625b53] sm:text-[15px] sm:leading-8">
                    Florin este omul care iubește sincer, protejează și construiește cu răbdare. Cu pași siguri, cu suflet deschis și cu dorința de a avea grijă de cei dragi, a găsit în Diana liniștea și viitorul pe care și le-a dorit.
                  </p>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* NASI */}
        <section id="nasi" className="scroll-mt-24 px-4 py-20 sm:px-6 md:py-28">
          <div className="mx-auto max-w-[1180px]">
            <div className="overflow-hidden rounded-[42px] border border-white/72 bg-white/36 shadow-[0_28px_85px_rgba(73,52,22,.13),inset_0_1px_0_rgba(255,255,255,.96)] backdrop-blur-[22px] md:rounded-[52px]">
              <div className="grid md:grid-cols-[.92fr_1.08fr]">
                <div className="relative min-h-[520px] md:min-h-[690px]">
                  <Image src="/demo/nunta/diana-florin/nasi1.jpeg" alt="Nașii noștri" fill sizes="(max-width:768px) 100vw,45vw" className="object-cover object-top" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#211a0e]/24 via-transparent to-white/6" />
                </div>

                <div className="flex items-center px-7 py-12 sm:px-10 md:px-14 lg:px-16">
                  <div>
                    <GoldLabel>Alături de noi</GoldLabel>
                    <h2 className="font-editorial mt-7 text-[4rem] font-medium leading-[0.83] tracking-[-0.06em] text-[#18140f] sm:text-[5rem] md:text-[5.4rem]">
                      Nașii <span className="block italic text-[#b88a35]">noștri</span>
                    </h2>
                    <p className="mt-7 max-w-xl text-[14px] font-medium leading-7 text-[#625b53] md:text-[16px] md:leading-8">
                      Cu drag și recunoștință, le mulțumim celor care ne vor călăuzi pașii și ne vor fi alături în această nouă etapă a vieții.
                    </p>

                    <div className="mt-10 rounded-[28px] border border-white/74 bg-white/52 p-6 shadow-[0_16px_44px_rgba(78,55,20,.09)] backdrop-blur-xl">
                      <p className="text-[9px] font-bold uppercase tracking-[0.23em] text-[#897860]">Cu drag, alături de noi</p>
                      <p className="font-editorial mt-2 text-[2.7rem] font-semibold leading-none tracking-[-0.045em] text-[#b88a35] sm:text-[3.3rem]">
                        Cristina &amp; Marian Gene
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* COUNTDOWN */}
        <section id="countdown" className="scroll-mt-24 px-4 py-20 sm:px-6 md:py-28">
          <div className={`countdown-card mx-auto max-w-[1180px] ${countdownVisible ? "visible" : ""}`}>
            <SectionTitle eyebrow="Numărătoarea inversă" title="Ne vedem" italic="în curând." />

            <div className="grid gap-5 lg:grid-cols-[.78fr_1.22fr]">
              <div className="relative min-h-[430px] overflow-hidden rounded-[38px] border border-white/72 bg-white/36 shadow-[0_24px_70px_rgba(74,53,23,.13)] backdrop-blur-[20px] lg:min-h-full">
                <Image src="/demo/nunta/diana-florin/couple1.jpeg" alt="Diana și Florin" fill sizes="(max-width:1024px) 100vw,40vw" className="object-cover object-[center_18%]" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1d160b]/34 via-transparent to-white/5" />
                <div className="absolute bottom-6 left-6 right-6">
                  <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-white/80">10 Octombrie 2026</p>
                  <p className="font-editorial mt-2 text-[3.6rem] font-medium italic leading-none tracking-[-0.055em] text-white">Până la „Da”</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {timeUnits.map((item, index) => (
                  <div
                    key={item.label}
                    className="group flex min-h-[205px] flex-col justify-between rounded-[34px] border border-white/76 bg-white/46 p-6 shadow-[0_18px_55px_rgba(74,54,23,.11),inset_0_1px_0_rgba(255,255,255,.95)] backdrop-blur-[22px] transition duration-300 hover:-translate-y-1 hover:bg-white/58 sm:p-8"
                    style={{ transitionDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-[#8f805f]">{item.label}</span>
                      <span className="h-2 w-2 rounded-full bg-[#b88a35]/70 shadow-[0_0_0_6px_rgba(184,138,53,.08)]" />
                    </div>
                    <p className="font-editorial text-[4.7rem] font-medium leading-none tracking-[-0.07em] text-[#1a1611] sm:text-[5.7rem]">
                      {String(item.value).padStart(2, "0")}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* LOCATIONS */}
        <section id="locatii" className="scroll-mt-24 px-4 py-20 sm:px-6 md:py-28">
          <div className="mx-auto max-w-[1180px]">
            <SectionTitle
              eyebrow="Eveniment"
              title="Unde și"
              italic="când."
              description="Două momente speciale, o singură zi plină de emoție, iubire și amintiri frumoase."
            />

            <div className="grid gap-5 md:grid-cols-2">
              {locations.map((item, index) => (
                <article
                  key={item.title}
                  className={`location-card group relative overflow-hidden rounded-[38px] border border-white/75 bg-white/44 p-7 shadow-[0_22px_68px_rgba(72,52,22,.12),inset_0_1px_0_rgba(255,255,255,.96)] backdrop-blur-[22px] sm:p-9 ${locationsVisible ? "visible" : ""}`}
                  style={{ transitionDelay: `${index * 150}ms` }}
                >
                  <div className="absolute -right-8 -top-10 font-editorial text-[11rem] font-semibold leading-none tracking-[-0.08em] text-[#b88a35]/7">
                    {item.number}
                  </div>

                  <div className="relative">
                    <div className="flex items-start justify-between gap-5">
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-[#94702f]">10 Octombrie 2026</p>
                        <h3 className="font-editorial mt-4 text-[3.2rem] font-medium leading-[0.88] tracking-[-0.055em] text-[#191510] sm:text-[3.8rem]">
                          {item.title}
                        </h3>
                      </div>
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#b88a35]/16 bg-[#b88a35]/8 text-[18px] text-[#997128]">⌖</span>
                    </div>

                    <p className="font-editorial mt-9 text-[4.7rem] font-semibold leading-none tracking-[-0.065em] text-[#b88a35] sm:text-[5.6rem]">{item.time}</p>
                    <p className="mt-5 max-w-md text-[14px] font-semibold leading-7 text-[#5d574f] sm:text-[15px]">{item.place}</p>

                    <a
                      href={item.maps}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-8 inline-flex items-center gap-3 rounded-full bg-[#1c1813] px-5 py-3 text-[10px] font-bold text-white shadow-[0_12px_30px_rgba(31,25,19,.18)] transition duration-300 hover:-translate-y-0.5"
                    >
                      Navighează către locație <span>↗</span>
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* RSVP */}
        <section id="rsvp" className="scroll-mt-24 px-4 py-20 sm:px-6 md:py-28">
          <div className="mx-auto max-w-[1120px] overflow-hidden rounded-[42px] border border-white/76 bg-white/39 shadow-[0_30px_90px_rgba(68,48,20,.14),inset_0_1px_0_rgba(255,255,255,.96)] backdrop-blur-[24px] md:rounded-[52px]">
            <div className="grid lg:grid-cols-[.86fr_1.14fr]">
              <div className="relative overflow-hidden border-b border-white/48 px-7 py-12 sm:px-10 md:px-12 lg:border-b-0 lg:border-r lg:py-16">
                <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[#d1a956]/16 blur-[75px]" />
                <div className="relative">
                  <GoldLabel>RSVP</GoldLabel>
                  <h2 className="font-editorial mt-7 text-[4.2rem] font-medium leading-[0.82] tracking-[-0.06em] text-[#18140f] sm:text-[5.2rem]">
                    Ne-ar bucura să fii <span className="block italic text-[#b88a35]">alături.</span>
                  </h2>
                  <p className="mt-7 max-w-md text-[14px] font-medium leading-7 text-[#625b53] md:text-[15px]">
                    Vă rugăm să confirmați prezența până la <span className="font-bold text-[#876426]">14 Septembrie 2026</span>.
                  </p>

                  <div className="mt-12 rounded-[28px] border border-white/72 bg-white/50 p-6 shadow-sm backdrop-blur-xl">
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#8c7e68]">Cu drag,</p>
                    <p className="font-editorial mt-2 text-[3rem] font-semibold italic leading-none tracking-[-0.045em] text-[#b88a35]">Diana &amp; Florin</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="bg-white/18 px-7 py-10 sm:px-10 md:px-12 lg:py-14">
                <div className="grid gap-5">
                  <div>
                    <label htmlFor="name" className="mb-2.5 block text-[10px] font-bold uppercase tracking-[0.15em] text-[#665f56]">Nume și prenume</label>
                    <input id="name" type="text" placeholder="Ex. Andrei Popescu" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} required />
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="attending" className="mb-2.5 block text-[10px] font-bold uppercase tracking-[0.15em] text-[#665f56]">Participare</label>
                      <select id="attending" value={attending ? "da" : "nu"} onChange={(e) => setAttending(e.target.value === "da")} className={`${inputClass} cursor-pointer`}>
                        <option value="da">Particip</option>
                        <option value="nu">Nu particip</option>
                      </select>
                    </div>

                    {attending && (
                      <div>
                        <label htmlFor="guests" className="mb-2.5 block text-[10px] font-bold uppercase tracking-[0.15em] text-[#665f56]">Număr persoane</label>
                        <select id="guests" value={guests} onChange={(e) => setGuests(Number(e.target.value))} className={`${inputClass} cursor-pointer`}>
                          <option value={1}>1 persoană</option>
                          <option value={2}>2 persoane</option>
                          <option value={3}>3 persoane</option>
                          <option value={4}>4 persoane</option>
                          <option value={5}>5 persoane</option>
                          <option value={6}>6 persoane</option>
                          <option value={7}>7 persoane</option>
                          <option value={8}>8 persoane</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <div>
                    <label htmlFor="message" className="mb-2.5 block text-[10px] font-bold uppercase tracking-[0.15em] text-[#665f56]">Mesaj pentru miri</label>
                    <textarea id="message" placeholder="Lasă-ne un gând frumos..." value={message} onChange={(e) => setMessage(e.target.value)} className={`${inputClass} min-h-[135px] resize-none`} rows={4} />
                  </div>
                </div>

                <button type="submit" className="group mt-7 flex w-full items-center justify-center gap-3 rounded-[20px] bg-gradient-to-b from-[#c9a554] to-[#9a7028] px-5 py-4 text-[11px] font-bold text-white shadow-[0_15px_34px_rgba(151,109,40,.25),inset_0_1px_0_rgba(255,255,255,.28)] transition duration-300 hover:-translate-y-0.5 hover:brightness-105 focus:outline-none focus:ring-4 focus:ring-[#b88a35]/14">
                  Trimite confirmarea <span className="transition group-hover:translate-x-0.5">→</span>
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* THANK YOU */}
        <section id="multumire" className="flex min-h-screen scroll-mt-24 items-center justify-center px-4 py-20 sm:px-6 md:py-28">
          <div className={`final-card relative mx-auto w-full max-w-[1040px] overflow-hidden rounded-[42px] border border-white/76 bg-white/38 px-7 py-16 text-center shadow-[0_30px_90px_rgba(68,48,20,.14),inset_0_1px_0_rgba(255,255,255,.96)] backdrop-blur-[24px] sm:px-10 md:rounded-[52px] md:px-16 md:py-24 ${finalVisible ? "visible" : ""}`}>
            <div className="absolute left-1/2 top-0 h-72 w-[70%] -translate-x-1/2 rounded-full bg-[#d0aa58]/16 blur-[100px]" />
            <div className="relative">
              <GoldLabel>Vă mulțumim</GoldLabel>
              <h2 className="font-editorial mt-8 text-[4.6rem] font-medium leading-[0.78] tracking-[-0.065em] text-[#18140f] sm:text-[6rem] md:text-[7rem]">Cu drag,</h2>
              <p className="font-editorial mt-4 bg-gradient-to-r from-[#8e6722] via-[#d4b45b] to-[#9d7327] bg-clip-text text-[5rem] font-semibold italic leading-[0.8] tracking-[-0.06em] text-transparent sm:text-[6.7rem] md:text-[8rem]">Diana &amp; Florin</p>
              <div className="mx-auto my-9 h-px w-20 bg-[#b88a35]/42" />
              <p className="mx-auto max-w-2xl text-[14px] font-medium leading-7 text-[#625b53] md:text-[16px] md:leading-8">
                Vă mulțumim că faceți parte din povestea noastră. Prezența, gândurile și bucuria voastră înseamnă enorm pentru noi. Abia așteptăm să sărbătorim împreună ziua de 10 Octombrie 2026.
              </p>
              <span className="mt-9 inline-flex rounded-full border border-white/75 bg-white/52 px-5 py-2.5 text-[9px] font-bold uppercase tracking-[0.22em] text-[#856329] shadow-sm backdrop-blur-xl">10 · 10 · 2026</span>
            </div>
          </div>
        </section>
      </div>

      <audio ref={audioRef} src="/demo/nunta/diana-florin/music.mp3" preload="auto" />

      <button
        onClick={toggleMusic}
        aria-label={isPlaying ? "Oprește muzica" : "Pornește muzica"}
        className={`fixed bottom-5 right-5 z-50 flex h-[60px] w-[60px] items-center justify-center rounded-full border border-white/80 bg-white/64 text-[#8d6728] shadow-[0_16px_44px_rgba(65,47,22,.15),inset_0_1px_0_rgba(255,255,255,.95)] backdrop-blur-[28px] transition duration-300 hover:-translate-y-0.5 hover:bg-white/78 ${isPlaying ? "music-playing" : ""}`}
      >
        {isPlaying ? (
          <span className="flex h-5 items-end gap-[3px]" aria-hidden="true">
            <span className="soundbar h-3 w-[3px] rounded-full bg-[#a7792d]" />
            <span className="soundbar h-5 w-[3px] rounded-full bg-[#a7792d]" />
            <span className="soundbar h-2.5 w-[3px] rounded-full bg-[#a7792d]" />
            <span className="soundbar h-4 w-[3px] rounded-full bg-[#a7792d]" />
          </span>
        ) : (
          <span className="ml-0.5 text-[15px]">▶</span>
        )}
      </button>

      <style jsx global>{`
        :root {
          --font-ui: ${uiFont.style.fontFamily};
          --font-editorial: ${editorialFont.style.fontFamily};
        }

        html {
          scroll-behavior: smooth;
          background: #f6f0e5;
        }

        body {
          margin: 0;
          background: #f6f0e5;
          font-family: var(--font-ui);
          -webkit-font-smoothing: antialiased;
          text-rendering: optimizeLegibility;
        }

        .font-editorial {
          font-family: var(--font-editorial);
        }

        button,
        input,
        select,
        textarea {
          font: inherit;
        }

        ::selection {
          background: rgba(184, 138, 53, 0.20);
          color: #1b1713;
        }

        .location-card,
        .countdown-card,
        .final-card {
          opacity: 0;
          transform: translate3d(0, 30px, 0) scale(0.987);
          transition:
            opacity 850ms cubic-bezier(0.22, 1, 0.36, 1),
            transform 850ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .location-card.visible,
        .countdown-card.visible,
        .final-card.visible {
          opacity: 1;
          transform: translate3d(0, 0, 0) scale(1);
        }

        .story-card {
          animation: storyEnter 760ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .story-card:nth-child(2) {
          animation-delay: 120ms;
        }

        .music-playing {
          animation: musicGlow 2.2s ease-in-out infinite;
        }

        .soundbar {
          transform-origin: bottom;
          animation: soundbar 0.8s ease-in-out infinite alternate;
        }

        .soundbar:nth-child(2) { animation-delay: 0.16s; }
        .soundbar:nth-child(3) { animation-delay: 0.32s; }
        .soundbar:nth-child(4) { animation-delay: 0.48s; }

        @keyframes soundbar {
          0% { transform: scaleY(0.5); }
          100% { transform: scaleY(1); }
        }

        @keyframes storyEnter {
          from {
            transform: translate3d(0, 18px, 0) scale(0.992);
          }
          to {
            transform: translate3d(0, 0, 0) scale(1);
          }
        }

        @keyframes musicGlow {
          0%, 100% { box-shadow: 0 16px 44px rgba(65,47,22,.15), inset 0 1px 0 rgba(255,255,255,.95); }
          50% { box-shadow: 0 16px 52px rgba(168,121,45,.24), 0 0 0 7px rgba(184,138,53,.05), inset 0 1px 0 rgba(255,255,255,.95); }
        }

        @media (prefers-reduced-motion: reduce) {
          html { scroll-behavior: auto; }
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </main>
  );
}
