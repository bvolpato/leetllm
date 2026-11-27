// Scene 11: strict-proposal - Validate decoded fields before checking permission
// Live 3-key strict action decoder powered directly by `validateDecodedAction`, paired with
// a comparative UTF-8 byte vs character ribbon (300 'é' chars = 600 bytes > 512 limit) and
// Structured Outputs vs JSON mode vs permission boundary separation.
import { group, line } from 'vizmatic/stage';
import {
  CHAR_LIMIT,
  COSMOS,
  PARSER_VALID_PAIRS,
  ROLE,
  UTF8_SAMPLE_BYTES,
  UTF8_SAMPLE_CHARS,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  energyRail,
  glowMeter,
  guardedDynamic,
  hexGate,
  quadArcPts,
  txt,
  validateDecodedAction,
} from '../parts.mjs';

export default function strictProposal(s, c) {
  const pulse = s.value(0);
  const parserHi = s.value(0);
  const utf8Hi = s.value(0);
  const structHi = s.value(0);

  const probeRows = [
    {
      label: 'Valid 3 keys: C17 + R42',
      res: validateDecodedAction(PARSER_VALID_PAIRS, 80),
    },
    {
      label: 'Duplicate action key',
      res: validateDecodedAction([...PARSER_VALID_PAIRS, ['action', 'answer_eval']], 90),
    },
    {
      label: 'Extra key or bool suite',
      res: validateDecodedAction(
        [PARSER_VALID_PAIRS[0], PARSER_VALID_PAIRS[1], ['eval_suite', true]],
        80,
      ),
    },
    {
      label: '513 chars (> 512 limit)',
      res: validateDecodedAction(PARSER_VALID_PAIRS, 513),
    },
  ];

  const header = cinemaHeader(
    'STRICT DECODED PROPOSAL PARSER',
    'Validate decoded fields',
    'before checking permission',
    { accent: ROLE.host, size: 48 },
  );

  const stageAura = aura(150, 30, 620, '#5ce1e61a', '#ff6b8b18');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = 0;
      const ph = parserHi.value;
      const u8 = utf8Hi.value;
      const sh = structHi.value;
      const nodes = [];

      // Top Left: 4 verified parser probes (ample separation between label & right verdict!)
      nodes.push(
        txt(
          'EXACT 3 KEYS: action · candidate_id · eval_suite',
          -855,
          -218,
          26,
          ROLE.host,
          'mono',
          'left',
        ),
      );
      probeRows.forEach((row, i) => {
        const y = -152 + i * 68;
        const ok = row.res.accepted;
        const col = ok ? ROLE.ok : ROLE.denied;
        nodes.push(
          energyRail(-855, y - 20, y + 20, col, { width: 5, glow: 7 }),
          txt(row.label, -828, y, 26, COSMOS.ink, 'mono', 'left'),
          txt(ok ? 'ADMIT' : `REJECT (${row.res.reason})`, 145, y, 26, col, 'mono', 'right').glow(
            ph > 0.3 ? 6 : 2,
            col,
          ),
          line([-828, y + 32], [145, y + 32], { stroke: '#202d4e', width: 1.4 }),
        );
      });

      // Top Right: Strict Decoder Gate (compact label so sub & pattern line never collide!)
      const gateX = 540;
      const gateY = -88;
      const feedArc = quadArcPts([165, -88], [gateX - 105, gateY], 0, 18);
      nodes.push(
        beamWithPhotons(feedArc, ROLE.host, p * 1.1, { width: 3.4 }),
        hexGate(gateX, gateY, 60, ROLE.host, {
          label: 'PARSER',
          sub: 'NO DUP KEYS',
          glow: 10,
        }),
        txt('answer_eval | request_promotion', gateX, 82, 26, ROLE.ok, 'mono', 'center'),
        txt('^C\\d{1,6}$  ·  ^R\\d{1,6}$', gateX, 122, 26, COSMOS.muted, 'mono', 'center'),
      );

      // Divider
      nodes.push(line([-855, 158], [845, 158], { stroke: '#25355a', width: 2 }));

      // Bottom Left: UTF-8 Byte vs Character Ribbon (meter cleanly right of 26px labels!)
      const uAlpha = 0.45 + u8 * 0.55;
      const meterX = -855;
      const barLeft = -540;
      const barW = 480;
      const scaleMax = 650;
      const limLineX = barLeft + (CHAR_LIMIT / scaleMax) * barW;

      nodes.push(
        txt(
          'CHARACTERS vs UTF-8 BYTES ("é" × 300)',
          meterX,
          198,
          26,
          ROLE.focus,
          'mono',
          'left',
        ).opacity(uAlpha),
        txt(
          `CHARS: ${UTF8_SAMPLE_CHARS}/${CHAR_LIMIT}`,
          meterX,
          250,
          26,
          ROLE.ok,
          'mono',
          'left',
        ).opacity(uAlpha),
        glowMeter(barLeft, 250, barW, 26, UTF8_SAMPLE_CHARS / scaleMax, {
          fill: ROLE.ok,
          opacity: uAlpha,
        }),
        txt(`UTF-8: ${UTF8_SAMPLE_BYTES} B`, meterX, 312, 26, ROLE.attack, 'mono', 'left').opacity(
          uAlpha,
        ),
        glowMeter(barLeft, 312, barW, 26, UTF8_SAMPLE_BYTES / scaleMax, {
          fill: ROLE.attack,
          opacity: uAlpha,
        }),
        line([limLineX, 224], [limLineX, 340], {
          stroke: ROLE.focus,
          width: 2.6,
          dash: [6, 6],
        }).opacity(uAlpha),
        txt(
          'Enforce transport BYTE limit before decoding!',
          meterX,
          376,
          26,
          ROLE.untrusted,
          'mono',
          'left',
        ).opacity(uAlpha),
      );

      // Bottom Right: Structured Outputs vs JSON Mode vs Permission
      const sAlpha = 0.45 + sh * 0.55;
      nodes.push(
        energyRail(20, 188, 395, sh > 0.3 ? ROLE.host : '#334673', { width: 5, opacity: sAlpha }),
        txt('STRUCTURED OUTPUTS ≠ PERMISSION', 48, 208, 26, ROLE.host, 'mono', 'left').opacity(
          sAlpha,
        ),
        txt(
          'Structured Outputs constrains schema subset',
          48,
          258,
          26,
          COSMOS.ink,
          'sans',
          'left',
        ).opacity(sAlpha),
        txt(
          'Handle refusal & incomplete paths first',
          48,
          308,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(sAlpha),
        txt(
          'Valid shape can still name wrong target',
          48,
          362,
          26,
          ROLE.attack,
          'mono',
          'left',
        ).opacity(sAlpha),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);

  c.on('pi-strict-proposal-0', () => {
    s.play(parserHi.to(1, { duration: clampDur(c, c.cue('pi-strict-proposal-0').start, 0.45) }));
  });
  c.on('pi-strict-proposal-1', () => {
    s.play(utf8Hi.to(1, { duration: clampDur(c, c.cue('pi-strict-proposal-1').start, 0.45) }));
  });
  c.on('pi-strict-proposal-2', () => {
    s.play(structHi.to(1, { duration: clampDur(c, c.cue('pi-strict-proposal-2').start, 0.45) }));
  });
}
