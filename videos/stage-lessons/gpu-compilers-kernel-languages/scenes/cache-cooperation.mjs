// Scene 13: Can a reader use what the writers published? Triton os.replace, lock recheck, 2-file crash mismatch, shared warm ranks.
import { delay, par } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function cacheCooperation(s, c) {
  const showPart1 = s.value(1);
  const replaced = s.value(0);
  const locked = s.value(0);

  const showPart2 = s.value(0);
  // pairState: 0=A/A, 1=match, 2=B/A crash, 3=mismatch reject
  const pairState = s.value(0);
  const rankStep = s.value(0); // 1=warm A, 2=priv miss, 3=target B miss, 4=shared hit

  const bgAura = aura(0, 20, 640, '#5ce1e61c', '#ff6b8b16');
  const title = heroTitle(['Can a Reader Use What', 'Writers Published?'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.ir,
    eyebrow: 'CONCURRENT CACHE COOPERATION & GROUP DIGESTS',
  });

  const part1 = guardedDynamic(showPart1, (a) => {
    const rp = replaced.value;
    const lk = locked.value;
    const nodes = [
      glassCell(-430, -90, 740, 178, rp > 0.5 ? ROLE.cubin : ROLE.ptx, {
        fill: '#0e1d34',
        glow: 8,
        opacity: a,
      }),
      txt('TRITON FILE CACHE PUBLISH', -430, -142, 26, ROLE.ptx, 'mono').opacity(a),
      txt('Unique PID + UUID temp dir → close()', -430, -90, 28, COSMOS.ink, 'mono').opacity(a),
      txt(
        rp > 0.5
          ? 'os.replace() → atomic whole-file swap'
          : 'Public file stays intact during write',
        -430,
        -38,
        26,
        rp > 0.5 ? ROLE.cubin : COSMOS.muted,
        'mono',
      ).opacity(a),

      glassCell(430, -90, 740, 178, lk > 0.5 ? ROLE.ir : COSMOS.dim, {
        fill: '#14192e',
        glow: lk > 0.5 ? 8 : 3,
        opacity: a,
      }),
      txt('TWO WRITERS · LOCK + RECHECK', 430, -142, 26, ROLE.ir, 'mono').opacity(a),
      txt(
        lk > 0.5 ? 'Acquire lock → recheck exact key!' : 'No lock → both compile same recipe',
        430,
        -90,
        28,
        lk > 0.5 ? ROLE.cubin : ROLE.warn,
        'mono',
      ).opacity(a),
      txt('Handle failed writers & lock timeouts', 430, -38, 26, COSMOS.muted, 'sans').opacity(a),

      txt(
        'Atomic swap avoids torn reads · power-loss durability needs fsync',
        0,
        145,
        28,
        COSMOS.muted,
        'sans',
      ).opacity(a),
    ];

    return group(...nodes);
  });

  const part2 = guardedDynamic(showPart2, (a) => {
    const ps = Math.round(pairState.value);
    const rs = Math.round(rankStep.value);
    const crashed = ps >= 2;
    const rejected = ps >= 3;

    const nodes = [
      // Top: 2-file pair crash (kernel B + metadata expecting A!)
      txt('TWO-FILE PAIR CONSISTENCY CHECK', -430, -200, 26, COSMOS.gold, 'mono').opacity(a),
      glassCell(-625, -92, 330, 128, crashed ? ROLE.warn : ROLE.cubin, {
        fill: crashed ? '#2b1e10' : '#0d2824',
        glow: 9,
        opacity: a,
      }),
      txt('KERNEL BYTES', -625, -124, 26, COSMOS.muted, 'mono').opacity(a),
      txt(
        crashed ? 'Version B (new)' : 'Version A',
        -625,
        -72,
        30,
        crashed ? ROLE.warn : ROLE.cubin,
        'mono',
      ).opacity(a),

      glassCell(-235, -92, 330, 128, ROLE.cubin, { fill: '#0d2824', glow: 7, opacity: a }),
      txt('METADATA DIGEST', -235, -124, 26, COSMOS.muted, 'mono').opacity(a),
      txt('Expects sha(A)', -235, -72, 30, ROLE.cubin, 'mono').opacity(a),

      glassCell(-430, 74, 720, 88, rejected ? ROLE.fail : ps >= 1 ? ROLE.cubin : COSMOS.dim, {
        fill: rejected ? '#2e101c' : '#0e2226',
        glow: rejected ? 11 : 6,
        opacity: a,
      }),
      txt(
        rejected
          ? 'DIGEST MISMATCH → REJECT PAIR & RECOVER!'
          : crashed
            ? 'Crash between 2 atomic replaces!'
            : 'sha(kernel) == sha(A) · MATCH',
        -430,
        74,
        26,
        rejected ? ROLE.fail : crashed ? ROLE.warn : ROLE.cubin,
        'mono',
      ).opacity(a),

      // Right: Warm cache reachability across 4 ranks
      txt('WARM CACHE SCOPE (Rank 0 warmed A)', 440, -200, 26, ROLE.ir, 'mono').opacity(a),
    ];

    const ranks = [
      { label: 'Rank 0 · Shared · Target A', res: rs >= 1 ? 'WARMED' : '...', col: ROLE.ir },
      { label: 'Worker 1 · Private · Target A', res: rs >= 2 ? 'MISS' : '...', col: ROLE.fail },
      { label: 'Worker 2 · Shared · Target B', res: rs >= 3 ? 'MISS' : '...', col: ROLE.fail },
      { label: 'Worker 3 · Shared · Target A', res: rs >= 4 ? 'HIT!' : '...', col: ROLE.cubin },
    ];
    ranks.forEach((rk, i) => {
      const y = -124 + i * 90;
      const lit = rk.res !== '...';
      nodes.push(
        glassCell(440, y, 760, 70, lit ? rk.col : COSMOS.dim, {
          fill: '#0e192d',
          glow: lit ? 7 : 0,
          opacity: a,
        }),
        txt(rk.label, 90, y, 26, COSMOS.ink, 'mono', 'left').opacity(a),
        txt(rk.res, 785, y, 26, lit ? rk.col : COSMOS.dim, 'mono', 'right').opacity(a),
      );
    });

    return group(...nodes);
  });

  s.add(bgAura, title, part1, part2);

  c.on('private-temp', () =>
    s.play(replaced.to(0.2, { duration: remainDuration(c, 'private-temp', 0.35) })),
  );
  c.on('atomic-replace', () =>
    s.play(replaced.to(1, { duration: remainDuration(c, 'atomic-replace', 0.4) })),
  );
  c.on('duplicate-builds', () =>
    s.play(locked.to(0.2, { duration: remainDuration(c, 'duplicate-builds', 0.35) })),
  );
  c.on('recheck-key', () =>
    s.play(locked.to(1, { duration: remainDuration(c, 'recheck-key', 0.45) })),
  );
  c.on('pair-a', () => {
    s.play(
      par(showPart1.to(0, { duration: 0.2 }), delay(showPart2.to(1, { duration: 0.25 }), 0.22)),
    );
  });
  c.on('pair-match', () => s.play(pairState.to(1, { duration: 0.35 })));
  c.on('group-crash', () => s.play(pairState.to(2, { duration: 0.4 })));
  c.on('group-compare', () => s.play(pairState.to(3, { duration: 0.4 })));
  c.on('warm-scope', () => s.play(rankStep.to(1, { duration: 0.35 })));
  c.on('private-miss', () => s.play(rankStep.to(2, { duration: 0.35 })));
  c.on('target-miss', () => s.play(rankStep.to(3, { duration: 0.35 })));
  c.on('shared-hit', () => s.play(rankStep.to(4, { duration: 0.4 })));
}
