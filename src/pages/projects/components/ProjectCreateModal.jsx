import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { Button, TextArea, TextInput } from "../../../components/ui/index.js";

export default function ProjectCreateModal({
  isVrisch,
  open,
  createProjectMutation,
  onCancel,
}) {
  const imageFileRef = useRef(null);
  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      title: "",
      description: "",
      timeline: "",
      status: "open",
      cny: false,
      inspiration: "",
      startDate: "",
      endDate: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        title: "",
        description: "",
        timeline: "",
        status: "open",
        cny: false,
        inspiration: "",
        startDate: "",
        endDate: "",
      });
      if (imageFileRef.current) imageFileRef.current.value = "";
    }
  }, [open, reset]);

  if (!open) return null;

  const pending = createProjectMutation.isPending;

  function onSubmit(values) {
    const imageFile = imageFileRef.current?.files?.[0] ?? null;
    const { startDate, endDate, ...rest } = values;
    createProjectMutation.mutate({
      ...rest,
      imageFile,
      start_date: startDate || null,
      end_date: endDate || null,
    });
  }

  // Shared date input class
  const dateInputClass = `w-full rounded-[10px] p-2.5 text-[0.8rem] ${
    isVrisch
      ? "border border-white/10 bg-white/5 text-[rgba(240,235,225,0.9)] placeholder:text-[rgba(200,195,185,0.45)] [color-scheme:dark]"
      : "border-0 bg-white/90 text-[#2b2b2b] [color-scheme:light]"
  }`;

  const dateLabelClass = `text-[0.68rem] uppercase tracking-[0.12em] ${
    isVrisch ? "text-[rgba(200,195,185,0.55)]" : "text-[rgba(75,71,65,0.5)]"
  }`;

  return (
    <div
      className={`fixed inset-0 z-12 flex items-center justify-center ${
        isVrisch ? "bg-black/80" : "bg-[rgba(246,243,238,0.92)]"
      }`}
    >
      <form
        className={`flex h-[min(85vw,560px)] w-[min(85vw,520px)] flex-col gap-3 overflow-auto rounded-full px-12 py-12 text-center ${
          isVrisch
            ? "bg-[radial-gradient(circle_at_center,rgba(26,26,26,0.96),rgba(10,10,10,0.94))] text-[rgba(235,230,220,0.92)] shadow-[0_0_55px_rgba(0,0,0,0.9),inset_0_0_28px_rgba(255,255,255,0.035)]"
            : "bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.98),rgba(235,230,220,0.9))]"
        }`}
        onSubmit={handleSubmit(onSubmit)}
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
          disabled={pending}
          {...register("title", { required: true })}
        />

        <TextArea
          className={`w-full resize-none rounded-[10px] p-2.5 ${
            isVrisch
              ? "border border-white/10 bg-white/5 text-[rgba(240,235,225,0.9)] placeholder:text-[rgba(200,195,185,0.45)]"
              : "border-0 bg-white/90 text-[#2b2b2b]"
          }`}
          placeholder={isVrisch ? "Project description" : "Description"}
          disabled={pending}
          {...register("description", { required: true })}
        />

        <TextArea
          className={`w-full resize-none rounded-[10px] p-2.5 ${
            isVrisch
              ? "border border-white/10 bg-white/5 text-[rgba(240,235,225,0.9)] placeholder:text-[rgba(200,195,185,0.45)]"
              : "border-0 bg-white/90 text-[#2b2b2b]"
          }`}
          placeholder={isVrisch ? "Timeline / rhythm" : "Timespan / rhythm"}
          disabled={pending}
          {...register("timeline")}
        />

        {/* ── Date range ── */}
        <div className="flex gap-2">
          <div className="flex flex-1 flex-col gap-1 text-left">
            <label className={dateLabelClass} htmlFor="start_date_input">
              Start date
            </label>
            <input
              id="start_date_input"
              type="date"
              className={dateInputClass}
              disabled={pending}
              {...register("startDate")}
            />
          </div>
          <div className="flex flex-1 flex-col gap-1 text-left">
            <label className={dateLabelClass} htmlFor="end_date_input">
              End date
            </label>
            <input
              id="end_date_input"
              type="date"
              className={dateInputClass}
              disabled={pending}
              {...register("endDate")}
            />
          </div>
        </div>

        <input
          ref={imageFileRef}
          type="file"
          className={`w-full text-[0.75rem] ${
            isVrisch
              ? "text-[rgba(220,215,205,0.75)]"
              : "text-[rgba(43,43,43,0.7)]"
          }`}
          accept="image/*"
          disabled={pending}
        />

        <div
          className={`flex flex-col gap-2 text-left text-[0.72rem] ${
            isVrisch ? "text-[rgba(225,220,210,0.85)]" : "text-[rgba(43,43,43,0.75)]"
          }`}
        >
          <label className="flex cursor-pointer items-center gap-2">
            <input type="radio" value="open" disabled={pending} {...register("status")} />
            🟢 Open contribution
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input type="radio" value="application" disabled={pending} {...register("status")} />
            🟠 By application
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input type="radio" value="closed" disabled={pending} {...register("status")} />
            🔴 Closed
          </label>
        </div>

        {!isVrisch ? (
          <>
            <label className="cursor-pointer text-[0.7rem] uppercase tracking-[0.14em] opacity-75">
              <input type="checkbox" className="mr-1.5" disabled={pending} {...register("cny")} />
              🧧 Chinese New Year
            </label>
            <div className="mt-1.5">
              <label className="text-[11px] uppercase tracking-wide text-[rgba(42,40,40,0.5)]" htmlFor="inspiration_link">
                Vision Board
              </label>
              <TextInput
                type="url"
                id="inspiration_link"
                name="inspiration_link"
                className="mt-1 h-8 w-full rounded-md border border-dashed border-[rgba(143,139,106,0.35)] bg-[rgba(255,255,255,0.04)] px-2 py-1 text-[13px] text-[#2b2a2a] placeholder:text-[rgba(5,4,4,0.35)] focus:border-solid focus:border-[rgba(143,139,106,0.6)] focus:opacity-100 focus:outline-none"
                placeholder="Pinterest, Figma, Drive…"
                disabled={pending}
                {...register("inspiration")}
              />
            </div>
          </>
        ) : null}

        <div />
        <Button
          type="submit"
          className={`w-full cursor-pointer rounded-full border-0 px-5 py-2 text-[0.62rem] uppercase tracking-[0.18em] text-white shadow-none transition-all duration-250 ease-in-out hover:scale-105 hover:shadow-[0_0_14px_rgba(140,120,80,0.45)] disabled:cursor-not-allowed disabled:opacity-50 ${
            isVrisch
              ? "bg-[radial-gradient(circle,#7f8f6a,#4e5c3f)]"
              : "bg-[radial-gradient(circle,#8a7f6d,#6f6456)]"
          }`}
          fullWidth
          disabled={pending}
        >
          {pending ? "…" : isVrisch ? "SEED PROJECT" : "SEED OFFERING"}
        </Button>
        <Button
          type="button"
          fullWidth
          disabled={pending}
          onClick={onCancel}
          className={
            isVrisch
              ? "w-full border border-white/15 bg-transparent text-[rgba(220,215,205,0.6)] shadow-none hover:scale-100"
              : undefined
          }
        >
          CANCEL
        </Button>
      </form>
    </div>
  );
}
