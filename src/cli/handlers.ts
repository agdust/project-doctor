/**
 * CLI Command Handlers
 */

import { parseArgs } from "node:util";
import path from "node:path";
import { runConfigShow, runConfigSetProjectType, runConfigShowJson } from "../commands/config.js";
import { runDisableCheck, runDisableTag, runDisableGroup } from "../commands/disable.js";
import { runEnableCheck, runEnableTag, runEnableGroup } from "../commands/enable.js";
import { runMute, runUnmute } from "../commands/mute.js";
import { runList } from "../commands/list.js";
import { runInfo } from "../commands/info.js";
import { runFixList, runFixAll, runFixOne } from "../commands/fix.js";
import { runEslintInit } from "../eslint-config/commands/init.js";
import { runEslintShow } from "../eslint-config/commands/show.js";
import { runEslintAdd } from "../eslint-config/commands/add.js";
import { runEslintDiff } from "../eslint-config/commands/diff.js";
import { runMainWizard } from "../eslint-config/commands/main.js";
import { red } from "../utils/colors.js";
import { getProjectPath, isPath } from "./utils.js";
import { printEslintHelp, printFixHelp } from "./help.js";

type ConfigTargetType = "check" | "tag" | "group";

/**
 * Safely parse a string to an integer.
 * Returns undefined if the string is undefined or not a valid positive integer.
 */
function parsePositiveInt(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return undefined;
  }
  return parsed;
}

function parseConfigTargetArgs(args: string[]): {
  type: ConfigTargetType;
  name: string;
  projectPath: string;
} {
  const type = args[0];
  if (!type || !["check", "tag", "group"].includes(type)) {
    console.error(`${red("Error:")} Missing or invalid type. Use 'check', 'tag', or 'group'.`);
    process.exit(2);
  }
  args.shift();

  const name = args[0];
  if (!name || name.startsWith("-")) {
    console.error(`${red("Error:")} Missing ${type} name.`);
    process.exit(2);
  }
  args.shift();

  return { type: type as ConfigTargetType, name, projectPath: getProjectPath(args) };
}

export async function handleConfigCommand(args: string[]): Promise<void> {
  const firstArg = args[0];
  if (firstArg === "set") {
    const settingName = args[1];
    const settingValue = args[2];

    if (settingName === "project-type") {
      if (!settingValue) {
        console.error(`${red("Error:")} Missing project type. Use 'js' or 'generic'.`);
        process.exit(2);
      }
      const projectPath = getProjectPath(args.slice(3));
      await runConfigSetProjectType(projectPath, settingValue);
      return;
    }

    console.error(
      `${red("Error:")} Unknown config setting "${settingName}". Use 'project-type'.`,
    );
    process.exit(2);
  }

  // Check for --format json
  const formatIdx = args.indexOf("--format");
  let format = "text";
  if (formatIdx !== -1 && args[formatIdx + 1]) {
    format = args[formatIdx + 1];
    args.splice(formatIdx, 2);
  }

  const projectPath = getProjectPath(args);

  await (format === "json" ? runConfigShowJson(projectPath) : runConfigShow(projectPath));
}

export async function handleDisableCommand(args: string[]): Promise<void> {
  const { type, name, projectPath } = parseConfigTargetArgs(args);

  switch (type) {
    case "check": {
      await runDisableCheck(projectPath, name);
      break;
    }
    case "tag": {
      await runDisableTag(projectPath, name);
      break;
    }
    case "group": {
      await runDisableGroup(projectPath, name);
      break;
    }
  }
}

export async function handleEnableCommand(args: string[]): Promise<void> {
  const { type, name, projectPath } = parseConfigTargetArgs(args);

  switch (type) {
    case "check": {
      await runEnableCheck(projectPath, name);
      break;
    }
    case "tag": {
      await runEnableTag(projectPath, name);
      break;
    }
    case "group": {
      await runEnableGroup(projectPath, name);
      break;
    }
  }
}

export async function handleMuteCommand(args: string[]): Promise<void> {
  const checkName = args[0];
  if (!checkName || checkName.startsWith("-")) {
    console.error(`${red("Error:")} Missing check name.`);
    process.exit(2);
  }
  args.shift();

  const { values, positionals } = parseArgs({
    args,
    options: {
      weeks: { type: "string" },
      months: { type: "string" },
      until: { type: "string" },
    },
    allowPositionals: true,
  });

  const projectPath = getProjectPath(positionals);

  // Validate numeric arguments
  const weeks = parsePositiveInt(values.weeks);
  const months = parsePositiveInt(values.months);

  // Check if invalid values were provided
  if (values.weeks && weeks === undefined) {
    console.error(`${red("Error:")} Invalid weeks value "${values.weeks}". Must be a positive number.`);
    process.exit(2);
  }
  if (values.months && months === undefined) {
    console.error(`${red("Error:")} Invalid months value "${values.months}". Must be a positive number.`);
    process.exit(2);
  }

  await runMute(projectPath, checkName, {
    weeks,
    months,
    until: values.until,
  });
}

export async function handleUnmuteCommand(args: string[]): Promise<void> {
  const checkName = args[0];
  if (!checkName || checkName.startsWith("-")) {
    console.error(`${red("Error:")} Missing check name.`);
    process.exit(2);
  }
  args.shift();

  const projectPath = getProjectPath(args);
  await runUnmute(projectPath, checkName);
}

export async function handleListCommand(args: string[]): Promise<void> {
  const { values, positionals } = parseArgs({
    args,
    options: {
      group: { type: "string", short: "g", multiple: true },
      tag: { type: "string", short: "t", multiple: true },
      status: { type: "string" },
      format: { type: "string" },
    },
    allowPositionals: true,
  });

  const projectPath = getProjectPath(positionals);

  await runList(projectPath, {
    groups: values.group,
    tags: values.tag,
    status: values.status as "all" | "enabled" | "disabled" | "muted" | undefined,
    format: values.format as "table" | "json" | "names" | undefined,
  });
}

export async function handleInfoCommand(args: string[]): Promise<void> {
  const checkName = args[0];
  if (!checkName || checkName.startsWith("-")) {
    console.error(`${red("Error:")} Missing check name.`);
    process.exit(2);
  }
  args.shift();

  const { values, positionals } = parseArgs({
    args,
    options: {
      format: { type: "string" },
    },
    allowPositionals: true,
  });

  const projectPath = getProjectPath(positionals);

  await runInfo(projectPath, checkName, {
    format: values.format as "text" | "json" | undefined,
  });
}

export async function handleFixCommand(args: string[]): Promise<void> {
  const firstArg = args[0];

  // Handle help
  if (firstArg === "--help" || firstArg === "-h") {
    printFixHelp();
    return;
  }

  // If no arg or first arg is a path, list fixable issues
  if (!firstArg || isPath(firstArg)) {
    const projectPath = getProjectPath(args);
    await runFixList(projectPath, {});
    return;
  }

  // Handle "fix all" command
  if (firstArg === "all") {
    args.shift(); // remove "all"

    const { values, positionals } = parseArgs({
      args,
      options: {
        group: { type: "string", short: "g", multiple: true },
        tag: { type: "string", short: "t", multiple: true },
        pick: { type: "string" },
      },
      allowPositionals: true,
    });

    const projectPath = getProjectPath(positionals);
    const exitCode = await runFixAll(projectPath, {
      groups: values.group,
      tags: values.tag,
      pick: values.pick,
    });
    process.exit(exitCode);
  }

  // Otherwise, first arg is a check name
  const checkName = firstArg;
  args.shift();

  const { values, positionals } = parseArgs({
    args,
    options: {
      pick: { type: "string" },
    },
    allowPositionals: true,
  });

  const projectPath = getProjectPath(positionals);
  const exitCode = await runFixOne(projectPath, checkName, {
    pick: values.pick,
  });
  process.exit(exitCode);
}

export async function handleEslintCommand(args: string[]): Promise<void> {
  const firstArg = args[0];

  // Determine subcommand and project path
  let subcommand: string | undefined;
  let projectPath: string;

  if (isPath(firstArg)) {
    // First arg is a path, no subcommand - launch wizard
    subcommand = undefined;
    projectPath = path.resolve(firstArg);
  } else {
    subcommand = firstArg;
    args.shift(); // remove subcommand
    projectPath = path.resolve(args.find((a) => !a.startsWith("-")) ?? process.cwd());
  }

  const hasWizard = args.includes("--wizard") || args.includes("-w");
  const hasDryRun = args.includes("--dry-run");
  const hasForce = args.includes("--force");
  const hasPresetsFlag = args.includes("--presets");
  const hasRulesFlag = args.includes("--rules");

  const presetsArg = args.find((a, i) => args[i - 1] === "--presets");

  switch (subcommand) {
    case "init": {
      await runEslintInit(projectPath, {
        wizard: hasWizard,
        presets: presetsArg,
        dryRun: hasDryRun,
        force: hasForce,
      });
      return;
    }
    case "add": {
      await runEslintAdd(projectPath, args[0] ?? "");
      return;
    }
    case "show": {
      await runEslintShow(projectPath, {
        presets: hasPresetsFlag,
        rules: hasRulesFlag,
      });
      return;
    }
    case "diff": {
      await runEslintDiff(projectPath, { presets: presetsArg });
      return;
    }
    case "help":
    case "-h":
    case "--help": {
      printEslintHelp();
      return;
    }
    case undefined:
    case "": {
      // No subcommand - launch interactive wizard
      await runMainWizard(projectPath);
      return;
    }
    default: {
      console.log(red(`Unknown eslint subcommand: ${subcommand}`));
      console.log();
      printEslintHelp();
      return;
    }
  }
}
