/**
 * Safe browser opening utility
 *
 * Uses execFile instead of exec to prevent command injection.
 */

import { execFile } from "node:child_process";

/**
 * Safely open a URL in the default browser.
 * Uses execFile with arguments array to prevent shell injection.
 */
export function openBrowser(url: string): Promise<void> {
  return new Promise((resolve) => {
    // Validate URL format to prevent injection
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
        // Only allow http/https URLs
        resolve();
        return;
      }
    } catch {
      // Invalid URL, don't open
      resolve();
      return;
    }

    const platform = process.platform;

    if (platform === "darwin") {
      // macOS: use 'open' command
      execFile("open", [url], () => {
        resolve();
      });
    } else if (platform === "win32") {
      // Windows: use 'cmd /c start' with empty title
      execFile("cmd", ["/c", "start", "", url], () => {
        resolve();
      });
    } else {
      // Linux/other: use xdg-open
      execFile("xdg-open", [url], () => {
        resolve();
      });
    }
  });
}
