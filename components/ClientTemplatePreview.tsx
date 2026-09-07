"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import type { ClientTemplateConfig } from "@/lib/client-template-catalog";

export default function ClientTemplatePreview({
  template,
  compact = false,
}: {
  template: ClientTemplateConfig;
  compact?: boolean;
}) {
  const previewHeight = compact ? "min-h-[360px]" : "min-h-[520px]";

  return (
    <div
      className={`relative overflow-hidden rounded-[30px] border border-black/[0.06] bg-white text-[#14151a] shadow-[0_30px_90px_rgba(0,0,0,0.10)] ${previewHeight}`}
      style={{ background: template.surface }}
    >
      <div
        aria-hidden="true"
        className="absolute right-[-12%] top-[-20%] h-[340px] w-[340px] rounded-full blur-[90px]"
        style={{ background: template.accentSoft }}
      />

      <div className="relative border-b border-black/[0.06] bg-white/80 px-5 py-4 backdrop-blur-xl md:px-7">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span
              className="h-5 w-5 rounded-full border-[5px]"
              style={{ borderColor: template.accent }}
            />
            <span className="text-sm font-semibold tracking-[-0.03em]">{template.title}</span>
          </div>
          <div className="hidden items-center gap-5 text-[9px] text-black/45 sm:flex">
            <span>Acasă</span>
            <span>Servicii</span>
            <span>Despre</span>
            <span>Contact</span>
          </div>
          <span
            className="rounded-full px-4 py-2 text-[9px] font-semibold text-white"
            style={{ background: template.accent }}
          >
            {template.primaryAction}
          </span>
        </div>
      </div>

      <div className="relative grid gap-8 px-6 py-8 md:grid-cols-[1.06fr_0.94fr] md:px-8 md:py-10">
        <div className="flex flex-col justify-center">
          <p
            className="text-[9px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: template.accent }}
          >
            {template.eyebrow}
          </p>
          <h3 className={`${compact ? "mt-4 text-[35px]" : "mt-5 text-[46px] md:text-[58px]"} max-w-xl font-semibold leading-[0.94] tracking-[-0.06em]`}>
            {template.heroTitle}
          </h3>
          <p className="mt-5 max-w-xl text-[12px] leading-5 text-black/55 md:text-[13px]">
            {template.heroCopy}
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            <span
              className="rounded-full px-4 py-2.5 text-[10px] font-semibold text-white"
              style={{ background: template.accent }}
            >
              {template.primaryAction}
            </span>
            <span className="rounded-full border border-black/10 bg-white px-4 py-2.5 text-[10px] font-medium">
              {template.secondaryAction}
            </span>
          </div>
        </div>

        <div
          className="relative overflow-hidden rounded-[26px] border border-black/[0.06] p-5 md:p-6"
          style={{ background: `linear-gradient(145deg, #fff 0%, ${template.accentSoft} 100%)` }}
        >
          <div className="absolute right-5 top-5 text-[9px] font-semibold uppercase tracking-[0.16em] text-black/35">
            ORBYVEN template
          </div>
          <div className="mt-16 grid grid-cols-2 gap-3">
            {template.services.slice(0, 4).map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="rounded-[18px] border border-black/[0.06] bg-white/85 p-4"
              >
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold"
                  style={{ background: template.accentSoft, color: template.accent }}
                >
                  {service.icon}
                </div>
                <p className="mt-5 text-[11px] font-semibold">{service.title}</p>
                {!compact && <p className="mt-2 text-[9px] leading-4 text-black/45">{service.copy}</p>}
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative grid grid-cols-3 border-t border-black/[0.06] bg-white/75">
        {template.stats.map((stat) => (
          <div key={stat.label} className="border-r border-black/[0.06] px-5 py-5 last:border-r-0">
            <p className="text-[19px] font-semibold tracking-[-0.04em]">{stat.value}</p>
            <p className="mt-1 text-[8px] uppercase tracking-[0.12em] text-black/35">{stat.label}</p>
          </div>
        ))}
      </div>

      {!compact && (
        <Link
          href={`/templates/${template.slug}`}
          className="absolute inset-0 z-20"
          aria-label={`Deschide template-ul ${template.title}`}
        />
      )}
    </div>
  );
}
