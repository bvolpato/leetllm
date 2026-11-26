// Scene 15 (revocation-and-cache): "Recheck a buffered answer"
// Two luminous evidence conduits ([E1] Key policy + [E2] Session policy) feeding a buffered draft
// crystal ("eligible [E1]"). Revoking [E2] severs its conduit, forces discarding the buffered draft
// (after `discard`), and rebuilds a fresh answer solely from [E1] (after `new-draft`).
import { dynamic, group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  RULE,
  RUN,
  answerFromEvidence,
  assertEqual,
  callerTag,
  cinemaAtmosphere,
  glowBezier,
  glowDot,
  heroTitle,
  lumBar,
  playCue,
  runPhase,
  statusPill,
  tweenCue,
  txt,
} from '../parts.mjs';

export default function revocationAndCache(s, c) {
  const cut = RUN.packed.find((item) => item.documentId === 'eu-session');
  const permittedNow = RUN.packed.filter((item) => item.documentId !== cut.documentId);
  const inputs = {
    intent: 'rotation_eligibility',
    staleDays: RULE.requestDays,
    signalHours: RULE.requestHours,
  };
  const oldDraft = answerFromEvidence(inputs, RUN.packed);
  const newDraft = answerFromEvidence(inputs, permittedNow);
  assertEqual(oldDraft.cited.includes(cut.sourceId), false, 'E2 supplied but uncited');
  assertEqual(newDraft.decision, 'eligible', 'E1 alone still supports eligible');

  const phase = s.value(0);
  const showDraft = s.value(0);
  const sessionRevoked = s.value(0);
  const askDraft = s.value(0);
  // Draft crystal state: 0 = buffered draft (E1+E2), 1 = discarded, 2 = rebuilt from E1 alone
  const draftState = s.value(0);
  const rebuildGlow = s.value(0);
  const inputsSpotlight = s.value(0);

  const title = heroTitle(['Recheck a', 'Buffered Answer'], {
    x: -855,
    y: -440,
    size: 54,
    lineHeight: 64,
    accent: ROLE.policy,
    eyebrow: 'LIVE REVOCATION · BUFFERED & CACHED DRAFTS',
  });

  const live = dynamic(() => {
    const p = phase.value;
    const pulse = 0.8 + 0.2 * Math.sin(p * 3.0);
    const sd = showDraft.value;
    const rev = sessionRevoked.value;
    const ask = askDraft.value;
    const ds = Math.round(draftState.value);
    const rb = rebuildGlow.value;
    const isp = inputsSpotlight.value;

    const nodes = [callerTag(1)];

    // Left: Two supplied model input capsules ([E1] Key rule, [E2] Session rule)
    const srcX = -515;
    const yE1 = -95;
    const yE2 = 145;

    // [E1] Key rule - stays permitted throughout
    nodes.push(
      lumBar(srcX, yE1, 660, 155, {
        color: ROLE.policy,
        fillAlpha: 0.1 + rb * 0.08,
        strokeWidth: 2.4,
        glow: 9 + rb * 6,
        radius: 16,
      }),
      txt('[E1]  EU KEY POLICY', -810, yE1 - 36, 30, ROLE.policy, 'mono', 'left'),
      txt('Permitted · cited in draft', -810, yE1 + 18, 26, ROLE.admitted, 'sans', 'left'),
    );

    // [E2] Session rule - permitted -> REVOKED while buffered!
    const e2Col = rev > 0.3 ? ROLE.danger : ROLE.session;
    nodes.push(
      lumBar(srcX, yE2, 660, 155, {
        color: e2Col,
        fillAlpha: 0.09 + isp * 0.1,
        strokeWidth: 2.4 + isp * 1.2,
        glow: (rev > 0.3 ? 11 : 7) * pulse,
        radius: 16,
      }),
      txt('[E2]  EU SESSION POLICY', -810, yE2 - 36, 30, e2Col, 'mono', 'left'),
      txt(
        rev > 0.3 ? 'READ PERMISSION REVOKED!' : 'Permitted · supplied to model (uncited)',
        -810,
        yE2 + 18,
        26,
        rev > 0.3 ? ROLE.danger : COSMOS.muted,
        'mono',
        'left',
      ),
    );

    // Glowing Bezier conduits from sources to draft crystal
    const dstLeft = 105;
    const dstCx = 465;
    const dstY = 25;

    if (sd > 0.05) {
      // [E1] conduit
      const e1Active = ds !== 1;
      nodes.push(
        glowBezier([-185, yE1], [dstLeft, dstY - 30], -25, {
          color: ds === 2 ? ROLE.admitted : ROLE.policy,
          width: ds === 2 ? 5.0 : 3.8,
          glow: 10,
          opacity: e1Active ? sd : 0.25,
          core: ds === 2,
        }),
      );
      // [E2] conduit (severed by red slash once revoked!)
      if (ds === 0) {
        nodes.push(
          glowBezier([-185, yE2], [dstLeft, dstY + 30], 25, {
            color: rev > 0.3 ? ROLE.danger : ROLE.session,
            width: 3.6,
            glow: 9,
            opacity: sd,
          }),
        );
        if (rev > 0.3) {
          // Red revocation slash across E2 conduit
          nodes.push(
            line([-65, 50], [-15, 130], { stroke: ROLE.danger, width: 6 }).glow(
              12 * pulse,
              ROLE.danger,
            ),
            line([-15, 50], [-65, 130], { stroke: ROLE.danger, width: 6 }).glow(
              12 * pulse,
              ROLE.danger,
            ),
          );
        }
      }
      if (ds === 2) {
        glowDot(dstLeft, dstY - 30, { radius: 8, color: ROLE.admitted, glow: 12 });
      }
    }

    // Right: Draft Crystal (3 clean discrete states: Buffered -> Discarded -> Rebuilt)
    const boxCol =
      ds === 2 ? ROLE.admitted : ds === 1 ? ROLE.danger : rev > 0.3 ? ROLE.warn : ROLE.request;
    nodes.push(
      lumBar(dstCx, dstY, 720, 320, {
        color: boxCol,
        fillAlpha: ds === 1 ? 0.06 : 0.11,
        strokeWidth: 2.6,
        glow: (ds === 2 ? 12 : 8) * pulse,
        radius: 18,
        dash: ds === 1 ? [12, 8] : undefined,
      }),
    );

    if (ds === 0) {
      nodes.push(
        txt(
          'BUFFERED DRAFT AWAITING DELIVERY',
          dstCx,
          dstY - 102,
          26,
          ROLE.request,
          'mono',
          'center',
        ),
        txt(
          `${oldDraft.decision.toUpperCase()}   [${oldDraft.cited[0]}]`,
          dstCx,
          dstY - 12,
          56,
          COSMOS.ink,
          'serif',
          'center',
        ).glow(6, ROLE.request),
        txt(
          'Generated with BOTH [E1] and [E2] in prompt',
          dstCx,
          dstY + 86,
          26,
          COSMOS.muted,
          'sans',
          'center',
        ),
      );
    } else if (ds === 1) {
      nodes.push(
        txt('ORIGINAL BUFFERED DRAFT', dstCx, dstY - 102, 26, ROLE.danger, 'mono', 'center'),
        txt('DISCARDED', dstCx, dstY - 12, 58, ROLE.danger, 'mono', 'center').glow(11, ROLE.danger),
        txt(
          'Uncited [E2] still could have shaped wording',
          dstCx,
          dstY + 86,
          26,
          COSMOS.muted,
          'sans',
          'center',
        ),
      );
    } else {
      nodes.push(
        txt(
          'REBUILT FROM PERMITTED [E1] ALONE',
          dstCx,
          dstY - 102,
          26,
          ROLE.admitted,
          'mono',
          'center',
        ),
        txt(
          `${newDraft.decision.toUpperCase()}   [${newDraft.cited[0]}]`,
          dstCx,
          dstY - 12,
          56,
          ROLE.admitted,
          'serif',
          'center',
        ).glow(12 * pulse, ROLE.admitted),
        statusPill('FRESH SAFE ANSWER', dstCx, dstY + 92, {
          color: ROLE.admitted,
          width: 340,
          height: 46,
        }),
      );
    }

    // Discrete bottom verdict (strictly withholds answer during `ask-draft`)
    let footText = 'Both passages enter the prompt; draft cites only [E1]';
    let footCol = COSMOS.muted;
    let footFont = 'sans';
    if (isp > 0.5) {
      footText = 'Recheck ALL model inputs (not just cited IDs) for cached & buffered answers';
      footCol = ROLE.focus;
      footFont = 'mono';
    } else if (ds === 2) {
      footText = 'Fresh answer from [E1] alone: ELIGIBLE [E1]  (or abstain if EU grant revoked)';
      footCol = ROLE.admitted;
      footFont = 'mono';
    } else if (rb > 0.5) {
      footText = 'Rebuild strictly from the passages Luna is permitted to read now';
      footCol = ROLE.policy;
      footFont = 'mono';
    } else if (ds === 1) {
      footText = 'Discard the buffered draft  ·  both inputs influenced generation';
      footCol = ROLE.danger;
      footFont = 'mono';
    } else if (ask > 0.5) {
      footText = 'Permission for uncited [E2] was just revoked. Can Luna receive this draft?';
      footCol = ROLE.focus;
      footFont = 'serif';
    }
    nodes.push(
      txt(footText, -855, 415, 30, footCol, footFont, 'left').glow(
        footCol !== COSMOS.muted ? 7 : 0,
        footCol,
      ),
    );

    return group(...nodes);
  });

  s.add(cinemaAtmosphere(ROLE.policy, ROLE.session), title, live);
  runPhase(s, c, phase, 14);

  tweenCue(s, c, 'both-passages', showDraft, 1, { dur: 0.55 });
  tweenCue(s, c, 'revoke-session', sessionRevoked, 1, { dur: 0.5 });
  tweenCue(s, c, 'ask-draft', askDraft, 1, { dur: 0.25 });
  playCue(s, c, 'discard', () => s.play(draftState.to(1, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });
  tweenCue(s, c, 'rebuild', rebuildGlow, 1, { dur: 0.5 });
  playCue(s, c, 'new-draft', () => s.play(draftState.to(2, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });
  tweenCue(s, c, 'model-inputs', inputsSpotlight, 1, { dur: 0.5 });
}
