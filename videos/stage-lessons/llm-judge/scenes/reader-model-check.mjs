// Scene 6: reader-model-check - Does the model's verdict follow from the policy?
// 7-claim radial calibration wheel of the local Qwen3-1.7B run: inner ring shows human
// ground truth (2 supported, 2 contradicted, 3 review); outer petals show valid JSON
// outputs where 4 match emerald and 3 flare rose (false supports despite valid JSON!),
// plus the collapsed 0.6B all-supported ring.
import { circle, group, line } from 'vizmatic/stage';
import { COSMOS, ROLE, aura, cinemaHeader, clampDur, guardedDynamic, txt } from '../parts.mjs';

const CLAIMS = [
  { id: 'C1', human: 'SUP', model: 'SUP', ok: true, note: 'permission = approval' },
  { id: 'C2', human: 'SUP', model: 'SUP', ok: true, note: 'linked plan required' },
  { id: 'C3', human: 'CON', model: 'CON', ok: true, note: 'caught contradiction' },
  { id: 'C4', human: 'REV', model: 'REV', ok: true, note: 'planted instruction -> review' },
  {
    id: 'C5',
    human: 'CON',
    model: 'SUP',
    ok: false,
    note: 'approval optional (reason: required!)',
  },
  { id: 'C6', human: 'REV', model: 'SUP', ok: false, note: 'unlisted security review' },
  { id: 'C7', human: 'REV', model: 'SUP', ok: false, note: 'unlisted on-call approval' },
];

export default function readerModelCheck(s, c) {
  const pulse = s.value(0);
  const labelsOn = s.value(0);
  const missOn = s.value(0);
  const jsonOn = s.value(0);

  const header = cinemaHeader(
    'LOCAL MODEL SNAPSHOT · QWEN3-1.7B',
    'Does the verdict follow',
    'from the policy?',
    { accent: ROLE.stepwise, size: 48 },
  );

  const stageAura = aura(320, 30, 600, '#5ce1e61f', '#ff6b8b1a');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = 0;
      const lb = labelsOn.value;
      const ms = missOn.value;
      const js = jsonOn.value;
      const nodes = [];

      // Right: 7-claim radial constellation centered at (340, 20)
      const cx = 340;
      const cy = 20;
      const rInner = 135;
      const rRing = 232;
      const rOuter = 278;

      nodes.push(
        circle(rInner, { fill: '#0b1020', stroke: ROLE.human, width: 2.2, dash: [6, 6] })
          .at(cx, cy)
          .opacity(0.65),
        circle(rRing, {
          fill: null,
          stroke: js > 0.3 ? ROLE.verdict : '#2c3d66',
          width: js > 0.3 ? 3.5 : 2,
        })
          .at(cx, cy)
          .glow(js > 0.3 ? 9 : 0, ROLE.verdict),
        txt('7 CLAIMS', cx, cy - 16, 28, COSMOS.ink, 'mono', 'center'),
        txt('1.7B · temp 0', cx, cy + 24, 26, COSMOS.muted, 'mono', 'center'),
      );

      CLAIMS.forEach((cl, i) => {
        const ang = -Math.PI / 2 + (i * Math.PI * 2) / CLAIMS.length;
        const ca = Math.cos(ang);
        const sa = Math.sin(ang);
        const ix = cx + ca * rInner;
        const iy = cy + sa * rInner;
        const sx0 = cx + ca * (rInner + 18);
        const sy0 = cy + sa * (rInner + 18);
        const sx1 = cx + ca * (rOuter - 34);
        const sy1 = cy + sa * (rOuter - 34);
        const ox = cx + ca * rOuter;
        const oy = cy + sa * rOuter;

        const highlightMiss = !cl.ok && ms > 0.25;
        const spokeCol = cl.ok ? ROLE.ok : highlightMiss ? ROLE.conflict : ROLE.stepwise;

        nodes.push(
          line([sx0, sy0], [sx1, sy1], { stroke: spokeCol, width: highlightMiss ? 4.2 : 2.6 }).glow(
            highlightMiss ? 10 : 4,
            spokeCol,
          ),
          circle(14, { fill: '#0b1224', stroke: ROLE.human, width: 2.6 }).at(ix, iy),
          circle(30, { fill: '#0b1224', stroke: spokeCol, width: 3.2 })
            .at(ox, oy)
            .glow(highlightMiss ? 10 : 5, spokeCol),
          txt(cl.id, ox, oy, 26, spokeCol, 'mono', 'center'),
        );
      });

      // Left column: floating diagnostic readouts (zero boxes)
      nodes.push(
        txt('HUMAN KEY (7 CLAIMS)', -840, -165, 26, ROLE.human, 'mono', 'left').opacity(
          0.45 + lb * 0.55,
        ),
        txt(
          '2 supported · 2 contradicted · 3 review',
          -840,
          -118,
          28,
          COSMOS.ink,
          'sans',
          'left',
        ).opacity(0.45 + lb * 0.55),
        txt('4 / 7 MATCHED (C1 - C4)', -840, -48, 28, ROLE.ok, 'mono', 'left')
          .glow(5, ROLE.ok)
          .opacity(0.45 + lb * 0.55),
      );

      if (ms > 0.05) {
        nodes.push(
          txt('3 FALSE SUPPORTS (C5 - C7)', -840, 48, 28, ROLE.conflict, 'mono', 'left')
            .glow(7, ROLE.conflict)
            .opacity(ms),
          txt(
            'C5: "approval optional" -> Verdict: SUP',
            -840,
            102,
            26,
            COSMOS.ink,
            'sans',
            'left',
          ).opacity(ms),
          txt(
            '    Reason says: "approval is required"',
            -840,
            144,
            26,
            ROLE.conflict,
            'serif',
            'left',
          ).opacity(ms),
          txt(
            'C6-C7: approved 2 unstated requirements',
            -840,
            194,
            26,
            COSMOS.muted,
            'sans',
            'left',
          ).opacity(ms),
        );
      }

      if (js > 0.05) {
        nodes.push(
          txt(
            'ALL 3 ARE VALID JSON  (0.6B: 7/7 SUPPORTED)',
            -840,
            295,
            28,
            ROLE.verdict,
            'mono',
            'left',
          )
            .glow(7, ROLE.verdict)
            .opacity(js),
          txt(
            'Measure mistakes on held-out claims first',
            -840,
            355,
            28,
            COSMOS.ink,
            'sans',
            'left',
          ).opacity(js),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);

  c.on('reader-snapshot', () => {
    s.play(pulse.to(0.4, { duration: clampDur(c, c.cue('reader-snapshot').start, 0.25) }));
  });
  c.on('reader-labels', () => {
    s.play(labelsOn.to(1, { duration: clampDur(c, c.cue('reader-labels').start, 0.4) }));
  });
  c.on('semantic-miss', () => {
    s.play(missOn.to(1, { duration: clampDur(c, c.cue('semantic-miss').start, 0.4) }));
  });
  c.on('valid-json-misses', () => {
    s.play(jsonOn.to(1, { duration: clampDur(c, c.cue('valid-json-misses').start, 0.4) }));
  });
}
