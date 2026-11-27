// Scene 17: parameter-boundaries - Keep validated strings in data positions
// Four Downstream Execution Boundary Conduits:
//   1. SQL bound parameter (`%s` + tuple)
//   2. Subprocess fixed `argv` with `shell=False` + allowlisted flags
//   3. URL/SSRF scheme/host/IP & per-hop redirect firewall
//   4. Symlink-resolved path containment under explicit root + short-lived scoped creds
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  energyRail,
  guardedDynamic,
  hexGate,
  txt,
} from '../parts.mjs';

export default function parameterBoundaries(s, c) {
  const pulse = s.value(0);
  const sqlOn = s.value(0);
  const boundOn = s.value(0);
  const execOn = s.value(0);
  const argvOn = s.value(0);
  const urlOn = s.value(0);
  const pathOn = s.value(0);
  const symOn = s.value(0);

  const header = cinemaHeader(
    'DOWNSTREAM PARAMETER BOUNDARIES',
    'Keep validated strings',
    'strictly in data positions',
    { accent: ROLE.runtime, size: 46 },
  );

  const stageAura = aura(120, 40, 620, '#5ce1e61e', '#6ee7b71a');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = 0;
      const sq = sqlOn.value;
      const bd = boundOn.value;
      const ex = execOn.value;
      const av = argvOn.value;
      const ur = urlOn.value;
      const pt = pathOn.value;
      const sy = symOn.value;
      const nodes = [];

      const lanes = [
        {
          y: -155,
          title: '1. SQL QUERY',
          safe: 'cursor.execute("... WHERE id = %s", (release_id,))',
          rule: 'Bound tuple parameter · never f-string interpolate',
          col: ROLE.runtime,
          op: 0.45 + Math.max(sq, bd) * 0.55,
          glow: bd > 0.35,
        },
        {
          y: -15,
          title: '2. SUBPROCESS',
          safe: 'run(["tool", "--id", release_id], shell=False)',
          rule: 'Fixed argv + allowlisted flags · no shell parsing',
          col: ROLE.proposal,
          op: 0.35 + Math.max(ex, av) * 0.65,
          glow: av > 0.35,
        },
        {
          y: 125,
          title: '3. URL / SSRF',
          safe: 'Allowlist scheme + host + resolved IP per hop',
          rule: 'Disable redirects or validate every hop · block metadata IPs',
          col: ROLE.caution,
          op: 0.35 + ur * 0.65,
          glow: ur > 0.35,
        },
        {
          y: 265,
          title: '4. FILE PATHS',
          safe: 'realpath(path).is_relative_to(REVIEWED_ROOT)',
          rule: 'Resolve symlinks (substring ".." test is insufficient)',
          col: ROLE.ok,
          op: 0.35 + Math.max(pt, sy) * 0.65,
          glow: sy > 0.35,
        },
      ];

      lanes.forEach((ln, i) => {
        nodes.push(
          energyRail(-855, ln.y - 42, ln.y + 42, ln.col, { opacity: ln.op }),
          txt(ln.title, -825, ln.y - 18, 26, ln.col, 'mono', 'left')
            .glow(ln.glow ? 7 : 0, ln.col)
            .opacity(ln.op),
          txt(ln.safe, -530, ln.y - 18, 26, COSMOS.ink, 'mono', 'left').opacity(ln.op),
          txt(ln.rule, -530, ln.y + 26, 26, COSMOS.muted, 'sans', 'left').opacity(ln.op),
          beamWithPhotons(
            [
              [555, ln.y],
              [675, ln.y],
            ],
            ln.col,
            p * 1.1 + i * 0.25,
            { alpha: ln.op, width: 3.2 },
          ),
          hexGate(775, ln.y, 50, ln.col, { label: 'DATA', opacity: ln.op, glow: ln.glow ? 12 : 5 }),
        );
      });

      nodes.push(
        line([-855, 350], [840, 350], { stroke: '#25355a', width: 2 }),
        txt(
          'Cap payload bytes, calls & concurrency · Use short-lived tool-scoped credentials',
          0,
          402,
          26,
          pt > 0.35 ? ROLE.focus : COSMOS.muted,
          'mono',
          'center',
        ).glow(pt > 0.35 ? 6 : 0, ROLE.focus),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);

  c.on('tu-parameter-boundaries-1', () => {
    s.play(sqlOn.to(1, { duration: clampDur(c, c.cue('tu-parameter-boundaries-1').start, 0.3) }));
  });
  c.on('tu-sql-bound-value', () => {
    s.play(boundOn.to(1, { duration: clampDur(c, c.cue('tu-sql-bound-value').start, 0.35) }));
  });
  c.on('tu-parameter-boundaries-2', () => {
    s.play(execOn.to(1, { duration: clampDur(c, c.cue('tu-parameter-boundaries-2').start, 0.3) }));
  });
  c.on('tu-argv-shell-false', () => {
    s.play(argvOn.to(1, { duration: clampDur(c, c.cue('tu-argv-shell-false').start, 0.35) }));
  });
  c.on('tu-url-redirect', () => {
    s.play(urlOn.to(1, { duration: clampDur(c, c.cue('tu-url-redirect').start, 0.35) }));
  });
  c.on('tu-parameter-boundaries-3', () => {
    s.play(pathOn.to(1, { duration: clampDur(c, c.cue('tu-parameter-boundaries-3').start, 0.35) }));
  });
  c.on('tu-path-resolved', () => {
    s.play(symOn.to(1, { duration: clampDur(c, c.cue('tu-path-resolved').start, 0.35) }));
  });
}
