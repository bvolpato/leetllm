// Scene 2: episode-contract - Set the starting account
// Visualizes dual-layer reset discipline: restoring the remote library snapshot
// removes the leftover B8 hold (v12 -> v2), while resetting agent memory separately
// clears the cached lookup and stale approval before freezing the episode contract.
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  autoNode,
  cinemaHeader,
  clampDur,
  driftValue,
  guardedDynamic,
  railBar,
  river,
  segmentWithPhoton,
  trimSeg,
  txt,
} from '../parts.mjs';

export default function episodeContract(s, c) {
  const pulse = s.value(0);
  const reqHi = s.value(0);
  const dirtyHi = s.value(0);
  const dbClean = s.value(0);
  const memClean = s.value(0);
  const frozenLock = s.value(0);

  const header = cinemaHeader('EPISODE CONTRACT', 'Set the starting', 'account', {
    accent: ROLE.read,
    size: 50,
  });

  const stageAura = aura(180, 30, 640, '#5ce1e61e', '#ffd16614');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = pulse.value;
      const rh = reqHi.value;
      const dh = dirtyHi.value;
      const dc = dbClean.value;
      const mc = memClean.value;
      const fl = frozenLock.value;
      const nodes = [];

      // Left rail: Frozen Episode Specification
      const reqCol = fl > 0.4 ? ROLE.pass : rh > 0.3 ? ROLE.read : ROLE.host;
      nodes.push(
        railBar(-840, -180, 260, reqCol, { width: 5, glow: 8 + fl * 4 }),
        txt(
          fl > 0.4 ? 'FROZEN EPISODE SPEC' : 'TEST EPISODE TASK',
          -810,
          -160,
          26,
          reqCol,
          'mono',
          'left',
        ),
        txt(`Reader: ${river.reader}`, -810, -96, 36, COSMOS.ink, 'serif', 'left'),
        txt(`Target: 1 hold on ${river.book}`, -810, -36, 30, ROLE.read, 'mono', 'left').glow(
          rh * 7,
          ROLE.read,
        ),
        line([-810, 6], [-370, 6], { stroke: '#29385f', width: 2 }),
        txt(
          'Permitted tools pinned',
          -810,
          56,
          26,
          fl > 0.4 ? ROLE.pass : COSMOS.muted,
          'mono',
          'left',
        ),
        txt(
          'Step & spend budget pinned',
          -810,
          112,
          26,
          fl > 0.4 ? ROLE.pass : COSMOS.muted,
          'mono',
          'left',
        ),
        txt(
          'Independent checks pinned',
          -810,
          168,
          26,
          fl > 0.4 ? ROLE.pass : COSMOS.muted,
          'mono',
          'left',
        ),
        txt(
          fl > 0.4 ? 'LOCKED FOR EVERY REPEAT' : 'Must freeze before repeats',
          -810,
          232,
          26,
          fl > 0.4 ? ROLE.pass : COSMOS.dim,
          'mono',
          'left',
        ),
      );

      // Center column: Agent Memory & Approval state (resets independently of DB)
      const memCol = mc > 0.45 ? ROLE.pass : dh > 0.3 ? ROLE.retry : ROLE.warn;
      const memNode = autoNode(-10, -48, mc > 0.45 ? 'CLEAR' : 'CACHE', {
        radius: 64,
        color: memCol,
        glow: 10,
        size: 26,
      });
      const appNode = autoNode(-10, 152, mc > 0.45 ? 'VOID' : 'PERMIT', {
        radius: 64,
        color: mc > 0.45 ? ROLE.pass : ROLE.fail,
        glow: 9,
        size: 26,
      });
      const [m0, m1] = trimSeg([-10, -48], [-10, 152], memNode.r, appNode.r);
      nodes.push(
        txt('AGENT RUNTIME STATE', -10, -172, 26, memCol, 'mono', 'center'),
        memNode.node,
        appNode.node,
        segmentWithPhoton(m0, m1, memCol, p, { width: 3, glow: 7, photon: mc < 0.5 }),
        txt(
          mc > 0.45 ? 'Cache cleared · approval void' : 'Remembers old B8 lookup',
          -10,
          278,
          26,
          mc > 0.45 ? ROLE.pass : ROLE.warn,
          'mono',
          'center',
        ),
      );

      // Horizontal optical connectors from center to left spec and right backend
      const [cl0, cl1] = trimSeg([-340, -48], [-10, -48], 0, memNode.r);
      const [cr0, cr1] = trimSeg([-10, -48], [280, -48], memNode.r, 0);
      nodes.push(
        segmentWithPhoton(cl0, cl1, reqCol, p + 0.2, { width: 2.8, glow: 6 }),
        segmentWithPhoton(cr0, cr1, dc > 0.45 ? ROLE.read : ROLE.warn, p + 0.5, {
          width: 3,
          glow: 7,
        }),
      );

      // Right rail: Library Backend Snapshot (v12 dirty -> v2 clean)
      const dbCol = fl > 0.4 ? ROLE.pass : dc > 0.45 ? ROLE.read : ROLE.warn;
      nodes.push(
        railBar(295, -180, 260, dbCol, { width: 5, glow: 9 }),
        txt('REMOTE LIBRARY BACKEND', 325, -160, 26, dbCol, 'mono', 'left'),
        txt(river.reader, 325, -96, 44, COSMOS.ink, 'serif', 'left'),
        txt(
          dc > 0.45 ? `version ${river.start}` : 'version 12',
          855,
          -96,
          30,
          dbCol,
          'mono',
          'right',
        ).glow(8, dbCol),
        line([325, -42], [855, -42], { stroke: '#29385f', width: 2 }),
      );

      if (dc < 0.45) {
        const oldA = Math.max(0, 1 - dc * 2.2);
        nodes.push(
          txt('HOLD ID', 325, 6, 26, COSMOS.dim, 'mono', 'left').opacity(oldA),
          txt('BOOK', 855, 6, 26, COSMOS.dim, 'mono', 'right').opacity(oldA),
          txt('old-4 (inherited!)', 325, 76, 30, ROLE.warn, 'mono', 'left')
            .glow(dh * 10, ROLE.warn)
            .opacity(oldA),
          txt('B8', 855, 76, 34, ROLE.warn, 'mono', 'right')
            .glow(dh * 10, ROLE.warn)
            .opacity(oldA),
          line([325, 122], [855, 122], { stroke: '#4c3f24', width: 2 }).opacity(oldA),
          txt(
            'Agent restart leaves this row intact',
            325,
            188,
            26,
            ROLE.retry,
            'sans',
            'left',
          ).opacity(oldA),
        );
      } else {
        const cleanA = Math.min(1, (dc - 0.45) * 2.2);
        nodes.push(
          txt('HOLD ID', 325, 6, 26, COSMOS.dim, 'mono', 'left').opacity(cleanA),
          txt('BOOK', 855, 6, 26, COSMOS.dim, 'mono', 'right').opacity(cleanA),
          txt('(empty account)', 325, 76, 30, ROLE.pass, 'mono', 'left')
            .glow(8, ROLE.pass)
            .opacity(cleanA),
          txt('0 holds', 855, 76, 30, ROLE.pass, 'mono', 'right').opacity(cleanA),
          line([325, 122], [855, 122], { stroke: '#214c45', width: 2 }).opacity(cleanA),
          txt(
            'Snapshot restored: clean start at v2',
            325,
            188,
            26,
            ROLE.read,
            'mono',
            'left',
          ).opacity(cleanA),
        );
      }

      // Dynamic bottom status rule (updates cleanly with state, never contradicts!)
      const footerText =
        fl > 0.4
          ? 'CLEAN START READY: BACKEND v2 + CLEARED MEMORY + FROZEN TASK'
          : dc > 0.45 && mc > 0.45
            ? 'Both backend snapshot and agent memory restored'
            : dc > 0.45
              ? 'Backend v2 clean'
              : 'Inherited B8 row + cached approval contaminate the next trial';
      nodes.push(
        txt(
          footerText,
          0,
          395,
          28,
          fl > 0.4 ? ROLE.pass : dc > 0.45 ? ROLE.read : ROLE.warn,
          'mono',
          'center',
        ),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  driftValue(s, c, pulse, 4.0, { startOffset: 0.1, endMargin: 0.5 });

  c.on('identify-resource', () => {
    s.play(reqHi.to(1, { duration: clampDur(c, c.cue('identify-resource').start, 0.35) }));
  });
  c.on('inherited-hold', () => {
    s.play(dirtyHi.to(1, { duration: clampDur(c, c.cue('inherited-hold').start, 0.4) }));
  });
  c.on('reset-account', () => {
    s.play(dbClean.to(1, { duration: clampDur(c, c.cue('reset-account').start, 0.5) }));
  });
  c.on('memory-reset', () => {
    s.play(memClean.to(1, { duration: clampDur(c, c.cue('memory-reset').start, 0.45) }));
  });
  c.on('clean-snapshot', () => {
    s.play(frozenLock.to(1, { duration: clampDur(c, c.cue('clean-snapshot').start, 0.4) }));
  });
}
