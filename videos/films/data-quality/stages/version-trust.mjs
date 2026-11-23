import { sha } from '../arithmetic.mjs';
import { pythonFixtureJSONL } from '../model.mjs';
import {
  drawConstructionArrow,
  drawConstructionChip,
  drawConstructionNote,
  drawConstructionP,
  drawConstructionSheet,
  drawConstructionText,
} from '../defaults.mjs';
export function drawVersionTrust(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const done = (id) => drawConstructionP(ctx, api, id) === 1,
    v = drawConstructionP(ctx, api, `${'version-trust'}-voice-${currentBeat + 1}`);
  api.focus.target('version-trust-construction', () => {
    const versions = [
        [
          {
            text: 'build missing',
            label: 'escalate',
          },
        ],
        [
          {
            text: 'build missing',
            label: 'escalate',
          },
          {
            text: 'break-glass request broken',
            label: 'standard',
          },
        ],
      ],
      digests = versions.map((x) => sha(pythonFixtureJSONL(x)));
    if (currentBeat === 0) {
      drawConstructionText(
        ctx,
        api,
        'Actual one-row and two-row payloads',
        160,
        300,
        34,
        themeColors.cyan,
      );
      drawConstructionSheet(
        ctx,
        api,
        'v1',
        'build missing · escalate',
        160,
        410,
        1590,
        125,
        themeColors.blue,
      );
      if (drawConstructionP(ctx, api, 'version-change') > 0)
        drawConstructionSheet(
          ctx,
          api,
          'v2 adds',
          'break-glass request broken · standard',
          160,
          625,
          1590,
          125,
          themeColors.cyan,
        );
      drawConstructionText(
        ctx,
        api,
        digests[0].slice(0, 12) + '…',
        300,
        880,
        36,
        themeColors.blue,
        'left',
        true,
      );
      if (done('version-change'))
        drawConstructionText(
          ctx,
          api,
          digests[1].slice(0, 12) + '…',
          1200,
          880,
          36,
          themeColors.cyan,
          'left',
          true,
        );
      drawConstructionNote(
        ctx,
        api,
        'Byte identity changes. Model quality needs a controlled comparison.',
      );
    } else if (currentBeat === 1) {
      const p = drawConstructionP(ctx, api, 'version-overwrite');
      drawConstructionText(
        ctx,
        api,
        'A mutable filename does not preserve its old bytes',
        160,
        300,
        33,
        themeColors.cyan,
      );
      drawConstructionSheet(
        ctx,
        api,
        'dev_tickets.v1.jsonl',
        p > 0.4 ? 'new content replaces old content' : 'original content',
        160,
        410,
        1590,
        130,
        p > 0.4 ? themeColors.pink : themeColors.blue,
      );
      drawConstructionText(
        ctx,
        api,
        'Retained content-addressed references',
        160,
        650,
        30,
        themeColors.muted,
      );
      drawConstructionSheet(
        ctx,
        api,
        digests[0].slice(0, 12),
        'original byte artifact',
        160,
        720,
        710,
        130,
        themeColors.blue,
      );
      drawConstructionSheet(
        ctx,
        api,
        digests[1].slice(0, 12),
        'changed byte artifact',
        1010,
        720,
        740,
        130,
        themeColors.cyan,
      );
      drawConstructionNote(
        ctx,
        api,
        'DVC cache identity and dataset reuse fingerprints do not authenticate a publisher.',
      );
    } else {
      drawConstructionText(
        ctx,
        api,
        'Historical table reads depend on retained snapshot metadata and files',
        160,
        300,
        31,
        themeColors.cyan,
      );
      const p = drawConstructionP(ctx, api, 'version-expire');
      ['S1', 'S2', 'S3'].forEach((id, i) => {
        const x = 260 + i * 560;
        drawConstructionChip(
          ctx,
          api,
          id,
          x,
          430,
          210,
          i === 0 && p > 0 ? themeColors.pink : themeColors.blue,
          90,
        );
        const fileX = x + 20;
        drawConstructionText(
          ctx,
          api,
          'data ' + String.fromCharCode(65 + i),
          fileX + 90,
          750,
          33,
          themeColors.cyan,
          'center',
          true,
        );
        if (i !== 0 || p === 0)
          drawConstructionArrow(ctx, api, x + 105, 550, fileX + 90, 690, themeColors.muted);
        if (i === 0 && p > 0) {
          drawConstructionText(ctx, api, 'expired', x + 105, 625, 30, themeColors.pink, 'center');
        }
      });
      drawConstructionNote(
        ctx,
        api,
        'Keep datasheet purpose,permissions,limits and maintenance alongside the operational manifest.',
      );
    }
  });
}
export default {
  id: 'version-trust',
  draw: drawVersionTrust,
  cues: [
    'version-trust-b1',
    'version-trust-voice-1',
    'version-change',
    'version-trust-b2',
    'version-trust-voice-2',
    'version-overwrite',
    'version-trust-b3',
    'version-trust-voice-3',
    'version-expire',
  ],
};
