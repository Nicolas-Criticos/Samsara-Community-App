export function LoadingSpinner({ message = "Loading…", size = "md" }) {
  const dim = size === "sm" ? 20 : size === "lg" ? 48 : 32;

  return (
    <div className="flex flex-col items-center justify-center gap-3 p-10">
      <svg
        width={dim}
        height={dim}
        viewBox="0 0 32 32"
        fill="none"
        style={{ animation: "spin 1.2s linear infinite" }}
      >
        <circle
          cx="16"
          cy="16"
          r="13"
          stroke="rgba(90,70,50,0.15)"
          strokeWidth="2.5"
        />
        <path
          d="M16 3 A13 13 0 0 1 29 16"
          stroke="rgba(90,70,50,0.6)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
      {message && (
        <p className="text-[0.78rem] font-light tracking-wide text-[rgba(60,55,45,0.65)]">
          {message}
        </p>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}

export default LoadingSpinner;
