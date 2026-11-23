import { money } from '../arithmetic.mjs';
import { sampleModel } from '../model.mjs';
import {
  card,
  drawSupportArrow,
  drawSupportFooter,
  drawSupportHeading,
  drawSupportRectangle,
  drawSupportRow,
  drawSupportText,
  supportCueVisible,
  text,
  withSupportFocus,
} from '../defaults.mjs';
export function drawHandoff(ctx, scene, state, api) {
  if (drawHandoffContinuation(ctx, scene, state, api)) return;
  const { C: themeColors, components: components, teaching: teaching } = api,
    modelState = sampleModel('handoff', state),
    currentBeat = modelState.b;
  if (state.cues) {
  }
  const route = (a, z, color = themeColors.cyan) =>
    teaching.transfer({
      source: {
        shape: a,
        opacity: 1,
      },
      target: {
        shape: z,
        opacity: 1,
      },
      progress: modelState.q,
      color,
      particle: {
        radius: 7,
        fill: color,
      },
      margin: 3,
    });
  {
    if (currentBeat === 2) {
      text(
        ctx,
        api,
        'Destination-specific allowlist · identity unverified',
        960,
        285,
        38,
        themeColors.yellow,
        'center',
      );
      const source = api.focus.target('private-host-record', () =>
        components.panel({
          x: 140,
          y: 350,
          width: 620,
          height: 560,
          fill: themeColors.panel,
          stroke: themeColors.pink,
        }),
      );
      text(ctx, api, 'HOST CASE · retained locally', 450, 405, 28, themeColors.pink, 'center');
      [
        'customer: Alex',
        'invoice: A10234',
        'amount: $900.00',
        'policy: US-v3',
        'revision: 4',
      ].forEach((name, i) => {
        api.focus.target('private-host-record', () =>
          card(ctx, api, name, 170, 435 + i * 86, 560, themeColors.muted, 66),
        );
      });
      const filter = api.focus.target('delivery-allowlist', () =>
        components.card({
          label: 'Allowlist\n2 fields',
          x: 850,
          y: 540,
          width: 270,
          height: 140,
          fontSize: 28,
          baselineOffset: -12,
          fill: themeColors.panel,
          stroke: themeColors.yellow,
          textColor: themeColors.yellow,
        }),
      );
      const output = api.focus.target('restricted-packet', () =>
        components.panel({
          x: 1250,
          y: 450,
          width: 570,
          height: 290,
          fill: themeColors.panel,
          stroke: themeColors.green,
        }),
      );
      text(ctx, api, 'RESTRICTED REVIEW PACKET', 1535, 405, 26, themeColors.green, 'center');
      api.focus.target('restricted-packet', () =>
        card(ctx, api, 'ticket: ' + modelState.value.ticket, 1275, 475, 520, themeColors.green, 80),
      );
      api.focus.target('restricted-packet', () =>
        card(ctx, api, modelState.value.reason, 1275, 605, 520, themeColors.green, 100),
      );
      route(source, filter, themeColors.yellow);
      route(filter, output, themeColors.green);
      text(
        ctx,
        api,
        'Only ticket and verification reason leave this boundary',
        960,
        990,
        32,
        themeColors.yellow,
        'center',
      );
      return;
    }
    const allowed = Object.entries(modelState.value);
    text(
      ctx,
      api,
      currentBeat === 2
        ? 'Identity unverified · restricted output'
        : 'Specialist packet · original high-value case',
      960,
      285,
      38,
      themeColors.yellow,
      'center',
    );
    allowed.forEach(([name, value], i) => {
      const column = i % 2,
        row = Math.floor(i / 2);
      api.focus.target('specialist-packet', () =>
        card(
          ctx,
          api,
          `${name}: ${name === 'amount' ? money(value) : value}`,
          160 + column * 870,
          400 + row * 125,
          770,
          currentBeat === 2 ? themeColors.pink : themeColors.blue,
          90,
        ),
      );
    });
    api.focus.target('delivery-acknowledgment', () =>
      text(
        ctx,
        api,
        modelState.acknowledged
          ? `Acknowledged review queue · ${modelState.receipt.reference}`
          : currentBeat === 2
            ? 'Private customer and invoice fields excluded'
            : 'Prepared packet · awaiting delivery acknowledgment',
        960,
        980,
        34,
        modelState.acknowledged ? themeColors.green : themeColors.yellow,
        'center',
      ),
    );
  }
}
function drawHandoffContinuation(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  if (currentBeat < 3) return false;
  const { C: themeColors } = api;
  {
    drawSupportHeading(
      ctx,
      api,
      'Queue acknowledgment and human authorization are different receipts',
    );
    const scope = supportCueVisible(ctx, api, 'approval-scope'),
      current = supportCueVisible(ctx, api, 'resume-current'),
      unknown = supportCueVisible(ctx, api, 'unknown-effect');
    ['WAITING', 'ACCEPTED', 'RESOLVED'].forEach((s, i) => {
      drawSupportRow(
        ctx,
        api,
        s,
        180 + i * 600,
        370,
        360,
        i === 0 ? themeColors.yellow : themeColors.blue,
      );
      if (i < 2)
        drawSupportArrow(ctx, api, 565 + i * 600, 402, 755 + i * 600, 402, themeColors.muted);
    });
    drawSupportRow(ctx, api, 'EXPIRED', 780, 500, 360, themeColors.pink);
    drawSupportArrow(ctx, api, 360, 450, 755, 532, themeColors.pink);
    drawSupportArrow(ctx, api, 960, 450, 960, 480, themeColors.pink);
    withSupportFocus(ctx, api, 'approval-scope', () => {
      if (scope) {
        drawSupportRectangle(ctx, api, 180, 610, 1560, 135, themeColors.blue);
        drawSupportText(
          ctx,
          api,
          'Signed review service receipt',
          960,
          655,
          32,
          themeColors.blue,
          'center',
        );
        drawSupportText(
          ctx,
          api,
          'Exact action · policy · reviewer permissions · expiry · one-time use',
          960,
          715,
          29,
          themeColors.cyan,
          'center',
        );
      }
    });
    withSupportFocus(ctx, api, 'resume-current', () => {
      if (current) {
        drawSupportRow(
          ctx,
          api,
          'Resume check: live ownership / evidence / balance / current policy',
          180,
          785,
          1560,
          themeColors.yellow,
        );
        drawSupportText(
          ctx,
          api,
          'Correct persisted thread and checkpoint restore state, not business permission.',
          960,
          900,
          28,
          themeColors.muted,
          'center',
        );
      }
    });
    withSupportFocus(ctx, api, 'unknown-effect', () => {
      if (unknown)
        drawSupportText(
          ctx,
          api,
          'Submission timeout → UNKNOWN until original operation is reconciled',
          960,
          955,
          31,
          themeColors.pink,
          'center',
        );
    });
    drawSupportFooter(
      ctx,
      api,
      'A review task can expire; the resumed action must still earn current authority.',
    );
  }
  return true;
}
export default {
  id: 'handoff',
  draw: drawHandoff,
  cues: [
    'prepare-packet',
    'matching-ack',
    'restrict-output',
    'approval-scope',
    'resume-current',
    'unknown-effect',
  ],
};
