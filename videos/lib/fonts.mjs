// One place decides which fonts a lesson uses. They ship with Vizmatic, so a render
// looks the same on a laptop and in CI, and nothing depends on a system font path.
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GlobalFonts } from '@napi-rs/canvas';

// The package root sits one level above its dist folder, whatever the install layout.
const packageRoot = dirname(dirname(fileURLToPath(import.meta.resolve('vizmatic'))));
const bundled = (name) => join(packageRoot, 'assets', 'fonts', name);

const FACES = Object.freeze([
  ['Inter-Regular.ttf', 'Lesson Sans'],
  ['Inter-SemiBold.ttf', 'Lesson Sans'],
  ['Inter-Bold.ttf', 'Lesson Sans'],
  ['JetBrainsMono-Regular.ttf', 'Lesson Mono'],
  ['SourceSerif4-24pt-Regular.ttf', 'Lesson Serif'],
  ['SourceSerif4-24pt-Italic.ttf', 'Lesson Serif'],
  ['NotoSans-Regular.ttf', 'Lesson Symbols'],
  ['NotoSansMath-Regular.ttf', 'Lesson Math'],
]);

// No bundled font covers Han or Kana, so one lesson's CJK examples use the system's.
const CJK_CANDIDATES = Object.freeze([
  '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',
  '/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc',
  '/System/Library/Fonts/Hiragino Sans GB.ttc',
  '/System/Library/Fonts/Supplemental/Songti.ttc',
]);

// Listed after each primary family, so a rare symbol falls back instead of painting a box.
const FALLBACKS = '"Lesson Symbols", "Lesson Math", "Lesson Mono", "Lesson CJK"';
const FAMILIES = Object.freeze({
  sans: 'Lesson Sans',
  mono: 'Lesson Mono',
  serif: 'Lesson Serif',
  cjk: 'Lesson CJK',
});

/** The CSS font string for a lesson text style. */
export function lessonFont(size, font = 'sans', weight = 500) {
  const family = FAMILIES[font];
  if (!family) throw new Error(`Unknown lesson font: ${font}`);
  return `${weight} ${size}px "${family}", ${FALLBACKS}`;
}

let registered = false;

/** Register every lesson font once. Throws if a bundled font is missing. */
export function registerLessonFonts() {
  if (registered) return;
  for (const [file, family] of FACES) {
    const path = bundled(file);
    if (!GlobalFonts.registerFromPath(path, family))
      throw new Error(`Missing bundled font: ${path}`);
  }
  const cjk = CJK_CANDIDATES.find((path) => existsSync(path));
  if (cjk) GlobalFonts.registerFromPath(cjk, 'Lesson CJK');
  registered = true;
}
