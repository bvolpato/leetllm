// Scene 22: deferred-definitions - Distinguish request catalog bytes from model-visible definitions
// Dual Token Budget Conduit comparing Eager Schemas vs OpenAI Deferred Tool Search (name+desc
// visible, schema deferred) vs Claude Regex/BM25 Deferred Search (in request catalog, out of initial context).
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  driftValue,
  energyRail,
  fadeInHalf,
  fadeOutHalf,
  glowMeter,
  guardedDynamic,
  hexGate,
  txt,
} from '../parts.mjs';

export default function deferredDefinitions(s, c) {
  const pulse = s.value(0);
  const act = s.value(0); // 0 = eager vs on-demand, 1 = OpenAI deferred, 2 = Claude deferred
  const oaiSchemaOn = s.value(0);
  const claudeCtxOn = s.value(0);
  const claudePropOn = s.value(0);

  const header = cinemaHeader(
    'DEFERRED TOOL DISCOVERY',
    'Separate request bytes',
    'from model-visible schemas',
    { accent: ROLE.deferred, size: 46 },
  );

  const stageAura = aura(150, 40, 620, '#fb923c1a', '#5ce1e61a');

  // Act 0: Eager vs On-Demand Token Load
  const act0 = guardedDynamic(
    () => fadeOutHalf(Math.min(1, act.value)),
    (a) => {
      const p = pulse.value;
      const nodes = [];

      nodes.push(
        txt(
          'EAGER FULL CATALOG (EVERY SCHEMA UP FRONT)',
          -855,
          -195,
          26,
          ROLE.denied,
          'mono',
          'left',
        ).opacity(a),
        glowMeter(-855, -135, 1680, 34, 0.92, { fill: ROLE.denied, opacity: a }),
        txt(
          'High prompt tokens · Diluted tool selection across dozens of unused tools',
          -855,
          -75,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(a),
        txt(
          'ON-DEMAND / DEFERRED DISCOVERY (LOAD ONLY NEEDED SCHEMAS)',
          -855,
          45,
          26,
          ROLE.ok,
          'mono',
          'left',
        ).opacity(a),
        glowMeter(-855, 105, 1680, 34, 0.16, { fill: ROLE.ok, opacity: a }),
        beamWithPhotons(
          [
            [-580, 105],
            [680, 105],
          ],
          ROLE.ok,
          p * 1.1,
          { alpha: a, width: 3 },
        ),
        txt(
          'Status lookup + Policy lookup fetched only when the task needs them',
          -855,
          168,
          26,
          COSMOS.ink,
          'sans',
          'left',
        ).opacity(a),
        line([-855, 260], [840, 260], { stroke: '#25355a', width: 2 }).opacity(a),
        txt(
          'Measure:  tool discovery recall  ·  task completion  ·  total tokens  ·  latency',
          0,
          330,
          28,
          ROLE.focus,
          'mono',
          'center',
        )
          .glow(6, ROLE.focus)
          .opacity(a),
      );

      return group(...nodes);
    },
  );

  // Act 1: OpenAI Responses Deferred Tool Search
  const act1 = guardedDynamic(
    () => fadeInHalf(Math.min(1, act.value)) * fadeOutHalf(Math.max(0, act.value - 1)),
    (a) => {
      const p = pulse.value;
      const sc = oaiSchemaOn.value;
      const nodes = [];

      nodes.push(
        txt('OPENAI RESPONSES TOOL SEARCH', -855, -205, 28, ROLE.proposal, 'mono', 'left').opacity(
          a,
        ),
        energyRail(-855, -140, 85, ROLE.proposal, { opacity: a }),
        txt('INITIAL MODEL VIEW', -825, -120, 26, ROLE.proposal, 'mono', 'left').opacity(a),
        txt('name + description  (visible)', -825, -60, 28, COSMOS.ink, 'mono', 'left').opacity(a),
        txt(
          'namespaces / MCP group shared desc',
          -825,
          0,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(a),
        txt('parameter schema -> DEFERRED', -825, 56, 26, ROLE.deferred, 'mono', 'left')
          .glow(sc > 0.35 ? 6 : 0, ROLE.deferred)
          .opacity(a),
        beamWithPhotons(
          [
            [-140, -25],
            [75, -25],
          ],
          ROLE.deferred,
          p * 1.1,
          { alpha: a, width: 3.5 },
        ),
        hexGate(165, -25, 76, ROLE.deferred, { label: 'SEARCH', opacity: a }),
        beamWithPhotons(
          [
            [255, -25],
            [420, -25],
          ],
          ROLE.ok,
          p * 1.1 + 0.5,
          { alpha: a * (0.4 + sc * 0.6), width: 3.5 },
        ),
        energyRail(445, -140, 85, ROLE.ok, { opacity: a }),
        txt('LOADED ON DEMAND', 475, -120, 26, ROLE.ok, 'mono', 'left').opacity(a),
        txt('Full JSON parameter', 475, -60, 28, COSMOS.ink, 'mono', 'left').opacity(a),
        txt('schema enters context', 475, -8, 28, ROLE.ok, 'mono', 'left').opacity(a),
        line([-855, 190], [840, 190], { stroke: '#25355a', width: 2 }).opacity(a),
        txt(
          'HOSTED DISCOVERY: searches declared inventory',
          -855,
          255,
          26,
          ROLE.runtime,
          'mono',
          'left',
        ).opacity(a),
        txt(
          'CLIENT DISCOVERY: consults application’s live permitted catalog',
          -855,
          318,
          26,
          ROLE.ok,
          'mono',
          'left',
        ).opacity(a),
      );

      return group(...nodes);
    },
  );

  // Act 2: Claude Regex / BM25 Deferred Tool Search
  const act2 = guardedDynamic(
    () => fadeInHalf(Math.max(0, act.value - 1)),
    (a) => {
      const p = pulse.value;
      const cc = claudeCtxOn.value;
      const cp = claudePropOn.value;
      const nodes = [];

      nodes.push(
        txt(
          'CLAUDE TOOL SEARCH  (REGEX  |  BM25)',
          -855,
          -205,
          28,
          ROLE.mcp,
          'mono',
          'left',
        ).opacity(a),
        energyRail(-855, -135, 95, ROLE.caution, { opacity: a }),
        txt('REQUEST CATALOG BYTES', -825, -115, 26, ROLE.caution, 'mono', 'left').opacity(a),
        txt(
          'Full deferred definitions sent in API request',
          -825,
          -55,
          26,
          COSMOS.ink,
          'sans',
          'left',
        ).opacity(a),
        txt('Held OUT of initial model context', -825, 8, 28, ROLE.mcp, 'mono', 'left')
          .glow(cc > 0.35 ? 6 : 0, ROLE.mcp)
          .opacity(a),
        txt(
          'until regex / BM25 search discovers them',
          -825,
          64,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(a),
        beamWithPhotons(
          [
            [65, -20],
            [270, -20],
          ],
          ROLE.ok,
          p * 1.1,
          { alpha: a * (0.4 + cp * 0.6), width: 3.6 },
        ),
        energyRail(295, -135, 95, ROLE.ok, { opacity: a * (0.4 + cp * 0.6) }),
        txt('DISCOVERED CLIENT TOOL', 325, -115, 26, ROLE.ok, 'mono', 'left').opacity(
          a * (0.4 + cp * 0.6),
        ),
        txt('Ordinary tool_use proposal', 325, -52, 28, COSMOS.ink, 'mono', 'left').opacity(
          a * (0.4 + cp * 0.6),
        ),
        txt('Host validates & executes', 325, 10, 28, ROLE.ok, 'mono', 'left')
          .glow(cp > 0.35 ? 6 : 0, ROLE.ok)
          .opacity(a * (0.4 + cp * 0.6)),
        line([-855, 200], [840, 200], { stroke: '#25355a', width: 2 }).opacity(a),
        txt(
          'Similar feature names != identical visibility, schema, or message formats',
          0,
          285,
          30,
          ROLE.focus,
          'serif',
          'center',
        )
          .glow(6, ROLE.focus)
          .opacity(a),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, act0, act1, act2);
  driftValue(s, c, pulse, 5.2, { startOffset: 0.1, endMargin: 0.5 });

  c.on('tu-deferred-definitions-1', () => {
    s.play(
      pulse.to(0.3, { duration: clampDur(c, c.cue('tu-deferred-definitions-1').start, 0.25) }),
    );
  });
  c.on('tu-deferred-definitions-2', () => {
    s.play(act.to(1, { duration: clampDur(c, c.cue('tu-deferred-definitions-2').start, 0.35) }));
  });
  c.on('tu-defer-schema', () => {
    s.play(oaiSchemaOn.to(1, { duration: clampDur(c, c.cue('tu-defer-schema').start, 0.35) }));
  });
  c.on('tu-deferred-definitions-3', () => {
    s.play(act.to(2, { duration: clampDur(c, c.cue('tu-deferred-definitions-3').start, 0.35) }));
  });
  c.on('tu-defer-claude', () => {
    s.play(claudeCtxOn.to(1, { duration: clampDur(c, c.cue('tu-defer-claude').start, 0.35) }));
  });
  c.on('tu-defer-proposal', () => {
    s.play(claudePropOn.to(1, { duration: clampDur(c, c.cue('tu-defer-proposal').start, 0.35) }));
  });
}
