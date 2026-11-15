// The hero: the promise, then the product's real home screen, which itself shows the
// module entry points. The composition stays centred and stacked so the first screen
// belongs to the pig, not to a generic left-copy / right-screenshot template.

import { motion } from "motion/react";
import { SITE } from "../content/site.ts";
import { asset } from "../engine/asset.ts";

const RISE = { hidden: { opacity: 0, y: 18 }, shown: { opacity: 1, y: 0 } };
const GUTTER = "mx-auto w-full max-w-[72rem] px-5 sm:px-8";

export function HeroSection() {
  const { hero } = SITE;
  return (
    <header className="relative isolate overflow-hidden">
      <div aria-hidden="true" className="hero-glow absolute inset-0 -z-10" />
      <nav className={`${GUTTER} flex items-center justify-between py-5`}>
        <a href="#" className="text-ink font-display flex items-center gap-2.5 text-base font-semibold">
          <img src={asset("logo.png")} alt="" className="size-9 rounded-full object-cover" />
          {SITE.name}
        </a>
        <ul className="text-muted hidden items-center gap-6 text-sm sm:flex">
          {SITE.nav.map((item) => (
            <li key={item.label}>
              <a href={item.href} className="hover:text-primary transition-colors">
                {item.label}
              </a>
            </li>
          ))}
        </ul>
        <a href="#cta" className="text-primary text-[13px] font-medium sm:hidden">
          去微信搜索 →
        </a>
      </nav>
      <motion.div
        initial="hidden"
        animate="shown"
        transition={{ staggerChildren: 0.1 }}
        className={`${GUTTER} flex flex-col items-center pt-6 text-center sm:pt-9`}
      >
        <motion.div variants={RISE} className="border-primary-soft bg-surface/80 text-primary flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[12px] font-medium tracking-[0.08em]">
          <span aria-hidden="true" className="bg-primary size-1.5 rounded-full" />
          {hero.eyebrow}
        </motion.div>
        <motion.h1
          variants={RISE}
          className="text-ink font-display mt-5 max-w-[19em] text-[clamp(2.35rem,6.6vw,4.9rem)] leading-[1.08] font-semibold tracking-[-0.035em]"
        >
          {hero.title.map((line, index) => (
            <span key={line} className={`block ${index === 1 ? "text-primary" : ""}`}>
              {line}
            </span>
          ))}
        </motion.h1>
        <motion.p variants={RISE} className="text-muted mt-5 max-w-[34rem] text-[15px] leading-7 sm:text-lg">
          {hero.promise}
        </motion.p>
        <motion.div variants={RISE} className="mt-7 flex flex-wrap justify-center gap-3">
          <a
            href={hero.primary.href}
            className="bg-primary focus-visible:outline-primary rounded-full px-7 py-3.5 text-sm font-medium text-white shadow-[0_10px_28px_rgb(201_79_104_/_0.20)] transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 motion-reduce:transform-none"
          >
            {hero.primary.label}
          </a>
          <a
            href={hero.secondary.href}
            className="border-line bg-surface/70 text-ink hover:border-primary focus-visible:outline-primary rounded-full border px-7 py-3.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            {hero.secondary.label} ↓
          </a>
        </motion.div>
        <motion.p variants={RISE} className="text-subtle mt-4 text-[11px] tracking-[0.08em]">
          不用另装 App · 微信里直接用
        </motion.p>
        {hero.image ? (
          <motion.figure variants={RISE} className="relative mt-9 mb-0 w-full">
            <div className="relative mx-auto w-[clamp(13.5rem,54vw,18rem)]">
              <div aria-hidden="true" className="bg-primary-soft absolute -inset-x-8 top-16 -bottom-4 -z-10 rounded-[3rem] blur-2xl opacity-45" />
              <div className="hero-phone overflow-hidden rounded-[2rem] border-[8px] border-white bg-surface">
                <img src={asset(hero.image)} alt={hero.imageAlt} className="block w-full select-none" draggable={false} />
              </div>
              <span className="border-line bg-surface/95 text-muted absolute -left-4 top-20 hidden rounded-full border px-3 py-1.5 text-[10px] tracking-[0.06em] shadow-lg sm:inline-flex">
                美食菜单
              </span>
              <span className="border-line bg-surface/95 text-muted absolute -right-6 top-48 hidden rounded-full border px-3 py-1.5 text-[10px] tracking-[0.06em] shadow-lg sm:inline-flex">
                到期管家
              </span>
            </div>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {hero.pills.map((pill) => (
                <span key={pill} className="border-line bg-surface/80 text-muted rounded-full border px-2.5 py-1 text-[10px] tracking-[0.04em]">
                  {pill}
                </span>
              ))}
            </div>
            <figcaption className="text-subtle mt-4 text-[11px] tracking-[0.12em]">首页 · 六个生活模块 · 真实产品界面</figcaption>
          </motion.figure>
        ) : null}
      </motion.div>
    </header>
  );
}
