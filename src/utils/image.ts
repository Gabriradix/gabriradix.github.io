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

  // In our Node generator, if original extension was uppercase (like .PNG):
  // baseName became base + '.' + originalExt, and proxy was named baseName + '-proxy' + ext
  if (originalExt !== ext) {
    return `${base}${originalExt}-proxy${ext}`;
  }

  return `${base}-proxy${ext}`;
}
