// Scene 1: What starts the 15-minute clock? (Opening broken chunk vs full paging rule)
import {
  COSMOS,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  makeChunkStrata3D,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function subjectIntro(s, c) {
  const phase = s.value(0);
  const showHit = s.value(0);
  const showPage = s.value(0);
  const showTrigger = s.value(0);
  const showWiden = s.value(0);

  const bgAura = aura(0, 10, 680, '#12365c28', '#2a1c5216');
  const title = heroTitle(['What Starts the', '15-Minute Clock?'], {
    x: -855,
    y: -415,
    size: 60,
    lineHeight: 70,
    accent: COSMOS.gold,
    eyebrow: 'DOCUMENT CHUNKING · BOUNDARIES DECIDE WHAT SEARCH CAN ANSWER',
  });

  const { view: stage3d, orbit: orbit3d } = makeChunkStrata3D(535, -15, phase, 'intro');

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const sh = showHit.value;
    const sp = showPage.value;
    const st = showTrigger.value;
    const sw = showWiden.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const nodes = [
      txt('3D PARENT-CHILD CHUNK STRATA', 535, -330, 26, COSMOS.cyan, 'mono'),
      txt(
        sw > 0.4
          ? 'Aligned cut keeps trigger + deadline together'
          : 'Child hits point up to full parent section',
        535,
        292,
        26,
        sw > 0.4 ? COSMOS.emerald : COSMOS.muted,
        'sans',
      ),

      // Left top: Broken search hit
      txt('RETURNED SEARCH HIT (BROKEN BOUNDARY)', -855, -205, 26, COSMOS.rose, 'mono', 'left'),
      glassCell(-440, -110, 830, 114, sh > 0.3 ? COSMOS.rose : COSMOS.muted, {
        fill: '#28111a',
        glow: sh > 0.3 ? 9 * pulse : 3,
      }),
      txt('"...15 minutes with deploy ID."', -820, -134, 29, COSMOS.amber, 'mono', 'left'),
      txt(
        'Missing: WHAT event starts the 15-minute clock?',
        -820,
        -86,
        26,
        COSMOS.rose,
        'sans',
        'left',
      ),

      // Left middle: Missing prefix slid back together (withheld before st!)
      txt('SLIDE THE CUT BACK TO SENTENCE START', -855, 8, 26, COSMOS.cyan, 'mono', 'left'),
      glassCell(
        -440,
        128,
        830,
        152,
        sw > 0.4 ? COSMOS.emerald : st > 0.4 ? COSMOS.cyan : COSMOS.muted,
        {
          fill: sw > 0.4 ? '#0e2824' : '#10182d',
          glow: sw > 0.4 ? 10 * pulse : sp > 0.4 ? 6 : 3,
        },
      ),
      txt(
        st > 0.4
          ? 'Trigger: "Rollback failure: page on-call within"'
          : 'Trigger:  ?  (cut off before hit started)',
        -820,
        88,
        26,
        st > 0.4 ? COSMOS.emerald : COSMOS.gold,
        'mono',
        'left',
      ),
      txt(
        sw > 0.4
          ? '1 COMPLETE HIT = trigger + 15 min + deploy ID'
          : 'Move boundary left so 1 hit carries full rule',
        -820,
        142,
        26,
        sw > 0.4 ? COSMOS.ink : COSMOS.muted,
        'sans',
        'left',
      ),

      glowDot(-840, 355, {
        radius: 6,
        color: sw > 0.4 ? COSMOS.emerald : st > 0.4 ? COSMOS.cyan : COSMOS.gold,
      }),
      txt(
        sw > 0.4
          ? 'A chunk is the atomic unit search returns: bad cuts split conditions from actions'
          : st > 0.4
            ? 'A failed rollback starts the 15-minute clock: move the cut left to include it'
            : 'Read the returned hit alone: can an engineer tell what starts the clock?',
        -812,
        357,
        28,
        sw > 0.4 ? COSMOS.emerald : st > 0.4 ? COSMOS.cyan : COSMOS.gold,
        'sans',
        'left',
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, stage3d, live);
  runPhase(s, c, phase, 14);
  orbit3d(s, c);

  c.on('read-hit', () => s.play(showHit.to(1, { duration: 0.45 })));
  c.on('open-page', () => s.play(showPage.to(1, { duration: 0.45 })));
  c.after('read-trigger', () => s.play(showTrigger.to(1, { duration: 0.45 })));
  c.on('widen-hit', () =>
    s.play(showWiden.to(1, { duration: remainDuration(c, 'widen-hit', 0.45) })),
  );
}
