// Scene 06: pack: 5 signed 4-bit codes [0, -4, 7, -1, 2] -> 3 nibble-packed bytes [0xC0, 0xF7, 0x02] + decode back with count=5 & scale.
import {
  CODEC_EX,
  COSMOS,
  ROLE,
  arrow,
  aura,
  chipPill,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  rect,
  txt,
} from '../parts.mjs';

export default function pack(s, c) {
  const showPack = s.value(0);
  const showPad = s.value(0);
  const showDecode = s.value(0);

  const bgAura = aura(0, 0, 740, '#14335c28', '#20184422');
  const title = heroTitle(['Nibble Packing & Unpacking:', 'Two 4-Bit Codes per Byte'], {
    x: -855,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.code,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const pk = showPack.value;
    const pd = showPad.value;
    const dc = showDecode.value;

    const bytesHex = ['0xC0  (lo: 0, hi: -4)', '0xF7  (lo: 7, hi: -1)', '0x02  (lo: 2, hi: pad 0)'];

    const nodes = [
      txt(
        '5 CHOSEN SIGNED 4-BIT CODES -> 3 PACKED BYTES (LOSS-FREE STORAGE)',
        -855,
        -225,
        26,
        ROLE.grid,
        'mono',
        'left',
      ).opacity(alpha),
    ];

    CODEC_EX.codes.forEach((code, idx) => {
      const cx = -640 + idx * 320;
      nodes.push(
        chipPill(`w[${idx}] -> q=${code}`, cx, -135, {
          w: 270,
          h: 68,
          color: ROLE.weight,
          size: 26,
          opacity: alpha,
        }),
      );
    });

    bytesHex.forEach((lbl, idx) => {
      const cx = -540 + idx * 540;
      const isPadByte = idx === 2;
      nodes.push(
        arrow([cx, -85], [cx, -18], {
          stroke: ROLE.code,
          width: 3.5,
          head: 11,
        }).opacity(alpha * (0.45 + 0.55 * pk)),
        rect(480, 82, {
          fill: isPadByte && pd > 0.35 ? '#261e10' : '#121a34',
          stroke: isPadByte && pd > 0.35 ? ROLE.gold : ROLE.code,
          width: 2.8,
          radius: 12,
        })
          .at(cx, 42)
          .opacity(alpha * (0.48 + 0.52 * pk)),
        txt(
          lbl,
          cx,
          42,
          26,
          isPadByte && pd > 0.35 ? ROLE.gold : COSMOS.ink,
          'mono',
          'center',
        ).opacity(alpha * (0.48 + 0.52 * pk)),
      );
    });

    nodes.push(
      chipPill(
        dc > 0.35
          ? `Decoded with count=5 & scale=${CODEC_EX.scale.toFixed(3)}: stops after 5th code (ignores pad nibble!)`
          : 'Byte order: low nibble holds even index, high nibble holds odd index (5th code gets 0 pad)',
        0,
        225,
        {
          w: 1620,
          h: 78,
          color: dc > 0.35 ? ROLE.ok : ROLE.gold,
          fill: dc > 0.35 ? '#0f2d24' : '#10182d',
          size: 26,
          glow: 10,
          opacity: alpha,
        },
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'preserve-code', (d) => s.play(showPack.to(0.3, { duration: d })));
  playCue(s, c, 'code-packing', (d) => s.play(showPack.to(0.6, { duration: d })));
  playCue(s, c, 'pair-nibbles', (d) => s.play(showPack.to(1, { duration: d })));
  playCue(s, c, 'padding-nibble', (d) => s.play(showPad.to(1, { duration: d })));
  playCue(s, c, 'decode-codes', (d) => s.play(showDecode.to(0.6, { duration: d })));
  playCue(s, c, 'shared-metadata', (d) => s.play(showDecode.to(1, { duration: d })));
}
