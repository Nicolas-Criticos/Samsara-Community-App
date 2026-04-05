import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../../lib/supabase.js";
import {
  createParticleField,
  randomProjectNodePosition,
} from "../../../lib/portalLayout.js";
import { fetchMemberUsernameByUserId } from "../../../lib/membersApi.js";
import {
  addProjectContributor,
  archiveProject,
  fetchApplicantNameMap,
  fetchEnrichedProjects,
  fetchPendingApplications,
  findExistingContributor,
  formatContributorsLine,
  insertProjectApplication,
  insertProjectRow,
  setApplicationStatus,
  updateProjectStatus,
} from "../../../lib/projectsApi.js";
import { uploadProjectImageFile } from "../../../lib/storage.js";
import {
  buildPrimaryActionConfig,
  emptyPrimaryConfig,
} from "../lib/primaryActions.js";

export function useProjects() {
  const { realm: realmParam } = useParams();
  const navigate = useNavigate();
  const loadTimeoutsRef = useRef([]);

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
  const [primaryConfig, setPrimaryConfig] = useState(() =>
    emptyPrimaryConfig()
  );
  const createImageFileRef = useRef(null);
  const [inspirationLink, setInspirationLink] = useState(null);
  const [applicationBanner, setApplicationBanner] = useState(null);
  const [showEndProject, setShowEndProject] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createTimeline, setCreateTimeline] = useState("");
  const [createStatus, setCreateStatus] = useState("open");
  const [createCny, setCreateCny] = useState(false);
  const [createInspiration, setCreateInspiration] = useState("");

  useEffect(() => {
    document.body.dataset.realm = realm;
    return () => {
      delete document.body.dataset.realm;
    };
  }, [realm]);

  const loadProjectList = useCallback(async () => {
    if (!currentUserId) return null;
    return fetchEnrichedProjects(realm, currentUserId);
  }, [realm, currentUserId]);

  const refetchProjects = useCallback(async () => {
    const enriched = await loadProjectList();
    if (!enriched) return;
    setProjects(enriched);
    setPositions(enriched.map(() => randomProjectNodePosition()));
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
    loadTimeoutsRef.current.forEach(clearTimeout);
    loadTimeoutsRef.current = [];

    (async () => {
      const enriched = await loadProjectList();
      if (!enriched || cancelled) return;
      setProjects(enriched);
      setPositions(enriched.map(() => randomProjectNodePosition()));
      setVisibleCount(0);
      enriched.forEach((_, i) => {
        const id = setTimeout(() => {
          if (!cancelled) {
            setVisibleCount((c) => Math.max(c, i + 1));
          }
        }, i * 700);
        loadTimeoutsRef.current.push(id);
      });
    })();

    return () => {
      cancelled = true;
      loadTimeoutsRef.current.forEach(clearTimeout);
      loadTimeoutsRef.current = [];
    };
  }, [ready, currentUserId, loadProjectList]);

  const refreshContributorsLine = useCallback(
    async (projectId) => {
      const line = await formatContributorsLine(projectId, realm);
      setDetailContributors(line);
    },
    [realm]
  );

  const resetDetailUi = useCallback(() => {
    setInspirationLink(null);
    setApplicationBanner(null);
    setShowEndProject(false);
    setPrimaryConfig(emptyPrimaryConfig());
  }, []);

  const joinProject = useCallback(
    async (project) => {
      const { data: existing } = await findExistingContributor(
        project.id,
        currentUserId,
        realm
      );

      if (existing) {
        alert("You are already part of this project.");
        return;
      }

      await addProjectContributor({
        projectId: project.id,
        memberId: currentUserId,
        realm,
      });

      await refreshContributorsLine(project.id);
    },
    [realm, currentUserId, refreshContributorsLine]
  );

  const applyToProject = useCallback(
    async (projectId) => {
      const message = prompt("Why do you feel called to contribute?");
      if (!message) return;

      await insertProjectApplication({
        projectId,
        applicantId: currentUserId,
        message,
        realm,
      });
    },
    [realm, currentUserId]
  );

  const applyPrimaryForProjectStable = useCallback(
    (project) => {
      setPrimaryConfig(
        buildPrimaryActionConfig(project, currentUserId, {
          joinProject,
          applyToProject,
        })
      );
    },
    [currentUserId, joinProject, applyToProject]
  );

  const loadApplications = useCallback(
    async (projectId) => {
      const { data: apps, error } = await fetchPendingApplications(
        projectId,
        realm
      );

      if (error || !apps?.length) {
        setApplicationBanner(null);
        return;
      }

      const userIds = apps.map((a) => a.applicant_id);
      const nameMap = await fetchApplicantNameMap(userIds);
      setApplicationBanner({ apps, nameMap, projectId });
    },
    [realm]
  );

  const handleApplications = useCallback(
    async (apps, nameMap, projectId) => {
      for (const app of apps) {
        const approve = confirm(
          `${nameMap[app.applicant_id] || "Unknown"}\n\n${app.message}\n\nApprove?`
        );

        if (approve) {
          await addProjectContributor({
            projectId,
            memberId: app.applicant_id,
            realm,
          });

          await setApplicationStatus(app.id, realm, "approved");
        } else {
          await setApplicationStatus(app.id, realm, "rejected");
        }
      }

      await refreshContributorsLine(projectId);
      alert("Applications processed.");
      setApplicationBanner(null);
    },
    [realm, refreshContributorsLine]
  );

  const openProjectDetail = useCallback(
    async (project) => {
      resetDetailUi();
      setDetailProject(project);
      setDetailRoles(
        project.roles_needed ? `Needed: ${project.roles_needed}` : ""
      );

      const { data: creator } = await fetchMemberUsernameByUserId(
        project.created_by
      );

      setDetailCreator(`Created by ${creator?.username || "Unknown"}`);
      await refreshContributorsLine(project.id);

      if (project.created_by === currentUserId) {
        setShowEndProject(true);
        await loadApplications(project.id);
      }

      applyPrimaryForProjectStable(project);

      if (project.inspiration_link) {
        setInspirationLink(project.inspiration_link);
      }
    },
    [
      currentUserId,
      resetDetailUi,
      refreshContributorsLine,
      loadApplications,
      applyPrimaryForProjectStable,
    ]
  );

  const onStatusChange = useCallback(
    async (newStatus, project) => {
      await updateProjectStatus(
        project.id,
        realm,
        currentUserId,
        newStatus
      );

      setDetailProject((p) => (p ? { ...p, status: newStatus } : p));
      await refetchProjects();
      applyPrimaryForProjectStable({ ...project, status: newStatus });
    },
    [realm, currentUserId, refetchProjects, applyPrimaryForProjectStable]
  );

  const closeProjectDetail = useCallback(() => {
    setDetailProject(null);
    setInspirationLink(null);
    resetDetailUi();
  }, [resetDetailUi]);

  const endProject = useCallback(
    async (project) => {
      if (!confirm("This will end the project permanently.")) return;

      await archiveProject(project.id, realm, currentUserId);
      closeProjectDetail();
      await refetchProjects();
    },
    [realm, currentUserId, refetchProjects, closeProjectDetail]
  );

  const submitProject = useCallback(async () => {
    const title = createTitle.trim();
    const description = createDescription.trim();
    const timeline = createTimeline.trim();
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
    const imageInput = createImageFileRef.current;

    if (imageInput?.files?.length > 0) {
      const file = imageInput.files[0];
      const { error: uploadError, url } = await uploadProjectImageFile(file);
      if (uploadError) {
        console.error("Image upload failed:", uploadError);
        alert("Image upload failed.");
        return;
      }
      image_url = url;
    }

    const { error } = await insertProjectRow({
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
    });

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
  }, [
    createTitle,
    createDescription,
    createTimeline,
    createStatus,
    createCny,
    createInspiration,
    isVrisch,
    currentUserId,
    realm,
    refetchProjects,
  ]);

  const particles = useMemo(() => createParticleField(60), [realm]);

  const isDetailCreator =
    detailProject && detailProject.created_by === currentUserId;

  return {
    realm,
    isVrisch,
    navigate,
    projects,
    visibleCount,
    positions,
    particles,
    detailProject,
    detailCreator,
    detailContributors,
    detailRoles,
    primaryConfig,
    inspirationLink,
    applicationBanner,
    showEndProject,
    isDetailCreator,
    currentUserId,
    createOpen,
    setCreateOpen,
    createTitle,
    setCreateTitle,
    createDescription,
    setCreateDescription,
    createTimeline,
    setCreateTimeline,
    createStatus,
    setCreateStatus,
    createCny,
    setCreateCny,
    createInspiration,
    setCreateInspiration,
    openProjectDetail,
    closeProjectDetail,
    onStatusChange,
    endProject,
    handleApplications,
    submitProject,
    createImageFileRef,
  };
}
