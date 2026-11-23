import { rows } from '../fixtures.mjs';
import { cueProgress } from '../construction.mjs';
import { inputContractFrame } from '../model.mjs';
import { caption, mark, route, tag, text, transfer } from '../defaults.mjs';
export function drawInputContract(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0;
  if (currentBeat === 0)
    mark(api, 'input-validation', () => {
      const p = cueProgress(state, 'record-validation', 0),
        cases = [
          ['valid record', JSON.stringify(rows[0]), true],
          ['array', '[]', false],
          ['missing prediction', '{"prompt":"x","expected":"blocked"}', false],
          ['malformed', '{"prompt":', false],
          ['empty dataset', '(no nonblank lines)', false],
        ];
      text(
        ctx,
        api,
        'Nonblank line → JSON parser → object + string contract',
        960,
        310,
        34,
        api.C.cyan,
        'center',
      );
      cases.forEach(([name, value, valid], i) => {
        const y = 360 + i * 100;
        text(ctx, api, name, 180, y + 25, 27, api.C.muted);
        text(ctx, api, value, 180, y + 65, i === 0 ? 23 : 27, api.C.ink, 'left', true);
        if (p >= i / 4 && p > 0)
          tag(
            ctx,
            api,
            valid ? 'accept row' : 'error · exit 1',
            1410,
            y + 4,
            330,
            valid ? api.C.green : api.C.pink,
            27,
          );
      });
      caption(ctx, api, 'Parsing JSON is one gate; valid scorer records require the next gate');
    });
  else if (currentBeat === 1)
    mark(api, 'normalized-labels', () => {
      const p = cueProgress(state, 'normalize-labels', 1),
        miss = cueProgress(state, 'normalization-miss', 1);
      text(ctx, api, 'Stored labels', 390, 325, 32, api.C.muted, 'center');
      text(ctx, api, 'strip → lowercase', 960, 325, 32, api.C.cyan, 'center');
      text(ctx, api, 'Compared labels', 1510, 325, 32, api.C.muted, 'center');
      ['blocked', '  BLOCKED  '].forEach((value, i) => {
        const y = 410 + i * 170;
        tag(ctx, api, JSON.stringify(value), 180, y, 470, api.C.blue, 34);
        route(
          ctx,
          api,
          [
            [680, y + 34],
            [1240, y + 34],
          ],
          api.C.muted,
        );
        transfer(
          ctx,
          api,
          i ? 'BLOCKED → blocked' : 'blocked',
          [700, y],
          [1010, y],
          p,
          api.C.cyan,
          310,
        );
        if (p === 1) tag(ctx, api, 'blocked', 1270, y, 470, api.C.green, 34);
      });
      if (p === 1) text(ctx, api, 'equal → one match', 1510, 790, 38, api.C.green, 'center');
      if (miss === 1)
        text(ctx, api, 'escalated ≠ blocked → miss', 670, 890, 36, api.C.pink, 'center', true);
      caption(ctx, api, 'The stored strings remain unchanged; only the comparison is normalized');
    });
  else {
    const s = inputContractFrame(state),
      before = new TextEncoder().encode(s.before),
      after = new TextEncoder().encode(s.after);
    mark(api, 'fixture-bytes', () => {
      text(
        ctx,
        api,
        'Same three original JSON objects · remove only the last byte',
        960,
        310,
        34,
        api.C.ink,
        'center',
      );
      api.teaching.byteDifference({
        x: 180,
        y: 365,
        width: 1560,
        height: 330,
        fontSize: 27,
        maxColumns: 6,
        startColumn: before.length - 6,
        before,
        after,
        scanProgress: s.scan,
        revealVerdict: s.verdict,
        beforeLabel: 'Original',
        afterLabel: 'Changed',
        fill: api.C.panel,
        stroke: api.C.muted,
        textColor: api.C.ink,
        mutedColor: api.C.muted,
        scanColor: api.C.cyan,
        changeColor: api.C.yellow,
      });
    });
    mark(api, 'newline-counts', () => {
      text(ctx, api, 'wc -l', 440, 785, 33, api.C.cyan, 'center', true);
      text(
        ctx,
        api,
        s.newlines === null ? '?' : String(s.newlines),
        440,
        875,
        66,
        s.newlines === null ? api.C.muted : api.C.cyan,
        'center',
      );
    });
    mark(api, 'record-counts', () => {
      text(ctx, api, 'Parsed objects', 1000, 785, 33, api.C.blue, 'center');
      text(
        ctx,
        api,
        s.records === null ? '?' : String(s.records),
        1000,
        875,
        66,
        s.records === null ? api.C.muted : api.C.blue,
        'center',
      );
      text(
        ctx,
        api,
        s.matches === null ? 'Matches: ?' : `Matches: ${s.matches}`,
        1500,
        850,
        39,
        s.matches === null ? api.C.muted : api.C.green,
        'center',
      );
    });
    caption(ctx, api, 'Bytes, records and accuracy have different contracts');
  }
}
export default {
  id: 'input-contract',
  draw: drawInputContract,
  cues: [
    'record-validation',
    'record-valid',
    'normalize-labels',
    'normalization-miss',
    'remove-final-newline',
    'newline-count-reveal',
    'record-count-reveal',
    'match-count-reveal',
    'byte-verdict',
  ],
};
