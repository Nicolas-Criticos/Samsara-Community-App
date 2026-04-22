import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase.js";

export default function ProjectReviewForm({ projectId, isVrisch }) {
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    final_result: "",
    successes: "",
    learning_curves: "",
    rooms_to_improve: "",
    duration_notes: "",
    total_cost: "",
    bom_summary: "",
    overall_rating: 7,
  });

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
  const inputClass = `w-full bg-transparent border-0 border-b py-1.5 text-[0.88rem] focus:outline-none transition-colors ${fieldBorder} ${fieldText}`;

  const headingClass = `text-[0.75rem] uppercase tracking-[0.2em] mb-8 ${
    isVrisch ? "text-[rgba(235,230,220,0.7)]" : "text-[rgba(43,43,43,0.6)]"
  }`;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.final_result.trim()) {
      alert("Final result is required.");
      return;
    }
    setSaving(true);
    const { data, error } = await supabase
      .from("project_reviews")
      .insert({
        project_id: projectId,
        final_result: form.final_result.trim(),
        successes: form.successes.trim() || null,
        learning_curves: form.learning_curves.trim() || null,
        rooms_to_improve: form.rooms_to_improve.trim() || null,
        duration_notes: form.duration_notes.trim() || null,
        total_cost: form.total_cost !== "" ? Number(form.total_cost) : null,
        bom_summary: form.bom_summary.trim() || null,
        overall_rating: Number(form.overall_rating),
      })
      .select()
      .single();
    setSaving(false);
    if (error) {
      alert("Failed to save review: " + error.message);
      return;
    }
    setReview(data);
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
      { label: "Duration", value: review.duration_notes },
      {
        label: "Total Cost (ZAR)",
        value:
          review.total_cost != null
            ? `R ${Number(review.total_cost).toLocaleString()}`
            : null,
      },
      { label: "BOM Summary", value: review.bom_summary },
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
        </div>
      </>
    );
  }

  return (
    <>
      {divider}
      <div>
        <h2 className={headingClass}>Completion Review</h2>
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
              Duration — How long did it take?
            </label>
            <input
              type="text"
              className={inputClass}
              placeholder="e.g. 3 months"
              value={form.duration_notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, duration_notes: e.target.value }))
              }
              disabled={saving}
            />
          </div>

          <div>
            <label className={labelClass}>
              Total Cost — Estimated total spend (ZAR)
            </label>
            <input
              type="number"
              className={inputClass}
              placeholder="0"
              min="0"
              value={form.total_cost}
              onChange={(e) =>
                setForm((f) => ({ ...f, total_cost: e.target.value }))
              }
              disabled={saving}
            />
          </div>

          <div>
            <label className={labelClass}>
              BOM Summary — Key materials and costs
            </label>
            <textarea
              className={`${textareaClass} min-h-[56px]`}
              placeholder="List of key materials…"
              value={form.bom_summary}
              onChange={(e) =>
                setForm((f) => ({ ...f, bom_summary: e.target.value }))
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
