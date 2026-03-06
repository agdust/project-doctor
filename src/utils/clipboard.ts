/**
 * Copy text to system clipboard.
 *
 * Uses platform-native commands (pbcopy / xclip / xsel / clip.exe).
 * Returns true on success, false if no clipboard tool is available.
 *
 * Uses spawn with ignored stdout/stderr so that forked background
 * processes (e.g. xclip's clipboard daemon) don't hold pipes open.
 */

import { spawn } from "node:child_process";

export function copyToClipboard(text: string): Promise<boolean> {
  const platform = process.platform;

  let cmd: string;
  let args: string[];
  if (platform === "darwin") {
    cmd = "pbcopy";
    args = [];
  } else if (platform === "win32") {
    cmd = "clip";
    args = [];
  } else {
    // Linux / FreeBSD — try xclip first, fall back to xsel
    cmd = "xclip";
    args = ["-selection", "clipboard"];
  }

  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      stdio: ["pipe", "ignore", "ignore"],
    });
    child.on("error", () => {
      resolve(false);
    });
    child.on("exit", (code) => {
      resolve(code === 0);
    });
    child.stdin.write(text);
    child.stdin.end();
  });
}
