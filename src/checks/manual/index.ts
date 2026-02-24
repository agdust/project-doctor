/**
 * Manual Checks
 *
 * Checks that require human verification — no auto-detection.
 */

import type { ManualCheck } from "../../types.js";
import { check as publishProvenance } from "./publish-provenance.js";

export const manualChecks: ManualCheck[] = [publishProvenance];
