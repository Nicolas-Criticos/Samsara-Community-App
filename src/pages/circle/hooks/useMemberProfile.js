import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  fetchMemberProjectsSummary,
  updateMemberBioAndWebsite,
  updateMemberProfileImageUrl,
  updateMemberProfilePdfUrl,
} from "../../../lib/membersApi.js";
import { queryKeys } from "../../../lib/queryKeys.js";
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
  const queryClient = useQueryClient();
  const [profileMember, setProfileMember] = useState(null);

  const profileForm = useForm({
    defaultValues: { bio: "", website: "" },
  });

  const memberId = profileMember?.user_id;

  const summaryQuery = useQuery({
    queryKey: queryKeys.memberProjectsSummary(memberId ?? ""),
    queryFn: async () => {
      const { items } = await fetchMemberProjectsSummary(memberId);
      return items;
    },
    enabled: Boolean(memberId),
  });

  const { reset: resetProfileFields } = profileForm;
  useEffect(() => {
    if (profileMember) {
      resetProfileFields({
        bio: profileMember.bio || "",
        website: profileMember.website || "",
      });
    }
  }, [profileMember, resetProfileFields]);

  const openMemberProfile = useCallback((member) => {
    setProfileMember(member);
  }, []);

  const closeMemberProfile = useCallback(() => {
    setProfileMember(null);
    resetProfileFields({ bio: "", website: "" });
  }, [resetProfileFields]);

  const saveMutation = useMutation({
    mutationFn: async ({ bio, website }) => {
      if (!currentUserId) throw new Error("Not signed in");
      const normalized = normalizeWebsite(website);
      const { error } = await updateMemberBioAndWebsite(currentUserId, {
        bio: bio.trim(),
        website: normalized,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      closeMemberProfile();
    },
    onError: (err) => {
      console.error("Profile update failed:", err);
      alert("Failed to save profile.");
    },
  });

  const avatarMutation = useMutation({
    mutationFn: async (file) => {
      if (!currentUserId) throw new Error("Not signed in");
      const { error, url } = await uploadProfileAvatarFile(
        currentUserId,
        file
      );
      if (error) throw error;
      const { error: updateError } = await updateMemberProfileImageUrl(
        currentUserId,
        url
      );
      if (updateError) throw updateError;
      return url;
    },
    onSuccess: (url) => {
      setProfileMember((m) => (m ? { ...m, profile_image_url: url } : m));
      queryClient.invalidateQueries({
        queryKey: queryKeys.circleMembers(),
      });
    },
    onError: (err) => {
      console.error("Upload failed:", err);
      alert("Image upload failed");
    },
  });

  const pdfMutation = useMutation({
    mutationFn: async (file) => {
      if (!currentUserId) throw new Error("Not signed in");
      if (file.type !== "application/pdf") {
        throw new Error("Only PDF files allowed.");
      }
      const { error, url } = await uploadProfilePdfFile(currentUserId, file);
      if (error) throw error;
      const { error: dbError } = await updateMemberProfilePdfUrl(
        currentUserId,
        url
      );
      if (dbError) throw dbError;
      return url;
    },
    onSuccess: (url) => {
      alert("PDF uploaded successfully.");
      setProfileMember((m) => (m ? { ...m, profile_pdf_url: url } : m));
    },
    onError: (err) => {
      console.error(err);
      alert(err.message || "PDF upload failed.");
    },
  });

  const onAvatarChange = useCallback(
    (ev) => {
      const file = ev.target.files?.[0];
      ev.target.value = "";
      if (!file) return;
      avatarMutation.mutate(file);
    },
    [avatarMutation]
  );

  const onPdfChange = useCallback(
    (ev) => {
      const file = ev.target.files?.[0];
      ev.target.value = "";
      if (!file) return;
      pdfMutation.mutate(file);
    },
    [pdfMutation]
  );

  const saveProfile = profileForm.handleSubmit((values) => {
    saveMutation.mutate(values);
  });

  const isSelf =
    profileMember && profileMember.user_id === currentUserId;

  return {
    profileMember,
    projectItems: summaryQuery.data ?? null,
    isSelf,
    profileForm,
    saveProfile,
    savePending: saveMutation.isPending,
    openMemberProfile,
    closeMemberProfile,
    onAvatarChange,
    onPdfChange,
    avatarPending: avatarMutation.isPending,
    pdfPending: pdfMutation.isPending,
  };
}
