// Scene 18: overload-and-health: Healthy full worker -> defer/reject (do NOT restart!) + bounded queues/retries & trace diagnosis.
import {
  COSMOS,
  ROLE,
  aura,
  chipPill,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  txt,
} from '../parts.mjs';

export default function overloadAndHealth(s, c) {
  const showRules = s.value(0);

  const bgAura = aura(0, 0, 740, '#14335c28', '#2a162422');
  const title = heroTitle(['Overload Admission vs', 'Engine Health & Readiness'], {
    x: -855,
    y: -430,
    size: 50,
    lineHeight: 58,
    accent: ROLE.warn,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const sr = showRules.value;
    const nodes = [
      txt(
        'SEPARATE THREE OBSERVATIONS AT THE LOAD BALANCER',
        -855,
        -215,
        26,
        ROLE.a,
        'mono',
        'left',
      ).opacity(alpha),

      chipPill('1. Engine Health (alive)', -575, -110, {
        w: 500,
        h: 78,
        color: ROLE.ok,
        size: 28,
        opacity: alpha,
      }),
      chipPill('2. Readiness (serving)', 0, -110, {
        w: 500,
        h: 78,
        color: ROLE.a,
        size: 28,
        opacity: alpha,
      }),
      chipPill('3. Load (defer/reject)', 575, -110, {
        w: 500,
        h: 78,
        color: ROLE.d,
        size: 28,
        glow: 10,
        opacity: alpha,
      }),

      chipPill(
        'NEVER restart a healthy full worker (destroys live KV + causes cold-start cascade)',
        0,
        20,
        {
          w: 1520,
          h: 74,
          color: ROLE.warn,
          fill: '#2e1420',
          size: 26,
          glow: 10,
          opacity: alpha,
        },
      ),

      txt('OVERLOAD PROTECTION & TRACE DIAGNOSIS', -855, 130, 26, ROLE.ok, 'mono', 'left').opacity(
        alpha * (0.35 + 0.65 * sr),
      ),
      chipPill('Bound queues, deadlines & retries', -460, 220, {
        w: 740,
        h: 74,
        color: sr > 0.3 ? ROLE.ok : COSMOS.rule,
        size: 26,
        opacity: alpha * (0.35 + 0.65 * sr),
      }),
      chipPill('Diagnose wait/gap/handoff from trace', 430, 220, {
        w: 780,
        h: 74,
        color: sr > 0.3 ? ROLE.a : COSMOS.rule,
        size: 26,
        opacity: alpha * (0.35 + 0.65 * sr),
      }),
    ];
    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'overload-and-health-b1', (d) => s.play(showRules.to(0.15, { duration: d })));
  playCue(s, c, 'overload-and-health-b2', (d) => s.play(showRules.to(1, { duration: d })));
}
