export const RS_SENTENCES = {
  'paper-triage': [
    [
      'Why would a distance bonus help?',
      'The paper gives a formula for changing the reward while preserving the best policy under its assumptions.',
      'We borrowed that formula for a seven-square corridor and a learner with a table of action values.',
      'How quickly that learner finds the goal is our experiment.',
    ],
    [
      'Use Keshav’s three reading passes.',
      'On the first pass, read the title, abstract and conclusion to find the question and the claimed result.',
      'On the second, check the equation, the assumptions and what the figures actually measure.',
      'Write down any detail you still need to run the comparison.',
    ],
    [
      'On the third pass, close the paper and reconstruct the bonus for one move.',
      'Check whether both learners get the same budget, random inputs and scoring rule.',
      'Keep the paper section beside the formula and record the corridor and seed choices in your study plan.',
      'If a seed loses goals, mark the cause as an open question.',
    ],
  ],
  'locked-contract': [
    [
      'The hypothesis names an agent, environment, intervention, metric, analysis unit and rejection rule.',
      'Here each independently generated simulator seed supplies a pair of first-thirty-episode success fractions.',
      'Subtract sparse from shaped within each seed, then average all planned differences.',
    ],
    [
      'The declared early rule requires a mean at least plus point one zero and a ninety-percent interval whose lower bound is strictly above zero.',
      'The final guardrail separately requires its observed mean and entire ninety-percent paired interval within minus point zero two through plus point zero two.',
    ],
    [
      'These are explicit illustrative decision criteria.',
      'A positive interval with mean below point one zero fails the practical condition.',
      'A passing early result with an out-of-bounds final interval fails the full rule.',
      'Establishing an effect of at least point one zero at that confidence level instead requires the early lower bound itself above point one zero.',
    ],
  ],
  'plan-history': [
    [
      'The article’s twenty-four worked seeds have already been observed.',
      'Rerunning them can test repeatability, but it cannot make their plan independently preregistered.',
      'Use pilot debugging first, freeze the new hypothesis, variables, decision and exclusion rules, then collect a reserved untouched confirmatory sample.',
    ],
    [
      'A retained commit identifies a plan version, while a timestamped read-only registration preserves the before-data commitment.',
      'Record amendments and their timing.',
      'If a terminal bug is discovered after several observed seeds, retain the invalid outputs, version the correction and rerun the complete corrected comparison rather than mixing old and new implementations.',
    ],
    [
      'Because the observed outcomes influenced development, label that corrected run amended evidence.',
      'A new untouched sample is needed for a fresh confirmatory claim.',
      'Run all planned pairs under the registered failure and rerun policy; an unfavorable result is not a mechanical failure or a valid exclusion by itself.',
    ],
  ],
  'public-boundary': [
    [
      'The local study generates its own transitions from configuration and pseudorandom inputs.',
      'It uses CPU and NumPy, with left and right as simulator actions.',
      'It does not need customer messages, production logs, external model APIs or live account actions.',
    ],
    [
      'A public-safe submission still needs review for credentials, machine paths, usernames and third-party license restrictions.',
      'Release only code and assets you have authority to share.',
      'Synthetic inputs make this particular data boundary simple; they do not turn a simulator result into evidence about user behavior, robotics or deployed-agent safety.',
    ],
  ],
  'environment-runtime': [
    [
      'Every episode begins at state zero in a corridor from zero through six.',
      'Action zero intends left and action one intends right.',
      'A slip below probability point one five reverses the intended movement, then the environment clamps the new position to the endpoints.',
    ],
    [
      'The original environment reward is one on reaching state six, otherwise zero.',
      'Goal arrival terminates the episode.',
      'The collection loop also stops after twelve steps without success.',
      'Retain starting state, intended action, realized successor, original reward and ending reason as separate diagnostic facts.',
    ],
    [
      'The actual learner uses discount point nine five, step size point three five and epsilon point two for eighty training episodes.',
      'The early metric covers only the first thirty.',
      'A complete capstone retains transition traces too; the compact script preserves successes and step counts, which cannot identify the causal transition behind a particular seed regression.',
    ],
  ],
  'telescoping': [
    [
      'The potential is negative distance to the goal divided by six.',
      'For each transition, add discount times next potential minus current potential to the training reward.',
      'Discount each transition’s addition again by its time index when summing the return.',
    ],
    [
      'Adjacent interior potentials cancel: the positive discounted next potential from one step meets the negative current potential from the next.',
      'The remaining total is negative initial potential plus discount to the path length multiplied by final potential.',
      'Both a direct completed path and a longer detour from state zero end at zero potential, giving the same total addition, plus one.',
    ],
    [
      'A stationary start step can earn a positive local shaping term without making progress.',
      'It does not make its entire policy optimal.',
      'For a discounted infinite horizon, bounded potential makes the remaining term vanish in the limit.',
      'A finite artificial timeout generally leaves a nonzero remainder.',
      'The theorem’s assumptions and boundary handling matter.',
    ],
  ],
  'time-limit': [
    [
      'The underlying learning task here has no twelve-step deadline.',
      'The timeout is an external collection cap, so the last non-goal state still has estimated future value.',
      'The Q target therefore includes discounted best next-state value at a timeout, but not at the true terminal goal.',
    ],
    [
      'The reported success metric nevertheless asks whether the goal was reached within twelve collected steps.',
      'That measurement and the underlying discounted-learning objective are related but different.',
      'If a deadline were part of the task, include remaining time in the state and treat expiry as terminal.',
    ],
    [
      'Keep terminal and truncation flags distinct in the implementation and tests.',
      'Bootstrapping through a true goal or dropping the next-state term merely because collection stopped changes the target.',
      'Writing the correct shaping formula does not repair a wrong task-ending contract.',
    ],
  ],
  'actual-update': [
    [
      'For the actual study update, compute target minus old Q, multiply by step size point three five and add it to the old entry.',
      'At starting state one, an intended right action that slips to zero updates Q of one and right.',
      'It does not update the successor state’s right entry.',
    ],
    [
      'With zero initial values and no goal reward, the shaping term is approximately minus point one one six seven.',
      'The target is that term and the updated entry becomes approximately minus point zero four zero eight three.',
      'Now keep the same transition but supply a next-state maximum point four.',
      'The target becomes about point two six three three, so a zero old entry would rise to point zero nine two one seven.',
    ],
    [
      'The earlier constructed picture uses step size point two to isolate that same sign change.',
      'The executed article study uses point three five.',
      'Keep those illustrative and study parameters identified.',
      'A negative immediate bonus alone does not determine the complete target or update direction.',
    ],
  ],
  'indexed-tapes': [
    [
      'Imagine two copies of the same list of slip draws, one for each learner.',
      'Blue uses six draws on its first trip. Cyan uses twelve.',
      'On the first move of the next trip, blue reads draw seven and cyan reads draw thirteen.',
    ],
    [
      'Give each trip its own row of twelve draws.',
      'Each of the four tapes has eighty rows. The tapes supply an exploration check, a random action, a tie-break and a slip draw.',
      'Both learners start the second trip at the first cell of row two, even if one left half the first row unused.',
    ],
    [
      'Follow the slip tape to the fourth move of trip two. The draw is about point zero six, below the slip threshold of point one five.',
      'That draw reverses a left choice to right and a right choice to left.',
      'Both learners read the same cell. Each still chooses its own action from its learned values or its exploration draw.',
    ],
  ],
  'covariance': [
    [
      'For independent seed pairs, the variance of the paired mean is the sum of the two arm variances minus twice their covariance, all divided by the number of pairs.',
      'Independently sampled arms omit that covariance term.',
      'Positive covariance lowers paired variance, zero changes nothing, and negative covariance raises it.',
    ],
    [
      'The article’s five invented baseline scores run from zero through one in quarter steps, with candidate equal to one minus baseline.',
      'Their sample covariance is minus point one five six two five.',
      'Both marginal variances are point one five six two five.',
      'Divide their sum by five for an independent estimate point zero six two five; including the negative covariance doubles it to point one two five.',
    ],
    [
      'No mean effect is created: these differences average zero.',
      'Shared input draws do not guarantee the covariance sign or a narrower interval.',
      'Preserve the pairing that defines the design and inspect its observed relationship rather than selecting a resampling method because its result is convenient.',
    ],
  ],
  'pilot-evaluation': [
    [
      'Pilot seeds nine hundred through nine hundred two are for debugging and stay outside the worked primary sample.',
      'New confirmatory seeds must also stay untouched until their plan is frozen.',
      'A seed number alone does not define a complete random stream without its generator, call sequence and environment.',
    ],
    [
      'For final evaluation, freeze each learned Q table.',
      'The evaluator uses a separate slip tape seeded with ten thousand plus the training seed, shared by the two policies.',
      'It chooses greedy actions and records two hundred episode successes under original goal reward, without training updates or a shaping bonus.',
    ],
    [
      'If you use these scores to pick the bonus, they become tuning data. Evaluate that choice on fresh seeds.',
      'To test whether shaping helps in another environment, repeat the comparison there.',
      'To repeat this corridor test on another machine, keep the generator, its sequence of calls and the software environment with the seeds.',
    ],
  ],
  'ablation-matrix': [
    [
      'The zero-potential row checks whether candidate code reduces exactly to sparse training.',
      'The distance-potential row changes only the training reward for the primary comparison.',
      'Both require the same environment and measurement contract.',
    ],
    [
      'The independent-arm sensitivity row resamples already completed outcomes using separate indices.',
      'It is not another training run or a new sample.',
      'The reversed-potential row changes the potential sign as an exploratory stress test; it cannot redefine a result already observed.',
    ],
    [
      'Preserve all row configurations and their decision roles.',
      'An ablation changes a named factor to investigate its mechanism.',
      'Choosing the best row of an unplanned hyperparameter search and calling it the primary ablation makes selection depend on the result.',
    ],
  ],
  'experiment-ledger': [
    [
      'Plan the run table before execution.',
      'Its rows identify seed set, training and evaluation budget, output and decision role.',
      'Use explicit states such as planned, running, complete, mechanical failure or excluded by a locked rule.',
      'Bad performance is not a failure status.',
    ],
    [
      'A permitted rerun retains the original failed attempt, error and linked replacement.',
      'Sort results by seed, not performance.',
      'Point the aggregate summary to the complete row-table reference so an outsider can reconstruct it rather than rely on a screenshot or a favorable subset.',
    ],
  ],
  'reported-bootstrap': [
    [
      "Put all twenty-four retained seed pairs back on the table and draw twenty-four times with replacement.",
      "Average those selected differences to get one mean.",
      "Repeat that draw ten thousand times with the study's fixed bootstrap seed.",
    ],
    [
      "Sort the ten thousand means from smallest to largest.",
      "For a percentile, multiply its probability by the number of gaps between the means. That gives a position between two neighbors. Use the fractional part to interpolate.",
      "The fifth and ninety-fifth percentiles give a ninety-percent interval from six point one to twenty-two point five percentage points.",
    ],
    [
      "For a pair of different neighbors, take two sorted means of four and twelve percentage points.",
      "Suppose the rank falls one quarter of the way between them. What value belongs there?",
    ],
    [
      "A quarter of that eight-point gap is two. Add two to four and you get six points.",
      "Back in the actual run, the two neighbors for each endpoint have the same value, so interpolation leaves each endpoint where it is.",
      "Keep the generator, seed and resampling method with these numbers. A different draw or a bias-corrected interval can move the endpoints.",
      "Each draw can only select pairs we observed. A rare outcome missing from those seeds stays missing, and the interval describes variation under this procedure.",
    ],
  ],
  'point-versus-bound': [
    [
      "The yellow dot is the average gain over all twenty-four seeds, fourteen point three percentage points.",
      "The dot clears ten and the bottom of the interval clears zero, so the early rule passes.",
    ],
    [
      "Now suppose the report says the gain is at least ten points at ninety-percent confidence.",
      "Look at the left tip. It reaches down to six point one points, below ten.",
      "That interval allows a smaller gain than the headline promises.",
    ],
    [
      "All nineteen gains and five regressions contributed to this interval.",
      "Keeping only the gains would raise the mean to nearly twenty-four points.",
      "Resampling the arms separately made the interval about fifteen percent wider for these rows. With a different pattern of paired scores, the change in width can go the other way.",
    ],
  ],
  'frozen-policy': [
    [
      'Inspect seed eighteen’s actual learned greedy actions.',
      'Both policies choose left at state zero and right at states one through five.',
      'An intended left at the left boundary stays at zero unless a slip reverses it, so leaving the start depends on that reversal.',
    ],
    [
      'Both reach the goal in ninety-one of two hundred evaluation episodes, or forty-five point five percent.',
      'Their zero difference fits the relative guardrail while their absolute success remains weak.',
      'The theorem concerns optimal policies under stated assumptions, not whether these finite-budget learned tables have converged.',
    ],
  ],
  'resource-axis': [
    [
      'Both arms train for eighty episodes, but early goal arrival can shorten an episode.',
      'The retained rows average seven hundred seventy-three point two transitions for sparse training and seven hundred fifty-four point seven for shaped training.',
      'Episode count therefore does not imply equal environment-step work.',
    ],
    [
      'This design measures early success per episode.',
      'A same-step-budget study or wall-clock efficiency claim needs its own controlled budget and measured time.',
      'Record training transitions, evaluation work and actual duration separately; do not convert fewer steps into an unmeasured hardware speedup.',
    ],
  ],
  'data-provenance': [
    [
      'Synthetic data still needs a reconstruction record.',
      'Retain the generator version and source, seed range, state count, transition and slip rule, step cap and exact command.',
      'State which generated rows are canonical references and which are disposable derivatives, instead of committing an unexplained CSV.',
    ],
    [
      'For a later public-dataset extension, retain its original location, license, version, retrieval date, checksum, preprocessing command and excluded rows.',
      'A renamed local file does not replace that origin.',
      'Compare the retained inputs, source and configuration before treating a new output as a repeat of the same experiment.',
    ],
  ],
  'artifact-layers': [
    [
      'A commit identifies a tracked tree, excluding dirty and untracked files.',
      'Retain the executed source snapshot too, with documented file ordering and encoding.',
      'Compare its digest with an independently retained expected snapshot; a self-reported hash does not exclude an edit.',
    ],
    [
      'Record the interpreter, actual package and build versions, lockfile, operating system, architecture and relevant numerical libraries.',
      'A Python patch-version range or a dependency lock does not pin every host property.',
      'NumPy’s detailed stream-compatibility conditions include generator, seed, method calls, arguments, build and environment.',
    ],
    [
      'Preserve configuration bytes and their history, then hash seed rows and derived outputs against a retained original.',
      'A new hash cannot establish when a file changed.',
      'Output identity, actual execution, scientific validity and producer identity require different evidence; an unsigned consistent manifest cannot authenticate who performed the run.',
    ],
  ],
  'hash-counterexample': [
    [
      'The article serializes the same seed-and-success object as compact and indented JSON.',
      'Decoding gives equal values, while the byte digests differ.',
      'Declare whether the reproduction contract requires exact bytes or specified numeric fields within a chosen tolerance.',
    ],
    [
      'A fabricated success record can also match a checksum written by the same fabricator.',
      'That check establishes internal byte consistency, not execution or validity.',
      'Preserve both outputs on an unexpected mismatch and investigate before editing a report; do not widen tolerances after seeing which result is inconvenient.',
    ],
  ],
  'exporter-chain': [
    [
      'The included exporter reads the uniquely named experiment code fence, executes it, and writes the seed CSV, result JSON and a manifest.',
      'The figure reads that result JSON rather than a second manually typed result list.',
      'Source, exporter, configuration and output digests help compare the resulting files.',
    ],
    [
      'The exporter does not independently verify a reference, preserve an earlier run, pin a full environment or authenticate its producer.',
      'Run comparisons in a separate checkout or isolated output directory so a rerun cannot overwrite the reference it is supposed to match.',
    ],
    [
      'A complete submission adds the documented command and lock, plan history, diagnostic traces, license and citation metadata.',
      'A root citation file supplies machine-readable software authorship and release information; an archived persistent identifier helps find the exact release.',
      'These are proposed package requirements beyond the miniature’s exported three files.',
    ],
  ],
  'negative-report': [
    [
      'Suppose the zero-potential control differs from sparse training. Trace the first update where the tables disagree.',
      'If a clean clone stops on a missing dependency, fix the package and rerun the command.',
      'Record the failed attempt alongside the repair.',
    ],
    [
      'If the early interval crosses zero, the direction of the gain is uncertain under the study rule.',
      'If the mean falls below ten points, it misses the practical target. If the final interval leaves the two-point band, the combined claim fails.',
      'Report that decision with the same seed rows and deviations you would show for a passing run.',
    ],
    [
      'Look at seed six. With shaping, the learner reached the goal twice in thirty trips. With sparse rewards, it got there eleven times.',
      'Where did the extra misses come from?',
      'A trace records the intended move, the slip draw and the square where the learner landed.',
      'Keep seed six in the table. To test whether early slips account for the losses, plan that comparison on fresh runs.',
    ],
  ],
  'limitations-next': [
    [
      'Give the corridor a side passage.',
      'Now the learner can turn away from the direct route to the goal.',
      'Run the same reward comparison on this branching grid to find out whether the early gain carries over.',
    ],
    [
      'To test a neural learner, replace the table with a network. To test the reward formula, choose the potential functions in advance.',
      'Try each learning-rate setting on the same planned seeds, and choose the number of seeds for the precision you need.',
    ],
    [
      'A study about an agent in use needs measurements from its intended task, including any safety outcomes you want to claim.',
      'Report the corridor result with its learner, training budget and seed procedure.',
      'Name the change you would test next and what you would measure.',
    ],
  ],
  'review-milestones': [
    [
      'At the first milestone, another engineer traces the equation and assumptions to source and predicts what would support or reject the locked claim.',
      'Submit the triage, plan, public boundary and expected result before confirmatory outputs exist.',
    ],
    [
      'At the second, exercise the simulator and sparse baseline on pilot data, inspect a transition and verify exact zero-potential equality.',
      'Include config schema, dependency lock and one clean command before running the new confirmatory sample.',
    ],
    [
      'At the third, retain every planned seed row, actual resampling output, deviations, manifests and derived figures.',
      'A reviewer recomputes headline values and reruns a seed pair.',
      'At the fourth, they start from a clean clone, produce the primary table and identify an unsupported inference beside the final report, license and talk.',
    ],
    [
      'Feedback that changes the locked design creates an amendment before the next confirmatory run.',
      'A file called a manifest or a folder called reviews is not the evidence by itself.',
      'The reviewer must actually exercise the stated layer and record its result.',
    ],
  ],
  'talk-defense': [
    [
      'The proposed ten-minute talk spends eight minutes on seven evidence jobs: problem, source claim, hypothesis, design, result, failure checks and limitations.',
      'The supplied segments total four hundred eighty seconds, leaving one hundred twenty for questions.',
      'Practice that actual allocation instead of taking the audience through a directory tree.',
    ],
    [
      'Prepare answers with artifact links.',
      'Why this seed budget?',
      'Show precision and variation.',
      'Why can five seeds regress?',
      'Separate the mean from individual outcomes.',
      'Did shaping change the task?',
      'Show original-reward evaluation and theorem assumptions.',
      'Why do equal final scores not establish skill?',
      'Show the absolute per-seed rates.',
    ],
    [
      'Keep table, figure and report derived from the same retained rows.',
      'A caption should interpret the five regressions and interval, not repeat its title.',
      'Use sign, position and labels alongside color.',
      'Disclose deviations, and do not improvise a causal explanation that the diagnostic evidence never established.',
    ],
  ],
  'outsider-terms': [
    [
      'Under ACM’s current terminology, repeatability uses the same team and setup.',
      'Reproducibility uses a different team with the authors’ artifacts.',
      'Replicability uses a different team and independently developed artifacts.',
      'Declare which was actually exercised; an author rerun does not establish either independent layer.',
    ],
    [
      'Functional artifact review asks whether it is documented, consistent with the paper, complete, exercisable and supported by verification and validation.',
      'Availability, reusability and independently validated results are distinct properties.',
      'A downloadable archive cannot award itself a successful exercise or an ACM badge.',
    ],
    [
      'FAIR adds findability, accessibility, interoperability and reuse.',
      'Accessible data may require authentication and authorization; it need not be unrestricted.',
      'Persistent identifiers, open formats, provenance and a license support reuse while leaving the need for actual executable validation intact.',
    ],
  ],
  'fresh-interpretation': [
    [
      "Try a new report with supplied measurements.",
      "On the early ruler the mean is thirteen points and its ninety-percent interval runs from four to twenty-two.",
      "On the magnified final ruler the mean and its ninety-percent interval sit inside the two-point band.",
      "The two final success rates are forty-two percent and forty-two and a half percent.",
      "Keep the study's original rules.",
      "The draft claims a gain of at least ten points at ninety-percent confidence and calls the final policies competent.",
      "Which claims can you defend from these measurements?",
    ],
    [
      "The early rule passes because the mean clears ten points and the lower end clears zero.",
      "The final rule passes because the mean and the whole interval fit inside the band.",
      "Four points is still compatible with the early data, and both policies reached the goal in fewer than half their evaluation episodes.",
    ],
    [
      "Keep every measured value and edit the draft.",
      "Report that the mean gain passed the early rule and final success stayed similar under the declared guardrail.",
      "Give the interval and both absolute rates so a reader can see how small the gain could be and how often the policies missed.",
    ],
    [
      "One last change. Keep the mean differences and the two final scores.",
      "A second worksheet puts the lower end of the final interval at minus three points. The upper end stays put.",
      "Can the report still say both rules pass?",
    ],
    [
      "Withhold support for the combined claim.",
      "The lower end extends past minus two even though the final mean sits inside the band. Keep the early finding and report the failed guardrail beside it.",
      "In the next lesson you'll compare ways to train sentence embeddings. Before you call one better, decide which evidence could change your mind.",
    ],
  ],
};
