// Scene 01: Which tensor can PyTorch flatten with a view? Transpose jumps (+3, -2) vs contiguous (+1).
import { group } from 'vizmatic/stage';
import {
  COSMOS,
  ORIGINAL_ORDER,
  ROLE,
  STORAGE_INIT,
  TRANSPOSED_ORDER,
  aura,
  buildStorageStrip3d,
  glassCell,
  glowDot,
  glowingArc,
  guardedDynamic,
  heroTitle,
  orbitScene,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function intro(s, c) {
  const mode3d = s.value(0);
  const phase = s.value(0);
  const goldStep = s.value(0); // 1=jump 0->3, 2=jump back 3->1
  const blueWalk = s.value(0);
  const revBlue = s.value(0);
  const revGold = s.value(0);

  const bgAura = aura(420, 20, 540, '#60a5fa20', '#ffd16618');
  const { view: strip3d } = buildStorageStrip3d(mode3d, phase, { x: 455, y: 25, unit: 92 });

  const title = heroTitle(['Which Tensor Can', 'Flatten with a View?'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.trans,
    eyebrow: 'SHARED 48-BYTE STORAGE · STRIDES',
  });

  const live = guardedDynamic(1, () => {
    const gs = goldStep.value;
    const bw = blueWalk.value;
    const rb = revBlue.value;
    const rg = revGold.value;
    const p = phase.value;

    const cellW = 144;
    const gap = 14;
    const startX = -810;
    const bankY = -75;

    const nodes = [
      txt('3D MEMORY STRIDE HOPPER', 455, -390, 26, ROLE.trans, 'mono').glow(5, ROLE.trans),
      txt(
        bw > 0.5 && rg < 0.5
          ? 'Contiguous row-major: +1 step per cell'
          : 'Transpose x.t(): leaps +3, then -2 back',
        455,
        405,
        26,
        bw > 0.5 && rg < 0.5 ? ROLE.orig : ROLE.trans,
        'mono',
      ),
      txt('FLAT INT64 STORAGE (6 CELLS · 48 BYTES)', -420, -214, 26, COSMOS.muted, 'mono'),
    ];

    STORAGE_INIT.forEach((v, i) => {
      const cx = startX + i * (cellW + gap) + cellW * 0.5;
      const isJump = gs >= 0.5 && (i === 0 || i === 3 || (gs >= 1.5 && i === 1));
      nodes.push(
        glassCell(cx, bankY, cellW, 96, isJump ? ROLE.trans : ROLE.orig, {
          fill: isJump ? '#251e10' : '#0f1b33',
          glow: isJump ? 9 : 4,
        }),
        txt(`b${i * 8}`, cx, bankY - 72, 26, COSMOS.muted, 'mono'),
        txt(String(v), cx, bankY + 2, 42, isJump ? ROLE.trans : COSMOS.ink, 'mono'),
      );
    });

    // Gold jump arcs above cells (placed cleanly in y=-160..-130? Wait: b0..b40 labels are at -147; place arcs BELOW at y=15..60!)
    const cxOf = (i) => startX + i * (cellW + gap) + cellW * 0.5;
    if (gs >= 0.5) {
      nodes.push(
        glowingArc(cxOf(0), bankY + 52, cxOf(3), bankY + 52, 56, ROLE.trans, { width: 3.4 }),
      );
    }
    if (gs >= 1.5) {
      nodes.push(
        glowingArc(cxOf(3), bankY + 52, cxOf(1), bankY + 52, 86, COSMOS.amber, { width: 3.0 }),
      );
    }
    if (bw >= 0.5) {
      const u = (p * 0.65) % 1;
      const bx = cxOf(0) + u * (cxOf(5) - cxOf(0));
      nodes.push(glowDot(bx, bankY - 102, { radius: 8, color: ROLE.orig }));
    }

    // Two matrix comparison tiles below (no answers leaked before revBlue / revGold!)
    nodes.push(
      glassCell(-610, 175, 440, 168, rb > 0.5 ? ROLE.good : ROLE.orig, {
        fill: rb > 0.5 ? '#0e2824' : '#0f1b33',
        glow: rb > 0.5 ? 10 : 4,
      }),
      txt('ORIGINAL  [2, 3]', -610, 120, 28, ROLE.orig, 'mono'),
      txt('strides (3, 1)  ·  step +1', -610, 168, 26, COSMOS.ink, 'mono'),
      txt(
        rb > 0.5 ? 'view(-1): OK (stride 1)' : 'Can view(-1) flatten this?',
        -610,
        220,
        26,
        rb > 0.5 ? ROLE.good : COSMOS.muted,
        'mono',
      ),

      glassCell(-110, 175, 480, 168, rg > 0.5 ? ROLE.bad : ROLE.trans, {
        fill: rg > 0.5 ? '#2b1220' : '#1f190f',
        glow: rg > 0.5 ? 10 : 4,
      }),
      txt('TRANSPOSE  [3, 2]', -110, 120, 28, ROLE.trans, 'mono'),
      txt('strides (1, 3)  ·  +3 then -2', -110, 168, 26, COSMOS.ink, 'mono'),
      txt(
        rg > 0.5 ? 'view(-1): REJECTED!' : 'Can view(-1) flatten this?',
        -110,
        220,
        26,
        rg > 0.5 ? ROLE.bad : COSMOS.muted,
        'mono',
      ),
    );

    const foot =
      rg > 0.5
        ? 'Flat view allows ONE fixed stride; transpose needs +3 and -2 steps'
        : rb > 0.5
          ? 'Original [2,3] OK! Now check [3,2]'
          : bw > 0.5
            ? 'Predict: which tensor can PyTorch flatten with a zero-copy view?'
            : 'Zero bytes moved: transpose only changes the index stride map';
    nodes.push(
      txt(
        foot,
        -855,
        345,
        28,
        rg > 0.5 ? ROLE.bad : rb > 0.5 ? ROLE.good : COSMOS.gold,
        'sans',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, strip3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, strip3d, { theta: -0.2, phi: 0.9 });

  c.on('jump-out', () => s.play(goldStep.to(1, { duration: remainDuration(c, 'jump-out', 0.45) })));
  c.on('jump-back', () =>
    s.play(goldStep.to(2, { duration: remainDuration(c, 'jump-back', 0.45) })),
  );
  c.on('blue-walk', () => {
    const dur = remainDuration(c, 'blue-walk', 0.5);
    s.play(blueWalk.to(1, { duration: dur }));
    s.play(mode3d.to(1, { duration: dur }));
  });
  c.after('view-blue', () =>
    s.play(revBlue.to(1, { duration: remainDuration(c, 'view-blue', 0.4) })),
  );
  c.after('view-gold', () => {
    const dur = remainDuration(c, 'view-gold', 0.45);
    s.play(revGold.to(1, { duration: dur }));
    s.play(mode3d.to(0, { duration: dur }));
  });
}
