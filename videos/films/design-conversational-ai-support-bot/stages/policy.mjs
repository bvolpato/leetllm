import { money, tuple } from '../arithmetic.mjs';
import { small } from '../fixtures.mjs';
import { confirmationFrame, sampleModel } from '../model.mjs';
import {
  drawSupportFooter,
  drawSupportHeading,
  drawSupportLine,
  drawSupportRow,
  drawSupportText,
  supportCueVisible,
  text,
  withSupportFocus,
} from '../defaults.mjs';
export function drawPolicy(ctx, scene, state, api) {
  if (drawPolicyContinuation(ctx, scene, state, api)) return;
  const { C: themeColors, components: components, teaching: teaching } = api,
    modelState = sampleModel('policy', state),
    currentBeat = modelState.b;
  if (state.cues?.['change-proposal'])
    Object.assign(
      modelState,
      confirmationFrame(currentBeat, api.focus.visible('change-proposal') ? 1 : 0),
    );
  if (state.cues) {
  }
  {
    text(
      ctx,
      api,
      currentBeat === 0
        ? 'Original high-value request'
        : 'Separate partial-credit request · same invoice',
      960,
      280,
      38,
      themeColors.yellow,
      'center',
    );
    if (currentBeat === 0) {
      const checks = [
        ['Amount', money(modelState.current.amount)],
        ['Invoice total', money(modelState.current.total)],
        ['Age / window', `${modelState.current.age} / 30 days`],
        ['Specialist at', '500.00 USD'],
      ];
      api.focus.target('business-checks', () =>
        teaching.grid({
          x: 210,
          y: 380,
          width: 1500,
          height: 360,
          rows: 4,
          columns: 2,
          labels: checks,
          fontSize: 32,
          fill: themeColors.panel,
          stroke: themeColors.muted,
          textColor: themeColors.ink,
        }),
      );
    } else {
      const fields = Object.keys(tuple(modelState.current)),
        checked = state.cues?.['compare-confirmation']
          ? Math.ceil(6 * api.focus.progress('compare-confirmation', 0))
          : currentBeat === 1
            ? 0
            : Math.min(6, Math.floor(api.phase(state.beatP ?? 0, 0.04, 0.34) * 6 + 1e-9));
      text(ctx, api, 'Proposed action · current state', 475, 350, 28, themeColors.blue, 'center');
      text(
        ctx,
        api,
        currentBeat === 1 ? 'Ask the customer to approve' : 'Retained customer confirmation',
        1445,
        350,
        28,
        currentBeat === 1 ? themeColors.muted : themeColors.green,
        'center',
      );
      fields.forEach((field, i) => {
        const y = 385 + i * 72,
          value = modelState.current[field],
          approved = modelState.confirmation?.[field] ?? small[field],
          matches = value === approved;
        const label = field === 'amount' ? money(value) : String(value),
          approvedLabel = field === 'amount' ? money(approved) : String(approved);
        api.focus.target('proposed-tuple', () =>
          components.panel({
            x: 150,
            y,
            width: 650,
            height: 61,
            fill: themeColors.panel,
            stroke: field === 'amount' && modelState.changed ? themeColors.pink : themeColors.blue,
          }),
        );
        api.focus.target('confirmed-tuple', () =>
          components.panel({
            x: 1120,
            y,
            width: 650,
            height: 61,
            fill: themeColors.panel,
            stroke:
              currentBeat === 1
                ? themeColors.muted
                : i < checked
                  ? matches
                    ? themeColors.green
                    : themeColors.pink
                  : themeColors.muted,
          }),
        );
        if (field === 'amount' && modelState.changed)
          api.focus.target('proposed-tuple', () =>
            teaching.changeCue(
              {
                x: 165,
                y: y + 4,
                width: 620,
                height: 53,
                from: 3500,
                to: value,
                progress: 1,
                emphasis: 1,
                color: themeColors.pink,
                restColor: themeColors.pink,
              },
              (cue) => text(ctx, api, `${field}: ${money(cue.value)}`, 180, y + 41, 28, cue.color),
            ),
          );
        else
          api.focus.target('proposed-tuple', () =>
            text(ctx, api, `${field}: ${label}`, 180, y + 41, 28, themeColors.blue),
          );
        api.focus.target('confirmed-tuple', () =>
          text(
            ctx,
            api,
            `${field}: ${approvedLabel}`,
            1150,
            y + 41,
            28,
            currentBeat === 1
              ? themeColors.muted
              : i < checked
                ? matches
                  ? themeColors.green
                  : themeColors.pink
                : themeColors.muted,
          ),
        );
        if (i < checked) {
          api.focus.target('tuple-comparisons', () =>
            api.arrow(
              ctx,
              825,
              y + 30,
              1095,
              y + 30,
              matches ? themeColors.green : themeColors.pink,
              3,
            ),
          );
          api.focus.target('tuple-comparisons', () =>
            text(
              ctx,
              api,
              matches ? 'MATCH' : 'DIFFERS',
              960,
              y + 20,
              20,
              matches ? themeColors.green : themeColors.pink,
              'center',
            ),
          );
        }
      });
      text(
        ctx,
        api,
        currentBeat === 1
          ? 'Confirmation is pending for all six values'
          : modelState.changed
            ? 'Old confirmation stays fixed while the proposed amount changes'
            : 'Compare the complete tuple before queue admission',
        960,
        890,
        29,
        modelState.changed ? themeColors.pink : themeColors.cyan,
        'center',
      );
    }
    const checking =
      currentBeat === 2 &&
      (state.cues?.['compare-confirmation']
        ? api.focus.progress('compare-confirmation', 0) < 1
        : (state.beatP ?? 0) < 0.34);
    api.focus.target('action-outcome', () =>
      text(
        ctx,
        api,
        checking ? 'CHECKING CONFIRMATION' : modelState.outcome,
        960,
        970,
        39,
        checking
          ? themeColors.cyan
          : modelState.outcome === 'QUEUE ELIGIBLE'
            ? themeColors.green
            : themeColors.yellow,
        'center',
      ),
    );
    text(
      ctx,
      api,
      checking
        ? 'Compare all six fields before queue eligibility'
        : modelState.changed
          ? 'Reconfirm the changed proposal · insertion still rechecks authoritative state'
          : modelState.reason,
      960,
      1035,
      28,
      modelState.changed ? themeColors.pink : themeColors.muted,
      'center',
    );
  }
}
function drawPolicyContinuation(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  if (currentBeat < 3) return false;
  const { C: themeColors } = api;
  {
    drawSupportHeading(ctx, api, 'The amount boundary and the amount contract are separate');
    const inclusive = supportCueVisible(ctx, api, 'inclusive-boundary'),
      variants = supportCueVisible(ctx, api, 'two-amount-contracts');
    drawSupportLine(ctx, api, 260, 415, 1660, 415, themeColors.muted, 4);
    [
      [0, 260],
      [500, 960],
      [1000, 1660],
    ].forEach(([v, x]) => {
      drawSupportLine(ctx, api, x, 395, x, 435, v >= 500 ? themeColors.pink : themeColors.muted, 4);
      drawSupportText(
        ctx,
        api,
        money(v * 100),
        x,
        485,
        30,
        v === 500 ? themeColors.pink : themeColors.muted,
        'center',
      );
    });
    drawSupportText(ctx, api, '$900 request', 1520, 350, 28, themeColors.pink, 'center');
    drawSupportLine(ctx, api, 1520, 370, 1520, 435, themeColors.pink, 4);
    drawSupportText(
      ctx,
      api,
      'One-cent boundary detail · $499.98 to $500.02',
      700,
      570,
      28,
      themeColors.muted,
      'center',
    );
    drawSupportLine(ctx, api, 300, 640, 1100, 640, themeColors.muted, 4);
    [
      [499.99, 500],
      [500, 700],
    ].forEach(([v, x]) => {
      drawSupportLine(ctx, api, x, 615, x, 670, v >= 500 ? themeColors.pink : themeColors.green, 5);
      drawSupportText(
        ctx,
        api,
        money(v * 100),
        x,
        730,
        32,
        v >= 500 ? themeColors.pink : themeColors.green,
        'center',
      );
    });
    withSupportFocus(ctx, api, 'inclusive-boundary', () => {
      if (inclusive) {
        drawSupportLine(ctx, api, 960, 380, 960, 445, themeColors.pink, 6);
        drawSupportLine(ctx, api, 700, 600, 700, 675, themeColors.pink, 6);
        drawSupportText(ctx, api, '≥ $500', 1470, 605, 38, themeColors.pink, 'center');
        drawSupportText(ctx, api, 'Specialist review', 1470, 680, 32, themeColors.pink, 'center');
      }
    });
    withSupportFocus(ctx, api, 'two-amount-contracts', () => {
      if (variants) {
        drawSupportRow(
          ctx,
          api,
          'Reference toy: one request ≤ verified duplicate',
          150,
          815,
          1620,
          themeColors.blue,
        );
        drawSupportRow(
          ctx,
          api,
          'Reader toy: request = full verified duplicate',
          150,
          905,
          1620,
          themeColors.cyan,
        );
      }
    });
    drawSupportFooter(ctx, api, 'Customer consent cannot change either policy predicate.');
  }
  return true;
}
export default {
  id: 'policy',
  draw: drawPolicy,
  cues: [
    'specialist-threshold',
    'small-proposal',
    'bind-confirmation',
    'compare-confirmation',
    'queue-eligible',
    'change-proposal',
    'inclusive-boundary',
    'two-amount-contracts',
  ],
};
