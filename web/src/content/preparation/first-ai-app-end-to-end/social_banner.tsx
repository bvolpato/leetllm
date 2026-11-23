import React from "react";
import { Scene, getThemeColors, renderToPngWithOutput } from "vizmatic";
import type { ThemeMode } from "vizmatic";

export const width = 1200;
export const height = 630;
export const autoSize = false;
export const alt =
  "First AI App End-to-End. Train a ticket classifier, serve predictions through an API, add a browser, and save the results. Extend the working app with uncertainty routing and streaming.";
export function create(theme: ThemeMode = "dark") {
  const c = getThemeColors(
    theme,
    theme === "light" ? "engineering" : "default",
  );
  const accent = theme === "light" ? c.primary : c.primaryLight;
  const text = (
    s: string,
    left: number,
    top: number,
    size: number,
    color = c.textPrimary,
  ) =>
    React.createElement(
      "div",
      {
        key: `${s}-${top}`,
        style: {
          display: "flex",
          position: "absolute",
          left,
          top,
          fontFamily: "Inter",
          fontSize: size,
          fontWeight: 600,
          color,
        },
      },
      s,
    );
  const stage = (left: number, title: string, detail: string) =>
    React.createElement(
      "div",
      {
        key: title,
        style: {
          display: "flex",
          position: "absolute",
          left,
          top: 175,
          width: 243,
          height: 119,
          border: `2px solid ${accent}`,
          borderRadius: 8,
        },
      },
      text(title, 16, 22, 24),
      text(detail, 16, 69, 18, c.textSecondary),
    );
  return Scene({
    c,
    padding: 50,
    contentWidth: 1100,
    background: c.bg,
    children: React.createElement(
      "div",
      {
        style: {
          display: "flex",
          position: "relative",
          width: 1100,
          height: 530,
        },
      },
      text("First AI App End-to-End", 0, 0, 52),
      text(
        "Build a useful application, one working layer at a time.",
        0,
        79,
        28,
        c.textSecondary,
      ),
      stage(0, "Train a model", "Text → category scores"),
      text("→", 249, 211, 30, accent),
      stage(281, "Serve predictions", "POST /predict"),
      text("→", 530, 211, 30, accent),
      stage(562, "Add a browser", "Message → score bars"),
      text("→", 811, 211, 30, accent),
      stage(843, "Save the result", "SQLite history"),
      text("THEN DEVELOP THE APPLICATION", 0, 331, 21, accent),
      text("Uncertainty", 0, 382, 28),
      text("Know when to ask for help", 0, 427, 24, c.textSecondary),
      text("Streaming", 380, 382, 28),
      text("Show useful progress", 380, 427, 24, c.textSecondary),
      text("Evaluation", 746, 382, 28),
      text("Measure real predictions", 746, 427, 24, c.textSecondary),
      text(
        "Runnable Python, a browser interface, and explained results.",
        0,
        488,
        24,
        c.textSecondary,
      ),
      text("LeetLLM", 985, 488, 24, accent),
    ),
  });
}
export async function renderBanner(
  outputPath: string,
  theme: ThemeMode = "dark",
) {
  const output = await renderToPngWithOutput(create(theme), {
    width,
    height,
    outputPath,
    scale: 1,
    crop: false,
    watermark: false,
    background: "theme",
    theme,
  });
  if (output.pixelWidth !== width || output.pixelHeight !== height)
    throw new Error("Banner must be 1200x630");
  return output;
}
export default create();
