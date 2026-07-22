/** Format elapsed milliseconds as `[HH:]MM:SS.mmm` (hours only when ≥ 1h). */
export function formatMs(msTotal: number) {
  const ms = msTotal % 1000;
  const secs = ((msTotal - ms) / 1000) % 60;
  const mins = (((msTotal - ms) / 1000 - secs) / 60) % 60;
  const hrs = (((msTotal - ms) / 1000 - secs) / 60 - mins) / 60;
  const hrsString = hrs > 0 ? `${hrs.toString().padStart(2, "0")}:` : "";

  return `${hrsString}${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}.${ms.toString().padStart(3, "0")}`;
}
