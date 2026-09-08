export const MAX_POST_FILE_BYTES = 50 * 1024 * 1024;
export const MAX_POST_IMAGE_EDGE = 1920;
/** Instagram/Facebook feed: portrait no taller than 4:5, landscape no wider than 1.91:1 */
export const FEED_MIN_ASPECT = 4 / 5;
export const FEED_MAX_ASPECT = 1.91;

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10 * 1024 ? 1 : 0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0)} MB`;
}

export function clampFeedAspect(width: number, height: number) {
  if (!width || !height) return 1;
  return Math.min(FEED_MAX_ASPECT, Math.max(FEED_MIN_ASPECT, width / height));
}

export type PixelCrop = { x: number; y: number; width: number; height: number };

export function centerCropForFeed(width: number, height: number): PixelCrop {
  const ratio = width / height;
  if (ratio < FEED_MIN_ASPECT) {
    const cropH = width / FEED_MIN_ASPECT;
    return { x: 0, y: (height - cropH) / 2, width, height: cropH };
  }
  if (ratio > FEED_MAX_ASPECT) {
    const cropW = height * FEED_MAX_ASPECT;
    return { x: (width - cropW) / 2, y: 0, width: cropW, height };
  }
  return { x: 0, y: 0, width, height };
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Unable to read image"));
    };
    image.src = url;
  });
}

export async function preparePostFile(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") {
    return file;
  }

  const image = await loadImage(file);
  const crop = centerCropForFeed(image.naturalWidth || image.width, image.naturalHeight || image.height);
  const needsCrop = crop.width < image.width - 1 || crop.height < image.height - 1;
  const longest = Math.max(crop.width, crop.height);
  const tooLarge = longest > MAX_POST_IMAGE_EDGE || file.size > 1.5 * 1024 * 1024;

  if (!needsCrop && !tooLarge) return file;
  return cropImageToFile(image, crop, file.name);
}

export async function preparePostFiles(files: File[]) {
  const prepared: File[] = [];
  for (const file of files.slice(0, 6)) {
    if (file.size > MAX_POST_FILE_BYTES) {
      throw new Error(`${file.name} is larger than 50MB`);
    }
    prepared.push(await preparePostFile(file));
  }
  return prepared;
}

export function loadImageFromSrc(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    if (!src.startsWith("blob:")) image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to read image"));
    image.src = src;
  });
}

export async function cropImageToFile(
  image: HTMLImageElement,
  crop: PixelCrop,
  fileName = "photo.jpg",
) {
  const sx = Math.max(0, Math.round(crop.x));
  const sy = Math.max(0, Math.round(crop.y));
  const sw = Math.max(1, Math.min(Math.round(crop.width), image.naturalWidth - sx));
  const sh = Math.max(1, Math.min(Math.round(crop.height), image.naturalHeight - sy));

  const longest = Math.max(sw, sh);
  const scale = longest > MAX_POST_IMAGE_EDGE ? MAX_POST_IMAGE_EDGE / longest : 1;
  const width = Math.max(1, Math.round(sw * scale));
  const height = Math.max(1, Math.round(sh * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Unable to crop image");
  context.drawImage(image, sx, sy, sw, sh, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", 0.9);
  });
  if (!blob) throw new Error("Unable to crop image");

  const name = fileName.replace(/\.[^.]+$/, "") + ".jpg";
  return new File([blob], name, { type: "image/jpeg", lastModified: Date.now() });
}
