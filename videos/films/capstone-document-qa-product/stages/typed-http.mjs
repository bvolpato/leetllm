import { sha } from '../arithmetic.mjs';
import { LAB_POLICY, policy } from '../fixtures.mjs';
import {
  cueProgress,
  detailDigest,
  detailLine,
  detailNote,
  detailParagraph,
  detailTag,
  detailText,
  progressArrow,
} from '../defaults.mjs';
export function drawTypedHttp(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    resultComplete = (id) => cueProgress(ctx, api, id) === 1;
  api.focus.target('typed-http-mechanism', () => {
    if (currentBeat === 0) {
      detailTag(ctx, api, 'POST /answer · in-process TestClient', 960, 285, themeColors.blue, 1450);
      if (cueProgress(ctx, api, 'http-local'))
        detailText(
          ctx,
          api,
          'Pinned dependencies · local adapter checks · no network server',
          960,
          375,
          29,
          themeColors.muted,
        );
      if (cueProgress(ctx, api, 'http-answer-body')) {
        detailParagraph(
          ctx,
          api,
          [
            'Production API key access may be restored after identity verification.',
            'Privileged scopes require manager approval before access is queued.',
          ],
          480,
          themeColors.ink,
          30,
        );
        detailTag(
          ctx,
          api,
          'status: grounded · reason: bound support receipt entailed',
          960,
          660,
          themeColors.green,
          1530,
        );
      }
      if (cueProgress(ctx, api, 'http-source-fields')) {
        detailText(
          ctx,
          api,
          'access-policy-us-v3 · Production API key access · [0, 138)',
          960,
          790,
          29,
          themeColors.blue,
        );
        detailText(
          ctx,
          api,
          'Chunk: access-policy-us-v3#section=production-api-key-access',
          960,
          850,
          26,
          themeColors.muted,
        );
      }
      if (resultComplete('http-support-fields'))
        detailText(
          ctx,
          api,
          'entailed · answer-support-required-v1',
          960,
          935,
          31,
          themeColors.yellow,
        );
    } else if (currentBeat === 1) {
      detailParagraph(ctx, api, ['Exact returned Python string'], 280, themeColors.blue, 34);
      detailParagraph(
        ctx,
        api,
        [policy, LAB_POLICY.slice(policy.length + 1)],
        400,
        themeColors.ink,
        31,
      );
      if (cueProgress(ctx, api, 'span-exact-text')) {
        detailLine(ctx, api, 170, 515, 1750, 515, themeColors.cyan, 4);
        detailText(ctx, api, 'start 0', 235, 575, 30, themeColors.cyan);
        detailText(ctx, api, 'end 138, excluded', 1590, 575, 30, themeColors.cyan);
        detailText(ctx, api, '138 characters · source[0:138]', 960, 655, 36, themeColors.yellow);
      }
      if (cueProgress(ctx, api, 'http-private')) {
        const columns = [
          [515, 'Internal admission log', 'workspace-note-48291', 'Excluded from policy evidence'],
          [1410, 'Public citation', 'access-policy-us-v3', 'Names only the returned source'],
        ];
        columns.forEach(([x, name, id, description]) => {
          detailText(ctx, api, name, x, 755, 30, themeColors.muted);
          detailText(ctx, api, id, x, 824, 36, themeColors.blue);
          detailText(ctx, api, description, x, 885, 29, themeColors.ink);
        });
      } else if (cueProgress(ctx, api, 'span-digest')) {
        detailText(ctx, api, 'Full SHA-256 of that exact text', 960, 770, 29, themeColors.muted);
        detailDigest(ctx, api, sha(LAB_POLICY), 960, 825, themeColors.cyan);
      }
      detailNote(
        ctx,
        api,
        'Offsets index Python characters; the digest encodes the selected text as UTF-8 bytes',
      );
    } else {
      const rows = [
        ['Missing credentials', '401', 'http-boundaries'],
        ['Blank question', '422', 'http-validation'],
        ['Extra region field', '422', 'http-validation'],
        ['Demo EU caller', 'abstain · citations []', 'http-eu'],
      ];
      rows.forEach(([q, v, id], i) => {
        const y = 335 + i * 150;
        detailTag(ctx, api, q, 525, y, themeColors.blue, 740);
        progressArrow(ctx, api, 930, y, 1030, y, themeColors.cyan, cueProgress(ctx, api, id));
        if (cueProgress(ctx, api, id))
          detailTag(ctx, api, v, 1430, y, i === 3 ? themeColors.yellow : themeColors.pink, 670);
      });
      detailNote(
        ctx,
        api,
        'Actual local adapter outcomes · production identity, container and deployed HTTP remain separate checks',
      );
    }
  });
  return;
}
export default {
  id: 'typed-http',
  draw: drawTypedHttp,
  cues: [
    'http-response',
    'http-local',
    'http-answer-body',
    'http-source-fields',
    'http-support-fields',
    'exact-span',
    'span-exact-text',
    'span-digest',
    'http-private',
    'http-boundaries',
    'http-validation',
    'http-eu',
  ],
};
