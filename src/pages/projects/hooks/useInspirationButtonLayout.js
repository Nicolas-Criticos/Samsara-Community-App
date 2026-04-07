import { useLayoutEffect, useState } from "react";

export function useInspirationButtonLayout(inspirationLink, detailProject, innerRef) {
  const [style, setStyle] = useState({});

  useLayoutEffect(() => {
    if (!inspirationLink || !innerRef.current) return undefined;
    const el = innerRef.current;
    const raf = requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect();
      const size = 44;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      setStyle({
        position: "absolute",
        left: `${centerX + 0.35 * centerX - size / 2}px`,
        top: `${centerY - 0.35 * centerY - size / 2}px`,
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [inspirationLink, detailProject, innerRef]);

  return style;
}
