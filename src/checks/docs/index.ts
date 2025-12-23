import { check as readmeExists } from "./readme-exists/check.js";
import { check as readmeHasTitle } from "./readme-has-title/check.js";
import { check as readmeHasInstallSection } from "./readme-has-install-section/check.js";
import { check as readmeHasUsageSection } from "./readme-has-usage-section/check.js";
import { check as licenseExists } from "./license-exists/check.js";
import { check as changelogExists } from "./changelog-exists/check.js";

export { loadContext } from "./context.js";

export const checks = [
  readmeExists,
  readmeHasTitle,
  readmeHasInstallSection,
  readmeHasUsageSection,
  licenseExists,
  changelogExists,
];
