// Scene 32: failure-diagnosis - Choose the intervention from the first failed boundary
// Three-stage diagnostic oscilloscope:
//   Mode 0: Flapping replica wave & 800ms mean masking 30,000ms queue tail.
//   Mode 1: Retry amplification loop bounded by original deadline, attempt cap & backoff.
//   Mode 2: Chunked prefill slicing long prompts to preserve active stream progress.
import { group, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  glowBar,
  glowDot,
  guardedDynamic,
  quadArcPts,
  tweenOn,
  txt,
} from '../parts.mjs';

export default function failureDiagnosis(s, c) {
  const mode = s.value(0); // 0=flapping+tail, 1=retry storm, 2=chunked prefill

  const header = cinemaHeader('FAILURE SIGNATURES & REMEDIES', 'Fix the first', 'failed boundary', {
    x: -860,
    y: -420,
    accent: ROLE.expired,
    size: 52,
  });

  const bgAura = aura(150, 40, 660, '#ff6b8b1e', '#5ce1e618');

  const dyn = guardedDynamic(
    () => 1,
    () => {
      const m = mode.value;
      const nodes = [];

      if (m < 0.5) {
        // Signature 1: Flapping replicas + 800ms mean hiding 30,000ms tail
        nodes.push(
          txt(
            'SIGNATURE 1: FLAPPING & HIDDEN TAILS',
            860,
            -355,
            26,
            ROLE.expired,
            'mono',
            'right',
          ).glow(6, ROLE.expired),
          txt('Reported Mean: 800 ms', -860, -165, 32, ROLE.cold, 'mono', 'left'),
          glowBar(-410, -165, 1220, 40, 0.06, { fill: ROLE.cold, glow: 7 }),
          txt('Tail Wait: 30,000 ms', -860, -75, 32, ROLE.expired, 'mono', 'left').glow(
            8,
            ROLE.expired,
          ),
          glowBar(-410, -75, 1220, 40, 0.96, { fill: ROLE.expired, glow: 10 }),
        );

        // Flapping ready <-> starting oscillation across lower band
        const states = [
          'READY',
          'LULL -> KILL',
          'RELOAD 207s',
          'READY',
          'LULL -> KILL',
          'RELOAD 207s',
        ];
        for (let i = 0; i < states.length; i++) {
          const cx = -715 + i * 286;
          const isReady = i % 3 === 0;
          const col = isReady ? ROLE.warm : i % 3 === 1 ? ROLE.expired : ROLE.focus;
          nodes.push(
            rect(246, 78, { fill: '#111c33', stroke: col, width: 2.4, radius: 12 })
              .at(cx, 135)
              .glow(6, col),
            txt(states[i], cx, 135, 26, col, 'mono'),
          );
          if (i < states.length - 1) {
            nodes.push(
              beamWithPhotons(
                [
                  [cx + 126, 135],
                  [cx + 160, 135],
                ],
                col,
                0,
                { width: 3.0, glow: 7, photonCount: 1 },
              ),
            );
          }
        }

        nodes.push(
          txt(
            'Inspect queue age & TTFT tails by prompt length  ·  Keep rejects & timeouts in attainment',
            0,
            375,
            26,
            ROLE.focus,
            'sans',
          ),
        );
      } else if (m < 1.5) {
        // Signature 2: Retry amplification & traffic-class interference
        nodes.push(
          txt(
            'SIGNATURE 2: RETRY STORM & CLASS INTERFERENCE',
            860,
            -355,
            26,
            ROLE.focus,
            'mono',
            'right',
          ).glow(6, ROLE.focus),
        );
        const attempts = [
          { x: -620, label: 'R21 Attempt 1', sub: '429 full', col: ROLE.active },
          { x: 0, label: 'R21 Attempt 2', sub: 'backoff + cap', col: ROLE.focus },
          { x: 620, label: 'R21 Attempt 3', sub: 'orig deadline', col: ROLE.expired },
        ];
        for (let i = 0; i < attempts.length; i++) {
          const at = attempts[i];
          nodes.push(
            rect(380, 114, { fill: '#111c33', stroke: at.col, width: 2.8, radius: 14 })
              .at(at.x, -45)
              .glow(8, at.col),
            txt(at.label, at.x, -66, 28, at.col, 'mono'),
            txt(at.sub, at.x, -22, 26, COSMOS.ink, 'sans'),
          );
          if (i < attempts.length - 1) {
            nodes.push(
              beamWithPhotons(
                [
                  [at.x + 195, -45],
                  [attempts[i + 1].x - 195, -45],
                ],
                ROLE.expired,
                0,
                { width: 3.4, glow: 9, photonCount: 1 },
              ),
            );
          }
        }
        const backArc = quadArcPts([620, 20], [-620, 20], 155, 32);
        nodes.push(
          beamWithPhotons(backArc, ROLE.expired, 0, {
            width: 3.6,
            glow: 10,
            photonCount: 2,
          }),
          txt(
            'BOUND ADMISSION · PRESERVE DEADLINE · ISOLATE BATCH ANALYTICS',
            0,
            225,
            28,
            ROLE.focus,
            'mono',
          ).glow(7, ROLE.focus),
          txt(
            'Adding desired replicas cannot save callers whose wait deadline expires first',
            0,
            375,
            28,
            COSMOS.muted,
            'sans',
          ),
        );
      } else {
        // Signature 3: Chunked prefill protecting active decode streams
        nodes.push(
          txt(
            'SIGNATURE 3: CHUNKED PREFILL VS STREAM STALLS',
            860,
            -355,
            26,
            ROLE.warm,
            'mono',
            'right',
          ).glow(6, ROLE.warm),
          txt(
            'LONG PROMPT SPLIT INTO CHUNKS + INTERLEAVED DECODE STEPS',
            -840,
            -165,
            26,
            ROLE.active,
            'mono',
            'left',
          ),
        );

        for (let i = 0; i < 16; i++) {
          const isDecode = i % 4 === 3;
          const col = isDecode ? ROLE.warm : ROLE.cold;
          const cx = -785 + i * 104;
          nodes.push(
            rect(86, 86, {
              fill: isDecode ? '#0e2b25' : '#102342',
              stroke: col,
              width: 2.4,
              radius: 10,
            })
              .at(cx, -65)
              .glow(isDecode ? 9 : 5, col),
            txt(isDecode ? 'DEC' : 'PRE', cx, -65, 26, col, 'mono'),
          );
        }

        // Smooth active stream photon rail underneath
        nodes.push(
          beamWithPhotons(
            [
              [-820, 145],
              [820, 145],
            ],
            ROLE.warm,
            0,
            { width: 4.2, glow: 10, photonCount: 4 },
          ),
          glowDot(-460, 145, { radius: 11, color: ROLE.warm, glow: 14 }),
          glowDot(-40, 145, { radius: 11, color: ROLE.warm, glow: 14 }),
          glowDot(380, 145, { radius: 11, color: ROLE.warm, glow: 14 }),
          glowDot(800, 145, { radius: 11, color: ROLE.warm, glow: 14 }),
          txt(
            'Active streams keep advancing between shorter prefill chunks',
            0,
            215,
            28,
            ROLE.warm,
            'sans',
          ).glow(6, ROLE.warm),
          txt(
            'Change one cause at a time while holding request trace & release identity constant',
            0,
            375,
            26,
            COSMOS.muted,
            'sans',
          ),
        );
      }

      return group(...nodes);
    },
  );

  s.add(bgAura, header, dyn);

  tweenOn(s, c, 'ga-failure-diagnosis-b0', mode, 0, 0.2);
  tweenOn(s, c, 'ga-failure-diagnosis-b1', mode, 1, 0.35);
  tweenOn(s, c, 'ga-failure-diagnosis-b2', mode, 2, 0.35);
}
