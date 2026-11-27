// Scene 10: share - Two continuations of the fox story (Copy-on-Write Failure & Repair)
// Signature scene: Two branches share Physical Block 0 -> 4-beam 2 GiB vs 512 MiB savings ->
// Unsafe overwrite (home -> away) with prediction hold BEFORE revealing "A gets away" ->
// Rewind to fork -> Copy 3 valid pairs into Block 1 -> Remap A -> Safe writes -> CoW verified!
import { group, par, rect } from 'vizmatic/stage';
import {
  CONVERSATION,
  COSMOS,
  GIB,
  MIB,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  dashedRule,
  glowBar,
  guardedDynamic,
  memCell,
  quadArcPts,
  txt,
} from '../parts.mjs';

export default function share(s, c) {
  // 0=fork, 1..4=beam panel, 5=slot focus, 6=want-a, 7=want-b, 8=unsafe-a, 9=unsafe-b,
  // 10=ask-read (HOLD!), 11=bad-read (AFTER!), 12=rewind, 13=copy, 14=remap,
  // 15=safe-a, 16=safe-b, 17=read-a, 18=read-b, 19=name, 20=total-partial
  const st = s.value(0);
  const beamVis = s.value(0);
  const beamLevel = s.value(0);

  const header = cinemaHeader(
    'SHARED PREFIX  ·  COPY-ON-WRITE',
    'Two continuations',
    'of the fox story',
    {
      x: -860,
      y: -415,
      accent: ROLE.shared,
      size: 54,
    },
  );

  const stageAura = group(
    aura(-200, 120, 560, '#ffd16622', '#5ce1e614'),
    aura(480, -40, 440, '#a78bfa1c'),
  );

  const sceneDyn = guardedDynamic(
    () => 1,
    () => {
      const v = st.value;
      const bVis = beamVis.value;
      const bLvl = beamLevel.value;
      const nodes = [];

      const isRemapped = v >= 13.5;
      const showBlk1 = v >= 12.5;

      // Branch A & B Table Headers (generous width 420px so 20-char mono never touches borders)
      const aX = -630;
      const bX = -125;
      const tblY = -140;

      const aPtrText = isRemapped ? 'Table A -> [ Blk 1 ]' : 'Table A -> [ Blk 0 ]';
      const bPtrText = 'Table B -> [ Blk 0 ]';

      nodes.push(
        memCell(aPtrText, aX, tblY, {
          w: 420,
          h: 72,
          fill: '#102b38',
          stroke: ROLE.reqA,
          textColor: ROLE.reqA,
          glow: 8,
        }),
        memCell(bPtrText, bX, tblY, {
          w: 420,
          h: 72,
          fill: '#1e1635',
          stroke: ROLE.reqB,
          textColor: ROLE.reqB,
          glow: 8,
        }),
      );

      // Desired writes shown cleanly ABOVE tables so beams below tables NEVER cross text!
      if (v >= 5.5 && v < 11.5) {
        nodes.push(txt('A wants: home (90)', aX, tblY - 68, 26, ROLE.reqA, 'mono'));
        if (v >= 6.5) {
          nodes.push(txt('B wants: away (80)', bX, tblY - 68, 26, ROLE.reqB, 'mono'));
        }
      } else if (v >= 14.5) {
        nodes.push(
          txt('A writes: home (90)', aX, tblY - 68, 26, ROLE.reqA, 'mono'),
          txt('B writes: away (80)', bX, tblY - 68, 26, ROLE.reqB, 'mono'),
        );
      }

      // Physical Block 0 (4 slots) - always at x = -352, y = 165 (or shifted right when Block 1 appears)
      const blk0X = showBlk1 ? 260 : -352;
      const blk1X = -500;
      const blkY = 165;

      // Determine Block 0 Slot 3 content & styling strictly from state `v`
      let s3Label = 'empty';
      let s3Col = COSMOS.dim;
      let s3Fill = '#0f1628';
      if (v >= 7.5 && v < 8.5) {
        s3Label = 'home (90)';
        s3Col = ROLE.reqA;
        s3Fill = '#102b38';
      } else if (v >= 8.5 && v < 11.5) {
        s3Label = 'away (80)';
        s3Col = ROLE.waste;
        s3Fill = '#351222';
      } else if (v >= 11.5 && v < 15.5) {
        s3Label = 'empty';
        s3Col = ROLE.focus;
        s3Fill = '#181d30';
      } else if (v >= 15.5) {
        s3Label = 'away (80)';
        s3Col = ROLE.reqB;
        s3Fill = '#1e1635';
      }

      const ref0 = isRemapped ? 1 : 2;
      nodes.push(
        txt(
          `PHYSICAL BLOCK 0   (ref = ${ref0})`,
          blk0X,
          blkY - 76,
          26,
          isRemapped ? ROLE.reqB : ROLE.shared,
          'mono',
        ).glow(6, isRemapped ? ROLE.reqB : ROLE.shared),
      );
      const b0Slots = [
        { lbl: 'The', col: ROLE.shared, fill: '#272010' },
        { lbl: 'fox', col: ROLE.shared, fill: '#272010' },
        { lbl: 'ran', col: ROLE.shared, fill: '#272010' },
        { lbl: s3Label, col: s3Col, fill: s3Fill },
      ];
      b0Slots.forEach((sl, k) => {
        const sx = blk0X - 243 + k * 162;
        nodes.push(
          rect(150, 74, {
            fill: sl.fill,
            stroke: sl.col,
            width: k === 3 && v >= 4.5 ? 2.8 : 2.0,
            radius: 10,
            ...(sl.lbl === 'empty' ? { dash: [5, 5] } : {}),
          })
            .at(sx, blkY)
            .opacity(1),
          txt(sl.lbl, sx, blkY, 26, sl.col, 'mono'),
        );
      });

      // Physical Block 1 (created during Copy-on-Write at `copy`!)
      if (showBlk1) {
        const s1Label = v >= 14.5 ? 'home (90)' : 'empty';
        const s1Col = v >= 14.5 ? ROLE.reqA : ROLE.focus;
        const s1Fill = v >= 14.5 ? '#102b38' : '#181d30';
        const ref1 = isRemapped ? 1 : 0;
        nodes.push(
          txt(`PHYSICAL BLOCK 1   (ref = ${ref1})`, blk1X, blkY - 76, 26, ROLE.reqA, 'mono').glow(
            6,
            ROLE.reqA,
          ),
        );
        const b1Slots = [
          { lbl: 'The', col: ROLE.reqA, fill: '#102b38' },
          { lbl: 'fox', col: ROLE.reqA, fill: '#102b38' },
          { lbl: 'ran', col: ROLE.reqA, fill: '#102b38' },
          { lbl: s1Label, col: s1Col, fill: s1Fill },
        ];
        b1Slots.forEach((sl, k) => {
          const sx = blk1X - 243 + k * 162;
          nodes.push(
            rect(150, 74, {
              fill: sl.fill,
              stroke: sl.col,
              width: k === 3 ? 2.8 : 2.0,
              radius: 10,
              ...(sl.lbl === 'empty' ? { dash: [5, 5] } : {}),
            })
              .at(sx, blkY)
              .opacity(1),
            txt(sl.lbl, sx, blkY, 26, sl.col, 'mono'),
          );
        });

        // Glowing copy arc from Block 0 -> Block 1 during copy phase
        if (v >= 12.5 && v < 14.5) {
          const copyPts = quadArcPts([blk0X - 240, blkY - 40], [blk1X + 240, blkY - 40], -75, 24);
          nodes.push(
            beamWithPhotons(copyPts, ROLE.fresh, 0, {
              width: 3.8,
              glow: 10,
              photonCount: 2,
            }),
          );
        }
      }

      // Glowing Pointer Beams from strictly below Table A & B down to strictly above block headers
      const aTargetX = isRemapped ? blk1X : blk0X - 60;
      const bTargetX = blk0X + 60;
      const aBeamPts = quadArcPts([aX, tblY + 48], [aTargetX, blkY - 108], 18, 22);
      const bBeamPts = quadArcPts([bX, tblY + 48], [bTargetX, blkY - 108], 18, 22);
      nodes.push(
        beamWithPhotons(aBeamPts, ROLE.reqA, 0, { width: 3.6, glow: 9, photonCount: 2 }),
        beamWithPhotons(bBeamPts, ROLE.reqB, 0, {
          width: 3.6,
          glow: 9,
          photonCount: 2,
        }),
      );

      // Right-hand Beam Search / Readback Panel (keeps right canvas balanced before Block 1 splits out)
      if (!showBlk1) {
        const xR = 230;
        if (v < 4.5) {
          const panelA = bVis > 0.05 ? bVis : 0.44;
          nodes.push(
            dashedRule(165, -230, 165, 340, '#283657', 0.65 * panelA),
            txt('BEAM SEARCH (4 CANDIDATES)', xR, -206, 26, ROLE.focus, 'mono', 'left').opacity(
              panelA,
            ),
            txt(
              `1 prompt (4,096 tok) = ${CONVERSATION / MIB} MiB`,
              xR,
              -146,
              26,
              ROLE.key,
              'mono',
              'left',
            ).opacity(panelA * (bLvl >= 1.5 ? 1 : 0.55)),
            txt(
              `4 private copies: ${(4 * CONVERSATION) / GIB} GiB`,
              xR,
              -68,
              28,
              ROLE.waste,
              'mono',
              'left',
            ).opacity(panelA * (bLvl >= 2.5 ? 1 : 0.45)),
            glowBar(xR, -18, 590, 34, bLvl >= 2.5 ? 1.0 : 0.25, {
              fill: ROLE.waste,
              glow: bLvl >= 2.5 ? 8 : 0,
              opacity: panelA * (bLvl >= 2.5 ? 1 : 0.45),
            }),
            txt(
              `1 shared prompt: ${CONVERSATION / MIB} MiB (4 readers)`,
              xR,
              64,
              28,
              ROLE.shared,
              'mono',
              'left',
            )
              .glow(bLvl >= 3.5 ? 6 : 0, ROLE.shared)
              .opacity(panelA * (bLvl >= 3.5 ? 1 : 0.45)),
            glowBar(xR, 114, 590, 34, 0.25, {
              fill: ROLE.shared,
              glow: bLvl >= 3.5 ? 10 : 0,
              opacity: panelA * (bLvl >= 3.5 ? 1 : 0.45),
            }),
          );
          if (bLvl >= 3.5) {
            nodes.push(
              txt(
                'Saves VRAM (readers still spend read bandwidth)',
                xR,
                174,
                26,
                COSMOS.muted,
                'sans',
                'left',
              ).opacity(panelA),
            );
          }
        } else {
          // Live 4th-Slot Readback Monitor (answer strictly withheld until AFTER bad-read!)
          nodes.push(
            dashedRule(165, -230, 165, 280, '#283657', 0.65),
            txt('4TH-SLOT READBACK', xR, -184, 26, ROLE.focus, 'mono', 'left'),
            txt(
              v >= 10.5 && v < 11.5
                ? 'A reads -> away (80) !'
                : v >= 9.5 && v < 10.5
                  ? 'A reads slot 3 -> ?'
                  : v >= 7.5 && v < 8.5
                    ? 'A wrote home (90)'
                    : 'Shared Blk 0: 1 open slot',
              xR,
              -106,
              28,
              v >= 10.5 && v < 11.5 ? ROLE.waste : ROLE.reqA,
              'mono',
              'left',
            ).glow(v >= 10.5 && v < 11.5 ? 8 : 0, ROLE.waste),
            txt(
              v >= 8.5 && v < 11.5
                ? 'B wrote away (80)'
                : v >= 6.5 && v < 11.5
                  ? 'B wants: away (80)'
                  : 'Both point to Blk 0',
              xR,
              -36,
              26,
              ROLE.reqB,
              'mono',
              'left',
            ),
            txt(`Block 0 owners: ref = ${ref0}`, xR, 46, 26, ROLE.shared, 'mono', 'left'),
          );
        }
      }

      // Bottom Status / Prediction / Verdict Strip (y = 308..405)
      if (v >= 9.5 && v < 10.5) {
        nodes.push(
          txt('PREDICT: A reads slot 3 again -> which word?', 0, 326, 34, ROLE.focus, 'mono')
            .glow(8, ROLE.focus)
            .opacity(1),
        );
      } else if (v >= 10.5 && v < 11.5) {
        nodes.push(
          txt(
            'CORRUPTION: A reads "away" (80), B overwrote A!',
            0,
            326,
            34,
            ROLE.waste,
            'mono',
          ).glow(10, ROLE.waste),
        );
      } else if (v >= 11.5 && v < 14.5) {
        const msg =
          v < 12.5
            ? 'REWIND TO FORK: Both tables back to Block 0'
            : v < 13.5
              ? 'COPY: Duplicate 3 valid pairs into fresh Block 1'
              : 'REMAP: Move A’s pointer to Block 1 (ref = 1 each)';
        nodes.push(txt(msg, 0, 326, 30, ROLE.fresh, 'mono').glow(7, ROLE.fresh));
      } else if (v >= 16.5) {
        const readStr =
          v >= 17.5
            ? 'Readback verified: A -> home (90)   ·   B -> away (80)'
            : 'Readback: A -> home (90)';
        nodes.push(txt(readStr, 0, 308, 30, ROLE.fresh, 'mono').glow(7, ROLE.fresh));
        if (v >= 18.5) {
          nodes.push(txt('COPY-ON-WRITE', -150, 378, 32, ROLE.shared, 'mono').glow(9, ROLE.shared));
        }
        if (v >= 19.5) {
          nodes.push(txt('2 blocks total', 180, 378, 32, ROLE.fresh, 'mono').glow(8, ROLE.fresh));
        }
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, sceneDyn);

  // Beat 0
  c.on('fork', () => {
    s.play(st.to(0.5, { duration: 0.2 }));
  });

  // Beat 1 (Beam Search 4x savings)
  c.on('beam', () => {
    const t = c.cue('beam').start;
    s.play(
      par(beamVis.to(1, { duration: clampDur(c, t, 0.3) }), beamLevel.to(1, { duration: 0.25 })),
    );
  });
  c.on('payload', () => {
    s.play(beamLevel.to(2, { duration: clampDur(c, c.cue('payload').start, 0.25) }));
  });
  c.on('private', () => {
    s.play(beamLevel.to(3, { duration: clampDur(c, c.cue('private').start, 0.3) }));
  });
  c.on('shared', () => {
    s.play(beamLevel.to(4, { duration: clampDur(c, c.cue('shared').start, 0.3) }));
  });

  // Beat 2 (Unsafe overwrite + prediction hold)
  c.on('slot', () => {
    const t = c.cue('slot').start;
    s.play(par(beamVis.to(0, { duration: 0.25 }), st.to(5, { duration: clampDur(c, t, 0.25) })));
  });
  c.on('want-a', () => {
    s.play(st.to(6, { duration: clampDur(c, c.cue('want-a').start, 0.25) }));
  });
  c.on('want-b', () => {
    s.play(st.to(7, { duration: clampDur(c, c.cue('want-b').start, 0.25) }));
  });
  c.on('unsafe-a', () => {
    s.play(st.to(8, { duration: clampDur(c, c.cue('unsafe-a').start, 0.25) }));
  });
  c.on('unsafe-b', () => {
    s.play(st.to(9, { duration: clampDur(c, c.cue('unsafe-b').start, 0.25) }));
  });
  c.on('ask-read', () => {
    s.play(st.to(10, { duration: clampDur(c, c.cue('ask-read').start, 0.25) }));
  });

  // Beat 3 - Reveal corruption strictly AFTER "A gets away"!
  c.after('bad-read', () => {
    s.play(st.to(11, { duration: clampDur(c, c.cue('bad-read').end, 0.25) }));
  });

  // Beat 4 (Rewind -> Copy -> Remap)
  c.on('rewind', () => {
    s.play(st.to(12, { duration: clampDur(c, c.cue('rewind').start, 0.3) }));
  });
  c.on('copy', () => {
    s.play(st.to(13, { duration: clampDur(c, c.cue('copy').start, 0.35) }));
  });
  c.on('remap', () => {
    s.play(st.to(14, { duration: clampDur(c, c.cue('remap').start, 0.35) }));
  });

  // Beat 5 (Safe writes -> Verified readbacks -> Copy-on-Write -> 2 physical blocks)
  c.on('safe-a', () => {
    s.play(st.to(15, { duration: clampDur(c, c.cue('safe-a').start, 0.25) }));
  });
  c.on('safe-b', () => {
    s.play(st.to(16, { duration: clampDur(c, c.cue('safe-b').start, 0.25) }));
  });
  c.after('read-a', () => {
    s.play(st.to(17, { duration: clampDur(c, c.cue('read-a').end, 0.25) }));
  });
  c.after('read-b', () => {
    s.play(st.to(18, { duration: clampDur(c, c.cue('read-b').end, 0.25) }));
  });
  c.on('name', () => {
    s.play(st.to(19, { duration: clampDur(c, c.cue('name').start, 0.25) }));
  });
  c.after('total-partial', () => {
    s.play(st.to(20, { duration: clampDur(c, c.cue('total-partial').end, 0.25) }));
  });
}
