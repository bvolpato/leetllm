// Scene 26: work-ledger: Queued vs true parallel branches, full paid work ledger (1 + 2k including discarded), releasing KV frees live RAM but NOT spent bill!
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

export default function workLedger(s, c) {
  const showPaid = s.value(0);
  const showRelease = s.value(0);

  const bgAura = aura(0, 0, 740, '#14335c28', '#20184422');
  const title = heroTitle(['Full Accounting Ledger:', 'Spent Compute vs Live KV Memory'], {
    x: -855,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.gold,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const pd = showPaid.value;
    const rl = showRelease.value;

    const nodes = [
      txt(
        'SEPARATE THREE LIVE COUNTERS: SPENT WORK, LIVE KV RAM, AND RETURNED ANSWER',
        -855,
        -220,
        26,
        ROLE.search,
        'mono',
        'left',
      ).opacity(alpha),

      rect(520, 235, { fill: '#10203a', stroke: ROLE.draft, width: 2.8, radius: 14 })
        .at(-585, -35)
        .opacity(alpha),
      txt('1. QUEUED != PARALLEL', -585, -108, 26, ROLE.draft, 'mono', 'center').opacity(alpha),
      txt('8 queued != 8 simultaneous', -585, -48, 26, COSMOS.ink, 'sans', 'center').opacity(alpha),
      txt('Serial loops add depth', -585, 6, 26, ROLE.gold, 'sans', 'center').opacity(alpha),
      txt('Measure under real load!', -585, 58, 26, COSMOS.muted, 'sans', 'center').opacity(alpha),

      rect(520, 235, {
        fill: pd > 0.35 ? '#261e10' : '#10182d',
        stroke: pd > 0.35 ? ROLE.gold : ROLE.search,
        width: 2.8,
        radius: 14,
      })
        .at(0, -35)
        .opacity(alpha * (0.5 + 0.5 * pd)),
      txt('2. FULL PAID BILL', 0, -108, 26, ROLE.gold, 'mono', 'center').opacity(alpha),
      txt('Discarded drafts + retries', 0, -48, 26, COSMOS.ink, 'sans', 'center').opacity(alpha),
      txt('Critiques, checks, routers', 0, 6, 26, ROLE.gold, 'sans', 'center').opacity(alpha),
      txt('Revisions = 1 + 2k calls!', 0, 58, 26, ROLE.err, 'mono', 'center').opacity(alpha),

      rect(520, 235, {
        fill: rl > 0.35 ? '#0f2d24' : '#10182d',
        stroke: rl > 0.35 ? ROLE.ok : ROLE.search,
        width: 2.8,
        radius: 14,
      })
        .at(585, -35)
        .opacity(alpha * (0.5 + 0.5 * rl)),
      txt('3. RELEASING KV STATE', 585, -108, 26, ROLE.ok, 'mono', 'center').opacity(alpha),
      txt('Frees live GPU memory', 585, -48, 26, ROLE.ok, 'sans', 'center').opacity(alpha),
      txt('Keeps draft text intact', 585, 6, 26, COSMOS.ink, 'sans', 'center').opacity(alpha),
      txt('Does NOT erase spent bill!', 585, 58, 26, ROLE.err, 'mono', 'center').opacity(alpha),

      chipPill(
        rl > 0.35
          ? 'Always track spent tokens/calls, live KV state, and returned verified answer separately!'
          : 'Include every discarded candidate, critique, retry, and verifier call in your true request cost',
        0,
        225,
        {
          w: 1620,
          h: 76,
          color: rl > 0.35 ? ROLE.ok : ROLE.gold,
          size: 26,
          opacity: alpha,
        },
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'tt-work-ledger-0', (d) => s.play(showPaid.to(0, { duration: d })));
  playCue(s, c, 'tt-queued-work', (d) => s.play(showPaid.to(0.2, { duration: d })));
  playCue(s, c, 'tt-work-ledger-1', (d) => s.play(showPaid.to(0.6, { duration: d })));
  playCue(s, c, 'tt-paid-work', (d) => s.play(showPaid.to(1, { duration: d })));
  playCue(s, c, 'tt-work-ledger-2', (d) => s.play(showRelease.to(0.5, { duration: d })));
  playCue(s, c, 'tt-release-state', (d) => s.play(showRelease.to(1, { duration: d })));
}
