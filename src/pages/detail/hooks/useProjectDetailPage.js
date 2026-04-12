import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuthSession } from "../../../hooks/useAuthSession.js";
import { queryKeys } from "../../../lib/queryKeys.js";
import { fetchMemberUsernameByUserId } from "../../../lib/membersApi.js";
import {
  addProjectContributor,
  archiveProject,
  fetchApplicantNameMap,
  fetchPendingApplications,
  fetchProjectBySlug,
  findExistingContributor,
  formatContributorsLine,
  insertProjectApplication,
  removeProjectContributor,
  setApplicationStatus,
  updateProjectRow,
  updateProjectStatus,
} from "../../../lib/projectsApi.js";
import {
  fetchProjectTasks,
  fetchProjectUpdates,
  insertProjectTask,
  insertProjectUpdate,
  updateProjectTask,
} from "../../../lib/projectActivityApi.js";
import { DEFAULT_PROJECT_TASK_STATUS } from "../../../lib/projectTaskConstants.js";
import {
  uploadProjectImageFile,
} from "../../../lib/storage.js";
import { projectDetailHref, slugifyProjectTitle } from "../../../lib/slug.js";
import {
  buildPrimaryActionConfig,
  emptyPrimaryConfig,
} from "../../projects/lib/primaryActions.js";

async function fetchProjectMeta(realm, project, userId) {
  const pid = project.id;
  const createdBy = project.created_by;

  const [{ data: creator }, line, { data: contribRow }] = await Promise.all([
    fetchMemberUsernameByUserId(createdBy),
    formatContributorsLine(pid, realm),
    findExistingContributor(pid, userId, realm),
  ]);

  let applicationBanner = null;
  if (createdBy === userId) {
    const { data: apps, error } = await fetchPendingApplications(pid, realm);
    if (!error && apps?.length) {
      const nameMap = await fetchApplicantNameMap(
        apps.map((a) => a.applicant_id)
      );
      applicationBanner = { apps, nameMap, projectId: pid };
    }
  }

  return {
    detailCreator: `Created by ${creator?.username || "Unknown"}`,
    detailContributors: line,
    isContributor: Boolean(contribRow),
    applicationBanner,
  };
}

async function fetchActivityBundle(projectId) {
  const [tRes, uRes] = await Promise.all([
    fetchProjectTasks(projectId),
    fetchProjectUpdates(projectId),
  ]);
  return {
    tasks: tRes.error ? [] : tRes.data || [],
    updates: uRes.error ? [] : uRes.data || [],
  };
}

export function useProjectDetailPage() {
  const { realm: realmParam, projectSlug } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const realm = realmParam === "vrischgewagt" ? "vrischgewagt" : "samsara";
  const isVrisch = realm === "vrischgewagt";

  const { data: session, isPending: sessionPending } = useAuthSession();
  const currentUserId = session?.user?.id ?? null;

  const [primaryConfig, setPrimaryConfig] = useState(() =>
    emptyPrimaryConfig(isVrisch)
  );

  useEffect(() => {
    document.body.dataset.realm = realm;
    return () => {
      delete document.body.dataset.realm;
    };
  }, [realm]);

  useEffect(() => {
    setPrimaryConfig(emptyPrimaryConfig(isVrisch));
  }, [isVrisch]);

  useEffect(() => {
    if (!sessionPending && !session) {
      navigate("/", { replace: true });
    }
  }, [sessionPending, session, navigate]);

  const projectQuery = useQuery({
    queryKey: queryKeys.projectBySlug(realm, projectSlug ?? ""),
    queryFn: async () => {
      const { project, error } = await fetchProjectBySlug(realm, projectSlug);
      if (error) {
        throw new Error(error.message || "Could not load project");
      }
      if (!project) {
        throw new Error("Project not found");
      }
      return project;
    },
    enabled: Boolean(currentUserId && projectSlug),
  });

  const project = projectQuery.data ?? null;
  const loadError =
    projectQuery.error?.message ??
    (projectQuery.isError ? "Could not load project" : null);

  const activityQuery = useQuery({
    queryKey: queryKeys.projectActivity(project?.id ?? ""),
    queryFn: () => fetchActivityBundle(project.id),
    enabled: Boolean(project?.id),
  });

  const tasks = activityQuery.data?.tasks ?? [];
  const updates = activityQuery.data?.updates ?? [];

  const metaQuery = useQuery({
    queryKey: [
      ...queryKeys.projectMeta(realm, project?.id ?? "", currentUserId ?? ""),
      project?.created_by ?? "",
    ],
    queryFn: () => fetchProjectMeta(realm, project, currentUserId),
    enabled: Boolean(project?.id && currentUserId),
  });

  const detailCreator = metaQuery.data?.detailCreator ?? "";
  const detailContributors = metaQuery.data?.detailContributors ?? "";
  const applicationBanner = metaQuery.data?.applicationBanner ?? null;
  const isContributor = metaQuery.data?.isContributor ?? false;

  const invalidateActivity = useCallback(() => {
    if (project?.id) {
      queryClient.invalidateQueries({
        queryKey: queryKeys.projectActivity(project.id),
      });
    }
  }, [queryClient, project?.id]);

  const invalidateMeta = useCallback(() => {
    if (project?.id && currentUserId) {
      queryClient.invalidateQueries({
        queryKey: queryKeys.projectMeta(realm, project.id, currentUserId),
      });
    }
  }, [queryClient, realm, project?.id, currentUserId]);

  const joinProject = useCallback(
    async (p) => {
      const { data: existing } = await findExistingContributor(
        p.id,
        currentUserId,
        realm
      );

      if (existing) {
        alert("You are already part of this project.");
        return;
      }

      await addProjectContributor({
        projectId: p.id,
        memberId: currentUserId,
        realm,
      });

      invalidateMeta();
    },
    [realm, currentUserId, invalidateMeta]
  );

  const leaveProjectContributor = useCallback(
    async (p) => {
      if (
        !confirm(
          "Leave this project? You can join again later if it stays open."
        )
      ) {
        return;
      }
      const { error } = await removeProjectContributor({
        projectId: p.id,
        memberId: currentUserId,
        realm,
      });
      if (error) {
        alert(error.message);
        return;
      }
      invalidateMeta();
    },
    [realm, currentUserId, invalidateMeta]
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

  useEffect(() => {
    if (!project || !currentUserId) return;
    setPrimaryConfig(
      buildPrimaryActionConfig(
        project,
        currentUserId,
        {
          joinProject,
          applyToProject,
          leaveProject: leaveProjectContributor,
          isContributor,
        },
        isVrisch,
        { memberActionsInMenu: true }
      )
    );
  }, [
    project,
    currentUserId,
    isVrisch,
    isContributor,
    joinProject,
    applyToProject,
    leaveProjectContributor,
  ]);

  const handleApplications = useCallback(
    async (apps, nameMap, projectId) => {
      for (const app of apps) {
        const approve = confirm(
          `${nameMap[app.applicant_id] || "Unknown"}\n\n${
            app.message
          }\n\nApprove?`
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
        queryKey: queryKeys.projectMeta(realm, projectId, currentUserId),
      });
      alert("Applications processed.");
    },
    [realm, currentUserId, queryClient]
  );

  const statusMutation = useMutation({
    mutationFn: async ({ newStatus, p }) => {
      await updateProjectStatus(p.id, realm, currentUserId, newStatus);
    },
    onSuccess: (_d, { newStatus, p }) => {
      queryClient.setQueryData(
        queryKeys.projectBySlug(realm, projectSlug),
        (old) => (old ? { ...old, status: newStatus } : old)
      );
      setPrimaryConfig(
        buildPrimaryActionConfig(
          { ...p, status: newStatus },
          currentUserId,
          {
            joinProject,
            applyToProject,
            leaveProject: leaveProjectContributor,
            isContributor,
          },
          isVrisch,
          { memberActionsInMenu: true }
        )
      );
    },
  });

  const endProject = useMutation({
    mutationFn: async (p) => {
      await archiveProject(p.id, realm, currentUserId);
    },
    onSuccess: () => {
      navigate(`/projects/${realm}`, { replace: true });
    },
  });

  const addTask = useCallback(
    async ({ name, description, start_date, end_date, status }) => {
      if (!project) return { error: "No project" };
      const { error } = await insertProjectTask({
        projectId: project.id,
        name,
        description,
        status: status || DEFAULT_PROJECT_TASK_STATUS,
        start_date,
        end_date,
      });
      if (error) return { error: error.message };
      invalidateActivity();
      return {};
    },
    [project, invalidateActivity]
  );

  const updateTask = useCallback(
    async (taskId, payload) => {
      if (!project) return { error: "No project" };
      const { name, description, status, start_date, end_date } = payload;
      const row = {
        name: name.trim(),
        description: description.trim() || null,
        status,
        start_date: start_date || null,
        end_date: end_date || null,
      };
      const { error } = await updateProjectTask(taskId, row);
      if (error) return { error: error.message };
      invalidateActivity();
      return {};
    },
    [project, invalidateActivity]
  );

  const updateProjectFields = useCallback(
    async ({
      title,
      description,
      timeline,
      status,
      imageFile,
      inspiration_link,
      chinese_new_year,
      roles_needed,
    }) => {
      if (!project) return { error: "No project" };
      const t = title.trim();
      const d = description.trim();
      if (!t || !d) {
        return { error: "Title and description are required." };
      }

      let image_url = project.image_url;
      if (imageFile) {
        const { error: upErr, url } = await uploadProjectImageFile(imageFile);
        if (upErr) {
          return { error: upErr.message || "Image upload failed" };
        }
        image_url = url;
      }

      const patch = {
        title: t,
        description: d,
        timeline: timeline.trim() || null,
        inspiration_link: isVrisch ? null : inspiration_link?.trim() || null,
        chinese_new_year: isVrisch ? false : Boolean(chinese_new_year),
        roles_needed: roles_needed?.trim() || null,
        image_url,
      };

      if (project.created_by === currentUserId) {
        patch.status = status;
      }

      const { error } = await updateProjectRow(project.id, realm, patch);
      if (error) {
        return { error: error.message || "Update failed" };
      }

      queryClient.setQueryData(
        queryKeys.projectBySlug(realm, projectSlug),
        (old) => (old ? { ...old, ...patch } : old)
      );

      const nextSlug = slugifyProjectTitle(t);
      if (nextSlug && nextSlug !== projectSlug) {
        const href = projectDetailHref(realm, t);
        if (href) navigate(href, { replace: true });
      }

      invalidateMeta();
      return {};
    },
    [
      project,
      projectSlug,
      realm,
      isVrisch,
      currentUserId,
      navigate,
      invalidateMeta,
      queryClient,
    ]
  );

  const addUpdate = useCallback(
    async ({ title, description, file }) => {
      if (!project) return { error: "No project" };
      let image = null;
      if (file) {
        const { error: upErr, url } = await uploadProjectActivityImageFile(
          project.id,
          "updates",
          file
        );
        if (upErr) return { error: upErr.message };
        image = url;
      }
      const { error } = await insertProjectUpdate({
        projectId: project.id,
        title,
        description,
        image,
      });
      if (error) return { error: error.message };
      invalidateActivity();
      return {};
    },
    [project, invalidateActivity]
  );

  const creatorUpdateMutation = useMutation({
    mutationFn: async ({ title, description, file }) => {
      const result = await addUpdate({ title, description, file });
      if (result?.error) {
        throw new Error(result.error);
      }
      return result;
    },
  });

  const inspirationLink =
    project?.inspiration_link && !isVrisch ? project.inspiration_link : null;

  const detailRoles = project?.roles_needed
    ? `Needed: ${project.roles_needed}`
    : "";

  const showEndProject = Boolean(
    project && currentUserId && project.created_by === currentUserId
  );

  const isCreator = Boolean(project && currentUserId === project.created_by);

  const showContributorAddUpdate = Boolean(
    isContributor && project && currentUserId !== project.created_by
  );

  const canManageTasks = Boolean(
    project &&
      currentUserId &&
      (project.created_by === currentUserId || isContributor)
  );

  const ready = !sessionPending && Boolean(session);
  const isProjectLoading =
    Boolean(currentUserId && projectSlug) && projectQuery.isPending;

  return {
    realm,
    isVrisch,
    projectSlug,
    project,
    tasks,
    updates,
    loadError,
    ready,
    isProjectLoading,
    currentUserId,
    isCreator,
    isContributor,
    showContributorAddUpdate,
    canManageTasks,
    navigate,
    addTask,
    addUpdate,
    creatorUpdatePending: creatorUpdateMutation.isPending,
    submitCreatorUpdate: (payload, callbacks = {}) => {
      creatorUpdateMutation.mutate(payload, {
        onSuccess: () => callbacks.onSuccess?.(),
        onError: (error) =>
          callbacks.onError?.(error?.message || "Could not add update."),
      });
    },
    updateTask,
    updateProjectFields,
    joinProject,
    leaveProjectContributor,
    applyToProject,
    detailCreator,
    detailContributors,
    detailRoles,
    inspirationLink,
    applicationBanner,
    primaryConfig,
    showEndProject,
    onStatusChange: (newStatus, p) =>
      statusMutation.mutate({ newStatus, p }),
    endProject: (p) => {
      if (!confirm("This will end the project permanently.")) return;
      endProject.mutate(p);
    },
    handleApplications,
  };
}
