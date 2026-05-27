import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, SectionLabel, VgButton, EmptyState } from "../../components/ui.jsx";
import AnimalRegistryModal from "./AnimalRegistryModal.jsx";
import {
  ANIMAL_CATEGORY_LABELS,
} from "../../../../lib/vg/constants.js";
import { formatDate } from "../../../../lib/vg/helpers.js";
import * as api from "../../../../lib/vg/api.js";

export default function AnimalRegistry({ animalType }) {
  const [expanded, setExpanded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const qc = useQueryClient();

  const registryQ = useQuery({
    queryKey: ["vg", "registry", animalType],
    queryFn: () => api.fetchLivestockRegistry({ animalType }),
    enabled: expanded,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["vg", "registry", animalType] });

  const createMut = useMutation({
    mutationFn: (row) => api.createRegistryAnimal(row),
    onSuccess: () => {
      invalidate();
      setModalOpen(false);
    },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, patch }) => api.updateRegistryAnimal(id, patch),
    onSuccess: () => {
      invalidate();
      setModalOpen(false);
    },
  });
  const deleteMut = useMutation({
    mutationFn: (id) => api.deleteRegistryAnimal(id),
    onSuccess: () => {
      invalidate();
      setModalOpen(false);
    },
  });

  const handleSave = (row) => {
    if (editing?.id) updateMut.mutate({ id: editing.id, patch: row });
    else createMut.mutate(row);
  };

  return (
    <Card className="px-5 py-5">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="!bg-transparent !shadow-none !text-[#2b2b2b] !p-0 flex w-full items-center justify-between"
      >
        <SectionLabel className="!normal-case">
          Individual Registry · {animalType}
        </SectionLabel>
        <span className="text-[0.78rem] text-[rgba(75,71,65,0.6)]">
          {expanded ? "▾" : "▸"}
        </span>
      </button>

      {expanded ? (
        <div className="mt-4 flex flex-col gap-3">
          <div className="flex justify-end">
            <VgButton
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
            >
              + Add animal
            </VgButton>
          </div>

          {(registryQ.data || []).length === 0 ? (
            <EmptyState icon="🐑" title="No animals registered yet" hint="Add individual animals to track lineage and history." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[0.8rem]">
                <thead>
                  <tr className="text-left text-[0.6rem] uppercase tracking-[0.18em] text-[rgba(75,71,65,0.55)]">
                    <th className="py-2 pr-3">Tag</th>
                    <th className="py-2 pr-3">Name</th>
                    <th className="py-2 pr-3">Category</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3">Born</th>
                    <th className="py-2 pr-3">Notes</th>
                    <th className="py-2 pr-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {(registryQ.data || []).map((a) => (
                    <tr key={a.id} className="border-t border-[rgba(122,112,94,0.12)]">
                      <td className="py-2 pr-3 text-[#2b2b2b]">{a.tag_id || "—"}</td>
                      <td className="py-2 pr-3 text-[#2b2b2b]">{a.name || "—"}</td>
                      <td className="py-2 pr-3 text-[rgba(75,71,65,0.78)]">
                        {ANIMAL_CATEGORY_LABELS[a.category] || a.category}
                      </td>
                      <td className="py-2 pr-3 text-[rgba(75,71,65,0.78)] capitalize">{a.status}</td>
                      <td className="py-2 pr-3 text-[rgba(75,71,65,0.78)]">
                        {a.birth_date ? formatDate(a.birth_date) : "—"}
                      </td>
                      <td className="py-2 pr-3 text-[rgba(75,71,65,0.7)] truncate max-w-[180px]">
                        {a.notes || ""}
                      </td>
                      <td className="py-2 pr-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(a);
                            setModalOpen(true);
                          }}
                          className="!bg-transparent !text-[rgba(75,71,65,0.85)] !shadow-none !px-2 !py-1 !text-[0.65rem] !tracking-[0.14em] hover:!bg-[rgba(122,112,94,0.07)]"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}

      <AnimalRegistryModal
        open={modalOpen}
        animalType={animalType}
        initial={editing}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        onDelete={(id) => deleteMut.mutate(id)}
      />
    </Card>
  );
}
