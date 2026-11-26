// Scene 4: logit-mask - The first draw
// Signature -inf logit pruning curtain! Four candidate tokens (The, {, Sure, JSON) with
// hand-set logits [0.45, 0.30, 0.15, 0.10], raw softmax bars, glowing crimson -inf curtain
// pruning all three illegal tokens, and luminous emerald renormalization beam giving { 100%.
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  FIRST_LOGITS,
  FIRST_MASKED_PROBS,
  FIRST_RAW_PROBS,
  FIRST_TOKENS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  driftValue,
  glowMeter,
  glowTex,
  guardedDynamic,
  legal,
  quadArcPts,
  txt,
} from '../parts.mjs';

export default function logitMask(s, c) {
  const pulse = s.value(0);
  const inputsHi = s.value(0);
  const maskDrop = s.value(0);
  const normBeam = s.value(0);

  const header = cinemaHeader('THE GRAMMAR MASK', 'Logit pruning on', 'the first draw', {
    accent: ROLE.legal,
    size: 50,
  });

  const stageAura = aura(240, 40, 640, '#6ee7b71e', '#ff6b8b16');

  const maskEq = glowTex(String.raw`z'_t(v) = z_t(v) + m_t(v), \quad m_t(v) \in \{0, -\infty\}`, {
    x: 350,
    y: -375,
    size: 34,
    color: ROLE.prefix,
    glow: 7,
  });

  const stageView = guardedDynamic(
    () => 1,
    () => {
      const p = pulse.value;
      const ih = inputsHi.value;
      const md = maskDrop.value;
      const nb = normBeam.value;
      const nodes = [];

      nodes.push(
        txt('EMPTY PREFIX ""  ·  TEMPERATURE 1.0', -840, -225, 26, ROLE.prefix, 'mono', 'left'),
        txt('TOKEN', -830, -162, 26, COSMOS.muted, 'mono', 'left'),
        txt('LOGIT', -595, -162, 26, COSMOS.muted, 'mono', 'center'),
        txt('RAW SOFTMAX', -320, -162, 26, ROLE.fsm, 'mono', 'center'),
        txt('MASKED LOGIT', 110, -162, 26, ROLE.prune, 'mono', 'center'),
        txt('AFTER MASK', 540, -162, 26, ROLE.legal, 'mono', 'center'),
        line([-840, -132], [840, -132], { stroke: '#28385e', width: 2 }),
      );

      FIRST_TOKENS.forEach((tok, i) => {
        const y = -62 + i * 112;
        const ok = legal('', tok);
        const pruned = !ok && md > 0.35;
        const tokCol =
          md > 0.35 ? (ok ? ROLE.legal : COSMOS.dim) : ih > 0.3 ? ROLE.fsm : COSMOS.ink;

        nodes.push(
          txt(tok, -830, y, 40, tokCol, 'mono', 'left').glow(ok && md > 0.4 ? 9 : 0, ROLE.legal),
          txt(FIRST_LOGITS[i].toFixed(2), -595, y, 34, COSMOS.ink, 'mono', 'center'),
          glowMeter(-485, y + 26, 330, 18, FIRST_RAW_PROBS[i], {
            fill: ok ? ROLE.fsm : ROLE.schema,
            opacity: pruned ? 0.35 : 0.92,
          }),
          txt(
            `${(FIRST_RAW_PROBS[i] * 100).toFixed(1)}%`,
            -320,
            y - 12,
            30,
            pruned ? COSMOS.dim : COSMOS.ink,
            'mono',
            'center',
          ),
        );

        // Masked logit column (-inf pruning curtain!)
        if (md > 0.05) {
          if (ok) {
            nodes.push(
              txt(FIRST_LOGITS[i].toFixed(2), 110, y, 36, ROLE.legal, 'mono', 'center')
                .glow(8, ROLE.legal)
                .opacity(md),
            );
          } else {
            nodes.push(
              txt('-∞', 110, y, 42, ROLE.prune, 'mono', 'center').glow(10, ROLE.prune).opacity(md),
            );
          }
        } else {
          nodes.push(txt('·', 110, y, 30, COSMOS.dim, 'mono', 'center'));
        }

        // After-mask renormalized probability column
        if (nb > 0.05) {
          const finalP = FIRST_MASKED_PROBS[i];
          nodes.push(
            glowMeter(375, y + 26, 330, 18, finalP * nb, {
              fill: ok ? ROLE.legal : ROLE.prune,
              opacity: ok ? nb : nb * 0.35,
            }),
            txt(
              `${(finalP * 100).toFixed(0)}%`,
              540,
              y - 12,
              34,
              ok ? ROLE.legal : COSMOS.dim,
              'mono',
              'center',
            )
              .glow(ok ? 10 : 0, ROLE.legal)
              .opacity(nb),
          );
          if (ok) {
            const beam = quadArcPts([210, y], [370, y], -18);
            nodes.push(beamWithPhotons(beam, ROLE.legal, p * 1.3, { alpha: nb, width: 3.6 }));
          }
        } else {
          nodes.push(txt('?', 540, y, 30, COSMOS.dim, 'mono', 'center'));
        }

        nodes.push(line([-840, y + 52], [840, y + 52], { stroke: '#1b2644', width: 1.4 }));
      });

      // Bottom summary
      nodes.push(
        txt(
          nb > 0.5
            ? 'exp(-∞) = 0  ·  Dividing by the lone surviving weight hands 100% of the draw to {'
            : md > 0.5
              ? 'Grammar mask keeps { at 0.30 and pushes every illegal continuation to -∞'
              : 'Before masking, "The" leads at 30.2% while only { can open a JSON object',
          -840,
          388,
          28,
          nb > 0.5 ? ROLE.legal : COSMOS.muted,
          'serif',
          'left',
        ),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, maskEq, stageView);
  driftValue(s, c, pulse, 4.2, { startOffset: 0.1, endMargin: 0.5 });

  c.on('mask-inputs', () => {
    s.play(inputsHi.to(1, { duration: clampDur(c, c.cue('mask-inputs').start, 0.35) }));
  });
  c.on('mask-first', () => {
    s.play(maskDrop.to(1, { duration: clampDur(c, c.cue('mask-first').start, 0.5) }));
  });
  c.on('mask-normalize', () => {
    s.play(normBeam.to(1, { duration: clampDur(c, c.cue('mask-normalize').start, 0.5) }));
  });
}
