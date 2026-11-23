import { kvPerToken } from '../fixtures.mjs';
import { text, originalEquation } from '../defaults.mjs';
import { sceneClock } from '../scene-clock.mjs';

const prompt = 4000,
  branches = 8,
  tail = 1000;

export function drawMemory(ctx, scene, state, api) {
  const { C } = api,
    cue = sceneClock(scene, state);
  const label = (s, x, y, n, k = C.ink, a = 'left') => text(ctx, api, s, x, y, n, k, a);
  const section = (x, isShared) => {
    const step = 96,
      top = 360,
      dy = 49;
    const n = isShared ? Math.round(branches * cue('private-branches').p) : branches;
    const copies = isShared
      ? Number(cue('shared-prompt').started)
      : Math.round(branches * cue('unshare-prefix').p);
    label(isShared ? 'One shared prompt' : 'One copy per branch', x, 279, 43);
    api.focus.target(isShared ? 'shared-prefix' : 'copied-prefix', () => {
      for (let row = 0; row < copies; row++) {
        for (let k = 0; k < prompt / tail; k++) {
          api.rect(ctx, x + k * step, top + row * dy, step - 6, 33, C.blue, undefined, 5);
        }
      }
      if (isShared && n) {
        const spineX = x + 4 * step + 20;
        api.line(ctx, x + 4 * step - 5, top + 16, spineX, top + 16, C.muted, 3);
        api.line(ctx, spineX, top + 16, spineX, top + (n - 1) * dy + 16, C.muted, 3);
      }
    });
    api.focus.target(isShared ? 'shared-tails' : 'copied-tails', () => {
      for (let row = 0; row < n; row++) {
        const y = top + row * dy,
          tx = x + 4 * step + 53;
        api.line(ctx, x + 4 * step + (isShared ? 20 : -5), y + 16, tx, y + 16, C.muted, 3);
        api.rect(ctx, tx, y, step - 6, 33, C.yellow, undefined, 5);
        label(`B${row + 1}`, tx + step + 20, y + 28, 28, C.muted);
      }
    });
  };
  section(190, true);
  if (cue('unshare-prefix').started) section(1065, false);
  label('One block = 1,000 cached positions', 190, 800, 32, C.muted);
  const showResult = state.beat >= 1;
  api.focus.target('shared-total', () => {
    if (showResult)
      originalEquation(
        ctx,
        api,
        `4000+8(1000)=${prompt + branches * tail}`,
        496,
        888,
        42,
        C.green,
        'center',
      );
    else label('5,000 counts how many tails?', 188, 889, 40, C.yellow);
  });
  api.focus.target('copied-total', () => {
    if (cue('copied-total').started)
      originalEquation(
        ctx,
        api,
        `8(4000+1000)=${branches * (prompt + tail)}`,
        1375,
        888,
        42,
        C.cyan,
        'center',
      );
    else if (cue('unshare-prefix').started) label('Total with copies   ?', 1070, 881, 40, C.muted);
  });
  api.focus.target('byte-pair', () => {
    const gib = (positions) => ((positions * kvPerToken) / 2 ** 30).toFixed(2);
    const caption =
      'Shared  ' +
      gib(prompt + branches * tail) +
      ' GiB     ·     Copied  ' +
      gib(branches * (prompt + tail)) +
      ' GiB';
    label(
      cue('kv-volume').done ? caption : '128 KiB per cached position',
      935,
      971,
      37,
      C.muted,
      'center',
    );
  });
  if (cue('resource-accounting').started)
    api.focus.target('generated-work', () =>
      label(
        '8,000 continuation tokens generated in either case',
        960,
        1032,
        35,
        C.yellow,
        'center',
      ),
    );
}

export default { id: 'memory', draw: drawMemory };
