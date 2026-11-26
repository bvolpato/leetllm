// Scene 13: speculative-work: 12-position pass budget = 4 verify + 2 decode + 6 prefill; reject 1st -> 4 slots still spent.
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

export default function speculativeWork(s, c) {
  const step = s.value(0); // 0=budget split, 1=reject 1st draft, 2=emit 1 correction, 3=uneven gaps

  const bgAura = aura(0, 0, 740, '#14335c28', '#2a183022');
  const title = heroTitle(['Speculative Verification:', 'What Counts Against the Pass?'], {
    x: -855,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.d,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const st = Math.round(step.value);
    const nodes = [
      txt(
        '12-POSITION PASS WORK BUDGET: 4 SPECULATIVE VERIFY + 2 DECODE + 6 PREFILL',
        -855,
        -215,
        26,
        ROLE.a,
        'mono',
        'left',
      ).opacity(alpha),
    ];

    for (let i = 0; i < 12; i++) {
      const cx = -785 + i * 142;
      const isVerify = i < 4;
      const isDecode = i >= 4 && i < 6;
      const rejected = isVerify && st >= 1;
      const col = isVerify ? (rejected ? ROLE.warn : ROLE.d) : isDecode ? ROLE.a : ROLE.prefill;
      const fill = isVerify ? (rejected ? '#301522' : '#2e2310') : isDecode ? '#11304a' : '#2a1d10';
      nodes.push(
        rect(128, 96, { fill, stroke: col, width: 2.8, radius: 10 }).at(cx, -95).opacity(alpha),
        txt(
          isVerify ? `V${i + 1}` : isDecode ? `D${i - 3}` : `P${i - 5}`,
          cx,
          -95,
          28,
          col,
          'mono',
          'center',
        ).opacity(alpha),
      );
    }

    nodes.push(
      chipPill(
        st >= 1
          ? '1st draft REJECTED -> 0 draft accepted'
          : 'Target verifies 4 scheduled positions',
        -450,
        85,
        {
          w: 760,
          h: 78,
          color: st >= 1 ? ROLE.warn : ROLE.d,
          fill: st >= 1 ? '#301522' : '#10182d',
          size: 28,
          glow: st >= 1 ? 12 : 6,
          opacity: alpha,
        },
      ),
      chipPill(
        st >= 2
          ? 'Emits 1 correction token (4 slots STILL counted!)'
          : 'If all k accepted -> emit k + 1 bonus',
        445,
        85,
        {
          w: 780,
          h: 78,
          color: st >= 2 ? ROLE.ok : ROLE.a,
          fill: st >= 2 ? '#0f2d24' : '#10182d',
          size: 26,
          glow: st >= 2 ? 12 : 4,
          opacity: alpha,
        },
      ),
      txt(
        st >= 3
          ? 'Acceptance swings cause uneven per-stream ITL even when mean TPOT looks healthy'
          : 'Continuous batching chooses who shares the pass; speculative acceptance chooses emitted tokens',
        0,
        265,
        28,
        st >= 3 ? ROLE.d : COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'speculative-work-b1', (d) => s.play(step.to(0, { duration: d })));
  playCue(s, c, 'speculative-work-b2', (d) => s.play(step.to(0, { duration: d })));
  playCue(s, c, 'spec-reject', (d) => s.play(step.to(1, { duration: d })));
  playCue(s, c, 'spec-correction', (d) => s.play(step.to(2, { duration: d })));
  playCue(s, c, 'speculative-work-b3', (d) => s.play(step.to(3, { duration: d })));
}
