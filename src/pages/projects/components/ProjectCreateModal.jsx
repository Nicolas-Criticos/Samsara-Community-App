import { Button, TextArea, TextInput } from "../../../components/ui/index.js";

export default function ProjectCreateModal({
  isVrisch,
  open,
  title,
  setTitle,
  description,
  setDescription,
  timeline,
  setTimeline,
  status,
  setStatus,
  cny,
  setCny,
  inspiration,
  setInspiration,
  imageFileRef,
  onSubmit,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 z-12 flex items-center justify-center ${
        isVrisch ? "bg-black/80" : "bg-[rgba(246,243,238,0.92)]"
      }`}
    >
      <div
        className={`flex h-[min(85vw,520px)] w-[min(85vw,520px)] flex-col gap-3 overflow-auto rounded-full px-12 py-12 text-center ${
          isVrisch
            ? "bg-[radial-gradient(circle_at_center,rgba(26,26,26,0.96),rgba(10,10,10,0.94))] text-[rgba(235,230,220,0.92)] shadow-[0_0_55px_rgba(0,0,0,0.9),inset_0_0_28px_rgba(255,255,255,0.035)]"
            : "bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.98),rgba(235,230,220,0.9))]"
        }`}
      >
        <h3>{isVrisch ? "Seed a Project" : "Seed an Offering"}</h3>

        <TextInput
          className={`w-full rounded-[10px] p-2.5 ${
            isVrisch
              ? "border border-white/10 bg-white/5 text-[rgba(240,235,225,0.9)] placeholder:text-[rgba(200,195,185,0.45)]"
              : "border-0 bg-white/90 text-[#2b2b2b]"
          }`}
          placeholder={isVrisch ? "Project name" : "Name of Offering"}
          autoComplete="off"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <TextArea
          className={`w-full resize-none rounded-[10px] p-2.5 ${
            isVrisch
              ? "border border-white/10 bg-white/5 text-[rgba(240,235,225,0.9)] placeholder:text-[rgba(200,195,185,0.45)]"
              : "border-0 bg-white/90 text-[#2b2b2b]"
          }`}
          placeholder={isVrisch ? "Project description" : "Description"}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <TextArea
          className={`w-full resize-none rounded-[10px] p-2.5 ${
            isVrisch
              ? "border border-white/10 bg-white/5 text-[rgba(240,235,225,0.9)] placeholder:text-[rgba(200,195,185,0.45)]"
              : "border-0 bg-white/90 text-[#2b2b2b]"
          }`}
          placeholder={isVrisch ? "Timeline / rhythm" : "Timespan / rhythm"}
          value={timeline}
          onChange={(e) => setTimeline(e.target.value)}
        />

        <input
          ref={imageFileRef}
          type="file"
          className={`w-full text-[0.75rem] ${
            isVrisch ? "text-[rgba(220,215,205,0.75)]" : "text-[rgba(43,43,43,0.7)]"
          }`}
          accept="image/*"
        />

        <div
          className={`flex flex-col gap-2 text-left text-[0.72rem] ${
            isVrisch ? "text-[rgba(225,220,210,0.85)]" : "text-[rgba(43,43,43,0.75)]"
          }`}
        >
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="projectStatus"
              checked={status === "open"}
              onChange={() => setStatus("open")}
            />
            🟢 Open contribution
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="projectStatus"
              checked={status === "application"}
              onChange={() => setStatus("application")}
            />
            🟠 By application
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="projectStatus"
              checked={status === "closed"}
              onChange={() => setStatus("closed")}
            />
            🔴 Closed
          </label>
        </div>

        {!isVrisch ? (
          <>
            <label className="cursor-pointer text-[0.7rem] uppercase tracking-[0.14em] opacity-75">
              <input
                type="checkbox"
                className="mr-1.5"
                checked={cny}
                onChange={(e) => setCny(e.target.checked)}
              />
              🧧 Chinese New Year
            </label>
            <div className="mt-1.5">
              <label
                className="text-[11px] uppercase tracking-wide text-[rgba(42,40,40,0.5)]"
                htmlFor="inspiration_link"
              >
                Vision Board
              </label>
              <TextInput
                type="url"
                id="inspiration_link"
                name="inspiration_link"
                className="mt-1 h-8 w-full rounded-md border border-dashed border-[rgba(143,139,106,0.35)] bg-[rgba(255,255,255,0.04)] px-2 py-1 text-[13px] text-[#2b2a2a] placeholder:text-[rgba(5,4,4,0.35)] focus:border-solid focus:border-[rgba(143,139,106,0.6)] focus:opacity-100 focus:outline-none"
                placeholder="Pinterest, Figma, Drive…"
                value={inspiration}
                onChange={(e) => setInspiration(e.target.value)}
              />
            </div>
          </>
        ) : null}

        <div />
        <Button
          type="button"
          className={`w-full cursor-pointer rounded-full border-0 px-5 py-2 text-[0.62rem] uppercase tracking-[0.18em] text-white shadow-none transition-all duration-250 ease-in-out hover:scale-105 hover:shadow-[0_0_14px_rgba(140,120,80,0.45)] ${
            isVrisch
              ? "bg-[radial-gradient(circle,#7f8f6a,#4e5c3f)]"
              : "bg-[radial-gradient(circle,#8a7f6d,#6f6456)]"
          }`}
          fullWidth
          onClick={onSubmit}
        >
          {isVrisch ? "SEED PROJECT" : "SEED OFFERING"}
        </Button>
        <Button
          type="button"
          fullWidth
          onClick={onCancel}
          className={
            isVrisch
              ? "w-full border border-white/15 bg-transparent text-[rgba(220,215,205,0.6)] shadow-none hover:scale-100"
              : undefined
          }
        >
          CANCEL
        </Button>
      </div>
    </div>
  );
}
