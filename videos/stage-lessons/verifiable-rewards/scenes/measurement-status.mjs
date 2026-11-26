// Scene 04: Keep a broken measurement out of the reward vector (Candidate timeout = 0 vs host crash = quarantine)
import {
  COSMOS,
  REPAIR_OLD,
  REPAIR_WEAK,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function measurementStatus(s, c) {
  const phase = s.value(0);
  const showZero = s.value(0);
  const showUnscored = s.value(0);
  const showQuarantine = s.value(0);
  const showRetry = s.value(0);
  const showAdversarial = s.value(0);

  const bgAura = aura(0, 20, 640, '#14355e26', '#3c1b4a14');
  const title = heroTitle(['Keep Broken Measurements', 'Out of the Reward Vector'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.rose,
    eyebrow: 'ROLLOUT ACCOUNTING · ZERO vs UNSCORED HOLE',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const sz = showZero.value;
    const su = showUnscored.value;
    const sq = showQuarantine.value;
    const sr = showRetry.value;
    const sa = showAdversarial.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const rows = [
      { id: 'R1', desc: 'Valid match', status: 'completed', r: '1', col: COSMOS.emerald, y: -120 },
      {
        id: 'R2',
        desc: 'Two boxes (first matches)',
        status: 'completed',
        r: '1',
        col: COSMOS.cyan,
        y: -15,
      },
      {
        id: 'R3',
        desc: 'Timeout on healthy runner',
        status: 'candidate-0',
        r: '0',
        col: COSMOS.amber,
        y: 90,
      },
      {
        id: 'R4',
        desc: 'Host crash during check',
        status: 'quarantine',
        r: sq > 0.5 ? 'OUT' : '0?',
        col: COSMOS.rose,
        y: 195,
      },
    ];

    const nodes = [
      txt('4 ROLLOUT RECORDS (18 x 14 = 252)', -855, -206, 26, COSMOS.muted, 'mono', 'left'),
      txt('REWARD VECTOR & GROUP MEAN', 280, -206, 26, COSMOS.gold, 'mono', 'left'),
    ];

    rows.forEach((row, idx) => {
      const highlight = (idx === 2 && sz > 0.3) || (idx === 3 && (su > 0.3 || sq > 0.3));
      const isQuar = idx === 3 && sq > 0.5;
      nodes.push(
        glassCell(-420, row.y, 840, 78, row.col, {
          fill: isQuar ? '#291018' : '#101d34',
          dash: isQuar ? [9, 6] : undefined,
          glow: highlight ? 9 * pulse : 3,
          opacity: isQuar ? 0.75 : 0.95,
        }),
        txt(`${row.id}  ${row.desc}`, -810, row.y + 2, 28, row.col, 'mono', 'left'),
        txt(row.r, -50, row.y + 2, 32, row.col, 'mono'),
      );
    });

    // Right side: Mean shifts from 2/4 = 0.50 (false zero) -> 2/3 = 0.67 (quarantined)
    const meanVal = sq > 0.5 ? REPAIR_WEAK.mean : REPAIR_OLD.mean;
    const vecStr = sq > 0.5 ? '[ 1,  1,  0 ]  (n = 3)' : '[ 1,  1,  0,  0 ]  (false 0!)';
    const vecCol = sq > 0.5 ? COSMOS.emerald : COSMOS.rose;

    nodes.push(
      glassCell(515, -75, 620, 128, vecCol, {
        fill: sq > 0.5 ? '#0e2624' : '#261119',
        glow: 8 * pulse,
      }),
      txt('ACTIVE REWARD VECTOR', 515, -108, 26, COSMOS.muted, 'mono'),
      txt(vecStr, 515, -52, 30, vecCol, 'mono').glow(6, vecCol),

      txt('GROUP MEAN', 280, 62, 26, COSMOS.muted, 'mono', 'left'),
      txt(meanVal.toFixed(3), 280, 134, 62, vecCol, 'mono', 'left').glow(8, vecCol),
    );

    if (sr > 0.05) {
      nodes.push(
        glowDot(290, 224, { radius: 6, color: COSMOS.gold, opacity: sr }),
        txt('Bounded retry on same candidate', 316, 212, 26, COSMOS.gold, 'sans', 'left').opacity(
          sr,
        ),
        txt(
          'Never resample until a pass appears',
          316,
          248,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(sr),
      );
    }

    if (sa > 0.05) {
      nodes.push(
        txt(
          'Adversarial suite: repeated boxes · invalid gold · runner crash · excessive output · timeouts',
          0,
          355,
          26,
          COSMOS.cyan,
          'mono',
        ).opacity(sa),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('vr-measurement-status-b0', () => s.play(phase.to(1.5, { duration: 0.4 })));
  c.on('vr-zero-measurement-status', () => s.play(showZero.to(1, { duration: 0.45 })));
  c.on('vr-unscored-measurement-status', () => s.play(showUnscored.to(1, { duration: 0.45 })));
  c.on('vr-measurement-status-b1', () => s.play(showQuarantine.to(0.5, { duration: 0.35 })));
  c.on('vr-quarantine-measurement-status', () => s.play(showQuarantine.to(1, { duration: 0.5 })));
  c.on('vr-retry-measurement-status', () => s.play(showRetry.to(1, { duration: 0.45 })));
  c.on('vr-measurement-status-b2', () => s.play(showAdversarial.to(0.5, { duration: 0.35 })));
  c.on('vr-adversarial-measurement-status', () =>
    s.play(
      showAdversarial.to(1, {
        duration: remainDuration(c, 'vr-adversarial-measurement-status', 0.5),
      }),
    ),
  );
}
