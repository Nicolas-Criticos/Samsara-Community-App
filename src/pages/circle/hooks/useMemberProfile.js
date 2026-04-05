import { useCallback, useState } from "react";
import {
  fetchMemberProjectsSummary,
  updateMemberBioAndWebsite,
  updateMemberProfileImageUrl,
  updateMemberProfilePdfUrl,
} from "../../../lib/membersApi.js";
import {
  uploadProfileAvatarFile,
  uploadProfilePdfFile,
} from "../../../lib/storage.js";

function normalizeWebsite(raw) {
  let w = raw.trim();
  if (!w) return "";
  if (!w.startsWith("http://") && !w.startsWith("https://")) {
    w = `https://${w}`;
  }
  return w;
}

export function useMemberProfile(currentUserId) {
  const [profileMember, setProfileMember] = useState(null);
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [projectItems, setProjectItems] = useState(null);

  const loadProjects = useCallback(async (userId) => {
    const { items } = await fetchMemberProjectsSummary(userId);
    setProjectItems(items);
  }, []);

  const openMemberProfile = useCallback(
    async (member) => {
      setProjectItems(null);
      setProfileMember(member);
      setBio(member.bio || "");
      setWebsite(member.website || "");
      await loadProjects(member.user_id);
    },
    [loadProjects]
  );

  const closeMemberProfile = useCallback(() => {
    setProfileMember(null);
    setProjectItems(null);
  }, []);

  const saveProfile = useCallback(async () => {
    if (!currentUserId) return;
    const normalized = normalizeWebsite(website);
    const { error } = await updateMemberBioAndWebsite(currentUserId, {
      bio: bio.trim(),
      website: normalized,
    });

    if (error) {
      console.error("Profile update failed:", error);
      alert("Failed to save profile.");
      return;
    }

    closeMemberProfile();
  }, [bio, website, currentUserId, closeMemberProfile]);

  const onAvatarChange = useCallback(
    async (ev) => {
      const file = ev.target.files?.[0];
      ev.target.value = "";
      if (!file || !currentUserId) return;

      const { error, url } = await uploadProfileAvatarFile(currentUserId, file);
      if (error) {
        console.error("Upload failed:", error);
        alert("Image upload failed");
        return;
      }

      const { error: updateError } = await updateMemberProfileImageUrl(
        currentUserId,
        url
      );

      if (updateError) {
        console.error("DB update failed:", updateError);
        alert("Profile update failed");
        return;
      }

      setProfileMember((m) => (m ? { ...m, profile_image_url: url } : m));
    },
    [currentUserId]
  );

  const onPdfChange = useCallback(
    async (ev) => {
      const file = ev.target.files?.[0];
      ev.target.value = "";
      if (!file || !currentUserId) return;

      if (file.type !== "application/pdf") {
        alert("Only PDF files allowed.");
        return;
      }

      const { error, url } = await uploadProfilePdfFile(currentUserId, file);
      if (error) {
        console.error(error);
        alert("PDF upload failed.");
        return;
      }

      const { error: dbError } = await updateMemberProfilePdfUrl(
        currentUserId,
        url
      );

      if (dbError) {
        alert("Failed to save PDF link.");
        return;
      }

      alert("PDF uploaded successfully.");
      setProfileMember((m) => (m ? { ...m, profile_pdf_url: url } : m));
    },
    [currentUserId]
  );

  const isSelf =
    profileMember && profileMember.user_id === currentUserId;

  return {
    profileMember,
    bio,
    setBio,
    website,
    setWebsite,
    projectItems,
    isSelf,
    openMemberProfile,
    closeMemberProfile,
    saveProfile,
    onAvatarChange,
    onPdfChange,
  };
}
