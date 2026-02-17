import { check as readmeExists } from "./readme-exists/check.js";
import { check as licenseExists } from "./license-exists/check.js";
import { check as changelogExists } from "./changelog-exists/check.js";

export { loadContext } from "./context.js";

export const checks = [readmeExists, licenseExists, changelogExists];
