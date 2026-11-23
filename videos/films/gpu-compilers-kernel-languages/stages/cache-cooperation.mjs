import { artifactDigest, publishedPair } from '../arithmetic.mjs';
import { ARTIFACT } from '../fixtures.mjs';
import {
  after,
  arrow,
  box,
  codeText,
  cueProgress,
  detailText,
  focusTarget,
  footer,
  visible,
} from '../defaults.mjs';
const versionB = [...ARTIFACT.slice(0, -1), 5];
const manifestA = { kernelSha256: artifactDigest(ARTIFACT) };
const originalPair = publishedPair(ARTIFACT, manifestA);
const crashedPair = publishedPair(versionB, manifestA);
export function drawCacheCooperation(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  {
    if (currentBeat === 0)
      focusTarget(ctx, api, 'publication-bytes', () => {
        detailText(
          ctx,
          api,
          'One destination · same-filesystem replacement contract',
          150,
          285,
          30,
          themeColors.yellow,
        );
        const q = cueProgress(ctx, api, 'private-temp'),
          n = Math.floor(q * 8);
        detailText(ctx, api, 'private PID/UUID temp', 150, 390, 31, themeColors.cyan);
        for (let i = 0; i < 8; i++) {
          box(ctx, api, 520 + i * 130, 345, 110, 80, themeColors.muted);
          if (i < n) api.rect(ctx, 520 + i * 130, 345, 110, 80, themeColors.cyan, null, 0, 3);
        }
        detailText(ctx, api, 'public destination', 150, 690, 31, themeColors.green);
        const replaced = after(api, 'atomic-replace');
        box(ctx, api, 520, 635, 1020, 120, replaced ? themeColors.green : themeColors.muted);
        detailText(
          ctx,
          api,
          replaced ? 'complete new artifact' : 'complete old artifact',
          1030,
          708,
          35,
          replaced ? themeColors.green : themeColors.muted,
          'center',
        );
        if (replaced) arrow(ctx, api, 1670, 385, 1670, 670, themeColors.green);
        detailText(
          ctx,
          api,
          'close file, then os.replace',
          960,
          860,
          32,
          themeColors.yellow,
          'center',
        );
        detailText(
          ctx,
          api,
          'This version closes and replaces the file without locking or syncing it to disk.',
          960,
          940,
          28,
          themeColors.muted,
          'center',
        );
      });
    else if (currentBeat === 1) {
      focusTarget(ctx, api, 'writer-lanes', () => {
        const locked = visible(ctx, api, 'recheck-key');
        detailText(
          ctx,
          api,
          'Two writers observe the same missing key',
          150,
          280,
          31,
          themeColors.yellow,
        );
        ['writer A', 'writer B'].forEach((name, i) => {
          const y = 360 + i * 155;
          detailText(ctx, api, name, 160, y + 40, 30, i ? themeColors.pink : themeColors.blue);
          if (visible(ctx, api, 'duplicate-builds')) {
            const waiting = locked && i === 1,
              color = waiting ? themeColors.muted : i ? themeColors.pink : themeColors.blue;
            api.rect(ctx, 500, y, 520, 65, color, null, 0, 4);
            detailText(
              ctx,
              api,
              waiting ? 'wait for cooperating lock' : 'compile complete bytes',
              760,
              y + 44,
              27,
              themeColors.panel,
              'center',
            );
            arrow(
              ctx,
              api,
              1040,
              y + 25,
              1120,
              y + 25,
              waiting ? themeColors.green : themeColors.cyan,
            );
            detailText(
              ctx,
              api,
              waiting ? 'recheck → HIT' : 'publish',
              1160,
              y + 95,
              28,
              waiting ? themeColors.green : themeColors.cyan,
            );
          }
        });
        if (locked)
          detailText(
            ctx,
            api,
            'A publishes once; B rechecks the exact key and skips compilation.',
            960,
            725,
            30,
            themeColors.green,
            'center',
          );
      });
    } else if (currentBeat === 2) {
      focusTarget(ctx, api, 'group-artifacts', () => {
        const crashed = after(api, 'group-crash');
        const pair = crashed ? crashedPair : originalPair;
        const compared = after(api, crashed ? 'group-compare' : 'pair-match');
        const color = compared
          ? pair.matches
            ? themeColors.green
            : themeColors.pink
          : themeColors.ink;
        detailText(
          ctx,
          api,
          'Reader opens one kernel and its metadata',
          150,
          278,
          37,
          themeColors.ink,
        );
        detailText(ctx, api, 'Example bytes', 150, 412, 29, themeColors.muted);
        detailText(
          ctx,
          api,
          'SHA-256 digest  ·  first 12 hex digits shown',
          850,
          412,
          29,
          themeColors.muted,
        );
        for (const [i, row] of [
          ['Kernel file', crashed ? 'B' : 'A', pair.actual],
          ['Metadata', 'A', pair.expected],
        ].entries()) {
          const [name, version, digest] = row;
          const y = 525 + i * 170;
          detailText(ctx, api, name, 150, y, 41, themeColors.ink);
          if (!visible(ctx, api, 'pair-a')) continue;
          box(ctx, api, 540, y - 61, 140, 93, themeColors.cyan);
          detailText(ctx, api, version, 610, y + 3, 42, themeColors.cyan, 'center');
          codeText(ctx, api, digest.slice(0, 12), 850, y, 49, color);
          detailText(ctx, api, i ? 'expected' : 'computed', 1320, y, 32, themeColors.muted);
        }
        if (compared)
          detailText(
            ctx,
            api,
            pair.matches ? 'Matching digests' : 'Different digests. Reject this pair.',
            150,
            883,
            45,
            color,
          );
      });
    } else
      focusTarget(ctx, api, 'cache-ranks', () => {
        const rows = [
          ['rank 0', 'A', 'shared', 'warmed'],
          ['rank 1', 'A', 'private empty', 'MISS'],
          ['rank 2', 'B', 'shared', 'MISS'],
          ['rank 3', 'A', 'shared', 'HIT'],
        ];
        detailText(
          ctx,
          api,
          'Identity and reachable storage are separate conditions',
          150,
          300,
          32,
          themeColors.yellow,
        );
        rows.forEach(([rank, target, storage, result], i) => {
          const y = 385 + i * 130;
          box(ctx, api, 170, y, 1480, 100, themeColors.muted);
          detailText(ctx, api, rank, 200, y + 62, 32, themeColors.cyan);
          detailText(ctx, api, 'target ' + target, 500, y + 62, 32);
          detailText(ctx, api, storage, 850, y + 62, 30);
          if (after(api, ['warm-scope', 'private-miss', 'target-miss', 'shared-hit'][i]))
            detailText(
              ctx,
              api,
              result,
              1430,
              y + 62,
              34,
              result === 'HIT' || result === 'warmed' ? themeColors.green : themeColors.pink,
            );
        });
      });
    if (currentBeat === 3)
      footer(
        ctx,
        api,
        'CPU lookup example. A distributed run also depends on barrier and filesystem behavior.',
      );
  }
}
export default {
  id: 'cache-cooperation',
  draw: drawCacheCooperation,
  cues: [
    'private-temp',
    'atomic-replace',
    'duplicate-builds',
    'recheck-key',
    'pair-a',
    'pair-match',
    'group-crash',
    'group-compare',
    'warm-scope',
    'private-miss',
    'target-miss',
    'shared-hit',
  ],
};
