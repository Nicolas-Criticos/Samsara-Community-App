import { useEffect, useState } from "react";
import { Modal, TextField, TextAreaField, VgButton } from "../../components/ui.jsx";
import { ANIMAL_CATEGORY_LABELS } from "../../../../lib/vg/constants.js";
import { clampNumber, monthLabel } from "../../../../lib/vg/helpers.js";

const FIELDS = [
  { key: "opening_count", label: "Opening count" },
  { key: "births", label: "Births" },
  { key: "deaths", label: "Deaths" },
  { key: "slaughtered", label: "Slaughtered" },
  { key: "sold", label: "Sold" },
  { key: "purchased", label: "Purchased" },
];

export default function LivestockMonthInput({
  open,
  onClose,
  onSave,
  year,
  month,
  animalType,
  category,
  initial,
}) {
  const [form, setForm] = useState({
    opening_count: 0,
    births: 0,
    deaths: 0,
    slaughtered: 0,
    sold: 0,
    purchased: 0,
    notes: "",
  });

  useEffect(() => {
    if (!open) return;
    setForm({
      opening_count: clampNumber(initial?.opening_count, 0),
      births: clampNumber(initial?.births, 0),
      deaths: clampNumber(initial?.deaths, 0),
      slaughtered: clampNumber(initial?.slaughtered, 0),
      sold: clampNumber(initial?.sold, 0),
      purchased: clampNumber(initial?.purchased, 0),
      notes: initial?.notes || "",
    });
  }, [open, initial]);

  const closing =
    Number(form.opening_count || 0) +
    Number(form.births || 0) +
    Number(form.purchased || 0) -
    Number(form.deaths || 0) -
    Number(form.slaughtered || 0) -
    Number(form.sold || 0);

  const submit = (e) => {
    e.preventDefault();
    onSave({
      year,
      month,
      animal_type: animalType,
      category,
      opening_count: clampNumber(form.opening_count, 0),
      births: clampNumber(form.births, 0),
      deaths: clampNumber(form.deaths, 0),
      slaughtered: clampNumber(form.slaughtered, 0),
      sold: clampNumber(form.sold, 0),
      purchased: clampNumber(form.purchased, 0),
      notes: form.notes || null,
    });
  };

  return (
    <Modal open={open} onClose={onClose} title={`${ANIMAL_CATEGORY_LABELS[category] || category} · ${monthLabel(year, month)}`}>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          {FIELDS.map((f) => (
            <TextField
              key={f.key}
              label={f.label}
              type="number"
              min="0"
              value={form[f.key]}
              onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
            />
          ))}
        </div>
        <TextAreaField
          label="Notes"
          value={form.notes}
          onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))}
        />
        <div className="flex items-center justify-between rounded-xl bg-[rgba(122,112,94,0.08)] px-4 py-3">
          <div className="text-[0.62rem] uppercase tracking-[0.18em] text-[rgba(75,71,65,0.55)]">
            Closing count
          </div>
          <div className="text-[1.2rem] font-light text-[#2b2b2b]">{closing}</div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <VgButton variant="ghost" onClick={onClose}>Cancel</VgButton>
          <VgButton type="submit">Save</VgButton>
        </div>
      </form>
    </Modal>
  );
}
