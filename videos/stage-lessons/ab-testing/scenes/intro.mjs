// Scene 01 (intro): "Does the runbook back this answer?"
// Runbook requirement vs assistant "Alone" claim -> strict prediction withholding -> dual tally (1 grounding fail + 1 resolved) -> A/B split + +0.50 pp guardrail budget.
import {
  BAD_COLOR,
  COSMOS,
  CTRL_COLOR,
  GOOD_COLOR,
  TRT_COLOR,
  WARN_COLOR,
  aura,
  glowArrow,
  glowDot,
  glowRing,
  guardedDynamic,
  heroTitle,
  lumBar,
  rule,
  tweenCue,
  txt,
} from '../parts.mjs';

export default function intro(s, c) {
  const showMarked = s.value(0);
  const showSource = s.value(0);
  const showAsk = s.value(0);
  const showAlone = s.value(0);
  const showAudit = s.value(0);
  const showResolved = s.value(0);
  const showSplit = s.value(0);
  const showBudget = s.value(0);

  const bgAura = aura(0, 20, 640, '#133a4a36', '#3a183b22');
  const title = heroTitle(['Does the Runbook', 'Back This Answer?'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 62,
    accent: CTRL_COLOR,
    eyebrow: 'EXPERIMENT DESIGN · OPENING CASE',
  });

  const live = guardedDynamic(s.value(1), () => {
    const nodes = [
      // Left: Runbook source sentence (always present as quiet skeleton from t=0)
      txt('RUNBOOK POLICY (SOURCE)', -855, -245, 26, CTRL_COLOR, 'mono', 'left').opacity(
        0.55 + 0.45 * showSource.value,
      ),
      lumBar(-430, -145, 840, 118, {
        color: CTRL_COLOR,
        fillOpacity: 0.14,
        glow: 7,
        opacity: 0.55 + 0.45 * showSource.value,
      }),
      txt(
        '“Rollback requires owner acknowledgement.”',
        -820,
        -162,
        30,
        COSMOS.ink,
        'serif',
        'left',
      ).opacity(0.65 + 0.35 * showSource.value),
      txt(
        'Status: names ONE necessary requirement',
        -820,
        -112,
        26,
        COSMOS.muted,
        'mono',
        'left',
      ).opacity(0.55 + 0.45 * showSource.value),

      // Right: Assistant reply + minute-8 usable stamp
      txt('ASSISTANT REPLY (MIN 8)', 45, -245, 26, WARN_COLOR, 'mono', 'left').opacity(
        0.55 + 0.45 * showMarked.value,
      ),
      lumBar(450, -145, 810, 118, {
        color: showAlone.value > 0.5 ? BAD_COLOR : WARN_COLOR,
        fillOpacity: 0.14,
        glow: 8,
        opacity: 0.55 + 0.45 * showMarked.value,
      }),
      txt('“Acknowledgement', 80, -162, 30, COSMOS.ink, 'serif', 'left'),
      txt('alone', 345, -162, 32, showAlone.value > 0.5 ? BAD_COLOR : COSMOS.ink, 'serif', 'left'),
      txt('authorizes rollback.”', 445, -162, 30, COSMOS.ink, 'serif', 'left'),
      txt(
        showMarked.value > 0.3
          ? 'OK: Engineer clicked USABLE at minute 8'
          : 'Minute 8 reply pending review',
        80,
        -112,
        26,
        GOOD_COLOR,
        'mono',
        'left',
      ).opacity(0.5 + 0.5 * showMarked.value),
    ];

    if (showAlone.value > 0.02) {
      nodes.push(
        rule(345, -142, 422, -142, BAD_COLOR, 5.5).glow(9, BAD_COLOR).opacity(showAlone.value),
      );
    }

    // Center: Two separate counters receiving the SAME answer
    const splitOp = Math.max(0.35, showAudit.value, showResolved.value);
    nodes.push(
      txt(
        'SAME ANSWER ENTERS TWO SEPARATE COUNTS',
        -855,
        10,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ).opacity(splitOp),
      lumBar(-430, 105, 830, 100, {
        color: BAD_COLOR,
        fillOpacity: showAudit.value > 0.4 ? 0.2 : 0.08,
        glow: showAudit.value > 0.4 ? 9 : 4,
        opacity: 0.45 + 0.55 * showAudit.value,
      }),
      txt(
        showAudit.value > 0.5
          ? 'BLINDED AUDIT:  +1 GROUNDING FAILURE'
          : 'BLINDED AUDIT:  grounding check pending',
        -815,
        105,
        28,
        BAD_COLOR,
        'mono',
        'left',
      ).opacity(0.45 + 0.55 * showAudit.value),

      lumBar(450, 105, 810, 100, {
        color: GOOD_COLOR,
        fillOpacity: showResolved.value > 0.4 ? 0.2 : 0.08,
        glow: showResolved.value > 0.4 ? 9 : 4,
        opacity: 0.45 + 0.55 * showResolved.value,
      }),
      txt(
        showResolved.value > 0.5
          ? 'MIN-10 METRIC:  +1 RESOLVED INCIDENT'
          : 'MIN-10 METRIC:  usable + no new page',
        80,
        105,
        28,
        GOOD_COLOR,
        'mono',
        'left',
      ).opacity(0.45 + 0.55 * showResolved.value),
    );

    // Bottom: Non-overlapping prediction prompt -> A/B randomized split + +0.50 pp budget
    const askOp = showAsk.value * Math.max(0, 1 - showAlone.value * 2.6);
    if (askOp > 0.02) {
      nodes.push(
        txt(
          'Which single word turns a requirement into permission?',
          -855,
          290,
          34,
          WARN_COLOR,
          'serif',
          'left',
        )
          .glow(7, WARN_COLOR)
          .opacity(askOp),
      );
    }

    const ansOp =
      Math.max(0, (showAlone.value - 0.45) / 0.55) * Math.max(0, 1 - showSplit.value * 2.6);
    if (ansOp > 0.02) {
      nodes.push(
        txt(
          '“Alone.”  One requirement became full permission: +1 resolved AND +1 grounding failure.',
          -855,
          290,
          30,
          BAD_COLOR,
          'sans',
          'left',
        )
          .glow(6, BAD_COLOR)
          .opacity(ansOp),
      );
    }

    const abOp = Math.max(0, (showSplit.value - 0.45) / 0.55);
    if (abOp > 0.02) {
      nodes.push(
        glowDot(-780, 290, { radius: 10, color: COSMOS.ink, glow: 8, opacity: abOp }),
        txt('Eligible', -780, 336, 26, COSMOS.muted, 'mono').opacity(abOp),
        glowArrow([-745, 275], [-565, 240], CTRL_COLOR, { opacity: abOp }),
        glowArrow([-745, 305], [-565, 340], TRT_COLOR, { opacity: abOp }),
        txt('CONTROL: Raw query', -540, 238, 28, CTRL_COLOR, 'mono', 'left').opacity(abOp),
        txt('TREATMENT: Query rewrite', -540, 340, 28, TRT_COLOR, 'mono', 'left').opacity(abOp),
        txt(
          'Same index, prompt, model & decoder',
          35,
          238,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(abOp),
        txt(
          'Grounding failure budget:  Δ upper bound < +0.50 pp',
          35,
          340,
          28,
          WARN_COLOR,
          'mono',
          'left',
        )
          .glow(7, WARN_COLOR)
          .opacity(Math.max(0.25, showBudget.value) * abOp),
      );
    }

    return nodes;
  });

  s.add(bgAura, title, live);

  tweenCue(s, c, 'marked', showMarked, 1, { duration: 0.45 });
  tweenCue(s, c, 'source', showSource, 1, { duration: 0.45 });
  tweenCue(s, c, 'ask', showAsk, 1, { duration: 0.45 });
  tweenCue(s, c, 'alone', showAlone, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'audit', showAudit, 1, { duration: 0.45 });
  tweenCue(s, c, 'resolved', showResolved, 1, { duration: 0.45 });
  tweenCue(s, c, 'split', showSplit, 1, { duration: 0.55 });
  tweenCue(s, c, 'budget', showBudget, 1, { duration: 0.45 });
}
