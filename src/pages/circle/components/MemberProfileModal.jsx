import { useRef } from "react";
import {
  Button,
  IconButton,
  TextArea,
  TextInput,
} from "../../../components/ui/index.js";
import { memberDisplayName } from "../../../lib/memberDisplay.js";

export default function MemberProfileModal({
  profileMember,
  isSelf,
  bio,
  setBio,
  website,
  setWebsite,
  projectItems,
  onClose,
  onSaveProfile,
  onAvatarChange,
  onPdfChange,
}) {
  const pdfInputRef = useRef(null);

  if (!profileMember) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(246,243,238,0.9)]"
      id="memberProfile"
    >
      <div className="relative flex h-[min(90vw,560px)] w-[min(90vw,560px)] flex-col items-center justify-center gap-5 overflow-auto rounded-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.98),rgba(235,230,220,0.9))] px-12 py-12 text-center shadow-[0_0_45px_rgba(0,0,0,0.12),inset_0_0_24px_rgba(255,255,255,0.6)] max-md:h-[92vw] max-md:w-[92vw] max-md:gap-[0.9rem] max-md:px-8 max-md:py-8 max-md:portrait:h-auto max-md:portrait:min-h-[70vh] max-md:portrait:rounded-[28px] max-md:portrait:px-6 max-md:portrait:py-8 max-md:portrait:gap-[1.4rem]">
        <IconButton
          icon="close"
          className="absolute left-1/2 top-3.5 z-5 flex h-8 w-8 -translate-x-1/2 cursor-pointer items-center justify-center rounded-full border-0 bg-white/35 text-[1.25rem] font-light leading-none text-[rgba(60,50,40,0.65)] shadow-none transition-all duration-250 ease-in-out hover:scale-[1.12]! hover:bg-white/70 [&_span_svg]:max-h-4 [&_span_svg]:max-w-4"
          onClick={onClose}
          aria-label="Close"
        />

        <header className="mb-0 flex flex-col items-center gap-1.5 max-md:portrait:mb-2.5">
          <h2 className="text-[1.35rem] font-normal tracking-wide text-[#2b2b2b] max-md:portrait:text-[1.2rem]">
            {memberDisplayName(profileMember)}
          </h2>
          <div className="text-[0.75rem] tracking-[0.06em] opacity-65">
            {profileMember.username ? `(${profileMember.username})` : ""}
          </div>
        </header>

        <section>
          <div className="relative mx-auto mb-6 flex h-[120px] w-[120px] cursor-pointer items-center justify-center max-md:portrait:h-24 max-md:portrait:w-24">
            <label className="group relative block h-full w-full cursor-pointer">
              {profileMember.profile_image_url?.startsWith("http") ? (
                <img
                  className="h-full w-full rounded-full object-cover shadow-[0_0_18px_rgba(0,0,0,0.12),inset_0_0_12px_rgba(255,255,255,0.5)]"
                  alt="Profile"
                  src={profileMember.profile_image_url}
                />
              ) : (
                <div
                  className="block min-h-[120px] w-full rounded-full bg-[rgba(200,200,200,0.25)] shadow-[0_0_18px_rgba(0,0,0,0.12),inset_0_0_12px_rgba(255,255,255,0.5)]"
                />
              )}
              {isSelf ? (
                <>
                  <span className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-full bg-black/45 text-[0.7rem] uppercase tracking-[0.12em] text-white/85 opacity-0 transition-opacity duration-300 group-hover:opacity-100 max-md:portrait:text-[0.65rem]">
                    Change
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={onAvatarChange}
                  />
                </>
              ) : null}
            </label>
          </div>

          <div className="mb-3 mt-1 rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.65),rgba(230,225,215,0.45))] px-4 py-1.5 text-[0.7rem] uppercase tracking-[0.28em] text-[rgba(120,105,85,0.75)] shadow-[inset_0_0_10px_rgba(255,255,255,0.5),0_2px_8px_rgba(0,0,0,0.08)] max-md:portrait:text-[0.6rem] max-md:portrait:tracking-[0.22em]">
            {profileMember.archetype
              ? profileMember.archetype.toUpperCase()
              : ""}
          </div>
        </section>

        <section className="relative flex w-full max-w-[340px] flex-col items-center gap-3">
          {isSelf ? (
            <TextInput
              type="url"
              className="relative w-full rounded-[14px] border-0 bg-white/65 px-3.5 py-3 text-center text-[0.85rem] text-[rgba(43,43,43,0.75)] max-md:portrait:w-full"
              placeholder="Website or Socials link"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          ) : profileMember.website ? (
            <a
              className="border-b border-[rgba(90,70,50,0.35)] pb-0.5 text-[0.8rem] tracking-[0.08em] text-[rgba(90,70,50,0.75)] no-underline transition-opacity hover:opacity-[0.85]"
              href={
                profileMember.website.startsWith("http")
                  ? profileMember.website
                  : `https://${profileMember.website}`
              }
              target="_blank"
              rel="noopener noreferrer"
            >
              Find out more
            </a>
          ) : null}

          <TextArea
            className="relative w-full rounded-[14px] border-0 bg-white/65 px-3.5 py-3 text-center text-[0.85rem] text-[rgba(43,43,43,0.75)] max-md:portrait:w-full"
            placeholder="Write what path you took to get here.."
            rows={5}
            value={bio}
            disabled={!isSelf}
            onChange={(e) => setBio(e.target.value)}
          />

          {isSelf ? (
            <>
              <input
                ref={pdfInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={onPdfChange}
              />
              <button
                type="button"
                className="absolute -right-2.5 top-1/2 -translate-y-1/2 cursor-pointer rounded-full border border-black/25 bg-white/35 px-1.5 py-0.5 text-[0.55rem] uppercase tracking-[0.18em] text-black/55 opacity-45 shadow-none transition-all duration-250 ease-in-out hover:bg-white/65 hover:opacity-100"
                onClick={() => pdfInputRef.current?.click()}
              >
                PDF
              </button>
            </>
          ) : null}
        </section>

        <section>
          <div className="w-full max-md:portrait:max-h-[26vh] max-md:portrait:overflow-y-auto">
            {projectItems === null ? (
              <p>Loading…</p>
            ) : projectItems.length === 0 ? (
              <>
                <h4>Projects</h4>
                <p>No active projects</p>
              </>
            ) : (
              <>
                <h4>Projects</h4>
                {projectItems.map((p) => (
                  <div
                    key={p.id}
                    className="text-[0.8rem] text-[rgba(43,43,43,0.75)]"
                  >
                    {p.title} — {p.role}
                  </div>
                ))}
              </>
            )}
          </div>
        </section>

        {isSelf ? (
          <footer>
            <Button
              type="button"
              className="cursor-pointer justify-center rounded-full border-0 bg-[radial-gradient(circle,#8a7f6d,#6f6456)] px-5 py-2 text-[0.62rem] uppercase tracking-[0.18em] text-white shadow-none transition-all duration-250 ease-in-out hover:scale-105 hover:shadow-[0_0_14px_rgba(140,120,80,0.45)] max-md:inline-flex max-md:max-w-[280px] max-md:w-full"
              fullWidth
              onClick={onSaveProfile}
            >
              Save Profile
            </Button>
          </footer>
        ) : null}
      </div>
    </div>
  );
}
