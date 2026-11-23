import { readFileSync } from "fs"
import { join } from "path"

const FONT_DIR = join(process.cwd(), "tools", "book", "fonts")

/** Files listed here feed the build fingerprint as well as the stylesheet. */
const FACES: Array<{ family: string; file: string; weight: number; style: "normal" | "italic" }> = [
  { family: "Source Serif 4", file: "SourceSerif4-Regular.ttf", weight: 400, style: "normal" },
  { family: "Source Serif 4", file: "SourceSerif4-Italic.ttf", weight: 400, style: "italic" },
  { family: "Source Serif 4", file: "SourceSerif4-Semibold.ttf", weight: 600, style: "normal" },
  { family: "Source Serif 4", file: "SourceSerif4-SemiboldItalic.ttf", weight: 600, style: "italic" },
  { family: "Source Serif 4 Display", file: "SourceSerif4Display-Light.ttf", weight: 300, style: "normal" },
  { family: "Source Serif 4 Display", file: "SourceSerif4Display-LightItalic.ttf", weight: 300, style: "italic" },
  { family: "Source Serif 4 Display", file: "SourceSerif4Display-Regular.ttf", weight: 400, style: "normal" },
  { family: "Inter", file: "Inter-Regular.ttf", weight: 400, style: "normal" },
  { family: "Inter", file: "Inter-SemiBold.ttf", weight: 600, style: "normal" },
  { family: "Inter", file: "Inter-Bold.ttf", weight: 700, style: "normal" },
  { family: "JetBrains Mono", file: "JetBrainsMono-Regular.ttf", weight: 400, style: "normal" },
  { family: "Book Fallback Symbols", file: "BookFallbackSymbols-Regular.ttf", weight: 400, style: "normal" },
  { family: "Book Fallback CJK", file: "BookFallbackCJK-Regular.ttf", weight: 400, style: "normal" },
  { family: "Book Fallback Emoji", file: "BookFallbackEmoji-Regular.ttf", weight: 400, style: "normal" },
]

/** Bundled faces that hold characters the main fonts lack. They end every font stack, before the generic family. */
export const FONT_FALLBACKS = '"Book Fallback Symbols", "Book Fallback CJK", "Book Fallback Emoji"'

export function bookFontPaths(): string[] {
  return FACES.map((face) => join(FONT_DIR, face.file))
}

let cached: string | undefined

/** Embedded faces, so a build looks the same on every machine. */
export function bookFontCss(): string {
  cached ??= FACES.map((face) => {
    const data = readFileSync(join(FONT_DIR, face.file)).toString("base64")
    return `@font-face { font-family: "${face.family}"; font-weight: ${face.weight}; font-style: ${face.style}; src: url(data:font/ttf;base64,${data}) format("truetype"); }`
  }).join("\n")
  return cached
}
