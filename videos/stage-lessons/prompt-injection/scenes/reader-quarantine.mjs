// Scene 7: reader-quarantine - What can the reader hand over?
// CaMeL Dual-LLM / Quarantined Reader vs Privileged Host architecture: raw report text
// stays inside a toolless quarantine chamber; only a bounded regex suite ID (`R42`) can
// cross the narrow aperture while free-form paragraphs are blocked. Holds prediction on
// the 7-digit ID (`R1234567`) until strictly AFTER `reader-no-id`.
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  OVERLONG_SUITE_ID,
  PI_SOURCE,
  REPORT,
  ROLE,
  SUITE_REGEX,
  VALID_SUITE_ID,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  energyRail,
  fadeInHalf,
  fadeOutHalf,
  guardedDynamic,
  hexGate,
  quadArcPts,
  txt,
} from '../parts.mjs';

export default function readerQuarantine(s, c) {
  const pulse = s.value(0);
  const readerHi = s.value(0);
  const execHi = s.value(0);
  const fieldCross = s.value(0);
  const regexHi = s.value(0);
  const srcAttach = s.value(0);
  const longMode = s.value(0);
  const noIdReveal = s.value(0);

  const validMatch = SUITE_REGEX.test(VALID_SUITE_ID);
  const longMatch = SUITE_REGEX.test(OVERLONG_SUITE_ID);

  const header = cinemaHeader(
    'QUARANTINED READER · DUAL-LLM',
    'What can the reader',
    'hand across?',
    { accent: ROLE.host, size: 48 },
  );

  const stageAura = aura(100, 30, 640, '#5ce1e61c', '#a78bfa18');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = 0;
      const rh = readerHi.value;
      const eh = execHi.value;
      const fc = fieldCross.value;
      const rx = regexHi.value;
      const sa = srcAttach.value;
      const lm = longMode.value;
      const nr = noIdReveal.value;
      const nodes = [];

      const activeId = lm > 0.5 ? OVERLONG_SUITE_ID : VALID_SUITE_ID;

      // Left: Quarantined Reader Chamber (0 tools, 0 credentials, 0 network)
      nodes.push(
        energyRail(-855, -205, 225, ROLE.untrusted, { width: 6, glow: 8 + rh * 6 }),
        txt('QUARANTINED READER', -825, -182, 26, ROLE.untrusted, 'mono', 'left'),
        txt('0 tools · 0 release creds · 0 open net', -825, -132, 26, COSMOS.muted, 'mono', 'left'),
        line([-825, -96], [-290, -96], { stroke: '#28385f', width: 2 }),
        txt(`“${REPORT.result}”`, -825, -48, 28, COSMOS.ink, 'sans', 'left'),
        txt(
          `“eval suite ${activeId}”`,
          -825,
          12,
          30,
          lm > 0.5 ? ROLE.focus : ROLE.host,
          'mono',
          'left',
        ).glow(lm > 0.5 ? 8 : 5, lm > 0.5 ? ROLE.focus : ROLE.host),
        txt(`“${REPORT.attack}”`, -825, 76, 28, ROLE.attack, 'serif', 'left'),
        txt('Free-form paragraph stays TRAPPED here', -825, 144, 26, ROLE.denied, 'mono', 'left'),
        txt(
          lm > 0.5 ? '7 digits: 1234567' : '2 digits: 42 (valid 1..6)',
          -825,
          196,
          26,
          lm > 0.5 ? ROLE.focus : ROLE.ok,
          'mono',
          'left',
        ),
      );

      // Center: Narrow Bounded-Field Aperture Gate
      const gateX = -20;
      const gateY = 12;
      const gateCol =
        lm > 0.5 && nr > 0.5
          ? ROLE.denied
          : lm > 0.5
            ? ROLE.focus
            : rx > 0.3
              ? ROLE.host
              : ROLE.source;

      nodes.push(
        line([gateX, -235], [gateX, gateY - 122], {
          stroke: '#2d3f69',
          width: 2.6,
          dash: [10, 10],
        }),
        line([gateX, gateY + 180], [gateX, 240], { stroke: '#2d3f69', width: 2.6, dash: [10, 10] }),
        hexGate(gateX, gateY, 68, gateCol, {
          label: 'R\\d{1,6}',
          sub: 'BOUNDED FIELD ONLY',
          glow: 10,
        }),
      );

      // Crossing beam
      const leftArc = quadArcPts([-265, 12], [gateX - 116, gateY], 0, 18);
      const rightArc = quadArcPts([gateX + 116, gateY], [240, 12], 0, 18);
      nodes.push(
        beamWithPhotons(leftArc, lm > 0.5 ? ROLE.focus : ROLE.host, p * 1.0, { width: 3.4 }),
      );
      if (lm < 0.5 && validMatch) {
        nodes.push(
          beamWithPhotons(rightArc, ROLE.ok, p * 1.0 + 0.5, {
            width: 3.4,
            alpha: 0.45 + fc * 0.55,
          }),
        );
      } else if (lm >= 0.5 && nr > 0.5 && !longMatch) {
        nodes.push(
          line([gateX + 116, gateY], [225, gateY], {
            stroke: ROLE.denied,
            width: 2.4,
            dash: [6, 8],
          }).opacity(nr * 0.8),
        );
      }

      // Right: Application Code + Scoped Executor
      const rightX = 260;
      nodes.push(
        energyRail(rightX, -205, 225, eh > 0.3 ? ROLE.ok : ROLE.host, {
          width: 6,
          glow: 8 + eh * 6,
        }),
        txt('HOST CODE + EXECUTOR', rightX + 28, -182, 26, ROLE.ok, 'mono', 'left'),
        txt(
          'Caller source_id (always fixed):',
          rightX + 28,
          -124,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ),
        txt(PI_SOURCE.source_id, rightX + 28, -76, 28, ROLE.source, 'mono', 'left').glow(
          sa > 0.3 ? 8 : 3,
          ROLE.source,
        ),
        line([rightX + 28, -36], [835, -36], { stroke: '#28385f', width: 2 }),
      );

      // Dynamic extracted field readout on right (strictly withheld when lm > 0.5 and nr < 0.5!)
      const extractedText =
        lm < 0.5
          ? `suite_id: ${VALID_SUITE_ID}`
          : nr > 0.5
            ? 'suite_id: NONE  (rejected)'
            : 'suite_id: ???';
      const extractedCol = lm < 0.5 ? ROLE.ok : nr > 0.5 ? ROLE.denied : ROLE.focus;

      nodes.push(
        rect(545, 76, { fill: '#0e1529', stroke: extractedCol, width: 2.6, radius: 8 }).at(
          rightX + 300,
          26,
        ),
        txt(extractedText, rightX + 300, 26, 30, extractedCol, 'mono', 'center').glow(
          7,
          extractedCol,
        ),
        txt(
          'Executor gets approved args + narrow cred',
          rightX + 28,
          122,
          26,
          eh > 0.3 ? COSMOS.ink : COSMOS.muted,
          'sans',
          'left',
        ),
        txt('No raw paragraph crosses to planner', rightX + 28, 176, 26, ROLE.host, 'mono', 'left'),
      );

      // Bottom band: Non-overlapping crossfade for Beat 2 prediction -> Beat 3 reveal!
      const preAns = fadeOutHalf(nr);
      const postAns = fadeInHalf(nr);

      if (preAns > 0.02) {
        nodes.push(
          txt(
            lm > 0.4
              ? `Input changed to 7-digit ${OVERLONG_SUITE_ID}: could the reader keep just the first 6 digits?`
              : 'Narrow typed fields (ID, number, bool, enum) let the host validate before acting',
            0,
            345,
            30,
            lm > 0.4 ? ROLE.question : COSMOS.muted,
            lm > 0.4 ? 'serif' : 'sans',
            'center',
          )
            .glow(lm > 0.4 ? 8 : 0, ROLE.question)
            .opacity(preAns),
        );
      }

      if (postAns > 0.02) {
        nodes.push(
          txt(
            'NO SUITE ID RETURNED · 7th digit belongs to the same ID (no partial match)',
            0,
            322,
            30,
            ROLE.denied,
            'mono',
            'center',
          )
            .glow(8, ROLE.denied)
            .opacity(postAns),
          txt(
            `Trailing letter, underscore, or hyphen also fails  ·  Caller keeps ${PI_SOURCE.source_id}`,
            0,
            382,
            26,
            ROLE.source,
            'sans',
            'center',
          ).opacity(postAns),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);

  c.on('reader-text', () => {
    s.play(readerHi.to(1, { duration: clampDur(c, c.cue('reader-text').start, 0.35) }));
  });
  c.on('reader-executor', () => {
    s.play(execHi.to(1, { duration: clampDur(c, c.cue('reader-executor').start, 0.35) }));
  });
  c.on('reader-fields', () => {
    s.play(fieldCross.to(1, { duration: clampDur(c, c.cue('reader-fields').start, 0.35) }));
  });
  c.on('reader-id', () => {
    s.play(regexHi.to(1, { duration: clampDur(c, c.cue('reader-id').start, 0.35) }));
  });
  c.on('reader-source', () => {
    s.play(srcAttach.to(1, { duration: clampDur(c, c.cue('reader-source').start, 0.35) }));
  });
  c.on('reader-long', () => {
    s.play(longMode.to(1, { duration: clampDur(c, c.cue('reader-long').start, 0.4) }));
  });
  // Strict prediction withholding: reveal NONE only AFTER spoken clause!
  c.after('reader-no-id', () => {
    s.play(noIdReveal.to(1, { duration: clampDur(c, c.cue('reader-no-id').end, 0.35) }));
  });
}
