import previews from "../data/image-previews.json";

interface PreviewImage {
  src: string;
  poster?: string;
  width?: number;
  height?: number;
  fingerprint?: string;
}

/** Homepage previews keep full-resolution artwork on its project page. */
export function getPreviewImage(url: string): PreviewImage {
  const preview = (previews as Record<string, PreviewImage>)[url] || { src: url };
  // SVG previews retain their filenames, so version them when their contents change.
  if (url.endsWith('.svg') && preview.fingerprint) {
    return { ...preview, src: `${preview.src}?v=${preview.fingerprint.slice(0, 12)}` };
  }
  return preview;
}

/**
 * Helper to resolve the generated low-resolution proxy image URL
 * from an original project image URL.
 */
export function getProxyUrl(url: string): string {
  if (!url) return "";
  
  // If it's a remote URL, a video, or already a proxy, return as-is
  if (
    url.startsWith("http") ||
    url.endsWith(".mp4") ||
    url.includes("-proxy")
  ) {
    return url;
  }

  const lastDot = url.lastIndexOf(".");
  if (lastDot === -1) return url;

  const base = url.substring(0, lastDot);
  const ext = url.substring(lastDot).toLowerCase();
  const originalExt = url.substring(lastDot);

  // Only proxy standard image extensions
  const imageExtensions = [".png", ".jpg", ".jpeg", ".webp"];
  if (!imageExtensions.includes(ext)) {
    return url;
  }

  // In our Node generator, if original extension was uppercase (like .PNG):
  // baseName became base + '.' + originalExt, and proxy was named baseName + '-proxy' + ext
  if (originalExt !== ext) {
    return `${base}${originalExt}-proxy${ext}`;
  }

  return `${base}-proxy${ext}`;
}
