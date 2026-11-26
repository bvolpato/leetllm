// Scene 27: checkpoint-contract: Llama 3.1 + Gemma 3 schemas, then passkey retrieval trial (lime 7 near vs lime 4 far).
import { dynamic, group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  cinemaAura,
  cinemaStars,
  glowDot,
  heroTitle,
  playAfter,
  playOn,
  safeDur,
  txt,
} from '../parts.mjs';

const INTRO_CUES = [
  'rp-checkpoint-contract-0-0',
  'rp-checkpoint-contract-0-1',
  'rp-checkpoint-contract-0-2',
  'rp-checkpoint-contract-0-3',
  'rp-checkpoint-contract-1-0',
  'rp-checkpoint-contract-1-1',
  'rp-checkpoint-contract-1-2',
  'rp-checkpoint-contract-1-3',
  'check-schema',
];

export default function checkpointContract(s, c) {
  const step = s.value(0);
  const trialPhase = s.value(0); // 0 = schemas, 1 = near trial, 2 = far trial (answer unjudged), 3 = verdict revealed

  const stars = cinemaStars(125, 27, ROLE.shift);
  const stageAura = cinemaAura(0, 10, 720, '#a78bfa1e', '#5ce1e614');

  const title = heroTitle(["Testing a checkpoint's", 'working window'], {
    x: -860,
    y: -435,
    size: 54,
    lineHeight: 62,
    accent: ROLE.shift,
    eyebrow: 'REAL CHECKPOINT CONFIGS & NEEDLE RETRIEVAL',
  });

  const live = dynamic(() => {
    const st = step.value;
    const tp = trialPhase.value;
    const nodes = [];

    // Upper section: Llama 3.1 & Gemma 3 schemas (dim slightly once retrieval trial begins)
    const topOp = tp >= 0.6 ? 0.42 : 1;
    // Llama 3.1 panel-free horizontal band diagram
    nodes.push(
      txt('Llama 3.1 (base 500k, L₀ = 8,192)', -855, -245, 28, ROLE.query, 'mono', 'left').opacity(
        topOp,
      ),
      rect(240, 52, { fill: '#102838', stroke: ROLE.query, width: 2.2, radius: 8 })
        .at(-735, -180)
        .opacity(topOp),
      txt('λ < 2048: 1×', -735, -180, 26, ROLE.query, 'mono').opacity(topOp),
      rect(240, 52, { fill: '#221b38', stroke: ROLE.shift, width: 2.2, radius: 8 })
        .at(-475, -180)
        .opacity(topOp),
      txt('middle: blend', -475, -180, 26, ROLE.shift, 'mono').opacity(topOp),
      rect(270, 52, { fill: '#2c2214', stroke: COSMOS.gold, width: 2.2, radius: 8 })
        .at(-200, -180)
        .opacity(topOp),
      txt('λ > 8192: ÷ 8', -200, -180, 26, COSMOS.gold, 'mono').opacity(topOp),
    );

    // Gemma 3 5:1 local/global layer ribbon on upper right
    const gOp = (st >= 4 ? 1 : 0.45) * topOp;
    nodes.push(
      txt('Gemma 3 (5 local 10k : 1 global 1M)', 80, -245, 28, ROLE.score, 'mono', 'left').opacity(
        gOp,
      ),
    );
    for (let k = 0; k < 6; k++) {
      const isGlobal = k === 5;
      const gx = 135 + k * 124;
      const col = isGlobal ? COSMOS.gold : COSMOS.blue;
      nodes.push(
        rect(108, 52, {
          fill: isGlobal ? '#2e2412' : '#111d36',
          stroke: col,
          width: 2.2,
          radius: 8,
        })
          .at(gx, -180)
          .opacity(gOp),
        txt(isGlobal ? '1M' : '10k', gx, -180, 26, col, 'mono').opacity(gOp),
      );
    }

    // Lower section: Needle-in-a-haystack retrieval trial (30,720 prompt + 2,048 generation)
    const trialOp = tp < 0.2 ? 0.35 : 1;
    const barX0 = -855;
    const promptW = 1320;
    const genW = 360;
    const row1Y = 30;
    const row2Y = 210;

    nodes.push(
      txt(
        'Retrieval test: 30,720 prompt + 2,048 generation   |   Target passkey: lime 7',
        barX0,
        -68,
        26,
        COSMOS.gold,
        'mono',
        'left',
      ).opacity(trialOp),
      // Trial 1: Near passkey -> matches lime 7
      txt('Trial 1 (near end)', barX0, row1Y - 46, 26, ROLE.score, 'mono', 'left').opacity(trialOp),
      rect(promptW, 48, { fill: '#10182b', stroke: '#35456d', width: 2, radius: 8 })
        .at(barX0 + promptW * 0.5, row1Y)
        .opacity(trialOp),
      rect(genW, 48, { fill: '#102824', stroke: ROLE.score, width: 2.4, radius: 8 })
        .at(barX0 + promptW + 25 + genW * 0.5, row1Y)
        .opacity(trialOp),
      glowDot(barX0 + promptW - 140, row1Y, { radius: 9, color: ROLE.score, glow: 12 }).opacity(
        trialOp,
      ),
      txt('passkey: lime 7', barX0 + promptW - 140, row1Y + 46, 26, ROLE.score, 'mono').opacity(
        trialOp,
      ),
      txt(
        tp >= 0.8 ? 'ans: lime 7  ✓' : 'ans: ...',
        barX0 + promptW + 25 + genW * 0.5,
        row1Y,
        28,
        ROLE.score,
        'mono',
      ).opacity(trialOp),
    );

    // Trial 2: Far passkey near start -> answer lime 4 (withhold verdict until `check-answers`!)
    const showFar = tp >= 1.4;
    const showVerdict = tp >= 2.6;
    const farOp = showFar ? 1 : 0.25;
    const farCol = showVerdict ? ROLE.danger : COSMOS.gold;
    nodes.push(
      txt('Trial 2 (near start)', barX0, row2Y - 46, 26, farCol, 'mono', 'left').opacity(farOp),
      rect(promptW, 48, { fill: '#10182b', stroke: '#35456d', width: 2, radius: 8 })
        .at(barX0 + promptW * 0.5, row2Y)
        .opacity(farOp),
      rect(genW, 48, {
        fill: showVerdict ? '#2d1322' : '#181a2c',
        stroke: farCol,
        width: 2.6,
        radius: 8,
      })
        .at(barX0 + promptW + 25 + genW * 0.5, row2Y)
        .opacity(farOp),
      glowDot(barX0 + 130, row2Y, { radius: 9, color: COSMOS.gold, glow: 12 }).opacity(farOp),
      txt('passkey: lime 7', barX0 + 130, row2Y + 46, 26, COSMOS.gold, 'mono').opacity(farOp),
      txt(
        tp >= 1.8 ? (showVerdict ? 'ans: lime 4  ×' : 'ans: lime 4  (?)') : 'ans: ...',
        barX0 + promptW + 25 + genW * 0.5,
        row2Y,
        28,
        farCol,
        'mono',
      ).opacity(farOp),
      line([barX0, 310], [855, 310], { stroke: '#29375a', width: 1.6 }),
      txt(
        showVerdict
          ? 'Only the nearer trial matches: test distance, distractors, and missing facts at deployed length'
          : 'Vary fact position with the same budget to test real long-context retrieval',
        barX0,
        365,
        27,
        showVerdict ? ROLE.danger : COSMOS.muted,
        'sans',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(stars, stageAura, title, live);

  INTRO_CUES.forEach((id, idx) => {
    const cue = c.cue(id);
    c.on(id, () => s.play(step.to(idx + 1, { duration: safeDur(c, cue.start, 0.5) })));
  });
  playOn(s, c, 'set-window', (d) => trialPhase.to(1, { duration: d }), 0.6);
  playOn(s, c, 'move-fact', (d) => trialPhase.to(1.5, { duration: d }), 0.6);
  playOn(s, c, 'distant-answer', (d) => trialPhase.to(2.0, { duration: d }), 0.5);
  // Withhold pass/fail verdict until after 'Only the nearer trial matches'!
  playAfter(s, c, 'check-answers', (d) => trialPhase.to(3.0, { duration: d }), 0.45);
}
