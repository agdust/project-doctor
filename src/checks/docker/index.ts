import { check as dockerfileExists } from "./dockerfile-exists/check.js";
import { check as dockerfileSmallBaseImage } from "./dockerfile-small-base-image/check.js";

export { loadContext } from "./context.js";

export const checks = [
  dockerfileExists,
  dockerfileSmallBaseImage,
];
