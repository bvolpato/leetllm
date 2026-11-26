// Scene 03: merges: Live BPE training on rain (x3), rainy (x2), rail (x2): 30 -> 23 -> 16 -> 11.
import { linear } from 'vizmatic/stage';
import {
  COSMOS,
  HISTORY,
  ROLE,
  RULES,
  aura,
  bindCueBeat,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  metricReadout,
  playCue,
  tokenPill,
  txt,
} from '../parts.mjs';

export default function merges(s, c) {
  const stepIdx = s.value(0); // 0, 1, 2, 3 matching HISTORY[0..3]
  const showPairs = s.value(0);
  const showRecipe = s.value(0);
  const highlightFragments = s.value(0);
  const pulse = s.value(0);
  const cueEnergy = s.value(0);

  const bgAura = aura(-120, 10, 740, '#2a225828', '#153a5e16');
  const title = heroTitle(['Let the text', 'choose its pieces'], {
    x: -855,
    y: -430,
    size: 56,
    lineHeight: 64,
    accent: ROLE.merge,
  });

  const stageVis = s.value(1);
  const mainLayer = guardedDynamic(stageVis, (alpha) => {
    const st = Math.max(0, Math.min(3, Math.round(stepIdx.value)));
    const sp = showPairs.value;
    const sr = showRecipe.value;
    const hf = highlightFragments.value;
    const p = 0.65 + 0.35 * Math.sin(pulse.value * Math.PI * 2);
    const snap = HISTORY[st];
    const nodes = [];

    // Left corpus rows with weighted frequency multipliers
    const rowYs = [-180, -35, 110];
    snap.words.forEach((word, rowIdx) => {
      const y = rowYs[rowIdx];
      nodes.push(txt(`×${word.count}`, -820, y, 36, ROLE.merge, 'mono', 'center').opacity(alpha));
      let cursorX = -690;
      word.pieces.forEach((piece) => {
        const w = Math.max(76, piece.length * 36 + 38);
        const isMerged = piece.length > 1;
        const isLoose = hf > 0.3 && piece.length === 1;
        const col = isLoose ? ROLE.warn : isMerged ? ROLE.ok : ROLE.piece;
        nodes.push(
          tokenPill(piece, cursorX + w * 0.5, y, {
            w,
            h: 72,
            color: col,
            size: 36,
            glow: isMerged ? 10 * p : 6,
            opacity: alpha,
          }),
        );
        cursorX += w + 18;
      });
    });

    // Top-right live total positions readout + decay bar (30 -> 23 -> 16 -> 11)
    const pos = snap.positions;
    nodes.push(
      metricReadout('WEIGHTED POSITIONS', String(pos), {
        x: 300,
        y: -410,
        valueSize: 82,
        color: pos <= 11 ? ROLE.ok : ROLE.merge,
        glow: 12,
        sub: st === 0 ? 'start: 4×3 + 5×2 + 4×2' : `step ${st} of 3`,
        anchor: 'left',
      }).opacity(alpha),
      lumBar(300, -210, (pos / 30) * 520, 26, pos <= 11 ? ROLE.ok : ROLE.merge, {
        opacity: alpha,
        maxTrackW: 520,
      }),
    );

    // Pair counts / active merge recipe on right side
    if (sp > 0.05) {
      const topStep = HISTORY[Math.min(3, Math.max(1, st === 0 ? 1 : st))];
      const ranked = topStep.ranked.slice(0, 3);
      nodes.push(
        txt(
          st === 0 ? 'TOP ADJACENT PAIRS' : `MERGED AT STEP ${st}`,
          300,
          -120,
          26,
          ROLE.piece,
          'mono',
          'left',
        ).opacity(sp * alpha),
      );
      ranked.forEach((entry, idx) => {
        const y = -55 + idx * 64;
        const isTop = idx === 0;
        const col = isTop ? ROLE.merge : COSMOS.muted;
        nodes.push(
          txt(`${entry.pair.replace(' ', ' + ')}`, 300, y, 32, col, 'mono', 'left').opacity(
            sp * alpha,
          ),
          lumBar(560, y, (entry.count / 7) * 240, 22, isTop ? ROLE.merge : ROLE.token, {
            opacity: sp * alpha,
            maxTrackW: 240,
          }),
          txt(String(entry.count), 830, y, 30, col, 'mono', 'center').opacity(sp * alpha),
        );
      });
    }

    // Saved ordered merge list along the bottom
    if (st >= 1 || sr > 0.05) {
      const count = sr > 0.2 ? 3 : st;
      nodes.push(
        txt('ORDERED MERGE LIST', -855, 250, 26, ROLE.merge, 'mono', 'left').opacity(alpha),
      );
      for (let i = 0; i < count; i++) {
        const [l, r] = RULES[i];
        const x = -660 + i * 330;
        nodes.push(
          tokenPill(`${i + 1}. ${l} + ${r} → ${l + r}`, x, 330, {
            w: 295,
            h: 72,
            color: ROLE.merge,
            size: 28,
            glow: 8,
            opacity: alpha,
          }),
        );
        if (i < count - 1) {
          nodes.push(
            glowingTrail(
              [
                [x + 150, 330],
                [x + 180, 330],
              ],
              { color: ROLE.merge, width: 3.5, glow: 8, opacity: alpha },
            ),
          );
        }
      }
    }

    return group(...nodes);
  });

  s.add(bgAura, title, mainLayer);
  const totalDur = Math.max(1, c.end - c.start - 0.5);
  c.at(0.1, () => {
    s.play(pulse.to(7, { duration: totalDur, ease: linear }));
  });

  playCue(s, c, 'count-pairs', (d) => s.play(showPairs.to(1, { duration: d })), { dur: 0.5 });
  playCue(s, c, 'glue-ra', (d) => s.play(stepIdx.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'glue-rai', (d) => s.play(stepIdx.to(2, { duration: d })), {
    after: true,
    dur: 0.4,
  });
  playCue(s, c, 'glue-rain', (d) => s.play(stepIdx.to(3, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'merge-list', (d) => s.play(showRecipe.to(1, { duration: d })), { dur: 0.5 });
  playCue(s, c, 'fragments', (d) => s.play(highlightFragments.to(1, { duration: d })), {
    dur: 0.5,
  });
  bindCueBeat(s, c, cueEnergy, [
    'corpus',
    'letters',
    'thirty',
    'weights',
    'pair-count',
    'pair-value',
    'ai-count',
    'tie',
    'twenty-three',
    'recount',
    'sixteen-positions',
    'rain-count',
    'eleven',
    'eleven-start',
    'stopped',
    'frequent',
  ]);
}
