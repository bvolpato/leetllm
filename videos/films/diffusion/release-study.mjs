import { createHash } from 'node:crypto';

function grayscaleFile(side, samples) {
  const bytes = Buffer.concat([Buffer.from(`P5\n${side} ${side}\n255\n`), Buffer.from(samples)]);
  return { side, samples, digest: createHash('sha256').update(bytes).digest('hex') };
}

export function makeReleaseStudy(image) {
  const original = grayscaleFile(
    16,
    image.map((v) => Math.round(127.5 * (v + 1))),
  );
  const resized = grayscaleFile(
    8,
    Array.from({ length: 64 }, (_, i) => {
      const first = Math.floor(i / 8) * 32 + (i % 8) * 2;
      const sum = [0, 1, 16, 17].reduce((n, d) => n + original.samples[first + d], 0);
      return Math.round(sum / 4);
    }),
  );
  return {
    variants: 3,
    steps: 8,
    branches: 2,
    currentAttempt: 5,
    candidates: [
      { attempt: 4, file: original, checked: original },
      { attempt: 5, file: resized, checked: original },
    ],
  };
}

// Policy and watermark checks are supplied as passing in this example.
export function fileDecision(candidate, currentAttempt, manifestCommitted) {
  if (candidate.attempt !== currentAttempt) return 'fenced';
  if (candidate.file.digest !== candidate.checked.digest || !manifestCommitted) return 'hold';
  return 'publish';
}
