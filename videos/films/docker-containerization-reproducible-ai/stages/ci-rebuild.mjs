import { CHANGED_FIXTURE, CHANGED_FIXTURE_JSONL, FIXTURE, OBSERVED_IMAGE_ID } from '../fixtures.mjs';
import { createHash } from 'node:crypto';
import { codeText, focusTarget, line, rectangle } from '../defaults.mjs';
import { score } from '../model.mjs';
import { drawReadPaths, reportNote } from '../read-paths.mjs';

// Both branches below consume the same example JSONL bytes.
const buffer = Buffer.from(CHANGED_FIXTURE_JSONL, 'utf8');
const parsed = buffer
  .toString('utf8')
  .trimEnd()
  .split('\n')
  .map((line) => JSON.parse(line));
const snapshotScore = score(parsed);
const shaPrefix = createHash('sha256').update(buffer).digest('hex').slice(0, 16);

function drawTagLookup(ctx, state, api, after) {
  const { C } = api;
  const move = state.cues?.['dk-ci-rebuild-tag-moves']?.progress ?? 0;
  codeText(ctx, api, 'Two jobs share access-rag:check', 145, 282, 42);
  codeText(ctx, api, 'Local image ID', 145, 382, 30, C.muted);
  codeText(ctx, api, 'Tag at lookup', 710, 382, 30, C.muted);
  codeText(ctx, api, 'ID used by job A', 1330, 382, 30, C.muted);
  codeText(ctx, api, 'A', 145, 488, 54, C.blue, 'left', 'mono');
  codeText(ctx, api, 'B', 145, 610, 54, move ? C.cyan : C.muted, 'left', 'mono');
  const tagY = 472 + 122 * move;
  api.arrow(ctx, 675, tagY, 220, tagY, C.yellow, 4);
  codeText(ctx, api, 'access-rag:check', 710, tagY + 14, 37, C.yellow, 'left', 'mono');
  if (after('inspect')) {
    codeText(ctx, api, 'B   baked run', 1330, 513, 34, C.cyan, 'left', 'mono');
    codeText(ctx, api, 'B   mounted run', 1330, 600, 34, C.cyan, 'left', 'mono');
  }
  if (after('iidfile')) {
    line(ctx, api, 145, 690, 1770, 690, C.muted);
    codeText(ctx, api, 'Replay with a file private to job A', 145, 765, 35, C.blue);
    codeText(
      ctx,
      api,
      'docker build --iidfile "$job_dir/image.id" -t access-rag:check .',
      145,
      843,
      32,
      C.ink,
      'left',
      'mono',
    );
    codeText(ctx, api, 'Build A', 145, 955, 35, C.blue);
    api.arrow(ctx, 315, 944, 500, 944, C.blue, 4);
    codeText(ctx, api, 'image.id contains A', 542, 955, 35, C.blue);
    if (after('file-tests')) {
      api.arrow(ctx, 943, 944, 1120, 944, C.blue, 4);
      codeText(ctx, api, 'Both test commands use A', 1160, 955, 35, C.blue);
    }
  }
}

export function drawCiRebuild(ctx, scene, state, api) {
  const after = (id) => state.cues?.['dk-ci-rebuild-' + id]?.phase === 'after';
  const edited = after('host-edit');
  const copied = after('copy');
  const ran = copied ? after('rebuild') : edited ? after('mounted') : after('both');
  const compared = copied ? after('reject') : !edited;
  focusTarget(ctx, api, 'ci-rebuild-construction', () => {
    if (state.beat === 3) {
      drawTagLookup(ctx, state, api, after);
      return;
    }
    if (state.beat === 4) {
      const { C } = api;
      codeText(ctx, api, 'If a run must identify its input', 145, 289, 40);
      codeText(ctx, api, 'Host file', 145, 428, 38, C.cyan);
      codeText(ctx, api, 'Request 102', 145, 521, 31, C.muted);
      codeText(ctx, api, after('later') ? 'escalated' : 'blocked', 145, 597, 37, C.cyan);
      if (after('later')) codeText(ctx, api, 'Edited after the read', 145, 740, 29, C.yellow);
      if (after('read')) {
        api.arrow(ctx, 475, 560, 613, 560, C.blue, 4);
        rectangle(ctx, api, 638, 401, 450, 306, C.panel, C.blue);
        codeText(ctx, api, buffer.length + ' bytes read once', 670, 473, 36, C.blue);
        codeText(ctx, api, 'Request 102', 670, 556, 31, C.muted);
        codeText(ctx, api, parsed[1].prediction, 670, 630, 37);
      }
      if (after('parse')) {
        api.arrow(ctx, 1109, 531, 1268, 450, C.blue, 4);
        codeText(ctx, api, 'Parse and score', 1300, 444, 34, C.muted);
        codeText(
          ctx,
          api,
          snapshotScore.matches + ' of ' + snapshotScore.total,
          1300,
          522,
          43,
          C.green,
        );
      }
      if (after('hash')) {
        api.arrow(ctx, 1109, 577, 1268, 691, C.blue, 4);
        codeText(ctx, api, 'SHA-256 prefix', 1300, 687, 34, C.muted);
        codeText(ctx, api, shaPrefix + '…', 1300, 761, 34, C.ink, 'left', 'mono');
        codeText(ctx, api, 'Save the full hash and report with the image ID.', 570, 944, 36);
      }
      return;
    }
    drawReadPaths(ctx, api, {
      imageName: copied ? 'new ID · after COPY eval/' : 'I1 · ' + OBSERVED_IMAGE_ID.slice(7, 19),
      bakedRows: copied ? CHANGED_FIXTURE : FIXTURE,
      hostRows: edited ? CHANGED_FIXTURE : FIXTURE,
      editing: edited && !copied,
      ran: [ran, ran],
      compared: [compared, compared && !copied],
    });
    const note = after('reject')
      ? 'ERROR: baked fixture report changed'
      : copied
        ? 'Reference still expects 0.667 (2/3)'
        : edited
          ? 'Rerun I1 without rebuilding'
          : after('capture')
            ? 'docker image inspect access-rag:check  →  current local ID'
            : 'docker build --check .';
    reportNote(ctx, api, note, 'ci-status', after('reject') ? api.C.pink : api.C.muted);
  });
}

export default {
  id: 'ci-rebuild',
  draw: drawCiRebuild,
  cues: [
    'dk-ci-rebuild-beat0',
    'dk-ci-rebuild-capture',
    'dk-ci-rebuild-both',
    'dk-ci-rebuild-beat1',
    'dk-ci-rebuild-host-edit',
    'dk-ci-rebuild-mounted',
    'dk-ci-rebuild-copy',
    'dk-ci-rebuild-rebuild',
    'dk-ci-rebuild-reject',
    'dk-ci-rebuild-beat2',
    'dk-ci-rebuild-tag-moves',
    'dk-ci-rebuild-inspect',
    'dk-ci-rebuild-iidfile',
    'dk-ci-rebuild-file-tests',
    'dk-ci-rebuild-read',
    'dk-ci-rebuild-parse',
    'dk-ci-rebuild-hash',
    'dk-ci-rebuild-later',
  ],
};
