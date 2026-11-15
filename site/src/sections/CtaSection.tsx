// The close: back to a nearly empty stage, so the last thing on screen is the button.
// The facts under it are there to be quoted — one line each, none of them a claim the
// page has not already shown happening.

import { motion } from "motion/react";
import { CopyNameButton } from "../components/CopyNameButton.tsx";
import { SITE } from "../content/site.ts";

export function CtaSection() {
  const { cta } = SITE;
  return (
    <section id="cta" className="border-line relative overflow-hidden border-t px-5 py-24 text-center sm:px-8 md:py-32">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px bg-primary-soft" />
      <motion.div
        initial={{ opacity: 0, y: 22 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.55, ease: [0.22, 0.61, 0.36, 1] }}
        className="mx-auto flex w-full max-w-[38rem] flex-col items-center gap-7"
      >
        <p className="text-primary font-mono text-[11px] tracking-[0.18em] uppercase">Last step · 30 seconds</p>
        <h2 className="text-ink text-[clamp(1.9rem,6vw,3.5rem)] leading-[1.16] font-semibold tracking-[-0.02em]">
          {cta.title.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </h2>
        <CopyNameButton />
        <ul className="text-subtle mt-2 flex flex-col items-center gap-2 text-[12px] sm:text-[13px]">
          {cta.facts.map((fact) => (
            <li key={fact} className="flex items-center gap-2">
              <span aria-hidden="true" className="bg-primary-soft size-1.5 rounded-full" />
              {fact}
            </li>
          ))}
        </ul>
      </motion.div>
    </section>
  );
}
