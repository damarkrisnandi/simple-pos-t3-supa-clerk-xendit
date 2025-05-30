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

export const getAllUploadedImages = async ({
    // path,
    // token,
    bucket,
  }: {
    // path: string;
    // token: string;
    bucket: Bucket;
  }) => {
    try {
        const { data, error } = await supabaseClient.storage
          .from(bucket)
          .list('folder', {
            limit: 100,
            offset: 0,
            sortBy: { column: 'name', order: 'asc' },
          })
    
        if (error) throw error;
    
        if (!data) throw new Error("Data is empty!");
    
        // const fileUrl = supabaseClient.storage
        //   .from(bucket)
        //   .getPublicUrl(data?.path);
    
        return data;
      } catch (error) {
        throw error;
      }
} 
