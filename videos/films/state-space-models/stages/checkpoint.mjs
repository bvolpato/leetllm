import { run } from '../arithmetic.mjs';
import { checkpointSnapshot } from '../model.mjs';
import { box, card, cueDone, text } from '../defaults.mjs';
export function drawCheckpoint(ctx, scene, state, api) {
  const { C: themeColors, components: components, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0);
  {
    const checkpoint = checkpointSnapshot(currentBeat, progress);
    if (currentBeat === 2) {
      const wrong = cueDone(state, 'wrong-branch', 2, 0.36);
      api.focus.target('boundary-comparison', () => {
        text(
          ctx,
          api,
          'Apply the same correction input, 4',
          960,
          310,
          46,
          themeColors.ink,
          'center',
        );
        for (const [i, old] of [checkpoint.accepted, checkpoint.provisional].entries()) {
          const x = 495 + i * 930,
            color = i ? themeColors.pink : themeColors.green;
          text(
            ctx,
            api,
            i ? 'After rejected 77' : 'After accepted 99',
            x,
            445,
            43,
            color,
            'center',
          );
          text(ctx, api, '(' + old + ' + 4) ÷ 2', x, 566, 49, themeColors.ink, 'center');
          box(
            ctx,
            api,
            i && !wrong ? '?' : String(i ? checkpoint.contaminated : checkpoint.reference),
            x - 215,
            640,
            430,
            125,
            color,
            55,
          );
        }
        text(
          ctx,
          api,
          'Direct run on accepted inputs   ·   ' + checkpoint.reference,
          960,
          908,
          38,
          themeColors.green,
          'center',
        );
      });
      return;
    }
    if (state.cues) {
      checkpoint.restoreProgress = api.focus.progress('restore-checkpoint', 0);
      checkpoint.correctionProgress = api.focus.progress('apply-correction', 0);
      checkpoint.restored = checkpoint.restoreProgress === 1;
      checkpoint.corrected = checkpoint.restored && checkpoint.correctionProgress === 1;
      checkpoint.current = checkpoint.corrected
        ? checkpoint.reference
        : checkpoint.restored
          ? checkpoint.accepted
          : checkpoint.provisional;
    }
    api.focus.target('checkpoint-prefix-1-25-accept-99-reject-77', () =>
      text(
        ctx,
        api,
        'prefix 1.25 → accept 99 → reject 77',
        960,
        285,
        36,
        themeColors.muted,
        'center',
      ),
    );
    const prefix = run([3, 1], 0.5, 0.5).at(-1),
      valid = run([99], 0.5, 0.5, prefix).at(-1),
      bad = run([77], 0.5, 0.5, valid).at(-1);
    const nodes = [
      {
        id: 'saved',
        label: `accepted ${valid.toFixed(3)}`,
        x: 250,
        y: 400,
        width: 380,
        height: 110,
        color: themeColors.green,
        fontSize: 36,
      },
      {
        id: 'reject',
        label: `rejected ${bad.toFixed(4)}`,
        x: 1250,
        y: 400,
        width: 400,
        height: 110,
        color: themeColors.pink,
        fontSize: 36,
      },
    ];
    const painted = nodes.map((node) =>
      api.focus.target('checkpoint-readout', () =>
        components.card({
          label: node.label,
          x: node.x,
          y: node.y,
          width: node.width,
          height: node.height,
          fontSize: node.fontSize,
          fill: themeColors.panel,
          stroke: node.color,
          textColor: themeColors.ink,
        }),
      ),
    );
    api.connect(ctx, painted[0], painted[1], {
      color: themeColors.pink,
      gap: 14,
    });
    const live = api.focus.target('checkpoint-live', () =>
      components.card({
        label: `Live state ${checkpoint.current}`,
        x: 710,
        y: 670,
        width: 500,
        height: 105,
        fontSize: 36,
        padding: 14,
        fill: themeColors.panel,
        stroke: checkpoint.corrected ? themeColors.green : themeColors.yellow,
        textColor: checkpoint.corrected ? themeColors.green : themeColors.yellow,
      }),
    );
    api.focus.target('checkpoint-readout-2', () =>
      text(
        ctx,
        api,
        checkpoint.corrected
          ? 'Correction applied to restored checkpoint'
          : checkpoint.restored
            ? 'Accepted checkpoint restored'
            : checkpoint.restoreProgress > 0
              ? 'Restore accepted checkpoint'
              : 'Provisional state contains rejected input',
        960,
        355,
        36,
        themeColors.green,
        'center',
      ),
    );
    if (checkpoint.restoreProgress > 0 && !checkpoint.corrected) {
      teaching.transfer({
        source: {
          shape: painted[0],
          opacity: 1,
        },
        target: {
          shape: live,
          opacity: 1,
        },
        progress: checkpoint.restoreProgress,
        color: themeColors.green,
        gap: 14,
        width: 3,
        particle: checkpoint.restored
          ? undefined
          : {
              radius: 8,
              fill: themeColors.green,
            },
      });
    }
    if (checkpoint.correctionProgress > 0) {
      const input = api.focus.target('checkpoint-input', () =>
        card(ctx, api, 'correction 4', 1310, 670, 390, themeColors.pink),
      );
      teaching.transfer({
        source: {
          shape: input,
          opacity: 1,
        },
        target: {
          shape: live,
          opacity: 1,
        },
        progress: checkpoint.correctionProgress,
        color: themeColors.pink,
        gap: 14,
        width: 3,
        particle: checkpoint.corrected
          ? undefined
          : {
              radius: 8,
              fill: themeColors.pink,
            },
      });
    }
    if (checkpoint.corrected) {
      const referenceEarned =
        !state.cues || state.cues['ssm-checkpoint-reference']?.phase === 'after';
      api.focus.target('checkpoint-readout-3', () =>
        text(
          ctx,
          api,
          referenceEarned
            ? `correction 4 → ${checkpoint.current} · direct reference ${checkpoint.reference}`
            : 'Compare with the direct reference',
          960,
          900,
          35,
          referenceEarned ? themeColors.green : themeColors.muted,
          'center',
        ),
      );
    }
  }
}
export default {
  id: 'checkpoint',
  draw: drawCheckpoint,
  cues: [
    'accepted-state',
    'rejected-input',
    'restore-checkpoint',
    'apply-correction',
    'reference-state',
    'ssm-checkpoint-reference',
    'wrong-branch',
  ],
};
