/**
 * Format a date consistently across server and client to prevent hydration errors.
 * Uses a manual approach that doesn't depend on locale settings.
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);

  // Manual formatting to ensure consistency between server and client
  const day = date.getDate();
  const month = date.getMonth() + 1; // getMonth() is 0-indexed
  const year = date.getFullYear();

  // Format as DD.MM.YYYY (Georgian style)
  return `${day}.${month}.${year}`;
}

/**
 * Format a date with time
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);

  // Manual formatting
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");

  // Format as DD.MM.YYYY HH:MM
  return `${day}.${month}.${year} ${hours}:${minutes}`;
}
