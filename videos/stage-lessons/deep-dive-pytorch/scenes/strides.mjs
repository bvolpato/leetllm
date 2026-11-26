// Scene 02: Follow the write to element three: shared storage alias (3 -> 30) vs reshape contiguous copy (stays 3).
import { group } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  STORAGE_COPIED,
  STORAGE_INIT,
  address,
  aura,
  glassCell,
  glowDot,
  guardedDynamic,
  heroTitle,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function strides(s, c) {
  const phase = s.value(0);
  const locate3 = s.value(0);
  const showBytes = s.value(0);
  const showCopy = s.value(0);
  const askAlias = s.value(0);
  const write30 = s.value(0);
  const readAlias = s.value(0);
  const readCopy = s.value(0);

  const bgAura = aura(0, 20, 620, '#ffd1661c', '#5ce1e618');
  const title = heroTitle(['Follow the Write', 'to Element Three'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.trans,
    eyebrow: 'SHARED ALIAS VS RESHAPE COPY',
  });

  const live = guardedDynamic(1, () => {
    const l3 = locate3.value;
    const sb = showBytes.value;
    const sc = showCopy.value;
    const aq = askAlias.value;
    const w30 = write30.value;
    const ra = readAlias.value;
    const rc = readCopy.value;
    const p = phase.value;

    const cellW = 190;
    const gap = 22;
    const startX = -630;
    const topY = -115;
    const botY = 140;

    const elemIdx = address([0, 1], [1, 3]); // 3
    const byteOff = elemIdx * 8; // 24

    const nodes = [
      txt('STORAGE A · SHARED BY x [2,3] & y = x.t() [3,2]', 0, -246, 28, ROLE.orig, 'mono'),
    ];

    STORAGE_INIT.forEach((v, i) => {
      const cx = startX + i * (cellW + gap) + cellW * 0.5;
      const isThree = i === elemIdx;
      const valNow = isThree && w30 > 0.5 ? 30 : v;
      const col = isThree ? (w30 > 0.5 ? ROLE.bad : l3 > 0.5 ? ROLE.trans : ROLE.orig) : ROLE.orig;
      nodes.push(
        glassCell(cx, topY, cellW, 108, col, {
          fill: isThree && w30 > 0.5 ? '#2d1222' : isThree && l3 > 0.5 ? '#261e0e' : '#0f1b33',
          glow: isThree && (l3 > 0.5 || w30 > 0.5) ? 10 : 3,
        }),
        txt(
          sb > 0.5 ? `byte ${i * 8}` : `cell ${i}`,
          cx,
          topY - 84,
          26,
          isThree && sb > 0.5 ? ROLE.trans : COSMOS.muted,
          'mono',
        ),
        txt(String(valNow), cx, topY + 2, 46, isThree ? col : COSMOS.ink, 'mono'),
      );
    });

    if (l3 > 0.5) {
      nodes.push(
        txt(
          ra > 0.5
            ? `x[1,0] == y[0,1] == 30  (byte ${byteOff} mutated!)`
            : sb > 0.5
              ? `x[1,0] & y[0,1] both map to cell ${elemIdx} = byte ${byteOff}`
              : 'x[1,0] == y[0,1] == cell 3',
          0,
          -18,
          28,
          ra > 0.5 ? ROLE.bad : ROLE.trans,
          'mono',
        ),
      );
    }

    // Second strip: reshape(-1) copy
    nodes.push(
      txt(
        sc > 0.5
          ? 'STORAGE B · flat = y.reshape(-1) NEW CONTIGUOUS ALLOCATION'
          : 'SECOND ALLOCATION SLOT (WAITING FOR reshape)',
        0,
        52,
        26,
        sc > 0.5 ? ROLE.copy : COSMOS.dim,
        'mono',
      ),
    );

    STORAGE_COPIED.forEach((v, i) => {
      const cx = startX + i * (cellW + gap) + cellW * 0.5;
      const isCopyThree = i === 1;
      const col = sc > 0.5 ? (isCopyThree && rc > 0.5 ? ROLE.good : ROLE.copy) : COSMOS.dim;
      nodes.push(
        glassCell(cx, botY, cellW, 108, col, {
          fill: sc > 0.5 ? (isCopyThree && rc > 0.5 ? '#0d2924' : '#0d212b') : '#0a0f1c',
          glow: sc > 0.5 && isCopyThree ? 9 : 2,
        }),
        txt(
          sc > 0.5 ? String(v) : '?',
          cx,
          botY + 2,
          46,
          sc > 0.5 ? (isCopyThree && rc > 0.5 ? ROLE.good : COSMOS.ink) : COSMOS.dim,
          'mono',
        ),
      );
    });

    const u = (p * 0.65) % 1;
    nodes.push(
      glowDot(-630 + u * 1260, 260, { radius: 6, color: w30 > 0.5 ? ROLE.bad : ROLE.copy }),
      txt(
        rc > 0.5
          ? 'Alias write updates x[1,0] to 30; independent reshape copy stays 3'
          : w30 > 0.5
            ? 'Shared storage: both x & y see 30!'
            : aq > 0.5
              ? 'Predict: write 30 through y[0,1]; which 3 changes?'
              : 'Check strides and profiler copy events before blaming attention math',
        0,
        345,
        28,
        rc > 0.5 ? ROLE.good : w30 > 0.5 ? ROLE.bad : COSMOS.gold,
        'sans',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('locate-three', () =>
    s.play(locate3.to(1, { duration: remainDuration(c, 'locate-three', 0.4) })),
  );
  c.on('byte-offset', () =>
    s.play(showBytes.to(1, { duration: remainDuration(c, 'byte-offset', 0.4) })),
  );
  c.on('flat-copy', () =>
    s.play(showCopy.to(1, { duration: remainDuration(c, 'flat-copy', 0.5) })),
  );
  c.on('alias-question', () =>
    s.play(askAlias.to(1, { duration: remainDuration(c, 'alias-question', 0.35) })),
  );
  c.after('alias-write', () =>
    s.play(write30.to(1, { duration: remainDuration(c, 'alias-write', 0.4) })),
  );
  c.after('alias-read', () =>
    s.play(readAlias.to(1, { duration: remainDuration(c, 'alias-read', 0.4) })),
  );
  c.after('flat-read', () =>
    s.play(readCopy.to(1, { duration: remainDuration(c, 'flat-read', 0.4) })),
  );
}
