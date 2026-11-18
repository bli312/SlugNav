import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabase } from '@/lib/supabase';

export type UserUpload = {
  id: string | null;
  name: string;
  path: string;
  metadata: Record<string, unknown> | null;
  createdAt: string | null;
  updatedAt: string | null;
  lastAccessedAt: string | null;
};

async function getAuthenticatedUserId(
  supabase: SupabaseClient,
): Promise<string> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error) throw new Error("Could not verify your session.");
  if (!session?.user.id) throw new Error("Sign in to manage your uploads.");
  return session.user.id;
}

function getUserUploadPath(userId: string, path: string): string {
  const normalizedPath = path.replace(/^\/+|\/+$/g, "");
  const segments = normalizedPath.split("/");
  if (
    !normalizedPath ||
    segments.some((segment) => !segment || segment === "." || segment === "..") ||
    !normalizedPath.startsWith(`${userId}/`)
  ) {
    throw new Error("You can only manage your own uploads.");
  }
  return normalizedPath;
}

/**
 * Lists files in a user's private Storage folder. The optional folder is 
 * relative to the user's own folder; callers cannot use it to inspect another
 * user's files.
 */
export async function listUserUploads(
  bucketName: string,
  folder = "",
): Promise<UserUpload[]> {
  const supabase = getSupabase();
  const userId = await getAuthenticatedUserId(supabase);
  const normalizedFolder = folder.replace(/^\/+|\/+$/g, "");
  const path = normalizedFolder
  ? getUserUploadPath(userId, `${userId}/${normalizedFolder}`)
  : userId;
  const { data, error } = await supabase.storage.from(bucketName).list(path, {
    limit: 1000,
    sortBy: { column: "created_at", order: "desc" },
  });
  if (error) throw new Error("Could not load your uploads.");

  return (data ?? []).map((file) => ({
    id: file.id,
    name: file.name,
    path: `${path}/${file.name}`,
    metadata: file.metadata as Record<string, unknown> | null,
    createdAt: file.created_at,
    updatedAt: file.updated_at,
    lastAccessedAt: file.last_accessed_at,
  }));
  }

  /**
   * Deletes one of the signed-in user's files. Storage RLS remains the final
   * authorization boundary; the path check prevents accidental cross-user use.
   */
  export async function deleteUserUpload(
    bucketName: string,
    path: string,
  ): Promise<void> {
    const supabase = getSupabase();
    const userId = await getAuthenticatedUserId(supabase);
    const ownedPath = getUserUploadPath(userId, path);
    const { error } = await supabase.storage
    .from(bucketName)
    .remove([ownedPath]);
    if (error) throw new Error("Could not delete the uploaad.");
  }
