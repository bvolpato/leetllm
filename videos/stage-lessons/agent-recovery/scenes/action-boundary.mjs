// Scene 2: action-boundary - "A proposal passes through an admission check"
// Laser admission gate splits read proposals (permitted -> pass) from write proposals (approval slot empty -> stopped),
// then contrasts bounded 1-step schema repair vs persistent permission denial.
import { circle, line } from 'vizmatic/stage';
import {
  COSMOS,
  OP,
  ROLE,
  actorOrb,
  ambientClock,
  cinemaAtmosphere,
  glowArrow,
  glowCross,
  glowDot,
  glowPill,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  hexAlpha,
  lowerFooter,
  playCue,
  txt,
} from '../parts.mjs';

export default function actionBoundary(s, c) {
  const title = heroTitle(['A proposal passes through', 'an admission check'], {
    x: -855,
    y: -440,
    size: 50,
    lineHeight: 58,
    accent: ROLE.sure,
  });

  const amb = ambientClock(s, c);
  const readSlide = s.value(0);
  const gateCheck = s.value(0);
  const readAllowed = s.value(0);
  const writeSlide = s.value(0);
  const validArgs = s.value(0);
  const emptyApproval = s.value(0);
  const writeDenied = s.value(0);
  const schemaMode = s.value(0);
  const repaired = s.value(0);
  const readmitted = s.value(0);
  const repeatDenied = s.value(0);

  const gateX = -20;
  const readY = -120;
  const writeY = 140;

  const layer = guardedDynamic(
    () => 1,
    (alpha) => {
      const pulse = 0.5 + 0.5 * Math.sin(amb.value * Math.PI * 12);
      const nodes = [];

      // Operator task scope badge on top right
      nodes.push(
        glowPill('Task: "How is deploy going?" (read-only)', 470, -405, ROLE.agent, {
          size: 26,
          alpha,
        }),
      );

      // Vertical glowing admission laser gate at x = gateX
      const gateGlow = 6 + 6 * gateCheck.value + 3 * pulse;
      nodes.push(
        line([gateX, -290], [gateX, 282], {
          stroke: hexAlpha(ROLE.mark, 0.85 * alpha),
          width: 4.5,
        }).glow(gateGlow, ROLE.mark),
        txt('HOST ADMISSION GATE', gateX, -320, 26, ROLE.mark, 'mono', 'center').opacity(alpha),
      );

      // Left origin & right execution targets
      nodes.push(
        actorOrb(-700, 10, 62, ROLE.violet, 'Model', 'untrusted proposal', { alpha }),
        actorOrb(680, readY, 58, ROLE.sure, 'Read API', 'status query', {
          alpha,
          active: readAllowed.value > 0.5 || readmitted.value > 0.5,
        }),
        actorOrb(680, writeY, 58, ROLE.fail, 'Write API', 'rollback rev-17', {
          alpha,
          active: false,
        }),
      );

      // Upper lane: Status Read (or Schema Repair in beat 3)
      const readStart = -610;
      const readEnd = 590;
      nodes.push(
        glowArrow(readStart, readY, readEnd, readY, hexAlpha(ROLE.agent, 0.38 * alpha), {
          width: 2.6,
          alpha,
          glow: 3,
        }),
      );

      if (schemaMode.value < 0.5) {
        if (readSlide.value > 0.02) {
          const rx =
            readStart + (readEnd - readStart) * (0.45 * readSlide.value + 0.55 * readAllowed.value);
          const rCol = readAllowed.value > 0.5 ? ROLE.sure : ROLE.agent;
          const rPillX = readAllowed.value > 0.5 ? 295 : -325;
          nodes.push(
            glowingTrail(
              [
                [readStart, readY],
                [rx, readY],
              ],
              { color: rCol, width: 5.5, glow: 10, opacity: alpha },
            ),
            glowDot(rx, readY, { radius: 11, color: rCol, glow: 14, opacity: alpha }),
            glowPill(
              readAllowed.value > 0.5 ? 'status_read -> PERMITTED' : 'propose: status_read',
              rPillX,
              readY - 62,
              rCol,
              { size: 26, alpha },
            ),
          );
        }
      } else {
        // Beat 3: Schema error -> 1 bounded repair -> re-admitted
        const sa = schemaMode.value * alpha;
        const rx =
          readmitted.value > 0.05
            ? gateX + (readEnd - gateX) * readmitted.value
            : gateX - 180 + 140 * repaired.value;
        const rCol =
          readmitted.value > 0.5 ? ROLE.sure : repaired.value > 0.5 ? ROLE.agent : ROLE.mark;
        const rLabel =
          readmitted.value > 0.5
            ? 'repaired read -> ADMITTED'
            : repaired.value > 0.5
              ? '+ run_id (1 repair)'
              : 'missing run_id (schema)';
        const rPillX = readmitted.value > 0.5 ? 295 : -325;
        nodes.push(
          glowingTrail(
            [
              [readStart, readY],
              [rx, readY],
            ],
            { color: rCol, width: 5.5, glow: 10, opacity: sa },
          ),
          glowDot(rx, readY, { radius: 11, color: rCol, glow: 14, opacity: sa }),
          glowPill(rLabel, rPillX, readY - 62, rCol, {
            size: 26,
            alpha: sa,
          }),
        );
      }

      // Lower lane: Rollback Write (stopped at empty approval slot!)
      nodes.push(
        glowArrow(readStart, writeY, readEnd, writeY, hexAlpha(ROLE.fail, 0.32 * alpha), {
          width: 2.6,
          alpha,
          dash: [8, 8],
          glow: 3,
        }),
      );

      // Approval slot indicator on the gate at writeY
      const slotCol = emptyApproval.value > 0.5 ? ROLE.fail : ROLE.mark;
      nodes.push(
        circle(34, {
          fill: hexAlpha(slotCol, 0.1 * alpha),
          stroke: slotCol,
          width: 3,
          dash: [7, 5],
        })
          .at(gateX, writeY)
          .glow(emptyApproval.value > 0.5 ? 10 : 4, slotCol),
        txt(
          emptyApproval.value > 0.5 ? 'APPROVAL: EMPTY' : 'approval slot',
          gateX + 185,
          writeY - 58,
          26,
          slotCol,
          'mono',
          'center',
        ).opacity((0.6 + 0.4 * emptyApproval.value) * alpha),
      );

      if (writeSlide.value > 0.02) {
        const stopX = gateX - 74;
        const wx = readStart + (stopX - readStart) * writeSlide.value;
        const wCol = writeDenied.value > 0.5 ? ROLE.fail : ROLE.op;
        const wText =
          repeatDenied.value > 0.5
            ? 'ask 2x -> STILL DENIED'
            : writeDenied.value > 0.5
              ? 'STOPPED: no approval'
              : validArgs.value > 0.5
                ? `valid args (${OP.revision})`
                : `propose: ${OP.action}`;
        nodes.push(
          glowingTrail(
            [
              [readStart, writeY],
              [wx, writeY],
            ],
            { color: wCol, width: 5.5, glow: 10, opacity: alpha },
          ),
          glowDot(wx, writeY, { radius: 11, color: wCol, glow: 14, opacity: alpha }),
          glowPill(wText, Math.max(-360, wx - 110), writeY + 62, wCol, { size: 26, alpha }),
        );
        if (writeDenied.value > 0.4) {
          nodes.push(glowCross(gateX, writeY, 32, ROLE.fail, writeDenied.value * alpha));
        }
      }

      // Bottom summary bar
      const summary =
        repeatDenied.value > 0.5
          ? 'Schema errors allow one bounded repair; missing permission stays blocked.'
          : writeDenied.value > 0.5
            ? 'Valid JSON syntax does not grant write authority.'
            : readAllowed.value > 0.5
              ? 'Host code matches each proposal against operator authority.'
              : 'Every tool call enters host code as an untrusted proposal.';
      nodes.push(
        txt(summary, 0, 325, 28, COSMOS.ink, 'sans', 'center').opacity(alpha),
        lowerFooter(
          'SYNTAX != AUTHORITY',
          repeatDenied.value > 0.5
            ? 'SCHEMA: 1 REPAIR · WRITE: BLOCKED'
            : writeDenied.value > 0.5
              ? 'APPROVAL SLOT EMPTY -> HALT'
              : 'READ PERMITTED',
          { accent: writeDenied.value > 0.5 ? ROLE.fail : ROLE.sure, alpha },
        ),
      );

      return nodes;
    },
  );

  s.add(cinemaAtmosphere(ROLE.sure, ROLE.fail), title, layer);

  playCue(s, c, 'proposed-read', (d) => s.play(readSlide.to(1, { duration: d })), { dur: 0.7 });
  playCue(s, c, 'app-decides', (d) => s.play(gateCheck.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'read-authority', (d) => s.play(readAllowed.to(1, { duration: d })), { dur: 0.7 });
  playCue(s, c, 'rollback-proposal', (d) => s.play(writeSlide.to(1, { duration: d })), {
    dur: 0.75,
  });
  playCue(s, c, 'valid-request', (d) => s.play(validArgs.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'separate-approval', (d) => s.play(emptyApproval.to(1, { duration: d })), {
    dur: 0.45,
  });
  playCue(s, c, 'no-approval', (d) => s.play(writeDenied.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'schema-fail', (d) => s.play(schemaMode.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'bounded-repair', (d) => s.play(repaired.to(1, { duration: d })), { dur: 0.5 });
  playCue(s, c, 'readmit-repaired', (d) => s.play(readmitted.to(1, { duration: d })), { dur: 0.6 });
  playCue(s, c, 'permission-failure', (d) => s.play(repeatDenied.to(0.6, { duration: d })), {
    dur: 0.4,
  });
  playCue(s, c, 'repeat-call', (d) => s.play(repeatDenied.to(1, { duration: d })), { dur: 0.4 });
}
