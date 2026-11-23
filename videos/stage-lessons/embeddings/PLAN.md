# Embeddings film plan

The central example is bank, ID 0, at [0.5, 0.5]. A stable plane follows its stored row and two sentence occurrences. River points up and finance points right. Separate narrated fixtures use the same frame with their own names and units. Their coordinates never mix with bank.

## Colors and shared parts

Blue identifies a stored lookup or query. Cyan identifies river evidence, invoice evidence, or the first item in a separate fixture. Green identifies finance evidence, phone evidence, or the second item. Pink identifies noise or a third component. Yellow marks the current evidence or result. Red marks a broken comparison or forbidden edge. Ink is ordinary text. Dim is completed work and the skeleton.

parts.mjs holds the stable plane, bank drawing, sentence lanes, vector accumulation drawing, model imports, and end-state table. It contains no generic replacement kit. Each scene owns its mechanism. The count matrix comes from the existing model. Arithmetic fixtures present only in old scenes are named once and asserted locally.

## Scene sequence

Each row gives the question, first picture, motion, and result.

| Scene | Question | First picture | Motion | Result |
| --- | --- | --- | --- | --- |
| intro | How can one row serve two meanings? | Bank plane and sentence lanes. | Occurrences split from the shared start toward clues. | One stored row, two states. |
| lookup | What does an ID select? | Plane, table, two bank slots. | Bank row feeds both occurrences. | Identical coordinates. |
| table-contract | What does one-hot multiplication select? | Table and selector beside bank plane. | Nonselected rows go quiet. Selected row feeds output. | Charge is a separate fixture. Subwords still select static rows. |
| neighbors | Where do counts come from? | Corpus strip and empty histogram beside bank. | Actual pairs leave the strip and increment columns. | Six pairs in four columns. |
| count-ppmi | Is a count above chance? | Four-by-four matrix and arithmetic slots. | Apple-fruit feeds marginals, baseline, ratio, and log. | PPMI floors at zero. |
| factorization | How do contexts compress? | PPMI matrix and plane. | Labeled rows enter two fitted directions. | Two clusters retain relationships through an axis sign flip. |
| predictive-window | Which positions form examples? | Five words, window, input/output rows. | Window selects neighbors. Signals reverse for CBOW and Skip-gram. | Night stays outside. |
| negative-step | What changes in a gradient step? | Center arrow and output rows. | Signed contributions accumulate and center moves downhill. | Positive score rises. Loss falls. |
| shifted-pmi | Why does noise shift the optimum? | Count, expected exposure, and score ruler. | Increasing k raises noise exposure and lowers log-ratio marker. | Absent pairs tend downward. Shared factors couple scores. |
| glove-fit | What is fitted? | Three count lanes on log rulers. | Residual spans extend from score to targets. Weight bars fill. | Matching residual is zero. Weights cap. |
| subword-components | How does spelling compose? | Play and played letters and window. | Three-character window slides. Repeated bucket vectors add tip to tail. | Sum [2,2] contracts to its positive average. |
| geometry | What does cosine retain? | Bank plane with clue arrows. | Vectors normalize along their rays. | Direction remains. Coordinate systems must match. |
| context | What changes with context? | Bank row and two copies at the same start. | Weighted legs add tip to tail. | River and finance endpoints separate. |
| article-context | What changes for charge? | Charge row and two clue lanes in the same frame. | Two half-lookup, half-clue paths accumulate. | Distinct endpoints and cosines. |
| elmo-layers | How do layers combine? | Token positions, recurrent lanes, layer slots. | Forward/backward signals run. Layers join, weight, and scale. | New states change output under shared weights. |
| visibility-test | Can future evidence reach charge? | Tokens and full/causal masks. | Allowed cells light. Phone changes to invoice. | First causal state stays fixed. Other states can change. |
| contrast | What remains shared? | Bank plane and contextual endpoints. | Unit directions expose clue alignment. | One lookup persists. Representation choices differ. |
| pooling | What does padding contribute? | Token rows, mask, accumulation plane. | Valid vectors sum and divide. Padding enters at weight zero. | Mean stays fixed. |
| limits | Can a common direction hide differences? | Four bank-map vectors. | Endpoints translate together, then subtract one mean. | Distance stays fixed as cosine changes. |
| anisotropy-check | Does pair centering prove useful geometry? | [10,1] and [10,-1] on an adaptive plane. | Mean subtracts and view follows. Third point centers to zero. | Opposite vectors and undefined zero cosine need population diagnosis. |
| space-contract | What if only the index rotates? | Query and two documents. | All rotate, reset, then documents rotate alone and query follows. | Ranking repairs when spaces align. |
| transfer | Can you predict a changed clue? | Bank and weighted legs. | River changes to money after prediction. | Same ID gives a different occurrence and pooled state. |
| fresh-representation | Can you repair a new migration? | New query and two documents. | Documents half-turn, scores stay hidden, then query follows. | Mixed-space ranking reverses and alignment repairs it. |

## Review status

All 23 scenes are accepted in index.mjs after clean scene checks and full-size still review. Beat endings, result holds, and transition samples were reviewed. The three largest sampled moves are the sliding character window, common translation, and document half-turn. The temporary draft selector has been removed. The final integrated check has no error or warning and reports no narration change. See REVIEW.md for evidence and limits.

The draft keeps the narration. The initial check used estimated timing. Recorded timing and an encoded review are separate delivery steps.
