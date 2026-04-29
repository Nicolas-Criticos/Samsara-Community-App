export default function RealmSwitch({
  isVrisch,
  onRealmChange,
  viewMode,
  onViewModeChange,
}) {
  return (
    <div
      className={`fixed right-7 top-6 z-10 flex flex-col items-end gap-2 max-md:left-1/2 max-md:right-auto max-md:top-4 max-md:-translate-x-1/2 max-md:items-center ${
        isVrisch
          ? "text-[rgba(230,225,215,0.8)]"
          : "text-[rgba(43,43,43,0.6)]"
      }`}
    >
      <div className="flex items-center gap-[0.8rem] text-[0.65rem] uppercase tracking-[0.18em]">
        <span
          className={`transition-opacity duration-300 ease-in-out ${
            isVrisch ? "opacity-50" : "opacity-100"
          }`}
        >
          SAMSARA
        </span>
        <label className="relative h-6 w-[46px]">
          <input
            type="checkbox"
            className="h-0 w-0 opacity-0"
            checked={isVrisch}
            onChange={(e) => onRealmChange(e.target.checked)}
          />
          <span
            className={`absolute inset-0 cursor-pointer rounded-full transition-colors duration-350 ease-in-out ${
              isVrisch
                ? "bg-[rgba(140,155,120,0.55)]"
                : "bg-[rgba(180,170,150,0.45)]"
            }`}
          >
            <span
              className={`absolute left-[3px] top-[3px] h-[18px] w-[18px] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.95),rgba(230,225,215,0.85))] transition-transform duration-350 ease-in-out ${
                isVrisch ? "translate-x-[22px]" : ""
              }`}
            />
          </span>
        </label>
        <span
          className={`transition-opacity duration-300 ease-in-out ${
            isVrisch
              ? "text-[rgba(255,250,240,1)] opacity-100"
              : "opacity-50"
          }`}
        >
          VRISCHGEWAGT
        </span>
      </div>

      <div className="flex items-center gap-2">
        {["field", "table", "calendar", "gantt"].map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => onViewModeChange(mode)}
            className={`cursor-pointer text-[0.62rem] uppercase tracking-[0.16em] transition-all rounded-full px-2.5 py-[0.28rem] ${
              isVrisch
                ? viewMode === mode
                  ? "bg-[rgba(180,128,48,0.22)] border border-[rgba(205,158,60,0.48)] text-[rgba(255,228,168,0.96)] shadow-[0_0_8px_rgba(185,138,50,0.18),inset_0_1px_3px_rgba(255,220,140,0.12)]"
                  : "bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.09)] text-[rgba(200,190,174,0.5)] hover:bg-[rgba(255,255,255,0.09)] hover:text-[rgba(225,215,198,0.78)] hover:border-[rgba(255,255,255,0.16)]"
                : viewMode === mode
                  ? "opacity-100 underline underline-offset-2 text-[rgba(43,43,43,0.68)]"
                  : "opacity-50 text-[rgba(43,43,43,0.68)] hover:opacity-100"
            }`}
          >
            {mode}
          </button>
        ))}
      </div>
    </div>
  );
}
