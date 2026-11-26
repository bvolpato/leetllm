// Scene 08 (single-writer): "Bind approval to one exact proposal"
// Orbiting 3D single-writer atomic vault + exact field-by-field approval binding
// + optimistic live revision drift (v3 -> v4) + op-18 lost-reply reconciliation (change-1, effects=1)
// + production preconditions vs volatile in-memory lookup.
import {
  COSMOS,
  REQUEST,
  ROLE,
  V3_PACKET,
  buildWriterVault3d,
  cinemaAtmosphere,
  crossSwap,
  freshPacket,
  glowArrow,
  glowDot,
  glowRing,
  guardedDynamic,
  heroTitle,
  line,
  lumBar,
  orbitScene,
  reconciled,
  reconciledEffects,
  recorded,
  recordedEffects,
  rule,
  runAmbientPhase,
  shortHash,
  tweenCue,
  txt,
} from '../parts.mjs';

export default function singleWriter(s, c) {
  const phase = s.value(0);
  const vaultState = s.value(0); // -1 blocked, 0 armed, +1 committed
  const stBind = s.value(1); // Beats 0-1: Exact proposal + v3 -> v4 optimistic check
  const stReplay = s.value(0); // Beat 2: Fresh v4 write + lost reply + op-18 reconciliation
  const stProd = s.value(0); // Beat 3: Production atomic preconditions vs in-memory target

  // Beat 0: Concrete proposal + exact approval
  const mergeLit = s.value(0);
  const propLit = s.value(0);
  const digLit = s.value(0);
  const appMatch = s.value(0);
  const diffDec = s.value(0);

  // Beat 1: Live revision v3 -> v4
  const recheckLit = s.value(0);
  const liveV4 = s.value(0);
  const oldStamp = s.value(0);
  const rebuildLit = s.value(0);

  // Beat 2: Fresh v4 + op-18 replay
  const assumeV4 = s.value(0);
  const supplyV4 = s.value(0);
  const freshApp = s.value(0);
  const firstEff = s.value(0);
  const replyLost = s.value(0);
  const keepKey = s.value(0);
  const reconLit = s.value(0);

  // Beat 3: Production vs in-memory example
  const prodAuth = s.value(0);
  const prodBind = s.value(0);
  const prodExp = s.value(0);
  const prodPol = s.value(0);
  const prodDeps = s.value(0);
  const prodRecExp = s.value(0);
  const prodAtomic = s.value(0);
  const memLookup = s.value(0);
  const keyReuse = s.value(0);
  const exactRep = s.value(0);

  const v3Hash = shortHash(V3_PACKET.evidenceDigest, 10);
  const v4Hash = shortHash(freshPacket.evidenceDigest, 10);
  const bgAtmo = cinemaAtmosphere(ROLE.writer, ROLE.merge);
  const { view: vault3d } = buildWriterVault3d(phase, vaultState, {
    x: 530,
    y: 25,
    theta: -0.7,
    phi: 1.06,
    distance: 14.8,
    unit: 102,
  });

  const title = heroTitle(['Bind Approval to One', 'Exact Proposal'], {
    x: -860,
    y: -440,
    size: 52,
    lineHeight: 60,
    accent: ROLE.writer,
    eyebrow: 'SINGLE-WRITER GATE  /  IDEMPOTENT COMMIT',
  });

  const live = guardedDynamic(s.value(1), () => {
    const m0 = stBind.value;
    const m1 = stReplay.value;
    const m2 = stProd.value;
    const lx = -860;
    const nodes = [];

    // Right 3D vault legend (steady footer, zero crossSwap flash)
    nodes.push(
      txt('3D ATOMIC WRITER VAULT', 530, -420, 26, ROLE.writer, 'mono').glow(6, ROLE.writer),
      txt('Approval  |  Live Rev  |  Idempotency Key', 530, -376, 26, COSMOS.muted, 'sans'),
      txt(
        `Ledger: ${recorded.operation} -> ${reconciled.change} (effects = ${reconciledEffects})`,
        530,
        395,
        26,
        COSMOS.muted,
        'sans',
      ),
    );

    // =========================================================================
    // STAGE 0 (Beats 0-1): Proposal-Approval Match & Live Revision Drift
    // =========================================================================
    if (m0 > 0.02) {
      const v4 = liveV4.value;
      const diff = diffDec.value;

      nodes.push(
        txt(
          'EXACT PROPOSAL PACKET',
          lx,
          -210,
          26,
          propLit.value > 0.3 ? ROLE.eval : COSMOS.muted,
          'mono',
          'left',
        ).opacity(m0),
        rule(lx, -186, -340, -186, ROLE.rule, 2).opacity(m0),
        txt(
          'APPROVAL STAMP',
          -270,
          -210,
          26,
          appMatch.value > 0.3 ? ROLE.mark : COSMOS.muted,
          'mono',
          'left',
        ).opacity(m0),
        rule(-270, -186, 130, -186, ROLE.rule, 2).opacity(m0),
      );

      const fields = [
        ['tenant', REQUEST.tenant, REQUEST.tenant, false],
        ['request', REQUEST.request, REQUEST.request, false],
        ['release', REQUEST.release, REQUEST.release, false],
        ['version', v4 > 0.5 ? 'v4 (LIVE!)' : 'v3', 'v3 (STAMP)', v4 > 0.5],
        [
          'traffic',
          diff > 0.5 && v4 < 0.2 ? '50% (EDIT)' : `${REQUEST.traffic}%`,
          `${REQUEST.traffic}%`,
          diff > 0.5 && v4 < 0.2,
        ],
        ['digest', `${v3Hash}...`, `${v3Hash}...`, false],
      ];
      fields.forEach(([k, leftV, rightV, clash], i) => {
        const y = -132 + i * 58;
        const rowCol = clash
          ? ROLE.reject
          : digLit.value > 0.3 && k === 'digest'
            ? ROLE.mark
            : COSMOS.ink;
        nodes.push(
          txt(`${k}:`, lx, y, 26, COSMOS.muted, 'mono', 'left').opacity(m0),
          txt(leftV, lx + 145, y, 26, rowCol, 'mono', 'left').opacity(m0),
          txt(
            clash ? '!=' : '==',
            -310,
            y,
            26,
            clash ? ROLE.reject : appMatch.value > 0.3 ? ROLE.pass : COSMOS.dim,
            'mono',
          ).opacity(m0),
          txt(rightV, -270, y, 26, clash ? ROLE.reject : ROLE.pass, 'mono', 'left').opacity(m0),
        );
      });

      // Bottom gate banner
      const gy = 250;
      const blocked = v4 > 0.4 || (diff > 0.4 && v4 < 0.2);
      nodes.push(
        lumBar(-365, gy, 990, 68, {
          color: blocked ? ROLE.reject : appMatch.value > 0.3 ? ROLE.pass : ROLE.triage,
          fillOpacity: 0.2,
          strokeWidth: 2.8,
          glow: 10,
          opacity: m0,
        }),
        txt(
          rebuildLit.value > 0.3
            ? 'STOP: rebuild v4 evidence & proposal, obtain fresh review'
            : oldStamp.value > 0.3
              ? 'BLOCKED: live release is v4 while stamp says v3'
              : recheckLit.value > 0.3
                ? 'Writer compares live release revision before every write'
                : diff > 0.4
                  ? 'Changing any field creates a different decision to review'
                  : 'approved=true must match all 6 proposal fields exactly',
          -365,
          gy,
          26,
          blocked ? ROLE.reject : ROLE.pass,
          'mono',
        ).opacity(m0),
      );
    }

    // =========================================================================
    // STAGE 1 (Beat 2): Fresh v4 Write + Lost Reply + op-18 Reconciliation
    // =========================================================================
    if (m1 > 0.02) {
      const fEff = firstEff.value;
      const lost = replyLost.value;
      const recon = reconLit.value;

      nodes.push(
        txt(
          'IDEMPOTENT REPLAY  (ASSUMED v4 FIXTURE)',
          lx,
          -210,
          26,
          assumeV4.value > 0.3 ? ROLE.eval : COSMOS.muted,
          'mono',
          'left',
        ).opacity(m1),
        rule(lx, -186, 130, -186, ROLE.rule, 2).opacity(m1),
      );

      // Writer node on left, Target ledger on right
      const wx = -700;
      const tx = -80;
      nodes.push(
        lumBar(wx, 10, 280, 175, {
          color: freshApp.value > 0.3 ? ROLE.writer : ROLE.eval,
          fillOpacity: 0.18,
          strokeWidth: 2.8,
          glow: 9,
          opacity: m1,
        }),
        txt('WRITER', wx, -30, 28, COSMOS.ink, 'mono').opacity(m1),
        txt(
          `key: ${recorded.operation}`,
          wx,
          14,
          26,
          keepKey.value > 0.3 ? ROLE.mark : ROLE.eval,
          'mono',
        ).opacity(m1),
        txt(
          supplyV4.value > 0.3 ? `v4  ${v4Hash}` : 'v4 packet',
          wx,
          56,
          26,
          COSMOS.muted,
          'mono',
        ).opacity(m1),

        lumBar(tx, 10, 340, 175, {
          color: recon > 0.3 || fEff > 0.3 ? ROLE.pass : ROLE.triage,
          fillOpacity: 0.18,
          strokeWidth: 2.8,
          glow: 10,
          opacity: m1,
        }),
        txt('TARGET LEDGER', tx, -40, 26, ROLE.pass, 'mono').opacity(m1),
        txt(
          fEff > 0.3 ? `${recorded.operation} -> ${recorded.change}` : 'empty ledger',
          tx,
          8,
          26,
          COSMOS.ink,
          'mono',
        ).opacity(m1),
        txt(
          `effects = ${fEff > 0.3 ? recordedEffects : 0}`,
          tx,
          56,
          30,
          fEff > 0.3 ? ROLE.mark : COSMOS.muted,
          'mono',
        )
          .glow(fEff > 0.3 ? 8 : 0, ROLE.mark)
          .opacity(m1),
      );

      // Call 1 arrow (top)
      nodes.push(
        glowArrow([wx + 150, -68], [tx - 180, -68], ROLE.pass, { width: 3.4, opacity: m1 }),
        txt('1. apply(op-18, v4)', -405, -104, 26, ROLE.pass, 'mono').opacity(m1),
      );

      // Lost reply dashed line (middle, label sits cleanly below line)
      if (lost > 0.02) {
        nodes.push(
          line([tx - 180, -2], [wx + 165, -2], {
            stroke: ROLE.reject,
            width: 3.2,
            dash: [8, 6],
          }).opacity(m1 * lost),
          txt('X reply lost', -405, 32, 26, ROLE.reject, 'mono').opacity(m1 * lost),
        );
      }

      // Replay arrow (bottom) + reconciled result
      if (keepKey.value > 0.02 || recon > 0.02) {
        nodes.push(
          glowArrow([wx + 150, 82], [tx - 180, 82], ROLE.mark, { width: 3.4, opacity: m1 }),
          txt('2. lookup(op-18)', -405, 118, 26, ROLE.mark, 'mono').opacity(m1),
        );
      }

      nodes.push(
        rule(lx, 175, 130, 175, ROLE.rule, 2).opacity(m1),
        txt(
          recon > 0.3
            ? `RECONCILED: returns ${reconciled.change}  |  effects stays ${reconciledEffects} (in-memory demo)`
            : 'Target keeps entry in memory; production needs durable storage',
          lx,
          230,
          26,
          recon > 0.3 ? ROLE.pass : COSMOS.muted,
          'mono',
          'left',
        ).opacity(m1),
      );
    }

    // =========================================================================
    // STAGE 2 (Beat 3): Production Preconditions vs In-Memory Target Lookup
    // =========================================================================
    if (m2 > 0.02) {
      nodes.push(
        txt('PRODUCTION WRITER CONTRACT', lx, -210, 26, ROLE.pass, 'mono', 'left').opacity(m2),
        rule(lx, -186, 130, -186, ROLE.rule, 2).opacity(m2),
      );

      const prodRows = [
        [
          '1. Auth',
          'Authenticate reviewer + writer; bind packet, policy rev & expiry',
          Math.max(prodAuth.value, prodBind.value, prodExp.value),
        ],
        [
          '2. Recheck',
          'Recheck permissions, policy, expiry & live deps before new write',
          Math.max(prodPol.value, prodDeps.value, prodRecExp.value),
        ],
        [
          '3. Atomic',
          'Target atomic preconditions + durable op record + read auth',
          prodAtomic.value,
        ],
      ];
      prodRows.forEach(([tag, desc, v], i) => {
        const y = -130 + i * 74;
        const hot = v > 0.35;
        nodes.push(
          glowDot(lx + 14, y, {
            radius: 7,
            color: hot ? ROLE.pass : COSMOS.dim,
            glow: hot ? 10 : 0,
            opacity: m2,
          }),
          txt(tag, lx + 38, y, 26, hot ? ROLE.pass : COSMOS.muted, 'mono', 'left').opacity(m2),
          txt(desc, lx + 215, y, 26, hot ? COSMOS.ink : COSMOS.muted, 'sans', 'left').opacity(m2),
        );
      });

      // Lower section: In-memory lookup ordering
      const by = 115;
      nodes.push(
        txt(
          'IN-MEMORY EXAMPLE LOOKUP ORDER',
          lx,
          by,
          26,
          memLookup.value > 0.3 ? ROLE.mark : COSMOS.muted,
          'mono',
          'left',
        ).opacity(m2),
        rule(lx, by + 24, 130, by + 24, ROLE.rule, 2).opacity(m2),
        txt(
          'Lookup op-18 & compare fingerprint BEFORE new-write checks',
          lx,
          by + 68,
          26,
          memLookup.value > 0.3 ? COSMOS.ink : COSMOS.muted,
          'sans',
          'left',
        ).opacity(m2),
        lumBar(-370, by + 132, 980, 56, {
          color: keyReuse.value > 0.3 ? ROLE.reject : COSMOS.rule,
          fillOpacity: 0.18,
          opacity: m2,
        }),
        txt(
          'Same op-18 key + different packet -> REJECT',
          -370,
          by + 132,
          26,
          keyReuse.value > 0.3 ? ROLE.reject : COSMOS.muted,
          'mono',
        ).opacity(m2),
        lumBar(-370, by + 206, 980, 56, {
          color: exactRep.value > 0.3 ? ROLE.pass : COSMOS.rule,
          fillOpacity: 0.18,
          opacity: m2,
        }),
        txt(
          'Exact replay in memory -> return change-1',
          -370,
          by + 206,
          26,
          exactRep.value > 0.3 ? ROLE.pass : COSMOS.muted,
          'mono',
        ).opacity(m2),
      );
    }

    return nodes;
  });

  s.add(bgAtmo, vault3d, title, live);
  runAmbientPhase(s, c, phase, 2.4);
  orbitScene(s, c, vault3d, { theta: 0.32, phi: 0.98 });

  // Beat 0
  tweenCue(s, c, 'merge-creates', mergeLit, 1, { duration: 0.3 });
  tweenCue(s, c, 'concrete-proposal', propLit, 1, { duration: 0.3 });
  tweenCue(s, c, 'evidence-digest', digLit, 1, { duration: 0.3, after: true });
  tweenCue(s, c, 'exact-approval', appMatch, 1, { duration: 0.35, after: true });
  c.after('different-decision', () => {
    s.play(diffDec.to(1, { duration: 0.3 }), vaultState.to(-1, { duration: 0.3 }));
  });

  // Beat 1
  tweenCue(s, c, 'writer-rechecks', recheckLit, 1, { duration: 0.3 });
  c.on('live-revision-change', () => {
    s.play(liveV4.to(1, { duration: 0.35 }), vaultState.to(-1, { duration: 0.35 }));
  });
  tweenCue(s, c, 'old-packet', oldStamp, 1, { duration: 0.3, after: true });
  tweenCue(s, c, 'rebuild', rebuildLit, 1, { duration: 0.35 });

  // Beat 2
  crossSwap(s, c, 'assumed-v4', stBind, stReplay, { duration: 0.42 });
  tweenCue(s, c, 'assumed-v4', assumeV4, 1, { duration: 0.3 });
  tweenCue(s, c, 'supplied-v4', supplyV4, 1, { duration: 0.3, after: true });
  tweenCue(s, c, 'fresh-approval', freshApp, 1, { duration: 0.3, after: true });
  c.after('first-effect', () => {
    s.play(firstEff.to(1, { duration: 0.35 }), vaultState.to(1, { duration: 0.35 }));
  });
  tweenCue(s, c, 'write-reply-lost', replyLost, 1, { duration: 0.3 });
  tweenCue(s, c, 'preserve-identity', keepKey, 1, { duration: 0.3 });
  tweenCue(s, c, 'reconcile-operation', reconLit, 1, { duration: 0.35, after: true });

  // Beat 3
  crossSwap(s, c, 'single-writer-construct-3', stReplay, stProd, { duration: 0.42 });
  tweenCue(s, c, 'single-writer-construct-3', prodAuth, 1, { duration: 0.3 });
  tweenCue(s, c, 'policy-and-expiry', prodBind, 1, { duration: 0.3 });
  tweenCue(s, c, 'bind-expiry', prodExp, 1, { duration: 0.3 });
  tweenCue(s, c, 'recheck-policy', prodPol, 1, { duration: 0.3, after: true });
  tweenCue(s, c, 'recheck-deps', prodDeps, 1, { duration: 0.3 });
  tweenCue(s, c, 'recheck-expiry', prodRecExp, 1, { duration: 0.3, after: true });
  tweenCue(s, c, 'atomic', prodAtomic, 1, { duration: 0.35, after: true });
  tweenCue(s, c, 'volatile', memLookup, 1, { duration: 0.3 });
  tweenCue(s, c, 'key-reuse', keyReuse, 1, { duration: 0.35 });
  tweenCue(s, c, 'exact-replay', exactRep, 1, { duration: 0.35 });
}
