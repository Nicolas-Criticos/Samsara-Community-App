export function ErrorState({ message = "Failed to load data.", onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <p className="text-3xl">⚠️</p>
      <p className="text-[0.88rem] font-light text-[rgba(43,43,43,0.85)]">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-1 cursor-pointer rounded-full border border-[rgba(90,70,50,0.2)] px-5 py-2 text-[0.65rem] uppercase tracking-[0.1em] text-[rgba(60,55,45,0.65)] transition-all hover:bg-black/5"
        >
          Retry
        </button>
      )}
    </div>
  );
}

export default ErrorState;
