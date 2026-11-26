// Scene 07: codec-contract: 15-byte layout (4B count + 8B scale + 3B codes), -8 reserved, ties-to-even, reject count=7 on 3B payload.
import {
  COSMOS,
  ROLE,
  aura,
  chipPill,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  rect,
  txt,
} from '../parts.mjs';

export default function codecContract(s, c) {
  const showLayout = s.value(0);
  const corruptCount = s.value(0);
  const showReject = s.value(0);

  const bgAura = aura(0, 0, 740, '#14335c28', '#2a162422');
  const title = heroTitle(['Codec Binary Contract:', 'Header, Payload Length & Reserved -8'], {
    x: -855,
    y: -430,
    size: 46,
    lineHeight: 54,
    accent: ROLE.err,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const cc = corruptCount.value;
    const rj = showReject.value;

    const nodes = [
      txt(
        '15-BYTE SIGNED 4-BIT CONTAINER  |  USABLE CODES: -7..+7 (-8 RESERVED, TIES-TO-EVEN)',
        -855,
        -225,
        26,
        ROLE.grid,
        'mono',
        'left',
      ).opacity(alpha),

      // 3 contiguous binary blocks
      rect(360, 120, {
        fill: cc > 0.35 ? '#361422' : '#10243d',
        stroke: cc > 0.35 ? ROLE.err : ROLE.grid,
        width: 3,
        radius: 12,
      })
        .at(-580, -55)
        .opacity(alpha),
      txt('4B uint32 count', -580, -82, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
      txt(
        cc > 0.35 ? 'count = 7 (tampered!)' : 'count = 5',
        -580,
        -32,
        28,
        cc > 0.35 ? ROLE.err : ROLE.ok,
        'mono',
        'center',
      ).opacity(alpha),

      rect(540, 120, { fill: '#142038', stroke: ROLE.gold, width: 2.6, radius: 12 })
        .at(-100, -55)
        .opacity(alpha),
      txt('8B float64 scale', -100, -82, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
      txt('scale = 2.4 / 7 = 0.3429', -100, -32, 28, ROLE.gold, 'mono', 'center').opacity(alpha),

      rect(520, 120, { fill: '#181434', stroke: ROLE.code, width: 2.6, radius: 12 })
        .at(460, -55)
        .opacity(alpha),
      txt('3B nibble payload', 460, -82, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
      txt('[0xC0, 0xF7, 0x02]', 460, -32, 28, ROLE.code, 'mono', 'center').opacity(alpha),

      // Contract validation checks
      chipPill(
        rj > 0.35
          ? 'REJECTED! count=7 needs ceil(7/2)=4 bytes, but payload has only 3 bytes'
          : 'Contract check: payload length must equal ceil(count / 2) bytes',
        0,
        120,
        {
          w: 1500,
          h: 76,
          color: rj > 0.35 ? ROLE.err : ROLE.ok,
          fill: rj > 0.35 ? '#321420' : '#0f2d24',
          size: 27,
          glow: 10,
          opacity: alpha,
        },
      ),
      chipPill(
        'Also rejects reserved nibble 0x8 (signed -8) & non-finite scales before dequantization',
        0,
        235,
        {
          w: 1500,
          h: 72,
          color: ROLE.gold,
          fill: '#10182d',
          size: 26,
          glow: 6,
          opacity: alpha * (0.5 + 0.5 * Math.max(showLayout.value, rj)),
        },
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'codec-contract-build-0', (d) => s.play(showLayout.to(0.5, { duration: d })));
  playCue(s, c, 'codec-contract-build-1', (d) => s.play(showLayout.to(1, { duration: d })));
  playCue(s, c, 'change-count', (d) => s.play(corruptCount.to(1, { duration: d })));
  playCue(s, c, 'reject-short-payload', (d) => s.play(showReject.to(1, { duration: d })));
}
