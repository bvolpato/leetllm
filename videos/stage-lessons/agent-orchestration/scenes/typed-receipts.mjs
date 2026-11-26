// Scene 04 (typed-receipts): "Give each worker a narrow update contract"
// Three pure-cinema stages (cleanly cross-swapped):
//   Stage 0: Narrow worker output wrapper (graph state -> read-only view -> eval receipt only)
//   Stage 1: Type != trust (tenant7 -> tenant9, "passed" digest clash, registry gap vs authenticated source)
//   Stage 2: Concurrent reducers (list-add duplicates & order vs scalar write clash -> sorted unique owners)
import {
  COSMOS,
  RECEIPTS,
  REQUEST,
  ROLE,
  cinemaAtmosphere,
  conduitPts,
  crossSwap,
  glowArrow,
  glowDot,
  glowRing,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  line,
  lumBar,
  rule,
  runAmbientPhase,
  samplePolyline,
  shortHash,
  tweenCue,
  txt,
} from '../parts.mjs';

export default function typedReceipts(s, c) {
  const phase = s.value(0);
  const stage0 = s.value(1);
  const stage1 = s.value(0);
  const stage2 = s.value(0);

  // Beat 0: Narrow update wrapper
  const stateLit = s.value(0);
  const viewLit = s.value(0);
  const idLit = s.value(0);
  const ownedLit = s.value(0);
  const evalEvLit = s.value(0);
  const blockApp = s.value(0);
  const blockTraf = s.value(0);

  // Beat 1: Schema vs provenance
  const typeLit = s.value(0);
  const tenantWrong = s.value(0);
  const sourceCheck = s.value(0);
  const textClaim = s.value(0);
  const digestBreak = s.value(0);
  const filmScopeLit = s.value(0);
  const regLit = s.value(0);
  const missingTenant = s.value(0);
  const authSource = s.value(0);

  // Beat 2: Concurrent reducers
  const concLit = s.value(0);
  const dupLit = s.value(0);
  const orderLit = s.value(0);
  const scalarClash = s.value(0);
  const chooseLit = s.value(0);
  const uniqueLit = s.value(0);

  const evalDigest = shortHash(RECEIPTS[0].digest, 10);
  const bgAtmo = cinemaAtmosphere(ROLE.eval, ROLE.reject);
  const title = heroTitle(['Narrow Update', 'Contracts'], {
    x: -860,
    y: -440,
    size: 54,
    lineHeight: 62,
    accent: ROLE.eval,
    eyebrow: 'TYPED RECEIPTS  /  PROVENANCE & REDUCERS',
  });

  const live = guardedDynamic(s.value(1), () => {
    const ph = phase.value;
    const m0 = stage0.value;
    const m1 = stage1.value;
    const m2 = stage2.value;
    const nodes = [];

    // =========================================================================
    // STAGE 0: Graph State -> Copied Read-Only View -> Eval Node -> Narrow Output
    // =========================================================================
    if (m0 > 0.02) {
      // Left: Graph state column
      const sx = -860;
      const sy = -195;
      nodes.push(
        txt(
          'GRAPH STATE (INPUT)',
          sx,
          sy,
          26,
          stateLit.value > 0.3 ? ROLE.triage : COSMOS.muted,
          'mono',
          'left',
        ).opacity(m0),
        rule(sx, sy + 24, -460, sy + 24, ROLE.triage, 2).opacity(m0),
        txt(
          `request:  ${REQUEST.request}`,
          sx,
          sy + 68,
          26,
          idLit.value > 0.3 ? ROLE.mark : COSMOS.ink,
          'mono',
          'left',
        ).opacity(m0),
        txt(
          `tenant:   ${REQUEST.tenant}`,
          sx,
          sy + 114,
          26,
          idLit.value > 0.3 ? ROLE.mark : COSMOS.ink,
          'mono',
          'left',
        ).opacity(m0),
        txt(
          `release:  ${REQUEST.release}  v${REQUEST.version}`,
          sx,
          sy + 160,
          26,
          idLit.value > 0.3 ? ROLE.mark : COSMOS.ink,
          'mono',
          'left',
        ).opacity(m0),
        txt(
          `traffic:  ${REQUEST.traffic}%`,
          sx,
          sy + 206,
          26,
          COSMOS.muted,
          'mono',
          'left',
        ).opacity(m0),
        txt('approved: false', sx, sy + 252, 26, COSMOS.muted, 'mono', 'left').opacity(m0),
      );

      // Middle: Read-only view & Eval worker ring
      const midX = -120;
      const midY = -30;
      const pIn = conduitPts([-440, -60], [midX - 130, midY]);
      nodes.push(
        glowingTrail(pIn, {
          color: viewLit.value > 0.3 ? ROLE.eval : COSMOS.dim,
          width: 3.4,
          opacity: m0,
          core: false,
        }),
        glowDot(...samplePolyline(pIn, (ph * 0.35) % 1), {
          radius: 6,
          color: ROLE.eval,
          opacity: m0,
        }),
        lumBar(midX, midY, 240, 120, {
          color: evalEvLit.value > 0.3 ? ROLE.eval : ROLE.triage,
          fillOpacity: 0.18,
          strokeWidth: 2.8,
          glow: 11,
          opacity: m0,
        }),
        txt('EVAL NODE', midX, midY - 18, 28, COSMOS.ink, 'mono').opacity(m0),
        txt(
          viewLit.value > 0.3 ? 'read-only view' : 'branch worker',
          midX,
          midY + 22,
          26,
          ROLE.eval,
          'sans',
        ).opacity(m0),
      );

      // Right: Three output channels (1 allowed: eval receipt; 2 blocked: approval & traffic)
      const rx = 310;
      const chans = [
        {
          y: -170,
          label: 'receipts: [eval]',
          sub: '2/100 failures',
          col: ROLE.pass,
          allowed: true,
          hot: Math.max(ownedLit.value, evalEvLit.value),
        },
        {
          y: -15,
          label: 'approved = true',
          sub: 'BLOCKED BY WRAPPER',
          col: ROLE.reject,
          allowed: false,
          hot: blockApp.value,
        },
        {
          y: 140,
          label: 'traffic = 50%',
          sub: 'BLOCKED BY WRAPPER',
          col: ROLE.reject,
          allowed: false,
          hot: blockTraf.value,
        },
      ];
      chans.forEach((ch, idx) => {
        const pts = conduitPts([midX + 125, midY], [rx - 20, ch.y]);
        const cCol = ch.allowed
          ? ch.hot > 0.3
            ? ROLE.pass
            : ROLE.eval
          : ch.hot > 0.3
            ? ROLE.reject
            : COSMOS.rule;
        nodes.push(
          glowingTrail(pts, {
            color: cCol,
            width: ch.hot > 0.3 ? 3.8 : 2.2,
            opacity: m0 * (ch.allowed || ch.hot > 0.2 ? 0.92 : 0.45),
            core: false,
          }),
        );
        if (ch.allowed) {
          nodes.push(
            glowDot(...samplePolyline(pts, (ph * 0.35 + 0.3) % 1), {
              radius: 6.5,
              color: ROLE.pass,
              opacity: m0,
            }),
          );
        } else if (ch.hot > 0.3) {
          const [bx, by] = samplePolyline(pts, 0.55);
          nodes.push(
            line([bx - 14, by - 14], [bx + 14, by + 14], { stroke: ROLE.reject, width: 4.5 })
              .glow(8, ROLE.reject)
              .opacity(m0 * ch.hot),
            line([bx + 14, by - 14], [bx - 14, by + 14], { stroke: ROLE.reject, width: 4.5 })
              .glow(8, ROLE.reject)
              .opacity(m0 * ch.hot),
          );
        }
        nodes.push(
          txt(
            ch.label,
            rx,
            ch.y - 12,
            28,
            ch.allowed ? ROLE.pass : ch.hot > 0.3 ? ROLE.reject : COSMOS.muted,
            'mono',
            'left',
          ).opacity(m0),
          txt(ch.sub, rx, ch.y + 24, 26, COSMOS.muted, 'mono', 'left').opacity(
            m0 * Math.max(0.4, ch.hot),
          ),
        );
      });

      nodes.push(
        rule(-860, 315, 860, 315, ROLE.rule, 2).opacity(m0),
        txt(
          'Checked output wrapper restricts each worker to its own branch receipt',
          -860,
          365,
          28,
          ROLE.eval,
          'sans',
          'left',
        ).opacity(m0),
      );
    }

    // =========================================================================
    // STAGE 1: Types Fit != Provenance Trust (tenant9, "passed", registry limit)
    // =========================================================================
    if (m1 > 0.02) {
      const lx = -860;
      const tWrong = tenantWrong.value;
      const claim = textClaim.value;
      const brk = digestBreak.value;

      // Left column: Incoming receipt fields mutating live
      nodes.push(
        txt('RECEIPT PAYLOAD  (SCHEMA VS TRUST)', lx, -210, 26, ROLE.mark, 'mono', 'left').opacity(
          m1,
        ),
        rule(lx, -186, -40, -186, ROLE.rule, 2).opacity(m1),
      );

      // Tenant row
      const tenY = -120;
      const tenStr = tWrong > 0.5 ? 'tenant:  "tenant9"  (str OK)' : 'tenant:  "tenant7"  (str OK)';
      nodes.push(
        lumBar(-450, tenY, 820, 56, {
          color: tWrong > 0.5 ? ROLE.reject : typeLit.value > 0.3 ? ROLE.eval : COSMOS.rule,
          fillOpacity: tWrong > 0.5 ? 0.22 : 0.1,
          strokeWidth: tWrong > 0.5 ? 2.8 : 1.8,
          glow: tWrong > 0.5 ? 11 : 4,
          opacity: m1,
        }),
        txt(
          tenStr,
          lx + 20,
          tenY,
          28,
          tWrong > 0.5 ? ROLE.reject : COSMOS.ink,
          'mono',
          'left',
        ).opacity(m1),
      );

      // Eval value row
      const valY = -30;
      const valStr =
        claim > 0.5 ? 'value:   "passed"  (free text)' : 'value:   { failures: 2, cases: 100 }';
      nodes.push(
        lumBar(-450, valY, 820, 56, {
          color: claim > 0.5 ? ROLE.reject : ROLE.eval,
          fillOpacity: claim > 0.5 ? 0.22 : 0.1,
          strokeWidth: claim > 0.5 ? 2.8 : 1.8,
          glow: claim > 0.5 ? 11 : 4,
          opacity: m1,
        }),
        txt(
          valStr,
          lx + 20,
          valY,
          28,
          claim > 0.5 ? ROLE.reject : COSMOS.ink,
          'mono',
          'left',
        ).opacity(m1),
      );

      // Digest row
      const digY = 60;
      nodes.push(
        txt(
          brk > 0.5
            ? `digest:  MISMATCH  !=  ${evalDigest}...`
            : `digest:  sha256(${evalDigest}...)`,
          lx + 20,
          digY,
          26,
          brk > 0.5 ? ROLE.reject : ROLE.pass,
          'mono',
          'left',
        )
          .glow(brk > 0.5 ? 8 : 4, brk > 0.5 ? ROLE.reject : ROLE.pass)
          .opacity(m1),
      );

      // Right column: Join comparator + Registry trust gap
      const rx = 120;
      nodes.push(
        txt(
          'JOIN VERIFICATION GATE',
          rx,
          -210,
          26,
          sourceCheck.value > 0.3 ? ROLE.pass : ROLE.eval,
          'mono',
          'left',
        ).opacity(m1),
        rule(rx, -186, 860, -186, ROLE.rule, 2).opacity(m1),
        txt(
          '1. Match tenant, release, v3 vs ticket',
          rx,
          -135,
          26,
          tWrong > 0.5 ? ROLE.reject : COSMOS.ink,
          'sans',
          'left',
        ).opacity(m1),
        txt(
          '2. Recompute SHA-256 from source counts',
          rx,
          -80,
          26,
          brk > 0.5 ? ROLE.reject : COSMOS.ink,
          'sans',
          'left',
        ).opacity(m1),
        txt(
          '3. Check observation age <= 60 s',
          rx,
          -25,
          26,
          filmScopeLit.value > 0.3 ? ROLE.eval : COSMOS.muted,
          'sans',
          'left',
        ).opacity(m1),
      );

      // Bottom trust boundary: Local fixture registry vs Authenticated release service
      const by = 185;
      nodes.push(
        rule(-860, by - 36, 860, by - 36, ROLE.rule, 2).opacity(m1),
        txt(
          'LOCAL FIXTURE REGISTRY',
          lx,
          by,
          26,
          regLit.value > 0.3 ? ROLE.policy : COSMOS.muted,
          'mono',
          'left',
        ).opacity(m1),
        txt(
          missingTenant.value > 0.3
            ? 'Supplies counts only  |  tenant field MISSING'
            : 'Supplies counts for hashing',
          lx,
          by + 44,
          26,
          missingTenant.value > 0.3 ? ROLE.reject : COSMOS.muted,
          'sans',
          'left',
        ).opacity(m1),
        glowArrow(
          [-110, by + 22],
          [75, by + 22],
          authSource.value > 0.3 ? ROLE.pass : COSMOS.rule,
          {
            width: 3.4,
            opacity: m1,
          },
        ),
        txt(
          'PRODUCTION RELEASE SERVICE',
          rx,
          by,
          26,
          authSource.value > 0.3 ? ROLE.pass : COSMOS.muted,
          'mono',
          'left',
        ).opacity(m1),
        txt(
          'Authenticated source record: tenant + revision + time',
          rx,
          by + 44,
          26,
          authSource.value > 0.3 ? COSMOS.ink : COSMOS.muted,
          'sans',
          'left',
        ).opacity(m1),
      );
    }

    // =========================================================================
    // STAGE 2: Concurrent Reducers (List-Append Duplicates vs Scalar Collision)
    // =========================================================================
    if (m2 > 0.02) {
      const lx = -860;
      const topY = -175;

      // Top lane: List-add reducer
      nodes.push(
        txt('LIST-ADD REDUCER  (receipts: list)', lx, topY, 26, ROLE.eval, 'mono', 'left').opacity(
          m2,
        ),
        rule(lx, topY + 24, 860, topY + 24, ROLE.rule, 2).opacity(m2),
      );
      const rawItems =
        dupLit.value > 0.4
          ? ['policy', 'eval', 'eval']
          : orderLit.value > 0.4
            ? ['policy', 'health', 'eval']
            : ['eval', 'health', 'policy'];
      rawItems.forEach((item, i) => {
        const cx = -730 + i * 215;
        const isDup = dupLit.value > 0.4 && i === 2;
        const col = isDup
          ? ROLE.reject
          : item === 'eval'
            ? ROLE.eval
            : item === 'health'
              ? ROLE.health
              : ROLE.policy;
        nodes.push(
          lumBar(cx, topY + 86, 185, 56, {
            color: col,
            fillOpacity: 0.24,
            strokeWidth: 2.6,
            glow: isDup ? 12 : 7,
            opacity: m2,
          }),
          txt(isDup ? 'eval (DUP)' : item, cx, topY + 86, 26, COSMOS.ink, 'mono').opacity(m2),
        );
      });

      // Arrow to canonical sorted batch
      nodes.push(
        glowArrow(
          [-185, topY + 86],
          [25, topY + 86],
          uniqueLit.value > 0.3 ? ROLE.pass : ROLE.mark,
          {
            width: 3.6,
            opacity: m2,
          },
        ),
        txt(
          uniqueLit.value > 0.3 ? 'validate + sort' : 'sort by branch',
          -80,
          topY + 46,
          26,
          ROLE.mark,
          'mono',
        ).opacity(m2),
      );

      ['eval', 'health', 'policy'].forEach((item, i) => {
        const cx = 165 + i * 215;
        const col = item === 'eval' ? ROLE.eval : item === 'health' ? ROLE.health : ROLE.policy;
        nodes.push(
          lumBar(cx, topY + 86, 185, 56, {
            color: uniqueLit.value > 0.3 ? ROLE.pass : col,
            fillOpacity: 0.2,
            strokeWidth: 2.6,
            glow: uniqueLit.value > 0.3 ? 10 : 5,
            opacity: m2,
          }),
          txt(item, cx, topY + 86, 26, COSMOS.ink, 'mono').opacity(m2),
        );
      });

      // Bottom lane: Unreduced scalar collision
      const botY = 75;
      const cl = scalarClash.value;
      nodes.push(
        txt(
          'SCALAR CHANNEL  (no reducer)',
          lx,
          botY,
          26,
          cl > 0.3 ? ROLE.reject : COSMOS.muted,
          'mono',
          'left',
        ).opacity(m2),
        rule(lx, botY + 24, 860, botY + 24, ROLE.rule, 2).opacity(m2),
        lumBar(-680, botY + 88, 360, 56, { color: ROLE.eval, fillOpacity: 0.22, opacity: m2 }),
        txt('eval -> status="ok"', -680, botY + 88, 26, COSMOS.ink, 'mono').opacity(m2),
        lumBar(-680, botY + 174, 360, 56, { color: ROLE.health, fillOpacity: 0.22, opacity: m2 }),
        txt('health -> status="ok"', -680, botY + 174, 26, COSMOS.ink, 'mono').opacity(m2),
        glowArrow([-485, botY + 96], [-210, botY + 131], cl > 0.3 ? ROLE.reject : COSMOS.muted, {
          width: 3.2,
          opacity: m2,
        }),
        glowArrow([-485, botY + 166], [-210, botY + 131], cl > 0.3 ? ROLE.reject : COSMOS.muted, {
          width: 3.2,
          opacity: m2,
        }),
        glowRing(-145, botY + 131, 46, cl > 0.3 ? ROLE.reject : ROLE.merge, {
          width: 3.4,
          fillOpacity: cl > 0.3 ? 0.25 : 0.1,
          glow: cl > 0.3 ? 13 : 5,
          opacity: m2,
        }),
        txt(
          cl > 0.3 ? 'CLASH' : 'KEY',
          -145,
          botY + 131,
          26,
          cl > 0.3 ? ROLE.reject : COSMOS.ink,
          'mono',
        ).opacity(m2),
        txt(
          uniqueLit.value > 0.3
            ? 'Choose update rule deliberately, then validate merged meaning'
            : chooseLit.value > 0.3
              ? 'Two parallel writes to one scalar conflict'
              : 'Reduction syntax != semantic agreement',
          -55,
          botY + 131,
          28,
          uniqueLit.value > 0.3 ? ROLE.mark : cl > 0.3 ? ROLE.reject : COSMOS.muted,
          'sans',
          'left',
        ).opacity(m2),
      );
    }

    return nodes;
  });

  s.add(bgAtmo, title, live);
  runAmbientPhase(s, c, phase, 2.2);

  // Beat 0: Narrow output wrapper
  tweenCue(s, c, 'node-state', stateLit, 1, { duration: 0.35 });
  tweenCue(s, c, 'copied-view', viewLit, 1, { duration: 0.35 });
  tweenCue(s, c, 'trusted-identity', idLit, 1, { duration: 0.35 });
  tweenCue(s, c, 'owned-branch-results', ownedLit, 1, { duration: 0.35 });
  tweenCue(s, c, 'eval-evidence', evalEvLit, 1, { duration: 0.35 });
  tweenCue(s, c, 'cannot-approval', blockApp, 1, { duration: 0.35 });
  tweenCue(s, c, 'cannot-traffic', blockTraf, 1, { duration: 0.35 });

  // Beat 1: Cross-swap to schema vs trust
  crossSwap(s, c, 'types', stage0, stage1, { duration: 0.42 });
  tweenCue(s, c, 'types', typeLit, 1, { duration: 0.3 });
  tweenCue(s, c, 'field-ownership', tenantWrong, 1, { duration: 0.35, after: true });
  tweenCue(s, c, 'source-identity', sourceCheck, 1, { duration: 0.35 });
  tweenCue(s, c, 'text-claim', textClaim, 1, { duration: 0.35 });
  tweenCue(s, c, 'stand-in', digestBreak, 1, { duration: 0.35, after: true });
  tweenCue(s, c, 'film-scope', filmScopeLit, 1, { duration: 0.35 });
  tweenCue(s, c, 'registry-values', regLit, 1, { duration: 0.35 });
  tweenCue(s, c, 'fixture-trust', missingTenant, 1, { duration: 0.35 });
  tweenCue(s, c, 'authenticate-source', authSource, 1, { duration: 0.35 });

  // Beat 2: Cross-swap to concurrent reducers
  crossSwap(s, c, 'branch-ownership', stage1, stage2, { duration: 0.42 });
  tweenCue(s, c, 'branch-ownership', concLit, 1, { duration: 0.3 });
  tweenCue(s, c, 'list-duplicates', dupLit, 1, { duration: 0.35, after: true });
  tweenCue(s, c, 'reducer-order', orderLit, 1, { duration: 0.35 });
  tweenCue(s, c, 'scalar-conflict', scalarClash, 1, { duration: 0.35, after: true });
  tweenCue(s, c, 'choose-rule', chooseLit, 1, { duration: 0.35 });
  tweenCue(s, c, 'unique-owners', uniqueLit, 1, { duration: 0.35 });
}
