// Scene 31: evaluation-protocol: "How often does a draft get the status right?"
// Glowing 3x4 held-out draft evaluation grid: Prompt A ([1, 0, 1, 0] -> 2/4 = 50%, any = 1)
// expanding to Prompts B & C ([0, 0, 0, 0], [0, 1, 0, 0]), strictly withholding aggregate totals
// (3/12 drafts, 2/3 prompts) until AFTER evaluation-counts.
import { COSMOS, guardedDynamic, heroTitle, txt } from '../../cinematic-kit.mjs';
import { EVAL_OUTCOMES, ROLE, cinemaAtmosphere, lumBar, playCue } from '../parts.mjs';

export default function evaluationProtocol(s, c) {
  const title = heroTitle(['How often does a draft', 'get the status right?'], {
    x: -850,
    y: -435,
    size: 46,
    lineHeight: 54,
    accent: ROLE.valid,
  });

  const taskLit = s.value(0.3);
  const dealt = s.value(0); // 0 -> 4 graded drafts for Prompt A
  const showMean = s.value(0);
  const showAny = s.value(0);
  const showMore = s.value(0); // 0 -> 1 reveals Prompts B and C
  const showTotals = s.value(0);
  const stageVis = s.value(1);

  const mainLayer = guardedDynamic(stageVis, (alpha) => {
    const nodes = [];
    const nRows = showMore.value > 0.4 ? 3 : 1;
    const nDealt = Math.round(Math.max(0, Math.min(4, dealt.value)));
    const meanReady = showMean.value > 0.4;
    const anyReady = showAny.value > 0.4;
    const totReady = showTotals.value > 0.4;

    nodes.push(
      txt(
        'Held-out prompts × 4 independent drafts',
        -845,
        -255,
        30,
        ROLE.active,
        'mono',
        'left',
      ).opacity(Math.max(0.45, taskLit.value) * alpha),
      txt(
        'DeepSeek-R1 ref: T = 0.6, top-p = 0.95',
        845,
        -255,
        26,
        COSMOS.muted,
        'mono',
        'right',
      ).opacity(alpha),
    );

    const rowYs = [-120, 35, 190];
    const colXs = [-430, -175, 80, 335];

    for (let r = 0; r < nRows; r++) {
      const y = rowYs[r];
      const row = EVAL_OUTCOMES[r];
      const gradedHere = r === 0 ? nDealt : 4;
      const hasAny = row.some(Boolean);

      nodes.push(
        txt(`Prompt ${['A', 'B', 'C'][r]}`, -845, y, 34, COSMOS.ink, 'mono', 'left').opacity(alpha),
      );

      row.forEach((ok, j) => {
        const cx = colXs[j];
        const graded = j < gradedHere;
        const col = graded ? (ok ? ROLE.valid : ROLE.pruned) : ROLE.base;
        nodes.push(
          lumBar(cx, y, 210, 86, {
            color: col,
            fillOpacity: graded ? (ok ? 0.34 : 0.14) : 0.14,
            strokeWidth: graded && ok ? 2.8 : 2,
            glow: graded && ok ? 11 : 4,
            radius: 12,
            opacity: (graded && !ok ? 0.58 : 1) * alpha,
          }),
          txt(
            graded ? (ok ? 'correct' : 'wrong') : `draft ${j + 1}`,
            cx,
            y,
            28,
            graded ? col : COSMOS.muted,
            'mono',
            'center',
          ).opacity(alpha),
        );
      });

      // Right-hand "any success" column
      const showRowAny = (r === 0 && anyReady) || (r > 0 && totReady);
      if (showRowAny) {
        nodes.push(
          txt(
            `any = ${hasAny ? '1' : '0'}`,
            640,
            y,
            32,
            hasAny ? ROLE.winner : COSMOS.dim,
            'mono',
            'center',
          )
            .glow(hasAny ? 7 : 0, ROLE.winner)
            .opacity(alpha),
        );
      } else if (nRows === 3 && r > 0) {
        nodes.push(txt('any = ?', 640, y, 30, COSMOS.muted, 'mono', 'center').opacity(alpha));
      }
    }

    // Bottom metrics / question banner (strictly honoring withholding!)
    let banner = 'Keep model, prompts, evidence, budget, stop rule & scorer fixed.';
    let banCol = COSMOS.muted;
    if (nRows === 3) {
      if (totReady) {
        banner = '3 / 12 drafts correct (25%)   |   2 / 3 prompts have >= 1 correct draft';
        banCol = ROLE.valid;
      } else {
        banner = 'How many drafts are correct in all? How many prompts have any correct draft?';
        banCol = ROLE.winner;
      }
    } else if (meanReady) {
      banner = anyReady ? 'Prompt A: 50% mean  |  any = 1' : 'Prompt A: 2 / 4 = 50% mean';
      banCol = ROLE.valid;
    } else if (nDealt > 0) {
      banner = 'Grade each completed draft directly against the deployment record.';
      banCol = ROLE.active;
    }

    nodes.push(
      txt(banner, 0, 345, 32, banCol, 'serif', 'center')
        .glow(totReady || meanReady ? 6 : 0, banCol)
        .opacity(alpha),
      txt(
        totReady
          ? 'Bill full cost: every candidate token + testing, voting, or reranking latency.'
          : 'Change one decoding control at a time.',
        0,
        410,
        26,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );
    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.valid, ROLE.winner), title, mainLayer);

  playCue(s, c, 'evaluation-task', (d) => s.play(taskLit.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'evaluation-deal', (d) => s.play(dealt.to(4, { duration: d })), { dur: 0.95 });
  playCue(s, c, 'dec-evaluation-mean', (d) => s.play(showMean.to(1, { duration: d })), {
    after: true,
    dur: 0.5,
  });
  playCue(s, c, 'dec-evaluation-any', (d) => s.play(showAny.to(1, { duration: d })), {
    after: false,
    dur: 0.5,
  });
  playCue(s, c, 'evaluation-more', (d) => s.play(showMore.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'evaluation-counts', (d) => s.play(showTotals.to(1, { duration: d })), {
    after: true,
    dur: 0.55,
  });
}
