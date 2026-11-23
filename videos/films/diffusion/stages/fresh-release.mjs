import { freshDiffusionSnapshot, releaseJob } from '../model.mjs';
import { afterPhrase, cueProgress } from '../pixel-study.mjs';

function drawFile(ctx, api, x, y, file) {
  const pitch = 144 / file.side;
  file.samples.forEach((v, i) => {
    api.rect(
      ctx,
      x + (i % file.side) * pitch,
      y + Math.floor(i / file.side) * pitch,
      pitch,
      pitch,
      `rgb(${v},${v},${v})`,
      undefined,
      0,
    );
  });
}

export function drawFreshRelease(ctx, scene, state, api) {
  const { C } = api;
  const { variants, steps, branches, candidates, currentAttempt } = releaseJob;
  const s = freshDiffusionSnapshot(state);
  const repaired = s.published || afterPhrase(state, 'df-fresh-recheck', 2);
  const p = cueProgress(state, 'df-fresh-setup', 0);
  api.focus.target('df-fresh-work', () => {
    api.text(ctx, 'Denoiser predictions', 125, 268, 39, C.ink);
    api.text(ctx, 'One base and one prompt prediction per step', 125, 325, 30, C.muted);
    for (let row = 0; row < variants; row++) {
      const y = 420 + row * 104;
      api.text(ctx, `Variant ${row + 1}`, 125, y + 12, 32, C.ink);
      for (let step = 0; step < steps; step++) {
        for (let branch = 0; branch < branches; branch++) {
          const shown = (step + 1) / steps <= p;
          const color = branch === 0 ? C.blue : C.yellow;
          api.circle(
            ctx,
            370 + step * 63,
            y - 13 + branch * 26,
            9,
            shown ? color : C.panel,
            color,
            2,
          );
        }
      }
    }
    api.text(
      ctx,
      `${variants} × ${steps} × ${branches} = ${s.work ?? '?'}`,
      125,
      801,
      53,
      C.yellow,
    );
    api.text(ctx, 'Predictions for this job', 125, 858, 33, C.muted);
  });
  api.text(ctx, `Which file can attempt ${currentAttempt} release?`, 935, 268, 39, C.ink);
  api.text(ctx, 'SHA-256 prefixes of the grayscale files', 935, 325, 29, C.muted);
  for (const [i, candidate] of candidates.entries()) {
    const y = 376 + i * 262;
    const target = i === 0 ? 'df-fresh-old' : 'df-fresh-current';
    const checked = i === 1 && repaired ? candidate.file : candidate.checked;
    api.focus.target(target, () => {
      drawFile(ctx, api, 945, y + 26, candidate.file);
      api.text(
        ctx,
        `Attempt ${candidate.attempt}    ·    ${candidate.file.side} × ${candidate.file.side}`,
        1134,
        y + 30,
        36,
        C.ink,
      );
      api.text(
        ctx,
        `File          ${candidate.file.digest.slice(0, 8)}`,
        1134,
        y + 87,
        32,
        C.yellow,
      );
      api.text(ctx, `Checked   ${checked.digest.slice(0, 8)}`, 1134, y + 131, 32, C.cyan);
      const status =
        i === 0
          ? s.old
            ? 'Expired attempt · keep private'
            : 'Decision pending'
          : s.published
            ? 'Committed'
            : repaired
              ? 'Checked · awaiting commit'
              : s.current
                ? 'Hold · check the resized file'
                : 'Decision pending';
      api.text(ctx, status, 1134, y + 189, 30, s.published && i === 1 ? C.green : C.ink);
    });
  }
  api.focus.target('df-fresh-commit', () => {
    api.text(
      ctx,
      s.published
        ? `Immutable URL → …/${candidates[1].file.digest.slice(0, 8)}`
        : 'Public URL pending',
      935,
      986,
      35,
      s.published ? C.green : C.muted,
    );
  });
}

export default {
  id: 'fresh-release',
  draw: drawFreshRelease,
  cues: [
    'df-fresh-setup',
    'df-fresh-pair',
    'df-fresh-work',
    'df-fresh-old',
    'df-fresh-current',
    'df-fresh-recheck',
    'df-fresh-commit',
  ],
};
