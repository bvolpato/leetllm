// Scene 18: iteration-boundary - Let a short request join without waiting for a whole answer
// Beat 0: Continuous iteration-level batching (X exits at step 0, B joins at step 1 while A continues).
// Beat 1: Chunked prefill splitting a long prompt into bounded chunks interleaved with decode.
// Beat 2: 8-token step budget scheduling 3 decode slots first, then 5 prompt tokens.
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  driftValue,
  guardedDynamic,
  playOn,
  stepAfter,
  stepOn,
  txt,
} from '../parts.mjs';

export default function iterationBoundary(s, c) {
  const pulse = s.value(0);
  const iterProg = s.value(0);
  const memberOn = s.value(0);
  const b1On = s.value(0);
  const chunkProg = s.value(0);
  const b2On = s.value(0);
  const decSlots = s.value(0);
  const preSlots = s.value(0);

  const stageAura = aura(0, 20, 760, '#5ce1e61c', '#ffd16614');
  const header = cinemaHeader(
    'CONTINUOUS BATCHING & CHUNKED PREFILL',
    'Let a short request join without',
    'waiting for a whole answer',
    { x: -860, y: -450, accent: ROLE.shared, size: 46 },
  );

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = pulse.value;
      const iters = Math.max(1, Math.min(4, Math.ceil(iterProg.value * 4)));
      const mem = memberOn.value > 0.5;
      const b1 = b1On.value > 0.5;
      const chunksFilled = Math.min(6, Math.round(chunkProg.value * 6));
      const b2 = b2On.value > 0.5;
      const nDec = Math.round(decSlots.value);
      const nPre = Math.round(preSlots.value);

      const nodes = [];

      if (!b1 && !b2) {
        // Beat 0: 4 model step columns showing membership changing between steps
        nodes.push(
          txt('ITERATION-LEVEL MEMBERSHIP BOUNDARIES', 840, -395, 26, ROLE.shared, 'mono', 'right'),
        );
        const colX = [-600, -200, 200, 600];
        colX.forEach((cx, i) => {
          const active = i < iters;
          nodes.push(
            txt(`Step ${i}`, cx, -210, 28, active ? COSMOS.ink : COSMOS.muted, 'mono', 'center'),
            rect(320, 390, {
              fill: '#0b1224',
              stroke: active ? '#3c5588' : '#1f2b47',
              width: 2.2,
              radius: 16,
            }).at(cx, 15),
          );
          if (active) {
            // Top lane: A continues across every step
            nodes.push(
              rect(270, 118, { fill: '#0d1b33', stroke: ROLE.A, width: 2.8, radius: 12 })
                .at(cx, -65)
                .glow(7, ROLE.A),
              txt('A continues', cx, -78, 28, ROLE.A, 'mono', 'center'),
              txt('keeps KV state', cx, -36, 26, COSMOS.muted, 'sans', 'center'),
            );
            // Bottom lane: X finishes at step 0, B enters immediately at step 1!
            const isX = i === 0;
            const col = isX ? ROLE.held : ROLE.B;
            nodes.push(
              rect(270, 118, {
                fill: isX ? '#1e190b' : '#24101c',
                stroke: col,
                width: 2.8,
                radius: 12,
              })
                .at(cx, 102)
                .glow(7, col),
              txt(isX ? 'X finishes' : 'B admitted', cx, 88, 28, col, 'mono', 'center'),
              txt(
                isX ? 'exits batch' : 'joins step 1',
                cx,
                130,
                26,
                COSMOS.muted,
                'sans',
                'center',
              ),
            );
          }
          if (i < 3) {
            nodes.push(
              line([cx + 165, 15], [colX[i + 1] - 165, 15], { stroke: ROLE.shared, width: 3 }),
            );
          }
        });
        nodes.push(
          txt(
            mem
              ? 'Finished sequences exit and compatible work joins between steps; A keeps its history.'
              : 'Static batches force short requests to wait behind the longest answer.',
            0,
            390,
            30,
            mem ? ROLE.ok : COSMOS.muted,
            'sans',
            'center',
          ),
        );
      } else if (b1 && !b2) {
        // Beat 1: Chunked prefill interleaving bounded prompt chunks with decode
        nodes.push(
          txt('LONG PROMPT SPLIT INTO BOUNDED CHUNKS', -840, -215, 28, ROLE.held, 'mono', 'left'),
          txt('INTERLEAVED WITH LIVE DECODE', 840, -215, 28, ROLE.shared, 'mono', 'right'),
        );
        for (let i = 0; i < 6; i++) {
          const cx = -695 + i * 278;
          const sent = i < chunksFilled;
          nodes.push(
            rect(236, 116, {
              fill: sent ? '#151822' : '#221c0c',
              stroke: sent ? '#4e5d7e' : ROLE.held,
              width: 2.8,
              radius: 14,
            })
              .at(cx, -100)
              .glow(sent ? 0 : 7, ROLE.held),
            txt(`Chunk P${i + 1}`, cx, -112, 28, sent ? COSMOS.muted : ROLE.held, 'mono', 'center'),
            txt(
              sent ? 'dispatched' : 'queued',
              cx,
              -68,
              26,
              sent ? COSMOS.dim : COSMOS.ink,
              'sans',
              'center',
            ),

            rect(236, 126, { fill: '#0b1b2b', stroke: ROLE.shared, width: 2.8, radius: 14 })
              .at(cx, 152)
              .glow(sent ? 9 : 4, ROLE.shared),
            txt(`Step ${i + 1}`, cx, 126, 26, ROLE.shared, 'mono', 'center'),
            txt('Decode + P', cx, 174, 28, COSMOS.ink, 'mono', 'center'),
          );
          if (sent) {
            nodes.push(
              beamWithPhotons(
                [
                  [cx, -38],
                  [cx, 84],
                ],
                ROLE.held,
                p + i * 0.15,
                { width: 3.6, glow: 8, photonCount: 1 },
              ),
            );
          }
        }
        nodes.push(
          txt(
            'Chunked prefill caps per-step prompt work so active decode streams avoid long stalls.',
            0,
            390,
            30,
            ROLE.ok,
            'sans',
            'center',
          ),
        );
      } else {
        // Beat 2: 8-token iteration budget (3 decode slots first + 5 prompt slots)
        nodes.push(
          rect(760, 118, { fill: '#0b192b', stroke: ROLE.shared, width: 2.8, radius: 16 })
            .at(-440, -145)
            .glow(7, ROLE.shared),
          txt('1. PENDING DECODE WORK', -440, -172, 28, ROLE.shared, 'mono', 'center'),
          txt('Scheduled first: 3 token slots', -440, -120, 28, COSMOS.ink, 'sans', 'center'),

          rect(760, 118, { fill: '#1e190c', stroke: ROLE.held, width: 2.8, radius: 16 })
            .at(440, -145)
            .glow(7, ROLE.held),
          txt('2. QUEUED PROMPT WORK', 440, -172, 28, ROLE.held, 'mono', 'center'),
          txt('Fills remaining 5 slots; rest waits', 440, -120, 28, COSMOS.ink, 'sans', 'center'),

          txt(
            'ONE ITERATION TOKEN BUDGET:  8 SLOTS TOTAL',
            -835,
            22,
            28,
            COSMOS.ink,
            'mono',
            'left',
          ),
          txt(
            `${nDec} decode  +  ${nPre} prompt  =  ${nDec + nPre} / 8`,
            835,
            22,
            28,
            ROLE.ok,
            'mono',
            'right',
          ),
        );

        for (let i = 0; i < 8; i++) {
          const sx = -735 + i * 210;
          const isDec = i < nDec;
          const isPre = i >= 3 && i < 3 + nPre;
          const col = isDec ? ROLE.shared : isPre ? ROLE.held : '#31426b';
          const fill = isDec ? '#0d2538' : isPre ? '#261f0d' : '#0b1224';
          nodes.push(
            rect(182, 134, { fill, stroke: col, width: 3.0, radius: 14 })
              .at(sx, 148)
              .glow(isDec || isPre ? 9 : 0, col),
            txt(isDec ? 'D' : isPre ? 'P' : '·', sx, 132, 44, col, 'mono', 'center'),
            txt(
              isDec ? 'decode' : isPre ? 'prompt' : `slot ${i + 1}`,
              sx,
              186,
              26,
              isDec || isPre ? COSMOS.ink : COSMOS.dim,
              'sans',
              'center',
            ),
          );
        }

        nodes.push(
          txt(
            'Measure TTFT and per-tenant stream gaps as you tune the iteration token budget.',
            0,
            395,
            29,
            COSMOS.muted,
            'sans',
            'center',
          ),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  driftValue(s, c, pulse, 4.5);

  playOn(s, c, 'mt-iteration-boundary-b0', iterProg, 1, 1.4);
  stepAfter(s, c, 'mt-iteration-boundary-s0-1', memberOn, 1);
  stepOn(s, c, 'mt-iteration-boundary-b1', b1On, 1);
  playOn(s, c, 'mt-iteration-boundary-s1-1', chunkProg, 1, 1.4);
  stepOn(s, c, 'mt-iteration-boundary-b2', b2On, 1);
  c.on('mt-iteration-boundary-s2-0', () => {
    s.play(
      decSlots.to(3, { duration: clampDur(c, c.cue('mt-iteration-boundary-s2-0').start, 0.55) }),
    );
  });
  c.on('mt-iteration-boundary-s2-1', () => {
    s.play(
      preSlots.to(5, { duration: clampDur(c, c.cue('mt-iteration-boundary-s2-1').start, 0.7) }),
    );
  });
}
