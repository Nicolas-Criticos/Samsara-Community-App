import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";
import { supabase } from "../lib/supabase.js";
import { projectDetailHref } from "../lib/slug.js";
import { useAuthSession } from "../hooks/useAuthSession.js";

const STORAGE_KEY = "samsara_seen_completions";

function getSeenIds() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function markSeen(id) {
  try {
    const seen = getSeenIds();
    if (!seen.includes(id)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...seen, id]));
    }
  } catch {
    // localStorage unavailable — ignore
  }
}

const CONFETTI_COLORS = ["#f59e0b", "#fbbf24", "#f97316", "#fde68a", "#ffffff", "#fb923c"];

function fireConfetti(opts = {}) {
  confetti({
    particleCount: 160,
    spread: 80,
    origin: { y: 0.55 },
    colors: CONFETTI_COLORS,
    zIndex: 10001,
    ...opts,
  });
}

const CARD_STYLES = `
  @keyframes celebration-bounce {
    0%   { transform: scale(0.65) translateY(50px); opacity: 0; }
    55%  { transform: scale(1.06) translateY(-10px); opacity: 1; }
    75%  { transform: scale(0.97) translateY(4px); }
    100% { transform: scale(1) translateY(0); opacity: 1; }
  }
  @keyframes celebration-glow {
    0%, 100% {
      box-shadow:
        0 0 22px 5px rgba(251,191,36,0.28),
        0 24px 64px rgba(0,0,0,0.45);
    }
    50% {
      box-shadow:
        0 0 44px 14px rgba(251,191,36,0.52),
        0 24px 64px rgba(0,0,0,0.45);
    }
  }
  .celebration-card {
    animation:
      celebration-bounce 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) forwards,
      celebration-glow 2.2s ease-in-out 0.6s infinite;
  }
`;

export default function ProjectCompletionCelebration() {
  const { data: session } = useAuthSession();
  const userId = session?.user?.id ?? null;
  const [queue, setQueue] = useState([]);
  const navigate = useNavigate();
  const hasChecked = useRef(false);

  useEffect(() => {
    if (!userId) {
      // User logged out — reset so the check runs again on next login
      hasChecked.current = false;
      setQueue([]);
      return;
    }
    if (hasChecked.current) return;
    hasChecked.current = true;

    let cancelled = false;

    async function checkCompletedProjects() {
      const { data, error } = await supabase
        .from("projects")
        .select("id, title, description, realm, completed_at")
        .not("completed_at", "is", null)
        .eq("archived", false);

      if (cancelled || error || !data) return;

      const seen = getSeenIds();
      const unseen = data.filter((p) => !seen.includes(p.id));
      setQueue(unseen);
    }

    checkCompletedProjects();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const current = queue[0] ?? null;

  // Burst confetti whenever a new project appears
  useEffect(() => {
    if (!current) return;
    const t = setTimeout(() => fireConfetti(), 250);
    return () => clearTimeout(t);
  }, [current?.id]);

  const dismiss = useCallback((id) => {
    markSeen(id);
    setQueue((q) => q.filter((p) => p.id !== id));
  }, []);

  if (!current) return null;

  const href = projectDetailHref(current.realm, current.title);

  function handleViewProject() {
    dismiss(current.id);
    if (href) navigate(href);
  }

  function handleCelebrate() {
    // Two-wave extra confetti burst
    fireConfetti({ particleCount: 200, spread: 120, origin: { y: 0.6 } });
    setTimeout(() => {
      fireConfetti({ particleCount: 80, spread: 60, origin: { x: 0.2, y: 0.65 } });
      fireConfetti({ particleCount: 80, spread: 60, origin: { x: 0.8, y: 0.65 } });
    }, 250);
    setTimeout(() => dismiss(current.id), 700);
  }

  return createPortal(
    <>
      <style>{CARD_STYLES}</style>

      {/* Full-screen overlay */}
      <div
        className="fixed inset-0 flex items-center justify-center p-4"
        style={{ zIndex: 9999, backgroundColor: "rgba(0,0,0,0.65)" }}
      >
        {/* Card */}
        <div
          className="celebration-card relative w-full max-w-md rounded-2xl bg-white overflow-hidden text-center"
          style={{ zIndex: 10000 }}
        >
          {/* Top gold gradient stripe */}
          <div
            className="h-2 w-full"
            style={{
              background: "linear-gradient(90deg, #f97316, #fbbf24, #f59e0b)",
            }}
          />

          <div className="px-8 py-8">
            {/* Big emoji */}
            <div className="text-6xl mb-3 leading-none select-none">🎉</div>

            {/* Eyebrow label */}
            <p
              className="text-xs font-bold tracking-widest uppercase mb-2"
              style={{ color: "#f59e0b" }}
            >
              Project Complete!
            </p>

            {/* Project title */}
            <h2 className="text-2xl font-bold text-stone-900 leading-tight mb-3">
              {current.title}
            </h2>

            {/* Description */}
            {current.description && (
              <p
                className="text-stone-500 text-sm leading-relaxed mb-6 overflow-hidden"
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                }}
              >
                {current.description}
              </p>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              {href && (
                <button
                  onClick={handleViewProject}
                  className="flex-1 rounded-xl py-3 px-4 text-sm font-semibold bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors cursor-pointer"
                >
                  View Project
                </button>
              )}
              <button
                onClick={handleCelebrate}
                className="flex-1 rounded-xl py-3 px-4 text-sm font-bold text-white transition-opacity hover:opacity-90 cursor-pointer"
                style={{
                  background: "linear-gradient(135deg, #f59e0b, #f97316)",
                }}
              >
                Celebrate! 🎊
              </button>
            </div>

            {/* Queue indicator */}
            {queue.length > 1 && (
              <p className="mt-4 text-xs text-stone-400">
                +{queue.length - 1} more completed{" "}
                {queue.length - 1 === 1 ? "project" : "projects"}
              </p>
            )}
          </div>

          {/* Bottom gold gradient stripe */}
          <div
            className="h-1 w-full"
            style={{
              background: "linear-gradient(90deg, #f59e0b, #fbbf24, #f97316)",
            }}
          />
        </div>
      </div>
    </>,
    document.body
  );
}
