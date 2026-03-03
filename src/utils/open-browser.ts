/**
 * Safe browser opening utility
 *
 * Uses execFile instead of exec to prevent command injection.
 */

import { execFile } from "node:child_process";

// AGENT: I changed my mind oavout this functionality. We won't be  opening browser at all. In all such cases, just show user a link, and action should only copy this url ot the clipboard, with short "Copied" shown when it's done. We won't call open, powershell or xdg-open at all, anywhere in the project

/**
 * Safely open a URL in the default browser.
 * Uses execFile with arguments array to prevent shell injection.
 */
export function openBrowser(url: string): Promise<void> {
  return new Promise((resolve) => {
    // Validate URL format to prevent injection
    let validatedUrl: string;
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
        // Only allow http/https URLs
        resolve();
        return;
      }
      // Use the parsed URL's href to ensure it's properly formatted
      validatedUrl = parsed.href;
    } catch {
      // Invalid URL, don't open
      resolve();
      return;
    }

    const platform = process.platform;

    if (platform === "darwin") {
      // macOS: use 'open' command
      execFile("open", [validatedUrl], () => {
        resolve();
      });
    } else if (platform === "win32") {
      // Windows: use PowerShell's Start-Process for reliable URL handling
      // This avoids issues with special characters (&, spaces, etc.) that
      // affect cmd.exe's 'start' command
      execFile(
        "powershell.exe",
        ["-NoProfile", "-Command", `Start-Process "${validatedUrl}"`],
        () => {
          resolve();
        },
      );
    } else {
      // Linux/other: use xdg-open
      execFile("xdg-open", [validatedUrl], () => {
        resolve();
      });
    }
  });
}
