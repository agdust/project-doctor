// .nvmrc checks
import { check as nvmrcExists } from "./exists/check.js";
import { check as nvmrcValidFormat } from "./valid-format/check.js";
import { check as nvmrcModernVersion } from "./modern-version/check.js";

// engines checks
import { check as enginesExists } from "./engines-exists/check.js";
import { check as enginesValid } from "./engines-valid/check.js";
import { check as enginesModern } from "./engines-modern/check.js";

export { loadContext } from "./context.js";

export const checks = [
  // engines checks (package.json)
  enginesExists,
  enginesValid,
  enginesModern,
  // .nvmrc checks
  nvmrcExists,
  nvmrcValidFormat,
  nvmrcModernVersion,
];
