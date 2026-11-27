// Scene 2: answer-contract - What does Alice's answer need to say?
// Two source passages feed attribution beams into a draft reply; dropping the final four words
// ("only with security approval.") visibly breaks applicability. Then RAG stages & conflict rules unfold.
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  SEARCH_TEXT,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  guardedDynamic,
  orbNode,
  quadArcPts,
  trimSeg,
  txt,
} from '../parts.mjs';

export default function answerContract(s, c) {
  const draftOn = s.value(0);
  const dropCond = s.value(0);
  const ragOn = s.value(0);
  const ruleOn = s.value(0);
  const conflictOn = s.value(0);

  const header = cinemaHeader('ANSWER REQUIREMENTS', 'Keep every governing', 'condition intact', {
    accent: ROLE.query,
    size: 46,
  });

  const stageAura = aura(0, 60, 700, '#5ce1e61a', '#6ee7b716');

  const view = guardedDynamic(
    () => 1,
    () => {
      const drop = dropCond.value;
      const rag = ragOn.value;
      const rl = ruleOn.value;
      const cf = conflictOn.value;
      const nodes = [];

      // Top right: two original source passages remain readable throughout
      nodes.push(
        rect(680, 148, { fill: '#0d1528', stroke: ROLE.policy, width: 2.5, radius: 12 }).at(
          -140,
          -175,
        ),
        txt('policy@2  ·  workspace-a', -450, -218, 26, ROLE.policy, 'mono', 'left'),
        txt(SEARCH_TEXT.policy.slice(0, 46), -450, -172, 26, COSMOS.ink, 'sans', 'left'),
        txt(SEARCH_TEXT.policy.slice(46).trim(), -450, -134, 26, COSMOS.muted, 'sans', 'left'),

        rect(680, 148, { fill: '#0d1a24', stroke: ROLE.exception, width: 2.5, radius: 12 }).at(
          520,
          -175,
        ),
        txt('exception@1  ·  conditional', 210, -218, 26, ROLE.exception, 'mono', 'left'),
        txt(SEARCH_TEXT.exception.slice(0, 48), 210, -172, 26, COSMOS.ink, 'sans', 'left'),
        txt(SEARCH_TEXT.exception.slice(48).trim(), 210, -134, 26, ROLE.exception, 'sans', 'left'),
      );

      // Left legend column
      nodes.push(
        txt('SOURCES REMAIN', -855, -210, 26, COSMOS.muted, 'mono', 'left'),
        txt('IMMUTABLE', -855, -168, 28, ROLE.query, 'mono', 'left'),
      );

      if (rag < 0.5 && rl < 0.5) {
        // Beat 0: Draft reply losing the final 4 words
        nodes.push(
          beamWithPhotons(quadArcPts([-140, -100], [-180, 10], -10), ROLE.policy, 0, {
            width: 3,
            glow: 7,
          }),
          beamWithPhotons(quadArcPts([520, -100], [340, 10], -10), ROLE.exception, 0, {
            width: 3,
            glow: 7,
            alpha: 1 - 0.55 * drop,
          }),
          rect(1680, 196, {
            fill: '#0e1629',
            stroke: drop > 0.5 ? ROLE.deny : ROLE.query,
            width: 2.8,
            radius: 14,
          })
            .at(0, 118)
            .glow(8, drop > 0.5 ? ROLE.deny : ROLE.query),
          txt(
            drop > 0.5 ? 'DRAFT REPLY: CONDITION DROPPED' : 'DRAFT REPLY TO ALICE',
            -805,
            56,
            26,
            drop > 0.5 ? ROLE.deny : ROLE.query,
            'mono',
            'left',
          ),
          txt(
            'General rule: start within 30 days of the notice.',
            -805,
            114,
            32,
            ROLE.policy,
            'sans',
            'left',
          ),
          txt(
            'Service accounts may start within 60 days',
            -805,
            174,
            32,
            COSMOS.ink,
            'sans',
            'left',
          ),
        );

        // The 4 words fade cleanly in place (never crossing the bottom border of the draft frame)
        if (drop < 0.95) {
          nodes.push(
            txt(
              'only with security approval.',
              -115,
              174,
              32,
              drop > 0.25 ? ROLE.deny : ROLE.exception,
              'sans',
              'left',
            ).opacity(1 - drop),
          );
        }

        if (drop > 0.5) {
          nodes.push(
            txt(
              'OMITTED: "only with security approval." -> pending reader may pick day 45!',
              0,
              308,
              32,
              ROLE.deny,
              'serif',
              'center',
            ).glow(7, ROLE.deny),
          );
        } else {
          nodes.push(
            txt(
              'Without knowing Alice approval status, both rules stay accurate together.',
              0,
              308,
              30,
              COSMOS.muted,
              'sans',
              'center',
            ).opacity(0.4 + 0.6 * draftOn.value),
          );
        }
      } else if (rl < 0.5) {
        // Beat 1: RAG constellation (Chunk -> Embedding -> Reranker -> Generator + Auth/Citation Gate)
        const stations = [
          { x: -640, y: 120, label: 'CHUNK', sub: 'source passage', col: ROLE.policy },
          { x: -215, y: 120, label: 'EMBED', sub: 'vector numbers', col: ROLE.query },
          { x: 215, y: 120, label: 'RERANK', sub: 'close compare', col: ROLE.focus },
          { x: 640, y: 120, label: 'RAG', sub: 'grounded reply', col: ROLE.exception },
        ];
        for (let i = 0; i < stations.length - 1; i++) {
          const [a, b] = trimSeg(
            [stations[i].x, stations[i].y],
            [stations[i + 1].x, stations[i + 1].y],
            78,
            78,
          );
          nodes.push(
            beamWithPhotons([a, b], stations[i + 1].col, 0, {
              width: 3.4,
              glow: 8,
            }),
          );
        }
        for (const st of stations) {
          nodes.push(orbNode(st.x, st.y, st.label, st.col, { radius: 66, sub: st.sub, size: 28 }));
        }
        nodes.push(
          txt(
            'APPLICATION STILL CHECKS: WHO MAY READ EACH PASSAGE  +  WHETHER EACH CITATION SUPPORTS THE ANSWER',
            0,
            345,
            26,
            ROLE.focus,
            'mono',
            'center',
          ).glow(5, ROLE.focus),
        );
      } else {
        // Beat 2: Exception vs Conflict vs Missing Source
        const cols = [
          {
            x: -560,
            title: 'EXPLICIT EXCEPTION',
            body1: 'policy@2 + exception@1 fit',
            body2: 'one grants conditional rule',
            col: ROLE.exception,
            hi: cf < 0.5,
          },
          {
            x: 0,
            title: 'UNRESOLVED CONFLICT',
            body1: 'two current sources disagree',
            body2: 'report conflict directly',
            col: ROLE.focus,
            hi: cf >= 0.5,
          },
          {
            x: 560,
            title: 'MISSING SOURCE',
            body1: 'required rule not retrieved',
            body2: 'disclose gap or allowed links',
            col: ROLE.query,
            hi: cf >= 0.5,
          },
        ];
        for (const item of cols) {
          nodes.push(
            rect(510, 210, {
              fill: '#0d1629',
              stroke: item.col,
              width: item.hi ? 3.5 : 2,
              radius: 14,
            })
              .at(item.x, 145)
              .glow(item.hi ? 10 : 3, item.col),
            txt(item.title, item.x, 82, 26, item.col, 'mono', 'center'),
            line([item.x - 210, 114], [item.x + 210, 114], { stroke: '#273659', width: 2 }),
            txt(item.body1, item.x, 158, 28, COSMOS.ink, 'sans', 'center'),
            txt(item.body2, item.x, 206, 26, COSMOS.muted, 'sans', 'center'),
          );
        }
        nodes.push(
          txt(
            'Next: bind identity, permissions, retrieval, verification, latency, and cost',
            0,
            355,
            28,
            COSMOS.muted,
            'serif',
            'center',
          ),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  c.on('se-answer-contract-0', () => {
    s.play(draftOn.to(1, { duration: clampDur(c, c.cue('se-answer-contract-0').start, 0.35) }));
  });
  c.on('se-answer-contract-condition', () => {
    s.play(
      dropCond.to(1, { duration: clampDur(c, c.cue('se-answer-contract-condition').start, 0.65) }),
    );
  });
  c.on('se-answer-contract-1', () => {
    s.play(ragOn.to(1, { duration: clampDur(c, c.cue('se-answer-contract-1').start, 0.3) }));
  });
  c.on('se-answer-contract-2', () => {
    s.play(ruleOn.to(1, { duration: clampDur(c, c.cue('se-answer-contract-2').start, 0.3) }));
  });
  c.on('se-answer-contract-conflict', () => {
    s.play(
      conflictOn.to(1, { duration: clampDur(c, c.cue('se-answer-contract-conflict').start, 0.3) }),
    );
  });
}
