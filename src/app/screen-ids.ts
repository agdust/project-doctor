/**
 * Screen ID Constants
 *
 * All screen IDs used in the project-doctor app.
 * Prevents typos and enables IDE autocomplete.
 */

export const SCREEN = {
  home: "home",
  issues: "issues",
  overview: "overview",
  overviewDetail: "overview-detail",
  issueDetail: "issue-detail",
  fixOptions: "fix-options",
  why: "why",
  summary: "summary",
  scanning: "scanning",
  config: "config",
  projectType: "project-type",
  aboutConfig: "about-config",
  categories: "categories",
  about: "about",
  manualChecklist: "manual-checklist",
  manualCheckDetail: "manual-check-detail",
  manualDone: "manual-done",
  manualMuted: "manual-muted",
  manualDisabled: "manual-disabled",
} as const;
