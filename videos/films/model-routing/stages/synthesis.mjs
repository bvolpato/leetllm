import { sampleModel } from '../construction.mjs';
import { progress, after } from '../timing.mjs';
import { violations } from '../model.mjs';
import { card, cents, text } from '../defaults.mjs';
export function drawSynthesis(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel('synthesis', state),
    currentBeat = modelState.step;
  {
    const grant = modelState.grant;
    if (currentBeat === 1) {
      text(
        ctx,
        api,
        'Prior grant   /   human approval HR-8',
        960,
        275,
        30,
        themeColors.muted,
        'center',
      );
      card(
        ctx,
        api,
        'R900   /   explanation timed out before delivery',
        180,
        335,
        1540,
        themeColors.pink,
        85,
      );
      const operation = api.focus.target('tool-operation', () =>
        card(
          ctx,
          api,
          'G27 · grant viewer\nuser-17 → project-42',
          180,
          500,
          600,
          themeColors.blue,
          140,
        ),
      );
      const ledger = api.focus.target('grant-ledger', () =>
        card(
          ctx,
          api,
          `Grant ledger\n${grant.effects} committed effect`,
          1120,
          500,
          600,
          themeColors.green,
          140,
        ),
      );
      if (grant.replayProgress > 0)
        teaching.transfer({
          source: {
            shape: operation,
            opacity: 1,
          },
          target: {
            shape: ledger,
            opacity: 1,
          },
          progress: grant.replayProgress,
          color: themeColors.yellow,
          particle: {
            radius: 8,
            fill: themeColors.yellow,
          },
          margin: 4,
        });
      text(ctx, api, 'Scoped key: ' + grant.receipt.key, 190, 700, 30, themeColors.blue);
      text(
        ctx,
        api,
        'Payload SHA-256: ' + grant.receipt.payloadHash.slice(0, 12) + '…',
        190,
        755,
        28,
        themeColors.muted,
      );
      text(
        ctx,
        api,
        grant.replayed
          ? 'Authorized + same key + same payload → reuse'
          : 'Existing receipt · ' + grant.receipt.id + ' · committed',
        1420,
        715,
        27,
        grant.replayed ? themeColors.yellow : themeColors.green,
        'center',
      );
      const input = api.focus.target('retained-receipt', () =>
        card(
          ctx,
          api,
          grant.consumed
            ? 'R900 context · retained receipt ' + grant.receipt.id
            : 'R900 context · receipt pending',
          180,
          840,
          650,
          grant.consumed ? themeColors.green : themeColors.muted,
          90,
        ),
      );
      const receipt = api.focus.target('retained-receipt', () =>
        card(
          ctx,
          api,
          grant.receipt.id + ' · host review ' + grant.receipt.reviewReceipt,
          1120,
          840,
          600,
          themeColors.green,
          90,
        ),
      );
      if (grant.consumeProgress > 0)
        teaching.transfer({
          source: {
            shape: receipt,
            opacity: 1,
          },
          target: {
            shape: input,
            opacity: 1,
          },
          progress: grant.consumeProgress,
          color: themeColors.green,
          particle: {
            radius: 8,
            fill: themeColors.green,
          },
          margin: 4,
        });
      text(
        ctx,
        api,
        grant.replayed
          ? 'Matching scoped retry returns the same receipt · grant effects remain ' + grant.effects
          : grant.consumed
            ? 'The explanation consumes the retained receipt · grant effects remain ' +
              grant.effects
            : 'The grant service has already recorded one write',
        960,
        1000,
        28,
        themeColors.yellow,
        'center',
      );
      return;
    }
    if (currentBeat === 2) {
      const run = modelState.runs[1];
      const add = progress(state, 'join-attempts', 2, 0.04, 0.44);
      const sum = after(state, 'sum-charges', 2, 0.7);
      text(ctx, api, 'R900    /    generation attempts', 160, 295, 43, themeColors.ink);
      text(ctx, api, 'Settled charge', 1140, 295, 35, themeColors.muted);
      run.spans.forEach((span, i) => {
        const y = 455 + 155 * i;
        const part = Math.min(1, Math.max(0, 2 * add - i));
        api.focus.target('attempt-ledger', () => {
          text(
            ctx,
            api,
            span.lane.id + (i === 0 ? '    Timeout' : '    Reply returned'),
            160,
            y,
            37,
            i ? themeColors.green : themeColors.blue,
          );
          text(ctx, api, span.end.toLocaleString('en-US') + ' ms', 615, y, 35, themeColors.muted);
          api.line(ctx, 865, y - 12, 1050, y - 12, themeColors.muted, 2);
          if (part > 0) api.circle(ctx, 865 + 185 * part, y - 12, 10, themeColors.cyan);
          text(ctx, api, part === 1 ? cents(span.charge) : '·', 1140, y, 43, themeColors.ink);
        });
      });
      api.focus.target('attempt-total', () => {
        api.line(ctx, 1120, 665, 1630, 665, themeColors.muted, 3);
        text(
          ctx,
          api,
          sum ? cents(run.spent) : '?',
          1140,
          755,
          60,
          sum ? themeColors.yellow : themeColors.muted,
        );
      });
      api.focus.target('prior-effect', () =>
        text(
          ctx,
          api,
          grant.receipt.key +
            '    /    ' +
            grant.receipt.id +
            '    /    ' +
            grant.effects +
            ' committed grant',
          160,
          940,
          36,
          themeColors.cyan,
        ),
      );
      return;
    }
    const cases = ['Primary succeeds', 'Pre-output timeout', 'Input 70,000'];
    ['Replay case', 'Lane', 'Attempts', 'Elapsed'].forEach((value, i) =>
      text(ctx, api, value, [160, 900, 1200, 1540][i], 340, 30, themeColors.muted),
    );
    modelState.runs.forEach((run, i) => {
      const y = 470 + i * 150;
      const show = progress(state, 'executed-cases', 0, 0.08, 0.68) >= (i + 1) / 3;
      [
        cases[i],
        run.served?.id ?? 'escalate',
        String(run.spans.length),
        `${run.elapsed} ms`,
      ].forEach((value, j) =>
        api.focus.target('replay-outcomes', () =>
          text(
            ctx,
            api,
            j === 0 || show ? value : '·',
            [160, 900, 1200, 1540][j],
            y,
            31,
            !show ? themeColors.muted : run.served ? themeColors.green : themeColors.pink,
          ),
        ),
      );
    });
    const violationsFound = modelState.runs
      .filter((run) => run.served)
      .reduce((sum, run) => sum + violations(run.served, run.contract).length, 0);
    api.focus.target('field-violations', () =>
      text(
        ctx,
        api,
        after(state, 'executed-cases', 0, 0.68)
          ? `Failed contract checks on served routes   ${violationsFound}`
          : 'One request per replay',
        960,
        950,
        34,
        themeColors.yellow,
        'center',
      ),
    );
  }
}
export default {
  id: 'synthesis',
  draw: drawSynthesis,
  cues: [
    'executed-cases',
    'committed-effect',
    'consume-receipt',
    'replay-write',
    'join-attempts',
    'sum-charges',
  ],
};
