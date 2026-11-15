import { useEffect, useRef, useState } from "react";
import { SITE } from "../content/site.ts";

type CopyState = "idle" | "copied" | "failed";

function legacyCopy(text: string) {
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.left = "-9999px";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  const ok = document.execCommand("copy");
  area.remove();
  return ok;
}

export function CopyNameButton() {
  const [state, setState] = useState<CopyState>("idle");
  const timer = useRef<number | null>(null);

  useEffect(() => () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
  }, []);

  const copy = async () => {
    let ok = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(SITE.name);
        ok = true;
      }
    } catch {
      ok = false;
    }
    if (!ok) {
      try {
        ok = legacyCopy(SITE.name);
      } catch {
        ok = false;
      }
    }
    setState(ok ? "copied" : "failed");
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState("idle"), 4000);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={copy}
        className="bg-primary focus-visible:outline-primary inline-flex items-center gap-2 rounded-full px-8 py-4 text-[15px] font-medium text-white shadow-[0_10px_30px_rgb(201_79_104_/_0.22)] transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 motion-reduce:transform-none"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="8" y="8" width="11" height="11" rx="2.5" />
          <path d="M16 8V6.5A2.5 2.5 0 0 0 13.5 4h-8A2.5 2.5 0 0 0 3 6.5v8A2.5 2.5 0 0 0 5.5 17H8" />
        </svg>
        {state === "copied" ? "已复制，去微信搜索" : `复制「${SITE.name}」`}
      </button>
      <p aria-live="polite" className="text-muted min-h-5 text-[13px] leading-5">
        {state === "copied"
          ? "已复制。打开微信，搜索「猪猪生活本」"
          : state === "failed"
            ? "复制没成功，请手动输入「猪猪生活本」"
            : "复制后，打开微信搜索这个小程序"}
      </p>
      <p className="text-subtle flex flex-wrap items-center justify-center gap-x-2 gap-y-1 font-mono text-[11px]">
        <span>01 复制名称</span>
        <span aria-hidden="true">→</span>
        <span>02 打开微信</span>
        <span aria-hidden="true">→</span>
        <span>03 搜索小程序</span>
      </p>
    </div>
  );
}
