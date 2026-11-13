import type { SupabaseClient } from "@supabase/supabase-js";

export const PLACE_PHOTOS_BUCKET = "place-photos";
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const SIGNED_URL_SECONDS = 3600;

// The photo types the bucket accepts, and the file extension for each.
const photoExtensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export type PhotoFile = { data: ArrayBuffer; contentType: string };

export type PlacePhoto = {
  id: number;
  placeId: number;
  userId: string;
  storagePath: string;
  createdAt: string;
  url: string;
};

type PhotoRow = {
  id: number;
  place_id: number;
  user_id: string;
  storage_path: string;
  created_at: string;
};

const photoColumns = "id, place_id, user_id, storage_path, created_at";

const toPhoto = (row: PhotoRow, url: string): PlacePhoto => ({
  id: row.id,
  placeId: row.place_id,
  userId: row.user_id,
  storagePath: row.storage_path,
  createdAt: row.created_at,
  url,
});

// Only keeps file names unique within a user's folder; not security-sensitive.
function randomId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
  );
}

// Uploads the file to <user id>/<place id>/<random id>.<extension>, then saves
// its row. If the row can't be saved, the file is removed so none is left behind.
export async function uploadPlacePhoto(
  client: SupabaseClient,
  placeId: number,
  photo: PhotoFile,
): Promise<PlacePhoto> {
  const {
    data: { session },
  } = await client.auth.getSession();
  const userId = session?.user.id;
  if (!userId) throw new Error("Sign in to add photos.");
  const extension = photoExtensions[photo.contentType];
  if (!extension) throw new Error("Use a JPEG, PNG, or WebP photo.");
  if (photo.data.byteLength > MAX_PHOTO_BYTES)
    throw new Error("Photos must be 5 MB or smaller.");

  const storagePath = `${userId}/${placeId}/${randomId()}.${extension}`;
  const bucket = client.storage.from(PLACE_PHOTOS_BUCKET);
  const { error: uploadError } = await bucket.upload(storagePath, photo.data, {
    contentType: photo.contentType,
    upsert: false,
  });
  if (uploadError)
    throw new Error("Could not upload the photo. Please try again.");

  const { data, error } = await client
    .from("place_photos")
    .insert({ place_id: placeId, user_id: userId, storage_path: storagePath })
    .select(photoColumns)
    .single();
  if (error || !data) {
    await bucket.remove([storagePath]);
    throw new Error("Could not save the photo. Please try again.");
  }
  const { data: signed } = await bucket.createSignedUrl(
    storagePath,
    SIGNED_URL_SECONDS,
  );
  return toPhoto(data as PhotoRow, signed?.signedUrl ?? "");
}

// A place's photos, newest first, each with a signed URL valid for one hour.
export async function getPlacePhotos(
  client: SupabaseClient,
  placeId: number,
): Promise<PlacePhoto[]> {
  const { data, error } = await client
    .from("place_photos")
    .select(photoColumns)
    .eq("place_id", placeId)
    .order("created_at", { ascending: false });
  if (error) throw new Error("Could not load photos.");
  const rows = (data ?? []) as PhotoRow[];
  if (!rows.length) return [];

  const { data: signed, error: signError } = await client.storage
    .from(PLACE_PHOTOS_BUCKET)
    .createSignedUrls(
      rows.map((row) => row.storage_path),
      SIGNED_URL_SECONDS,
    );
  if (signError) throw new Error("Could not load photos.");
  const urls = new Map(
    (signed ?? []).map((item) => [item.path, item.signedUrl]),
  );
  return rows.map((row) => toPhoto(row, urls.get(row.storage_path) ?? ""));
}

// Deletes the row first: access rules only let the uploader delete it, so if
// no row was deleted the file is left alone.
export async function deletePlacePhoto(
  client: SupabaseClient,
  photo: Pick<PlacePhoto, "id" | "storagePath">,
): Promise<void> {
  const { data, error } = await client
    .from("place_photos")
    .delete()
    .eq("id", photo.id)
    .select("id");
  if (error || !data?.length) throw new Error("Could not delete the photo.");
  const { error: removeError } = await client.storage
    .from(PLACE_PHOTOS_BUCKET)
    .remove([photo.storagePath]);
  if (removeError) throw new Error("Could not delete the photo.");
}
