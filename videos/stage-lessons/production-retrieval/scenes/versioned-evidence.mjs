// Scene 03 (versioned-evidence): "Make each evidence record traceable"
// Luminous span dissection into lineage metadata rails, chronological revision timeline
// admitting v2 and archiving v1 on 2026-05-27, plus SHA-256 content digest verification.
import { dynamic, group, line } from 'vizmatic/stage';
import {
  CORPUS,
  COSMOS,
  EVAL_DATE,
  ROLE,
  callerTag,
  cinemaAtmosphere,
  glowDot,
  glowRing,
  glowingTrail,
  heroTitle,
  lumBar,
  playCue,
  runPhase,
  statusPill,
  tweenCue,
  txt,
  versionedBundle,
} from '../parts.mjs';

export default function versionedEvidence(s, c) {
  const v2 = CORPUS.find((r) => r.id === 'eu-key-v2');
  const v1 = CORPUS.find((r) => r.id === 'eu-key-v1');
  const bundle = versionedBundle();

  const phase = s.value(0);
  const spanLit = s.value(0);
  const lineageLit = s.value(0);
  const v2Lit = s.value(0);
  const v1Lit = s.value(0);
  const cursorT = s.value(0); // moves request date cursor to 2026-05-27
  const v2Admitted = s.value(0);
  const v1Excluded = s.value(0);
  const showDigest = s.value(0);

  const title = heroTitle(['Make Each Evidence', 'Record Traceable'], {
    x: -855,
    y: -440,
    size: 52,
    lineHeight: 62,
    accent: ROLE.policy,
    eyebrow: 'INGESTION LINEAGE · REVISION TIMELINE',
  });

  const live = dynamic(() => {
    const p = phase.value;
    const pulse = 0.8 + 0.2 * Math.sin(p * 3.0);
    const sp = spanLit.value;
    const lin = lineageLit.value;
    const c2 = v2Lit.value;
    const c1 = v1Lit.value;
    const ct = cursorT.value;
    const adm = v2Admitted.value;
    const exc = v1Excluded.value;
    const dig = showDigest.value;

    const nodes = [callerTag(1)];

    // Top-left: Lineage metadata strip (glowing tokens, zero bullet boxes)
    const metaFields = [
      'doc: eu-access',
      'parent: eu-access-v2',
      'region: EU',
      'acl: support:eu',
      'effective: 2026-04-01+',
    ];
    nodes.push(
      txt(
        'ATTACHED TRUSTED METADATA',
        -855,
        -238,
        26,
        lin > 0.3 ? ROLE.focus : COSMOS.muted,
        'mono',
        'left',
      ).glow(lin > 0.3 ? 6 : 0, ROLE.focus),
    );
    metaFields.forEach((field, i) => {
      const fx = -855 + (i % 2) * 395;
      const fy = -190 + Math.floor(i / 2) * 52;
      nodes.push(
        txt(field, fx, fy, 26, lin > 0.3 ? ROLE.focus : ROLE.policy, 'mono', 'left').opacity(
          0.55 + 0.45 * Math.max(sp, lin),
        ),
      );
    });

    // Right side: Two revision records (v2 current vs v1 historical)
    const recX = 430;
    const v2Y = -160;
    const v1Y = 25;

    // v2 card-free luminous strip
    const v2Col = adm > 0.3 ? ROLE.admitted : ROLE.policy;
    nodes.push(
      lumBar(recX, v2Y, 820, 148, {
        color: v2Col,
        fillAlpha: 0.08 + Math.max(c2, adm) * 0.1,
        strokeWidth: 2.2 + Math.max(c2, adm) * 1.4,
        glow: 7 + Math.max(c2, adm) * 7,
        radius: 14,
      }),
      txt('eu-key-v2  ·  14 days / 48h signal', recX - 385, v2Y - 34, 30, v2Col, 'mono', 'left'),
      txt(`${v2.from}  ->  current`, recX - 385, v2Y + 18, 26, COSMOS.muted, 'mono', 'left'),
    );
    if (adm > 0.05) {
      nodes.push(
        statusPill('ADMITTED', recX + 275, v2Y + 14, {
          color: ROLE.admitted,
          width: 210,
          height: 44,
          opacity: adm,
        }),
      );
    }

    // v1 strip (fades back to archive once excluded)
    const v1Op = 1 - exc * 0.42;
    const v1Col = exc > 0.3 ? ROLE.session : c1 > 0.3 ? ROLE.focus : COSMOS.muted;
    nodes.push(
      lumBar(recX, v1Y, 820, 148, {
        color: v1Col,
        fillAlpha: 0.06 + c1 * 0.08,
        strokeWidth: 2.0 + c1 * 1.0,
        glow: 5 + c1 * 5,
        radius: 14,
        opacity: v1Op,
      }),
      txt(
        'eu-key-v1  ·  30 days manual rotation',
        recX - 385,
        v1Y - 34,
        30,
        v1Col,
        'mono',
        'left',
      ).opacity(v1Op),
      txt(
        `${v1.from}  ->  ${v1.to}`,
        recX - 385,
        v1Y + 18,
        26,
        COSMOS.muted,
        'mono',
        'left',
      ).opacity(v1Op),
    );
    if (exc > 0.05) {
      nodes.push(
        statusPill('HISTORICAL ONLY', recX + 240, v1Y + 14, {
          color: ROLE.session,
          width: 275,
          height: 44,
          opacity: exc,
        }),
      );
    }

    // Bottom-half continuous chronological revision beam
    const tlL = -820;
    const tlR = 820;
    const tlY = 235;
    const xEndV1 = -160;
    const xStartV2 = -80;
    const xReq = 540;

    nodes.push(
      // v1 historical beam segment
      glowingTrail(
        [
          [tlL, tlY],
          [xEndV1, tlY],
        ],
        {
          color: ROLE.session,
          width: 5,
          glow: 8,
          opacity: 0.45 + c1 * 0.45 - exc * 0.3,
          core: false,
        },
      ),
      // v2 active beam segment
      glowingTrail(
        [
          [xStartV2, tlY],
          [tlR, tlY],
        ],
        { color: v2Col, width: 6, glow: 11, opacity: 0.65 + adm * 0.35, core: true },
      ),
      // Ticks & date labels
      glowDot(xEndV1, tlY, { radius: 7, color: ROLE.session, glow: 8 }),
      txt('v1 ends', xEndV1, tlY - 46, 26, ROLE.session, 'sans', 'center'),
      txt(v1.to, xEndV1, tlY + 42, 26, COSMOS.muted, 'mono', 'center'),

      glowDot(xStartV2, tlY, { radius: 7, color: ROLE.policy, glow: 9 }),
      txt('v2 begins', xStartV2 + 62, tlY - 46, 26, ROLE.policy, 'sans', 'left'),
      txt(v2.from, xStartV2 + 62, tlY + 42, 26, COSMOS.muted, 'mono', 'left'),
    );

    // Animated request-date laser cursor sweeping into v2 (vertical marker stays cleanly between labels)
    const curX = tlL + 120 + (xReq - (tlL + 120)) * ct;
    nodes.push(
      line([curX, tlY - 26], [curX, tlY + 26], { stroke: ROLE.request, width: 3.4 }),
      glowRing(curX, tlY, 20, ROLE.request, { width: 3.2, glow: 11 * pulse }),
      glowDot(curX, tlY, { radius: 8, color: ROLE.request, glow: 12 }),
      txt(`REQUEST  ${EVAL_DATE}`, curX, tlY - 96, 26, ROLE.request, 'mono', 'center').glow(
        6,
        ROLE.request,
      ),
    );

    // Bottom readouts on two distinct lines so neither flashes briefly
    if (adm > 0.2) {
      nodes.push(
        txt(
          'Current request -> eu-key-v2 admitted, v1 archived',
          -855,
          362,
          30,
          ROLE.admitted,
          'mono',
          'left',
        )
          .glow(7, ROLE.admitted)
          .opacity(adm),
      );
    }
    if (dig > 0.2) {
      nodes.push(
        txt(
          `SHA-256: ${bundle.sourceHash.slice(0, 24)}...  (bytes only; ingestion sets authority)`,
          -855,
          418,
          28,
          ROLE.policy,
          'mono',
          'left',
        )
          .glow(6, ROLE.policy)
          .opacity(dig),
      );
    }

    return group(...nodes);
  });

  s.add(cinemaAtmosphere(ROLE.policy, ROLE.session), title, live);
  runPhase(s, c, phase, 14);

  tweenCue(s, c, 'parse-spans', spanLit, 1, { dur: 0.6 });
  tweenCue(s, c, 'preserve-lineage', lineageLit, 1, { dur: 0.6 });
  tweenCue(s, c, 'current-rule', v2Lit, 1, { dur: 0.55 });
  tweenCue(s, c, 'historical-rule', v1Lit, 1, { dur: 0.55 });
  playCue(
    s,
    c,
    'filter-current',
    (d) => s.play(cursorT.to(1, { duration: d }), v2Admitted.to(1, { duration: Math.min(0.6, d) })),
    { dur: 1.1 },
  );
  tweenCue(s, c, 'exclude-expired', v1Excluded, 1, { after: true, dur: 0.55 });
  tweenCue(s, c, 'verify-bytes', showDigest, 1, { dur: 0.55 });
}
