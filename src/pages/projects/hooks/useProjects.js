import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuthSession } from "../../../hooks/useAuthSession.js";
import {
  createParticleField,
  randomProjectNodePosition,
} from "../../../lib/portalLayout.js";
import { queryKeys } from "../../../lib/queryKeys.js";
import { supabase } from "../../../lib/supabase.js";
import { fetchMemberUsernameByUserId } from "../../../lib/membersApi.js";
import {
  addProjectContributor,
  archiveProject,
  completeProject,
  fetchEnrichedProjects,
  findExistingContributor,
  formatContributorsLine,
  hardDeleteProject,
  insertProjectRow,
  removeProjectContributor,
} from "../../../lib/projectsApi.js";
import { uploadProjectImageFile } from "../../../lib/storage.js";
import {
  emptyPrimaryConfig,
} from "../lib/primaryActions.js";

async function fetchModalExtrasFull(realm, projectId, userId, createdBy) {
  const [{ data: creator }, line, { data: contribRow }] = await Promise.all([
    fetchMemberUsernameByUserId(createdBy),
    formatContributorsLine(projectId, realm),
    findExistingContributor(projectId, userId, realm),
  ]);

  return {
    detailCreator: `Created by ${creator?.username || "Unknown"}`,
    detailContributors: line,
    isDetailContributor: Boolean(contribRow),
  };
}

export function useProjects() {
  const { realm: realmParam } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const loadTimeoutsRef = useRef([]);

  const realm =
    realmParam === "vrischgewagt" ? "vrischgewagt" : "samsara";
  const isVrisch = realm === "vrischgewagt";

  const { data: session, isPending: sessionPending } = useAuthSession();
  const currentUserId = session?.user?.id ?? null;

  const [detailProject, setDetailProject] = useState(null);
  const [detailRoles, setDetailRoles] = useState("");
  const [primaryConfig, setPrimaryConfig] = useState(() =>
    emptyPrimaryConfig(isVrisch)
  );
  const [inspirationLink, setInspirationLink] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(0);
  const [positions, setPositions] = useState([]);

  useEffect(() => {
    document.body.dataset.realm = realm;
    return () => {
      delete document.body.dataset.realm;
    };
  }, [realm]);

  useEffect(() => {
    if (!sessionPending && !session) {
      navigate("/", { replace: true });
    }
  }, [sessionPending, session, navigate]);

  const projectsQuery = useQuery({
    queryKey: queryKeys.projectsList(realm, currentUserId ?? ""),
    queryFn: () => fetchEnrichedProjects(realm, currentUserId),
    enabled: Boolean(currentUserId),
  });

  const projects = projectsQuery.data ?? [];

  // Active projects only — shown as bubbles in the field view
  const fieldProjects = useMemo(
    () => projects.filter((p) => !p.completed_at && !p.archived),
    [projects]
  );

  // Animate positions based on active (field) projects only
  useEffect(() => {
    if (!currentUserId || !projectsQuery.isSuccess) return undefined;
    const enriched = projectsQuery.data;
    if (!enriched) return undefined;

    const active = enriched.filter((p) => !p.completed_at && !p.archived);

    let cancelled = false;
    loadTimeoutsRef.current.forEach(clearTimeout);
    loadTimeoutsRef.current = [];

    setPositions(active.map(() => randomProjectNodePosition()));
    setVisibleCount(0);
    active.forEach((_, i) => {
      const id = setTimeout(() => {
        if (!cancelled) {
          setVisibleCount((c) => Math.max(c, i + 1));
        }
      }, i * 700);
      loadTimeoutsRef.current.push(id);
    });

    return () => {
      cancelled = true;
      loadTimeoutsRef.current.forEach(clearTimeout);
      loadTimeoutsRef.current = [];
    };
  }, [currentUserId, projectsQuery.isSuccess, projectsQuery.data]);

  const modalExtrasQuery = useQuery({
    queryKey: [
      ...queryKeys.projectsFieldModalExtras(
        realm,
        detailProject?.id ?? "",
        currentUserId ?? ""
      ),
      detailProject?.created_by ?? "",
    ],
    queryFn: () =>
      fetchModalExtrasFull(
        realm,
        detailProject.id,
        currentUserId,
        detailProject.created_by
      ),
    enabled: Boolean(detailProject?.id && currentUserId),
  });

  const detailCreator = modalExtrasQuery.data?.detailCreator ?? "";
  const detailContributors = modalExtrasQuery.data?.detailContributors ?? "";
  const isDetailContributor =
    modalExtrasQuery.data?.isDetailContributor ?? false;

  const invalidateProjectsList = useCallback(() => {
    if (currentUserId) {
      queryClient.invalidateQueries({
        queryKey: queryKeys.projectsList(realm, currentUserId),
      });
    }
  }, [queryClient, realm, currentUserId]);

  const invalidateModalExtras = useCallback(() => {
    if (detailProject?.id && currentUserId) {
      queryClient.invalidateQueries({
        queryKey: queryKeys.projectsFieldModalExtras(
          realm,
          detailProject.id,
          currentUserId
        ),
      });
    }
  }, [queryClient, realm, detailProject?.id, currentUserId]);

  const resetDetailUi = useCallback(() => {
    setInspirationLink(null);
    setPrimaryConfig(emptyPrimaryConfig(isVrisch));
  }, [isVrisch]);

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

      invalidateModalExtras();
    },
    [realm, currentUserId, invalidateModalExtras]
  );

  const leaveProjectFromField = useCallback(
    async (proj) => {
      if (
        !confirm(
          "Leave this project? You can join again later."
        )
      ) {
        return;
      }
      const { error } = await removeProjectContributor({
        projectId: proj.id,
        memberId: currentUserId,
        realm,
      });
      if (error) {
        alert(error.message);
        return;
      }
      invalidateModalExtras();
    },
    [realm, currentUserId, invalidateModalExtras]
  );

  // Primary config for field modal (simplified join/leave, no application flow)
  const applyPrimaryForProjectStable = useCallback(
    (proj) => {
      if (!currentUserId) return;
      const isCreator = proj.created_by === currentUserId;

      if (isCreator) {
        setPrimaryConfig(emptyPrimaryConfig(isVrisch));
        return;
      }

      if (isDetailContributor) {
        setPrimaryConfig({
          hidden: false,
          disabled: false,
          text: "Leave project",
          className: isVrisch
            ? "cursor-pointer rounded-full border border-[rgba(220,180,140,0.35)] bg-transparent px-5 py-2 text-[0.62rem] uppercase tracking-[0.18em] text-[rgba(235,220,200,0.85)] transition-all duration-250 hover:scale-[1.02]"
            : "cursor-pointer rounded-full border border-[rgba(120,90,60,0.35)] bg-transparent px-5 py-2 text-[0.62rem] uppercase tracking-[0.18em] text-[rgba(120,90,60,0.85)] transition-all duration-250 hover:scale-[1.02]",
          onClick: () => leaveProjectFromField(proj),
        });
        return;
      }

      setPrimaryConfig({
        hidden: false,
        disabled: false,
        text: "Join project",
        className: isVrisch
          ? "cursor-pointer rounded-full border-2 border-[rgba(200,190,160,0.55)] bg-white/8 px-6 py-2.5 text-[0.65rem] uppercase tracking-[0.18em] text-[rgba(240,235,225,0.92)] transition-all duration-250 hover:scale-[1.02] hover:bg-white/12"
          : "cursor-pointer rounded-full border-2 border-[rgba(100,85,65,0.5)] bg-white/50 px-6 py-2.5 text-[0.65rem] uppercase tracking-[0.18em] text-[rgba(55,48,38,0.9)] transition-all duration-250 hover:scale-[1.02] hover:bg-white/80",
        onClick: () => joinProject(proj),
      });
    },
    [
      currentUserId,
      isDetailContributor,
      isVrisch,
      joinProject,
      leaveProjectFromField,
    ]
  );

  useEffect(() => {
    if (!detailProject || !currentUserId) return;
    applyPrimaryForProjectStable(detailProject);
  }, [detailProject, currentUserId, applyPrimaryForProjectStable]);

  const openProjectDetail = useCallback(
    (project) => {
      resetDetailUi();
      setDetailProject(project);
      setDetailRoles(
        project.roles_needed ? `Needed: ${project.roles_needed}` : ""
      );
      if (project.inspiration_link) {
        setInspirationLink(project.inspiration_link);
      }
    },
    [resetDetailUi]
  );

  const closeProjectDetail = useCallback(() => {
    setDetailProject(null);
    setInspirationLink(null);
    resetDetailUi();
  }, [resetDetailUi]);

  // ── Complete project ─────────────────────────────────────────────────────
  const completeProjectMutation = useMutation({
    mutationFn: async (project) => {
      const { error } = await completeProject(project.id, realm, currentUserId);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_, project) => {
      // If detail modal is open for this project, close it
      if (detailProject?.id === project.id) closeProjectDetail();
      invalidateProjectsList();
    },
    onError: (err) => alert(err.message || "Could not complete project."),
  });

  // ── Archive project ──────────────────────────────────────────────────────
  const archiveProjectMutation = useMutation({
    mutationFn: async (project) => {
      const { error } = await archiveProject(project.id, realm, currentUserId);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_, project) => {
      if (detailProject?.id === project.id) closeProjectDetail();
      invalidateProjectsList();
    },
    onError: (err) => alert(err.message || "Could not archive project."),
  });

  // ── Hard delete project ──────────────────────────────────────────────────
  const deleteProjectMutation = useMutation({
    mutationFn: async (project) => {
      const { error } = await hardDeleteProject(project.id, realm, currentUserId);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_, project) => {
      if (detailProject?.id === project.id) closeProjectDetail();
      invalidateProjectsList();
    },
    onError: (err) => alert(err.message || "Could not delete project."),
  });

  const handleCompleteProject = useCallback(
    (project) => {
      completeProjectMutation.mutate(project);
    },
    [completeProjectMutation]
  );

  const handleArchiveProject = useCallback(
    (project) => {
      archiveProjectMutation.mutate(project);
    },
    [archiveProjectMutation]
  );

  const handleDeleteProject = useCallback(
    (project) => {
      deleteProjectMutation.mutate(project);
    },
    [deleteProjectMutation]
  );

  const createProjectMutation = useMutation({
    mutationFn: async ({
      title: rawTitle,
      description: rawDescription,
      timeline: rawTimeline,
      status,
      cny,
      inspiration,
      imageFile,
      start_date,
      end_date,
    }) => {
      const title = rawTitle.trim();
      const description = rawDescription.trim();
      const timeline = rawTimeline.trim();

      const {
        data: { session: s },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (!s || sessionError) {
        throw new Error("SESSION");
      }

      if (!title || !description) {
        throw new Error("VALIDATION");
      }

      const inspirationLinkVal = isVrisch ? null : inspiration?.trim() || null;

      let image_url = null;
      if (imageFile) {
        const { error: uploadError, url } = await uploadProjectImageFile(
          imageFile
        );
        if (uploadError) {
          throw new Error("UPLOAD");
        }
        image_url = url;
      }

      const { error } = await insertProjectRow({
        title,
        description,
        timeline,
        status,
        created_by: currentUserId,
        realm,
        archived: false,
        chinese_new_year: isVrisch ? false : Boolean(cny),
        image_url,
        inspiration_link: inspirationLinkVal,
        start_date: start_date || null,
        end_date: end_date || null,
      });

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      setCreateOpen(false);
      invalidateProjectsList();
    },
    onError: (err) => {
      if (err?.message === "SESSION") {
        alert("Session expired. Please refresh and log in again.");
        return;
      }
      if (err?.message === "VALIDATION") {
        alert("Project requires a name and description.");
        return;
      }
      if (err?.message === "UPLOAD") {
        console.error("Image upload failed");
        alert("Image upload failed.");
        return;
      }
      console.error("Project insert failed:", err);
      alert("Failed to create project.");
    },
  });

  const particles = useMemo(() => createParticleField(60), [realm]);

  const isDetailCreator =
    detailProject && detailProject.created_by === currentUserId;

  return {
    realm,
    isVrisch,
    navigate,
    projects,
    fieldProjects,
    visibleCount,
    positions,
    particles,
    detailProject,
    detailCreator,
    detailContributors,
    detailRoles,
    primaryConfig,
    inspirationLink,
    isDetailCreator,
    currentUserId,
    createOpen,
    setCreateOpen,
    openProjectDetail,
    closeProjectDetail,
    handleCompleteProject,
    handleArchiveProject,
    handleDeleteProject,
    createProjectMutation,
  };
}
