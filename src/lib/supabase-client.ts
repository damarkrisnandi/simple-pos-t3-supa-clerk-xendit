import type { Bucket } from "@/server/bucket";
import { createClient } from "@supabase/supabase-js";

export const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export const uploadFileToSignedUrl = async ({
  file,
  path,
  token,
  bucket,
}: {
  file: File;
  path: string;
  token: string;
  bucket: Bucket;
}) => {
  try {
    const { data, error } = await supabaseClient.storage
      .from(bucket)
      .uploadToSignedUrl(path, token, file);

    if (error) throw error;

    if (!data) throw new Error("No data returned from uploadToSignedUrl");

    const fileUrl = supabaseClient.storage
      .from(bucket)
      .getPublicUrl(data?.path);

    return fileUrl.data.publicUrl;
  } catch (error) {
    throw error;
  }
};

export const removeFile = async ({
  path,
  // token,
  bucket,
}: {
  path: string;
  // token: string;
  bucket: Bucket;
}) => {
  const { data, error } = await supabaseClient.storage
    .from(bucket)
    .remove([path]);

  if (error) throw error;

  return data;
};
