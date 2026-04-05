import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase.js";
import "../styles/circle.css";
import "../styles/projects.css";
import "../styles/vrischgewagt.css";

function nodePosition() {
  const size = 140;
  return {
    x: Math.random() * (window.innerWidth - size),
    y: Math.random() * (window.innerHeight - size),
  };
}

export default function ProjectFieldPage() {
  const { realm: realmParam } = useParams();
  const navigate = useNavigate();
  const detailInnerRef = useRef(null);

  const realm =
    realmParam === "vrischgewagt" ? "vrischgewagt" : "samsara";
  const isVrisch = realm === "vrischgewagt";

  const [currentUserId, setCurrentUserId] = useState(null);
  const [ready, setReady] = useState(false);
  const [projects, setProjects] = useState([]);
  const [visibleCount, setVisibleCount] = useState(0);
  const [positions, setPositions] = useState([]);

  const [detailProject, setDetailProject] = useState(null);
  const [detailCreator, setDetailCreator] = useState("");
  const [detailContributors, setDetailContributors] = useState("");
  const [detailRoles, setDetailRoles] = useState("");
  const [primaryConfig, setPrimaryConfig] = useState({
    text: "",
    className: "project-action-btn",
    disabled: false,
    hidden: false,
    onClick: null,
  });
  const [inspirationLink, setInspirationLink] = useState(null);
  const [inspirationBtnStyle, setInspirationBtnStyle] = useState({});
  const [applicationBanner, setApplicationBanner] = useState(null);
  const [showEndProject, setShowEndProject] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createTimeline, setCreateTimeline] = useState("");
  const [createStatus, setCreateStatus] = useState("open");
  const [createCny, setCreateCny] = useState(false);
  const [createInspiration, setCreateInspiration] = useState("");
  const imageFileRef = useRef(null);

  useEffect(() => {
    document.body.dataset.realm = realm;
    return () => {
      delete document.body.dataset.realm;
    };
  }, [realm]);

  const loadProjectList = useCallback(async () => {
    const { data, error } = await supabase
      .from("projects")
      .select(
        `
        id,
        title,
        description,
        image_url,
        status,
        roles_needed,
        created_by,
        chinese_new_year,
        inspiration_link
      `
      )
      .eq("realm", realm)
      .eq("archived", false)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Project load error:", error);
      return null;
    }

    const list = data || [];
    return Promise.all(
      list.map(async (p) => {
        let appCount = 0;
        if (p.created_by === currentUserId) {
          const { count } = await supabase
            .from("project_applications")
            .select("*", { count: "exact", head: true })
            .eq("project_id", p.id)
            .eq("realm", realm)
            .eq("status", "pending");
          appCount = count || 0;
        }
        return { ...p, appCount };
      })
    );
  }, [realm, currentUserId]);

  const refetchProjects = useCallback(async () => {
    const enriched = await loadProjectList();
    if (!enriched) return;
    setProjects(enriched);
    setPositions(enriched.map(() => nodePosition()));
    setVisibleCount(enriched.length);
  }, [loadProjectList]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/", { replace: true });
        return;
      }
      setCurrentUserId(session.user.id);
      setReady(true);
    });
  }, [navigate]);

  useEffect(() => {
    if (!ready || !currentUserId) return undefined;
    let cancelled = false;
    const timeouts = [];

    (async () => {
      const enriched = await loadProjectList();
      if (!enriched || cancelled) return;
      setProjects(enriched);
      setPositions(enriched.map(() => nodePosition()));
      setVisibleCount(0);
      enriched.forEach((_, i) => {
        timeouts.push(
          setTimeout(() => {
            if (!cancelled) {
              setVisibleCount((c) => Math.max(c, i + 1));
            }
          }, i * 700)
        );
      });
    })();

    return () => {
      cancelled = true;
      timeouts.forEach(clearTimeout);
    };
  }, [ready, currentUserId, loadProjectList]);

  const renderContributors = useCallback(
    async (projectId) => {
      const { data: contributors, error } = await supabase
        .from("project_contributors")
        .select("member_id")
        .eq("project_id", projectId)
        .eq("realm", realm);

      if (error || !contributors?.length) {
        setDetailContributors("Contributors: None");
        return;
      }

      const userIds = contributors.map((c) => c.member_id);
      const { data: members } = await supabase
        .from("members")
        .select("user_id, username")
        .in("user_id", userIds);

      setDetailContributors(
        members?.length
          ? `Contributors: ${members.map((m) => m.username).join(", ")}`
          : "Contributors: None"
      );
    },
    [realm]
  );

  const resetDetailUi = useCallback(() => {
    setInspirationLink(null);
    setApplicationBanner(null);
    setShowEndProject(false);
    setPrimaryConfig({
      text: "",
      className: "project-action-btn",
      disabled: false,
      hidden: false,
      onClick: null,
    });
  }, []);

  const joinProject = useCallback(
    async (project) => {
    const { data: existing } = await supabase
      .from("project_contributors")
      .select("id")
      .eq("project_id", project.id)
      .eq("member_id", currentUserId)
      .eq("realm", realm)
      .maybeSingle();

    if (existing) {
      alert("You are already part of this project.");
      return;
    }

    await supabase.from("project_contributors").insert({
      project_id: project.id,
      member_id: currentUserId,
      realm,
    });

      await renderContributors(project.id);
    },
    [realm, currentUserId, renderContributors]
  );

  const applyToProject = useCallback(
    async (projectId) => {
    const message = prompt("Why do you feel called to contribute?");
    if (!message) return;

    await supabase.from("project_applications").insert({
      project_id: projectId,
      applicant_id: currentUserId,
      message,
      status: "pending",
      realm,
    });
    },
    [realm, currentUserId]
  );

  function configurePrimaryAction(project) {
    if (project.created_by === currentUserId) {
      setPrimaryConfig((c) => ({ ...c, hidden: true }));
      return;
    }

    if (project.status === "closed") {
      setPrimaryConfig({
        text: "Project Closed",
        className: "project-action-btn project-action-closed",
        disabled: true,
        hidden: false,
        onClick: null,
      });
      return;
    }

    if (project.status === "open") {
      setPrimaryConfig({
        text: "Join Project",
        className: "project-action-btn project-action-open",
        disabled: false,
        hidden: false,
        onClick: () => joinProject(project),
      });
      return;
    }

    if (project.status === "application") {
      setPrimaryConfig({
        text: "Apply to Join",
        className: "project-action-btn project-action-application",
        disabled: false,
        hidden: false,
        onClick: () => applyToProject(project.id),
      });
    }
  }

  async function loadApplications(projectId) {
    const { data: apps, error } = await supabase
      .from("project_applications")
      .select("id, message, applicant_id")
      .eq("project_id", projectId)
      .eq("realm", realm)
      .eq("status", "pending");

    if (error || !apps?.length) {
      setApplicationBanner(null);
      return;
    }

    const userIds = apps.map((a) => a.applicant_id);
    const { data: members } = await supabase
      .from("members")
      .select("user_id, username")
      .in("user_id", userIds);

    const nameMap = Object.fromEntries(
      (members || []).map((m) => [m.user_id, m.username])
    );

    setApplicationBanner({ apps, nameMap, projectId });
  }

  async function handleApplications(apps, nameMap, projectId) {
    for (const app of apps) {
      const approve = confirm(
        `${nameMap[app.applicant_id] || "Unknown"}\n\n${app.message}\n\nApprove?`
      );

      if (approve) {
        await supabase.from("project_contributors").insert({
          project_id: projectId,
          member_id: app.applicant_id,
          realm,
        });

        await supabase
          .from("project_applications")
          .update({ status: "approved" })
          .eq("id", app.id)
          .eq("realm", realm);
      } else {
        await supabase
          .from("project_applications")
          .update({ status: "rejected" })
          .eq("id", app.id)
          .eq("realm", realm);
      }
    }

    await renderContributors(projectId);
    alert("Applications processed.");
    setApplicationBanner(null);
  }

  async function openProjectDetail(project) {
    resetDetailUi();
    setDetailProject(project);
    setDetailRoles(
      project.roles_needed ? `Needed: ${project.roles_needed}` : ""
    );

    const { data: creator } = await supabase
      .from("members")
      .select("username")
      .eq("user_id", project.created_by)
      .single();

    setDetailCreator(`Created by ${creator?.username || "Unknown"}`);
    await renderContributors(project.id);

    if (project.created_by === currentUserId) {
      setShowEndProject(true);
      await loadApplications(project.id);
    }

    configurePrimaryAction(project);

    if (project.inspiration_link) {
      setInspirationLink(project.inspiration_link);
    }
  }

  useEffect(() => {
    if (!inspirationLink || !detailInnerRef.current) return;
    const el = detailInnerRef.current;
    const raf = requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect();
      const size = 44;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      setInspirationBtnStyle({
        position: "absolute",
        left: `${centerX + 0.35 * centerX - size / 2}px`,
        top: `${centerY - 0.35 * centerY - size / 2}px`,
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [inspirationLink, detailProject]);

  async function onStatusChange(newStatus, project) {
    await supabase
      .from("projects")
      .update({ status: newStatus })
      .eq("id", project.id)
      .eq("created_by", currentUserId)
      .eq("realm", realm);

    setDetailProject((p) => (p ? { ...p, status: newStatus } : p));
    await refetchProjects();
    configurePrimaryAction({ ...project, status: newStatus });
  }

  async function endProject(project) {
    if (!confirm("This will end the project permanently.")) return;

    await supabase
      .from("projects")
      .update({ archived: true, status: "closed" })
      .eq("id", project.id)
      .eq("created_by", currentUserId)
      .eq("realm", realm);

    closeProjectDetail();
    await refetchProjects();
  }

  function closeProjectDetail() {
    setDetailProject(null);
    setInspirationLink(null);
    resetDetailUi();
  }

  async function submitProject() {
    const title = createTitle.trim();
    const description = createDescription.trim();
    const timeline = createTimeline.trim();
    const imageInput = imageFileRef.current;
    const inspirationLinkVal = isVrisch
      ? null
      : createInspiration.trim() || null;

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (!session || sessionError) {
      alert("Session expired. Please refresh and log in again.");
      return;
    }

    if (!title || !description) {
      alert("Project requires a name and description.");
      return;
    }

    let image_url = null;

    if (imageInput?.files?.length > 0) {
      const file = imageInput.files[0];
      const ext = file.name.split(".").pop().toLowerCase();
      const path = `projects/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("project-images")
        .upload(path, file, {
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        console.error("Image upload failed:", uploadError);
        alert("Image upload failed.");
        return;
      }

      image_url = supabase.storage.from("project-images").getPublicUrl(path)
        .data.publicUrl;
    }

    const { data, error } = await supabase
      .from("projects")
      .insert([
        {
          title,
          description,
          timeline,
          status: createStatus,
          created_by: currentUserId,
          realm,
          archived: false,
          chinese_new_year: isVrisch ? false : createCny,
          image_url,
          inspiration_link: inspirationLinkVal,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Project insert failed:", error);
      alert("Failed to create project.");
      return;
    }

    setCreateOpen(false);
    setCreateTitle("");
    setCreateDescription("");
    setCreateTimeline("");
    setCreateStatus("open");
    setCreateCny(false);
    setCreateInspiration("");
    if (imageInput) imageInput.value = "";

    await refetchProjects();
  }

  const realmToggleChecked = isVrisch;

  const particles = useMemo(
    () =>
      Array.from({ length: 60 }, () => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        speed: `${14 + Math.random() * 18}s`,
        size: `${2 + Math.random() * 2.5}px`,
      })),
    [realm]
  );

  const isDetailCreator =
    detailProject && detailProject.created_by === currentUserId;

  return (
    <div className="portal-bg">
      <div className="realm-switch">
        <span className={isVrisch ? undefined : "realm-label"}>SAMSARA</span>
        <label className="switch">
          <input
            type="checkbox"
            checked={realmToggleChecked}
            onChange={(e) => {
              navigate(
                e.target.checked ? "/field/vrischgewagt" : "/field/samsara",
                { replace: true }
              );
            }}
          />
          <span className="slider" />
        </label>
        <span className={isVrisch ? "active" : "realm-label"}>
          VRISCHGEWAGT
        </span>
      </div>

      <div className="project-add">
        <button
          type="button"
          className="project-action-open"
          aria-label="Seed Project"
          onClick={() => setCreateOpen(true)}
        >
          ＋
        </button>
      </div>

      <div className="project-field" id="projectField">
        {projects.slice(0, visibleCount).map((project, i) => (
          <div
            key={project.id}
            className={`project-node${project.appCount > 0 ? " has-applications" : ""}`}
            style={{
              left: `${positions[i]?.x ?? 0}px`,
              top: `${positions[i]?.y ?? 0}px`,
            }}
            onClick={() => openProjectDetail(project)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openProjectDetail(project);
              }
            }}
            role="button"
            tabIndex={0}
          >
            <span>{project.title}</span>
            <div className={`project-status status-${project.status}`} />
            {project.chinese_new_year ? (
              <div
                className="project-cny-indicator"
                title="Chinese New Year Project"
              >
                🧧
              </div>
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

      <div className="field-header field-header-project">
        <Link to="/circle" className="ghost">
          {isVrisch ? "← RETURN TO CIRCLE" : "← RETURN"}
        </Link>
      </div>

      {detailProject ? (
        <div
          className="project-detail"
          id="projectDetail"
          style={{ display: "flex" }}
        >
          <div className="project-detail-inner" ref={detailInnerRef}>
            <button
              type="button"
              className="project-close-btn"
              onClick={closeProjectDetail}
              aria-label="Close project"
            >
              ×
            </button>
            <div />

            <div className="project-header">
              {detailProject.image_url ? (
                <img
                  id="detailProjectImage"
                  className="project-detail-image"
                  alt=""
                  src={detailProject.image_url}
                />
              ) : null}
              <h2 className="project-title">{detailProject.title}</h2>
            </div>

            <div className="project-core">
              <p className="project-description">
                {detailProject.description}
              </p>
            </div>

            {inspirationLink ? (
              <button
                type="button"
                className="project-link-btn"
                title="View visual inspiration"
                style={inspirationBtnStyle}
                onClick={() =>
                  window.open(inspirationLink, "_blank", "noopener,noreferrer")
                }
              >
                <span>🖼️</span>
              </button>
            ) : null}

            {isDetailCreator ? (
              <div className="project-status-toggle" id="projectStatusControl">
                <select
                  value={detailProject.status}
                  onChange={(e) =>
                    onStatusChange(e.target.value, detailProject)
                  }
                >
                  <option value="open">🟢 Open</option>
                  <option value="application">🟠 Application</option>
                  <option value="closed">🔴 Closed</option>
                </select>
              </div>
            ) : (
              <div id="projectStatusControl" />
            )}

            <div className="project-meta">
              <div className="project-meta-line">{detailCreator}</div>
              <div className="project-meta-line">{detailContributors}</div>
              <div className="project-meta-line">{detailRoles}</div>
            </div>

            {applicationBanner ? (
              <div
                className="application-bubble"
                onClick={() =>
                  handleApplications(
                    applicationBanner.apps,
                    applicationBanner.nameMap,
                    applicationBanner.projectId
                  )
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleApplications(
                      applicationBanner.apps,
                      applicationBanner.nameMap,
                      applicationBanner.projectId
                    );
                  }
                }}
                role="button"
                tabIndex={0}
              >
                🟠 {applicationBanner.apps.length} application(s) pending
              </div>
            ) : null}

            {showEndProject && detailProject.created_by === currentUserId ? (
              <button
                type="button"
                className="project-end-btn project-action-btn subtle"
                onClick={() => endProject(detailProject)}
              >
                End Project
              </button>
            ) : null}

            <div className="project-action-ring">
              {!primaryConfig.hidden ? (
                <button
                  type="button"
                  id="detailProjectAction"
                  className={primaryConfig.className}
                  disabled={primaryConfig.disabled}
                  onClick={() => primaryConfig.onClick?.()}
                >
                  {primaryConfig.text}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {createOpen ? (
        <div className="project-create" style={{ display: "flex" }}>
          <div className="project-create-inner">
            <h3>{isVrisch ? "Seed a Project" : "Seed an Offering"}</h3>

            <input
              className="project-input"
              placeholder={
                isVrisch ? "Project name" : "Name of Offering"
              }
              autoComplete="off"
              value={createTitle}
              onChange={(e) => setCreateTitle(e.target.value)}
            />

            <textarea
              className="project-textarea"
              placeholder={
                isVrisch ? "Project description" : "Description"
              }
              value={createDescription}
              onChange={(e) => setCreateDescription(e.target.value)}
            />

            <textarea
              className="project-textarea"
              placeholder={
                isVrisch ? "Timeline / rhythm" : "Timespan / rhythm"
              }
              value={createTimeline}
              onChange={(e) => setCreateTimeline(e.target.value)}
            />

            <input
              ref={imageFileRef}
              type="file"
              className="project-file"
              accept="image/*"
            />

            <div className="project-status-select">
              <label>
                <input
                  type="radio"
                  name="projectStatus"
                  checked={createStatus === "open"}
                  onChange={() => setCreateStatus("open")}
                />
                🟢 Open contribution
              </label>
              <label>
                <input
                  type="radio"
                  name="projectStatus"
                  checked={createStatus === "application"}
                  onChange={() => setCreateStatus("application")}
                />
                🟠 By application
              </label>
              <label>
                <input
                  type="radio"
                  name="projectStatus"
                  checked={createStatus === "closed"}
                  onChange={() => setCreateStatus("closed")}
                />
                🔴 Closed
              </label>
            </div>

            {!isVrisch ? (
              <>
                <label className="project-flag">
                  <input
                    type="checkbox"
                    checked={createCny}
                    onChange={(e) => setCreateCny(e.target.checked)}
                  />
                  🧧 Chinese New Year
                </label>
                <div className="form-group inspiration">
                  <label htmlFor="inspiration_link">Vision Board</label>
                  <input
                    type="url"
                    id="inspiration_link"
                    name="inspiration_link"
                    placeholder="Pinterest, Figma, Drive…"
                    value={createInspiration}
                    onChange={(e) => setCreateInspiration(e.target.value)}
                  />
                </div>
              </>
            ) : null}

            <div />
            <button
              type="button"
              className="project-action-open"
              onClick={submitProject}
            >
              {isVrisch ? "SEED PROJECT" : "SEED OFFERING"}
            </button>
            <button
              type="button"
              className="ghost"
              onClick={() => setCreateOpen(false)}
            >
              CANCEL
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
