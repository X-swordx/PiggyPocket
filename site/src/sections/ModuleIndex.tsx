// The explicit answer to "which modules does this product have?" — six cards, each with
// a real captured screen and the concrete actions that screen supports. Features are
// written out here so a visitor can understand the whole product without scrolling the
// camera story first.

import { SITE } from "../content/site.ts";
import { asset } from "../engine/asset.ts";

const GUTTER = "mx-auto w-full max-w-[72rem] px-5 sm:px-8";

export function ModuleIndex() {
  const { modules } = SITE;
  return (
    <section id="features" className={`${GUTTER} border-line scroll-mt-4 border-t py-16 sm:py-20`}>
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-primary font-mono text-[11px] tracking-[0.18em] uppercase">{modules.eyebrow}</p>
          <h2 className="text-ink mt-3 text-[clamp(1.8rem,4.6vw,3.2rem)] leading-[1.16] font-semibold tracking-[-0.025em]">
            {modules.title.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h2>
        </div>
        <p className="text-muted max-w-[28rem] text-[14px] leading-7">{modules.intro}</p>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {modules.items.map((item) => (
          <article
            key={item.name}
            className="border-line bg-surface rounded-2xl border p-5 shadow-[0_16px_50px_rgb(89_39_48_/_0.05)] sm:p-6"
          >
            <div className="flex items-start gap-4 sm:gap-5">
              <div className="border-line bg-bg w-[5.5rem] shrink-0 overflow-hidden rounded-[1.25rem] border-4 border-white shadow-lg sm:w-[6.5rem]">
                <img
                  src={asset(item.image)}
                  alt={item.imageAlt}
                  className="h-[11.9rem] w-full object-cover object-top sm:h-[14rem]"
                  draggable={false}
                />
              </div>
              <div className="min-w-0 pt-1">
                <p className="text-primary font-mono text-[10px] tracking-[0.16em]">
                  {item.index} / {String(modules.items.length).padStart(2, "0")}
                </p>
                <h3 className="text-ink mt-1.5 text-[clamp(1.15rem,2.4vw,1.45rem)] leading-tight font-semibold">
                  {item.name}
                </h3>
                <p className="text-muted mt-2 text-[13px] leading-6">{item.tagline}</p>
              </div>
            </div>
            <ul className="border-line mt-5 space-y-2 border-t pt-4">
              {item.features.map((feature) => (
                <li key={feature} className="text-ink flex gap-2.5 text-[13px] leading-6">
                  <span aria-hidden="true" className="bg-primary mt-[0.55rem] size-1.5 shrink-0 rounded-full" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
