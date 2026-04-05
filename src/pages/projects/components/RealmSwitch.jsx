export default function RealmSwitch({ isVrisch, onRealmChange }) {
  return (
    <div
      className={`fixed right-7 top-6 z-10 flex items-center gap-[0.8rem] text-[0.65rem] uppercase tracking-[0.18em] max-md:left-1/2 max-md:right-auto max-md:top-4 max-md:-translate-x-1/2 max-md:justify-center ${
        isVrisch
          ? "text-[rgba(230,225,215,0.8)]"
          : "text-[rgba(43,43,43,0.6)]"
      }`}
    >
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
  );
}
