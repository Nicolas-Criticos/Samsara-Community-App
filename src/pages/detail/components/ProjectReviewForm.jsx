import { useEffect, useRef, useState } from "react";
import { supabase } from "../../../lib/supabase.js";
import { uploadReviewPhoto } from "../../../lib/storage.js";
import { fetchBomItems } from "../../../lib/projectBomApi.js";

function computeDuration(startDate, endDate) {
  if (!startDate) return null;
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  const diffMs = end - start;
  if (diffMs <= 0) return null;
  const days = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (days < 7) return `${days} day${days !== 1 ? "s" : ""}`;
  const weeks = Math.round(days / 7);
  if (weeks < 5) return `${weeks} week${weeks !== 1 ? "s" : ""}`;
  const months = Math.round(days / 30.44);
  return `${months} month${months !== 1 ? "s" : ""}`;
}

function formatRand(amount) {
  return amount.toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function ProjectReviewForm({ project, isVrisch, onAfterSave }) {
  const projectId = project?.id;
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    final_result: "",
    successes: "",
    learning_curves: "",
    rooms_to_improve: "",
    overall_rating: 7,
  });
  const [photoFiles, setPhotoFiles] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const fileInputRef = useRef(null);
  const [bomItems, setBomItems] = useState([]);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    supabase
      .from("project_reviews")
      .select("*")
      .eq("project_id", projectId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setReview(data);
        setLoading(false);
      });
  }, [projectId]);

  useEffect(() => {
    if (!project?.id) return;
    fetchBomItems(project.id).then(({ data }) => {
      if (data) setBomItems(data);
    });
  }, [project?.id]);

  const totalCost = bomItems.reduce(
    (sum, item) => sum + (item.quantity || 0) * (item.unit_cost || 0),
    0
  );

  function handlePhotoChange(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setPhotoFiles((prev) => [...prev, ...files]);
    setPhotoPreviews((prev) => [
      ...prev,
      ...files.map((f) => URL.createObjectURL(f)),
    ]);
    // Reset so the same file can be re-added if removed
    e.target.value = "";
  }

  function removePhoto(index) {
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  }

  const duration = computeDuration(
    project?.start_date,
    project?.completed_at
  );

  const muted = isVrisch
    ? "text-[rgba(200,195,185,0.55)]"
    : "text-[rgba(75,71,65,0.5)]";

  const labelClass = `block text-[0.65rem] uppercase tracking-widest mb-1.5 ${muted}`;

  const fieldBorder = isVrisch
    ? "border-white/15 focus:border-white/35"
    : "border-[rgba(90,70,50,0.18)] focus:border-[rgba(90,70,50,0.42)]";

  const fieldText = isVrisch
    ? "text-[rgba(235,230,220,0.92)] placeholder:text-[rgba(200,195,185,0.28)]"
    : "text-[rgba(43,43,43,0.86)] placeholder:text-[rgba(75,71,65,0.28)]";

  const textareaClass = `w-full resize-none bg-transparent border-0 border-b py-1.5 text-[0.88rem] leading-relaxed focus:outline-none transition-colors ${fieldBorder} ${fieldText}`;

  const headingClass = `text-[0.75rem] uppercase tracking-[0.2em] mb-8 ${
    isVrisch ? "text-[rgba(235,230,220,0.7)]" : "text-[rgba(43,43,43,0.6)]"
  }`;

  const rowBorder = isVrisch
    ? "border-white/8"
    : "border-[rgba(90,70,50,0.1)]";

  const bodyText = isVrisch
    ? "text-[rgba(220,215,205,0.88)]"
    : "text-[rgba(43,43,43,0.82)]";

  const bomSection = (
    <div className="space-y-5">
      <div>
        <span className={labelClass}>Bill of Materials</span>
        {bomItems.length === 0 ? (
          <p className={`text-[0.8rem] ${muted}`}>
            No bill of materials recorded for this project.
          </p>
        ) : (
          <div className="mt-2">
            <div
              className={`grid grid-cols-4 gap-x-3 pb-1.5 text-[0.6rem] uppercase tracking-widest border-b ${rowBorder} ${muted}`}
            >
              <span>Name</span>
              <span className="text-right">Qty</span>
              <span className="text-right">Unit Cost</span>
              <span className="text-right">Total</span>
            </div>
            {bomItems.map((item) => {
              const lineTotal = (item.quantity || 0) * (item.unit_cost || 0);
              return (
                <div
                  key={item.id}
                  className={`grid grid-cols-4 gap-x-3 py-2 text-[0.82rem] border-b ${rowBorder} ${bodyText}`}
                >
                  <span className="truncate">{item.name}</span>
                  <span className="text-right">{item.quantity ?? 0}</span>
                  <span className="text-right">
                    R {formatRand(item.unit_cost ?? 0)}
                  </span>
                  <span className="text-right">R {formatRand(lineTotal)}</span>
                </div>
              );
            })}
            <div className={`pt-2 text-right text-[0.65rem] uppercase tracking-widest ${muted}`}>
              Total:{" "}
              <span
                className={`text-[1.1rem] tracking-wide ${bodyText}`}
                style={{ fontFamily: "'Cormorant Garamond', Cormorant, serif" }}
              >
                R {formatRand(totalCost)}
              </span>
            </div>
          </div>
        )}
      </div>

      <div>
        <span className={labelClass}>Project Cost</span>
        <p
          className={`text-[1.6rem] leading-none ${bodyText}`}
          style={{ fontFamily: "'Cormorant Garamond', Cormorant, serif" }}
        >
          R {formatRand(totalCost)}
        </p>
      </div>
    </div>
  );

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.final_result.trim()) {
      alert("Final result is required.");
      return;
    }
    setSaving(true);

    const photoUrls = [];
    for (const file of photoFiles) {
      try {
        const url = await uploadReviewPhoto(projectId, file);
        photoUrls.push(url);
      } catch (err) {
        console.warn("Photo upload failed:", err);
      }
    }

    const { data, error } = await supabase
      .from("project_reviews")
      .insert({
        project_id: projectId,
        final_result: form.final_result.trim(),
        successes: form.successes.trim() || null,
        learning_curves: form.learning_curves.trim() || null,
        rooms_to_improve: form.rooms_to_improve.trim() || null,
        overall_rating: Number(form.overall_rating),
        photos: photoUrls.length > 0 ? photoUrls : null,
      })
      .select()
      .single();

    setSaving(false);
    if (error) {
      alert("Failed to save review: " + error.message);
      return;
    }
    setReview(data);
    if (onAfterSave) onAfterSave();
  }

  if (loading) return null;

  const divider = (
    <div
      className={`my-10 border-t ${
        isVrisch ? "border-white/8" : "border-[rgba(90,70,50,0.1)]"
      }`}
    />
  );

  if (review) {
    const readFields = [
      { label: "Final Result", value: review.final_result },
      { label: "Successes", value: review.successes },
      { label: "Learning Curves", value: review.learning_curves },
      { label: "Rooms to Improve", value: review.rooms_to_improve },
      ...(duration ? [{ label: "Duration", value: duration }] : []),
      {
        label: "Overall Rating",
        value:
          review.overall_rating != null
            ? `${review.overall_rating} / 10`
            : null,
      },
    ];

    return (
      <>
        {divider}
        <div className="space-y-6">
          <h2 className={headingClass}>Completion Review</h2>
          {bomSection}
          {readFields.map(({ label, value }) =>
            value ? (
              <div key={label}>
                <span className={labelClass}>{label}</span>
                <p
                  className={`text-[0.88rem] leading-relaxed ${
                    isVrisch
                      ? "text-[rgba(220,215,205,0.88)]"
                      : "text-[rgba(43,43,43,0.82)]"
                  }`}
                >
                  {value}
                </p>
              </div>
            ) : null
          )}
          {review.photos?.length > 0 ? (
            <div>
              <span className={labelClass}>Photos</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {review.photos.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt=""
                    className="h-20 w-20 rounded-lg object-cover"
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </>
    );
  }

  return (
    <>
      {divider}
      <div>
        <h2 className={headingClass}>Completion Review</h2>
        {duration ? (
          <div className="mb-7">
            <span className={labelClass}>Duration</span>
            <p
              className={`text-[0.88rem] ${
                isVrisch
                  ? "text-[rgba(220,215,205,0.88)]"
                  : "text-[rgba(43,43,43,0.82)]"
              }`}
            >
              {duration}
            </p>
          </div>
        ) : null}
        <div className="mb-7">{bomSection}</div>
        <form onSubmit={handleSubmit} className="space-y-7">
          <div>
            <label className={labelClass}>
              Final Result — What was the outcome?
            </label>
            <textarea
              className={`${textareaClass} min-h-[64px]`}
              placeholder="Describe the final outcome…"
              value={form.final_result}
              onChange={(e) =>
                setForm((f) => ({ ...f, final_result: e.target.value }))
              }
              disabled={saving}
            />
          </div>

          <div>
            <label className={labelClass}>Successes — What went well?</label>
            <textarea
              className={`${textareaClass} min-h-[56px]`}
              placeholder="Things that worked…"
              value={form.successes}
              onChange={(e) =>
                setForm((f) => ({ ...f, successes: e.target.value }))
              }
              disabled={saving}
            />
          </div>

          <div>
            <label className={labelClass}>
              Learning Curves — What was harder than expected?
            </label>
            <textarea
              className={`${textareaClass} min-h-[56px]`}
              placeholder="Unexpected challenges…"
              value={form.learning_curves}
              onChange={(e) =>
                setForm((f) => ({ ...f, learning_curves: e.target.value }))
              }
              disabled={saving}
            />
          </div>

          <div>
            <label className={labelClass}>
              Rooms to Improve — What would you do differently?
            </label>
            <textarea
              className={`${textareaClass} min-h-[56px]`}
              placeholder="Next time I would…"
              value={form.rooms_to_improve}
              onChange={(e) =>
                setForm((f) => ({ ...f, rooms_to_improve: e.target.value }))
              }
              disabled={saving}
            />
          </div>

          <div>
            <label className={labelClass}>
              Overall Rating — {form.overall_rating} / 10
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={form.overall_rating}
              onChange={(e) =>
                setForm((f) => ({ ...f, overall_rating: e.target.value }))
              }
              disabled={saving}
              className="w-full accent-current"
            />
            <div
              className={`mt-1 flex justify-between text-[0.6rem] ${muted}`}
            >
              <span>1</span>
              <span>10</span>
            </div>
          </div>

          <div>
            <label className={labelClass}>Photos (optional)</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoChange}
              disabled={saving}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={saving}
              className={`rounded-lg border px-3 py-1.5 text-[0.72rem] uppercase tracking-[0.12em] transition-all hover:opacity-80 disabled:opacity-40 ${
                isVrisch
                  ? "border-white/15 text-[rgba(220,215,205,0.7)]"
                  : "border-[rgba(90,70,50,0.2)] text-[rgba(43,43,43,0.65)]"
              }`}
            >
              Add photos
            </button>
            {photoPreviews.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {photoPreviews.map((src, i) => (
                  <div key={i} className="relative">
                    <img
                      src={src}
                      alt=""
                      className="h-16 w-16 rounded-lg object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[0.55rem] text-white"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={saving}
            className={`cursor-pointer rounded-full border-0 px-5 py-2 text-[0.62rem] uppercase tracking-[0.18em] text-white shadow-none transition-all duration-250 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 ${
              isVrisch
                ? "bg-[radial-gradient(circle,#7f8f6a,#4e5c3f)]"
                : "bg-[radial-gradient(circle,#8a7f6d,#6f6456)]"
            }`}
          >
            {saving ? "Saving…" : "Save Review"}
          </button>
        </form>
      </div>
    </>
  );
}
