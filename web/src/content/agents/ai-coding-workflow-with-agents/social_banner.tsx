import React from "react";
import {
  Column,
  Flow,
  Row,
  Scene,
  TextLabel,
  getThemeColors,
  renderToPngWithOutput,
  withDensity,
} from "vizmatic";
import type { ThemeMode } from "vizmatic";

export const width = 1200;
export const height = 630;
export const autoSize = false;
export const alt =
  "AI Coding Workflow with Agents. Three connected engineering stages: rank candidate files via an AST repository map, isolate trials inside a git worktree for red-to-green repair, and require diff-first human review before merging.";

export function create(theme: ThemeMode = "dark"): React.ReactElement {
  const c = withDensity(
    getThemeColors(theme, theme === "light" ? "engineering" : "default"),
    1.75,
  );
  return Scene({
    c,
    background: c.bg,
    padding: 44,
    gap: 32,
    justify: "space-between",
    contentWidth: 1112,
    title: "AI Coding Workflow with Agents",
    subtitle:
      "Localize with AST symbol maps, isolate trials in git worktrees, and loop on real tracebacks.",
    children: Column({
      gap: 40,
      width: 1112,
      children: [
        Flow({
          c,
          connectorLength: 26,
          stages: [
            {
              eyebrow: "1. LOCALIZE",
              title: "AST Repo Map",
              subtitle: "PageRank slices target symbols",
              tone: "warm",
              width: 300,
            },
            {
              eyebrow: "2. REPAIR LOOP",
              title: "Git Worktree + Pytest",
              subtitle: "Red-to-green on real tracebacks",
              tone: "blue",
              width: 300,
            },
            {
              eyebrow: "3. INTEGRATE",
              title: "Diff + Current CI",
              subtitle: "Human merge after fresh checks",
              tone: "green",
              width: 300,
            },
          ],
        }),
        Row({
          width: 1112,
          justify: "space-between",
          align: "center",
          children: [
            TextLabel({
              c,
              text: "Fail-first reproduction and strict diff scope keep trial patches inspectable.",
              fontSize: 23,
              color: c.textSecondary,
            }),
            TextLabel({
              c,
              text: "LeetLLM",
              fontSize: 26,
              color: c.primaryLight,
              fontWeight: 700,
            }),
          ],
        }),
      ],
    }),
  });
}

// From web/: pnpm exec tsx -e "import { renderBanner } from './src/content/agents/ai-coding-workflow-with-agents/social_banner.tsx'; renderBanner('./src/content/agents/ai-coding-workflow-with-agents/social_banner.png')"
export async function renderBanner(
  outputPath: string,
  theme: ThemeMode = "dark",
) {
  const result = await renderToPngWithOutput(create(theme), {
    width,
    height,
    outputPath,
    scale: 1,
    crop: false,
    watermark: false,
    background: "theme",
    theme,
  });
  if (result.pixelWidth !== width || result.pixelHeight !== height) {
    throw new Error(
      `Unexpected banner size: ${result.pixelWidth}x${result.pixelHeight}`,
    );
  }
  return result;
}

export default create("dark");
