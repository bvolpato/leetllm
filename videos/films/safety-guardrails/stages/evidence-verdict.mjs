import { lessonFont } from '../../../lib/fonts.mjs';
import { guardCue, guardDone } from '../model.mjs';

const claims = [
  ['Restoring access requires manager approval', 'evidence-verdict-entailed', 'Entailed', 'green'],
  ['The rollback window is 2 hours', 'evidence-verdict-contradiction', 'Contradiction', 'pink'],
  ['The on-call rotation is weekly', 'evidence-verdict-neutral', 'Neutral', 'yellow'],
];

export function paintEvidenceVerdict(ctx, scene, state, api) {
  const { C, text, rect, line, focus } = api;
  const beat = state.beat ?? 0;
  const step = (id, b, a, z) => guardCue(state, id, b, a, z);
  const done = (id, b, a, z) => guardDone(state, id, b, a, z);
  if (beat < 2) {
    focus.target('evidence-premise', () => {
      text(ctx, 'Runbook', 130, 259, 34, C.blue);
      rect(ctx, 130, 290, 1660, 178, C.panel, C.blue, 6);
      text(ctx, 'Restore of production API access requires manager approval.', 166, 361, 41, C.ink);
      text(ctx, 'The rollback window is 30 minutes after deploy.', 166, 428, 41, C.ink);
    });
    if (beat === 0) {
      text(ctx, 'Claim', 160, 555, 30, C.muted);
      text(ctx, 'Hand-labeled verdict', 1380, 555, 30, C.muted);
      claims.forEach(([claim, id, verdict, color], i) => {
        const y = 638 + i * 122;
        focus.target(id + '-row', () => {
          text(ctx, claim, 160, y, 41, C.ink);
          const revealed = done(id, 0, 0.28 + i * 0.24, 0.45 + i * 0.24);
          text(ctx, revealed ? verdict : '?', 1380, y, 40, revealed ? C[color] : C.muted);
        });
      });
    } else {
      const verdict = done('evidence-verdict-direction', 1, 0.25, 0.52);
      focus.target('evidence-logic', () => {
        text(ctx, 'Draft claim', 160, 560, 31, C.muted);
        const prefix = '“Manager approval ';
        ctx.save();
        ctx.font = lessonFont(43);
        const wordStart = 160 + ctx.measureText(prefix).width;
        const wordEnd = wordStart + ctx.measureText('alone').width;
        ctx.restore();
        text(ctx, prefix + 'alone is enough to restore access.”', 160, 645, 43, C.ink);
        line(ctx, wordStart, 663, wordEnd, 663, C.yellow, 4);
        text(ctx, verdict ? 'Unsupported' : '?', 1440, 645, 40, verdict ? C.yellow : C.muted);
        if (verdict)
          text(
            ctx,
            'The runbook gives one requirement. Other requirements are open.',
            160,
            743,
            35,
            C.yellow,
          );
      });
      if (step('evidence-verdict-unknown', 1, 0.62, 0.93) > 0)
        focus.target('evidence-empty', () => {
          line(ctx, 160, 830, 1760, 830, C.muted, 2);
          text(ctx, 'Missing source, missing claim, or unrecognized pair', 160, 911, 34, C.ink);
          text(ctx, 'Hold for review', 1440, 911, 34, C.yellow);
        });
    }
    return;
  }

  focus.target('evidence-receipt', () => {
    text(ctx, 'Evidence for one claim', 140, 270, 38, C.cyan);
    rect(ctx, 140, 305, 1640, 310, C.panel, C.cyan, 6);
    text(ctx, 'Claim', 185, 386, 31, C.muted);
    text(ctx, '“The rollback window is two hours.”', 505, 386, 40, C.ink);
    text(ctx, 'Runbook', 185, 469, 31, C.muted);
    text(ctx, '“The rollback window is 30 minutes after deploy.”', 505, 469, 40, C.ink);
    text(ctx, 'Verdict', 185, 558, 31, C.muted);
    text(ctx, 'Contradiction', 505, 558, 40, C.pink);
    if (step('evidence-verdict-retain', 2, 0.3, 0.52) > 0)
      text(
        ctx,
        'Keep the source ID, version and access scope with this comparison.',
        145,
        690,
        34,
        C.ink,
      );
  });
  if (step('evidence-verdict-limits', 2, 0.63, 0.88) > 0)
    focus.target('evidence-scope', () => {
      text(ctx, 'TRUE study  ·  11 datasets', 145, 819, 35, C.blue);
      text(ctx, 'Inference and question answering catch different errors.', 145, 886, 38, C.ink);
      text(ctx, 'Test long passages and check the reference labels.', 145, 953, 31, C.muted);
    });
}

export { paintEvidenceVerdict as drawEvidenceVerdict };
export default {
  id: 'evidence-verdict',
  draw: paintEvidenceVerdict,
  cues: [
    'evidence-verdict-premise',
    ...claims.map(([, id]) => id),
    'evidence-verdict-direction',
    'evidence-verdict-unknown',
    'evidence-verdict-retain',
    'evidence-verdict-limits',
  ],
};
