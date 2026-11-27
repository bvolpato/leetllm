// Scene 17: canary-buffer - Inspect a complete payload before releasing its bytes
// 16-byte (128-bit) canary entropy strip + split-chunk streaming reassembly buffer:
// two chunks (`"CAN"` and `"ARY_Z9"`) slip past independent per-chunk checks, then dock
// inside the host's assembled buffer where `CANARY_Z9` ignites crimson and trips the
// egress circuit breaker before a single byte reaches the recipient.
import { group, line, rect } from 'vizmatic/stage';
import {
  CANARY_BITS,
  CANARY_BYTES,
  CANARY_CHUNKS,
  CANARY_TOKEN,
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  circuitBreaker,
  clampDur,
  energyRail,
  guardedDynamic,
  quadArcPts,
  txt,
} from '../parts.mjs';

const HEX_BYTES = [
  '9F',
  '2A',
  'D4',
  '0E',
  '71',
  'C8',
  '53',
  'B6',
  '1D',
  'E2',
  '48',
  'A7',
  '6C',
  '39',
  'F0',
  '8B',
];

export default function canaryBuffer(s, c) {
  const pulse = s.value(0);
  const entropyHi = s.value(0);
  const hitOn = s.value(0);
  const joinChunks = s.value(0); // 0 -> 1 slides chunks together into assembled buffer
  const holdOn = s.value(0);

  const header = cinemaHeader(
    'CANARY TOKENS & BUFFERED SCANNING',
    'Inspect a complete payload',
    'before releasing its bytes',
    { accent: ROLE.canary, size: 48 },
  );

  const stageAura = aura(100, 30, 620, '#fb923c1a', '#ff6b8b1c');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = 0;
      const eh = entropyHi.value;
      const ht = hitOn.value;
      const jc = joinChunks.value;
      const ho = holdOn.value;
      const nodes = [];

      // Top Strip: 16 random bytes = 128 random bits
      const bx0 = -820;
      const by = -182;
      const bw = 96;
      const bgap = 10;
      nodes.push(
        txt(
          `FRESH SESSION CANARY: ${CANARY_BYTES} RANDOM BYTES × 8 BITS = ${CANARY_BITS} RANDOM BITS`,
          0,
          -244,
          26,
          eh > 0.3 ? ROLE.canary : ROLE.host,
          'mono',
          'center',
        ).glow(eh > 0.3 ? 6 : 0, ROLE.canary),
      );
      for (let i = 0; i < CANARY_BYTES; i++) {
        const cx = bx0 + i * (bw + bgap) + bw * 0.5;
        nodes.push(
          rect(bw, 54, {
            fill: eh > 0.3 ? '#1c1830' : '#0e1529',
            stroke: eh > 0.3 ? ROLE.canary : '#2f426e',
            width: 2,
            radius: 6,
          }).at(cx, by),
          txt(HEX_BYTES[i], cx, by, 26, eh > 0.3 ? ROLE.canary : COSMOS.muted, 'mono', 'center'),
        );
      }

      // Middle Workbench: Split Chunks -> Assembled Host Buffer -> Tripped Breaker -> Recipient
      const midY = 38;
      const leftChunkX = -560 + jc * 340;
      const rightChunkX = -200 + jc * 185;
      const joined = jc > 0.72;

      nodes.push(
        txt(
          joined
            ? 'ASSEMBLED HOST BUFFER (CROSS-CHUNK MATCH!)'
            : 'SEPARATE STREAM CHUNKS (PER-CHUNK MISS)',
          -210,
          -62,
          26,
          joined ? ROLE.attack : ROLE.untrusted,
          'mono',
          'center',
        ).glow(joined ? 8 : 0, ROLE.attack),
      );

      // Buffer enclosure
      nodes.push(
        rect(610, 128, {
          fill: '#0b1020',
          stroke: joined ? ROLE.attack : '#2c3d66',
          width: joined ? 3.2 : 2,
          radius: 12,
          dash: joined ? null : [8, 8],
        })
          .at(-110, midY)
          .glow(joined ? 10 : 0, ROLE.attack),
      );

      if (!joined) {
        nodes.push(
          rect(200, 74, { fill: '#141c33', stroke: ROLE.ok, width: 2.4, radius: 8 }).at(
            leftChunkX,
            midY,
          ),
          txt(`"${CANARY_CHUNKS[0]}"`, leftChunkX, midY, 30, ROLE.ok, 'mono', 'center'),
          rect(240, 74, { fill: '#141c33', stroke: ROLE.ok, width: 2.4, radius: 8 }).at(
            rightChunkX,
            midY,
          ),
          txt(`"${CANARY_CHUNKS[1]}"`, rightChunkX, midY, 30, ROLE.ok, 'mono', 'center'),
          txt(
            'scan("CAN") = ok   ·   scan("ARY_Z9") = ok',
            -380,
            midY + 96,
            26,
            COSMOS.muted,
            'mono',
            'center',
          ),
        );
      } else {
        nodes.push(
          rect(420, 78, { fill: '#28111c', stroke: ROLE.attack, width: 3, radius: 8 })
            .at(-110, midY)
            .glow(12, ROLE.attack),
          txt(`"${CANARY_TOKEN}" DETECTED`, -110, midY, 32, ROLE.attack, 'mono', 'center').glow(
            8,
            ROLE.attack,
          ),
          txt(
            'Assembled buffer catches split marker',
            -160,
            midY + 96,
            26,
            ROLE.attack,
            'mono',
            'center',
          ),
        );
      }

      // Egress Circuit Breaker + Recipient on Right
      const brkX = 355;
      const recX = 685;
      const tripped = Math.max(ht, jc, ho);
      const bIn = quadArcPts([200, midY], [brkX - 65, midY], 0, 14);
      nodes.push(
        beamWithPhotons(bIn, tripped > 0.4 ? ROLE.attack : ROLE.ok, p * 1.1, { width: 3.4 }),
        circuitBreaker(brkX, midY, 116, tripped, ROLE.ok),
        txt(
          ho > 0.3 ? 'HELD' : tripped > 0.4 ? 'TRIPPED' : 'EGRESS',
          brkX,
          midY + 76,
          26,
          tripped > 0.4 ? ROLE.denied : ROLE.host,
          'mono',
          'center',
        ),
        rect(270, 118, {
          fill: '#0e1529',
          stroke: ho > 0.3 ? ROLE.ok : '#344770',
          width: 2.6,
          radius: 10,
        }).at(recX, midY),
        txt('RECIPIENT', recX, midY - 22, 26, COSMOS.muted, 'mono', 'center'),
        txt(
          ho > 0.3 ? '0 BYTES LEAKED' : 'AWAITING REPLY',
          recX,
          midY + 24,
          26,
          ho > 0.3 ? ROLE.ok : COSMOS.ink,
          'mono',
          'center',
        ).glow(ho > 0.3 ? 8 : 0, ROLE.ok),
      );

      // Bottom Scope Warning (exact-character scanner limitation)
      nodes.push(
        line([-855, 228], [845, 228], { stroke: '#25355a', width: 2 }),
        energyRail(-855, 262, 392, ROLE.host, { width: 5 }),
        txt('EXACT-CHARACTER SCOPE', -825, 286, 26, ROLE.host, 'mono', 'left'),
        txt(
          'Ordinary summary has no match -> passes · Exact canary trips -> hold before delivery',
          -825,
          336,
          26,
          COSMOS.ink,
          'sans',
          'left',
        ),
        txt(
          'Unmarked private text can still escape -> limit reader inputs & enforce recipient field policy',
          -825,
          382,
          26,
          ROLE.untrusted,
          'mono',
          'left',
        ),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);

  c.on('pi-canary-buffer-0', () => {
    s.play(entropyHi.to(0.6, { duration: clampDur(c, c.cue('pi-canary-buffer-0').start, 0.35) }));
  });
  c.on('canary-bits', () => {
    s.play(entropyHi.to(1, { duration: clampDur(c, c.cue('canary-bits').start, 0.35) }));
  });
  c.on('pi-canary-buffer-1', () => {
    s.play(hitOn.to(0.4, { duration: clampDur(c, c.cue('pi-canary-buffer-1').start, 0.35) }));
  });
  c.on('pi-canary-hit', () => {
    s.play(hitOn.to(1, { duration: clampDur(c, c.cue('pi-canary-hit').start, 0.35) }));
  });
  c.on('pi-canary-cross', () => {
    s.play(joinChunks.to(1, { duration: clampDur(c, c.cue('pi-canary-cross').start, 0.65) }));
  });
  c.on('pi-canary-buffer-2', () => {
    s.play(holdOn.to(1, { duration: clampDur(c, c.cue('pi-canary-buffer-2').start, 0.4) }));
  });
}
