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
  fetchApplicantNameMap,
  fetchEnrichedProjects,
  fetchPendingApplications,
  findExistingContributor,
  formatContributorsLine,
  insertProjectApplication,
  insertProjectRow,
  removeProjectContributor,
  setApplicationStatus,
  updateProjectStatus,
} from "../../../lib/projectsApi.js";
import { uploadProjectImageFile } from "../../../lib/storage.js";
import {
  buildPrimaryActionConfig,
  emptyPrimaryConfig,
} from "../lib/primaryActions.js";

async function fetchModalExtrasFull(realm, projectId, userId, createdBy) {
  const [{ data: creator }, line, { data: contribRow }] = await Promise.all([
    fetchMemberUsernameByUserId(createdBy),
    formatContributorsLine(projectId, realm),
    findExistingContributor(projectId, userId, realm),
  ]);

  let applicationBanner = null;
  let showEndProject = false;
  if (createdBy === userId) {
    showEndProject = true;
    const { data: apps, error } = await fetchPendingApplications(
      projectId,
      realm
    );
    if (!error && apps?.length) {
      const nameMap = await fetchApplicantNameMap(
        apps.map((a) => a.applicant_id)
      );
      applicationBanner = { apps, nameMap, projectId };
    }
  }

  return {
    detailCreator: `Created by ${creator?.username || "Unknown"}`,
    detailContributors: line,
    isDetailContributor: Boolean(contribRow),
    applicationBanner,
    showEndProject,
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

  useEffect(() => {
    if (!currentUserId || !projectsQuery.isSuccess) return undefined;
    const enriched = projectsQuery.data;
    if (!enriched) return undefined;
    let cancelled = false;
    loadTimeoutsRef.current.forEach(clearTimeout);
    loadTimeoutsRef.current = [];

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
  const applicationBanner = modalExtrasQuery.data?.applicationBanner ?? null;
  const isDetailContributor =
    modalExtrasQuery.data?.isDetailContributor ?? false;
  const showEndProject = modalExtrasQuery.data?.showEndProject ?? false;

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
          "Leave this project? You can join again later if it stays open."
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
    (proj) => {
      setPrimaryConfig(
        buildPrimaryActionConfig(
          proj,
          currentUserId,
          {
            joinProject,
            applyToProject,
            leaveProject: leaveProjectFromField,
            isContributor: isDetailContributor,
          },
          isVrisch
        )
      );
    },
    [
      currentUserId,
      joinProject,
      applyToProject,
      leaveProjectFromField,
      isDetailContributor,
      isVrisch,
    ]
  );

  useEffect(() => {
    if (!detailProject || !currentUserId) return;
    applyPrimaryForProjectStable(detailProject);
  }, [detailProject, currentUserId, applyPrimaryForProjectStable]);

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

      await queryClient.invalidateQueries({
        queryKey: queryKeys.projectsFieldModalExtras(
          realm,
          projectId,
          currentUserId
        ),
      });
      alert("Applications processed.");
    },
    [realm, currentUserId, queryClient]
  );

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

  const onStatusChange = useMutation({
    mutationFn: async ({ newStatus, project }) => {
      await updateProjectStatus(
        project.id,
        realm,
        currentUserId,
        newStatus
      );
    },
    onSuccess: (_d, { newStatus, project }) => {
      setDetailProject((p) => (p ? { ...p, status: newStatus } : p));
      invalidateProjectsList();
      applyPrimaryForProjectStable({ ...project, status: newStatus });
    },
  });

  const closeProjectDetail = useCallback(() => {
    setDetailProject(null);
    setInspirationLink(null);
    resetDetailUi();
  }, [resetDetailUi]);

  const endProject = useMutation({
    mutationFn: async (project) => {
      await archiveProject(project.id, realm, currentUserId);
    },
    onSuccess: () => {
      closeProjectDetail();
      invalidateProjectsList();
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: async ({
      title: rawTitle,
      description: rawDescription,
      timeline: rawTimeline,
      status,
      cny,
      inspiration,
      imageFile,
      startDate,
      endDate,
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
        start_date: startDate || null,
        end_date: endDate || null,
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

  const handleEndProject = useCallback(
    (project) => {
      if (!confirm("This will end the project permanently.")) return;
      endProject.mutate(project);
    },
    [endProject]
  );

  const handleStatusChange = useCallback(
    (newStatus, project) => {
      onStatusChange.mutate({ newStatus, project });
    },
    [onStatusChange]
  );

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
    openProjectDetail,
    closeProjectDetail,
    onStatusChange: handleStatusChange,
    endProject: handleEndProject,
    handleApplications,
    createProjectMutation,
  };
}
