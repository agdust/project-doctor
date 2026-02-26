import { check as dockerfileSmallBaseImage } from "./small-base-image/check.js";
import { check as devcontainer } from "./devcontainer/check.js";

export { loadContext } from "./context.js";

export const checks = [dockerfileSmallBaseImage, devcontainer];
