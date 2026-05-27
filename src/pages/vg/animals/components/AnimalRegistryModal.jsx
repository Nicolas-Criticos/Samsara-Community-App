import { useEffect, useState } from "react";
import {
  Modal,
  TextField,
  TextAreaField,
  SelectField,
  VgButton,
} from "../../components/ui.jsx";
import {
  ANIMAL_TYPES,
  ANIMAL_STATUSES,
} from "../../../../lib/vg/constants.js";

export default function AnimalRegistryModal({
  open,
  onClose,
  onSave,
  onDelete,
  animalType,
  initial,
}) {
  const [form, setForm] = useState({
    animal_type: animalType,
    category: ANIMAL_TYPES[animalType].categories[0],
    tag_id: "",
    name: "",
    birth_date: "",
    status: "active",
    notes: "",
  });

  useEffect(() => {
    if (!open) return;
    setForm({
      animal_type: initial?.animal_type || animalType,
      category: initial?.category || ANIMAL_TYPES[animalType].categories[0],
      tag_id: initial?.tag_id || "",
      name: initial?.name || "",
      birth_date: initial?.birth_date || "",
      status: initial?.status || "active",
      notes: initial?.notes || "",
    });
  }, [open, initial, animalType]);

  const submit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      birth_date: form.birth_date || null,
      tag_id: form.tag_id || null,
      name: form.name || null,
      notes: form.notes || null,
    });
  };

  return (
    <Modal open={open} onClose={onClose} title={initial?.id ? "Edit animal" : "Add animal"}>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <SelectField
            label="Type"
            value={form.animal_type}
            onChange={(e) =>
              setForm((s) => ({
                ...s,
                animal_type: e.target.value,
                category: ANIMAL_TYPES[e.target.value].categories[0],
              }))
            }
            options={Object.keys(ANIMAL_TYPES).map((k) => ({
              value: k,
              label: ANIMAL_TYPES[k].label,
            }))}
          />
          <SelectField
            label="Category"
            value={form.category}
            onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))}
            options={ANIMAL_TYPES[form.animal_type].categories}
          />
          <TextField
            label="Tag ID"
            value={form.tag_id}
            onChange={(e) => setForm((s) => ({ ...s, tag_id: e.target.value }))}
          />
          <TextField
            label="Name"
            value={form.name}
            onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
          />
          <TextField
            label="Birth date"
            type="date"
            value={form.birth_date}
            onChange={(e) => setForm((s) => ({ ...s, birth_date: e.target.value }))}
          />
          <SelectField
            label="Status"
            value={form.status}
            onChange={(e) => setForm((s) => ({ ...s, status: e.target.value }))}
            options={ANIMAL_STATUSES}
          />
        </div>
        <TextAreaField
          label="Notes"
          value={form.notes}
          onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))}
        />
        <div className="flex items-center justify-between pt-2">
          {initial?.id ? (
            <VgButton variant="danger" onClick={() => onDelete(initial.id)} type="button">
              Delete
            </VgButton>
          ) : <span />}
          <div className="flex gap-2 ml-auto">
            <VgButton variant="ghost" onClick={onClose} type="button">Cancel</VgButton>
            <VgButton type="submit">Save</VgButton>
          </div>
        </div>
      </form>
    </Modal>
  );
}
