// Scene 02: Where does the feedback come from? (SFT, RLHF, DPO, RLVR + Tulu 3 reward structure)
import {
  COSMOS,
  aura,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function alignmentSpace(s, c) {
  const phase = s.value(0);
  const sft = s.value(0);
  const rlhf = s.value(0);
  const dpo = s.value(0);
  const rlvr = s.value(0);
  const tuluCheck = s.value(0);
  const tuluEnd = s.value(0);

  const bgAura = aura(0, 20, 640, '#14385c26', '#2c1e5414');
  const title = heroTitle(['Where Does the', 'Feedback Come From?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.cyan,
    eyebrow: 'POST-TRAINING LANDSCAPE · FEEDBACK -> OBJECTIVE',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const lanes = [
      {
        name: 'SFT',
        src: 'Worked gold answer',
        update: 'Token cross-entropy',
        col: COSMOS.blue,
        v: Math.max(0.45, sft.value),
        y: -155,
      },
      {
        name: 'RLHF',
        src: 'Human ranking pairs',
        update: 'Reward model + RL',
        col: COSMOS.violet,
        v: Math.max(0.45, rlhf.value),
        y: -35,
      },
      {
        name: 'DPO',
        src: 'Preferred vs rejected',
        update: 'Direct log-ratio loss',
        col: COSMOS.gold,
        v: Math.max(0.45, dpo.value),
        y: 85,
      },
      {
        name: 'RLVR',
        src: 'Executable checker',
        update: 'PPO / GRPO (or DPO pairs)',
        col: COSMOS.emerald,
        v: Math.max(0.45, rlvr.value),
        y: 205,
      },
    ];

    const nodes = [
      txt('METHOD', -780, -238, 26, COSMOS.muted, 'mono', 'left'),
      txt('FEEDBACK SOURCE', -430, -238, 26, COSMOS.muted, 'mono', 'left'),
      txt('POLICY UPDATE', 10, -238, 26, COSMOS.muted, 'mono', 'left'),
      txt('TULU 3 PPO REWARD SCALE', 630, -238, 26, COSMOS.gold, 'mono'),
    ];

    lanes.forEach((ln) => {
      const active = ln.v > 0.7;
      nodes.push(
        glassCell(-700, ln.y, 170, 78, ln.col, {
          fill: active ? '#12243b' : '#0f1526',
          glow: active ? 9 * pulse : 2,
          opacity: ln.v,
        }),
        txt(ln.name, -700, ln.y + 2, 32, ln.col, 'mono').opacity(ln.v),
        glowingArc([-610, ln.y], [-450, ln.y], 0, { color: ln.col, width: 3, opacity: ln.v }),
        txt(ln.src, -430, ln.y + 2, 28, COSMOS.ink, 'sans', 'left').opacity(ln.v),
        glowingArc([-110, ln.y], [-10, ln.y], 0, { color: ln.col, width: 3, opacity: ln.v }),
        txt(ln.update, 10, ln.y + 2, 28, ln.col, 'mono', 'left').opacity(ln.v),
      );
    });

    // Right column: Tulu 3 reward breakdown (+10 checked, 0 fail, -10 missing EOS)
    const tc = Math.max(0.45, tuluCheck.value);
    const te = tuluEnd.value;
    const rx = 630;
    nodes.push(
      rect(340, 48, { fill: COSMOS.emerald, stroke: null, radius: 8 })
        .at(rx, -120)
        .glow(tc > 0.7 ? 9 : 2, COSMOS.emerald)
        .opacity(tc),
      txt('Checked pass:  +10', rx, -118, 28, COSMOS.bg, 'mono').opacity(tc),

      rect(180, 48, { fill: '#222b44', stroke: COSMOS.muted, width: 2, radius: 8 })
        .at(rx, -18)
        .opacity(tc),
      txt('Fail:  0', rx, -16, 28, COSMOS.muted, 'mono').opacity(tc),
    );

    if (te > 0.05) {
      nodes.push(
        rect(340, 48, { fill: COSMOS.rose, stroke: null, radius: 8 })
          .at(rx, 84)
          .glow(9 * pulse, COSMOS.rose)
          .opacity(te),
        txt('Missing EOS:  -10', rx, 86, 28, COSMOS.bg, 'mono').opacity(te),
        glowDot(rx - 170, 186, { radius: 6, color: COSMOS.gold, opacity: te }),
        txt('Scale & combination set', rx - 144, 174, 26, COSMOS.gold, 'sans', 'left').opacity(te),
        txt('which answers win most', rx - 144, 210, 26, COSMOS.muted, 'sans', 'left').opacity(te),
      );
    }

    nodes.push(
      txt(
        'Checkers can award binary or partial credit, or rank pairs for DPO',
        0,
        355,
        28,
        COSMOS.muted,
        'sans',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('method-sft', () => s.play(sft.to(1, { duration: 0.45 })));
  c.on('method-rlhf', () => s.play(rlhf.to(1, { duration: 0.45 })));
  c.on('method-dpo', () => s.play(dpo.to(1, { duration: 0.45 })));
  c.on('method-rlvr', () => s.play(rlvr.to(1, { duration: 0.5 })));
  c.on('tulu-checked', () => s.play(tuluCheck.to(1, { duration: 0.5 })));
  c.on('tulu-end', () => s.play(tuluEnd.to(1, { duration: remainDuration(c, 'tulu-end', 0.55) })));
}
