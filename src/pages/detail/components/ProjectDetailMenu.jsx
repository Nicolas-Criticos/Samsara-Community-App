import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
} from "@headlessui/react";

function VerticalDotsIcon({ className }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <circle cx="12" cy="5" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="12" cy="19" r="2" />
    </svg>
  );
}

/**
 * Project actions: edit, join / apply / leave (Headless UI Menu popover).
 */
export default function ProjectDetailMenu({
  isVrisch,
  canEdit,
  showLeave,
  showJoin,
  showApply,
  onEdit,
  onLeave,
  onJoin,
  onApply,
}) {
  if (!canEdit && !showLeave && !showJoin && !showApply) return null;

  const itemClass =
    "block w-full px-3 py-2 text-left text-sm font-normal normal-case tracking-normal outline-none !m-0 !h-auto !min-h-0 !w-full !rounded-none !border-0 !px-3 !py-2 !font-sans !normal-case !tracking-normal !text-neutral-800 !bg-transparent !shadow-none hover:!scale-100 hover:!shadow-none active:!scale-100 hover:!bg-neutral-100";

  return (
    <Menu as="div" className="relative shrink-0">
      <MenuButton
        type="button"
        className={`!inline-flex !h-auto !min-h-0 !w-auto !min-w-0 !items-center !justify-center !rounded-none !border-0 !bg-transparent !p-1.5 !px-1.5 !py-1.5 !font-sans !normal-case !tracking-normal !shadow-none transition-opacity hover:!scale-100 hover:!opacity-100 hover:!shadow-none active:!scale-100 focus-visible:!opacity-100 focus:outline-none ${
          isVrisch
            ? "!text-[rgba(235,230,220,0.65)]"
            : "!text-[rgba(43,43,43,0.5)]"
        }`}
        aria-label="Project menu"
      >
        <VerticalDotsIcon />
      </MenuButton>

      <MenuItems
        transition
        anchor="bottom end"
        modal={false}
        className="z-50 mt-2 min-w-[10.5rem] origin-top-right rounded-lg border border-neutral-200 bg-white py-1 shadow-md outline-none transition [--anchor-gap:6px] data-closed:scale-95 data-closed:opacity-0"
      >
        {canEdit ? (
          <MenuItem>
            {({ focus }) => (
              <button
                type="button"
                className={`${itemClass} ${focus ? "!bg-neutral-100" : ""}`}
                onClick={() => onEdit?.()}
              >
                Edit
              </button>
            )}
          </MenuItem>
        ) : null}
        {showJoin ? (
          <MenuItem>
            {({ focus }) => (
              <button
                type="button"
                className={`${itemClass} ${focus ? "!bg-neutral-100" : ""}`}
                onClick={() => onJoin?.()}
              >
                Join project
              </button>
            )}
          </MenuItem>
        ) : null}
        {showApply ? (
          <MenuItem>
            {({ focus }) => (
              <button
                type="button"
                className={`${itemClass} ${focus ? "!bg-neutral-100" : ""}`}
                onClick={() => onApply?.()}
              >
                Apply to join
              </button>
            )}
          </MenuItem>
        ) : null}
        {showLeave ? (
          <MenuItem>
            {({ focus }) => (
              <button
                type="button"
                className={`${itemClass} ${focus ? "!bg-neutral-100" : ""}`}
                onClick={() => onLeave?.()}
              >
                Leave project
              </button>
            )}
          </MenuItem>
        ) : null}
      </MenuItems>
    </Menu>
  );
}
