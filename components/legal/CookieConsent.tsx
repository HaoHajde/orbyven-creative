"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "orbyven-cookie-consent-v1";

type Consent = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  updatedAt: string;
};

function saveConsent(analytics: boolean, marketing: boolean) {
  const consent: Consent = {
    necessary: true,
    analytics,
    marketing,
    updatedAt: new Date().toISOString(),
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
  window.dispatchEvent(new CustomEvent("orbyven:consent", { detail: consent }));
}

export default function CookieConsent() {
  const optionalCookiesEnabled =
    process.env.NEXT_PUBLIC_OPTIONAL_COOKIES_ENABLED === "true";
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!optionalCookiesEnabled) return;
    setVisible(!window.localStorage.getItem(STORAGE_KEY));
  }, [optionalCookiesEnabled]);

  if (!optionalCookiesEnabled || !visible) return null;

  const decide = (analytics: boolean, marketing: boolean) => {
    saveConsent(analytics, marketing);
    setVisible(false);
  };

  return (
    <div className="fixed inset-x-4 bottom-4 z-[100] mx-auto max-w-2xl rounded-[26px] border border-black/[0.1] bg-white/95 p-5 text-[#1d1d1f] shadow-2xl backdrop-blur-2xl dark:border-white/[0.12] dark:bg-[#111113]/95 dark:text-[#f5f5f7] sm:p-6">
      <p className="text-sm font-semibold">Preferințe cookies</p>
      <p className="mt-2 text-xs leading-5 text-[#6e6e73] dark:text-[#a1a1a6]">
        Cookie-urile strict necesare rămân active. Cookie-urile opționale sunt folosite numai după acordul tău. Vezi detalii în{" "}
        <Link href="/legal/cookies" className="underline underline-offset-4">
          Politica Cookies
        </Link>
        .
      </p>
      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => decide(false, false)}
          className="h-11 rounded-full border border-current/15 px-5 text-sm font-medium"
        >
          Refuz opționale
        </button>
        <button
          type="button"
          onClick={() => decide(true, true)}
          className="h-11 rounded-full bg-[#1d1d1f] px-5 text-sm font-medium text-white dark:bg-[#f5f5f7] dark:text-black"
        >
          Accept opționale
        </button>
      </div>
    </div>
  );
}
