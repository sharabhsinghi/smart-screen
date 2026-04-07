import { Camera } from "@capacitor/camera";
import { Capacitor } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";

import type { SlideshowImage } from "@/types";

const SLIDESHOW_IMAGES_STORAGE_KEY = "smart-screen:slideshow-images:v1";

const DEFAULT_REMOTE_SLIDESHOW_URLS = [
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80",
  "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=1920&q=80",
  "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=1920&q=80",
  "https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=1920&q=80",
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&q=80",
];

function createId() {
  return `slideshow-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getImageLabel(src: string, label?: string) {
  if (label) {
    return label;
  }

  try {
    const url = new URL(src);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return "Custom image";
  }
}

function createStoredImageSrc(fileUri: string) {
  return Capacitor.convertFileSrc(fileUri);
}

function toStoredImageRecord(image: SlideshowImage) {
  return {
    id: image.id,
    label: image.label,
    origin: image.origin,
    src: image.origin === "device" ? undefined : image.src,
    filePath: image.filePath,
  };
}

async function fromStoredImageRecord(record: {
  id: string;
  label: string;
  origin: SlideshowImage["origin"];
  src?: string;
  filePath?: string;
}) {
  if (record.origin !== "device" || !record.filePath) {
    if (!record.src) {
      return null;
    }

    return {
      id: record.id,
      label: record.label,
      origin: record.origin,
      src: record.src,
    } satisfies SlideshowImage;
  }

  try {
    const uriResult = await Filesystem.getUri({
      directory: Directory.Data,
      path: record.filePath,
    });

    return {
      id: record.id,
      label: record.label,
      origin: "device",
      filePath: record.filePath,
      src: createStoredImageSrc(uriResult.uri),
    } satisfies SlideshowImage;
  } catch {
    return null;
  }
}

function blobToBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Unable to read selected image."));
        return;
      }

      const [, base64 = ""] = result.split(",", 2);
      resolve(base64);
    };

    reader.onerror = () => {
      reject(reader.error ?? new Error("Unable to read selected image."));
    };

    reader.readAsDataURL(blob);
  });
}

async function importPhotoFromPicker(
  photo: { webPath?: string; format?: string },
  index: number
) {
  if (!photo.webPath) {
    return null;
  }

  const response = await fetch(photo.webPath);
  if (!response.ok) {
    throw new Error("Unable to import the selected image.");
  }

  const blob = await response.blob();
  const extension = photo.format || blob.type.split("/")[1] || "jpeg";
  const filePath = `slideshows/${Date.now()}-${index}.${extension}`;
  const data = await blobToBase64(blob);
  const writeResult = await Filesystem.writeFile({
    directory: Directory.Data,
    path: filePath,
    data,
    recursive: true,
  });

  return {
    id: createId(),
    label: `Selected photo ${index + 1}`,
    origin: "device",
    filePath,
    src: createStoredImageSrc(writeResult.uri),
  } satisfies SlideshowImage;
}

export function createRemoteSlideshowImage(src: string, label?: string): SlideshowImage {
  return {
    id: createId(),
    src,
    label: getImageLabel(src, label),
    origin: label ? "preset" : "url",
  };
}

export const DEFAULT_SLIDESHOW_IMAGES = DEFAULT_REMOTE_SLIDESHOW_URLS.map((src) =>
  createRemoteSlideshowImage(src, "Nature")
);

export const PRESET_ALBUMS: { label: string; images: SlideshowImage[] }[] = [
  {
    label: "Nature",
    images: DEFAULT_REMOTE_SLIDESHOW_URLS.map((src) =>
      createRemoteSlideshowImage(src, "Nature")
    ),
  },
  {
    label: "Cities",
    images: [
      "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1920&q=80",
      "https://images.unsplash.com/photo-1514565131-fce0801e6175?w=1920&q=80",
      "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1920&q=80",
      "https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=1920&q=80",
      "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=1920&q=80",
    ].map((src) => createRemoteSlideshowImage(src, "Cities")),
  },
  {
    label: "Abstract",
    images: [
      "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=1920&q=80",
      "https://images.unsplash.com/photo-1567359781514-81173b801d3b?w=1920&q=80",
      "https://images.unsplash.com/photo-1550684376-efcbd6e3f031?w=1920&q=80",
      "https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=1920&q=80",
      "https://images.unsplash.com/photo-1560015534-cee980ba7e13?w=1920&q=80",
    ].map((src) => createRemoteSlideshowImage(src, "Abstract")),
  },
  {
    label: "Space",
    images: [
      "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1920&q=80",
      "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1920&q=80",
      "https://images.unsplash.com/photo-1543722530-d2c3201371e7?w=1920&q=80",
      "https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=1920&q=80",
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80",
    ].map((src) => createRemoteSlideshowImage(src, "Space")),
  },
];

export function isAndroidNativePlatform() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
}

export async function pickAndImportSlideshowImages(limit = 25): Promise<SlideshowImage[]> {
  const result = await Camera.pickImages({
    limit,
    quality: 90,
  });

  const imported = await Promise.all(
    result.photos.map((photo, index) => importPhotoFromPicker(photo, index))
  );

  const importedImages: SlideshowImage[] = [];
  for (const image of imported) {
    if (image) {
      importedImages.push(image);
    }
  }

  return importedImages;
}

export function persistSlideshowImages(images: SlideshowImage[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    SLIDESHOW_IMAGES_STORAGE_KEY,
    JSON.stringify(images.map(toStoredImageRecord))
  );
}

export async function loadPersistedSlideshowImages(): Promise<SlideshowImage[] | null> {
  if (typeof window === "undefined") {
    return null;
  }

  const rawValue = window.localStorage.getItem(SLIDESHOW_IMAGES_STORAGE_KEY);
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as Array<{
      id: string;
      label: string;
      origin: SlideshowImage["origin"];
      src?: string;
      filePath?: string;
    }>;

    const hydrated = await Promise.all(parsed.map(fromStoredImageRecord));
    const hydratedImages: SlideshowImage[] = [];
    for (const image of hydrated) {
      if (image) {
        hydratedImages.push(image);
      }
    }

    return hydratedImages;
  } catch {
    return null;
  }
}

export async function removeStoredSlideshowImages(images: SlideshowImage[]) {
  const deviceImages = images.filter(
    (image): image is SlideshowImage & { filePath: string } =>
      image.origin === "device" && Boolean(image.filePath)
  );

  await Promise.allSettled(
    deviceImages.map((image) =>
      Filesystem.deleteFile({
        directory: Directory.Data,
        path: image.filePath,
      })
    )
  );
}