// Scene 06: bytes: 256 UTF-8 bytes -> 3 chars ("関数✨") fan out into 9 bytes -> split garbage vs buffered decode.
import { linear, rect } from 'vizmatic/stage';
import { glyphNode } from '../../../films/tokenization/defaults.mjs';
import {
  ALPHABET,
  BYTES,
  BYTE_CHARS,
  COSMOS,
  ROLE,
  arcPts,
  aura,
  bindCueBeat,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  hex,
  playCue,
  swapVis,
  tokenPill,
  txt,
} from '../parts.mjs';

export default function bytes(s, c) {
  const show256 = s.value(0);
  const phase0Vis = s.value(1);
  const showThreeChars = s.value(0);
  const showNineBytes = s.value(0);
  const focusSparkle = s.value(0);
  const showGarbage = s.value(0);
  const showGather = s.value(0);
  const pulse = s.value(0);
  const cueEnergy = s.value(0);

  const bgAura = aura(0, 10, 740, '#40261224', '#16355c18');
  const title = heroTitle(['Bytes give every character', 'somewhere to go'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 62,
    accent: ROLE.byte,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const s256 = show256.value;
    const s3 = showThreeChars.value;
    const s9 = showNineBytes.value;
    const sp = focusSparkle.value;
    const gb = showGarbage.value;
    const gt = showGather.value;
    const p = 0.65 + 0.35 * Math.sin(pulse.value * Math.PI * 2);
    const nodes = [];

    // Phase 0: 6-letter corpus alphabet vs 256-byte base (disjoint from Phase 1)
    const p0 = phase0Vis.value;
    if (p0 > 0.02) {
      const a0 = alpha * p0;
      nodes.push(
        txt(
          `CORPUS ALPHABET (${ALPHABET.length} LETTERS)`,
          -855,
          -205,
          26,
          ROLE.token,
          'mono',
          'left',
        ).opacity(a0),
      );
      ALPHABET.forEach((ch, idx) => {
        nodes.push(
          tokenPill(ch, -790 + idx * 105, -120, { w: 84, h: 72, color: ROLE.token, opacity: a0 }),
        );
      });
      nodes.push(
        tokenPill('b → [UNK]', -80, -120, {
          w: 220,
          h: 72,
          color: ROLE.warn,
          fill: '#281320',
          opacity: a0,
        }),
        tokenPill('0x00 .. 0xFF (256)', 460, -120, {
          w: 380,
          h: 72,
          color: s256 > 0.2 ? ROLE.ok : COSMOS.rule,
          fill: s256 > 0.2 ? '#102b24' : '#0f1629',
          size: 28,
          opacity: (0.45 + 0.55 * s256) * a0,
        }),
      );
      // Persistent 4x16 byte-grid preview in lower canvas (eliminates empty space & illustrates 256 bytes!)
      for (let r = 0; r < 4; r++) {
        for (let col = 0; col < 16; col++) {
          const bx = -790 + col * 105;
          const by = 145 + r * 58;
          const lit = s256 > 0.2 && (r * 16 + col) % 7 === 0;
          nodes.push(
            rect(82, 38, {
              fill: lit ? '#13353a' : '#0f1629',
              stroke: s256 > 0.2 ? ROLE.ok : COSMOS.rule,
              width: 1.6,
              radius: 6,
            })
              .at(bx, by)
              .opacity((0.4 + 0.6 * s256) * a0),
          );
        }
      }
      if (s256 > 0.05) {
        nodes.push(
          txt(
            'BYTE-LEVEL BPE: 0x00 .. 0xFF (256 BASE SYMBOLS): ZERO [UNK] FOR ANY UTF-8 STRING',
            -855,
            55,
            26,
            ROLE.ok,
            'mono',
            'left',
          )
            .glow(6, ROLE.ok)
            .opacity(s256 * a0),
        );
      } else {
        nodes.push(
          txt(
            '256 UTF-8 BYTE TABLE (0x00 .. 0xFF)',
            -855,
            55,
            26,
            COSMOS.dim,
            'mono',
            'left',
          ).opacity(a0),
        );
      }
    }

    // Phase 1+: 3 characters -> 9 UTF-8 bytes
    if (s3 > 0.05) {
      const a1 = alpha * s3;
      const charXs = [-520, 0, 520];
      const charY = -175;
      const byteY = 70;

      BYTE_CHARS.forEach((entry, ci) => {
        const isSparkle = ci === 2;
        const col = isSparkle && sp > 0.3 ? ROLE.merge : ROLE.piece;
        nodes.push(
          rect(140, 92, { fill: '#10182d', stroke: col, width: 2.8, radius: 12 })
            .at(charXs[ci], charY)
            .glow(isSparkle && sp > 0.3 ? 14 * p : 8, col)
            .opacity(a1),
          glyphNode(entry.ch, 50, COSMOS.ink).at(charXs[ci], charY).opacity(a1),
        );

        entry.bytes.forEach((b, bi) => {
          const bx = charXs[ci] + (bi - 1) * 140;
          const bCol = isSparkle && sp > 0.3 ? ROLE.merge : ROLE.byte;
          const byteOp = s9 > 0.05 ? s9 * a1 : 0.28 * a1;
          nodes.push(
            glowingTrail(arcPts([charXs[ci], charY + 48], [bx, byteY - 40], -10, 18), {
              color: s9 > 0.05 ? bCol : COSMOS.rule,
              width: isSparkle && sp > 0.3 ? 4 : 2.6,
              glow: s9 > 0.05 ? (isSparkle && sp > 0.3 ? 10 : 5) : 0,
              opacity: byteOp,
            }),
            tokenPill(s9 > 0.05 ? hex(b) : '0x??', bx, byteY, {
              w: 112,
              h: 66,
              color: s9 > 0.05 ? bCol : COSMOS.rule,
              size: 28,
              opacity: byteOp,
            }),
          );
        });
      });

      // Persistent decode strip frame at y=245 so lower canvas stays balanced
      if (gb <= 0.05) {
        nodes.push(
          txt('UTF-8 STREAMING DECODE BUFFER', -855, 245, 26, COSMOS.dim, 'mono', 'left').opacity(
            0.45 * a1,
          ),
        );
      }

      if (s9 > 0.05) {
        nodes.push(
          txt(
            `${BYTE_CHARS.length} characters → ${BYTES.length} UTF-8 bytes (9 tokens without merges)`,
            0,
            -280,
            30,
            ROLE.merge,
            'mono',
            'center',
          )
            .glow(6, ROLE.merge)
            .opacity(s9 * a1),
        );
      }

      // Bottom: decode one byte alone -> replacement garbage vs gather first -> exact text
      if (gb > 0.05) {
        nodes.push(
          txt('Decode 1 byte alone:', -855, 245, 28, ROLE.warn, 'mono', 'left').opacity(gb * a1),
          tokenPill('U+FFFD ?', -390, 245, {
            w: 230,
            h: 68,
            color: ROLE.warn,
            fill: '#261220',
            size: 30,
            opacity: gb * a1,
          }),
        );
      }
      if (gt > 0.05) {
        nodes.push(
          txt('Buffer full character:', 40, 245, 28, ROLE.ok, 'mono', 'left').opacity(gt * a1),
          rect(240, 74, { fill: '#10182d', stroke: ROLE.ok, width: 2.8, radius: 12 })
            .at(545, 245)
            .glow(10, ROLE.ok)
            .opacity(gt * a1),
          ...BYTE_CHARS.map((entry, idx) =>
            glyphNode(entry.ch, 40, COSMOS.ink)
              .at(485 + idx * 60, 245)
              .opacity(gt * a1),
          ),
          txt(
            'Streaming decoders hold incomplete multi-byte sequences until complete',
            0,
            370,
            28,
            COSMOS.muted,
            'sans',
            'center',
          ).opacity(gt * a1),
        );
      }
    }

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  const totalDur = Math.max(1, c.end - c.start - 0.5);
  c.at(0.1, () => {
    s.play(pulse.to(6, { duration: totalDur, ease: linear }));
  });

  playCue(s, c, 'bytes', (d) => s.play(show256.to(1, { duration: d })), { dur: 0.5 });
  playCue(s, c, 'three-chars', (d) => s.play(swapVis(phase0Vis, showThreeChars, d)), { dur: 0.65 });
  playCue(s, c, 'nine-bytes', (d) => s.play(showNineBytes.to(1, { duration: d })), {
    after: true,
    dur: 0.65,
  });
  playCue(s, c, 'four-byte', (d) => s.play(focusSparkle.to(1, { duration: d })), { dur: 0.5 });
  playCue(s, c, 'garbage', (d) => s.play(showGarbage.to(1, { duration: d })), { dur: 0.5 });
  playCue(s, c, 'gather', (d) => s.play(showGather.to(1, { duration: d })), { dur: 0.5 });
  bindCueBeat(s, c, cueEnergy, [
    'six',
    'stuck',
    'utf8',
    'no-unknown',
    'costs-more',
    'three-count',
    'mid-char',
    'hold-back',
  ]);
}
