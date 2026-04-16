import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchBomItems,
  insertBomItem,
  updateBomItem,
  deleteBomItem,
} from "../../../lib/projectBomApi.js";

function formatRands(n) {
  return `R ${Number(n || 0).toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function BomItemRow({ item, isVrisch, onUpdate, onDelete, disabled }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(item.name);
  const [qty, setQty] = useState(item.quantity);
  const [cost, setCost] = useState(item.unit_cost);
  const nameRef = useRef(null);

  useEffect(() => {
    if (editing && nameRef.current) nameRef.current.focus();
  }, [editing]);

  const lineTotal = Number(qty || 0) * Number(cost || 0);

  const inputClass = isVrisch
    ? "w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-[0.8rem] text-[rgba(240,235,225,0.92)] outline-none focus:border-white/25 [color-scheme:dark]"
    : "w-full rounded-lg border-0 bg-white/90 px-2 py-1.5 text-[0.8rem] outline-none focus:ring-1 focus:ring-[rgba(90,70,50,0.25)]";

  const muted = isVrisch
    ? "text-[rgba(200,195,185,0.72)]"
    : "text-[rgba(60,55,45,0.65)]";

  if (editing) {
    return (
      <tr
        className={
          isVrisch
            ? "border-b border-white/5"
            : "border-b border-[rgba(90,70,50,0.08)]"
        }
      >
        <td className="py-2 pe-2">
          <input
            ref={nameRef}
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Item name"
          />
        </td>
        <td className="py-2 pe-2">
          <input
            className={`${inputClass} text-right`}
            type="number"
            min="0"
            step="1"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
          />
        </td>
        <td className="py-2 pe-2">
          <input
            className={`${inputClass} text-right`}
            type="number"
            min="0"
            step="0.01"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
          />
        </td>
        <td className={`py-2 pe-2 text-right text-[0.8rem] ${muted}`}>
          {formatRands(lineTotal)}
        </td>
        <td className="py-2 text-right">
          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              disabled={disabled || !name.trim()}
              className={`rounded px-2 py-1 text-[0.65rem] uppercase tracking-wider transition-opacity ${
                isVrisch
                  ? "bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30"
                  : "bg-emerald-100 text-emerald-900 hover:bg-emerald-200"
              } ${disabled || !name.trim() ? "opacity-40" : ""}`}
              onClick={() => {
                onUpdate(item.id, {
                  name: name.trim(),
                  quantity: Number(qty) || 1,
                  unit_cost: Number(cost) || 0,
                });
                setEditing(false);
              }}
            >
              ✓
            </button>
            <button
              type="button"
              className={`rounded px-2 py-1 text-[0.65rem] uppercase tracking-wider ${
                isVrisch
                  ? "text-[rgba(200,195,185,0.6)] hover:text-[rgba(200,195,185,0.9)]"
                  : "text-[rgba(60,55,45,0.45)] hover:text-[rgba(60,55,45,0.8)]"
              }`}
              onClick={() => {
                setName(item.name);
                setQty(item.quantity);
                setCost(item.unit_cost);
                setEditing(false);
              }}
            >
              ✕
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr
      className={`group cursor-pointer transition-colors ${
        isVrisch
          ? "border-b border-white/5 hover:bg-white/[0.03]"
          : "border-b border-[rgba(90,70,50,0.08)] hover:bg-black/[0.02]"
      }`}
      onClick={() => setEditing(true)}
    >
      <td className="py-2.5 pe-2 text-[0.85rem]">{item.name}</td>
      <td className={`py-2.5 pe-2 text-right text-[0.85rem] ${muted}`}>
        {item.quantity}
      </td>
      <td className={`py-2.5 pe-2 text-right text-[0.85rem] ${muted}`}>
        {formatRands(item.unit_cost)}
      </td>
      <td className="py-2.5 pe-2 text-right text-[0.85rem] font-medium">
        {formatRands(lineTotal)}
      </td>
      <td className="py-2.5 text-right">
        <button
          type="button"
          className={`opacity-0 transition-opacity group-hover:opacity-100 rounded px-2 py-1 text-[0.65rem] ${
            isVrisch
              ? "text-red-300/60 hover:text-red-300"
              : "text-red-500/50 hover:text-red-600"
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item.id);
          }}
        >
          ✕
        </button>
      </td>
    </tr>
  );
}

export default function ProjectBomPanel({ open, onClose, projectId, isVrisch }) {
  const queryClient = useQueryClient();
  const bomKey = ["bomItems", projectId];

  const { data: items = [], isLoading } = useQuery({
    queryKey: bomKey,
    queryFn: async () => {
      const { data, error } = await fetchBomItems(projectId);
      if (error) throw error;
      return data || [];
    },
    enabled: open && Boolean(projectId),
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: bomKey });
  }, [queryClient, projectId]);

  const addMutation = useMutation({
    mutationFn: (payload) => insertBomItem(payload),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, fields }) => updateBomItem(id, fields),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteBomItem(id),
    onSuccess: invalidate,
  });

  const [newName, setNewName] = useState("");
  const [newQty, setNewQty] = useState("1");
  const [newCost, setNewCost] = useState("");
  const newNameRef = useRef(null);

  const grandTotal = useMemo(
    () =>
      items.reduce(
        (sum, it) => sum + Number(it.quantity || 0) * Number(it.unit_cost || 0),
        0
      ),
    [items]
  );

  const handleAdd = () => {
    if (!newName.trim()) return;
    addMutation.mutate({
      projectId,
      name: newName.trim(),
      quantity: Number(newQty) || 1,
      unit_cost: Number(newCost) || 0,
    });
    setNewName("");
    setNewQty("1");
    setNewCost("");
    setTimeout(() => newNameRef.current?.focus(), 50);
  };

  const busy =
    addMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  if (!open) return null;

  const overlayBg = isVrisch
    ? "bg-black/60 backdrop-blur-sm"
    : "bg-black/30 backdrop-blur-sm";

  const panelBg = isVrisch
    ? "bg-[#141414] border-white/10 text-[rgba(235,230,220,0.92)]"
    : "bg-[#faf8f4] border-[rgba(90,70,50,0.12)] text-[#2b2b2b]";

  const muted = isVrisch
    ? "text-[rgba(200,195,185,0.72)]"
    : "text-[rgba(60,55,45,0.65)]";

  const headerBorder = isVrisch
    ? "border-white/10"
    : "border-[rgba(90,70,50,0.1)]";

  const inputClass = isVrisch
    ? "w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-[0.8rem] text-[rgba(240,235,225,0.92)] outline-none focus:border-white/25 placeholder:text-[rgba(200,195,185,0.35)] [color-scheme:dark]"
    : "w-full rounded-lg border-0 bg-white/90 px-2 py-1.5 text-[0.8rem] outline-none focus:ring-1 focus:ring-[rgba(90,70,50,0.25)] placeholder:text-[rgba(60,55,45,0.35)]";

  return (
    <div className={`fixed inset-0 z-50 flex justify-end ${overlayBg}`}>
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden
      />
      <div
        className={`relative z-10 flex h-full w-full max-w-lg flex-col border-s shadow-2xl ${panelBg}`}
      >
        {/* Header */}
        <div
          className={`flex shrink-0 items-center justify-between border-b px-5 py-4 ${headerBorder}`}
        >
          <h2 className="text-[0.8rem] font-medium uppercase tracking-[0.18em]">
            Bill of Materials
          </h2>
          <button
            type="button"
            className={`text-[1rem] transition-opacity hover:opacity-100 ${muted}`}
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {isLoading ? (
            <p className={`text-[0.85rem] ${muted}`}>Loading…</p>
          ) : items.length === 0 ? (
            <p className={`text-[0.85rem] ${muted}`}>
              No items yet. Add your first below.
            </p>
          ) : (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr
                  className={`text-[0.6rem] uppercase tracking-[0.14em] ${muted}`}
                >
                  <th className="pb-2 pe-2 font-normal">Item</th>
                  <th className="pb-2 pe-2 text-right font-normal">Qty</th>
                  <th className="pb-2 pe-2 text-right font-normal">
                    Unit Cost
                  </th>
                  <th className="pb-2 pe-2 text-right font-normal">Total</th>
                  <th className="pb-2 w-8" />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <BomItemRow
                    key={item.id}
                    item={item}
                    isVrisch={isVrisch}
                    disabled={busy}
                    onUpdate={(id, fields) =>
                      updateMutation.mutate({ id, fields })
                    }
                    onDelete={(id) => {
                      if (confirm("Remove this item?"))
                        deleteMutation.mutate(id);
                    }}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Grand total */}
        {items.length > 0 ? (
          <div
            className={`shrink-0 border-t px-5 py-3 ${headerBorder}`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-[0.65rem] uppercase tracking-[0.16em] ${muted}`}
              >
                Total
              </span>
              <span className="text-[1.1rem] font-medium tracking-wide">
                {formatRands(grandTotal)}
              </span>
            </div>
          </div>
        ) : null}

        {/* Add new item */}
        <div
          className={`shrink-0 border-t px-5 py-4 ${headerBorder}`}
        >
          <div className="mb-2 text-[0.6rem] uppercase tracking-[0.14em] font-medium">
            Add item
          </div>
          <div className="grid grid-cols-[1fr_4rem_5rem] gap-2">
            <input
              ref={newNameRef}
              className={inputClass}
              placeholder="Item name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <input
              className={`${inputClass} text-right`}
              type="number"
              min="0"
              step="1"
              placeholder="Qty"
              value={newQty}
              onChange={(e) => setNewQty(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <input
              className={`${inputClass} text-right`}
              type="number"
              min="0"
              step="0.01"
              placeholder="Cost"
              value={newCost}
              onChange={(e) => setNewCost(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
          </div>
          <button
            type="button"
            disabled={busy || !newName.trim()}
            className={`mt-3 w-full cursor-pointer rounded-full px-4 py-2 text-[0.65rem] uppercase tracking-[0.16em] transition-all hover:scale-[1.01] ${
              isVrisch
                ? "bg-white/10 text-[rgba(235,230,220,0.85)] hover:bg-white/15"
                : "bg-[rgba(90,70,50,0.08)] text-[rgba(55,48,38,0.85)] hover:bg-[rgba(90,70,50,0.14)]"
            } ${busy || !newName.trim() ? "opacity-40 cursor-not-allowed" : ""}`}
            onClick={handleAdd}
          >
            + Add
          </button>
        </div>
      </div>
    </div>
  );
}
