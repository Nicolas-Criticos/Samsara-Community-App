import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../../lib/supabase.js";
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
import { uploadProjectActivityImageFile } from "../../../lib/storage.js";
import {
  buildPrimaryActionConfig,
  emptyPrimaryConfig,
} from "../../projects/lib/primaryActions.js";

export function useProjectDetailPage() {
  const { realm: realmParam, projectSlug } = useParams();
  const navigate = useNavigate();
  const realm = realmParam === "vrischgewagt" ? "vrischgewagt" : "samsara";
  const isVrisch = realm === "vrischgewagt";

  const [currentUserId, setCurrentUserId] = useState(null);
  const [ready, setReady] = useState(false);
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [loadError, setLoadError] = useState(null);

  const [detailCreator, setDetailCreator] = useState("");
  const [detailContributors, setDetailContributors] = useState("");
  const [applicationBanner, setApplicationBanner] = useState(null);
  const [isContributor, setIsContributor] = useState(false);
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
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/", { replace: true });
        return;
      }
      setCurrentUserId(session.user.id);
      setReady(true);
    });
  }, [navigate]);

  const refreshContributorsLine = useCallback(
    async (projectId) => {
      const line = await formatContributorsLine(projectId, realm);
      setDetailContributors(line);
    },
    [realm]
  );

  const reloadActivity = useCallback(async (projectId) => {
    const [tRes, uRes] = await Promise.all([
      fetchProjectTasks(projectId),
      fetchProjectUpdates(projectId),
    ]);
    if (!tRes.error && tRes.data) setTasks(tRes.data);
    if (!uRes.error && uRes.data) setUpdates(uRes.data);
  }, []);

  useEffect(() => {
    if (!ready || !projectSlug) return undefined;
    let cancelled = false;
    setLoadError(null);
    setDetailCreator("");
    setDetailContributors("");
    setApplicationBanner(null);
    setIsContributor(false);
    (async () => {
      const { project: p, error } = await fetchProjectBySlug(
        realm,
        projectSlug
      );
      if (cancelled) return;
      if (error) {
        setProject(null);
        setLoadError(error.message || "Could not load project");
        return;
      }
      if (!p) {
        setProject(null);
        setLoadError("Project not found");
        return;
      }
      setProject(p);
      await reloadActivity(p.id);
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, realm, projectSlug, reloadActivity]);

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

  useEffect(() => {
    if (!project || !currentUserId) return undefined;
    let cancelled = false;
    (async () => {
      const { data: creator } = await fetchMemberUsernameByUserId(
        project.created_by
      );
      if (cancelled) return;
      setDetailCreator(`Created by ${creator?.username || "Unknown"}`);
      await refreshContributorsLine(project.id);
      if (cancelled) return;
      const { data: contribRow } = await findExistingContributor(
        project.id,
        currentUserId,
        realm
      );
      if (cancelled) return;
      setIsContributor(Boolean(contribRow));
      if (project.created_by === currentUserId) {
        await loadApplications(project.id);
      } else {
        setApplicationBanner(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [project, currentUserId, refreshContributorsLine, loadApplications]);

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

      await refreshContributorsLine(p.id);
      setIsContributor(true);
    },
    [realm, currentUserId, refreshContributorsLine]
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
      setIsContributor(false);
      await refreshContributorsLine(p.id);
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
        isVrisch
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

      await refreshContributorsLine(projectId);
      alert("Applications processed.");
      setApplicationBanner(null);
    },
    [realm, refreshContributorsLine]
  );

  const onStatusChange = useCallback(
    async (newStatus, p) => {
      await updateProjectStatus(p.id, realm, currentUserId, newStatus);
      setProject((prev) => (prev ? { ...prev, status: newStatus } : prev));
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
          isVrisch
        )
      );
    },
    [
      realm,
      currentUserId,
      joinProject,
      applyToProject,
      leaveProjectContributor,
      isContributor,
      isVrisch,
    ]
  );

  const endProject = useCallback(
    async (p) => {
      if (!confirm("This will end the project permanently.")) return;

      await archiveProject(p.id, realm, currentUserId);
      navigate(`/projects/${realm}`, { replace: true });
    },
    [realm, currentUserId, navigate]
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

  const addTask = useCallback(
    async ({ name, description, file, start_date, end_date, status }) => {
      if (!project) return { error: "No project" };
      let image = null;
      if (file) {
        const { error: upErr, url } = await uploadProjectActivityImageFile(
          project.id,
          "tasks",
          file
        );
        if (upErr) return { error: upErr.message };
        image = url;
      }
      const { error } = await insertProjectTask({
        projectId: project.id,
        realm,
        name,
        description,
        image,
        status: status || DEFAULT_PROJECT_TASK_STATUS,
        start_date,
        end_date,
      });
      if (error) return { error: error.message };
      await reloadActivity(project.id);
      return {};
    },
    [project, realm, reloadActivity]
  );

  const updateTask = useCallback(
    async (taskId, payload) => {
      if (!project) return { error: "No project" };
      const {
        name,
        description,
        status,
        start_date,
        end_date,
        file,
        removeImage,
      } = payload;

      const row = {
        name: name.trim(),
        description: description.trim() || null,
        status,
        start_date: start_date || null,
        end_date: end_date || null,
      };

      if (removeImage) {
        row.image = null;
      } else if (file) {
        const { error: upErr, url } = await uploadProjectActivityImageFile(
          project.id,
          "tasks",
          file
        );
        if (upErr) return { error: upErr.message };
        row.image = url;
      }

      const { error } = await updateProjectTask(taskId, row);
      if (error) return { error: error.message };
      await reloadActivity(project.id);
      return {};
    },
    [project, reloadActivity]
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
      await reloadActivity(project.id);
      return {};
    },
    [project, reloadActivity]
  );

  const inspirationLink =
    project?.inspiration_link && !isVrisch ? project.inspiration_link : null;

  const detailRoles = project?.roles_needed
    ? `Needed: ${project.roles_needed}`
    : "";

  const showEndProject = Boolean(
    project && currentUserId && project.created_by === currentUserId
  );

  return {
    realm,
    isVrisch,
    projectSlug,
    project,
    tasks,
    updates,
    loadError,
    ready,
    currentUserId,
    isCreator,
    isContributor,
    showContributorAddUpdate,
    canManageTasks,
    navigate,
    addTask,
    addUpdate,
    updateTask,
    detailCreator,
    detailContributors,
    detailRoles,
    inspirationLink,
    applicationBanner,
    primaryConfig,
    showEndProject,
    onStatusChange,
    endProject,
    handleApplications,
  };
}
