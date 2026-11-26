// Scene 04 (separated-authority): "Who gets to grade these rows?"
// Orbiting 3D trust split + validator grading vs empty [] + SHA-256 manifest binding across image I8.
import { createHash } from 'node:crypto';
import {
  COSMOS,
  REPORT_XML,
  ROLE,
  buildSandboxCage3d,
  cinemaAtmosphere,
  crossSwap,
  glowArrow,
  guardedDynamic,
  heroTitle,
  lumBar,
  orbitScene,
  parserIdentities,
  rule,
  runAmbientPhase,
  tweenCue,
  txt,
  verifyInvariant,
} from '../parts.mjs';

const EXPECTED_ROWS = ['ReportParser::rejectsFailure', 'ReportParser::handlesError'];
const TESTED_MANIFEST = {
  base: 'R18',
  files: 'tree 7',
  image: 'I7',
  dependencies: 'D3',
  grader: 'G4',
};
const MUTATED_MANIFEST = { ...TESTED_MANIFEST, image: 'I8' };

const fingerprint = (manifest) =>
  createHash('sha256')
    .update(JSON.stringify(Object.keys(TESTED_MANIFEST).map((k) => manifest[k])))
    .digest('hex');

export default function separatedAuthority(s, c) {
  const received = parserIdentities(REPORT_XML);
  const testedDigest = fingerprint(TESTED_MANIFEST);
  const mutatedDigest = fingerprint(MUTATED_MANIFEST);
  verifyInvariant(
    received.join('|') === EXPECTED_ROWS.join('|'),
    'repaired parser matches expected rows',
  );
  verifyInvariant(testedDigest !== mutatedDigest, 'changing image to I8 alters SHA-256 digest');

  const phase = s.value(0);
  const modeGrade = s.value(1);
  const modeReceipt = s.value(0);

  // Grading phase states
  const showEmpty = s.value(0);
  const showExit = s.value(0);
  const showExpected = s.value(0);
  const showRepaired = s.value(0);
  const vPrompt = s.value(0);
  const vHold = s.value(0);
  const vPass = s.value(0);

  // Receipt phase states
  const showSame = s.value(0);
  const imageMutated = s.value(0);
  const rQuestion = s.value(0);
  const rRetest = s.value(0);

  const bgAtmo = cinemaAtmosphere(ROLE.host, ROLE.pass);
  const { view: vault3d } = buildSandboxCage3d(phase, imageMutated, {
    x: 625,
    y: -315,
    theta: -0.68,
    phi: 1.04,
    distance: 22.0,
    unit: 74,
    innerColor: ROLE.candidate,
    ringColor: ROLE.host,
    outerColor: ROLE.pass,
  });

  const title = heroTitle(['Who Gets to Grade', 'These Rows?'], {
    x: -860,
    y: -440,
    size: 52,
    lineHeight: 60,
    accent: ROLE.pass,
    eyebrow: 'SEPARATED EXECUTION & VALIDATION AUTHORITY',
  });

  const live = guardedDynamic(s.value(1), () => {
    const gOp = modeGrade.value;
    const rOp = modeReceipt.value;
    const nodes = [];

    nodes.push(txt('ISOLATED TRUST BOUNDARY', 625, -455, 26, ROLE.host, 'mono').glow(5, ROLE.host));

    // === PHASE 1: Grading empty [] vs repaired rows ===
    if (gOp > 0.02) {
      const lx = -860;
      const rx = 20;
      const topY = -135;

      // Untrusted worker side
      nodes.push(
        txt(
          'UNTRUSTED WORKER  /  worker-A / g7',
          lx,
          topY,
          26,
          ROLE.candidate,
          'mono',
          'left',
        ).opacity(gOp),
        rule(lx, topY + 24, -140, topY + 24, ROLE.candidate, 2.5).opacity(gOp),
        txt('returned rows:', lx, topY + 66, 26, COSMOS.muted, 'mono', 'left').opacity(gOp),
      );
      if (showEmpty.value > 0.02) {
        nodes.push(
          txt('[]', lx, topY + 148, 62, ROLE.candidate, 'mono', 'left')
            .glow(10, ROLE.candidate)
            .opacity(gOp * showEmpty.value),
        );
      }
      if (showRepaired.value > 0.02) {
        received.forEach((rowStr, i) => {
          nodes.push(
            txt(rowStr, lx, topY + 126 + i * 56, 32, ROLE.evidence, 'mono', 'left').opacity(
              gOp * showRepaired.value,
            ),
          );
        });
      }
      if (showExit.value > 0.02) {
        nodes.push(
          lumBar(lx + 175, topY + 278, 350, 52, {
            color: ROLE.warn,
            fillOpacity: 0.16,
            strokeWidth: 2,
            opacity: gOp * showExit.value,
          }),
          txt('self exit code: 0', lx + 175, topY + 278, 28, ROLE.warn, 'mono').opacity(
            gOp * showExit.value,
          ),
        );
      }

      // Crossing arrow across boundary
      nodes.push(
        glowArrow([-120, topY + 148], [-8, topY + 148], ROLE.evidence, {
          width: 4,
          tip: 14,
          opacity: gOp,
        }),
      );

      // Trusted validator side
      nodes.push(
        txt('TRUSTED VALIDATOR  /  EXTERNAL', rx, topY, 26, ROLE.pass, 'mono', 'left').opacity(gOp),
        rule(rx, topY + 24, 855, topY + 24, ROLE.pass, 2.5).opacity(gOp),
        txt('protected expected rows:', rx, topY + 66, 26, COSMOS.muted, 'mono', 'left').opacity(
          gOp,
        ),
      );
      if (showExpected.value > 0.02) {
        EXPECTED_ROWS.forEach((rowStr, i) => {
          nodes.push(
            txt(rowStr, rx, topY + 126 + i * 56, 32, ROLE.pass, 'mono', 'left').opacity(
              gOp * showExpected.value,
            ),
          );
        });
      }
      nodes.push(
        txt(
          'Candidate cannot read or patch validator memory',
          rx,
          topY + 278,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(gOp),
      );

      // Bottom verdict ribbon (non-overlapping)
      const by = 290;
      if (vPrompt.value > 0.02) {
        nodes.push(
          txt('Does this output pass?', lx, by, 44, ROLE.mark, 'serif', 'left')
            .glow(8, ROLE.mark)
            .opacity(gOp * vPrompt.value),
        );
      }
      if (vHold.value > 0.02) {
        nodes.push(
          lumBar(-230, by, 1260, 74, {
            color: ROLE.candidate,
            fillOpacity: 0.18,
            strokeWidth: 2.5,
            glow: 10,
            opacity: gOp * vHold.value,
          }),
          txt(
            'HOLD  /  both expected rows are missing (exit 0 proves nothing)',
            lx + 24,
            by,
            32,
            ROLE.candidate,
            'sans',
            'left',
          ).opacity(gOp * vHold.value),
        );
      }
      if (vPass.value > 0.02) {
        nodes.push(
          lumBar(-230, by, 1260, 74, {
            color: ROLE.pass,
            fillOpacity: 0.18,
            strokeWidth: 2.5,
            glow: 10,
            opacity: gOp * vPass.value,
          }),
          txt('PASS  /  rows match in order', lx + 24, by, 32, ROLE.pass, 'sans', 'left').opacity(
            gOp * vPass.value,
          ),
        );
      }
    }

    // === PHASE 2: Protected passing receipt vs mutated submission (I7 -> I8) ===
    if (rOp > 0.02) {
      const lx = -860;
      const rx = 20;
      const topY = -135;
      const mut = imageMutated.value > 0.5;
      const fields = [
        ['base', TESTED_MANIFEST.base, TESTED_MANIFEST.base],
        ['file tree', TESTED_MANIFEST.files, TESTED_MANIFEST.files],
        ['image', TESTED_MANIFEST.image, mut ? MUTATED_MANIFEST.image : TESTED_MANIFEST.image],
        ['dependencies', TESTED_MANIFEST.dependencies, TESTED_MANIFEST.dependencies],
        ['grader', TESTED_MANIFEST.grader, TESTED_MANIFEST.grader],
      ];

      nodes.push(
        txt('PROTECTED PASSING RECEIPT', lx, topY, 26, ROLE.pass, 'mono', 'left').opacity(rOp),
        rule(lx, topY + 24, -120, topY + 24, ROLE.pass, 2.5).opacity(rOp),
        txt(
          'SUBMITTED FOR REVIEW',
          rx,
          topY,
          26,
          mut ? ROLE.mark : ROLE.host,
          'mono',
          'left',
        ).opacity(rOp),
        rule(rx, topY + 24, 855, topY + 24, mut ? ROLE.mark : ROLE.host, 2.5).opacity(rOp),
      );

      fields.forEach(([key, vLeft, vRight], i) => {
        const y = topY + 68 + i * 54;
        const diff = vLeft !== vRight;
        nodes.push(
          txt(key, lx, y, 26, COSMOS.muted, 'mono', 'left').opacity(rOp),
          txt(vLeft, lx + 275, y, 30, COSMOS.ink, 'mono', 'left').opacity(rOp),
          txt(key, rx, y, 26, COSMOS.muted, 'mono', 'left').opacity(rOp),
          txt(vRight, rx + 275, y, 30, diff ? ROLE.mark : COSMOS.ink, 'mono', 'left')
            .glow(diff ? 10 : 0, ROLE.mark)
            .opacity(rOp),
        );
      });

      const hashY = topY + 362;
      nodes.push(
        txt(
          `SHA-256  ${testedDigest.slice(0, 14)}...`,
          lx,
          hashY,
          28,
          ROLE.pass,
          'mono',
          'left',
        ).opacity(rOp),
        txt(
          `SHA-256  ${(mut ? mutatedDigest : testedDigest).slice(0, 14)}...`,
          rx,
          hashY,
          28,
          mut ? ROLE.candidate : ROLE.pass,
          'mono',
          'left',
        )
          .glow(mut ? 9 : 4, mut ? ROLE.candidate : ROLE.pass)
          .opacity(rOp),
      );

      const by = 295;
      if (showSame.value > 0.02) {
        nodes.push(
          txt('Same tested inputs: full digests match', lx, by, 38, ROLE.pass, 'sans', 'left')
            .glow(7, ROLE.pass)
            .opacity(rOp * showSame.value),
        );
      }
      if (rQuestion.value > 0.02) {
        nodes.push(
          txt('Can this receipt cover image I8?', lx, by, 42, ROLE.mark, 'serif', 'left')
            .glow(8, ROLE.mark)
            .opacity(rOp * rQuestion.value),
        );
      }
      if (rRetest.value > 0.02) {
        nodes.push(
          lumBar(-160, by, 1400, 74, {
            color: ROLE.mark,
            fillOpacity: 0.16,
            strokeWidth: 2.5,
            glow: 10,
            opacity: rOp * rRetest.value,
          }),
          txt(
            'HOLD for a fresh run on image I8  /  compare full digests',
            lx + 24,
            by,
            34,
            ROLE.mark,
            'sans',
            'left',
          ).opacity(rOp * rRetest.value),
        );
      }
    }

    return nodes;
  });

  s.add(bgAtmo, vault3d, title, live);
  runAmbientPhase(s, c, phase, 2.4);
  orbitScene(s, c, vault3d, { theta: 0.42, phi: 0.98 });

  // Beat 0 & 1: Grading
  tweenCue(s, c, 'sa-empty', showEmpty, 1, { duration: 0.35 });
  tweenCue(s, c, 'sa-exit', showExit, 1, { duration: 0.35 });
  tweenCue(s, c, 'sa-expected', showExpected, 1, { duration: 0.35 });
  tweenCue(s, c, 'sa-ask', vPrompt, 1, { duration: 0.35 });
  crossSwap(s, c, 'sa-hold', vPrompt, vHold, { duration: 0.4, after: true });
  crossSwap(s, c, 'sa-repair', showEmpty, showRepaired, { duration: 0.4 });
  crossSwap(s, c, 'sa-pass', vHold, vPass, { duration: 0.4, after: true });

  // Beat 2 & 3: Receipt binding
  crossSwap(s, c, 'sa-receipt', modeGrade, modeReceipt, { duration: 0.45 });
  tweenCue(s, c, 'sa-same', showSame, 1, { duration: 0.35 });
  c.on('sa-image', () => {
    s.play(showSame.to(0, { duration: 0.2 }), imageMutated.to(1, { duration: 0.35 }));
  });
  tweenCue(s, c, 'sa-which', rQuestion, 1, { duration: 0.35 });
  crossSwap(s, c, 'sa-retest', rQuestion, rRetest, { duration: 0.4, after: true });
}
