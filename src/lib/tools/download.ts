export function downloadDataUrl(filename: string, dataUrl: string): void {
  triggerDownload(filename, dataUrl);
}

export function downloadTextFile(
  filename: string,
  contents: string,
  mimeType = "text/plain;charset=utf-8",
): void {
  const blob = new Blob([contents], { type: mimeType });
  const url = URL.createObjectURL(blob);

  triggerDownload(filename, url);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadUrl(filename: string, url: string): void {
  triggerDownload(filename, url);
}

function triggerDownload(filename: string, url: string): void {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
