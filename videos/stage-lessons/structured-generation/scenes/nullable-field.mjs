// Scene 15: nullable-field - What goes in the job field?
// Build log beacon ("Build failed.") beside strict schema failing_job: str | None (required).
// STRICT prediction withholding on BOTH Beat 0 (hold 2.6s: omitted vs null) AND Beat 2
// (hold 2.6s: null vs "tests" justified by log)! Reveals verdicts only via c.after(...).
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  driftValue,
  guardedDynamic,
  nullableRecord,
  opticalRail,
  txt,
} from '../parts.mjs';

const BASE = { run_id: 'RUN-916', status: 'failed' };
const CANDS = [
  { label: '(field omitted)', payload: BASE },
  { label: '"failing_job": null', payload: { ...BASE, failing_job: null } },
  { label: '"failing_job": "tests"', payload: { ...BASE, failing_job: 'tests' } },
];

export default function nullableField(s, c) {
  const pulse = s.value(0);
  const q1Hi = s.value(0);
  const omitVerdict = s.value(0);
  const nullVerdict = s.value(0);
  const strictNote = s.value(0);
  const strShow = s.value(0);
  const evidAsk = s.value(0);
  const sourceVerdict = s.value(0);

  const header = cinemaHeader('REQUIRED NULLABLE UNIONS', 'What goes in the', 'job field?', {
    accent: ROLE.fsm,
    size: 50,
  });

  const stageAura = aura(220, 40, 640, '#5ce1e61e', '#ffd16618');

  const stageView = guardedDynamic(
    () => 1,
    () => {
      const q1 = q1Hi.value;
      const ov = omitVerdict.value;
      const nv = nullVerdict.value;
      const sn = strictNote.value;
      const ss = strShow.value;
      const ea = evidAsk.value;
      const sv = sourceVerdict.value;
      const nodes = [];

      // Top twin beacons: Build Log vs Required Nullable Contract
      nodes.push(
        opticalRail(-840, -255, -145, ROLE.prefix),
        txt('ENTIRE BUILD LOG', -805, -240, 26, ROLE.prefix, 'mono', 'left'),
        txt('“Build failed.”', -805, -176, 44, COSMOS.ink, 'serif', 'left').glow(6, ROLE.prefix),

        opticalRail(40, -255, -145, ROLE.fsm),
        txt('STRICT PYDANTIC / OPENAI SCHEMA', 75, -240, 26, ROLE.fsm, 'mono', 'left'),
        txt('failing_job: str | None', 75, -182, 38, ROLE.fsm, 'mono', 'left'),
        txt('REQUIRED KEY · NO DEFAULT', 75, -138, 26, COSMOS.muted, 'mono', 'left'),
        line([-840, -96], [840, -96], { stroke: '#25355a', width: 2 }),
      );

      // Column headers
      nodes.push(
        txt('CANDIDATE REPLY FIELD', -830, -48, 26, COSMOS.muted, 'mono', 'left'),
        txt('SCHEMA GATE', 40, -48, 26, COSMOS.muted, 'mono', 'left'),
        txt('LOG EVIDENCE', 430, -48, 26, COSMOS.muted, 'mono', 'left'),
      );

      // Row 0: Omitted key
      const y0 = 32;
      const ok0 = nullableRecord(CANDS[0].payload);
      nodes.push(
        txt(CANDS[0].label, -830, y0, 36, ov > 0.4 ? ROLE.prune : COSMOS.ink, 'mono', 'left'),
        txt(
          ov > 0.4 ? (ok0 ? 'PASS' : 'FAIL: MISSING KEY') : '?',
          40,
          y0,
          32,
          ov > 0.4 ? ROLE.prune : q1 > 0.3 ? ROLE.prefix : COSMOS.dim,
          'mono',
          'left',
        ).glow(ov > 0.4 ? 8 : 0, ROLE.prune),
        txt(ov > 0.4 ? 'blocked at schema' : '·', 430, y0, 26, COSMOS.dim, 'mono', 'left'),
      );

      // Row 1: Explicit null
      const y1 = 136;
      const ok1 = nullableRecord(CANDS[1].payload);
      nodes.push(
        txt(CANDS[1].label, -830, y1, 36, nv > 0.4 ? ROLE.legal : COSMOS.ink, 'mono', 'left'),
        txt(
          nv > 0.4 ? (ok1 ? 'PASS' : 'FAIL') : '?',
          40,
          y1,
          32,
          nv > 0.4 ? ROLE.legal : q1 > 0.3 ? ROLE.prefix : COSMOS.dim,
          'mono',
          'left',
        ).glow(nv > 0.4 ? 8 : 0, ROLE.legal),
        txt(
          sv > 0.4 ? 'SUPPORTED BY LOG' : ea > 0.3 ? '?' : '·',
          430,
          y1,
          28,
          sv > 0.4 ? ROLE.legal : ea > 0.3 ? ROLE.prefix : COSMOS.dim,
          'mono',
          'left',
        ).glow(sv > 0.4 ? 8 : 0, ROLE.legal),
      );

      // Row 2: String "tests" (appears on Beat 2)
      if (ss > 0.05) {
        const y2 = 240;
        const ok2 = nullableRecord(CANDS[2].payload);
        nodes.push(
          txt(CANDS[2].label, -830, y2, 36, ROLE.fsm, 'mono', 'left').opacity(ss),
          txt(ok2 ? 'PASS' : 'FAIL', 40, y2, 32, ROLE.legal, 'mono', 'left').opacity(ss),
          txt(
            sv > 0.4 ? 'INVENTED · NO JOB IN LOG' : ea > 0.3 ? '?' : 'check log',
            430,
            y2,
            28,
            sv > 0.4 ? ROLE.prune : ROLE.prefix,
            'mono',
            'left',
          )
            .glow(sv > 0.4 ? 8 : 0, ROLE.prune)
            .opacity(ss),
        );
      }

      // Bottom decision bar (respects prediction pauses!)
      if (ov < 0.05) {
        nodes.push(
          txt(
            'One reply omits the key; one writes null. Which one passes?',
            -830,
            358,
            34,
            ROLE.prefix,
            'serif',
            'left',
          ).glow(6, ROLE.prefix),
        );
      } else if (sv > 0.05) {
        nodes.push(
          txt('DASHBOARD:', -830, 358, 30, COSMOS.muted, 'mono', 'left').opacity(sv),
          txt('FAILED · JOB UNKNOWN', -560, 358, 36, ROLE.legal, 'mono', 'left')
            .glow(10, ROLE.legal)
            .opacity(sv),
        );
      } else if (ea > 0.05) {
        nodes.push(
          txt(
            'Both null and "tests" pass the schema. Which can you justify from the log?',
            -830,
            358,
            32,
            ROLE.prefix,
            'serif',
            'left',
          )
            .glow(6, ROLE.prefix)
            .opacity(ea),
        );
      } else if (sn > 0.05) {
        nodes.push(
          txt(
            'OpenAI strict schema: every listed property is required · additionalProperties: false',
            -830,
            358,
            28,
            ROLE.fsm,
            'mono',
            'left',
          ).opacity(sn),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, stageView);
  driftValue(s, c, pulse, 4.8, { startOffset: 0.1, endMargin: 0.5 });

  c.on('sg-job-question', () => {
    s.play(q1Hi.to(1, { duration: clampDur(c, c.cue('sg-job-question').start, 0.35) }));
  });
  // Strict prediction withholding on Beat 0: reveal fail & pass AFTER spoken clauses!
  c.after('sg-omitted-fail', () => {
    s.play(omitVerdict.to(1, { duration: clampDur(c, c.cue('sg-omitted-fail').end, 0.35) }));
  });
  c.after('sg-null-pass', () => {
    s.play(nullVerdict.to(1, { duration: clampDur(c, c.cue('sg-null-pass').end, 0.35) }));
  });
  c.on('sg-null-schema', () => {
    s.play(strictNote.to(1, { duration: clampDur(c, c.cue('sg-null-schema').start, 0.4) }));
  });
  c.on('sg-job-string', () => {
    s.play(strShow.to(1, { duration: clampDur(c, c.cue('sg-job-string').start, 0.4) }));
  });
  c.on('sg-job-evidence', () => {
    s.play(evidAsk.to(1, { duration: clampDur(c, c.cue('sg-job-evidence').start, 0.35) }));
  });
  // Strict prediction withholding on Beat 2: reveal "Job unknown" AFTER spoken clause!
  c.after('sg-null-source', () => {
    s.play(sourceVerdict.to(1, { duration: clampDur(c, c.cue('sg-null-source').end, 0.4) }));
  });
}
