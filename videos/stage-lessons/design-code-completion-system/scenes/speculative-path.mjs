// Scene 20: speculative-path - Verifying a proposed argument
// 5 drafted tokens (4 kept + 1 replaced "user"->"request") -> STRICT prediction 1 (5 emitted!) ->
// rejection sampling distribution from correctionDistribution(): target(0.1,0.6,0.3) vs draft(0.4,0.4,0.2)
// -> STRICT prediction 2 -> residual (0, 0.2, 0.1) -> 2/3 request, 1/3 scope! Plus 5/2 = 2.5x ratio!
import { group, line, rect } from 'vizmatic/stage';
import {
  CORR_DIST,
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  driftValue,
  glowDot,
  guardedDynamic,
  txt,
} from '../parts.mjs';

export default function speculativePath(s, c) {
  const phase = s.value(0);
  const count5Rev = s.value(0); // STRICT after spec-count!
  const sampleMode = s.value(0);
  const normReveal = s.value(0); // STRICT after spec-normalize!
  const ratioOn = s.value(0);

  const header = cinemaHeader(
    'SPECULATIVE DECODING MATH',
    'Verifying a proposed',
    'argument token',
    {
      x: -860,
      y: -445,
      accent: ROLE.model,
      size: 46,
    },
  );

  const bgAura = aura(40, 20, 680, '#a78bfa1a', '#6ee7b716');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = phase.value;
      const c5 = count5Rev.value;
      const sm = sampleMode.value;
      const nr = normReveal.value;
      const rt = ratioOn.value;
      const nodes = [];

      if (sm < 0.45) {
        // Phase 1: 5 drafted tokens -> 4 kept + 1 corrected = 5 emitted!
        const toks = ['graph', '.', 'allows', '(', 'user -> request'];
        const xs = [-660, -410, -160, 90, 440];
        const ws = [210, 170, 220, 170, 420];
        nodes.push(
          txt(
            'DRAFT PROPOSES 5 TOKENS -> TARGET VERIFIES ALL 5 IN PARALLEL',
            -820,
            -185,
            26,
            ROLE.ed,
            'mono',
            'left',
          ),
        );
        toks.forEach((t, i) => {
          const isRep = i === 4;
          const col = isRep ? ROLE.focus : ROLE.ok;
          nodes.push(
            rect(ws[i], 58, { fill: '#0b1428', stroke: col, width: 3, radius: 8 })
              .at(xs[i], -95)
              .glow(7, col),
            txt(t, xs[i], -95, 26, col, 'mono', 'center'),
            txt(isRep ? 'REPLACE' : 'KEEP', xs[i], -32, 26, col, 'mono', 'center'),
          );
        });

        // STRICT prediction 1 withholding until spec-count!
        nodes.push(
          line([-840, 55], [840, 55], { stroke: '#25355a', width: 2 }).opacity(0.65),
          txt(
            c5 > 0.35
              ? 'EMITTED: 5 TOKENS (4 DRAFT + 1 CORRECTION)  ·  ALL 5 KEPT -> UP TO 6 TOKENS!'
              : 'Target kept 4 and replaced token 5. How many tokens are emitted?',
            0,
            135,
            c5 > 0.35 ? 28 : 32,
            c5 > 0.35 ? ROLE.ok : ROLE.focus,
            c5 > 0.35 ? 'mono' : 'serif',
            'center',
          ).glow(8, c5 > 0.35 ? ROLE.ok : ROLE.focus),
          txt(
            c5 > 0.35
              ? '0 kept -> 1 (correction only)  ·  1 kept -> 2  ·  New token still needs KV before next step'
              : 'Each piece stands for one token in this toy example',
            0,
            205,
            26,
            COSMOS.muted,
            'mono',
            'center',
          ),
        );
      } else {
        // Phase 2: Exact Rejection Sampling Residual Distribution (Algorithm 1)
        const lx = -840;
        nodes.push(
          txt(
            'REJECTION SAMPLING RESIDUAL: max(0, p_target - p_draft)',
            lx,
            -195,
            26,
            ROLE.model,
            'mono',
            'left',
          ),
          txt('TOKEN', lx, -135, 26, COSMOS.muted, 'mono', 'left'),
          txt('DRAFT q', -420, -135, 26, ROLE.ed, 'mono', 'center'),
          txt('TARGET p', -140, -135, 26, ROLE.ok, 'mono', 'center'),
          txt('SHORTFALL', 180, -135, 26, ROLE.focus, 'mono', 'center'),
          txt('RESAMPLE PROB', 560, -135, 26, ROLE.ok, 'mono', 'center'),
        );

        const distRows = [
          {
            name: '"user"',
            q: '4 / 10',
            pt: '1 / 10',
            diff: '0',
            prob: '0',
            col: ROLE.fail,
            y: -70,
          },
          {
            name: '"request"',
            q: '4 / 10',
            pt: '6 / 10',
            diff: '+2 / 10',
            prob: `${Math.round(CORR_DIST.probabilities[1] * 100)}% (2/3)`,
            col: ROLE.ok,
            y: 5,
          },
          {
            name: '"scope"',
            q: '2 / 10',
            pt: '3 / 10',
            diff: '+1 / 10',
            prob: `${Math.round(CORR_DIST.probabilities[2] * 100)}% (1/3)`,
            col: ROLE.ed,
            y: 80,
          },
        ];

        distRows.forEach((r) => {
          nodes.push(
            txt(r.name, lx, r.y, 26, r.col, 'mono', 'left'),
            txt(r.q, -420, r.y, 26, COSMOS.ink, 'mono', 'center'),
            txt(r.pt, -140, r.y, 26, COSMOS.ink, 'mono', 'center'),
            txt(nr > 0.35 ? r.diff : '?', 180, r.y, 26, ROLE.focus, 'mono', 'center'),
            txt(
              nr > 0.35 ? r.prob : '[ ? ]',
              560,
              r.y,
              26,
              nr > 0.35 ? r.col : ROLE.focus,
              'mono',
              'center',
            ),
          );
        });

        nodes.push(
          line([-840, 155], [840, 155], { stroke: '#25355a', width: 2 }).opacity(0.65),
          txt(
            rt > 0.4
              ? 'COST RATIO: 5 EMITTED / (1 DRAFT + 1 VERIFY) = 2.5 TOKENS PER STEP!'
              : nr > 0.35
                ? 'ON REJECTION: DRAW "request" 2/3 AND "scope" 1/3 (EXACT TARGET DISTRIBUTION!)'
                : 'Accept "user" with prob min(1, 1/4) = 25%. If rejected, what replaces it & how often?',
            0,
            235,
            nr > 0.35 ? 28 : 30,
            rt > 0.4 || nr > 0.35 ? ROLE.ok : ROLE.focus,
            nr > 0.35 ? 'mono' : 'serif',
            'center',
          ).glow(8, nr > 0.35 ? ROLE.ok : ROLE.focus),
          txt(
            'Busy workers pay extra verification slots; measure TTFT & full latency before enabling',
            0,
            298,
            26,
            COSMOS.muted,
            'sans',
            'center',
          ),
        );
      }

      nodes.push(
        txt('EXACT VERIFICATION', 480, -425, 26, ROLE.focus, 'mono', 'center'),
        txt('Preserves target distribution strictly', 480, -378, 26, ROLE.ok, 'mono', 'center'),
        glowDot(-780 + ((p * 110) % 220), 435, {
          radius: 4.5,
          color: ROLE.model,
          glow: 8,
          opacity: 0.7,
        }),
      );

      return group(...nodes);
    },
  );

  s.add(bgAura, header, view);
  driftValue(s, c, phase, 4.6);

  c.after('spec-count', () => {
    s.play(count5Rev.to(1, { duration: clampDur(c, c.cue('spec-count').end, 0.35) }));
  });
  c.on('spec-chances', () => {
    s.play(sampleMode.to(1, { duration: clampDur(c, c.cue('spec-chances').start, 0.4) }));
  });
  c.after('spec-normalize', () => {
    s.play(normReveal.to(1, { duration: clampDur(c, c.cue('spec-normalize').end, 0.35) }));
  });
  c.on('spec-ratio', () => {
    s.play(ratioOn.to(1, { duration: clampDur(c, c.cue('spec-ratio').start, 0.35) }));
  });
}
