// Scene 21: typed-observation-handoff - Can this release merge?
// Bookend finale returning to Scene 1's Release Service vs Model Proposal comparison!
// Now the trusted scan cell is MISSING (EMPTY) -> strict prediction pause asks where to get
// it -> typed tool call get_security_scan(run_id="ci-1482") -> runtime checks args & perms ->
// dispatches -> reply returns FALSE -> fills exact cell -> rule routes to MANUAL REVIEW!
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  cleanRelease,
  driftValue,
  guardedDynamic,
  orbNode,
  orbRadius,
  reasoningDecision,
  scanFields,
  trimSeg,
  txt,
} from '../parts.mjs';

const OBSERVED_FACTS = { ...cleanRelease, security_scan_clear: false };
const FINAL_RULE = reasoningDecision(OBSERVED_FACTS);

export default function typedObservationHandoff(s, c) {
  const pulse = s.value(0);
  const missingHi = s.value(0);
  const reqOn = s.value(0);
  const authOn = s.value(0);
  const sendOn = s.value(0);
  const replyOn = s.value(0);
  const fillOn = s.value(0);
  const decOn = s.value(0);

  const header = cinemaHeader('TYPED TOOL HANDOFF', 'Can this release', 'merge?', {
    accent: ROLE.path,
    size: 48,
  });

  const stageAura = aura(100, 30, 680, '#5ce1e61c', '#ff6b8b14');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = pulse.value;
      const ms = missingHi.value;
      const rq = reqOn.value;
      const au = authOn.value;
      const sn = sendOn.value;
      const rp = replyOn.value;
      const fl = fillOn.value;
      const dc = decOn.value;
      const nodes = [];

      const leftX = -350;
      const rightX = 350;
      const labelX = -760;
      const rowYs = [-125, -5, 115];

      const svcAction =
        dc > 0.45
          ? FINAL_RULE === 'manual_review'
            ? 'ACTION: MANUAL REVIEW'
            : 'ACTION: MERGE'
          : 'ACTION: AWAITING CHECK';
      const svcActCol = dc > 0.45 ? ROLE.caution : ROLE.focus;

      nodes.push(
        txt('RELEASE SERVICE (ci-1482)', leftX, -278, 28, ROLE.service, 'mono', 'center'),
        txt(svcAction, leftX, -236, 26, svcActCol, 'mono', 'center').glow(
          dc > 0.45 ? 7 : 0,
          svcActCol,
        ),
        txt('MODEL PROPOSAL', rightX, -278, 28, ROLE.model, 'mono', 'center'),
        txt('ACTION: MERGE', rightX, -236, 26, ROLE.ok, 'mono', 'center'),
      );

      scanFields.forEach(([key, label], i) => {
        const y = rowYs[i];
        const isScan = key === 'security_scan_clear';
        const hasVal = !isScan || fl > 0.45;
        const leftText = hasVal ? (isScan ? 'FALSE' : 'TRUE') : 'EMPTY';
        const rightText = 'TRUE';

        const leftCol = isScan
          ? fl > 0.45
            ? ROLE.fail
            : ms > 0.35
              ? ROLE.focus
              : ROLE.caution
          : ROLE.service;
        const rightCol = ROLE.model;
        const railCol = isScan && fl > 0.45 ? ROLE.fail : isScan ? ROLE.focus : '#344770';

        const rL = orbRadius(leftText, 42);
        const rR = orbRadius(rightText, 42);
        const [aPt, bPt] = trimSeg([leftX, y], [rightX, y], rL + 10, rR + 10);

        nodes.push(
          txt(label.toUpperCase(), labelX, y, 26, COSMOS.ink, 'mono', 'left'),
          orbNode(leftX, y, leftText, leftCol, {
            radius: 42,
            glow: isScan ? 12 : 6,
          }),
          beamWithPhotons([aPt, bPt], railCol, p * 1.0 + i * 0.3, {
            width: isScan ? 3.8 : 2.4,
            alpha: isScan ? 0.95 : 0.45,
            photonCount: isScan ? 2 : 1,
          }),
          orbNode(rightX, y, rightText, rightCol, { radius: 42 }),
        );
      });

      // Lower typed-tool call pipeline rail (withheld until tool-request!)
      nodes.push(line([-820, 200], [820, 200], { stroke: '#25355a', width: 2 }).opacity(0.65));

      if (rq > 0.05) {
        const stepNodes = [
          [-620, 285, 'CALL', ROLE.path, rq],
          [-210, 285, 'AUTH', ROLE.service, au],
          [210, 285, 'SCAN', ROLE.focus, sn],
          [620, 285, 'FALSE', ROLE.fail, rp],
        ];
        for (let i = 0; i < 3; i++) {
          const [x1, y1, l1] = stepNodes[i];
          const [x2, y2, l2, col2, vis2] = stepNodes[i + 1];
          const [aPt, bPt] = trimSeg(
            [x1, y1],
            [x2, y2],
            orbRadius(l1, 40) + 8,
            orbRadius(l2, 40) + 8,
          );
          nodes.push(
            beamWithPhotons([aPt, bPt], vis2 > 0.35 ? col2 : '#2c3d66', p * 1.2 + i * 0.25, {
              alpha: 0.25 + 0.75 * vis2,
              width: vis2 > 0.35 ? 3.6 : 2.2,
              photonCount: vis2 > 0.35 ? 2 : 0,
            }),
          );
        }
        for (const [sx, sy, lbl, col, vis] of stepNodes) {
          nodes.push(
            orbNode(sx, sy, lbl, vis > 0.35 ? col : '#3b4e7a', {
              radius: 40,
              size: 26,
              opacity: 0.35 + 0.65 * vis,
            }),
          );
        }
        nodes.push(
          txt(
            dc > 0.45
              ? 'LOGGED: run=ci-1482 · scan=false · model=merge · policy=manual_review'
              : 'get_security_scan(run_id="ci-1482")',
            0,
            406,
            28,
            dc > 0.45 ? ROLE.ok : ROLE.path,
            'mono',
            'center',
          ).opacity(rq),
        );
      } else {
        nodes.push(
          txt(
            'Run ci-1482: scan cell is empty. Where would you get the missing result?',
            0,
            315,
            32,
            ROLE.focus,
            'serif',
            'center',
          ).glow(7, ROLE.focus),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  driftValue(s, c, pulse, 5.4, { startOffset: 0.1, endMargin: 0.5 });

  c.on('tool-missing', () => {
    s.play(missingHi.to(1, { duration: clampDur(c, c.cue('tool-missing').start, 0.35) }));
  });
  // Strict prediction withholding!
  c.after('tool-request', () => {
    s.play(reqOn.to(1, { duration: clampDur(c, c.cue('tool-request').end, 0.35) }));
  });
  c.on('tool-authorize', () => {
    s.play(authOn.to(1, { duration: clampDur(c, c.cue('tool-authorize').start, 0.35) }));
  });
  c.on('tool-send', () => {
    s.play(sendOn.to(1, { duration: clampDur(c, c.cue('tool-send').start, 0.35) }));
  });
  c.on('tool-reply', () => {
    s.play(replyOn.to(1, { duration: clampDur(c, c.cue('tool-reply').start, 0.35) }));
  });
  c.on('tool-fill', () => {
    s.play(fillOn.to(1, { duration: clampDur(c, c.cue('tool-fill').start, 0.35) }));
  });
  c.on('tool-decision', () => {
    s.play(decOn.to(1, { duration: clampDur(c, c.cue('tool-decision').start, 0.35) }));
  });
}
