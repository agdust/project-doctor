import { check as exists } from "./exists/check.js";
import { check as strictEnabled } from "./strict-enabled/check.js";
import { check as hasOutdir } from "./has-outdir/check.js";
import { check as pathsValid } from "./paths-valid/check.js";

export { loadContext } from "./context.js";

export const checks = [exists, strictEnabled, hasOutdir, pathsValid];
