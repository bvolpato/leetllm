// Scene 21: router-dispatch - Where should this request go?
// Illuminated 4-way keyword/classifier dispatch prism: CI -> Build, Schema -> Migrations,
// Handbook -> Docs, and ambiguous multi-match ("CI failed during schema migration") -> Review!
import { group } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  guardedDynamic,
  orbNode,
  quadArcPts,
  txt,
} from '../parts.mjs';

export default function routerDispatch(s, c) {
  const pulse = s.value(0);
  const buildOn = s.value(0);
  const schemaOn = s.value(0);
  const docsOn = s.value(0);
  const ambigOn = s.value(0);
  const singleDocsOn = s.value(0);

  const header = cinemaHeader('ROUTER DISPATCH PATTERN', 'Where should this', 'request go?', {
    accent: ROLE.action,
    size: 50,
  });

  const stageAura = aura(160, 40, 620, '#5ce1e61e', '#fb923c1a');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = 0;
      const bd = buildOn.value;
      const sc = schemaOn.value;
      const dc = docsOn.value;
      const am = ambigOn.value;
      const sd = singleDocsOn.value;
      const nodes = [];

      const reqPt = [-640, 30];
      const rtrPt = [-220, 30];

      const isAmbig = am > 0.35 && sd < 0.35;
      const isDocs = sd > 0.35;

      const reqLabel = isDocs
        ? '“Read the documentation”'
        : isAmbig
          ? '“CI failed during schema migration”'
          : 'Incoming request';

      nodes.push(
        txt('REQUEST', reqPt[0], reqPt[1] - 92, 26, COSMOS.muted, 'mono', 'center'),
        orbNode(reqPt[0], reqPt[1], 'IN', isAmbig ? ROLE.caution : ROLE.action, { radius: 48 }),
        txt(
          reqLabel,
          reqPt[0] + 90,
          reqPt[1] + 100,
          26,
          isAmbig ? ROLE.caution : COSMOS.ink,
          'serif',
          'center',
        ),
        beamWithPhotons(
          [
            [reqPt[0] + 58, reqPt[1]],
            [rtrPt[0] - 88, rtrPt[1]],
          ],
          isAmbig ? ROLE.caution : ROLE.action,
          p * 1.1,
          { width: 3.6 },
        ),
        orbNode(rtrPt[0], rtrPt[1], 'ROUTER', ROLE.host, {
          radius: 76,
          sub: 'Host maps category',
        }),
      );

      const lanes = [
        {
          y: -210,
          id: 'BUILD',
          kw: 'CI -> Build',
          col: ROLE.action,
          on: isAmbig ? 1 : isDocs ? 0.25 : 0.35 + bd * 0.65,
        },
        {
          y: -50,
          id: 'SCHEMA',
          kw: 'Schema -> Migrations',
          col: ROLE.policy,
          on: isAmbig ? 1 : isDocs ? 0.25 : 0.35 + sc * 0.65,
        },
        {
          y: 110,
          id: 'DOCS',
          kw: 'Handbook -> Docs (read-only)',
          col: ROLE.ok,
          on: isDocs ? 1 : isAmbig ? 0.25 : 0.35 + dc * 0.65,
        },
        {
          y: 270,
          id: 'REVIEW',
          kw: '0 or >1 matches -> held!',
          col: ROLE.caution,
          on: isAmbig ? 1 : 0.35,
        },
      ];

      lanes.forEach((ln, i) => {
        const destX = 240;
        nodes.push(
          beamWithPhotons(
            quadArcPts([rtrPt[0] + 88, rtrPt[1]], [destX - 88, ln.y], (i - 1.5) * 18),
            ln.col,
            p * 1.1 + i * 0.24,
            {
              alpha: ln.on,
              width: ln.on > 0.85 ? 4.0 : 2.2,
            },
          ),
          orbNode(destX, ln.y, ln.id, ln.col, { radius: 68, opacity: ln.on }),
          txt(ln.kw, destX + 94, ln.y, 26, ln.col, 'mono', 'left').opacity(ln.on),
        );
      });

      nodes.push(
        txt(
          isDocs
            ? '1 MATCH -> READ-ONLY HANDLER  ·  CALIBRATE CLASSIFIER THRESHOLD ON LABELED CASES'
            : isAmbig
              ? '2 MATCHES (CI + SCHEMA) -> AMBIGUOUS -> HELD FOR REVIEW'
              : 'Router dispatches single unambiguous match to specialist or workflow',
          0,
          380,
          26,
          isAmbig ? ROLE.caution : isDocs ? ROLE.ok : COSMOS.muted,
          'mono',
          'center',
        ),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);

  c.on('aa-router-dispatch-0', () => {
    s.play(pulse.to(0.3, { duration: clampDur(c, c.cue('aa-router-dispatch-0').start, 0.25) }));
  });
  c.on('router-build', () => {
    s.play(buildOn.to(1, { duration: clampDur(c, c.cue('router-build').start, 0.35) }));
  });
  c.on('router-schema', () => {
    s.play(schemaOn.to(1, { duration: clampDur(c, c.cue('router-schema').start, 0.35) }));
  });
  c.on('router-handbook', () => {
    s.play(docsOn.to(1, { duration: clampDur(c, c.cue('router-handbook').start, 0.35) }));
  });
  c.on('aa-router-dispatch-1', () => {
    s.play(ambigOn.to(0.5, { duration: clampDur(c, c.cue('aa-router-dispatch-1').start, 0.25) }));
  });
  c.on('router-ambiguous', () => {
    s.play(ambigOn.to(1, { duration: clampDur(c, c.cue('router-ambiguous').start, 0.35) }));
  });
  c.on('router-docs', () => {
    s.play(singleDocsOn.to(1, { duration: clampDur(c, c.cue('router-docs').start, 0.35) }));
  });
}
