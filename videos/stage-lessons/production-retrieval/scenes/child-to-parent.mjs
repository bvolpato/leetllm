// Scene 09 (child-to-parent): "Which passage will E1 open?"
// Luminous source clause pairing ("14 days" + "48 hours"), two child hits converging through
// the 6-check parent admission prism, deduplicating into [E1] + [E2], and filling the whole-request
// toy byte-tokenizer budget bar (501 / 768 tokens).
import { dynamic, group, line } from 'vizmatic/stage';
import {
  COSMOS,
  PARENTS,
  ROLE,
  callerTag,
  cinemaAtmosphere,
  glowBezier,
  glowDot,
  glowRing,
  heroTitle,
  lumBar,
  parentPackingFixture,
  playCue,
  runPhase,
  tweenCue,
  txt,
} from '../parts.mjs';

export default function childToParent(s, c) {
  const fixture = parentPackingFixture();

  const phase = s.value(0);
  const clause1Lit = s.value(0);
  const clause2Lit = s.value(0);
  const hitsResolve = s.value(0); // two child hits glide toward parent
  const checksLit = s.value(0); // 6 admission checks turn emerald
  const packedVis = s.value(0); // E1 and E2 packed sections appear
  const dedupMerge = s.value(0); // key-b merges into key-a
  const budgetFill = s.value(0); // whole-request segmented token bar fills

  const title = heroTitle(['Which Passage Will', 'E1 Open?'], {
    x: -855,
    y: -440,
    size: 54,
    lineHeight: 64,
    accent: ROLE.policy,
    eyebrow: 'PARENT-CHILD EXPANSION · DEDUPLICATION',
  });

  const checksList = ['parent ID', 'document', 'version', 'eff. date', 'region', 'ACL'];

  const live = dynamic(() => {
    const p = phase.value;
    const pulse = 0.8 + 0.2 * Math.sin(p * 3.0);
    const c1 = clause1Lit.value;
    const c2 = clause2Lit.value;
    const hr = hitsResolve.value;
    const cl = checksLit.value;
    const pv = packedVis.value;
    const dm = dedupMerge.value;
    const bf = budgetFill.value;

    const nodes = [callerTag(1)];

    // Left: Complete parent document with two glowing linked clauses
    const docCx = -530;
    nodes.push(
      lumBar(docCx, -40, 660, 360, {
        color: ROLE.policy,
        fillAlpha: 0.08,
        strokeWidth: 2.2,
        glow: 8,
        radius: 16,
      }),
      txt('eu-access-v2  ·  COMPLETE PARENT', -825, -184, 26, ROLE.policy, 'mono', 'left'),
      txt('Stale service-account keys qualify for', -825, -124, 28, COSMOS.ink, 'sans', 'left'),
      // Clause 1 highlight strip
      lumBar(docCx, -72, 620, 48, {
        color: ROLE.focus,
        fillAlpha: 0.2 * c1,
        strokeWidth: c1 > 0.1 ? 2.0 : 0,
        glow: 8 * c1,
        radius: 8,
        opacity: Math.max(0.01, c1),
      }),
      txt(
        'automated rotation up to 14 days,',
        -820,
        -72,
        28,
        c1 > 0.3 ? ROLE.focus : COSMOS.ink,
        'sans',
        'left',
      ),
      // Clause 2 highlight strip
      lumBar(docCx, -14, 620, 48, {
        color: ROLE.admitted,
        fillAlpha: 0.2 * c2,
        strokeWidth: c2 > 0.1 ? 2.0 : 0,
        glow: 8 * c2,
        radius: 8,
        opacity: Math.max(0.01, c2),
      }),
      txt(
        'provided the risk signal is at most',
        -820,
        -14,
        28,
        c2 > 0.3 ? ROLE.admitted : COSMOS.ink,
        'sans',
        'left',
      ),
      txt('48 hours old.', -820, 42, 28, c2 > 0.3 ? ROLE.admitted : COSMOS.ink, 'sans', 'left'),
      txt('Keep both clauses together for [E1]', -820, 108, 26, COSMOS.muted, 'mono', 'left'),
    );

    // Right top: Child hits converging & deduplicating into one parent
    const hitX0 = -120;
    const hitXMid = 265;
    const hitXEnd = 695;
    const yKeyA = -215;
    const yKeyB = -115;

    nodes.push(
      txt('CHILD HITS', hitX0 + 20, -310, 26, COSMOS.muted, 'mono', 'center'),
      txt('PINNED PARENT', hitXMid, -310, 26, ROLE.policy, 'mono', 'center'),
      txt('PACKED ONCE', hitXEnd, -310, 26, ROLE.admitted, 'mono', 'center'),
      line([hitX0, yKeyA], [hitXEnd, yKeyA], { stroke: '#2c3d63', width: 3 }),
      glowBezier([hitX0, yKeyB], [hitXMid + 110, yKeyA], 35, {
        color: ROLE.policy,
        width: 2.8,
        glow: 6,
        opacity: 0.7,
      }),
    );

    // key-a photon
    const ax = hitX0 + (hitXMid - hitX0) * hr + (hitXEnd - hitXMid) * dm;
    nodes.push(
      glowRing(ax, yKeyA, 20, ROLE.policy, { width: 3.2, glow: 10 * pulse }),
      glowDot(ax, yKeyA, { radius: 8, color: ROLE.policy, glow: 12 }),
      txt('key-a', ax, yKeyA - 48, 26, ROLE.policy, 'mono', 'center'),
    );

    // key-b photon merges smoothly into key-a and vanishes after deduplication
    const bOp = Math.max(0, 1 - dm * 1.4);
    if (bOp > 0.02) {
      const bx = hitX0 + (hitXMid - hitX0) * hr + 60 * dm;
      const by = yKeyB + (yKeyA - yKeyB) * dm;
      nodes.push(
        glowRing(bx, by, 19, ROLE.policy, { width: 2.8, glow: 8, opacity: bOp }),
        glowDot(bx, by, { radius: 7, color: ROLE.policy, glow: 10, opacity: bOp }),
        txt('key-b', bx, by + 46, 26, ROLE.policy, 'mono', 'center').opacity(bOp),
      );
    }

    // 6-check admission bar below conduits
    checksList.forEach((chk, i) => {
      const cx = -95 + i * 165;
      const cy = -24;
      const col = cl > 0.4 ? ROLE.admitted : COSMOS.muted;
      nodes.push(
        lumBar(cx, cy, 148, 44, {
          color: col,
          fillAlpha: cl > 0.4 ? 0.16 : 0.06,
          strokeWidth: 1.8,
          glow: cl > 0.4 ? 6 : 0,
          radius: 8,
        }),
        txt(chk, cx, cy, 26, col, 'mono', 'center'),
      );
    });

    // Packed [E1] and [E2] prompt capsules (revealed on `pack-sections`)
    const e1Y = 76;
    const e2Y = 182;
    if (pv > 0.05) {
      nodes.push(
        lumBar(345, e1Y, 960, 88, {
          color: ROLE.policy,
          fillAlpha: 0.14 * pv,
          strokeWidth: 2.4,
          glow: 9 * pv,
          radius: 12,
          opacity: pv,
        }),
        txt(
          '[E1] eu-access-v2  (packed once)',
          -110,
          e1Y - 18,
          28,
          ROLE.policy,
          'mono',
          'left',
        ).opacity(pv),
        txt(
          '14-day rotation + 48h risk-signal rule',
          -110,
          e1Y + 18,
          26,
          COSMOS.ink,
          'sans',
          'left',
        ).opacity(pv),

        lumBar(345, e2Y, 960, 88, {
          color: ROLE.session,
          fillAlpha: 0.12 * pv,
          strokeWidth: 2.2,
          glow: 7 * pv,
          radius: 12,
          opacity: pv,
        }),
        txt(
          '[E2] eu-session-v1  (distinct parent)',
          -110,
          e2Y - 18,
          28,
          ROLE.session,
          'mono',
          'left',
        ).opacity(pv),
        txt(
          'Idle browser sessions expire after 30 days',
          -110,
          e2Y + 18,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(pv),
      );
    } else {
      nodes.push(
        lumBar(345, 130, 960, 145, {
          color: COSMOS.muted,
          fillAlpha: 0.04,
          strokeWidth: 2,
          glow: 0,
          radius: 12,
          dash: [10, 8],
        }),
        txt(
          'Awaiting 6 parent admission checks before packing...',
          345,
          130,
          28,
          COSMOS.muted,
          'mono',
          'center',
        ),
      );
    }

    // Bottom full-request token meter (byte-v1 toy tokenizer: 501 / 768)
    const barL = -855;
    const barW = 1690;
    const barY = 330;
    const cap = fixture.budget.limit; // 768
    nodes.push(
      txt(
        bf > 0.1
          ? `WHOLE FORMATTED REQUEST (TOY BYTE TOKENIZER):  ${Math.round(fixture.budget.total * bf)} / ${cap} TOKENS`
          : 'WHOLE FORMATTED REQUEST BUDGET (INSTRUCTIONS + QUESTION + WRAPPERS + EVIDENCE)',
        barL,
        barY - 52,
        26,
        bf > 0.1 ? ROLE.focus : COSMOS.muted,
        'mono',
        'left',
      ),
      lumBar(barL + barW * 0.5, barY, barW, 42, {
        color: '#2c3d63',
        fillAlpha: 0.2,
        strokeWidth: 2,
        glow: 0,
        radius: 8,
      }),
    );

    if (bf > 0.02) {
      let cur = barL;
      fixture.budget.parts.forEach((part) => {
        const segW = (part.tokens / cap) * barW * bf;
        const col = part.label.startsWith('E1')
          ? ROLE.policy
          : part.label.startsWith('E2')
            ? ROLE.session
            : ROLE.request;
        if (segW > 4) {
          nodes.push(
            lumBar(cur + segW * 0.5, barY, segW - 3, 34, {
              color: col,
              fillAlpha: 0.65,
              strokeWidth: 1.8,
              glow: 7,
              radius: 5,
            }),
          );
        }
        cur += segW;
      });
    }

    // Discrete bottom caption
    const footText =
      bf > 0.5
        ? 'Instructions + question + wrappers + E1 + E2 = 501 tokens (byte-v1 toy)'
        : pv > 0.5
          ? 'key-a + key-b  ->  eu-access-v2 [E1] (once)   |   session  ->  [E2]'
          : 'Check parent ID, document, version, date, region, and ACL before packing';
    nodes.push(
      txt(footText, -855, 412, 30, bf > 0.5 ? ROLE.focus : COSMOS.muted, 'mono', 'left').glow(
        bf > 0.5 ? 6 : 0,
        ROLE.focus,
      ),
    );

    return group(...nodes);
  });

  s.add(cinemaAtmosphere(ROLE.policy, ROLE.admitted), title, live);
  runPhase(s, c, phase, 14);

  tweenCue(s, c, 'child-match', clause1Lit, 1, { dur: 0.55 });
  tweenCue(s, c, 'parent-condition', clause2Lit, 1, { dur: 0.55 });
  tweenCue(s, c, 'resolve-parent', hitsResolve, 1, { dur: 0.85 });
  tweenCue(s, c, 'check-parent', checksLit, 1, { dur: 0.55 });
  tweenCue(s, c, 'pack-sections', packedVis, 1, { dur: 0.6 });
  tweenCue(s, c, 'deduplicate', dedupMerge, 1, { dur: 0.75 });
  tweenCue(s, c, 'count-complete-request', budgetFill, 1, { after: true, dur: 0.9 });
}
