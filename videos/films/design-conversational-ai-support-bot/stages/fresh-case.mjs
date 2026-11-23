import { hash } from '../arithmetic.mjs';
import { freshExpectedPayload } from '../fixtures.mjs';
import { supportFreshFrame } from '../construction.mjs';
import {
  drawSupportFooter,
  drawSupportHeading,
  drawSupportRectangle,
  drawSupportRow,
  drawSupportText,
  supportCueProgress,
  supportCueVisible,
  withSupportFocus,
} from '../defaults.mjs';
export function drawFreshCase(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  const done = (id) => state.cues?.[id]?.phase === 'after';
  const { C: themeColors } = api;
  {
    const expired = done('maya-expired'),
      rewindStarted = state.cues?.['maya-rewind']?.phase !== 'before',
      f = supportFreshFrame(state),
      replayAge = f.ageOnly,
      confirm = done('maya-confirm'),
      matched = f.matched,
      queued = f.acknowledged;
    if (currentBeat === 0)
      withSupportFocus(ctx, api, 'maya-premises', () =>
        drawSupportHeading(ctx, api, 'Fresh case · Maya / M240 / $240.00 verified duplicate'),
      );
    else drawSupportHeading(ctx, api, 'Fresh case · Maya / M240 / $240.00 verified duplicate');
    const left = drawSupportRectangle(ctx, api, 150, 355, 650, 445, themeColors.blue);
    drawSupportText(
      ctx,
      api,
      'Current authoritative request',
      475,
      415,
      30,
      themeColors.blue,
      'center',
    );
    [
      ['Owner', 'Maya · verified'],
      ['Amount', '$240.00 / $240.00'],
      ['Age / window', f.value.age + ' / 30 days'],
      ['Specialist threshold', '$500.00'],
    ].forEach(([k, v], i) => {
      const label = () => {
        drawSupportText(ctx, api, k, 190, 490 + i * 75, 26, themeColors.muted);
        drawSupportText(
          ctx,
          api,
          v,
          760,
          490 + i * 75,
          28,
          k === 'Age / window'
            ? replayAge
              ? themeColors.green
              : themeColors.yellow
            : themeColors.ink,
          'right',
        );
      };
      if (k === 'Age / window' && currentBeat === 0) withSupportFocus(ctx, api, 'maya-age', label);
      else label();
    });
    if (currentBeat === 0) {
      withSupportFocus(ctx, api, 'maya-predict', () => {
        if (supportCueVisible(ctx, api, 'maya-predict'))
          drawSupportText(
            ctx,
            api,
            'Does confirmation override the window?',
            1280,
            555,
            38,
            themeColors.yellow,
            'center',
          );
      });
      drawSupportText(
        ctx,
        api,
        'Exact customer confirmation present',
        1280,
        710,
        29,
        themeColors.cyan,
        'center',
      );
      drawSupportFooter(
        ctx,
        api,
        'Keep all values fixed while predicting the automated eligibility.',
      );
    } else if (currentBeat === 1) {
      withSupportFocus(ctx, api, 'maya-expired', () => {
        if (!replayAge)
          drawSupportText(
            ctx,
            api,
            expired ? '31 > 30 · specialist review' : 'Comparing age with the policy window',
            1290,
            450,
            expired ? 36 : 29,
            expired ? themeColors.pink : themeColors.muted,
            'center',
          );
      });
      withSupportFocus(ctx, api, 'maya-replay', () => {
        if (!rewindStarted)
          drawSupportText(
            ctx,
            api,
            replayAge
              ? 'Age-only replay · exact confirmation retained'
              : 'Preparing the age-only replay',
            1320,
            360,
            27,
            replayAge ? themeColors.blue : themeColors.muted,
            'center',
          );
      });
      withSupportFocus(ctx, api, 'maya-eligible', () => {
        if (replayAge && !f.rewound) {
          drawSupportRow(
            ctx,
            api,
            f.ageResult
              ? '30 ≤ 30 · policy eligibility passes'
              : '30 / 30 days · evaluating policy',
            1000,
            475,
            750,
            f.ageResult ? themeColors.green : themeColors.muted,
          );
          drawSupportText(
            ctx,
            api,
            'Same customer / invoice / amount / policy',
            1375,
            625,
            28,
            themeColors.cyan,
            'center',
          );
          drawSupportText(
            ctx,
            api,
            'Exact confirmation remains present',
            1375,
            710,
            28,
            themeColors.cyan,
            'center',
          );
          drawSupportText(
            ctx,
            api,
            'No queue acknowledgment yet',
            1375,
            800,
            28,
            themeColors.muted,
            'center',
          );
        }
      });
      withSupportFocus(ctx, api, 'maya-rewind', () => {
        if (rewindStarted)
          drawSupportText(
            ctx,
            api,
            f.rewound
              ? 'Separate replay · rewind before confirmation'
              : 'Preparing a separate unconfirmed replay',
            1320,
            360,
            27,
            f.rewound ? themeColors.blue : themeColors.muted,
            'center',
          );
      });
      if (f.rewound) {
        const fields = [
            'customer Maya',
            'invoice M240',
            'item gpu-usage',
            'request duplicate-credit',
            'amount $240.00',
            'policy US-v3',
          ],
          count = matched ? 6 : Math.floor(6 * supportCueProgress(ctx, api, 'maya-match'));
        fields.forEach((s, i) =>
          withSupportFocus(ctx, api, 'maya-match', () => {
            drawSupportRectangle(
              ctx,
              api,
              1000,
              405 + i * 65,
              750,
              56,
              i < count ? themeColors.green : themeColors.muted,
            );
            drawSupportText(
              ctx,
              api,
              s,
              1020,
              443 + i * 65,
              26,
              i < count ? themeColors.green : themeColors.muted,
            );
            if (i < count)
              drawSupportText(
                ctx,
                api,
                'MATCH',
                1720,
                443 + i * 65,
                23,
                themeColors.green,
                'right',
              );
          }),
        );
        withSupportFocus(ctx, api, 'maya-confirm', () => {
          if (!matched)
            drawSupportText(
              ctx,
              api,
              confirm ? 'Ask for exact confirmation' : 'Exact confirmation pending',
              1330,
              855,
              31,
              confirm ? themeColors.yellow : themeColors.muted,
              'center',
            );
        });
      }
      withSupportFocus(ctx, api, 'maya-pending', () => {
        drawSupportText(
          ctx,
          api,
          queued ? '1 PENDING · 0 APPLIED CREDITS' : 'Queue admission not established',
          960,
          940,
          queued ? 39 : 30,
          queued ? themeColors.green : themeColors.muted,
          'center',
        );
      });
      drawSupportFooter(ctx, api, 'Queue admission is a retained request, not settled money.');
    } else {
      withSupportFocus(ctx, api, 'maya-recover', () => {
        drawSupportRectangle(ctx, api, 1000, 400, 750, 170, themeColors.green);
        drawSupportText(
          ctx,
          api,
          'credit:M9 · same key / same payload',
          1375,
          460,
          29,
          themeColors.yellow,
          'center',
        );
        drawSupportText(
          ctx,
          api,
          'Recover original pending entry',
          1375,
          530,
          31,
          themeColors.green,
          'center',
        );
      });
      withSupportFocus(ctx, api, 'maya-effects', () => {
        if (done('maya-effects')) {
          const digest = hash(freshExpectedPayload),
            matches = f.store.length === 1 && hash(f.store[0].payload) === digest;
          drawSupportRectangle(ctx, api, 1000, 650, 750, 175, themeColors.cyan);
          drawSupportText(
            ctx,
            api,
            'Independent expected ↔ retained actual',
            1375,
            705,
            29,
            themeColors.cyan,
            'center',
          );
          drawSupportText(
            ctx,
            api,
            'Payload SHA ' + digest.slice(0, 16),
            1375,
            765,
            29,
            themeColors.green,
            'center',
          );
          drawSupportText(
            ctx,
            api,
            matches ? '1 pending · 0 applied · no duplicate' : 'HOLD · actual effect differs',
            1375,
            810,
            26,
            matches ? themeColors.green : themeColors.pink,
            'center',
          );
        } else {
          drawSupportRectangle(ctx, api, 1000, 650, 750, 175, themeColors.muted);
          drawSupportText(
            ctx,
            api,
            'Comparing retained and expected effects',
            1375,
            735,
            28,
            themeColors.muted,
            'center',
          );
        }
      });
      drawSupportFooter(
        ctx,
        api,
        'Report the observed status and reference; preserve a structured reason when stopped.',
      );
    }
    void left;
  }
}
export default {
  id: 'fresh-case',
  draw: drawFreshCase,
  cues: [
    'maya-premises',
    'maya-age',
    'maya-predict',
    'maya-expired',
    'maya-replay',
    'maya-eligible',
    'maya-rewind',
    'maya-confirm',
    'maya-match',
    'maya-pending',
    'maya-recover',
    'maya-effects',
  ],
};
