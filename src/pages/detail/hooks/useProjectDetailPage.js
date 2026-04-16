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
  completeProject,
  fetchContributorsList,
  fetchProjectBySlug,
  findExistingContributor,
  hardDeleteProject,
  removeProjectContributor,
  updateProjectRow,
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
  emptyPrimaryConfig,
} from "../../projects/lib/primaryActions.js";

async function fetchProjectMeta(realm, project, userId) {
  const pid = project.id;
  const createdBy = project.created_by;

  const [{ data: creator }, { data: contribRow }, contributorsList] =
    await Promise.all([
      fetchMemberUsernameByUserId(createdBy),
      findExistingContributor(pid, userId, realm),
      fetchContributorsList(pid, realm),
    ]);

  const contributors = contributorsList || [];
  const contribLine =
    contributors.length > 0
      ? `Contributors: ${contributors.map((c) => c.username).join(", ")}`
      : "Contributors: None";

  return {
    detailCreator: `Created by ${creator?.username || "Unknown"}`,
    detailContributors: contribLine,
    contributorsList: contributors,
    isContributor: Boolean(contribRow),
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
  const contributorsList = metaQuery.data?.contributorsList ?? [];
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

  const invalidateProject = useCallback(() => {
    if (projectSlug) {
      queryClient.invalidateQueries({
        queryKey: queryKeys.projectBySlug(realm, projectSlug),
      });
    }
  }, [queryClient, realm, projectSlug]);

  // ── Join (instant — no application flow) ──────────────────────────────────
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
          "Leave this project? You can join again later."
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

  // ── Remove a specific contributor (creator only) ───────────────────────────
  const removeContributor = useCallback(
    async (memberId) => {
      if (!project) return;
      if (!confirm("Remove this contributor from the project?")) return;
      const { error } = await removeProjectContributor({
        projectId: project.id,
        memberId,
        realm,
      });
      if (error) {
        alert(error.message);
        return;
      }
      invalidateMeta();
    },
    [project, realm, invalidateMeta]
  );

  // ── Complete project ───────────────────────────────────────────────────────
  const completeProjectMutation = useMutation({
    mutationFn: async () => {
      if (!project) throw new Error("No project");
      const { error } = await completeProject(project.id, realm, currentUserId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      invalidateProject();
      navigate(`/projects/${realm}`, { replace: true });
    },
    onError: (err) => alert(err.message || "Could not complete project."),
  });

  // ── Delete project (hard delete) ───────────────────────────────────────────
  const deleteProjectMutation = useMutation({
    mutationFn: async () => {
      if (!project) throw new Error("No project");
      const { error } = await hardDeleteProject(project.id, realm, currentUserId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      navigate(`/projects/${realm}`, { replace: true });
    },
    onError: (err) => alert(err.message || "Could not delete project."),
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
      await queryClient.invalidateQueries({
        queryKey: queryKeys.projectActivity(project.id),
      });
      return {};
    },
    [project, queryClient, invalidateActivity]
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
      await queryClient.invalidateQueries({
        queryKey: queryKeys.projectActivity(project.id),
      });
      return {};
    },
    [project, queryClient, invalidateActivity]
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
      start_date,
      end_date,
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
        start_date: start_date || null,
        end_date: end_date || null,
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

  const isCreator = Boolean(project && currentUserId === project.created_by);

  const showContributorAddUpdate = Boolean(
    isContributor && project && currentUserId !== project.created_by
  );

  const canManageTasks = Boolean(
    project &&
      currentUserId &&
      (project.created_by === currentUserId || isContributor)
  );

  // Build simple primary config for join/leave (no application flow)
  useEffect(() => {
    if (!project || !currentUserId) return;

    if (isCreator) {
      setPrimaryConfig(emptyPrimaryConfig(isVrisch));
      return;
    }

    if (isContributor) {
      setPrimaryConfig({
        hidden: false,
        disabled: false,
        text: "Leave project",
        className: isVrisch
          ? "cursor-pointer rounded-full border border-[rgba(220,180,140,0.35)] bg-transparent px-5 py-2 text-[0.62rem] uppercase tracking-[0.18em] text-[rgba(235,220,200,0.85)] transition-all duration-250 hover:scale-[1.02]"
          : "cursor-pointer rounded-full border border-[rgba(120,90,60,0.35)] bg-transparent px-5 py-2 text-[0.62rem] uppercase tracking-[0.18em] text-[rgba(120,90,60,0.85)] transition-all duration-250 hover:scale-[1.02]",
        onClick: () => leaveProjectContributor(project),
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
      onClick: () => joinProject(project),
    });
  }, [
    project,
    currentUserId,
    isVrisch,
    isCreator,
    isContributor,
    joinProject,
    leaveProjectContributor,
  ]);

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
    removeContributor,
    detailCreator,
    detailContributors,
    contributorsList,
    detailRoles,
    inspirationLink,
    primaryConfig,
    completeProject: () => {
      if (!confirm("Mark this project as completed? It will be removed from the field.")) return;
      completeProjectMutation.mutate();
    },
    deleteProject: () => {
      if (!confirm(`Permanently delete "${project?.title}"? This cannot be undone.`)) return;
      deleteProjectMutation.mutate();
    },
  };
}
