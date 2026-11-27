// Scene 07: supersession-and-revocation
// SQLite source-and-projection verifier: version join, exclusive expiry, tombstone, grant revoke.
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  fadeOutHalf,
  glowMeter,
  guardedDynamic,
  memNode,
  quadArcPts,
  sourceProjectionState,
  trimSeg,
  txt,
} from '../parts.mjs';

export default function supersessionAndRevocation(s, c) {
  const phase = s.value(0);
  const v2Source = s.value(0);
  const showEmpty = s.value(0);
  const v2Index = s.value(0);
  const showRefreshed = s.value(0);
  const clockMode = s.value(0);
  const atExpiry = s.value(0);
  const showExpired = s.value(0);
  const showPacket = s.value(0);
  const tombMode = s.value(0);
  const lateRefused = s.value(0);
  const grantV4 = s.value(0);
  const grantRevoked = s.value(0);
  const showDenied = s.value(0);

  const stStale = sourceProjectionState({
    sourceVersion: 2,
    projectionVersion: 1,
    grant: true,
    tombstone: false,
    queuedRefresh: true,
  });
  const stFresh = sourceProjectionState({
    sourceVersion: 2,
    projectionVersion: 2,
    grant: true,
    tombstone: false,
    queuedRefresh: false,
  });
  const stTomb = sourceProjectionState({
    sourceVersion: 2,
    projectionVersion: 2,
    grant: true,
    tombstone: true,
    queuedRefresh: true,
  });
  const stRevoked = sourceProjectionState({
    sourceVersion: 4,
    projectionVersion: 4,
    grant: false,
    tombstone: false,
    queuedRefresh: true,
  });

  const header = cinemaHeader('SQLITE VERIFIER', 'Source Truth vs', 'Index Projection', {
    x: -860,
    y: -445,
    accent: ROLE.profile,
    size: 46,
  });

  const bgAuras = aura(40, 20, 660, '#6ee7b71a', '#5ce1e618');

  const rig = guardedDynamic(
    () => 1,
    () => {
      const p = 0;
      const sv2 = v2Source.value;
      const emp = showEmpty.value;
      const iv2 = v2Index.value;
      const ref = showRefreshed.value;
      const clk = clockMode.value;
      const exp = atExpiry.value;
      const expRead = showExpired.value;
      const pkt = showPacket.value;
      const tomb = tombMode.value;
      const late = lateRefused.value;
      const gv4 = grantV4.value;
      const rev = grantRevoked.value;
      const den = showDenied.value;

      const nodes = [];
      const isGrantPhase = gv4 > 0.5;
      const isTombPhase = !isGrantPhase && tomb > 0.5;
      const isPacketPhase = !isGrantPhase && pkt > 0.5;
      const isClockPhase = !isGrantPhase && !isPacketPhase && clk > 0.5;

      const srcX = -530;
      const srcY = 5;
      let srcLabel = 'SRC v1';
      let srcSub = 'old command';
      let srcColor = ROLE.profile;
      if (isGrantPhase) {
        srcLabel = 'SRC v4';
        srcSub = rev > 0.5 ? 'grant: REVOKED' : 'grant: active';
        srcColor = rev > 0.5 ? ROLE.fail : ROLE.profile;
      } else if (isTombPhase) {
        srcLabel = 'DELETED';
        srcSub = 'source tombstone';
        srcColor = ROLE.fail;
      } else if (sv2 > 0.5) {
        srcLabel = 'SRC v2';
        srcSub = 'billing test';
        srcColor = ROLE.profile;
      }

      const idxX = 0;
      const idxY = 5;
      let idxLabel = 'IDX v1';
      let idxSub = 'projection row';
      let idxColor = ROLE.prompt;
      if (isGrantPhase) {
        idxLabel = 'IDX v4';
        idxSub = rev > 0.5 ? 'refresh denied' : 'matches v4';
        idxColor = rev > 0.5 ? ROLE.fail : ROLE.prompt;
      } else if (isTombPhase) {
        idxLabel = 'IDX v2';
        idxSub = late > 0.5 ? 'write refused' : 'sees tombstone';
        idxColor = ROLE.fail;
      } else if (iv2 > 0.5) {
        idxLabel = 'IDX v2';
        idxSub = 'version 2 synced';
        idxColor = ROLE.prompt;
      } else if (sv2 > 0.5) {
        idxLabel = 'IDX v1';
        idxSub = 'lagging behind';
        idxColor = ROLE.pending;
      }

      const outX = 530;
      const outY = 5;
      let outLabel = 'old cmd';
      let outSub = 'v1 == v1';
      let outColor = ROLE.ok;
      let matchOk = true;

      if (isGrantPhase) {
        if (rev > 0.5 || den > 0.5) {
          outLabel = '[] empty';
          outSub = stRevoked.readable ? 'ok' : 'no grant';
          outColor = ROLE.fail;
          matchOk = false;
        } else {
          outLabel = 'v4 cmd';
          outSub = 'restored v4';
          outColor = ROLE.ok;
        }
      } else if (isTombPhase) {
        outLabel = '[] empty';
        outSub = stTomb.refreshAdmitted ? 'ok' : 'deleted';
        outColor = ROLE.fail;
        matchOk = false;
      } else if (isPacketPhase) {
        outLabel = 'billing';
        outSub = 't = 102s ok';
        outColor = ROLE.ok;
      } else if (isClockPhase) {
        if (expRead > 0.5 || exp > 0.5) {
          outLabel = '[] empty';
          outSub = 't = 200s expired';
          outColor = ROLE.fail;
          matchOk = false;
        } else {
          outLabel = 'billing';
          outSub = 't = 199s valid';
          outColor = ROLE.ok;
        }
      } else if (ref > 0.5 || iv2 > 0.5) {
        outLabel = 'billing';
        outSub = stFresh.readable ? 'v2 == v2' : 'blocked';
        outColor = ROLE.ok;
      } else if (emp > 0.5) {
        outLabel = '[] empty';
        outSub = stStale.readable ? 'ok' : 'v2 != v1';
        outColor = ROLE.fail;
        matchOk = false;
      } else if (sv2 > 0.5) {
        outLabel = '?';
        outSub = 'predict read';
        outColor = ROLE.score;
        matchOk = false;
      }

      const srcNode = memNode(srcX, srcY, srcLabel, srcColor, {
        radius: 82,
        sub: srcSub,
        size: 28,
      });
      const idxNode = memNode(idxX, idxY, idxLabel, idxColor, {
        radius: 82,
        sub: idxSub,
        size: 28,
      });
      const outNode = memNode(outX, outY, outLabel, outColor, {
        radius: 82,
        sub: outSub,
        size: 28,
      });

      const [jA, jB] = trimSeg([srcX, srcY], [idxX, idxY], srcNode.r + 18, idxNode.r + 18);
      const joinMismatch =
        (!isGrantPhase && !isTombPhase && sv2 > 0.5 && iv2 < 0.5) ||
        isTombPhase ||
        (isGrantPhase && rev > 0.5);
      if (joinMismatch) {
        nodes.push(
          line(jA, jB, { stroke: ROLE.fail, width: 3.5, dash: [12, 10] }).glow(6, ROLE.fail),
        );
        const midX = (jA[0] + jB[0]) * 0.5;
        nodes.push(
          line([midX - 18, srcY - 22], [midX + 18, srcY + 22], { stroke: ROLE.fail, width: 4.5 }),
          line([midX + 18, srcY - 22], [midX - 18, srcY + 22], { stroke: ROLE.fail, width: 4.5 }),
        );
      } else {
        nodes.push(beamWithPhotons([jA, jB], srcColor, p, { width: 4, photonCount: 2 }));
      }

      const [rA, rB] = trimSeg([idxX, idxY], [outX, outY], idxNode.r + 18, outNode.r + 18);
      if (matchOk) {
        nodes.push(beamWithPhotons([rA, rB], outColor, p + 0.35, { width: 4, photonCount: 2 }));
      } else {
        nodes.push(
          line(rA, rB, { stroke: outColor, width: 3.5, dash: [12, 10] }).glow(6, outColor),
        );
      }

      nodes.push(srcNode.node, idxNode.node, outNode.node);

      // Top-right rule readout
      const ruleX = 500;
      nodes.push(
        txt('JOIN INVARIANT', ruleX, -430, 26, ROLE.score, 'mono', 'center'),
        txt('source_id = idx.source_id', ruleX, -384, 26, COSMOS.ink, 'mono', 'center'),
        txt('version = current  &  grant = 1', ruleX, -340, 26, COSMOS.muted, 'mono', 'center'),
      );

      // Bottom stage (clean typographic cinema, no heavy boxes)
      const botY = 278;
      if (isClockPhase) {
        const tVal = exp > 0.5 ? 200 : 199;
        const frac = exp > 0.5 ? 1.0 : 0.96;
        const col = exp > 0.5 ? ROLE.fail : ROLE.ok;
        nodes.push(
          txt(
            'EXCLUSIVE EXPIRY DEADLINE: t < 200 s',
            0,
            botY - 56,
            28,
            ROLE.score,
            'mono',
            'center',
          ),
          glowMeter(-420, botY, 840, 28, frac, { fill: col, glow: 10 }),
          txt(`CLOCK: t = ${tVal} s`, -250, botY + 58, 28, col, 'mono', 'center'),
          txt(
            exp > 0.5 ? '200 < 200 is FALSE -> []' : '199 < 200 is TRUE -> billing',
            240,
            botY + 58,
            28,
            col,
            'mono',
            'center',
          ),
        );
      } else if (isPacketPhase && !isGrantPhase) {
        const pktColor = tomb > 0.5 ? ROLE.pending : ROLE.prompt;
        const arcPts = quadArcPts([outX, outY + outNode.r + 58], [320, botY - 54], 30, 24);
        nodes.push(
          beamWithPhotons(arcPts, pktColor, p, { width: 3.2, photonCount: 1, alpha: 0.85 }),
          line([-420, botY - 58], [420, botY - 58], { stroke: pktColor, width: 2.5 }).opacity(0.65),
          txt('SAVED PROMPT PACKET (t = 102 s)', 0, botY - 18, 26, pktColor, 'mono', 'center'),
          txt(
            'still holds: pnpm test --run billing',
            0,
            botY + 32,
            28,
            COSMOS.ink,
            'mono',
            'center',
          ),
          txt(
            tomb > 0.5
              ? 'propagate delete to caches, summaries & indexes'
              : 'copied before deletion',
            0,
            botY + 86,
            26,
            tomb > 0.5 ? ROLE.fail : COSMOS.muted,
            'mono',
            'center',
          ),
        );
      } else if (isGrantPhase) {
        const col = rev > 0.5 ? ROLE.fail : ROLE.ok;
        nodes.push(
          txt('AUTHENTICATED SESSION GRANT CHECK', 0, botY - 54, 28, col, 'mono', 'center'),
          glowMeter(-360, botY, 720, 26, rev > 0.5 ? 0.05 : 1.0, { fill: col, glow: 10 }),
          txt(
            rev > 0.5
              ? 'grant revoked -> read [] & refresh DENIED'
              : 'restored v4 fixture -> grant active',
            0,
            botY + 58,
            28,
            col,
            'mono',
            'center',
          ),
        );
      } else {
        const railAlpha = fadeOutHalf(clk);
        if (railAlpha > 0.02) {
          const msg =
            ref > 0.5
              ? 'index caught up to v2 -> returns billing command'
              : iv2 > 0.5
                ? 'projection synced to v2 -> ready to serve billing'
                : emp > 0.5
                  ? 'stale projection v1 cannot serve old or new value'
                  : sv2 > 0.5
                    ? 'source committed v2 while index still points to v1'
                    : 'reopened SQLite: source v1 & index v1 match';
          const msgCol = ref > 0.5 || iv2 > 0.5 ? ROLE.ok : emp > 0.5 ? ROLE.fail : ROLE.prompt;
          nodes.push(
            txt(
              'PROJECTION CONSISTENCY RAIL',
              0,
              botY - 50,
              26,
              COSMOS.muted,
              'mono',
              'center',
            ).opacity(railAlpha),
            glowMeter(
              -420,
              botY,
              840,
              22,
              ref > 0.5 ? 1.0 : iv2 > 0.5 ? 0.85 : sv2 > 0.5 ? 0.5 : 0.35,
              {
                fill: msgCol,
                opacity: railAlpha,
              },
            ),
            txt(msg, 0, botY + 54, 28, msgCol, 'mono', 'center').opacity(railAlpha),
          );
        }
      }

      return group(...nodes);
    },
  );

  s.add(bgAuras, header, rig);

  c.on('read-reopened', () => {
    s.play(phase.to(0.3, { duration: clampDur(c, c.cue('read-reopened').start, 0.25) }));
  });
  c.on('source-update', () => {
    s.play(v2Source.to(1, { duration: clampDur(c, c.cue('source-update').start, 0.45) }));
  });
  c.after('empty-read', () => {
    s.play(showEmpty.to(1, { duration: clampDur(c, c.cue('empty-read').end, 0.35) }));
  });
  c.after('projection-refresh', () => {
    s.play(v2Index.to(1, { duration: clampDur(c, c.cue('projection-refresh').end, 0.45) }));
  });
  c.after('refreshed-read', () => {
    s.play(showRefreshed.to(1, { duration: clampDur(c, c.cue('refreshed-read').end, 0.35) }));
  });
  c.after('before-expiry', () => {
    s.play(clockMode.to(1, { duration: clampDur(c, c.cue('before-expiry').end, 0.4) }));
  });
  c.after('at-expiry', () => {
    s.play(atExpiry.to(1, { duration: clampDur(c, c.cue('at-expiry').end, 0.35) }));
  });
  c.after('expired-read', () => {
    s.play(showExpired.to(1, { duration: clampDur(c, c.cue('expired-read').end, 0.3) }));
  });
  c.after('keep-packet', () => {
    s.play(showPacket.to(1, { duration: clampDur(c, c.cue('keep-packet').end, 0.45) }));
  });
  c.after('source-tombstone', () => {
    s.play(tombMode.to(1, { duration: clampDur(c, c.cue('source-tombstone').end, 0.4) }));
  });
  c.after('late-refresh', () => {
    s.play(lateRefused.to(1, { duration: clampDur(c, c.cue('late-refresh').end, 0.35) }));
  });
  c.after('grant-reset', () => {
    s.play(grantV4.to(1, { duration: clampDur(c, c.cue('grant-reset').end, 0.45) }));
  });
  c.after('revoke-grant', () => {
    s.play(grantRevoked.to(1, { duration: clampDur(c, c.cue('revoke-grant').end, 0.35) }));
  });
  c.after('denied-read', () => {
    s.play(showDenied.to(1, { duration: clampDur(c, c.cue('denied-read').end, 0.35) }));
  });
}
