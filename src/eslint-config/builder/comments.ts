import { getRuleByName } from "../../eslint-db/index.js";

const MAX_COMMENT_LENGTH = 70;

export function generateComment(ruleName: string): string {
  const rule = getRuleByName(ruleName);
  if (!rule?.description) {
    return "";
  }

  const desc = rule.description;
  if (desc.length <= MAX_COMMENT_LENGTH) {
    return desc;
  }

  // Truncate at word boundary
  const truncated = desc.substring(0, MAX_COMMENT_LENGTH - 3);
  const lastSpace = truncated.lastIndexOf(" ");
  if (lastSpace > MAX_COMMENT_LENGTH - 20) {
    return truncated.substring(0, lastSpace) + "...";
  }
  return truncated + "...";
}
