// Scene 03: recurrence: Four common-scale state updates h_t = 0.9 h_{t-1} + 0.2 x_t on [3, 1, 4, 2].
import {
  COSMOS,
  ROLE,
  aura,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  hs,
  lumBar,
  playCue,
  txt,
  xs,
} from '../parts.mjs';

export default function recurrence(s, c) {
  const stepShown = s.value(1); // 1 -> 2 -> 3 -> 4
  const showReadout = s.value(0);

  const bgAura = aura(0, 0, 740, '#103c3626', '#1b2b6018');
  const title = heroTitle(['What gets', 'into the state?'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 62,
    accent: ROLE.carry,
  });

  const eq = glowTex(String.raw`h_t = 0.9\,h_{t-1} + 0.2\,x_t`, {
    x: 495,
    y: -380,
    size: 40,
    color: ROLE.delta,
    glow: 6,
  });

  const stageVis = s.value(1);
  const maxVal = 1.85;
  const maxW = 760;
  const barX = -430;

  const layer = guardedDynamic(stageVis, (alpha) => {
    const k = Math.round(stepShown.value);
    const rd = showReadout.value;
    const nodes = [
      txt('CARRY (0.9 × h_{t-1})', barX, -210, 26, ROLE.carry, 'mono', 'left').opacity(alpha),
      txt('+ WRITE (0.2 × x_t)', barX + 360, -210, 26, ROLE.write, 'mono', 'left').opacity(alpha),
    ];

    for (let i = 0; i < 4; i++) {
      const y = -115 + i * 112;
      const active = i < k;
      const oldH = i === 0 ? 0 : hs[i - 1];
      const carry = 0.9 * oldH;
      const write = 0.2 * xs[i];
      const total = hs[i];
      const carryW = (carry / maxVal) * maxW;
      const writeW = (write / maxVal) * maxW;
      const rAlpha = (active ? 1 : 0.26) * alpha;

      nodes.push(
        txt(
          `t=${i + 1}  (x=${xs[i]})`,
          -855,
          y,
          32,
          active ? COSMOS.ink : COSMOS.dim,
          'mono',
          'left',
        ).opacity(alpha),
      );
      if (active) {
        if (carry > 0.001) {
          nodes.push(lumBar(barX, y, carryW, 38, ROLE.carry, { opacity: alpha, glow: 8 }));
        }
        nodes.push(
          lumBar(barX + carryW, y, writeW, 38, ROLE.write, { opacity: alpha, glow: 10 }),
          txt(
            `${carry.toFixed(2)} + ${write.toFixed(2)} = ${total.toFixed(4)}`,
            barX + carryW + writeW + 28,
            y,
            28,
            i === 3 ? ROLE.state : COSMOS.ink,
            'mono',
            'left',
          )
            .glow(i === 3 ? 8 : 0, ROLE.state)
            .opacity(alpha),
        );
      } else {
        nodes.push(
          lumBar(barX, y, 16, 38, COSMOS.dim, { opacity: rAlpha, glow: 0, maxTrackW: maxW }),
          txt('pending', barX + maxW + 28, y, 26, COSMOS.dim, 'mono', 'left').opacity(alpha),
        );
      }
    }

    if (rd > 0.05) {
      nodes.push(
        txt(
          `Output y_4 = C · h_4 + D · x_4   (here C=1, D=0 → y_4 = ${hs[3].toFixed(4)})`,
          -855,
          365,
          30,
          ROLE.state,
          'mono',
          'left',
        )
          .glow(8, ROLE.state)
          .opacity(rd * alpha),
      );
    }
    return group(...nodes);
  });

  s.add(bgAura, title, eq, layer);
  playCue(s, c, 'first-update', (d) => s.play(stepShown.to(1, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'second-update', (d) => s.play(stepShown.to(2, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'third-update', (d) => s.play(stepShown.to(3, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'fourth-update', (d) => s.play(stepShown.to(4, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'read-slot', (d) => s.play(showReadout.to(1, { duration: d })), { dur: 0.5 });
}
