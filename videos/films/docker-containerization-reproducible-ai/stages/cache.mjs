import { mix } from '../arithmetic.mjs';
import { cueProgress } from '../construction.mjs';
import { SOURCE_KEYS, cacheState } from '../model.mjs';
import { codeBlock, focusTarget, codeText } from '../defaults.mjs';
export function drawCache(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const currentBeat = state.beat,
    q = (id, beat = 0, start, end) => cueProgress(state, id, beat, start, end);
  {
    const kind = currentBeat === 0 ? 'baseline' : currentBeat === 1 ? 'source' : 'requirements';
    const p =
      currentBeat === 1
        ? q('cache-source-edit', 1)
        : currentBeat === 2
          ? q('cache-dependency-edit', 2)
          : q('cache-contract');
    const lookup = currentBeat === 1 && state.cues?.['cache-source-miss'];
    const model = cacheState(kind, p, !lookup || lookup.phase === 'after');
    const applicationLines = ['stored key: ' + model.application];
    if (currentBeat === 1 && model.inputChanged) {
      applicationLines.push('lookup key: ' + SOURCE_KEYS.application);
      applicationLines.push(
        lookup?.phase === 'after' ? 'miss · copy executed' : 'checking the cache',
      );
    } else {
      applicationLines.push(model.rebuilt ? 'cached step result' : 'stored result waits');
    }
    codeText(
      ctx,
      api,
      'Teaching keys: instruction + input identities',
      150,
      275,
      32,
      themeColors.muted,
    );
    focusTarget(ctx, api, 'dependency-input', () =>
      codeBlock(
        ctx,
        api,
        'requirements.txt',
        [model.requirements, 'base: ' + model.base],
        150,
        350,
        570,
        220,
        {
          color: kind === 'requirements' ? themeColors.yellow : themeColors.blue,
        },
      ),
    );
    focusTarget(ctx, api, 'source-input', () =>
      codeBlock(
        ctx,
        api,
        'score_access_requests.py',
        [model.source, 'fixture: rows 101, 102, 103'],
        150,
        665,
        570,
        220,
        {
          color: kind === 'source' ? themeColors.yellow : themeColors.blue,
        },
      ),
    );
    focusTarget(ctx, api, 'installer-key', () =>
      codeBlock(
        ctx,
        api,
        'Install /opt/venv',
        [
          'stored key: ' + model.install,
          model.installReused
            ? 'same install inputs'
            : model.rebuilt
              ? 'new install inputs processed'
              : 'changed input: revisit install',
        ],
        1040,
        350,
        730,
        220,
        {
          color: kind === 'requirements' ? themeColors.yellow : themeColors.green,
        },
      ),
    );
    focusTarget(ctx, api, 'application-key', () =>
      codeBlock(ctx, api, 'Application copies (grouped)', applicationLines, 1040, 665, 730, 220, {
        color: currentBeat > 0 ? themeColors.yellow : themeColors.blue,
      }),
    );
    api.arrow(
      ctx,
      745,
      460,
      1010,
      460,
      kind === 'requirements' ? themeColors.yellow : themeColors.blue,
      4,
    );
    api.arrow(
      ctx,
      745,
      775,
      1010,
      775,
      kind === 'source' ? themeColors.yellow : themeColors.blue,
      4,
    );
    api.arrow(ctx, 1400, 585, 1400, 645, themeColors.cyan, 4);
    if (currentBeat > 0 && p > 0 && p < 1)
      api.rect(
        ctx,
        mix(770, 945, p),
        kind === 'source' ? 754 : 439,
        42,
        42,
        themeColors.yellow,
        null,
        0,
        6,
      );
    codeText(
      ctx,
      api,
      currentBeat === 0
        ? 'Order stable inputs before frequently edited source'
        : currentBeat === 1
          ? q('cache-reuse', 1) >= 1
            ? 'Source edit: install work is reusable'
            : 'Source edit: reuse decision pending'
          : q('cache-dependency-edit', 2) >= 1
            ? 'Separate dependency edit: revisit installation'
            : 'Dependency edit: installation decision pending',
      960,
      1000,
      32,
      themeColors.ink,
      'center',
    );
  }
}
export default {
  id: 'cache',
  draw: drawCache,
  cues: [
    'cache-contract',
    'cache-source-edit',
    'cache-source-miss',
    'cache-reuse',
    'cache-dependency-edit',
  ],
};
