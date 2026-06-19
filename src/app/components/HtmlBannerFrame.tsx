import { useState, useEffect } from "react";

// Iframe que reproduce un banner HTML5 en loop recargándolo cada loopMs.
export function HtmlBannerFrame({
  src,
  title,
  className,
  style,
  loopMs = 15000,
}: {
  src: string;
  title?: string;
  className?: string;
  style?: React.CSSProperties;
  loopMs?: number;
}) {
  const [k, setK] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setK((x) => x + 1), loopMs);
    return () => clearInterval(id);
  }, [loopMs]);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "banner-error") {
        console.warn("[Banner error]", e.data.msg, "—", e.data.src, "line", e.data.line);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);
  return (
    <iframe
      key={k}
      src={src}
      title={title}
      scrolling="no"
      className={className}
      style={{ border: 0, ...style }}
    />
  );
}
