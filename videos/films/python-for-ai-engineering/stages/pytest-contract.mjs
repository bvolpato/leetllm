import { complete, exactCue, pyP } from '../construction.mjs';
import { box, code, pyMark, stripe, text } from '../defaults.mjs';
export function drawPytestContract(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = pyP(state, 'pytest-contract');
  pyMark(api, 'pytest-contract', () => {
    if (currentBeat === 0) {
      const names = [
        'integer',
        'Boolean',
        'null',
        'list',
        'dict',
        'normalization',
        'exact 2/3',
        'empty file',
        'blank line',
        'floor 2/2',
      ];
      text(
        ctx,
        api,
        'Actual collected cases · existing article test file',
        960,
        285,
        34,
        api.C.muted,
        'center',
      );
      const n = complete(state, 'py-pytest-ten')
        ? 10
        : Math.min(5, Math.ceil(exactCue(state, 'py-pytest-param') * 5));
      names.forEach((v, i) => {
        const x = 180 + (i % 5) * 325,
          y = 365 + Math.floor(i / 5) * 260;
        box(ctx, api, x, y, 280, 170, i < n ? api.C.cyan : api.C.muted);
        text(
          ctx,
          api,
          String(i + 1),
          x + 140,
          y + 60,
          40,
          i < n ? api.C.cyan : api.C.muted,
          'center',
          true,
        );
        text(ctx, api, v, x + 140, y + 125, 27, i < n ? api.C.ink : api.C.muted, 'center');
      });
      text(
        ctx,
        api,
        'Each requesting test receives a private temporary directory.',
        960,
        940,
        30,
        api.C.muted,
        'center',
      );
    } else if (currentBeat === 1) {
      code(
        ctx,
        api,
        [
          'with pytest.raises(TypeError, match=r"^line 2:"):',
          '    parse_example(raw_line, line_number=2)',
        ],
        220,
        320,
        34,
        75,
      );
      const cases = [
        ['returns a row', '', false],
        ['ValueError', 'line 2: invalid JSON', false],
        ['TypeError', 'line 20: prediction must be a string', true],
        ['TypeError', 'line 2: prediction must be a string', true],
      ];
      cases.forEach(([type, message, typeMatches], i) => {
        const y = 550 + i * 100;
        text(ctx, api, type, 215, y, 34, api.C.blue, 'left', true);
        text(ctx, api, message, 650, y, 31, api.C.ink, 'left', true);
        const shown =
          i < 2 ? complete(state, 'py-pytest-type') : complete(state, 'py-pytest-message');
        const pass = typeMatches && /^line 2:/.test(message);
        if (shown)
          text(
            ctx,
            api,
            pass ? 'test passes' : 'test fails',
            1640,
            y,
            34,
            pass ? api.C.green : api.C.pink,
            'center',
          );
      });
    } else {
      const mutated = complete(state, 'py-pytest-mutate'),
        restored = complete(state, 'py-pytest-restore');
      const fail = mutated && !restored;
      code(
        ctx,
        api,
        [
          fail ? '# type gate removed in disposable fixture' : 'if not isinstance(value, str):',
          fail ? 'pass' : '    raise TypeError(...)',
        ],
        250,
        320,
        38,
        75,
      );
      for (let i = 0; i < 10; i++) {
        const x = 220 + i * 150,
          y = 610;
        box(ctx, api, x, 610, 110, 110, fail && i < 5 ? api.C.pink : api.C.green);
        text(
          ctx,
          api,
          fail && i < 5 ? '×' : '✓',
          x + 55,
          610 + 77,
          50,
          fail && i < 5 ? api.C.pink : api.C.green,
          'center',
        );
      }
      text(
        ctx,
        api,
        fail
          ? 'Actual mutation: 5 failed, 5 passed'
          : restored
            ? 'Actual restoration: 10 passed'
            : 'Actual baseline: 10 passed',
        960,
        850,
        41,
        fail ? api.C.pink : api.C.green,
        'center',
      );
      stripe(ctx, api, 260, 940, 1400, progress, fail ? api.C.pink : api.C.green);
    }
  });
}
export default {
  id: 'pytest-contract',
  draw: drawPytestContract,
  cues: [
    'py-pytest-contract-0',
    'py-pytest-param',
    'py-pytest-ten',
    'py-pytest-contract-1',
    'py-pytest-type',
    'py-pytest-message',
    'py-pytest-contract-2',
    'py-pytest-mutate',
    'py-pytest-restore',
  ],
};
