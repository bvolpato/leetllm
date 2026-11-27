// Scene 25: strict-tool-contract - Shape, access and observation are separate
// 3 CI requests streaming into a dual-layer barrier (Schema Gate -> Scope/Access Gate):
//   1. R1842 valid shape + authorized -> 1 backend read (emerald)
//   2. include_logs="yes" / extra field -> blocked at Schema Gate (rose)
//   3. R9999 valid shape, out of actor scope -> blocked at Access Gate before backend!
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  guardedDynamic,
  orbNode,
  txt,
} from '../parts.mjs';

export default function strictToolContract(s, c) {
  const pulse = s.value(0);
  const shapeRej = s.value(0);
  const scopeDen = s.value(0);
  const oneRead = s.value(0);
  const openaiNote = s.value(0);

  const header = cinemaHeader(
    'TOOL EXECUTION CONTRACT',
    'Shape, access, and',
    'observation are separate',
    {
      accent: ROLE.host,
      size: 48,
    },
  );

  const stageAura = aura(160, 40, 620, '#60a5fa1e', '#ff6b8b1a');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = 0;
      const sh = shapeRej.value;
      const sc = scopeDen.value;
      const or = oneRead.value;
      const on = openaiNote.value;
      const nodes = [];

      const xReq = -820;
      const xSchema = -130;
      const xScope = 240;
      const xBack = 610;
      const ys = [-140, 20, 180];

      // Vertical glowing barrier walls
      nodes.push(
        txt('SCHEMA GATE', xSchema, -225, 26, ROLE.host, 'mono', 'center'),
        line([xSchema, -190], [xSchema, 240], { stroke: ROLE.host, width: 5 }).glow(9, ROLE.host),
        txt('SCOPE / ACCESS', xScope, -225, 26, ROLE.policy, 'mono', 'center'),
        line([xScope, -190], [xScope, 240], { stroke: ROLE.policy, width: 5 }).glow(9, ROLE.policy),
        orbNode(xBack, ys[0], 'BACKEND', ROLE.ok, {
          radius: 56,
          sub: or > 0.35 ? '1 read (R1842)' : 'CI service',
        }),
      );

      // Row 0: Valid authorized R1842 passes BOTH walls -> reaches Backend!
      nodes.push(
        txt('1. { run_id:"R1842" }', xReq, ys[0], 26, ROLE.ok, 'mono', 'left'),
        beamWithPhotons(
          [
            [-360, ys[0]],
            [xBack - 94, ys[0]],
          ],
          ROLE.ok,
          p * 1.1,
          { width: 3.8 },
        ),
      );

      // Row 1: Bad shape (include_logs:"yes" / extra field) stops at Schema wall!
      nodes.push(
        txt(
          '2. { include_logs:"yes" }',
          xReq,
          ys[1],
          26,
          sh > 0.35 ? ROLE.fail : COSMOS.ink,
          'mono',
          'left',
        ),
        beamWithPhotons(
          [
            [-360, ys[1]],
            [xSchema - 14, ys[1]],
          ],
          ROLE.fail,
          p * 1.1 + 0.35,
          { alpha: 0.4 + sh * 0.6, width: 3.4 },
        ),
        txt('REJECTED (SHAPE)', xSchema + 28, ys[1], 26, ROLE.fail, 'mono', 'left')
          .glow(7, ROLE.fail)
          .opacity(0.35 + sh * 0.65),
      );

      // Row 2: Valid shape, unauthorized R9999 passes Schema, stops at Access wall!
      nodes.push(
        txt(
          '3. { run_id:"R9999" }',
          xReq,
          ys[2],
          26,
          sc > 0.35 ? ROLE.caution : COSMOS.ink,
          'mono',
          'left',
        ),
        beamWithPhotons(
          [
            [-360, ys[2]],
            [xScope - 14, ys[2]],
          ],
          ROLE.caution,
          p * 1.1 + 0.7,
          { alpha: 0.4 + sc * 0.6, width: 3.4 },
        ),
        txt('DENIED (SCOPE)', xScope + 28, ys[2], 26, ROLE.caution, 'mono', 'left')
          .glow(7, ROLE.caution)
          .opacity(0.35 + sc * 0.65),
      );

      nodes.push(
        line([-840, 290], [840, 290], { stroke: '#25355a', width: 2 }).opacity(0.65),
        txt(
          on > 0.35
            ? 'PROVIDER STRICT SCHEMAS != HOST SEMANTICS, AUTH, CREDENTIALS & TIMEOUTS'
            : 'Schema validation + actor scope both run BEFORE any backend read',
          0,
          350,
          26,
          on > 0.35 ? ROLE.host : COSMOS.muted,
          'mono',
          'center',
        ),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);

  c.on('aa-strict-tool-contract-0', () => {
    s.play(
      pulse.to(0.3, { duration: clampDur(c, c.cue('aa-strict-tool-contract-0').start, 0.25) }),
    );
  });
  c.on('tool-shape', () => {
    s.play(shapeRej.to(1, { duration: clampDur(c, c.cue('tool-shape').start, 0.35) }));
  });
  c.on('tool-denied', () => {
    s.play(scopeDen.to(1, { duration: clampDur(c, c.cue('tool-denied').start, 0.35) }));
  });
  c.on('tool-one', () => {
    s.play(oneRead.to(1, { duration: clampDur(c, c.cue('tool-one').start, 0.35) }));
  });
  c.on('aa-strict-tool-contract-1', () => {
    s.play(
      openaiNote.to(1, { duration: clampDur(c, c.cue('aa-strict-tool-contract-1').start, 0.35) }),
    );
  });
}
