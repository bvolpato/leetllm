import { createRequire } from 'node:module';
import * as vizmatic from 'vizmatic';
import { BRAND_INTRO_SECONDS, drawBrandIntro } from '../../lib/brand.mjs';
import { registerLessonFonts } from '../../lib/fonts.mjs';
import { fps, height, width } from './timeline.mjs';

// Use the same native binding as the font registry, including in a linked installation.
const requireForFonts = createRequire(import.meta.resolve('../../lib/fonts.mjs'));
const { createCanvas } = requireForFonts('@napi-rs/canvas');

export function createPicture(film) {
  registerLessonFonts();
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  function paint(context, clock) {
    const result = film.draw(context, clock);
    if (result?.then) throw new Error(`Beat ${clock.beat.id} must draw synchronously.`);
  }
  return {
    draw(clock) {
      ctx.reset();
      paint(ctx, clock);
    },
    paint,
    canvas,
  };
}

export async function encodePicture(film, timeline, outputPath, { includeOpening = false, reuseReadback = false } = {}) {
  const { draw, paint, canvas } = createPicture(film);
  const context = canvas.getContext('2d');
  const readback = reuseReadback && vizmatic.createCanvasReadback?.(context, () => canvas.data());
  const introFrames = includeOpening ? BRAND_INTRO_SECONDS * fps : 0;
  const frames = introFrames + timeline.frames;
  let previousReuseCount = 0;
  const comparedFramesByChapter = Object.fromEntries((film.compareRgbaChapters ?? []).map(id => [id, 0]));
  let compareChapter;
  let comparedFrames = 0;

  const encoded = await vizmatic.renderRgbaVideo(
    ({ index }) => {
      if (index < introFrames) drawBrandIntro(context, index / fps);
      else {
        const clock = timeline.clockAtFrame(index - introFrames);
        if (readback) {
          compareChapter = clock.beat.chapterId;
          return readback.frame(ctx => paint(ctx, clock));
        }
        draw(clock);
      }
      return canvas.data();
    },
    {
      width,
      height,
      fps,
      duration: (frames * 1000) / fps,
      outputPath,
      h264Encoder: 'libx264',
      requireH264Encoder: true,
      threads: 2,
      ...(readback && {
        frameIsRepeat() {
          const { reused, tracking } = readback.stats();
          if (tracking === false && Object.hasOwn(comparedFramesByChapter, compareChapter)) {
            comparedFrames++;
            comparedFramesByChapter[compareChapter]++;
            return 'compare';
          }
          const repeated = reused > previousReuseCount;
          previousReuseCount = reused;
          return repeated;
        },
      }),
      preset: 'veryfast',
      crf: 16,
    },
  );
  if (encoded.frameCount !== frames)
    throw new Error('The picture encoder changed the frame count.');
  if (reuseReadback) {
    if (!readback) return { available: false };
    return {
      ...readback.stats(),
      comparedFrames,
      comparedFramesByChapter,
      ...(encoded.rgbaPackets !== undefined && { rgbaPackets: encoded.rgbaPackets }),
    };
  }
}
