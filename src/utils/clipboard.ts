/**
 * Copy text to system clipboard.
 *
 * Uses platform-native commands (pbcopy / xclip / xsel / clip.exe).
 * Returns true on success, false if no clipboard tool is available.
 */

import { exec } from "node:child_process";

export function copyToClipboard(text: string): Promise<boolean> {
  const platform = process.platform;

  let cmd: string;
  if (platform === "darwin") {
    cmd = "pbcopy";
  } else if (platform === "win32") {
    cmd = "clip";
  } else {
    // Linux / FreeBSD — try xclip first, fall back to xsel
    cmd = "xclip -selection clipboard";
  }

  return new Promise((resolve) => {
    const child = exec(cmd, (error) => {
      resolve(error === null);
    });
    child.stdin?.write(text);
    child.stdin?.end();
  });
}
