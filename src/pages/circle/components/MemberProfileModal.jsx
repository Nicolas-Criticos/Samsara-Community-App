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
      className="member-profile"
      id="memberProfile"
      style={{ display: "flex" }}
    >
      <div className="member-profile-inner">
        <IconButton
          icon="close"
          className="profile-close-btn"
          onClick={onClose}
          aria-label="Close"
        />

        <header className="profile-header">
          <h2 className="profile-username">
            {memberDisplayName(profileMember)}
          </h2>
          <div className="profile-handle">
            {profileMember.username ? `(${profileMember.username})` : ""}
          </div>
        </header>

        <section className="profile-identity">
          <div className="profile-avatar-wrapper">
            <label className="profile-avatar-label">
              {profileMember.profile_image_url?.startsWith("http") ? (
                <img
                  className="profile-avatar"
                  alt="Profile"
                  src={profileMember.profile_image_url}
                />
              ) : (
                <div className="profile-avatar profile-avatar--empty" />
              )}
              {isSelf ? (
                <>
                  <span className="avatar-overlay">Change</span>
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

          <div className="profile-archetype">
            {profileMember.archetype
              ? profileMember.archetype.toUpperCase()
              : ""}
          </div>
        </section>

        <section className="profile-expression">
          {isSelf ? (
            <TextInput
              type="url"
              className="profile-link-input"
              placeholder="Website or Socials link"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          ) : profileMember.website ? (
            <a
              className="profile-link-display"
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
            className="profile-bio"
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
                style={{ display: "none" }}
                onChange={onPdfChange}
              />
              <button
                type="button"
                className="profile-pdf-btn"
                onClick={() => pdfInputRef.current?.click()}
              >
                PDF
              </button>
            </>
          ) : null}
        </section>

        <section className="profile-activity">
          <div className="profile-projects">
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
                  <div key={p.id} className="profile-project-item">
                    {p.title} — {p.role}
                  </div>
                ))}
              </>
            )}
          </div>
        </section>

        {isSelf ? (
          <footer className="profile-actions">
            <Button
              type="button"
              className="project-action-btn"
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
