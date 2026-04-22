import { supabase } from "./supabase.js";

export const STORAGE_BUCKETS = {
  profileImage: "profile-image",
  profilePdf: "profile-pdf",
  projectImages: "project-images",
};

export function publicObjectUrl(bucket, path) {
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

export async function uploadProfileAvatarFile(userId, file) {
  const ext = file.name.split(".").pop();
  const path = `${userId}.${ext}`;
  const { error } = await supabase.storage
    .from(STORAGE_BUCKETS.profileImage)
    .upload(path, file, {
      upsert: true,
      contentType: file.type,
    });
  if (error) return { error, url: null };
  return { error: null, url: publicObjectUrl(STORAGE_BUCKETS.profileImage, path) };
}

export async function uploadProfilePdfFile(userId, file) {
  const path = `${userId}/profile.pdf`;
  const { error } = await supabase.storage
    .from(STORAGE_BUCKETS.profilePdf)
    .upload(path, file, {
      upsert: true,
      contentType: "application/pdf",
    });
  if (error) return { error, url: null };
  return { error: null, url: publicObjectUrl(STORAGE_BUCKETS.profilePdf, path) };
}

export async function uploadProjectImageFile(file) {
  const ext = file.name.split(".").pop().toLowerCase();
  const path = `projects/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(STORAGE_BUCKETS.projectImages)
    .upload(path, file, {
      upsert: false,
      contentType: file.type,
    });
  if (error) return { error, url: null };
  return { error: null, url: publicObjectUrl(STORAGE_BUCKETS.projectImages, path) };
}

/** Task / update images scoped under a project id. */
export async function uploadProjectActivityImageFile(projectId, subfolder, file) {
  const ext = file.name.split(".").pop().toLowerCase();
  const path = `projects/${projectId}/${subfolder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(STORAGE_BUCKETS.projectImages)
    .upload(path, file, {
      upsert: false,
      contentType: file.type,
    });
  if (error) return { error, url: null };
  return { error: null, url: publicObjectUrl(STORAGE_BUCKETS.projectImages, path) };
}

/** Review photos scoped under a project id. Throws on error. */
export async function uploadReviewPhoto(projectId, file) {
  const ext = file.name.split(".").pop().toLowerCase();
  const path = `reviews/${projectId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from(STORAGE_BUCKETS.projectImages)
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (error) throw error;
  return publicObjectUrl(STORAGE_BUCKETS.projectImages, path);
}
