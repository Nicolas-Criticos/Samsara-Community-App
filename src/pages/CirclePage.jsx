import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase.js";
import "../styles/circle.css";

function randomBubblePosition(size) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const cx = w / 2;
  const cy = h / 2;
  const forbidden = Math.min(w, h) * 0.22;

  let x;
  let y;
  for (let i = 0; i < 120; i++) {
    const tx = Math.random() * (w - size);
    const ty = Math.random() * (h - size);
    const dx = tx + size / 2 - cx;
    const dy = ty + size / 2 - cy;
    if (Math.sqrt(dx * dx + dy * dy) > forbidden) {
      x = tx;
      y = ty;
      break;
    }
  }

  if (x === undefined) {
    const a = Math.random() * Math.PI * 2;
    x = cx + Math.cos(a) * (forbidden + 80) - size / 2;
    y = cy + Math.sin(a) * (forbidden + 80) - size / 2;
  }

  return { x, y };
}

function memberDisplayName(member) {
  const n = member?.name?.trim();
  if (n) return n;
  if (member?.username) return member.username;
  return "Member";
}

export default function CirclePage() {
  const pdfInputRef = useRef(null);
  const bubbleTimeoutsRef = useRef([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [titleText, setTitleText] = useState("SACRED CIRCLE");
  const [particles] = useState(() =>
    Array.from({ length: 60 }, () => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      speed: `${14 + Math.random() * 18}s`,
      size: `${2 + Math.random() * 2.5}px`,
    }))
  );
  const [bubbleLayout, setBubbleLayout] = useState([]);
  const [profileMember, setProfileMember] = useState(null);
  const [profileProjectsHtml, setProfileProjectsHtml] = useState(null);
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");

  const loadMemberProjects = useCallback(async (userId) => {
    const heading = "<h4>Projects</h4>";

    const { data: created, error: createdError } = await supabase
      .from("projects")
      .select("id, title, realm")
      .eq("created_by", userId)
      .eq("archived", false);

    if (createdError) {
      console.error("Created projects error:", createdError);
    }

    const { data: contributed, error: contribError } = await supabase
      .from("project_contributors")
      .select(
        `
      project_id,
      realm,
      projects (
        id,
        title
      )
    `
      )
      .eq("member_id", userId);

    if (contribError) {
      console.error("Contributed projects error:", contribError);
    }

    const map = new Map();

    (created || []).forEach((p) => {
      map.set(p.id, {
        title: p.title,
        realm: p.realm,
        role: "Creator",
      });
    });

    (contributed || []).forEach((row) => {
      if (!row.projects) return;
      if (!map.has(row.projects.id)) {
        map.set(row.projects.id, {
          title: row.projects.title,
          realm: row.realm,
          role: "Contributor",
        });
      }
    });

    if (map.size === 0) {
      setProfileProjectsHtml(`${heading}<p>No active projects</p>`);
      return;
    }

    const items = [];
    map.forEach((p) => {
      items.push(
        `<div class="profile-project-item">${p.title} — ${p.role}</div>`
      );
    });
    setProfileProjectsHtml(heading + items.join(""));
  }, []);

  const openMemberProfile = useCallback(
    async (member) => {
      setProfileProjectsHtml("<p>Loading…</p>");
      setProfileMember(member);
      setBio(member.bio || "");
      setWebsite(member.website || "");
      await loadMemberProjects(member.user_id);
    },
    [loadMemberProjects]
  );

  useEffect(() => {
    let cancelled = false;
    bubbleTimeoutsRef.current.forEach(clearTimeout);
    bubbleTimeoutsRef.current = [];

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data?.session || cancelled) return;
      const uid = data.session.user.id;
      setCurrentUserId(uid);

      const { data: row, error: selfErr } = await supabase
        .from("members")
        .select("username, archetype")
        .eq("user_id", uid)
        .maybeSingle();

      if (selfErr) {
        console.error("Could not load your member row:", selfErr);
      } else if (row?.username && !cancelled) {
        setTitleText(`Welcome, ${row.username}`);
      }

      const { data: list, error: loadErr } = await supabase
        .from("members")
        .select(
          "id, user_id, username, name, bio, profile_image_url, website, profile_pdf_url, archetype"
        )
        .not("username", "is", null)
        .order("created_at", { ascending: true });

      if (loadErr) {
        console.error("Failed to load members:", loadErr);
        return;
      }

      if (cancelled) return;

      const size = 110;
      setBubbleLayout([]);
      (list || []).forEach((m, i) => {
        const id = setTimeout(() => {
          if (!cancelled) {
            setBubbleLayout((prev) => [
              ...prev,
              { member: m, ...randomBubblePosition(size) },
            ]);
          }
        }, i * 900);
        bubbleTimeoutsRef.current.push(id);
      });
    })();

    return () => {
      cancelled = true;
      bubbleTimeoutsRef.current.forEach(clearTimeout);
      bubbleTimeoutsRef.current = [];
    };
  }, []);

  const isSelf = profileMember && profileMember.user_id === currentUserId;

  async function saveProfile() {
    let normalized = website.trim();
    if (normalized) {
      if (
        !normalized.startsWith("http://") &&
        !normalized.startsWith("https://")
      ) {
        normalized = "https://" + normalized;
      }
    }

    const { error } = await supabase
      .from("members")
      .update({
        bio: bio.trim(),
        website: normalized,
      })
      .eq("user_id", currentUserId);

    if (error) {
      console.error("Profile update failed:", error);
      alert("Failed to save profile.");
      return;
    }

    setProfileMember(null);
  }

  async function onAvatarChange(ev) {
    const file = ev.target.files?.[0];
    ev.target.value = "";
    if (!file || !currentUserId) return;

    const ext = file.name.split(".").pop();
    const path = `${currentUserId}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("profile-image")
      .upload(path, file, {
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) {
      console.error("Upload failed:", uploadError);
      alert("Image upload failed");
      return;
    }

    const { data } = supabase.storage.from("profile-image").getPublicUrl(path);
    const imageUrl = data.publicUrl;

    const { error: updateError } = await supabase
      .from("members")
      .update({ profile_image_url: imageUrl })
      .eq("user_id", currentUserId);

    if (updateError) {
      console.error("DB update failed:", updateError);
      alert("Profile update failed");
      return;
    }

    setProfileMember((m) => (m ? { ...m, profile_image_url: imageUrl } : m));
  }

  async function onPdfChange(ev) {
    const file = ev.target.files?.[0];
    ev.target.value = "";
    if (!file) return;

    if (file.type !== "application/pdf") {
      alert("Only PDF files allowed.");
      return;
    }

    const path = `${currentUserId}/profile.pdf`;

    const { error: uploadError } = await supabase.storage
      .from("profile-pdf")
      .upload(path, file, {
        upsert: true,
        contentType: "application/pdf",
      });

    if (uploadError) {
      console.error(uploadError);
      alert("PDF upload failed.");
      return;
    }

    const pdfUrl = supabase.storage.from("profile-pdf").getPublicUrl(path).data
      .publicUrl;

    const { error } = await supabase
      .from("members")
      .update({ profile_pdf_url: pdfUrl })
      .eq("user_id", currentUserId);

    if (error) {
      alert("Failed to save PDF link.");
      return;
    }

    alert("PDF uploaded successfully.");
    setProfileMember((m) => (m ? { ...m, profile_pdf_url: pdfUrl } : m));
  }

  return (
    <div className="portal-bg">
      <div className="rite-field" id="riteField">
        {bubbleLayout.map(({ member, x, y }, index) => (
          <div
            key={
              member.id != null
                ? String(member.id)
                : member.user_id != null
                  ? `u-${member.user_id}`
                  : `i-${index}`
            }
            className="rite-bubble"
            style={{ left: `${x}px`, top: `${y}px` }}
            onClick={() => openMemberProfile(member)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openMemberProfile(member);
              }
            }}
            role="button"
            tabIndex={0}
          >
            <div className="bubble-inner">
              <span className="bubble-name">{memberDisplayName(member)}</span>
              <span className="bubble-archetype">{member.username}</span>
            </div>
            {member.profile_pdf_url ? (
              <a
                className="bubble-pdf-link"
                href={member.profile_pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                PDF
              </a>
            ) : null}
          </div>
        ))}
      </div>
      <div className="background-sigil" />
      <div className="particles" id="particles">
        {particles.map((p, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              "--speed": p.speed,
              "--size": p.size,
            }}
          />
        ))}
      </div>

      <div className="center-whisper">
        <span>Meet the community</span>
      </div>

      <main className="circle-container">
        <div className="circle-title">{titleText}</div>
      </main>

      {profileMember ? (
        <div
          className="member-profile"
          id="memberProfile"
          style={{ display: "flex" }}
        >
          <div className="member-profile-inner">
            <button
              type="button"
              className="profile-close-btn"
              onClick={() => setProfileMember(null)}
              aria-label="Close"
            >
              ×
            </button>

            <header className="profile-header">
              <h2 className="profile-username">
                {memberDisplayName(profileMember)}
              </h2>
              <div className="profile-handle">
                {profileMember.username
                  ? `(${profileMember.username})`
                  : ""}
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
                <input
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

              <textarea
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
              <div
                className="profile-projects"
                dangerouslySetInnerHTML={{
                  __html: profileProjectsHtml ?? "",
                }}
              />
            </section>

            {isSelf ? (
              <footer className="profile-actions">
                <button
                  type="button"
                  className="project-action-btn"
                  onClick={saveProfile}
                >
                  Save Profile
                </button>
              </footer>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="circle-toggle">
        <Link to="/field/samsara">PROJECT FIELD</Link>
      </div>
    </div>
  );
}
