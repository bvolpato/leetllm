import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  glowDot,
  guardedDynamic,
  txt,
} from '../parts.mjs';

export function buildUploadBoundary(s, c) {
  s.add(aura(-480, -40, 560, ROLE.ed, COSMOS.bg));
  s.add(aura(480, 100, 560, ROLE.ok, COSMOS.bg));

  s.add(
    cinemaHeader(
      'CLIENT SECRET BOUNDARY',
      'Redact before upload,',
      'block placeholder collisions',
      {
        x: -860,
        y: -445,
        accent: ROLE.ok,
        size: 46,
      },
    ),
  );

  const redactT = s.value(0);
  const collideT = s.value(0);
  const returnT = s.value(0);
  const auditT = s.value(0);
  c.on('cc-redacted-before-upload', () =>
    s.play(
      redactT.to(1, { duration: clampDur(c, c.cue('cc-redacted-before-upload').start, 0.55) }),
    ),
  );
  c.on('cc-placeholder-collision', () =>
    s.play(collideT.to(1, { duration: clampDur(c, c.cue('cc-placeholder-collision').start, 0.5) })),
  );
  c.on('cc-return-placeholder', () =>
    s.play(returnT.to(1, { duration: clampDur(c, c.cue('cc-return-placeholder').start, 0.55) })),
  );
  c.on('cc-telemetry-fields', () =>
    s.play(auditT.to(1, { duration: clampDur(c, c.cue('cc-telemetry-fields').start, 0.55) })),
  );

  // Vertical laptop / remote boundary line at x = 20
  s.add(line([20, -245], [20, 440], { stroke: ROLE.focus, width: 3.5, dash: [12, 8] }));
  s.add(txt('CLIENT LAPTOP (LOCAL)', -420, -238, 28, ROLE.ed, 'mono', 'center'));
  s.add(txt('REMOTE SERVICE', 460, -238, 28, ROLE.gpu, 'mono', 'center'));

  s.add(
    guardedDynamic(
      () => 1,
      () => {
        const rd = redactT.value;
        const col = collideT.value;
        const ret = returnT.value;
        const aud = auditT.value;
        const nodes = [];

        // Row 1: Secret -> local placeholder map -> redacted prompt crosses
        const y1 = -132;
        nodes.push(
          txt(
            rd > 0.5 ? 'API_KEY = "<SECRET_1>"' : 'API_KEY = "demo_tok_98a7"',
            -840,
            y1,
            28,
            rd > 0.5 ? ROLE.ok : ROLE.warn,
            'mono',
            'left',
          ),
        );
        if (rd > 0.4) {
          nodes.push(
            txt(
              'LOCAL MAP: <SECRET_1> -> demo_tok_98a7',
              -840,
              y1 + 42,
              26,
              COSMOS.muted,
              'mono',
              'left',
            ).opacity(rd),
          );
          nodes.push(
            beamWithPhotons(
              [
                [-130, y1],
                [230, y1],
              ],
              ROLE.ok,
              0,
              { alpha: rd },
            ),
          );
          nodes.push(txt('REDACTED PROMPT ONLY', 260, y1, 28, ROLE.ok, 'mono', 'left').opacity(rd));
        }

        // Row 2: Collision stop when file already contains placeholder
        const y2 = 24;
        const colAlpha = 0.28 + 0.72 * col;
        nodes.push(
          txt(
            'FILE ALREADY HAS "<SECRET_1>"',
            -840,
            y2,
            28,
            col > 0.5 ? ROLE.fail : COSMOS.muted,
            'mono',
            'left',
          ).opacity(colAlpha),
        );
        if (col > 0.4) {
          nodes.push(line([-130, y2], [-15, y2], { stroke: ROLE.fail, width: 3.5 }).opacity(col));
          nodes.push(glowDot(-12, y2, { radius: 11, color: ROLE.fail, glow: 10, opacity: col }));
          nodes.push(
            txt('STOP BEFORE UPLOAD (COLLISION)', 68, y2, 28, ROLE.fail, 'mono', 'left').opacity(
              col,
            ),
          );
          nodes.push(
            txt('KEEPS TWO VALUES DISTINCT', 68, y2 + 42, 26, COSMOS.muted, 'mono', 'left').opacity(
              col,
            ),
          );
        }

        // Row 3: Return path keeps placeholder visible for human review
        const y3 = 186;
        const retAlpha = 0.25 + 0.75 * ret;
        nodes.push(
          txt('NO AUTO-RESTORE OF SECRETS', -840, y3, 28, ROLE.focus, 'mono', 'left').opacity(
            retAlpha,
          ),
        );
        nodes.push(
          txt(
            'REVIEW PLACEHOLDER LOCALLY',
            -840,
            y3 + 42,
            26,
            COSMOS.muted,
            'mono',
            'left',
          ).opacity(retAlpha),
        );
        if (ret > 0.4) {
          nodes.push(
            beamWithPhotons(
              [
                [230, y3],
                [-130, y3],
              ],
              ROLE.focus,
              0,
              { alpha: ret },
            ),
          );
          nodes.push(
            txt('COMMENTS = UNTRUSTED DATA', 260, y3, 26, ROLE.warn, 'mono', 'left').opacity(ret),
          );
          nodes.push(
            txt('CACHE HONORS AUTH SCOPE', 260, y3 + 42, 26, COSMOS.muted, 'mono', 'left').opacity(
              ret,
            ),
          );
        }

        // Row 4: Separate minimal audit event crossing boundary
        const y4 = 352;
        const audAlpha = 0.25 + 0.75 * aud;
        nodes.push(
          txt('SEPARATE AUDIT EVENT', -840, y4, 28, ROLE.ed, 'mono', 'left').opacity(audAlpha),
        );
        nodes.push(
          txt('PROMPT TEXT STAYS OUT', -840, y4 + 42, 26, ROLE.ok, 'mono', 'left').opacity(
            audAlpha,
          ),
        );
        if (aud > 0.4) {
          nodes.push(
            beamWithPhotons(
              [
                [-130, y4],
                [230, y4],
              ],
              ROLE.ed,
              0,
              { alpha: aud },
            ),
          );
          nodes.push(
            txt('{ tenant, model, latency_bucket }', 260, y4, 28, ROLE.ed, 'mono', 'left').opacity(
              aud,
            ),
          );
          nodes.push(
            txt(
              'CHECK PROXY, CRASH, SDK LOGS',
              260,
              y4 + 42,
              26,
              COSMOS.muted,
              'mono',
              'left',
            ).opacity(aud),
          );
        }

        return group(...nodes);
      },
    ),
  );
}
