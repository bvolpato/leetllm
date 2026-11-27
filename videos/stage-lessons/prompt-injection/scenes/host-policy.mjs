// Scene 12: host-policy - C17's release record
// Signature 100-square (20x5) live traffic matrix beside the proposed write and approval
// gate. Walks through: (1) missing approval -> denied / shadow rev 3 / 0%, (2) Casey's
// valid grant -> permitted but STILL 0% waiting dispatch, (3) dispatch commit -> 25% lit
// and rev 3 -> rev 4, (4) returned receipt matching all 3 committed state fields.
import { group, line, rect } from 'vizmatic/stage';
import {
  APPROVAL,
  COSMOS,
  PROPOSAL,
  ROLE,
  TRUSTED,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  energyRail,
  fadeInHalf,
  fadeOutHalf,
  guardedDynamic,
  hexGate,
  promotionAllowed,
  quadArcPts,
  trafficMatrix,
  txt,
} from '../parts.mjs';

export default function hostPolicy(s, c) {
  const pulse = s.value(0);
  const lookupHi = s.value(0);
  const deniedOn = s.value(0);
  const grantArrives = s.value(0);
  const permittedOn = s.value(0);
  const trafficVal = s.value(0); // 0 -> 25
  const committedOn = s.value(0);
  const receiptMode = s.value(0); // 0 = proposal, 1 = committed receipt
  const matchVerified = s.value(0);

  const deniedAllowed = promotionAllowed(PROPOSAL, TRUSTED);
  const grantedAllowed = promotionAllowed(PROPOSAL, { ...TRUSTED, approval: APPROVAL });

  const header = cinemaHeader('HOST AUTHORIZATION & RECEIPT', 'C17’s release', 'record', {
    accent: ROLE.ok,
    size: 50,
  });

  const stageAura = aura(320, 20, 650, '#6ee7b71e', '#5ce1e61a');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = 0;
      const lu = lookupHi.value;
      const dn = deniedOn.value;
      const ga = grantArrives.value;
      const pm = permittedOn.value;
      const tv = trafficVal.value;
      const cm = committedOn.value;
      const rm = receiptMode.value;
      const mv = matchVerified.value;
      const nodes = [];

      const propAlpha = fadeOutHalf(rm);
      const rcptAlpha = fadeInHalf(rm);

      // Left Top: Proposal OR Committed Receipt (non-overlapping crossfade!)
      if (propAlpha > 0.02) {
        nodes.push(
          energyRail(-855, -205, 55, ROLE.proposal, { width: 6, opacity: propAlpha }),
          txt('PROPOSED WRITE (UNTRUSTED)', -825, -182, 26, ROLE.proposal, 'mono', 'left').opacity(
            propAlpha,
          ),
          txt(
            `caller : ${TRUSTED.caller} (authenticated)`,
            -825,
            -126,
            26,
            ROLE.host,
            'mono',
            'left',
          ).opacity(propAlpha),
          txt(
            `target : ${PROPOSAL.candidate} -> ${PROPOSAL.stage} (${PROPOSAL.traffic}%)`,
            -825,
            -70,
            28,
            COSMOS.ink,
            'mono',
            'left',
          ).opacity(propAlpha),
          txt(
            `rev    : ${PROPOSAL.revision}  ·  op: ${PROPOSAL.operationId}`,
            -825,
            -14,
            26,
            COSMOS.muted,
            'mono',
            'left',
          ).opacity(propAlpha),
          txt(
            pm > 0.5 && grantedAllowed
              ? 'STATUS: PERMITTED (WAITING DISPATCH)'
              : dn > 0.5 && !deniedAllowed
                ? 'STATUS: DENIED (RECORDED TO AUDIT)'
                : 'CHECKING POLICY + APPROVAL...',
            -825,
            40,
            26,
            pm > 0.5 ? ROLE.ok : dn > 0.5 ? ROLE.denied : ROLE.host,
            'mono',
            'left',
          ).opacity(propAlpha),
        );
      }

      if (rcptAlpha > 0.02) {
        nodes.push(
          energyRail(-855, -205, 55, ROLE.ok, { width: 6, glow: 12, opacity: rcptAlpha }),
          txt('RETURNED COMMIT RECEIPT', -825, -182, 26, ROLE.ok, 'mono', 'left')
            .glow(6, ROLE.ok)
            .opacity(rcptAlpha),
          txt(
            `op        : ${PROPOSAL.operationId}`,
            -825,
            -122,
            26,
            COSMOS.muted,
            'mono',
            'left',
          ).opacity(rcptAlpha),
          txt(`candidate : ${PROPOSAL.candidate}`, -825, -68, 28, ROLE.ok, 'mono', 'left').opacity(
            rcptAlpha,
          ),
          txt(
            `traffic   : ${PROPOSAL.traffic}% production`,
            -825,
            -14,
            28,
            ROLE.ok,
            'mono',
            'left',
          ).opacity(rcptAlpha),
          txt(
            `revision  : ${PROPOSAL.revision + 1}`,
            -825,
            40,
            28,
            ROLE.ok,
            'mono',
            'left',
          ).opacity(rcptAlpha),
        );
      }

      // Left Bottom: Approval Store Lookup Gate
      const hasGrant = ga > 0.4;
      const appCol = hasGrant ? ROLE.ok : dn > 0.3 ? ROLE.denied : ROLE.host;
      nodes.push(
        line([-855, 92], [-210, 92], { stroke: '#25355a', width: 2 }),
        energyRail(-855, 128, 352, appCol, { width: 6, glow: hasGrant ? 10 : 6 }),
        txt('HOST APPROVAL STORE', -825, 152, 26, ROLE.approval, 'mono', 'left'),
        txt(
          hasGrant ? `GRANT: reviewer = ${APPROVAL.reviewer} (VALID)` : 'GRANT: MISSING (EMPTY)',
          -825,
          212,
          28,
          appCol,
          'mono',
          'left',
        ).glow(6, appCol),
        txt(
          hasGrant
            ? `Matches ${APPROVAL.candidate} · ${APPROVAL.stage} · ${APPROVAL.traffic}% · rev ${APPROVAL.revision}`
            : 'Traceable to release-worker · Zero writes',
          -825,
          272,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ),
        txt(
          mv > 0.4
            ? '3 / 3 RECEIPT FIELDS MATCH COMMITTED STATE'
            : hasGrant
              ? `expiresAt: ${APPROVAL.expiresAt} > now (${TRUSTED.now})`
              : 'Required before any production mutation',
          -825,
          328,
          26,
          mv > 0.4 ? ROLE.ok : ROLE.host,
          'mono',
          'left',
        ).glow(mv > 0.4 ? 8 : 0, ROLE.ok),
      );

      // Center Policy Gate
      const gateX = -45;
      const gateY = 45;
      const gateLabel = cm > 0.5 ? 'COMMITTED' : pm > 0.5 ? 'PERMIT' : dn > 0.5 ? 'DENIED' : 'GATE';
      const gateColor = cm > 0.5 || pm > 0.5 ? ROLE.ok : dn > 0.5 ? ROLE.denied : ROLE.host;
      nodes.push(
        hexGate(gateX, gateY, 64, gateColor, {
          label: gateLabel,
          sub: cm > 0.5 ? 'REV 3 -> 4' : 'POLICY CHECK',
          glow: 10,
        }),
      );

      const bLeft = quadArcPts([-240, 45], [gateX - 118, gateY], 0, 16);
      const bRight = quadArcPts([gateX + 118, gateY], [140, 45], 0, 16);
      nodes.push(
        beamWithPhotons(bLeft, gateColor, p * 1.1, { width: 3.4, alpha: 0.5 + lu * 0.5 }),
        beamWithPhotons(bRight, cm > 0.2 ? ROLE.ok : gateColor, p * 1.1 + 0.5, {
          width: 3.4,
          alpha: 0.4 + Math.max(pm, cm) * 0.6,
        }),
      );

      // Right: Signature 100-Square Live Traffic Allocation Matrix
      const gridX = 165;
      const gridY = -225;
      const pct = Math.round(tv);
      const curRev = cm > 0.5 ? PROPOSAL.revision + 1 : PROPOSAL.revision;
      const curStage = cm > 0.5 ? PROPOSAL.stage : 'shadow';
      const gridCol = cm > 0.5 ? ROLE.ok : ROLE.proposal;

      nodes.push(
        txt('C17 LIVE TRAFFIC MATRIX (1 SQUARE = 1%)', gridX, -278, 26, ROLE.host, 'mono', 'left'),
        trafficMatrix(gridX, gridY, 34, pct, gridCol, { glow: cm > 0.5 ? 8 : 5 }),
        rect(690, 134, {
          fill: '#0e1529',
          stroke: cm > 0.5 ? ROLE.ok : pm > 0.5 ? ROLE.focus : '#2e416e',
          width: 2.6,
          radius: 10,
        }).at(gridX + 345, 98),
        txt(
          `TRAFFIC: ${pct}%  ·  STAGE: ${curStage.toUpperCase()}`,
          gridX + 345,
          70,
          28,
          cm > 0.5 ? ROLE.ok : COSMOS.ink,
          'mono',
          'center',
        ).glow(cm > 0.5 ? 8 : 0, ROLE.ok),
        txt(
          `REV ${curRev}  ${pm > 0.5 && cm < 0.5 ? '(PERMITTED · WAITING)' : cm > 0.5 ? '(COMMITTED STATE)' : '(NO MUTATION)'}`,
          gridX + 345,
          126,
          26,
          cm > 0.5 ? ROLE.host : COSMOS.muted,
          'mono',
          'center',
        ),
      );

      // Verification beam tying receipt on left to committed state on right!
      if (mv > 0.05) {
        const vArc = quadArcPts([-240, -68], [gridX + 20, 72], -95, 24);
        nodes.push(
          beamWithPhotons(vArc, ROLE.ok, p * 1.3, { width: 3.6, alpha: mv }),
          txt(
            'VERIFIED: C17 · 25% · REV 4 MATCH STATE',
            gridX + 345,
            262,
            26,
            ROLE.ok,
            'mono',
            'center',
          )
            .glow(8, ROLE.ok)
            .opacity(mv),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);

  c.on('host-proposal', () => {
    s.play(pulse.to(0.4, { duration: clampDur(c, c.cue('host-proposal').start, 0.25) }));
  });
  c.on('host-lookup', () => {
    s.play(lookupHi.to(1, { duration: clampDur(c, c.cue('host-lookup').start, 0.35) }));
  });
  c.on('host-missing', () => {
    s.play(deniedOn.to(1, { duration: clampDur(c, c.cue('host-missing').start, 0.35) }));
  });
  c.on('host-policy-beat-2-focus-2', () => {
    s.play(deniedOn.to(1, { duration: 0.15 }));
  });
  c.on('pi-approval-arrives', () => {
    s.play(grantArrives.to(1, { duration: clampDur(c, c.cue('pi-approval-arrives').start, 0.4) }));
  });
  c.on('pi-permit', () => {
    s.play(permittedOn.to(1, { duration: clampDur(c, c.cue('pi-permit').start, 0.35) }));
  });
  c.on('pi-allocate', () => {
    s.play(trafficVal.to(25, { duration: clampDur(c, c.cue('pi-allocate').start, 0.65) }));
  });
  c.on('pi-commit', () => {
    s.play(committedOn.to(1, { duration: clampDur(c, c.cue('pi-commit').start, 0.35) }));
  });
  c.on('pi-receipt', () => {
    s.play(receiptMode.to(1, { duration: clampDur(c, c.cue('pi-receipt').start, 0.45) }));
  });
  c.on('host-verify', () => {
    s.play(matchVerified.to(1, { duration: clampDur(c, c.cue('host-verify').start, 0.4) }));
  });
}
