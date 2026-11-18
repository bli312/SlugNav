import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

import type { PhotoFile } from "./photos";

export const MAX_PHOTO_WIDTH = 1600;
export const JPEG_QUALITY = 0.8;

// Re-saves the chosen photo as a new, smaller JPEG. Only this copy is uploaded,
// never the original file, so data embedded in the original (such as where it
// was taken) is not uploaded. `width` may be 0 when the picker doesn't know it.
export async function preparePhoto(
  uri: string,
  width: number,
): Promise<PhotoFile> {
  const context = ImageManipulator.manipulate(uri);
  if (width > MAX_PHOTO_WIDTH) {
    context.resize({ width: MAX_PHOTO_WIDTH, height: null });
  }
  const image = await context.renderAsync();
  const saved = await image.saveAsync({
    format: SaveFormat.JPEG,
    compress: JPEG_QUALITY,
    base64: true,
  });
  if (!saved.base64) throw new Error("Could not prepare the photo.");
  return { data: base64ToArrayBuffer(saved.base64), contentType: "image/jpeg" };
}

// Base64 works the same on phones and the web, unlike reading a file by URI.
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes.buffer;
}
