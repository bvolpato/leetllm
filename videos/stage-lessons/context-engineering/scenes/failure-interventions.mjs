// Scene 03: failure-interventions: "Different symptoms require different edits to the same packet"
// Four quadrants (Poisoning, Distraction, Confusion, Clash) forked from the same packet,
// each receiving its targeted surgical intervention on cue.
import {
  COSMOS,
  ROLE,
  aura,
  checkMark,
  chip,
  cornerBrackets,
  crossMark,
  ease,
  group,
  guardedDynamic,
  heroTitle,
  line,
  playCue,
  txt,
} from '../parts.mjs';

export default function failureInterventions(s, c) {
  const showSymptoms = s.value(0.45);
  const focusPoison = s.value(0);
  const removePoison = s.value(0);
  const keepNeg = s.value(0);
  const newEvid = s.value(0);
  const narrowTools = s.value(0);
  const demoteFmt = s.value(0);

  const bgAura = aura(0, 40, 820, '#2a163226', '#14335a26');
  const title = heroTitle(['Different symptoms,', 'different packet edits'], {
    x: -855,
    y: -435,
    size: 50,
    lineHeight: 58,
    accent: ROLE.poison,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const sy = ease(showSymptoms.value);
    const fp = ease(focusPoison.value);
    const rp = ease(removePoison.value);
    const kn = ease(keepNeg.value);
    const ne = ease(newEvid.value);
    const nt = ease(narrowTools.value);
    const df = ease(demoteFmt.value);

    const nodes = [];

    // Helper for one open-bracket quadrant (no full box chrome)
    function quadrant(cx, cy, heading, symptom, accent, active, actionNodes) {
      const op = alpha * (0.52 + 0.48 * Math.max(sy, active));
      nodes.push(
        cornerBrackets(cx, cy, 800, 270, accent, {
          arm: 28,
          width: active > 0.3 ? 3.4 : 2.2,
          opacity: op,
        }),
        txt(heading, cx - 365, cy - 88, 30, accent, 'mono', 'left').opacity(op),
        txt(symptom, cx - 365, cy - 28, 30, COSMOS.ink, 'sans', 'left').opacity(op),
        ...actionNodes,
      );
    }

    // Q1 (top-left): POISONING
    const q1 = [];
    if (rp > 0.1) {
      q1.push(
        line([-815, -104], [-815 + 560 * rp, -104], { stroke: ROLE.poison, width: 4.5 })
          .glow(8, ROLE.poison)
          .opacity(alpha),
        crossMark(-115, -138, 28, ROLE.poison, alpha * rp),
      );
    }
    if (kn > 0.15) {
      q1.push(
        checkMark(-795, -52, 26, ROLE.note, alpha * kn),
        txt(
          'Keep: lock absent (R17, t=100, lock-check)',
          -760,
          -52,
          27,
          ROLE.note,
          'mono',
          'left',
        ).opacity(alpha * kn),
      );
    } else {
      q1.push(
        txt(
          'Fix: delete false span + derived recaps',
          -815,
          -52,
          27,
          COSMOS.muted,
          'mono',
          'left',
        ).opacity(alpha * (0.55 + 0.45 * fp)),
      );
    }
    quadrant(
      -450,
      -110,
      '1. POISONING',
      'Wrong lock claim repeated as fact',
      ROLE.poison,
      Math.max(fp, rp, kn),
      q1,
    );

    // Q2 (top-right): DISTRACTION
    const q2 = [];
    if (ne > 0.15) {
      q2.push(
        checkMark(105, -52, 26, ROLE.note, alpha * ne),
        txt(
          'Select new trace-17; leave old search loop out',
          140,
          -52,
          27,
          ROLE.note,
          'mono',
          'left',
        ).opacity(alpha * ne),
      );
    } else {
      q2.push(
        txt(
          'Fix: admit fresh evidence over stale loops',
          85,
          -52,
          27,
          COSMOS.muted,
          'mono',
          'left',
        ).opacity(alpha * 0.7),
      );
    }
    quadrant(450, -110, '2. DISTRACTION', 'Re-running old failed searches', ROLE.cache, ne, q2);

    // Q3 (bottom-left): CONFUSION
    const q3 = [];
    if (nt > 0.15) {
      q3.push(
        chip('deploy_lookup', -680, 262, {
          color: ROLE.note,
          size: 26,
          h: 50,
          minW: 230,
          opacity: alpha * nt,
        }),
        chip('trace_lookup', -390, 262, {
          color: ROLE.note,
          size: 26,
          h: 50,
          minW: 230,
          opacity: alpha * nt,
        }),
        txt('admin hidden', -160, 262, 26, ROLE.poison, 'mono', 'center').opacity(alpha * nt),
      );
    } else {
      q3.push(
        txt(
          'Fix: narrow schemas to active phase allowlist',
          -815,
          258,
          27,
          COSMOS.muted,
          'mono',
          'left',
        ).opacity(alpha * 0.7),
      );
    }
    quadrant(
      -450,
      200,
      '3. CONFUSION',
      'Admin tool picked from overlapping schemas',
      ROLE.tool,
      nt,
      q3,
    );

    // Q4 (bottom-right): CLASH
    const q4 = [];
    if (df > 0.15) {
      q4.push(
        chip('DATA: "use XML"', 240, 262, {
          color: ROLE.units,
          size: 26,
          h: 50,
          minW: 260,
          opacity: alpha * df,
        }),
        chip('POLICY: JSON', 590, 262, {
          color: ROLE.note,
          size: 26,
          h: 50,
          minW: 260,
          opacity: alpha * df,
        }),
      );
    } else {
      q4.push(
        txt(
          'Fix: quote retrieved text as untrusted data',
          85,
          258,
          27,
          COSMOS.muted,
          'mono',
          'left',
        ).opacity(alpha * 0.7),
      );
    }
    quadrant(450, 200, '4. CLASH', 'Retrieved XML directive vs JSON policy', ROLE.units, df, q4);

    // Bottom takeaway
    nodes.push(
      txt(
        df > 0.3 || nt > 0.3
          ? 'Change one assembly choice at a time, then compare matched tasks.'
          : 'Each symptom maps to a specific edit in the next request.',
        0,
        410,
        30,
        df > 0.3 ? ROLE.note : COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, layer);

  playCue(s, c, 'ce-failure-interventions-1', (d) => s.play(showSymptoms.to(1, { duration: d })));
  playCue(s, c, 'ce-failure-interventions-2', (d) => s.play(focusPoison.to(1, { duration: d })));
  playCue(s, c, 'ce-remove-poison', (d) => s.play(removePoison.to(1, { duration: d })));
  playCue(s, c, 'ce-keep-negative', (d) => s.play(keepNeg.to(1, { duration: d })));
  playCue(s, c, 'ce-new-evidence', (d) => s.play(newEvid.to(1, { duration: d })));
  playCue(s, c, 'ce-failure-interventions-3', (d) => s.play(narrowTools.to(1, { duration: d })));
  playCue(s, c, 'ce-demote-format', (d) => s.play(demoteFmt.to(1, { duration: d })));
}
