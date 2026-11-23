import { MESSAGES, UPDATED_MESSAGES } from '../fixtures.mjs';
import { buildIndex, clamp, terms } from '../arithmetic.mjs';
import { freshnessState, q } from '../construction.mjs';
import {
  drawCaption,
  drawCard,
  drawMessage,
  drawPanel,
  drawReference,
  drawText,
  drawTransfer,
  withFocus,
} from '../defaults.mjs';

const editedId = 2;
const oldWords = terms(MESSAGES[editedId].text);
const newWords = terms(UPDATED_MESSAGES[editedId].text);
const removed = oldWords.filter((word) => !newWords.includes(word));
const added = newWords.filter((word) => !oldWords.includes(word));
const oldIndex = buildIndex(MESSAGES);
const newIndex = buildIndex(UPDATED_MESSAGES);

export function drawCacheFreshness(ctx, scene, state, api) {
  const { C: themeColors } = api;
  {
    const model = freshnessState(state),
      stage =
        state.beat === 0
          ? model.postings > 0
            ? 'postings'
            : 'edit'
          : state.beat === 1
            ? model.miss > 0
              ? 'miss'
              : 'publish'
            : model.store > 0
              ? 'store'
              : 'recompute';
    drawText(
      ctx,
      api,
      'Previous snapshot  /  version 7',
      960,
      910,
      21,
      themeColors.muted,
      'center',
    );
    drawCard(ctx, api, 'M2 old: charged twice', 140, 945, 400, 54, themeColors.muted, 0.65, 23);
    drawCard(ctx, api, 'v7: charged → M2', 590, 945, 380, 54, themeColors.muted, 0.65, 23);
    drawCard(ctx, api, 'v7: twice → M2', 1020, 945, 330, 54, themeColors.muted, 0.65, 23);
    drawCard(ctx, api, 'v7 cache: (M0,M2)', 1400, 945, 380, 54, themeColors.muted, 0.65, 23);
    if (q(state, 'freshness-scope', 1, 0.23, 0.56) > 0) {
      withFocus(ctx, api, 'freshness-stage', () =>
        withFocus(ctx, api, 'freshness-caller', () =>
          drawText(
            ctx,
            api,
            'Scope A  /  original caller can read all four notes',
            960,
            321,
            30,
            themeColors.cyan,
            'center',
          ),
        ),
      );
    }
    if (stage === 'edit')
      withFocus(ctx, api, 'freshness-stage', () => {
        drawText(ctx, api, 'EDIT MESSAGE M2', 960, 270, 28, themeColors.muted, 'center');
        const row = model.edit < 0.5 ? MESSAGES[2] : UPDATED_MESSAGES[2],
          color = model.edit < 0.5 ? themeColors.blue : themeColors.yellow;
        drawMessage(ctx, api, row, 250, 395, 1420, color);
        if (model.edit >= 0.5)
          drawCard(
            ctx,
            api,
            'Topic: Billing → Access',
            610,
            570,
            700,
            82,
            themeColors.yellow,
            1,
            32,
          );
        drawCaption(
          ctx,
          api,
          'The text and its word routes must describe the same note',
          themeColors.cyan,
          790,
        );
      });
    else if (stage === 'postings')
      withFocus(ctx, api, 'freshness-stage', () => {
        drawText(
          ctx,
          api,
          'Word routes for the edited note',
          960,
          245,
          29,
          themeColors.muted,
          'center',
        );
        const enter = q(state, 'freshness-sign', 0, 0.72, 0.9);
        const columns = [
          { x: 150, heading: 'Remove M2', words: removed, index: oldIndex, progress: model.postings },
          { x: 985, heading: 'Add M2', words: added, index: newIndex, progress: enter },
        ];
        for (const { x, heading, words, index, progress } of columns) {
          const removing = index === oldIndex;
          drawText(ctx, api, heading, x, 323, 34, removing ? themeColors.pink : themeColors.green);
          words.forEach((word, i) => {
            const y = 372 + i * 144;
            const change = clamp(progress * words.length - i);
            drawText(ctx, api, word, x, y + 52, 37, themeColors.ink);
            api.line(ctx, x, y + 95, x + 752, y + 95, themeColors.muted, 2);
            [...index.get(word)].forEach((id, slot) => {
              const affected = id === editedId;
              const visibility = affected ? (removing ? 1 - change : change) : 1;
              if (!visibility) return;
              const cardX = x + 204 + slot * 174;
              drawReference(
                ctx,
                api,
                id,
                cardX + (affected && !removing ? 72 * (1 - change) : 0),
                y - (affected && removing ? 22 * change : 0),
                affected ? (removing ? themeColors.pink : themeColors.green) : themeColors.cyan,
                visibility,
                148,
              );
            });
          });
        }
        if (model.postings === 1) {
          const ids = (values) => '{' + values.map((id) => 'M' + id).join(', ') + '}';
          drawText(
            ctx,
            api,
            'Current postings: charged ' + ids(model.charged) + ' · twice ' + ids(model.twice),
            960,
            864,
            31,
            themeColors.ink,
            'center',
          );
        }
      });
    else if (stage === 'publish')
      withFocus(ctx, api, 'freshness-stage', () => {
        drawText(
          ctx,
          api,
          'PUBLISH ONE CONSISTENT SNAPSHOT',
          960,
          275,
          29,
          themeColors.muted,
          'center',
        );
        withFocus(ctx, api, 'freshness-published-snapshot', () =>
          drawPanel(ctx, api, 280, 370, 1360, 195, themeColors.green, () => {
            drawCard(ctx, api, 'Edited notes', 365, 425, 340, 85, themeColors.blue, 1, 29);
            drawCard(ctx, api, 'Matching index', 790, 425, 340, 85, themeColors.cyan, 1, 29);
            drawCard(ctx, api, 'v8', 1215, 425, 250, 85, themeColors.green, 1, 34);
          }),
        );
        if (model.publish > 0.65)
          drawCard(
            ctx,
            api,
            'Existing cache receipt · v7 → M0, M2',
            530,
            650,
            860,
            88,
            themeColors.muted,
            1,
            30,
          );
        drawCaption(ctx, api, 'The old result still belongs to version 7', themeColors.cyan, 810);
      });
    else if (stage === 'miss')
      withFocus(ctx, api, 'freshness-stage', () => {
        drawText(ctx, api, 'LOOK UP THE NEW VERSION', 960, 260, 29, themeColors.muted, 'center');
        const request = drawCard(
          ctx,
          api,
          'v8 · charged twice · top 2 · scope A',
          240,
          390,
          850,
          110,
          themeColors.cyan,
          1,
          29,
        );
        const old = drawCard(
          ctx,
          api,
          'Cached v7 result · M0, M2',
          1250,
          390,
          470,
          110,
          themeColors.muted,
          1,
          28,
        );
        drawTransfer(ctx, api, request, old, themeColors.pink, model.miss);
        if (model.miss > 0.45)
          drawCard(ctx, api, 'MISS', 760, 620, 400, 105, themeColors.pink, 1, 44);
        drawCaption(
          ctx,
          api,
          'A version-8 request cannot reuse a version-7 answer',
          themeColors.cyan,
          810,
        );
      });
    else if (stage === 'recompute')
      withFocus(ctx, api, 'freshness-stage', () => {
        drawText(
          ctx,
          api,
          'RANK FROM THE CURRENT POSTINGS',
          960,
          245,
          29,
          themeColors.muted,
          'center',
        );
        const firstScore = q(state, 'freshness-first-score', 2, 0, 0.12) === 1 ? '2' : '?',
          secondScore = model.recompute === 1 ? '1' : '?';
        drawPanel(ctx, api, 300, 350, 1320, 145, themeColors.green, () => {
          drawText(ctx, api, 'M0', 350, 435, 36, themeColors.green, 'left', 'mono');
          drawText(ctx, api, 'charged + twice', 650, 435, 34);
          drawCard(ctx, api, firstScore, 1330, 378, 210, 90, themeColors.green, 1, 40);
        });
        drawPanel(ctx, api, 300, 570, 1320, 145, themeColors.green, () => {
          drawText(ctx, api, 'M3', 350, 655, 36, themeColors.green, 'left', 'mono');
          drawText(ctx, api, 'charged', 650, 655, 34);
          drawCard(ctx, api, secondScore, 1330, 598, 210, 90, themeColors.green, 1, 40);
        });
        drawCaption(
          ctx,
          api,
          'Two query words contribute to M0; charged also reaches M3',
          themeColors.cyan,
          810,
        );
      });
    else
      withFocus(ctx, api, 'freshness-stage', () => {
        drawText(ctx, api, 'STORE THE CURRENT WINNERS', 960, 260, 29, themeColors.muted, 'center');
        const key = drawCard(
          ctx,
          api,
          'Key · v8 / charged twice / k=2 / scope A',
          235,
          390,
          880,
          110,
          themeColors.cyan,
          1,
          29,
        );
        const result = drawCard(
          ctx,
          api,
          model.cache8
            ? 'Value · ' + model.cache8.map((id) => 'M' + id).join(', ')
            : 'Value · waiting for winner IDs',
          1210,
          390,
          500,
          110,
          model.cache8 ? themeColors.green : themeColors.muted,
          1,
          29,
        );
        drawTransfer(ctx, api, key, result, themeColors.green, model.store);
        drawCard(
          ctx,
          api,
          'Bounded capacity · evict older entries',
          565,
          635,
          790,
          85,
          themeColors.muted,
          1,
          27,
        );
        drawCaption(
          ctx,
          api,
          'A later matching request can reuse this current result',
          themeColors.cyan,
          810,
        );
      });
  }
}
export default {
  id: 'cache-freshness',
  draw: drawCacheFreshness,
  cues: [
    'freshness-edit',
    'freshness-postings',
    'freshness-sign',
    'freshness-publish',
    'freshness-scope',
    'freshness-miss',
    'freshness-first-score',
    'freshness-recompute',
    'freshness-store',
  ],
};
