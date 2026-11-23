import { RECORDS, admitted } from '../model.mjs';
import { said } from '../document-desk.mjs';
import {
  connectRoute,
  cueStarted,
  detailText,
  focusTarget,
  heading,
  labelCard,
  optionalFocusTarget,
  recordField,
  text,
} from '../defaults.mjs';
function drawChapter(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  if (currentBeat === 3) {
    const checked = said(state, 'manifest-counts');
    heading(ctx, api, 'Run the writer with a quarantined HTML record');
    focusTarget(ctx, api, 'manifest-counts', () => {
      [
        ['native PDF', 'ready', 'untrusted_source'],
        ['OCR candidate', 'review', 'untrusted_source'],
        ['HTML quote', 'ready', 'quarantine'],
        ['Markdown', 'ready', 'untrusted_source'],
      ].forEach(([type, q, t], i) => {
        const ok = q === 'ready' && t === 'untrusted_source';
        const y = 355 + i * 125;
        recordField(
          ctx,
          api,
          type,
          q + ' / ' + t,
          210,
          y,
          1130,
          checked ? (ok ? themeColors.green : themeColors.pink) : themeColors.blue,
        );
        detailText(
          ctx,
          api,
          checked ? (ok ? 'admit' : 'block') : 'awaiting check',
          1530,
          y + 45,
          30,
          checked ? (ok ? themeColors.green : themeColors.pink) : themeColors.muted,
          'center',
        );
      });
    });
    if (cueStarted(ctx, api, 'manifest-limits'))
      focusTarget(ctx, api, 'manifest-limits', () => {
        detailText(
          ctx,
          api,
          '2 admitted / 2 blocked · supplied quality and trust labels only',
          960,
          905,
          31,
          themeColors.yellow,
          'center',
        );
        detailText(
          ctx,
          api,
          'Writer must also validate text, provenance, fields and current reader permissions.',
          960,
          975,
          27,
          themeColors.muted,
          'center',
        );
      });
    return true;
  }
  return false;
}
export function drawEvidenceGate(ctx, scene, state, api) {
  if (drawChapter(ctx, scene, state, api)) return;
  const { C: themeColors, components: components } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1),
    phaseForBeat = (i) =>
      currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, 0.08, 0.9);
  {
    const checked = labelCard(
      ctx,
      api,
      'Admission checks',
      795,
      455,
      430,
      themeColors.yellow,
      1,
      100,
      33,
    );
    text(ctx, api, 'quality · structure · provenance', 1010, 625, 28, themeColors.yellow);
    const nodes = RECORDS.map((record, i) =>
      optionalFocusTarget(
        ctx,
        api,
        'evidence-gate-object-native-pdf-reviewed-scan-1s-needs-review-html-shel-57',
        () =>
          labelCard(
            ctx,
            api,
            [
              'Native PDF · reviewed',
              'Scan · 1S needs review',
              'HTML · shell removed',
              'Markdown · fences kept',
            ][i],
            150,
            350 + i * 130,
            470,
            i === 1 ? themeColors.pink : themeColors.blue,
            1,
            85,
            29,
          ),
      ),
    );
    components.fade(phaseForBeat(0), () => {
      const busX = 700;
      api.line(ctx, 700, 392.5, 700, 782.5, themeColors.cyan, 3);
      optionalFocusTarget(ctx, api, 'evidence-gate-simulation-58', () =>
        nodes.forEach((node, i) => {
          const y = 392.5 + i * 130;
          api.line(
            ctx,
            node.x + node.width + 15,
            y,
            700,
            y,
            i === 1 ? themeColors.pink : themeColors.cyan,
            3,
          );
          api.circle(ctx, 700, y, 5, i === 1 ? themeColors.pink : themeColors.cyan);
        }),
      );
      api.arrow(ctx, 700, 505, checked.x - 15, 505, themeColors.cyan, 3);
    });
    const released = currentBeat >= 2 || said(state, 'evidence-gate-beat-2-focus-1');
    if (currentBeat === 1 && !released) optionalFocusTarget(ctx, api, 'evidence-gate-simulation-60', () =>
      text(ctx, api, 'Checking the writer inputs…', 1550, 520, 29, themeColors.muted));
    optionalFocusTarget(ctx, api, 'evidence-gate-simulation-60', () =>
      RECORDS.filter(admitted).forEach((record, i) => {
        const node = labelCard(
          ctx,
          api,
          ['PDF rollback rule · p7', 'HTML main content', 'Markdown sections'][i],
          1370,
          350 + i * 150,
          400,
          themeColors.green,
          released ? 1 : 0,
          100,
          29,
        );
        if (released) connectRoute(ctx, api, checked, node, phaseForBeat(1), themeColors.green);
      }),
    );
    if (released) labelCard(
      ctx,
      api,
      'OCR stays in the review queue',
      1050,
      820,
      690,
      themeColors.pink,
      1,
      85,
      31,
    );
    if (api.focus.visible('admit-indexed'))
      api.focus.target('admit-indexed', () =>
        text(
          ctx,
          api,
          released ? 'Indexed rollback rule: 15 minutes · page 7 · source revision 7' : 'Checking the reviewed records…',
          960,
          945,
          31,
          themeColors.green,
        ),
      );
  }
}
export default {
  id: 'evidence-gate',
  draw: drawEvidenceGate,
  cues: [
    'evidence-gate-beat-1-focus-1',
    'evidence-gate-beat-1-focus-2',
    'evidence-gate-beat-2-focus-1',
    'evidence-gate-beat-2-focus-2',
    'admit-indexed',
    'evidence-gate-beat-3-focus-1',
    'evidence-gate-beat-3-focus-2',
    'manifest-counts',
    'manifest-limits',
  ],
};
