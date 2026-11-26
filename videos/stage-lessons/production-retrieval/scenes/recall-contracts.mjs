// Scene 18 (recall-contracts): "Which search result matters to Luna?"
// Spectral rank-ribbon comparison of Exact top-10 [1..8, R, 10] vs Approximate top-10 [1..8, X, Y]
// and Packed Prompt hits, paired with MathJax Recall_ANN vs Recall_task equations, strict
// prediction withholding until after `pr-eight` / `pr-missing`, and faithfulness failure readout.
import { dynamic, group, line } from 'vizmatic/stage';
import {
  CORPUS,
  COSMOS,
  ROLE,
  assertEqual,
  callerTag,
  cinemaAtmosphere,
  glowTex,
  governingRecall,
  heroTitle,
  lumBar,
  playCue,
  runPhase,
  statusPill,
  textLines,
  tweenCue,
  txt,
  wrapLines,
} from '../parts.mjs';

export default function recallContracts(s, c) {
  const exact = ['1', '2', '3', '4', '5', '6', '7', '8', 'R', '10'];
  const returned = [...exact.slice(0, 8), 'X', 'Y'];
  const rec = governingRecall(exact, returned, ['R']);
  assertEqual(rec.ann, 0.8, 'ANN recall = 0.8');
  assertEqual(rec.task, 0, 'candidate/task recall = 0');

  const phase = s.value(0);
  const highlightR = s.value(0);
  const showApprox = s.value(0);
  const showOverlap = s.value(0);
  const revealAnn = s.value(0); // strictly after `pr-eight`
  const revealTask = s.value(0); // strictly after `pr-missing`
  const showPacked = s.value(0);
  const showFaithful = s.value(0); // strictly after `pr-faithful`

  const title = heroTitle(['Which Search Result', 'Matters to Luna?'], {
    x: -855,
    y: -440,
    size: 52,
    lineHeight: 62,
    accent: ROLE.policy,
    eyebrow: 'ANN RECALL VS CANDIDATE & CONTEXT RECALL',
  });

  const recallEq = glowTex(
    '\\text{Recall}_{\\text{ANN}} = \\frac{|C_k \\cap E_k|}{k}, \\quad \\text{Recall}_{\\text{task}} = \\frac{|C_k \\cap R|}{|R|}',
    {
      x: 345,
      y: -355,
      size: 32,
      color: ROLE.focus,
      glow: 6,
    },
  );

  const refLines = wrapLines(CORPUS[0].text, 34);

  const live = dynamic(() => {
    const p = phase.value;
    const pulse = 0.8 + 0.2 * Math.sin(p * 3.0);
    const hr = highlightR.value;
    const sa = showApprox.value;
    const so = showOverlap.value;
    const ra = revealAnn.value;
    const rt = revealTask.value;
    const sp = showPacked.value;
    const sf = showFaithful.value;

    const nodes = [callerTag(1)];

    // Left: Required reference passage R
    const refCx = -575;
    nodes.push(
      lumBar(refCx, -75, 550, 290, {
        color: hr > 0.3 ? ROLE.policy : '#31446b',
        fillAlpha: 0.09 + hr * 0.07,
        strokeWidth: 2.2 + hr,
        glow: 7 + hr * 6,
        radius: 16,
      }),
      txt('R  ·  REQUIRED GOVERNING RULE', -825, -182, 26, ROLE.policy, 'mono', 'left'),
      ...textLines(refLines, -825, -126, {
        size: 28,
        lineHeight: 42,
        color: COSMOS.ink,
      }),
    );

    // Lower-left: Faithfulness failure warning (revealed after `pr-faithful`)
    if (sf > 0.05) {
      nodes.push(
        lumBar(refCx, 195, 575, 175, {
          color: ROLE.danger,
          fillAlpha: 0.14 * sf,
          strokeWidth: 2.4,
          glow: 11 * pulse * sf,
          radius: 16,
          opacity: sf,
        }),
        txt('IF MODEL SAYS "ELIGIBLE":', -835, 142, 26, ROLE.danger, 'mono', 'left').opacity(sf),
        txt('Faithfulness Failure', -835, 192, 36, ROLE.danger, 'serif', 'left')
          .glow(8, ROLE.danger)
          .opacity(sf),
        txt('No R in prompt (ctx recall = 0)', -835, 242, 26, COSMOS.muted, 'mono', 'left').opacity(
          sf,
        ),
      );
    } else {
      nodes.push(
        lumBar(refCx, 195, 550, 175, {
          color: '#2c3d63',
          fillAlpha: 0.05,
          strokeWidth: 1.8,
          glow: 0,
          radius: 16,
        }),
        txt('METRIC SEPARATION', -825, 148, 26, COSMOS.muted, 'mono', 'left'),
        txt('ANN overlap != task recall', -825, 198, 28, COSMOS.ink, 'sans', 'left'),
        txt('Check R at every stage', -825, 242, 26, ROLE.policy, 'mono', 'left'),
      );
    }

    // Right: Three 10-slot luminous spectral rank ribbons (Exact, Approximate, Packed)
    const stripX0 = -210;
    const slotW = 94;
    const slotGap = 108;

    const drawRibbon = (
      y,
      caption,
      ids,
      { reveal = 1, markOverlap = false, col = COSMOS.muted } = {},
    ) => {
      nodes.push(txt(caption, stripX0 - 44, y - 62, 26, col, 'mono', 'left'));
      ids.forEach((id, idx) => {
        const cx = stripX0 + idx * slotGap;
        const isR = id === 'R';
        const isMiss = id === 'X' || id === 'Y';
        const isShared = markOverlap && idx < 8;
        const cellCol =
          reveal < 0.5
            ? '#334468'
            : isR
              ? ROLE.policy
              : isMiss
                ? ROLE.danger
                : isShared
                  ? ROLE.focus
                  : '#4d6491';
        nodes.push(
          lumBar(cx, y, slotW, 68, {
            color: cellCol,
            fillAlpha: isR ? 0.28 : isShared ? 0.16 : isMiss ? 0.16 : 0.08,
            strokeWidth: isR ? 3.0 : isShared ? 2.4 : 1.8,
            glow: isR ? 12 * pulse : isShared ? 7 : 0,
            radius: 10,
          }),
          txt(reveal < 0.5 ? '?' : id, cx, y, 30, cellCol, 'mono', 'center'),
        );
      });
    };

    drawRibbon(-155, 'EXACT TOP 10 (FULL ELIGIBLE CORPUS)', exact, {
      reveal: 1,
      col: ROLE.policy,
    });
    drawRibbon(20, 'APPROXIMATE TOP 10 (ANN SEARCH)', returned, {
      reveal: sa,
      markOverlap: so > 0.3,
      col: sa > 0.5 ? ROLE.focus : COSMOS.muted,
    });
    if (sp > 0.05) {
      drawRibbon(195, 'PACKED IN PROMPT (ALL 10 FIT  ·  STILL NO R)', returned, {
        reveal: 1,
        markOverlap: false,
        col: ROLE.danger,
      });
    } else {
      nodes.push(
        line([stripX0 - 44, 195], [stripX0 + 9 * slotGap + 44, 195], {
          stroke: '#263455',
          width: 2.5,
          dash: [10, 8],
        }),
        txt('PROMPT PACKING CHECK', stripX0 - 44, 152, 26, COSMOS.dim, 'mono', 'left'),
      );
    }

    // Score readouts at bottom (strictly withheld until after `pr-eight` / `pr-missing`!)
    if (ra > 0.3) {
      nodes.push(
        statusPill('ANN RECALL: 8 / 10 = 0.80', -460, 405, {
          color: ROLE.focus,
          width: 470,
          height: 52,
          opacity: ra,
        }),
      );
    }
    if (rt > 0.3) {
      nodes.push(
        statusPill('CANDIDATE RECALL (R): 0 / 1 = 0.00', 110, 405, {
          color: ROLE.danger,
          width: 560,
          height: 52,
          opacity: rt,
        }),
      );
    }
    if (ra <= 0.3 && rt <= 0.3) {
      nodes.push(
        txt(
          so > 0.3
            ? 'How many exact neighbors came back? And did Luna get her rule R?'
            : 'Exact search puts governing rule R at rank #9',
          -855,
          410,
          32,
          so > 0.3 ? ROLE.focus : COSMOS.muted,
          so > 0.3 ? 'serif' : 'sans',
          'left',
        ).glow(so > 0.3 ? 7 : 0, ROLE.focus),
      );
    }

    return group(...nodes);
  });

  s.add(cinemaAtmosphere(ROLE.policy, ROLE.danger), title, recallEq, live);
  runPhase(s, c, phase, 14);

  tweenCue(s, c, 'pr-task', highlightR, 1, { dur: 0.5 });
  tweenCue(s, c, 'pr-return', showApprox, 1, { dur: 0.55 });
  tweenCue(s, c, 'pr-ann', showOverlap, 1, { dur: 0.55 });
  tweenCue(s, c, 'pr-eight', revealAnn, 1, { after: true, dur: 0.45 });
  tweenCue(s, c, 'pr-missing', revealTask, 1, { after: true, dur: 0.45 });
  tweenCue(s, c, 'pr-context', showPacked, 1, { dur: 0.55 });
  tweenCue(s, c, 'pr-faithful', showFaithful, 1, { after: true, dur: 0.55 });
}
