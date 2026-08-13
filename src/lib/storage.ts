import { supabase } from "@/integrations/supabase/client";

export const MAX_CV_BYTES = 5 * 1024 * 1024;
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

export type UploadResult = { path: string };

function extensionOf(file: File, fallback: string) {
  const parts = file.name.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : fallback;
}

export async function uploadCv(userId: string, file: File): Promise<UploadResult> {
  if (file.type !== "application/pdf") throw new Error("The CV must be a PDF file.");
  if (file.size > MAX_CV_BYTES) throw new Error("The CV must be smaller than 5 MB.");
  const path = `${userId}/cv-${Date.now()}.pdf`;
  const { error } = await supabase.storage.from("cvs").upload(path, file, {
    contentType: "application/pdf",
    upsert: true,
  });
  if (error) throw new Error(error.message);
  return { path };
}

export async function uploadImage(
  bucket: "avatars" | "company-logos",
  userId: string,
  file: File,
): Promise<UploadResult> {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file.");
  if (file.size > MAX_IMAGE_BYTES) throw new Error("The image must be smaller than 2 MB.");
  const path = `${userId}/${bucket}-${Date.now()}.${extensionOf(file, "png")}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type,
    upsert: true,
  });
  if (error) throw new Error(error.message);
  return { path };
}

/** Buckets are private, so viewing a stored file always goes through a short-lived signed URL. */
export async function createSignedUrl(
  bucket: "cvs" | "avatars" | "company-logos",
  path: string,
  expiresIn = 60 * 10,
) {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}

export async function openCv(path: string) {
  const url = await createSignedUrl("cvs", path);
  window.open(url, "_blank", "noopener,noreferrer");
}
