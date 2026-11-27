// Scene 11: return-session
// Finale: Profile v3 (invoices) vs stale Search v2 (billing), parallel deadline race,
// and final synthesis of Receipt + Profile + Pending Merge M17.
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  guardedDynamic,
  memNode,
  trimSeg,
  txt,
} from '../parts.mjs';

export default function returnSession(s, c) {
  const phase = s.value(0);
  const srcV3 = s.value(0);
  const choiceQ = s.value(0);
  const skipStale = s.value(0);
  const pinInv = s.value(0);
  const bgRefresh = s.value(0);
  const finalCk = s.value(0);

  const header = cinemaHeader('RETURN SESSION', 'Which Test Belongs', 'In Ada’s Reply?', {
    x: -860,
    y: -445,
    accent: ROLE.ok,
    size: 46,
  });

  const bgAuras = aura(100, 40, 680, '#6ee7b71a', '#5ce1e618');

  const visual = guardedDynamic(
    () => 1,
    () => {
      const p = 0;
      const stale = skipStale.value;
      const pin = pinInv.value;
      const bg = bgRefresh.value;
      const fin = finalCk.value;

      const nodes = [];

      const profPos = [-520, -100];
      const profNode = memNode(profPos[0], profPos[1], 'PROFILE v3', ROLE.ok, {
        radius: 82,
        sub: 'invoices test (live)',
        size: 26,
      });

      const srchPos = [-520, 190];
      const srchCol = stale > 0.5 ? ROLE.fail : ROLE.pending;
      const srchNode = memNode(srchPos[0], srchPos[1], 'SEARCH v2', srchCol, {
        radius: 82,
        sub: stale > 0.5 ? 'stale copy skipped' : 'billing test (old)',
        size: 26,
      });

      // Right: Ada's Next Prompt Assembly Packet (floating vertical light rail, zero box chrome)
      const pktLeftX = 95;
      const pktY = 30;
      const pktCol = pin > 0.5 ? ROLE.ok : ROLE.prompt;

      nodes.push(
        line([pktLeftX, pktY - 175], [pktLeftX, pktY + 195], { stroke: pktCol, width: 4 }).glow(
          10,
          pktCol,
        ),
        txt('ADA’S NEXT PROMPT PACKET', pktLeftX + 34, pktY - 148, 26, pktCol, 'mono', 'left'),
        txt('message:  "Continue."', pktLeftX + 34, pktY - 84, 26, COSMOS.ink, 'mono', 'left'),
        txt(
          'receipt:  duplicate invoice replay',
          pktLeftX + 34,
          pktY - 26,
          26,
          ROLE.archive,
          'mono',
          'left',
        ),
      );

      // STRICT PREDICTION WITHHOLDING: empty verifier line until fresh-stale-answer / fresh-profile-pin!
      if (pin > 0.5) {
        nodes.push(
          txt(
            'verifier: invoices test (v3)',
            pktLeftX + 34,
            pktY + 34,
            28,
            ROLE.ok,
            'mono',
            'left',
          ).glow(6, ROLE.ok),
        );
      } else if (stale > 0.5) {
        nodes.push(
          txt(
            'verifier: reading profile v3...',
            pktLeftX + 34,
            pktY + 34,
            26,
            ROLE.ok,
            'mono',
            'left',
          ),
        );
      } else {
        nodes.push(
          txt('verifier: [  ?  ]', pktLeftX + 34, pktY + 34, 28, ROLE.score, 'mono', 'left'),
        );
      }

      nodes.push(
        txt(
          fin > 0.5 ? 'merge:    M17 pending -> check dest' : 'merge:    key M17 pending',
          pktLeftX + 34,
          pktY + 94,
          26,
          ROLE.pending,
          'mono',
          'left',
        ),
        txt(
          bg > 0.5 ? 'history:  async search deadline' : 'profile:  direct scoped read',
          pktLeftX + 34,
          pktY + 150,
          26,
          bg > 0.5 ? ROLE.prompt : COSMOS.muted,
          'mono',
          'left',
        ),
      );

      // Routing beams from Profile v3 and Search v2 to Prompt Packet
      const [pA, pB] = trimSeg(profPos, [pktLeftX - 18, pktY - 40], profNode.r + 18, 10);
      if (stale > 0.5 || pin > 0.5) {
        nodes.push(beamWithPhotons([pA, pB], ROLE.ok, p, { width: 4.2, photonCount: 2 }));
      } else {
        nodes.push(line(pA, pB, { stroke: ROLE.ok, width: 3, dash: [10, 10] }).opacity(0.75));
      }

      const [sA, sB] = trimSeg(srchPos, [pktLeftX - 18, pktY + 120], srchNode.r + 18, 10);
      if (bg > 0.5) {
        const wallX = -115;
        const midY = (sA[1] + sB[1]) * 0.5;
        nodes.push(
          line(sA, [wallX - 14, midY], { stroke: ROLE.prompt, width: 3, dash: [10, 8] }),
          line([wallX, midY - 46], [wallX, midY + 46], { stroke: ROLE.score, width: 4 }).glow(
            8,
            ROLE.score,
          ),
          txt('DEADLINE', wallX, midY - 72, 26, ROLE.score, 'mono', 'center'),
        );
      } else if (stale > 0.5) {
        nodes.push(line(sA, sB, { stroke: ROLE.fail, width: 3, dash: [12, 10] }).opacity(0.65));
        const mx = (sA[0] + sB[0]) * 0.5;
        const my = (sA[1] + sB[1]) * 0.5;
        nodes.push(
          line([mx - 18, my - 18], [mx + 18, my + 18], { stroke: ROLE.fail, width: 4.5 }),
          line([mx + 18, my - 18], [mx - 18, my + 18], { stroke: ROLE.fail, width: 4.5 }),
        );
      } else {
        nodes.push(line(sA, sB, { stroke: ROLE.pending, width: 3, dash: [10, 10] }).opacity(0.75));
      }

      nodes.push(profNode.node, srchNode.node);

      nodes.push(
        txt(
          bg > 0.5 ? 'TRACK ON RETURN VISITS' : 'TWO CANDIDATES COMPETE',
          430,
          -425,
          26,
          ROLE.score,
          'mono',
          'center',
        ),
        txt(
          bg > 0.5
            ? 'missed receipts · stale hits · tokens · TTFT'
            : 'direct profile v3 vs stale search v2',
          430,
          -378,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ),
      );

      nodes.push(
        txt(
          fin > 0.5
            ? 'Receipt -> what happened  |  Profile -> which test  |  M17 -> destination truth'
            : 'Commit direct preferences before the turn; let indexes catch up async',
          0,
          398,
          26,
          fin > 0.5 ? ROLE.ok : COSMOS.muted,
          'mono',
          'center',
        ),
      );

      return group(...nodes);
    },
  );

  s.add(bgAuras, header, visual);

  c.on('fresh-source-three', () => {
    s.play(srcV3.to(1, { duration: clampDur(c, c.cue('fresh-source-three').start, 0.35) }));
  });
  c.on('fresh-choice', () => {
    s.play(choiceQ.to(1, { duration: clampDur(c, c.cue('fresh-choice').start, 0.35) }));
  });
  c.after('fresh-stale-answer', () => {
    s.play(skipStale.to(1, { duration: clampDur(c, c.cue('fresh-stale-answer').end, 0.45) }));
  });
  c.after('fresh-profile-pin', () => {
    s.play(pinInv.to(1, { duration: clampDur(c, c.cue('fresh-profile-pin').end, 0.45) }));
  });
  c.after('background-refresh', () => {
    s.play(bgRefresh.to(1, { duration: clampDur(c, c.cue('background-refresh').end, 0.45) }));
  });
  c.after('final-checkpoint', () => {
    s.play(finalCk.to(1, { duration: clampDur(c, c.cue('final-checkpoint').end, 0.45) }));
  });
}
