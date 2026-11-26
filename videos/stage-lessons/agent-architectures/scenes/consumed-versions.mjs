// Scene 20: consumed-versions - Which health result did the decision use?
// Version-mismatch circuit: Health advances v1 -> v2 while Decision still pins consumed:v1
// (rose mismatch spark), plus external service ledger showing a created proposal survives
// even after its step is deleted from the local plan!
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  driftValue,
  guardedDynamic,
  orbNode,
  txt,
} from '../parts.mjs';

export default function consumedVersions(s, c) {
  const pulse = s.value(0);
  const v2On = s.value(0);
  const mismatchOn = s.value(0);
  const ledgerOn = s.value(0);
  const removeStepOn = s.value(0);

  const header = cinemaHeader(
    'VERSIONED PROVENANCE & LEDGERS',
    'Which health version',
    'did the decision use?',
    { accent: ROLE.focus, size: 48 },
  );

  const stageAura = aura(160, 40, 620, '#ffd1661c', '#ff6b8b1a');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = pulse.value;
      const v2 = v2On.value;
      const mm = mismatchOn.value;
      const lg = ledgerOn.value;
      const rm = removeStepOn.value;
      const nodes = [];

      // Top Track (y = -85): Health v1 -> v2 vs Decision(consumed: health=v1)
      const yTop = -80;
      nodes.push(
        txt('CONSUMED INPUT VERSION CHECK', -860, yTop - 122, 26, ROLE.plan, 'mono', 'left'),
        orbNode(-520, yTop, v2 > 0.35 ? 'HLTH v2' : 'HLTH v1', v2 > 0.35 ? ROLE.ok : ROLE.action, {
          radius: 58,
          sub: v2 > 0.35 ? 'Refreshed version 2' : 'Original version 1',
        }),
        beamWithPhotons(
          [
            [-418, yTop],
            [-95, yTop],
          ],
          mm > 0.35 ? ROLE.fail : ROLE.action,
          p * 1.1,
          { width: 3.6 },
        ),
        orbNode(0, yTop, 'DECIDE', mm > 0.35 ? ROLE.fail : ROLE.plan, {
          radius: 62,
          sub: 'consumed: health=v1',
        }),
        txt(
          mm > 0.35 ? 'v1 != v2 -> MUST RECOMPUTE' : 'Same step name, check exact version',
          120,
          yTop,
          28,
          mm > 0.35 ? ROLE.fail : COSMOS.muted,
          'mono',
          'left',
        ).glow(mm > 0.35 ? 8 : 0, ROLE.fail),
      );

      // Bottom Track (y = 225): Plan step removed, external ledger proposal persists!
      const yBot = 225;
      const aBot = 0.3 + lg * 0.7;
      nodes.push(
        line([-860, 74], [840, 74], { stroke: '#25355a', width: 2 }).opacity(0.65),
        txt(
          'EXTERNAL SIDE-EFFECT LEDGER',
          -860,
          yBot - 118,
          26,
          ROLE.caution,
          'mono',
          'left',
        ).opacity(aBot),
        orbNode(-520, yBot, rm > 0.35 ? 'DELETED' : 'STEP', rm > 0.35 ? ROLE.fail : ROLE.host, {
          radius: 54,
          sub: rm > 0.35 ? 'Removed from plan' : 'Plan effect step',
          opacity: aBot * (rm > 0.35 ? 0.55 : 1),
        }),
        beamWithPhotons(
          [
            [-418, yBot],
            [-95, yBot],
          ],
          ROLE.caution,
          p * 1.1 + 0.4,
          { alpha: aBot * (rm > 0.35 ? 0.3 : 0.9), width: 3.2 },
        ),
        orbNode(0, yBot, 'LEDGER', ROLE.ok, {
          radius: 60,
          sub: 'Proposal STILL EXISTS!',
          opacity: aBot,
        }),
        txt(
          rm > 0.35
            ? 'KEEP OP-ID -> RECONCILE BEFORE RETRY'
            : 'Shared resource outlives local plan graph',
          120,
          yBot,
          28,
          rm > 0.35 ? ROLE.focus : COSMOS.muted,
          'mono',
          'left',
        )
          .glow(rm > 0.35 ? 7 : 0, ROLE.focus)
          .opacity(aBot),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  driftValue(s, c, pulse, 4.4, { startOffset: 0.1, endMargin: 0.5 });

  c.on('aa-consumed-versions-0', () => {
    s.play(pulse.to(0.3, { duration: clampDur(c, c.cue('aa-consumed-versions-0').start, 0.25) }));
  });
  c.on('version-health', () => {
    s.play(v2On.to(1, { duration: clampDur(c, c.cue('version-health').start, 0.35) }));
  });
  c.on('version-invalid', () => {
    s.play(mismatchOn.to(1, { duration: clampDur(c, c.cue('version-invalid').start, 0.35) }));
  });
  c.on('aa-consumed-versions-1', () => {
    s.play(
      ledgerOn.to(0.5, { duration: clampDur(c, c.cue('aa-consumed-versions-1').start, 0.25) }),
    );
  });
  c.on('version-recorded', () => {
    s.play(ledgerOn.to(1, { duration: clampDur(c, c.cue('version-recorded').start, 0.35) }));
  });
  c.on('version-effect', () => {
    s.play(removeStepOn.to(1, { duration: clampDur(c, c.cue('version-effect').start, 0.35) }));
  });
}
