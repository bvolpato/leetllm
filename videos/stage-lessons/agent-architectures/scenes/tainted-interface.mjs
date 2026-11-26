// Scene 11: tainted-interface - Who can authorize a patch draft?
// Host tool registry separating Read (CI) vs Write (open_patch): untrusted log cannot
// authorize a write (0 drafts) -> exact human approval unlocks Draft #1 -> extra field
// triggers schema rejection leaving Draft #1 intact!
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

export default function taintedInterface(s, c) {
  const pulse = s.value(0);
  const blockOn = s.value(0);
  const apprOn = s.value(0);
  const draft1On = s.value(0);
  const extraRejOn = s.value(0);

  const header = cinemaHeader('WRITE AUTHORIZATION GATE', 'Who can authorize', 'a patch draft?', {
    accent: ROLE.fail,
    size: 50,
  });

  const stageAura = aura(160, 40, 620, '#ff6b8b1c', '#6ee7b71a');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = pulse.value;
      const bl = blockOn.value;
      const ap = apprOn.value;
      const d1 = draft1On.value;
      const ex = extraRejOn.value;
      const nodes = [];

      // Top registry split: read_ci (READ) vs open_patch (WRITE)
      nodes.push(
        txt('HOST PERMISSION REGISTRY', -840, -185, 26, ROLE.host, 'mono', 'left'),
        txt('read_ci -> READ  (log stays untrusted)', -840, -135, 26, ROLE.action, 'mono', 'left'),
        txt(
          'open_patch -> WRITE  (tool · path · change)',
          -840,
          -90,
          26,
          ROLE.fail,
          'mono',
          'left',
        ),
      );

      // 3-step horizontal gate pipeline (y = 65)
      const gY = 65;
      const xReq = -580;
      const xGate = -60;
      const xLed = 520;

      const gateCol =
        ex > 0.35 ? ROLE.fail : d1 > 0.35 ? ROLE.ok : bl > 0.35 ? ROLE.fail : ROLE.host;
      const reqSub =
        ex > 0.35
          ? 'extra field -> malformed!'
          : ap > 0.35
            ? 'exact human approval'
            : 'from CI log (unapproved)';

      nodes.push(
        orbNode(xReq, gY, 'REQ', ex > 0.35 ? ROLE.fail : ROLE.policy, {
          radius: 56,
          sub: reqSub,
        }),
        beamWithPhotons(
          [
            [xReq + 64, gY],
            [xGate - 74, gY],
          ],
          gateCol,
          p * 1.1,
          { width: 3.6 },
        ),
        orbNode(xGate, gY, 'GATE', gateCol, {
          radius: 66,
          sub:
            ex > 0.35
              ? 'SHAPE REJECTED'
              : ap > 0.35
                ? 'APPROVED -> ALLOW'
                : bl > 0.35
                  ? 'BLOCKED (0 DRAFTS)'
                  : 'Checking policy...',
        }),
        beamWithPhotons(
          [
            [xGate + 74, gY],
            [xLed - 66, gY],
          ],
          d1 > 0.35 ? ROLE.ok : '#2e3f68',
          p * 1.1 + 0.5,
          { alpha: d1 > 0.35 ? 1 : 0.3, width: 3.6 },
        ),
        orbNode(xLed, gY, d1 > 0.35 ? 'DRAFT 1' : '0 DRAFTS', d1 > 0.35 ? ROLE.ok : COSMOS.dim, {
          radius: 60,
          sub: d1 > 0.35 ? 'Migration file untouched' : 'No write performed',
        }),
      );

      // Bottom failure taxonomy
      nodes.push(
        line([-840, 265], [840, 265], { stroke: '#25355a', width: 2 }).opacity(0.65),
        txt(
          ex > 0.35
            ? '3 SEPARATE FAILURES: MALFORMED SHAPE  ·  POLICY DENIAL  ·  MISREAD RESULT'
            : 'Exact approval bound to tool + path + change payload',
          0,
          330,
          26,
          ex > 0.35 ? ROLE.focus : COSMOS.muted,
          'mono',
          'center',
        ),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  driftValue(s, c, pulse, 4.4, { startOffset: 0.1, endMargin: 0.5 });

  c.on('aa-tainted-interface-0', () => {
    s.play(pulse.to(0.3, { duration: clampDur(c, c.cue('aa-tainted-interface-0').start, 0.25) }));
  });
  c.on('aa-tainted-interface-1', () => {
    s.play(blockOn.to(0.5, { duration: clampDur(c, c.cue('aa-tainted-interface-1').start, 0.25) }));
  });
  c.on('patch-block', () => {
    s.play(blockOn.to(1, { duration: clampDur(c, c.cue('patch-block').start, 0.35) }));
  });
  c.on('patch-approval', () => {
    s.play(apprOn.to(1, { duration: clampDur(c, c.cue('patch-approval').start, 0.35) }));
  });
  c.on('patch-one', () => {
    s.play(draft1On.to(1, { duration: clampDur(c, c.cue('patch-one').start, 0.35) }));
  });
  c.on('aa-tainted-interface-2', () => {
    s.play(
      extraRejOn.to(0.5, { duration: clampDur(c, c.cue('aa-tainted-interface-2').start, 0.25) }),
    );
  });
  c.on('patch-extra', () => {
    s.play(extraRejOn.to(1, { duration: clampDur(c, c.cue('patch-extra').start, 0.35) }));
  });
}
