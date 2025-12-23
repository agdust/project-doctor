import { check as exists } from "./exists/check.js";
import { check as validFormat } from "./valid-format/check.js";
import { check as modernVersion } from "./modern-version/check.js";

export { loadContext } from "./context.js";

export const checks = [exists, validFormat, modernVersion];
