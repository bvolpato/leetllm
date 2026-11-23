# LeetLLM Content Guidelines

This document defines the content strategy, tone, structure, and editorial standards for LeetLLM.

---

## Positioning & Tone

### What LeetLLM Is

A **master curriculum** for AI/ML and LLM engineering: a comprehensive, didactic resource for anyone who wants to deeply understand how modern AI systems work, from predictive models and feature pipelines to Transformer internals and production deployment.

LeetLLM serves a **broad audience** with a **dual purpose**:

1. **The most accessible deep-learning resource for AI/LLM engineering.** Every article teaches concepts from the ground up, assuming no prior ML background. A motivated software engineer, a career switcher, or a student should be able to pick up any fundamentals article and follow it from start to finish without needing to look things up. Advanced topics build on this foundation progressively.
2. **The best way to prepare for AI/LLM technical interviews.** Engineers who truly understand these topics will naturally excel in interviews. Our content is structured so that mastering it gives readers the depth and confidence to handle any AI/ML system design or fundamentals question thrown at them.

Deep understanding supports both goals. Readers build interview readiness by learning to explain mechanisms, solve unfamiliar problems, and justify engineering decisions.

### Learning Experience Goals

LeetLLM should work like a coherent course. A motivated beginner should be able to start at the first foundation chapter, click **Next**, and keep moving through prerequisites in order.

The editorial north star:

1. **Natural progression:** Teach prerequisites before dependent topics. The global path should move from Easy to Medium to Hard across topical groups.
2. **Degree-to-job coverage:** Cover the foundation, specialization, and employment-proof layers needed for a student to become employable. The site should teach skills, then prove them through labs, capstones, and artifacts.
3. **Beginner-first depth:** Advanced topics are welcome only when the article has taught the necessary intuition, vocabulary, examples, checks, and handoff.
4. **Learning over goals:** Interview readiness, portfolio value, and production framing matter, but they must come after understanding. A reader should be able to explain the tiny example before being asked to reason about a job scenario.
5. **Visual learning:** Dense ideas need diagrams, annotated tables, custom illustrations, or worked examples close to the explanation. Every visual should help explain the lesson.
6. **Evidence of mastery:** Articles should push the reader toward checks they can run, answers they can compare, systems they can build, and artifacts they can show.

### Domain Theme

Choose examples that make the idea easiest to understand. **Domain-native examples** often expose the mechanism directly:

- **Attention, tokenization, and NLP:** familiar English words, sentences, subword tokens, and next-token probability vectors.
- **Computer vision:** image tensors, pixel patches, convolution kernels, and visual feature maps.
- **Reinforcement learning:** gridworlds, Markov decision processes (MDPs), states, actions, rewards, and trajectories.
- **Mathematics and statistics:** vectors, matrices, probability distributions, covariance structures, and optimization surfaces.
- **GPU kernels and distributed serving:** tiles, warps, shared memory (SRAM), HBM transfers, KV-cache blocks, and collective communications.

Never shoehorn a generic SRE, billing, or IAM roleplay universe (`Luna`, `acct_10234`, `K10234`, `P-7`, `P-14`, `RUN-842`, `C17`, `R42`, `DeployBuddy`, `INC-48291`, duplicate-charge support tickets, or `0.005000 USD` gateway ceilings) into unrelated ML, deep learning, NLP, CV, RL, math, or GPU lessons. Reserve e-commerce, support workflows, RBAC, idempotency, or cost-gateway scenarios strictly for lessons and system-design chapters whose literal topic is those workflows.

Familiar analogies, playful examples, physical models, and invented worlds are welcome when they reduce the knowledge needed to follow the explanation. A marble rolling down a landscape can make gradient descent visible; a branching maze can make search tangible. Connect the familiar objects to the actual computation and carry that connection as long as it helps. Domain fit is a teaching choice, not a ban on imagination.

Blog posts should likewise use the domain that best fits their subject: codebases, diffs, tests, and CI for coding agents; request schedulers, KV caches, and GPU memory for serving; papers, benchmarks, and evals for research.

### Hypothetical Numbers & Example Data Convention

Small worked examples, tiny datasets, and hypothetical latencies throughout LeetLLM are constructed to help the reader trace a calculation or mechanism by hand. Cited measurements and explicitly recorded model runs retain their actual inputs and outputs. A prepared response can explain an idea; a claim that a model produced it requires a real run. **State this convention here and in `BOOK.md`, never as a repeated disclaimer inside individual articles, captions, or illustrations.**

Do not insert inline fictional-data disclaimers such as `"Treat these numbers as an illustrative walkthrough..."`, `"does not establish..."`, `"synthetic fixture"`, or `"FIXTURE ONLY"` inside prose, `<figcaption>` text, or PNG figures. Keep real scope limits, simplifying assumptions, and measurement requirements direct and concrete without apologizing for using worked examples.

### Voice

- **Lucid textbook clarity and depth (O'Reilly, Karpathy, 3Blue1Brown caliber).** Write like a deeply experienced engineer and teacher explaining concepts beside a smart colleague at a whiteboard: clear, direct, mathematically rigorous, and rich in geometric and physical intuition, with zero fluff or sugarcoating.
- **Didactic above all.** Every article is a teaching document. Assume the reader is an intelligent engineer or student who may have zero prior ML background.
- **Intuition and core mechanism first.** Start from why a technique exists, walk through small concrete numbers by hand, and build the core mechanism cleanly before introducing mathematical formalism or corner cases. Never hijack opening sections with premature edge-case caveats ("gotcha-first teaching" such as dumping `NaN` behavior from all-`-\infty` masks, dropout non-convexity caveats, or `BFloat16` underflow trivia before the reader even understands the forward pass).
- **Varied, flowing prose.** Develop each reasoning step at the length it needs. Mix explanatory paragraphs with short sentences where an insight lands. Sentence counts, paragraph lengths, and question quotas are not writing targets.
- **Precise and practical.** Pair equations with plain-English intuition and real runnable NumPy, PyTorch, scikit-learn, SciPy, or systems code so the reader leaves with an actionable mental model.

### Warmth, motivation, and reader trust

Write with quiet confidence and intellectual respect. A great technical book keeps the reader moving forward because the ideas fit together cleanly, not because every paragraph cheers them on.

- **Open with a concrete problem.** Begin with a recognizable engineering puzzle, a surprising model behavior, or a tiny set of numbers with clear stakes. Skip syllabus preambles and course-position tables.
- **Use shared reasoning honestly.** Explain why we compute a quantity, inspect a tensor shape, or test a hypothesis, using "we" and "you" naturally without fake enthusiasm, scripted banter, or repeated "let's" filler.
- **Connect sections causally.** Show what the preceding example just proved and raise the concrete unresolved question that makes the next section necessary, rather than writing administrative transitions like `"the next section covers..."`.
- **Keep edge cases in their proper place.** Teach the standard mechanism cleanly first, then devote a dedicated section to numerical stability corners, failure modes, and production limits once the reader knows what can break.
- **Preserve depth and honesty.** Never dismiss tricky steps with `"obviously"`, `"trivially"`, `"just"`, or `"simply"`. State technical limits, assumptions, and safety rules clearly without boilerplate disclaimers.

### Teach generously and qualify with purpose

A comprehensive lesson helps the reader reconstruct the idea: why it is useful, how each step works, what the numbers mean, and how to apply it to a new case. Spend words on missing reasoning, intermediate calculations, useful analogies, visual intuition, and worked solutions. Give the central example a satisfying result before opening further branches into variants, implementation details, or research comparisons.

Teach the normal case in direct language. State an assumption beside the calculation it affects, once. Explain a limitation when it changes the answer, prevents a likely misunderstanding, or protects the reader while running code. Put other useful exceptions after the mechanism, in a deeper section or a linked lesson. Do not add a warning to each result, append calibration or production qualifications to unrelated exercises, or demand that an introductory explanation defend every possible interpretation.

Use simplifications confidently: small integers, frictionless surfaces, fixed weights, idealized machines, and deterministic environments can isolate the idea beautifully. Keep the simplified model internally correct and connect it to the fuller model when that connection teaches something. Never present prepared outputs as an experiment that was actually run.

The author and reviewer verify technical claims behind the scenes. The reader should receive the explanation, with citations and relevant assumptions, rather than a transcript of that review.

### One voice on the site and in the book

The website and the PDF handbook share one serious, concrete technical voice. Write every paragraph so it earns its place on a printed page without relying on web-only pep talks, course scaffolding, or slogans.

Chapter introductions in `web/tools/book/introductions/` and part descriptions in `web/tools/book/book-config.json` follow this same voice. A part opening invites the reader into the broader journey; a chapter opening frames that specific chapter's technical problem without repeating the worked example or dumping an inventory of caveats.

For example:

| Dry or robotic phrasing | Clear, direct textbook phrasing |
|---|---|
| "This section introduces the mechanics of broadcasting." | "Suppose we want to add the same four bias offsets to every token row without writing a Python loop. Broadcasting lets one tensor operation align those shapes automatically." |
| "Validate the output shape before proceeding." | "Before continuing, check the output shape: if the token axis collapsed during reduction, the next projection will operate on the wrong dimension." |
| "Before reading the code below, predict what softmax outputs." | "Let us trace the three logits `[2.0, 1.0, 0.0]` through exponentiation and normalization to see why the largest logit dominates the probability distribution." |

Use these examples to calibrate editorial judgment across an entire article. Never apply bulk rewrite scripts, replacement maps, or automatic humanizers to lesson prose.

### Language Rules

| ✅ Use | ❌ Avoid |
|---|---|
| "Master", "Understand", "Learn" | "Cram", "Hack the interview" |
| "AI systems", "LLM engineering" | "Interview loops" |
| "Deep dive", "From first principles" | "Quick review", "Cheat sheet" |
| "Production systems", "Real-world" | "Toy examples" |

> **Note on interviews:** Article content may mention interviews when it adds context (e.g. "In an interview setting, an interviewer might probe…"). The *platform tone* should frame interview readiness as a byproduct of mastery.

### Frontier AI Interview Readiness Bar

Frontier AI interviews increasingly test whether a reader can build and debug real systems under time pressure. The curriculum should cover that bar without turning into a question bank.

Every roadmap phase should contribute to at least one of these skills:

- **Implementation speed:** coding small but stateful systems, simulations, queues, caches, parsers, and event processors with clear invariants and tests.
- **Transformer mechanics from scratch:** implementing attention, causal masks, stable softmax, KV-cache updates, RoPE, MQA, GQA, and transformer blocks before relying on high-level abstractions.
- **Numerical stability:** diagnosing log-sum-exp failures, FP16/BF16 issues, `NaN` or `Inf` loss, LayerNorm epsilon choices, gradient scaling, and softmax saturation.
- **Backprop reasoning:** explaining softmax plus cross-entropy backward, gradient flow through attention, residual shortcuts, and why Pre-LN stabilizes deep transformers.
- **Distributed and inference systems:** reasoning about DP, TP, PP, ZeRO, FSDP, NCCL bottlenecks, activation checkpointing, FlashAttention, vLLM, PagedAttention, continuous batching, KV-cache memory, and GPU utilization.
- **Hybrid evaluation:** designing evals for code, retrieval, agents, inference serving, regressions, and production debugging alongside static benchmarks.

Published lessons can say "in an interview" sparingly, but they should always teach the underlying skill first. A learner who finishes the course should be able to solve unfamiliar AI interview prompts by reasoning from their understanding of the systems.

---

## Natural Writing Style

LeetLLM prose should teach clearly, with enough detail for the reader to follow the reasoning.

### Plain English for teaching

Use `simple-english` as a clarity baseline for articles and blogs, adapted for deep technical textbooks. Accuracy, mathematical depth, and smooth explanatory flow take priority over arbitrary word counts.

State answers, results, and mechanisms directly without hiding behind disclaimers. Keep prerequisites, worked examples, derivations, useful checks, necessary recaps, and causal transitions between sections. Cut repetition that adds no new insight, while allowing each paragraph enough room to develop its mathematical or systems idea. A short paragraph can emphasize a result; a longer one can carry a derivation.

Do not inject mechanical `"Before running..."`, `"Before reading..."`, `"Before checking..."`, or `"Before continuing..., predict..."` prompts before code blocks or subsections. Ask a conceptual question when prior steps give the reader enough information to reason toward an illuminating answer. Choose questions for their teaching value without a quota, and provide useful feedback.

Natural contractions are optional (`do not` and `don't` are both fine; avoid unnatural `needn't`). Use headings, tables, and callouts when they help learning or navigation.

### Everyday English in language examples

Use common words and natural sentences when demonstrating token splits, embeddings, attention, or word order so the reader concentrates on the mechanism rather than decoding an unrelated domain. `"The dog chased the cat"` makes changes in word order obvious; familiar word families such as `"play"`, `"played"`, and `"playing"` let the learner study subword segmentation cleanly.

Keep the sample text distinct from the system explaining it, labeling tensors, caches, queries, and keys with exact technical names while keeping sample sentences natural. Keep a running example consistent across prose, formulas, diagrams, and code outputs.

### Narration that leaves room to think

Write video narration like a patient professor guiding someone through a new idea. Give each spoken passage a clear reasoning step: what to notice, why it happens, or what follows from it. Connect those steps in natural, varied sentences and leave time to study the visual.

Choose spoken numbers for their teaching purpose. Introduce the values needed for a worked calculation, explain the operation, and interpret the result. Keep detailed arithmetic, long decimals, tensor dimensions, and repeated intermediate values visible in the animation. Once a value is introduced, refer to its role or the change it causes when that helps the listener follow the reasoning, while preserving exact examples, units, assumptions, and mathematical relationships on screen.

For example, when a small weight change raises the loss, the voice can explain that dividing the two changes estimates the local slope while the figure displays the full decimal calculation. When comparing segmentation probabilities, explain why adding another piece changes the product and which path wins.

Keep useful recaps that bridge to the next step while removing repeated setup or mechanical reading of already visible tables. Review each complete script for meaning, rhythm, and alignment with the animation.

### No em dashes

Do not use em dashes in authored prose, captions, quiz text, or metadata. Use two sentences, commas, colons, or parentheses instead. Preserve punctuation inside code, literal strings, and exact quotations.

| Instead of | Use |
|---|---|
| Using em dashes around an aside ("The KV cache [em dash] a key optimization [em dash] stores...") | "The KV cache (a key optimization) stores..." |
| Using an em dash before a qualification ("This works well [em dash] only at small scale") | "This works well, though only at small scale." |
| Using an em dash to introduce a list ("Three factors matter [em dash] latency, cost, and accuracy") | "Three factors matter: latency, cost, and accuracy." |

### State the idea directly

Lead with what a concept does, what the example demonstrates, or what the engineer should measure. Avoid stock contrast formulas such as `"This is Y, not X,"` `"This isn't about X; it's about Y,"` and `"No X. No Y. Just Z."` Remove repeated defensive disclaimers such as `"not a promise of"`, `"not a guarantee of"`, `"does not establish"`, or `"Treat these numbers as an illustrative walkthrough"`. State the scope, mechanism, and required measurement directly.

| Formulaic phrasing | Direct explanation |
|---|---|
| "This is a framework, not a promise of performance." | "The framework organizes the experiment. Measure latency and task quality on your target workload." |
| "This isn't about memorizing formulas. It's about understanding gradients." | "Follow how each local derivative scales the parameter update during backpropagation." |
| "SentencePiece is a toolkit, not one algorithm." | "SentencePiece implements multiple subword tokenizers, including BPE and Unigram." |
| "Treat these numbers as an illustrative walkthrough; they do not establish production speed." | "On this 4-request batch, KV reuse cuts prefill work by 60%; benchmark steady-state throughput on your target GPU before tuning batch size." |
| "No fluff. No jargon. Just practical examples." | "Work through the matrix multiply by hand, inspect the PyTorch shapes, and verify the gradient norm." |

Keep negation when it carries mathematical or operational meaning: an impossible state, a mathematical property, an explicit prohibition, or a real misconception (`"A singular matrix has determinant zero, so it has no inverse"`, `"Never retry a non-idempotent write after an uncertain timeout"`). Preserve exact quotations, code, logical operators, and negative examples faithfully.

For comparisons, explain both mechanisms and their concrete trade-offs (`"BPE merges the most frequent adjacent byte pairs iteratively. Unigram starts with a large vocabulary and prunes tokens whose removal least increases corpus loss."`). Apply this standard across articles, metadata, glossary definitions, book openings, captions, illustration labels, and video narration.

### Banned phrases

These phrases make technical writing sound templated or promotional. Replace them across all content:

| ❌ Banned | ✅ Use instead |
|---|---|
| "delve into" / "delving" | "examine", "trace", "inspect", "explore" |
| "leverage" / "utilize" (as verbs) | "use", "apply", "build on" |
| "moreover" / "furthermore" | "also", "in addition", or start a new sentence |
| "it's worth noting" | State the point directly |
| "in essence" | State the core mechanism directly |
| "holistic" | "complete", "end-to-end", "comprehensive" |
| "myriad" / "plethora" | "many", "several", "a wide range of" |
| "tapestry" | Remove completely; describe the structure concretely |
| "underscores" / "underpin" | "highlights", "supports", "shows", "drives" |
| "pivotal" | "key", "central", "critical" |
| "seamless" / "seamlessly" | "smooth", "direct", "without extra steps" |
| "intricacies" | "details", "mechanics", "specifics" |
| "nuanced" (overused) | "subtle", "detailed", or name the exact trade-off |
| "landscape" (figurative) | "field", "ecosystem", "design space" |
| "navigate" (figurative) | "work through", "handle", "manage" |
| "paradigm" (overused) | "approach", "model", "pattern" |
| "let's unpack" | "let us trace", "here is how it works" |
| "hack the interview" | "master the concept" |
| "cram" / "cramming" | "review", "study", "practice" |
| "cheat sheet" | "reference guide", "quick reference" |

### Banned Bureaucratic and SOC2 Dialect

Outside lessons literally teaching IAM permissions or accounting ledgers (or the narrow technical exceptions listed below), never use this bureaucratic vocabulary in prose, headings, quizzes, captions, or illustrations:

| ❌ Banned dialect | Allowed narrow exception | ✅ Use instead |
|---|---|---|
| `fixture`, `fixtures` | pytest fixtures or evaluation datasets | example, sample, test case, small dataset |
| `contract`, `contracts` | literal API or schema contracts | rule, interface, schema, format, standard |
| `boundary`, `boundaries` | ML decision boundaries, OS sandboxes, or token boundaries | step, edge, limit, split, threshold, transition |
| `admit`, `admitted`, `admission` | none in ordinary prose | accept, allow, include, pass, approve |
| `receipt`, `receipts` | literal billing/ledger receipts | record, log, output, confirmation |
| `provenance` | formal data lineage | origin, history, source attribution |
| `authority` | IAM permission and authorization lessons | permission, ownership, source of truth |
| `establish`, `establishes` | none for hedging ("does not establish") | show, prove, demonstrate, confirm, verify |
| `supplied` | none | provided, given, input, example |
| `bounded` | none | limited, capped, finite, fixed-size |
| `fail-closed` | literal security/sandbox lessons | reject on error, block invalid output, exit with error |
| `governed` | literal AI governance policy lessons | controlled, audited, managed, checked |
| `needn't` | none | do not need to, need not |

**Guideline:** Write clear, natural engineering English. If a sentence reads like a compliance audit report or a corporate press release, rewrite it until it reads like a master technical textbook.

### Writing mechanics

- Use plain, accurate English, complete sentences, and American spelling.
- **Vary sentence and paragraph rhythm naturally.** Connect explanations into complete thoughts and let important results land clearly. Avoid rigid word, sentence, or paragraph quotas.
- Use active voice when the actor is known without inventing fake actors to avoid passive voice.
- Put conditions before actions (`"If the gradient norm explodes, clip gradients before the optimizer step."`) and place real safety or numerical warnings beside the step they protect.
- Break awkward noun chains with prepositions (`"the timeout for the connection pool"` rather than `"connection pool timeout"`).
- Keep one consistent technical name for each concept rather than cycling synonyms for variety.
- Avoid semicolons in ordinary prose by splitting clauses or linking them clearly with conjunctions.
- Use concrete observations and verified primary numbers instead of vague adjectives (`"robust"`, `"seamless"`, `"powerful"`), and never invent measurements to sound concrete.
- Trim filler phrases (`"in order to"`, `"in summary"`, `"as noted above"`) whenever direct wording carries the full meaning.

### Teaching rhythm and instructor presence

Strong technical prose reads like a cohesive argument rather than a compressed checklist or a script with mechanical questions bolted onto every heading.

Use a flexible progression suited to the subject:

> orient → motivate → compute by hand → formalize → inspect code → examine failure modes → bridge

- **Open cleanly without gotcha-first hijacking.** Start with one concrete behavior, puzzle, or set of numbers. Never cram model specs, architecture vocabulary, and corner-case caveats (`NaN` from all-`-\infty` masks, dropout non-convexity, `BFloat16` edge cases) into the introduction before teaching the core mechanism.
- **Build complete reasoning steps per paragraph.** Give setup, derivation, and interpretation enough space to become understandable. Break paragraphs where the thought changes or a result deserves emphasis.
- **Show concrete numbers before notation.** Let the reader see logits shift, gradients shrink, or KV blocks grow before introducing abstract symbols and equations.
- **Make questions earned.** Ask the reader to reason from something already taught, then use the answer to reveal a useful relationship. Avoid routine `"Before running/reading/checking/continuing..., predict..."` filler.
- **Let examples breathe.** Keep a single domain-native running example coherent long enough to carry the core derivation before adding scale or failure modes.
- **Use tables after orientation.** Tables compare and summarize mechanics the prose has already made clear rather than forcing readers to decode a dense matrix cold.
- **Give each article its own natural arc.** Avoid stamping identical section templates, checklists, or incident tables onto unrelated subjects.

### Natural contractions

Natural contractions (`don't`, `won't`, `it's`) are welcome when they fit the passage, and full forms (`do not`, `cannot`) work equally well for precision or emphasis. Never use stilted contractions such as `needn't`, and preserve exact wording inside code, literal strings, and quotations.

### Preserve meaning while editing

- Preserve facts, numbers, units, chronology, and the exact certainty of every claim.
- Keep requirements (`must`), recommendations (`should`), and uncertainties (`may`, `might`) distinct.
- Keep real technical limitations visible without softening confirmed failures into guesses or inflating possible risks into certainties.
- Preserve code identifiers, commands, flags, file paths, literal error messages, citations, and direct quotations unchanged during prose edits.

### Teaching voice requires editorial judgment

Evaluate prose in the context of the complete article rather than relying on regex checks or automated humanizers. Read the finished passage as a student: check that transitions flow smoothly, equations connect clearly to intuition, and technical names remain consistent. Identify the first complete worked result and check whether preceding material helps the reader reach it.

Ask a reviewer to explain the central mechanism and solve a small new case using the lesson alone. A passing word scan, imported numerical library, quiz schema, or rendered diagram does not demonstrate those abilities. Judge examples by the computation they perform and visuals by the relationship they reveal.

When a lesson changes, compare its web and reader editions, book introduction, exercises, figures, selected video narration, and previous/next handoffs. Keep the central example, symbols, prerequisites, and promised learning outcomes consistent. Mark any unreviewed or unpublished format as pending instead of extending one format's signoff to all of them.

Record each review's actual findings, verified sources, executed checks, and remaining gaps honestly. Never infer review completion from a validator log alone.

---

## Content Structure

Articles can share one source while publishing different book and website passages. Use frontmatter `visibility.website` and `visibility.book` for article eligibility, and paired `leetllm: audience` comments for text variants. Keep variants beside the shared prose and validate both views. See [Independent book and website content](BOOK.md#independent-book-and-website-content) for the syntax, visibility defaults, and validation commands. The book preset owns chapter selection and order; website navigation remains canonical.

### Title ownership

Page shells render the metadata `title` as the only H1. Do not add a `# ...` heading to article or blog `content.md` bodies. Start body content with the opening hook. Use `## ...` for body sections.

### Degree replacement bar

LeetLLM should take a motivated student from beginner to employable AI engineer.

That requires three layers:

1. **Foundation:** programming, math, statistics, computer science, classical ML, and deep learning basics.
2. **Specialization:** LLM internals, RAG, agents, evaluation, fine-tuning, inference, safety, and system design.
3. **Employment proof:** labs, capstones, design docs, eval reports, deployment artifacts, and interview practice.

Do not call the curriculum degree-replacing unless all three layers exist. Articles without exercises and shipped artifacts are not enough.

### Course core standard

All foundation, machine learning, and production labs must follow [COURSE_CORE.md](./COURSE_CORE.md).

- Use **NumPy** for shape reasoning, from-scratch algorithms, probability simulations, and statistics demonstrations.
- Use **PyTorch** for tensors, autograd, training loops, GPU execution, neural networks, and LLM workflows.
- Use **SciPy**, **pandas**, **scikit-learn**, Hugging Face libraries, FastAPI, and Docker where they serve the lesson cleanly.
- Never replace machine learning, deep learning, vision, NLP, RL, or RAG code with "Zero-ML" standard-library mock lookups or fake word counters.
- Never clutter ordinary educational Python cells with defensive type-police boilerplate (`isinstance(..., bool)`, `type(x) not in (int, float)`, or excessive `math.isfinite` checks) unless input validation or schema parsing is literally the topic.
- Keep PyTorch as the primary training framework, introducing JAX only after PyTorch foundations to build research-code literacy; avoid making TensorFlow, LangChain, LlamaIndex, or proprietary wrapper SDKs part of the core path.
- Every foundation article should contain a runnable implementation exercise and a concrete failure case placed after the core mechanism is clear.

### Sections (15 roadmap phases, 199 visible learn articles plus blog posts)

| Section | Folder | Articles | Focus |
|---|---|---|---|
| **Computing Foundations** | `foundations/` | 9 | Git, shell, Linux, Docker, Python, NumPy shape reasoning, CUDA/MPS basics, data structures, SQL, algorithms, and local engineering habits for reproducible AI work |
| **Math & Statistics** | `foundations/` + `preparation/` | 9 | Calculus for gradients, vectors and tensors, deeper linear algebra, optimization algorithms, probability, Bayesian inference, statistics, distributions, Markov chain Monte Carlo, hypothesis testing, bootstrap, pass@k, and uncertainty |
| **Preparation & Prerequisites** | `preparation/` | 13 | Neural networks, CNNs, RNNs, autoencoders/VAEs, training math, softmax, Transformers, language modeling, prompting, production API calls, first AI app, and the LLM lifecycle |
| **ML Algorithms & Evaluation** | `foundations/` | 15 | Regression, classification, tree ensembles, reinforcement learning, validation, statistical learning theory, conformal prediction, clustering, latent-variable models, retrieval, decoding, experiments, causal inference, PyTorch loops, and dataset quality |
| **Production ML Systems** | `foundations/` | 6 | Feature engineering, online/offline feature parity, boosted models, ranking, forecasting, monitoring, and continuous training |
| **Core LLM Foundations** | multiple | 8 | Tokenization, embeddings, evaluation basics, file ingestion, chunking, and instruction-tuned chat |
| **Applied LLM Engineering** | multiple | 25 | Medium-depth reasoning, tool use, context engineering, responsible AI, differential privacy, human feedback data systems, RAG, evaluation, prompt optimization, observability, caching, cost, routing, and product design patterns |
| **Portfolio Capstones** | `foundations/` | 9 | Shippable ETA, ranking, forecasting, damaged-package vision, predictive-ML pipeline, document QA, eval dashboard, classifier, and reproducible research projects |
| **Transformer Deep Dives** | `fundamentals/` | 8 | Sentence embeddings, vector scoring, attention, image encoders, positions, normalization, mechanistic interpretability, and decoding internals |
| **Advanced Training & Adaptation** | `training/` + `fundamentals/` | 18 | Scaling laws, data pipelines, decoder-only pretraining, JAX research workflows, continued pretraining, synthetic data, supervised fine-tuning, mixed precision, distributed training, parameter-efficient tuning, training-run operations, reward modeling, alignment, rewards, distillation, decision models, and merging |
| **Advanced Agents & Retrieval** | multiple | 17 | Vector indexes, GraphRAG, enterprise security, structured outputs, code and GUI agents, local execution isolation, memory, HITL, recovery, RLMs, multi-agent orchestration, and a production-agent capstone |
| **Inference & Production Scale** | `fundamentals/` + `llmops/` | 31 | Accelerator architecture, profiling, GPU primitives, runtime execution, generated-kernel verification, GEMM, low precision, serving mechanics, KV cache, batching, model parallelism, quantization, failure operations, distributed data planes, deployment, benchmarking, and experiments |
| **System Design Capstones** | `system-design/` | 10 | End-to-end system designs for AI products and an agent sandbox platform |
| **AI Lab Interviewing** | `interviewing/` | 4 | Production-shaped coding, system design, behavioral evidence, and technical presentation practice for AI lab interviews |
| **Project Deep Dives** | `projects/` | 17 | Code-level studies of vLLM, SkyRL, FlashAttention, FlashInfer, DeepGEMM, NCCL, Megatron, DeepSpeed, Ray, MLflow, PyTorch, Transformers, SGLang, slime, DeepEP, Tinker, and Light-PEFT, including their mechanisms, research roots, teams, and production tradeoffs |

### Open Content Access

LeetLLM is a nonprofit educational project. All learn articles will remain open. Do not add `isPremium` to article metadata. The content loader derives `isPremium: false`, and logged-out users should receive the full article body. Login may still be offered for saving progress, bookmarks, or "mark as read" state, but it must not gate reading.

Every article should provide its complete explanation to every reader.

### Roadmap progression

The `/learn` roadmap is a linear curriculum. A reader should be able to click **Next** repeatedly without needing to leave the path for prerequisites. Phase sections should support that path rather than preserve topical silos.

- The global click-next path should progress as one Easy block, then one Medium block, then one Hard block.
- Don't place an Easy article after a Medium or Hard article in the global roadmap.
- Don't preserve a topical grouping if it forces an Easy/Medium/Hard reset inside the section.
- Introductory sections should define terms before using them, link to earlier prerequisite articles, and avoid assuming prior ML background.

### Didactic progression standard

Every article contributes a clear step to the curriculum. Write so an engineer can move through the chapter in order and watch the concept sharpen at every stage.

Inside each article:

1. **Start from the reader's current state.** Name any prerequisite idea and recap it briefly in plain English before building on it.
2. **Teach one core idea at a time.** Do not pack a formula, code block, architecture diagram, and edge-case caveats into the opening paragraph.
3. **Show the smallest concrete case first.** Use a tiny sentence, toy tensor, sample data row, or small matrix before scaling up.
4. **Add complexity in clear layers.** Move from concrete numbers to the core mechanism, from the mechanism to mathematical formulation and runnable code, and only then to edge cases, numerical corners, and production consequences.
5. **Make each step verifiable.** Include concrete outputs, assertions, or debugging symptoms so the reader can confirm their understanding without mechanical prediction spam.
6. **End with a conceptual handoff.** Explain what the reader can now build or diagnose and why the next article depends on this one. Every non-final lesson must end with a Markdown callout in this format: `> **Next:** Continue to [Next Article](/learn/next-slug). ...` The final lesson ends with a course-complete callout pointing back to the roadmap.

### Narrative architecture and section handoffs

Fix the dependency order before polishing prose. For every substantial article or blog post, check the reverse outline so each `##` section performs one distinct teaching job. Merge duplicate sections, and introduce prerequisites before any section that depends on them.

Keep a clear concept progression during review:

- first definition;
- first concrete example;
- first visual or tensor shape;
- first formula or runnable implementation;
- first edge case or failure mode;
- first production use.

Normally those stages unfold in that order, avoiding gotcha-first openings that dump edge cases before the mechanism itself is taught. Later sections can revisit an earlier idea when adding a new layer such as optimization, GPU execution, or serving scale, whereas repeating the same explanation under a new heading adds bloat instead of depth.

Long chapters need a coherent running example. Choose one domain-native tensor, sentence, gridworld, request trace, or dataset and keep its identifiers, shapes, and values consistent across prose, tables, code, diagrams, illustrations, and checks unless the text explicitly explains a change. Switch examples only once the original one has finished its teaching job.

Adjacent major sections need a causal hinge: the closing paragraph confirms what was just shown and poses the concrete question that makes the next section necessary, and the opening paragraph answers that question directly without `"next we'll cover"` boilerplate.

Use links according to their teaching role:

- glossary link for a technical definition;
- local anchor for an idea already covered in the same chapter;
- earlier lesson for a prerequisite or deeper derivation;
- official primary source citation for factual evidence.

Link where the knowledge is used and explain the connection in prose instead of appending detached "see also" lists. Public lessons and public blog posts must never link to private or unlisted content.

Learning comes before career framing. Introduce interview relevance, portfolio artifacts, and production checklists only after the reader understands the mechanism and can follow the runnable code.

Give the reader an inviting way into the subject: a familiar observation, a useful question, a picture, or a small example. Explain enough of the setup for the first computation to make sense. An engineering problem or numerical puzzle can work well, but neither is a required opening. Avoid generic top-of-article scaffolding such as `Where this chapter sits` or course-position tables.

Always write published lessons in complete, fluent textbook sentences rather than terse "caveman" fragments.

### Foundation Teaching Bar

Choose the structure that teaches the subject most clearly: a running example, a worked derivation, a debugging walkthrough, a code lab, or a systems trace.

For math, statistics, and other foundation chapters, apply these principles:

- Keep one domain-native running example until it has finished its teaching job.
- Teach with concrete numbers before abstract notation: compute the small vector, probability table, or loss value by hand before writing general symbols.
- Pair every equation with a plain-English explanation of every symbol.
- Connect the chapter near the top to what came immediately before and what concrete problem it solves, without dumping corner-case caveats up front.
- Walk through worked derivations carefully enough that a beginner can verify every intermediate step by hand.
- Explain likely mistakes through concrete symptoms, root causes, and fixes.
- Give informative feedback on practice exercises through worked solutions, expected outputs, or reasoning checks rather than bare yes/no answers.
- Close with a genuine conceptual handoff naming the exact downstream task or mechanism the next lesson unlocks.

Across the roadmap:

- Earlier articles must teach the terms, shapes, algorithms, and evaluation habits later articles assume.
- Later articles should briefly point back to the prerequisite article when they reuse a concept.
- Avoid jumping between unrelated hard topics. If a topic requires a missing prerequisite, add the prerequisite or move the topic later.
- A reader should be able to click **Next** from Python and tensor basics through statistics, ML algorithms, LLM internals, agents, retrieval, training, inference, and system design without feeling forced to build their own curriculum.

### Article File Layout

```
web/src/content/
├── foundations/
│   ├── python-for-ai-engineering/
│   │   ├── content.md        # JSON frontmatter + article body
│   │   └── illustrations/
├── preparation/
│   ├── neural-networks-from-scratch/
│   │   ├── content.md        # JSON frontmatter + article body
│   │   └── illustrations/
├── fundamentals/
│   ├── scaled-dot-product-attention/
│   │   ├── content.md        # JSON frontmatter + article body
│   │   └── illustrations/
│   │       ├── attention_matrix.tsx
│   │       └── _generated/          # Build output (auto-generated PNGs)
│   └── ...
├── agents/
├── retrieval/
├── llmops/
├── training/
├── system-design/
└── blog/
```

**Published articles** use `content.md` with JSON frontmatter. Legacy `metadata.json` bundles are supported by loaders but should not be used for new content. Preserve **stub directories** containing only `illustrations/`; they are intentional placeholders.

| File | Purpose |
|---|---|
| `content.md` | JSON frontmatter for routing/cards/SEO/search labels plus full article content |
| `illustrations/` | Custom JSX illustration components that pass illustration value gate |
| `illustrations/_generated/` | Auto-generated PNG renders (dark + light; gitignored) |

### Content Frontmatter Schema

The canonical schema is at `web/src/content/metadata.schema.json`.

| Field | Description |
|---|---|
| `id` | Must match the directory name (slug). Required. |
| `title` | Short, scannable (aim for ≤40 chars). Focus on the *topic*. |
| `slug` | URL-safe identifier. Must match directory name. |
| `section` | One of the 15 roadmap phases (see schema enum). |
| `category` | Fine-grained topic category (see schema enum). |
| `order` | Display order within section (1-indexed). |
| `difficulty` | `"Easy"`, `"Medium"`, or `"Hard"`. |
| `shortDescription` | 1-2 sentence description for cards and SEO meta. |
| `keyConceptsTested` | Concept strings for tagging. |
| `companies` | Companies where this topic is relevant. |
| `coverImage` | Optional path to the preferred OG image. When omitted, runtime uses social banner, first article image, then default OG fallback. |

Derived fields are not stored in frontmatter:

- `isPremium` is always derived as `false`.
- `timeEstimate` is calculated from article body length.
- `references` are collected from inline `[^key]` citations and resolved through `references.json`.

Keep article-level learning material in `content.md`, not metadata. Evaluation rubrics, follow-up questions, common pitfalls, mastery criteria, and practice answers should be ordinary article sections so raw Markdown remains self-contained. Do not add `rubricPoints`, `followUpQuestions`, or `commonPitfalls` to frontmatter.

Use this optional content block when a lesson needs a structured recap:

````markdown
<!-- leetllm: mastery:start -->

## Mastery check

### Key concepts

- Concept label

### Evaluation rubric

- **Foundational:** Criterion
- **Intermediate:** Criterion
- **Advanced:** Criterion

### Follow-up questions

```checkpoint
Question?
---
Answer.
```

### Common pitfalls

- Mistake or misconception

<!-- leetllm: mastery:end -->
````

Every learn article must also end with one scored multiple-choice mastery quiz immediately before its final `Next` or `Course complete` callout. Use 5 to 10 questions based on the lesson's important testable outcomes. Five is a floor, not a target: add questions when a distinct core decision, calculation, failure mode, invariant, or transfer case would otherwise go untested, but never pad a focused lesson. A score of 75% or higher passes and marks the article complete.

````markdown
```mastery-quiz
[
  {
    "question": "Which component owns authorization for a tool write?",
    "options": [
      "The application runtime",
      "The model prompt",
      "The client-side schema",
      "The retrieval index"
    ],
    "answer": "The application runtime",
    "explanation": "The model proposes an action. The trusted application runtime validates identity, policy, and authorization before executing a write."
  }
]
```
````

Quiz authoring rules:

- Use exactly 4 distinct options per question.
- Read the complete article and map its important testable outcomes before choosing the question count.
- Cap quizzes at 10 questions. Prefer fewer only when coverage remains complete and non-repetitive.
- Make each answer exactly match one option.
- Explain why the answer is correct after submission.
- Test decisions, calculations, failure diagnosis, and transfer, not only term recognition.
- Make every distractor a realistic adjacent misconception that directly answers the question and remains definitively wrong under a charitable reading.
- Review options for unintended answer cues in grammar, specificity, polish, or detail. Prefer natural, precise wording; don't pad distractors or enforce character-length distributions.
- Runtime shuffling remains required. Answer positions in the authoring file are not evidence of teaching quality.
- Avoid joke answers, vague filler, and obvious opposites. Judge each distractor in its question's context; a concept can be correct in one situation and wrong in another.
- Check that explanations teach the relevant reasoning and that questions cover the lesson's outcomes; phrase matching alone never guarantees either.
- Do not reveal answers before submission.
- Keep the quiz block out of the prose reading-time estimate.
- Run `uv run scripts/validate-mastery-quizzes.py` after edits to check JSON structure, required fields, distinct options, answer keys, question-count bounds, and block placement. Coverage, factual accuracy, ambiguity, and answer cues require manual review.

### Reading-Time Rule

Do not add `timeEstimate` to frontmatter. Reading time is derived by the content loaders and checked by `uv run scripts/update-time-estimates.py --check`. The estimator counts article words, applies a base WPM, weights code blocks/tables, and scales by difficulty coefficient (`Easy`, `Medium`, `Hard`). Blog posts use the `Medium` coefficient.

---

## Heading Hierarchy

Use proper Markdown headings for all structural divisions. **Never use bold text as a substitute for headings.**

| ❌ Don't | ✅ Do |
|---|---|
| `**Key observations:**` (standalone, followed by content) | `#### Key observations` |
| `**Benefits:**` (followed by bullet list) | `#### Benefits` |

**When to use `####`:** For sub-subsections within a `###` section (e.g., listing advantages, key findings, deployment guidance). These improve navigation, accessibility, and SEO.

**When bold is appropriate:** Inline labels that introduce a specific item within a paragraph or before a code block (e.g., `**Linux:**` before an installation command, `**Example:**` before a single code snippet) should stay as bold text.

---

## Citations & References

Technical claims should be supported by a **primary source**, a transparent derivation, or a reproducible computation. Cite research findings and external facts where they are used. Ordinary explanation, analogies, and arithmetic in a worked example do not need a citation after every sentence.

### Principles

1. **Cite the original paper.** When discussing a technique, always cite the paper that introduced it.
2. **Prefer primary sources.** Original papers (arXiv), official documentation, conference proceedings, and first-party engineering blogs.
3. **Avoid secondary-source-only citations.** Medium posts and tutorials aren't authoritative.
4. **Be precise.** Cite the specific result or equation, not the paper in general.

### Source Hierarchy

| Priority | Source Type | Examples |
|---|---|---|
| 1 | **Original papers** | arXiv, NeurIPS, ICML, ACL, ICLR |
| 2 | **Official documentation** | PyTorch, HuggingFace, NVIDIA CUDA |
| 3 | **First-party engineering blogs** | Google AI, Meta AI, Anthropic, OpenAI |
| 4 | **Authoritative textbooks** | Goodfellow et al., Jurafsky & Martin |
| 5 | **Reputable community** | Lilian Weng, Jay Alammar, Karpathy |
| 🚫 | **Avoid as sole source** | Medium, StackOverflow, undated blogs |

### Reference System

References are cited inline in `content.md` and resolved through `web/src/content/references.json`. Do not add `references` to frontmatter. **Do NOT put footnote definitions in content.md**; they're auto-generated at build time.

**How it works:**
1. In `content.md`: use `[^key]` inline citations (e.g., `[^vaswani2017]`)
2. In `references.json`: define each cited key once
3. At build time: footnote definitions are generated automatically

**Citation keys** follow `{first_author_surname}{year}`, lowercase. For collisions, append a letter: `chen2023a`.

### Canonical References Registry

Track all reference keys in `web/src/content/references.json`, the **single source of truth**.

**Rules:**
1. Before adding a new reference, check if the paper already exists in `references.json`
2. If it exists, **reuse the existing key**
3. If not, add it to `references.json` first, then cite it in your article with `[^key]`
4. Same key must always point to the same URL

Required fields: `title`, `authors`, `year`, `url`, `type` (`"paper"` or `"resource"`). Optional: `venue`, `note`.

### Fact Verification

**Verify technical claims, specifications, and reported measurements.** Check external facts against primary sources, derive equations, and execute the examples. The cited claim must match its source. This is an authoring responsibility; it should not turn the lesson into a sequence of defensive qualifications.

> **⚠️ Hard rule.** A beautifully written article with incorrect facts is worse than no article at all. We can't afford inconsistencies.

#### What must be verified

**All** of the following claim types require explicit verification before publishing:

| Claim Type | Examples | Verify Against |
|---|---|---|
| **Benchmark numbers** | "scores 92.4% on MMLU", "achieves 8.1% on SWE-bench" | The original paper's results table or leaderboard snapshot |
| **Architecture specs** | "uses 32 attention heads", "has a 128K context window" | Model card, technical report, or official documentation |
| **Training details** | "trained on 15T tokens", "uses a 4-stage pipeline" | The training paper's methodology section |
| **Historical claims** | "introduced in 2017", "was the first model to..." | The original publication date and prior work |
| **Comparisons** | "2x faster than X", "outperforms Y by 15%" | The comparison paper, using the same benchmark conditions |
| **Model names & versions** | "DeepSeek-R1", "Llama 3.1 405B" | Official release announcements or model cards |
| **Equations & algorithms** | Step counts, variable definitions, operation order | The original paper's formulation |
| **Cost & latency figures** | "$0.15 per million tokens", "p99 latency of 200ms" | Provider pricing pages or the benchmarking paper |
| **General knowledge claims** | "attention is O(n²)", "BPE merges the most frequent pairs" | Standard textbooks or original papers |

#### Verification procedures

1. **Read the source, don't trust memory.** Open the cited paper/doc. Check the abstract, results tables, and methodology. Don't rely on what you "remember" a paper saying.
2. **Cross-check numbers exactly.** If you claim "92.4%", the source must say 92.4%, not 92.3% or "approximately 92%". Round only when explicitly noted.
3. **Verify pipeline/process descriptions step by step.** If you describe a 4-stage training pipeline, confirm the source actually has 4 stages, and that your labels match the paper's labels.
4. **Check that comparisons are apples-to-apples.** Same benchmark, same split, same evaluation protocol. Don't compare a model's score on MMLU-Pro with another's on MMLU.
5. **Confirm chronological claims.** "First to do X" claims are dangerous. Verify no prior work exists.
6. **When in doubt, cut it.** If you can't verify a claim to a primary source, remove it or soften it to clearly signal uncertainty ("reportedly", "according to unofficial benchmarks").

#### Performance evidence standard

A speedup, throughput, latency, memory, utilization, or efficiency number is incomplete unless the reader can reconstruct what was measured. Attach all five parts to the claim or omit the number:

1. **Hardware and software:** accelerator model and count, topology when distributed, framework or engine, and material version information.
2. **Workload:** tensor shapes or request distribution, batch and sequence lengths, concurrency, and warmup or steady-state conditions.
3. **Precision and algorithm:** data types, quantization or scaling scheme, kernel or decoding path, and any approximation.
4. **Baseline:** exact comparison implementation and whether both paths received equivalent tuning.
5. **Correctness method:** tolerances, reference outputs, task-quality checks, or another test proving that faster work is still valid work.

For serving results, prefer goodput under explicit TTFT and inter-token-latency SLOs over raw request or token throughput. For kernel results, separate launch overhead, memory traffic, and arithmetic work; report synchronization and timing method. Vendor peak numbers describe hardware ceilings. Application performance requires a workload measurement.

Curated source lists can identify strong primary material, but they aren't evidence by themselves. Cite the original paper, specification, official documentation, implementation repository, or reproducible implementer report that supports the nearby claim.

#### Common error patterns

Watch for these frequent mistakes during review:

- **Swapped numbers:** Confusing one model's score with another's from the same paper.
- **Outdated figures:** Using benchmark numbers from v1 of a model when v2 exists.
- **Misattributed innovations:** Crediting a technique to the wrong paper (e.g., attributing Flash Attention to the Transformer paper).
- **Conflated concepts:** Mixing up related but distinct ideas (e.g., RLHF vs. DPO, LoRA vs. QLoRA).
- **Fabricated specifics:** Plausible-sounding but made-up numbers that no source actually states.
- **Stage/step miscounts:** Describing a 3-stage process as 4 stages, or mislabeling the stages.

### Refreshing article and blog research packets

Every article and blog bundle keeps raw research context in its sibling `_research.md`. These files are editorial briefings for humans and agents writing `content.md`. They are not rendered on the site, and they are excluded from public lastmod generation.

Read an article's existing packet as background, not as verified evidence. Open the primary sources for its claims during that article's review. Preserve raw research unless the user specifically asks to refresh it. A URL or a model-generated briefing doesn't prove the claim beside it.

Review and edit one complete article bundle at a time. Don't use scripts, model loops, replacement maps, or shared prompts to rewrite a section or the curriculum. This applies to prose, metadata, quizzes, research packets, and generated social art. Each example, question, and illustration needs an article-specific editorial decision.

Read-only inventory and validators may scan the corpus. Deterministic builds may render reviewed illustration sources, generate glossary indexes, and refresh executable-example output. Those operations verify or derive artifacts; they don't author lessons or count as editorial review.
---

## Writing an Article

### Beginner Accessibility (Critical)

LeetLLM's audience includes career switchers, students, and engineers new to ML. Every article should have a gentle on-ramp.

#### Start with a concrete hook

The opening should be understandable with **no ML background**. Start with a concrete scenario or observable behavior, then introduce technical terms as the explanation needs them.

| ❌ Bad opening | ✅ Good opening |
|---|---|
| "Self-attention computes a weighted combination..." | "When you read 'The cat sat on the mat because *it* was tired,' you instinctively know *it* refers to *the cat*. Transformers do something remarkably similar..." |
| "The KV cache allows autoregressive decoding to avoid redundant computation." | "When a model generates text one token at a time, it reuses saved keys and values for earlier positions. This avoids recomputing them at every step." |

#### Use analogies to build intuition

Use familiar objects, stories, geometry, and physical intuition freely when they make an unfamiliar mechanism easier to follow. An analogy can open a lesson, support a derivation, or remain a running visual model. A direct numerical example also works well; choose the approach that helps this reader.

A useful analogy:

- maps specific parts of analogy to technical objects;
- connects naturally to the real mechanism or worked example;
- stays consistent if reused later;
- explains a limit at the point where the reader might otherwise make a consequential wrong inference.

Do not interrupt every analogy with a disclaimer or abandon it before it has done its teaching job. Avoid stacking unrelated metaphors that force the reader to learn several new mappings. Let an appealing example make the subject memorable while keeping its mathematics faithful.

#### Define every term and acronym on first use

**Hard rule.** When a term or acronym first appears, briefly introduce it inline. The reader should never encounter unexplained jargon.

| ❌ Bad | ✅ Good |
|---|---|
| "We apply RLHF to fine-tune the model." | "We apply RLHF (Reinforcement Learning from Human Feedback) to fine-tune the model. Human preference judgments guide policy optimization." |
| "Use BPE for tokenization." | "Use BPE (Byte-Pair Encoding), an algorithm that iteratively merges the most frequent character pairs to build a vocabulary." |

Well-known terms (API, GPU, JSON) don't need definitions. Define other terms on first use, then use the short form.

For reusable or advanced terms that deserve a richer explanation, wrap the first mention with a glossary span:

```html title="glossary-term.html"
<span data-glossary="fifo-work-queue">FIFO work queue</span>
```

The visible text must still read naturally without clicking. Define reusable entries as one Markdown file per id in `web/src/content/glossary/<id>.md`, then run `pnpm --dir web glossary:build` to refresh `web/src/generated/glossary.ts`.

**Required surface (lean):** frontmatter `title`, `importance` from 0 to 100, optional `kind: code`, a definition paragraph that teaches the idea, `## Example` (concrete), `## Why it matters here` (curriculum/product linkage), and `## Related terms` with `glossary://` links. Add alternate names and expanded acronyms as a JSON array, for example `aliases: ["graphics processing unit", "graphics processor"]`. Aliases must be unique across entries. Leety matches canonical titles and aliases longest-first, so a specific phrase such as `GPU partitioning` wins over `GPU`. An optional fenced code example belongs in whatever section teaches best.

**Optional teaching sections:** add only what helps this term. Prefer term-specific headings (`## Formula`, `## Intuition`, `## Shape check`, `## Sizing`, `## Worked numbers`, `## Debug path`, …). Do **not** force stock scaffolds such as `## Decision rule`, `## Common mistake`, or `## Failure surface` when they would be generic or redundant. If a pitfall or decision really teaches, write it under a specific heading or weave it into the example.

Link related entries inside `## Related terms` with Markdown links such as `[Tokenization](glossary://tokenization)`; the glossary modal opens those terms in place. If a learner clicked, assume they want the deeper mental model, not only a one-line definition. Use glossary spans for first mentions, dense tables, acronyms, and standard-library APIs that may be unfamiliar. Do not wrap every repeated mention.

#### Bridge prerequisite knowledge

When referencing a concept from another article, provide a 1-2 sentence recap before using it.

### Content length follows the teaching goal

No universal line count guarantees completeness. A focused lesson may be shorter than 250 lines; a comprehensive treatment may need book length. Keep enough material to ground the prerequisites, work a concrete example, explain the mechanism, test understanding, cover important failure modes, and transition naturally. Never pad an article with extra examples, paragraphs, callouts, or production sections only to hit a line-count target.

### Choose an article arc that fits the subject

Most lessons need a concrete opening, vocabulary on demand, a visible mechanism, practice with feedback, important failure modes, and a natural transition forward. They do not need the same headings or the same order. Choose an arc that matches the teaching goal:

- **Mechanism chapter:** observed behavior → minimal trace → internal states → implementation → failure signature.
- **Derivation chapter:** concrete numbers → notation → derivation → numerical check → edge case.
- **Systems chapter:** request or batch lifecycle → component responsibilities → queues and resources → observability → controlled recovery.
- **Decision chapter:** available evidence → viable objectives or designs → tradeoffs → decision rule → counterexample.
- **Lab chapter:** hypothesis → build → visible output → deliberate break → diagnosis → verified fix.

Mix these arcs when the subject demands it. Never add artificial headings such as "mental model," "break it," or "ship it" unless they are the clearest headings for that specific lesson. Teach the core mechanism cleanly from first principles before introducing corner cases; never hijack an introduction with premature edge-case warnings such as NaN masks, dropout non-convexity caveats, or BFloat16 rounding corners before the reader sees how the normal computation works.

Reserve interactive exercises for genuine conceptual checks where testing an assumption clarifies a mechanism. Never spam repetitive "Before running this, predict..." or "Before reading on, pause and guess..." prompts throughout prose or code snippets.

### Callout Boxes

Use callouts when a warning, misconception, key distinction, or result needs emphasis. Use descriptive text labels. Omit decorative emoji.

```markdown title="callouts.md"
> **Key insight:** Important conceptual takeaway.
> **Common mistake:** Frequent pitfall engineers hit in production.
> **Research insight:** Surprising finding from the literature.
> **Production tip:** Practical engineering advice for real systems.
```

For platform notes, warnings, or alternatives that should render as a stronger UI box, use the shared HTML callout primitive:

```html title="callout-platform-note.html"
<div data-callout="warning" data-callout-title="Platform path">
  <p>Mac users should follow the MPS lesson. NVIDIA users should follow the CUDA lesson.</p>
</div>
```

Supported `data-callout` variants: `info`, `warning`, `tip`, `success`.

### Math & Code

- Use LaTeX for equations: `$inline$` within a sentence and display math on separate lines. Put each `$$` delimiter on its own line, with the equation between them and blank lines around the block. A one-line `$$equation$$` parses as inline math in our Markdown renderer.
- Choose the format by what the block teaches. Equations and worked arithmetic belong in math, runnable source belongs in a fence with its real language, and logs or literal output belong in `text` fences. Preserve code identifiers and executable operators such as `**`, `//`, and `==` inside code. Do not turn them into mathematical notation.
- Do not put a teaching equation in a `text`, `math`, or `latex` code fence. Fences show literal source. Use a LaTeX fence only when the lesson is teaching LaTeX source itself.
- Use prose, lists, or tables for explanations and comparisons. Keep `text` fences for literal prompts, transcripts, file trees, output, and pseudocode whose spacing matters. Do not use them as boxes for ordinary paragraphs or formulas.
- Use KaTeX-supported commands. Prefer `\tau^{*}` to the unsupported `\tau^\*`. Check the rendered formula, including its fractions, limits, subscripts, units, and line breaks. Use `aligned` or `split` when a derivation would otherwise be too wide for a phone or the book's text column.
- **Escaping currency:** Write a literal price in Markdown as `\$10` to prevent the math parser from treating the dollar sign as a delimiter. Prefer `\text{USD}` for monetary units inside equations.
- Checkpoint questions and answers are Markdown too, so their currency needs the same escape. Inside mastery-quiz JSON strings, write `\\$10`: JSON decoding preserves the backslash needed by Markdown. Keep literal dollars unchanged in executable code and output fences.
- Figure caption text supports inline Markdown math in both outputs. Escape currency there as `\$10` too. Leave dollar signs literal inside actual HTML `code` elements.
- Use fenced code blocks with language annotations. Prefer Python with PyTorch, NumPy, scikit-learn, SciPy, or real systems tools.
- **Compute the mechanism being taught.** Use runnable NumPy, PyTorch, scikit-learn, SciPy, or systems code when they express it clearly. A small standard-library implementation, gridworld, or numerical simulation is welcome when it actually computes the algorithm. Do not substitute canned predictions, hardcoded success flags, or string matching for model behavior and then claim to have demonstrated learning, prompting, or retrieval quality. For model-call examples, show the actual inputs, outputs, and relevant settings; saved real outputs can support offline reading.
- **No Python type-police boilerplate.** Omit defensive runtime validation noise such as `isinstance(x, bool)`, `type(x) not in (int, float)`, or repetitive `math.isfinite(...)` checks in normal pedagogical examples unless input validation, numerical stability, or defensive API parsing is explicitly the lesson topic.
- **Always introduce code before showing it.** Never jump straight into a code block. Before every snippet, explain what it computes, what goes in, and what comes out. This is a **hard rule**.
- Articles can ship local downloadable files in `assets/`. Link them as relative markdown paths like `[Download corpus](assets/shakespeare.txt)`. Content resolution rewrites those to `/api/content-asset/...`, and runnable Python examples can open the same files from `Path("assets/...")`.
- Mark complete copy-runnable Python examples with `<!-- leetllm: test -->` immediately before the fenced block. These examples must run with `uv run scripts/validate-python-examples.py`; partial fragments, API snippets requiring secrets, and multi-file projects should stay unmarked until they are turned into self-contained labs.
- Add `output=show` to that marker when stdout is used directly in the next explanation, or `output=folded` when stdout is useful but secondary. Use `id=mini-lab` on a cell that should expose state to later cells, then `continue=mini-lab` on the next cell to reuse the same Python session and emit a separate generated output block for that cell. Add `output_title="Sample completion"` when the output block needs a custom label instead of the generic `Output`. Keep continuations linear: one next cell per `id`. Use `output_head=10`, `output_tail=10`, or `edges:2:5` to trim long stdout while keeping headers and final summaries. During an individual bundle review, refresh its generated output with `uv run scripts/validate-python-examples.py --article <slug> --write-outputs`, then inspect the result. Shown output is emitted as a `text` fence with that title, and folded output uses the same label in its accordion summary.
- Code-like fences should include a descriptive title or filename, such as ```` ```python title="train.py" ```` or ```` ```json title="eval-row.json" ````. Use actual filenames when a snippet creates or represents a file. Use a concise descriptive filename for standalone examples, and `terminal` for shell commands that are not a file.

### Diagrams

- **Mermaid syntax** for short architecture and flow diagrams.
- Choose the diagram direction to fit its relationships and the article's reading width. Use `LR` for compact horizontal flows and `TB`/`TD` when vertical grouping makes the mechanism clearer.
- **Check the rendered layout at reading size.** Node count alone doesn't determine width or legibility. If labels become cramped, group the flow, use multiple lanes, or split the figure instead of shrinking text.
- **Subgraph IDs:** Use `subgraph ID ["Label"]` form with camelCase identifiers. Use `subgraph " "` for invisible layout spacers.
- **Every article:** ≥1 Mermaid diagram or annotated table. Use Mermaid when teaching flow, state, dependency, or architecture. **System Design:** 2-3 diagrams.
- Define unfamiliar terms, symbols, abbreviations, and state names in prose before they appear in a diagram. A caption may reinforce a definition, but it must not be the reader's first required explanation.
- Diagrams must teach order, dependency, or information flow. Don't add decorative diagrams that repeat the prose.
- Treat every depicted owner, state, edge, count, threshold, and before/after value as a factual claim. Trace them against the article's running example and implementation so the visual doesn't move state to the wrong component, invent a transition, or show an output that the rules would reject.
- For step-by-step topics, number the diagram stages or label the handoff between stages.
- For math-heavy topics, include shape labels, variable names, or before/after values directly in the diagram.
- For production topics, include failure paths, observability points, and rollback or fallback paths where relevant.

### Mermaid Semantic Classes

Apply colors using `:::className` syntax. The build system injects `classDef` rules automatically. **Do not write `style` or `classDef` manually**.

| Class | Color | Usage |
|-------|-------|-------|
| `:::primary` | Purple | Key/central nodes |
| `:::secondary` | Blue | Supporting components |
| `:::success` | Green | Positive outcomes, results |
| `:::warning` | Amber | Decisions, conditional logic |
| `:::danger` | Red | Errors, failures, bottlenecks |
| `:::accent` | Cyan | Special emphasis |
| `:::muted` | Slate gray | Background, infrastructure |

Place `:::className` **after** the closing bracket: `A["text"]:::primary`.

### Mermaid Syntax Gotchas

| ❌ Broken | ✅ Correct | Why |
|---|---|---|
| `A((text):::primary)` | `A((text)):::primary` | `:::` must be outside shape brackets |
| `subgraph Name["Label"]:::muted` | `subgraph Name["Label"]` | No `:::` on subgraph declarations |
| `A[Text with (parens)]` | `A["Text with (parens)"]` | Wrap labels with special chars in quotes |

### Illustrations (Value-gated)

Custom illustrations are React components rendered to themed PNGs (dark + light). Add one only when it passes the illustration value gate. An accurate Mermaid diagram, Markdown table, worked plot, or no custom image is better than decorative restatement.

Use [ILLUSTRATION_GUIDELINES.md](./ILLUSTRATION_GUIDELINES.md) as the quality standard. Meaningful visual coverage is required; custom-image count is not. Each figure must add visual insight through genuine visual encoding (plots, matrices, heatmaps, vector geometry, network or architecture diagrams, or compact state flows), have one teaching job, stay within balanced portrait/landscape dimensions (`height <= 1.35 * width` and source `height <= 820px`), remain technically faithful, and pass light/dark visual inspection. Reject HTML-tables-as-PNGs, prose card strips, and tall receipt towers, and remove or redesign figures that fail this gate.

**Enforced at deploy time:** every `.tsx` file must be referenced in `content.md`.

LeetLLM should be rich in diagrams and visuals. A reader should encounter visual support before dense math, after important code, and whenever a system has multiple moving parts.

**Key rules:**
- Use React with the shared Vizmatic components. JSX and `React.createElement()` are supported; follow the illustration's existing style.
- Use the Vizmatic theme palette (`c` in `defineIllustration`, or `getThemeColors`) rather than hardcoded theme-dependent colors.
- Export `width`, `height`, `alt`, `create(theme)`, and default export.
- Choose compact canvas dimensions fitted to the graphic, keeping `height <= 1.35 * width` and source `height <= 820px`. Use 800x500px as a balanced starting point rather than stacking tall vertical towers.
- Show the **core concept** through genuine visual encoding of its mechanism, geometry, spatial layout, relationships, or changing state, never as an HTML table, prose card strip, or tall receipt tower rendered to PNG.
- Match the figure's scenario directly to the article's domain (tokens and attention matrices for NLP, image tensors for CV, gridworlds/MDPs for RL, vector fields and distributions for math/stats, tiles/warps/HBM for GPU kernels).
- Avoid generic title-card art. If the same image could serve an unrelated lesson without changing its mechanics or data, redesign or remove it.
- Each custom illustration needs a **specific, explanatory `<figcaption>`** in `content.md` that tells the reader what to inspect and what the image demonstrates. Judge clarity and technical accuracy by reading the caption alongside the figure; character counts and phrase quotas alone do not ensure quality. For animated figures, enforce static-PNG/caption parity: the static fallback PNG and the caption must agree completely and make sense together without requiring unseen motion.
- The TSX file must also export a rich `alt` string (used for the `<img alt>` attribute and accessibility). It should be the full descriptive version of the caption idea.
- Do not reuse article-agnostic visual templates. A repeated `concept -> build -> failure -> production` card layout adds noise unless the graphic visualizes topic-specific mechanics, curves, matrices, shapes, or trajectories. Chapter visuals must stay tied to the lesson's domain-native example.
- Keep hero illustrations complementary. A hero should teach one mental model, typically within `1200x760` and always satisfying `height <= 820px` and `height <= 1.35 * width`. Keep prose takeaways, checklists, and caveats in the article text.
- Zero prose paragraphs and zero fictional-data disclaimers inside PNGs. Never stamp strings such as `"FIXTURE ONLY"`, `"does not establish"`, or `"Treat these numbers as an illustrative walkthrough"` inside an illustration, and never render paragraph-length explanations or bullet lists as an image. Use short labels, axis ticks, chips, arrows, compact formulas, and crisp values. If a reader has to read the PNG like a slide or spreadsheet, convert it to prose or a Markdown table or redesign it visually.
- Keep comprehension prompts and reflection questions in the article body, not inside illustration panels. Figures explain the mechanism; prose prompts the reader to infer or test an idea.
- Define compact symbols such as `n`, `d`, and `k` inside the figure or its caption. Axis and column headers must be explicit, visually stronger than data values, and understandable without guessing from article context.
- Fit canvas to teaching content. Prefer Vizmatic auto-fit/autocrop and balanced padding over fixed frames with large empty side or bottom regions.
- Size each panel for its information. Avoid stretching a short metric list beside a tall chart; use top alignment or redesign the metrics as a compact comparison. Do not add text to fill a blank panel.
- Inspect both website and book renders at reading size. Removing prose for print must not leave empty titled panels, stray borders, or an unbalanced composition. Contact sheets support the audit; they do not replace enlarged checks of changed figures.
- Target 8.5pt for ordinary figure labels in the reader's edition PDF, with an 8pt minimum after width and height scaling. A 14px label on an 800px-wide source is about 8.7pt across the book's text width. Mathematical subscripts and superscripts keep their normal relative sizes. Use a separate print layout when larger type crowds the website composition.
- On the website, inspect labels in the 672px article column and on a phone. Target at least 12 displayed CSS px for ordinary labels. Higher bitmap resolution improves sharpness, not type size. Dense figures can open in the full-size viewer with zoom and panning, but the main mechanism must still read inline.
- Draw arrows with the shared `Arrow`, `FlowArrow`, or `Connector` primitives imported directly from `vizmatic`. The quality validator rejects text arrowhead glyphs such as `▶`, `▼`, `▲`, or `◀`.
- Keep arrowheads proportional to connector and node size. For Vizmatic `arrowSize` and `ArrowMarkerDef` `size`, stay at or below `8`; `4` to `6` is normal for article figures.
- **Always review generated PNGs visually** (one by one) before shipping. Use `uv run scripts/review-illustrations.py` for a side-by-side light/dark gallery of the whole set, then inspect the specific files. Check that labels do not overflow or clip, aspect ratios stay compact (`height <= 1.35 * width`, `height <= 820px`), both themes are readable, arrows have proper heads, and the graphic matches the running example and caption.
- Each visual should have a clear job that can be stated in one sentence in the `<figcaption>`. If the job is hard to articulate, redesign the illustration.

### Animation Value Gate

Use animation to make a construction or transformation easier to understand. Use `vizmatic/stage` films for new motion explanations, with the installed version's documented APIs and the repository's supported player/export path. `createAnimation(theme)` remains appropriate for animating an existing TSX figure. Good animation can expose:

- ownership or state transformation, with persistent object identity before and after
- concurrent work, overlap, queueing, backpressure, or a barrier
- routing, fan-out, aggregation, collective communication, or data movement
- causal ordering where one event enables, blocks, rejects, or changes another
- time-dependent failure, recovery, or resource contention
- a geometric construction, changing gradient, evolving decision boundary, or equation whose terms become visible objects
- scale, perspective, or correspondence between representations, such as a matrix row becoming a neuron calculation

Progressive drawing, morphs, camera movement, and carefully timed reveals are welcome when they direct attention or expose a relationship. Beauty, rhythm, and a satisfying reveal help sustain attention. Give them a teaching purpose rather than adding motion to every object. A clear static comparison remains useful when the reader needs to inspect two states together.

Preserve object identity and meaningful spatial relationships during motion. Move or transform labels with their objects when needed, keep reference axes legible, and avoid collisions or jumps that obscure the explanation. Use Vizmatic's layout and timing tools, inspect intermediate frames, and leave time to read each important state. Choose frame rate and timing for the supported export surface rather than imposing a single style on every animation.

Storyboard before coding: name the input state, transformation, output state, and insight the motion reveals. Supply a self-contained static figure or sequence for print and reduced-motion readers, with a caption that describes what that fallback actually shows. Existing animated TSX figures retain their `create(theme)` fallback. Inspect both themes, pause/replay behavior, reading-size playback, and the served page. Review the complete explanation with its surrounding prose.

### Visual Density

Break up long explanations with visuals that help the reader understand a mechanism, relationship, or worked result.

| Article type | Minimum visual load |
|---|---|
| Foundation / preparation | ≥1 meaningful visual explanation, ≥1 diagram or annotated table, ≥1 runnable code block with visible output |
| Core LLM / ML algorithms | ≥1 meaningful visual explanation, ≥1 Mermaid diagram, ≥1 table, ≥1 worked numeric or tensor-shape example |
| Agents / RAG / LLMOps / inference | ≥1 meaningful visual explanation, ≥1 architecture or sequence diagram, ≥1 failure-path diagram/table |
| System design capstones | ≥2 custom illustrations or diagrams, ≥1 end-to-end architecture diagram, ≥1 trade-off table, ≥1 production checklist |

Place a visual at a conceptual pressure point, especially when the reader must track three or more states, tensor shapes, spatial ownership, timing, branching, or a dense comparison. Long prose may remain uninterrupted when the causal chain is clear and a visual would only restate it. Do not insert an asset to satisfy paragraph cadence.

Useful visual forms include:

- Diagram
- Custom illustration
- Table
- Code snippet with output
- Callout box
- Worked example with intermediate values

**Reference in content.md (foundations / preparation chapter flows):**
```markdown title="figure.md"
<figure>
<img src="illustrations/_generated/chapter_flow_dark.png"
     alt="Linear regression visual showing a prompt-length latency table, a fitted line with five data points, squared residual bars, and side-by-side closed-form and gradient descent results" />
<figcaption>The same five latency measurements appear as raw rows, a fitted line, and squared residuals. If the residual pattern stays structured, the line is still missing part of the story.</figcaption>
</figure>
```

**Build + visual review (after changing any illustration):**
```bash title="terminal"
cd web && npx tsx tools/illustrations/build.ts --article foundations/linear-regression-from-scratch --force
uv run ../scripts/review-illustrations.py   # side-by-side gallery for the whole set
uv run ../scripts/validate-illustration-quality.py --fail-layout-warnings
uv run ../scripts/validate-illustration-density.py --strict-text
uv run ../scripts/validate-content-structure.py
```

---

## Section Title Renames

If any article uses interview-oriented section titles, rename them:

| ❌ Old Title | ✅ New Title |
|---|---|
| `## Interview Tips` | `## Key takeaways` |
| `## Model Answer Framework` | `## Summary` |
| `## Common Interview Mistakes` | `## Common misconceptions` |
| `## Strong Follow-up Answers` | `## Going deeper` |
| `## Interview Signal` | Remove entirely (move insight inline) |

---

## Current Models and Provider Facts

Don't keep a universal "current model" table in this document. Model IDs, availability, context limits, pricing, deprecations, and API behavior change faster than the editorial guide. An undated table turns old defaults into instructions for new work.

### Verification workflow

Before publishing or materially updating a current-model claim:

1. Open the provider's official model catalog, model page, pricing page, and relevant API guide on the same day as the edit.
2. Verify the exact model ID, availability, context window, output limit, modalities, tool support, price tier, cache behavior, and announced retirement date used in the prose or code.
3. Cite those official pages through `references.json`. Don't cite this guide as evidence.
4. Put `verifiedAt` and `refreshAfter` in volatile blog metadata. `verifiedAt` records when every time-sensitive claim was checked. `refreshAfter` sets the next mandatory review date.
5. Use a dated snapshot when a lesson needs stable pricing or benchmark numbers. Label the snapshot date in prose and tell readers to refresh production settings from official docs.

Set `refreshAfter` from the fastest-changing claim:

| Claim | Suggested review window |
|---|---:|
| Announced retirement, preview, launch price, or limited promotion | Day after event or 7 days |
| API price, plan quota, model availability, or provider comparison | 30 days |
| Context limit, tokenizer behavior, tool support, or SDK schema | 90 days |
| Historical paper, architecture derivation, or dated benchmark snapshot | No rolling refresh; preserve date and source |

### Model choice in examples

Choose models to suit the workload:

- Use a provider-neutral interface when model identity doesn't teach the concept.
- Use an environment variable or configuration file when readers should swap models.
- Use current low-cost models for routine extraction, classification, and high-volume examples.
- Use current frontier models only when the example needs their reasoning, context, modality, or tool surface.
- Pin an exact model snapshot when repeatable behavior matters. Use a moving alias only when the lesson is specifically teaching automatic upgrades.
- Keep historical model names when discussing their release, paper, benchmark, or influence. Don't rewrite history to use a newer product name.
- Never replace one provider's model with another solely because both occupy a similar price or capability tier. Verify API compatibility and teaching intent first.

---

## Blog Posts

Blog posts live in `web/src/content/blog/` and use a **separate schema** (`blog/metadata.schema.json`).

**Key differences from articles:**
- `id` must match `^blog-[a-z0-9-]+$` (required `blog-` prefix)
- Requires `author`, `publishedAt` (YYYY-MM-DD), `excerpt` (50-300 chars), and `tags` (1-8). `coverImage` is optional and uses runtime fallback when omitted.
- Does NOT have `section`, `category`, `difficulty`, `isPremium`, `order`, `timeEstimate`, `references`, `rubricPoints`, etc.

### Blog slug history

When changing a published blog slug, keep old slug on canonical post:

```json
{
  "slug": "new-canonical-slug",
  "aliases": ["old-slug"]
}
```

Run `uv run scripts/generate-content-lastmod.py` and commit generated alias manifest. Proxy sends `308` to canonical URL and preserves query parameters. Alias validation rejects malformed or duplicate aliases, canonical-slug conflicts, and unpublished targets. Sitemap contains canonical URL only.

Use `redirectTo` only for a retired post that still has its own content bundle. For ordinary renames, use `aliases` on the replacement post.

### Dynamic Content Requirements

Blog posts must be **visually rich**. A wall of text is unacceptable for public content.

| Requirement | Guidance |
|---|---|
| Custom JSX illustrations | ≥2 |
| Mermaid diagrams | ≥1 |
| Comparison tables | ≥1 |
| Callout boxes | Use where a warning, misconception, or key distinction needs emphasis |
| Visual placement | At conceptual pressure points; no fixed paragraph quota |

---

## Social Banners

Every article and blog post needs an accurate `social_banner.png` (1200×630). Create it locally with Vizmatic, or use an external image-generation service only when that service's costs and publication behavior are authorized.

Review and author each banner individually. For local artwork, keep reproducible `social_banner.tsx` source at the article root, outside the body-illustration directory. Replace an obsolete generation prompt with the local render command, or remove it. Preserve raw research. Export at scale 1 with explicit dimensions, then inspect the actual PNG. The local example in `blog/million-token-context-windows/social_banner.tsx` shows the render API; its composition is specific to that article, not a template to stamp across the curriculum.

**Rules:**
- Modern sans-serif font, generous letter spacing, no italics, no quotes
- Title appears exactly once
- Diagrams, equations, numbers, and labels must agree with the reviewed article. Remove invented metrics and illegible decorative text.
- Must include "LeetLLM" watermark in a corner
- No speech bubbles or cartoonish elements
- Deep, tech-focused color palette (dark blue, purple, neon accents)
- Prefer dark-themed banners for better OG/social media visibility

---

## SEO Strategy

- **Canonical URL:** `https://leetllm.com/*`
- **Sitemap:** Auto-generated at `/sitemap.xml` (all articles)
- **robots.txt:** Blocks `/api/`, `/dashboard/`, `/auth/`
- **Title template:** `{Article Title} | LeetLLM`
- **URL structure:** `/learn/{slug}`

---

## Adding a New Article

1. Create directory: `web/src/content/{section}/{slug}/`
2. Write `content.md` with JSON frontmatter (id and slug must match directory name; add `coverImage` only when a specific visual should override runtime fallback)
3. Add references to `references.json` first, then cite them inline as `[^key]`
4. Add article body below frontmatter with `[^key]` inline citations (no footnote definitions in content)
5. Create ≥1 illustration in `illustrations/<concept>.tsx`
6. Build illustrations: `cd web && pnpm illustrations:build:article <section>/<slug>`
7. Build diagrams: `cd web && pnpm diagrams:build`
8. Optionally add `coverImage` pointing to a social image or dark illustration (e.g. `illustrations/_generated/concept_dark.png`); otherwise verify runtime fallback is appropriate
9. Verify: `pnpm build`
10. Deploy: `./deploy.sh`

---

## Deploy-Time Validation

The `./deploy.sh` deployment path runs these checks in order. All must pass before deployment proceeds:

| Step | What it checks | Script |
|---|---|---|
| **Metadata schema** | Every content frontmatter block conforms to its JSON schema | `validate-metadata.py` |
| **Reading time** | No persisted `timeEstimate`; reading time can be derived from content length | `update-time-estimates.py --check` |
| **Reference cross-check** | Every `[^key]` in content exists in `references.json`; required fields are present | `validate-references.py --skip-http` |
| **Illustration references** | Every `.tsx` in `illustrations/` is referenced in `content.md` | Inline bash check |
| **Unit tests** | Content integrity and component rendering | `pnpm test` |
| **Illustration build** | All `.tsx` files render to PNG (dark + light) | `pnpm illustrations:build` |
| **Diagram build** | All Mermaid diagrams render to PNG | `pnpm diagrams:build` |
| **Docker build + deploy** | Production image builds and deploys to Cloud Run | `gcloud run deploy` |
| **CDN cache purge** | Cloudflare cache is purged | Inline curl |

---

## Content Quality Checklist

Before publishing, verify:

### Accessibility
- [ ] Opening gives the reader a concrete, understandable problem before introducing unfamiliar terms
- [ ] Concrete on-ramp before first technical deep dive; useful analogies connect familiar objects to the mechanism
- [ ] Every prerequisite concept is briefly recapped when referenced
- [ ] Every acronym and technical term is defined on first use
- [ ] Article is self-contained: a reader new to ML can follow start to finish

### Content
- [ ] Topic-focused title that stays scannable in cards and navigation
- [ ] Math uses LaTeX, code is in Python/PyTorch and is explained before shown
- [ ] Every technique/algorithm attributed to its origin paper inline
- [ ] Every `[^key]` in content has a matching key in `references.json`
- [ ] Benchmark claims cite their source
- [ ] Every `##` section has one distinct teaching job and enough evidence to complete it without padding

### Factual Accuracy
- [ ] Every benchmark number verified against the cited source's results table
- [ ] Architecture specs (layer counts, context lengths, parameter counts) match official model cards
- [ ] Training pipeline descriptions match the source paper's methodology step by step
- [ ] Historical/chronological claims ("first to", "introduced in") confirmed against original publication
- [ ] Comparisons use the same benchmark, split, and evaluation protocol
- [ ] Model names and version numbers match official naming exactly
- [ ] No plausible-sounding but unverified numbers or specs
- [ ] When a claim can't be verified to a primary source, it's either removed or softened

### Visual Content
- [ ] Any declared `coverImage` exists; when omitted, social banner, first article image, or default OG fallback is appropriate
- [ ] Every custom illustration passes the value gate (genuine visual encoding, no HTML-tables-as-PNGs, no prose card strips, no tall receipt towers), stays within `height <= 1.35 * width` and source `height <= 820px`, and is referenced in `content.md`
- [ ] Zero prose paragraphs and zero fictional-data disclaimers (`FIXTURE ONLY`, `does not establish`) appear inside PNGs; animated figures maintain static-PNG/caption parity
- [ ] ≥1 Mermaid diagram using `:::className` syntax (no inline `style` or `classDef`), or a stronger Vizmatic figure when topology exceeds Mermaid's readable range
- [ ] Diagram direction and grouping fit the relationships; labels remain legible at reading size
- [ ] ≥1 comparison table
- [ ] Visuals appear at conceptual pressure points rather than on fixed paragraph cadence
- [ ] Dense math, algorithm, or system-flow sections have a diagram, custom illustration, annotated table, or worked example nearby
- [ ] Visuals use domain-native examples and teach mechanism, geometry, shape, dependency, trade-off, or failure path rather than decoration

### Didactic Flow
- [ ] Reverse outline gives every major section one distinct teaching job
- [ ] Adjacent major sections have a causal hinge: prior result, unresolved question, then answer
- [ ] Core mechanism is taught from first principles before corner cases; introductions never lead with premature gotchas (`NaN` masks, BFloat16 corners, non-convexity caveats)
- [ ] One domain-native running example stays stable through long-form content (no shoehorned SRE/IAM/support-bot tropes like `Luna`, `acct_10234`, `K10234`, `P-7`, `P-14`, `RUN-842`, `C17`, `R42`, `DeployBuddy`, `INC-48291`, or `0.005000 USD` gateway ceilings in unrelated lessons)
- [ ] Opening centers one concrete tension instead of stacking vocabulary, specifications, caveats, and navigation
- [ ] Varied textbook pacing avoids chopped 14-word staccato fragmentation and avoids repetitive `"Before running/reading..., predict..."` prompts
- [ ] Tables summarize or compare concepts already oriented in prose rather than replacing first explanation
- [ ] Each new concept builds naturally on earlier sections or includes a short prerequisite recap
- [ ] Repeated concepts add a new layer such as mechanism, execution, correctness, or operation instead of restating earlier prose
- [ ] Glossary, local-anchor, prerequisite, and citation links each serve their proper teaching job
- [ ] Runnable code computes the mechanism being taught, uses suitable numerical/ML libraries where helpful, and includes verified output or test instructions
- [ ] Final section explains what the reader is ready to learn next
- [ ] A reviewer can reconstruct the worked example and solve a new case from the explanation
- [ ] Article, reader chapter, figures, quiz, selected video, and neighboring handoffs agree, with pending formats identified

### Writing Quality

- [ ] Varied, lucid textbook sentences, active voice when the actor is known, and zero caveman fragments
- [ ] Crowded sentences split cleanly without artificial staccato fragmentation
- [ ] One action per instruction, with conditions and warnings before affected actions
- [ ] Standard technical names stay consistent across prose, math, code, and visuals
- [ ] No em dashes in authored prose or metadata, and semicolon clauses simplified
- [ ] No banned phrases (see [Banned phrases](#banned-phrases) table) and no banned bureaucratic/SOC2 dialect (`fixture`, `contract`, `boundary`, `admit`, `receipt`, `provenance`, `authority`, `establish`, `supplied`, `bounded`, `fail-closed`, `governed`, `needn't`) outside allowed technical exceptions
- [ ] Zero inline fictional-data disclaimers ("Treat these numbers as an illustrative walkthrough", "does not establish") inside articles or visuals
- [ ] Explanations state the idea directly; stock negation hooks and defensive disclaimers have been rewritten in context
- [ ] Necessary technical negation, uncertainty, operational constraints, and exact quotations remain accurate
- [ ] Natural contractions chosen for clarity and tone (never `needn't`)
- [ ] Facts, numbers, scope, uncertainty, citations, code, and quotations preserved during style edits
- [ ] Useful headings and callouts, with no bold pseudo-headings or decorative emoji
- [ ] Worked examples, useful recaps, and transitions retained where they support learning

---

## Linear Curriculum Path: The Complete Click-Next Story (199 Visible Lessons)

**North Star:** A motivated complete beginner can start at lesson 1 (`git-shell-linux-reproducible-ai`), click **Next** through the visible course, and finish lesson 199 (`deep-dive-light-peft`) as someone who can professionally design, implement, evaluate, debug, deploy, architect, communicate, and analyze predictive-ML and LLM systems without needing to assemble a second curriculum.

The canonical linear order (the exact sequence the site uses for prev/next navigation and "keep reading") lives in `web/src/lib/questions.ts` (`ROADMAP_SECTION_SEQUENCE` + `SECTION_ROADMAP_SLUG_ORDER`). **This document is the curriculum guide** that every content edit, illustration, handoff callout, and metadata change must honor.

### The Three-Block Story (Easy → Medium → Hard)

- **Easy (Lessons 1–31):** On-ramp into Git, shell, Linux, Docker, Python, shape reasoning, accelerator basics, data structures, SQL, Bayesian uncertainty, neural-network basics, first contact with tokens, embeddings, Transformers, and a tiny end-to-end LLM app. Examples should use the clearest domain for the concept: code repos for developer tooling, tiny text corpora for language modeling, feature rows for predictive ML, request traces for serving, and real product workflows only when the lesson needs product state.
- **Medium (Lessons 32–85):** The reader learns rigorous ML engineering, statistical learning theory, conformal uncertainty, probabilistic generative models, causal identification, and privacy-preserving training, builds predictive-ML systems, then applies the same discipline to LLM products through tools, context engineering, RAG, evaluation, prompt optimization, and cost controls.
- **Hard (Lessons 86–199):** Deep mastery and production reality. Nine portfolio capstones ship predictive-ML products, vision triage, a controlled production ML pipeline, document QA, evaluation, a classifier, and a reproducible research study. Transformer internals, advanced training, advanced retrieval and agents, a final production-agent capstone, GPU performance engineering, inference at scale, nine system-design capstones, four AI lab interview-readiness lessons, and seventeen code-level project studies complete the path.

The difficulty blocks are *global*, not per-section. No Easy article appears after a Medium or Hard one in the click-next order.

### Example Selection Standard (Non-Negotiable for All Learn Articles)

**Important distinction:**

- **Inside articles** (explanations, code, tables, diagrams, worked examples, failure cases): Use the domain that makes the concept easiest to understand. A good example should expose the key invariant, failure mode, shape, metric, API schema, or production trade-off with the fewest distracting details. Never shoehorn the legacy SRE/IAM/billing cast (`Luna`, `acct_10234`, `K10234`, `P-7`, `P-14`, `RUN-842`, `C17`, `R42`, `DeployBuddy`, `INC-48291`, `0.005000 USD` gateway ceilings) into unrelated ML, deep learning, NLP, vision, RL, math, or GPU lessons.
- **Curriculum-level narrative** (phase descriptions, high-level "what this phase is about", and especially the **Next** callouts): Keep the focus on the learning journey. Don't turn handoffs or overviews into marketing language for a fictional company.

Choose domain-native examples by lesson topic:

- Math, probability, optimization, and statistical learning: use matrices, vectors, distributions, gradients, loss surfaces, and small numerical arrays.
- Language modeling, tokenization, attention, embeddings, and model internals: use familiar English words and sentences for tiny text corpora and token sequences. Use code, documentation, or specialized vocabulary when their particular properties are part of the lesson. Label the surrounding logits, tensors, and attention weights with precise technical terms.
- Computer vision and multimodal perception: use image patches, pixel tensors, convolution filters, feature maps, bounding boxes, and segmentation masks.
- Reinforcement learning and decision making: use gridworlds, bandits, Markov decision processes (MDPs), state-action trajectories, rewards, and value functions.
- GPU performance, CUDA kernels, and distributed training: use thread blocks, warps, shared memory tiles, HBM bandwidth, occupancy, and AllReduce collective topologies.
- Programming, Git, Docker, coding agents, code completion, and sandboxes: use repositories, failing tests, CI, diffs, issues, reviews, shells, containers, and deployment workflows.
- Retrieval, RAG, GraphRAG, security, and hallucination detection: use technical documentation, knowledge-base articles, access scopes, citations, and evidence chunks.
- Serving, inference, cost, caching, observability, and deployment: use prompt sizes, KV cache blocks, GPU batches, latency traces, release gates, traffic splits, throughput metrics, and alerts.
- Training, fine-tuning, alignment, and synthetic data: use labeled eval sets, preference pairs, verifier tasks, red-team transcripts, training mixtures, and model checkpoints.
- Predictive ML, feature engineering, ranking, forecasting, and capstones: use tabular product, marketplace, logistics, or operational data when that concrete state helps teach leakage, joins, feedback loops, and evaluation.
- System-design articles: pick the domain named by the article. A support-bot article can use returns and order status. A code-completion article should use codebases and editor latency. A moderation article should use policy classes and media review.

E-commerce, billing, and IAM scenarios are useful only when a lesson explicitly teaches structured business state, authorization, or operational workflows. They must never leak into attention, tokenization, optimization, computer vision, RL, GPU kernels, or core ML theory where direct domain-native examples are clearer.

Follow [Everyday English in language examples](#everyday-english-in-language-examples) for sample text. Choose a specialized scenario or analogy only when its details make the mechanism easier to understand.

Blog posts should use the domain that matches search intent and topic. Illustrations and `chapter_flow.tsx` must also follow the topic where they contain concrete scenarios.

Violations must be replaced during every review pass by rewriting the surrounding paragraph, table, figure, quiz question, and illustration text together. Don't perform a word swap that leaves the old story half attached.

### Phase Handoffs (The 14 Critical Bridges)

These are the moments where the story could break. The **Next:** callout in the final article of each phase (except the very last lesson) should help the reader see why the next topic is the natural continuation.

Good handoffs do two things:
- Briefly acknowledge what the reader can now do.
- Clearly explain the new concept or capability the next phase unlocks and why it matters for building production AI/ML systems.

Write handoffs around the learner's new capability and the next concept it makes accessible. Use a specific fictional company, account, ticket, incident, or order only when its state helps explain that connection.

The example handoffs below show the right spirit (capability + conceptual bridge), not a template that must be copied literally.

**Handoff 1: After Computing Foundations (lesson 9: algorithms-complexity-ml-engineers) → Math & Statistics (lesson 10)**
Reader now has reproducible local setup, Python evaluation habits, NumPy shape reasoning, accelerator basics, data-structure, SQL, and algorithmic-cost hygiene.
**Example callout:** "You can now keep a repo reproducible, write Python evaluation loops, reason about tensor shapes, understand data access paths, and estimate the cost of simple algorithms. Next you'll need gradients and probability to understand why the neural nets you will soon build actually learn from data."

**Handoff 2: After Math & Statistics (lesson 18) → Preparation & Prerequisites (lesson 19: neural-networks-from-scratch)**
Solid math/stats for ML.
**Example callout:** "You can now reason about gradients, vectors, and uncertainty in model predictions. The next articles turn that math into the first trainable neural networks, so tensors, loss, and backprop stop being isolated formulas and start feeling like one connected system."

**Handoff 3: After Preparation (lesson 31: llm-lifecycle...) → ML Algorithms & Evaluation (lesson 32: linear-regression-from-scratch)**
Reader has built a small classifier application and has an overview of the LLM lifecycle.
**Example callout:** "Your application now turns text into a prediction that a person can use. The next lessons show how training chooses the model's parameters, starting with a line whose prediction error you can calculate by hand."

**Handoff 4: After ML Algorithms & Evaluation (lesson 46: dataset-pipelines-data-quality) → Production ML Systems (lesson 47: feature-engineering-production-ml)**
Reader has classical ML, evaluation, PyTorch, and dataset-quality habits.
**Example callout:** "You now know how to fit models, validate them honestly, and prepare data that won't lie to you. Next you will turn raw event history into stable production features, prediction services, and monitored retraining decisions."

**Handoff 5: After Production ML Systems (lesson 52: monitoring-predictive-models) → Core LLM Foundations (lesson 53: bitter-lesson-compute-over-heuristics)**
Reader can build and monitor predictive models from feature snapshots through retraining decisions.
**Example callout:** "You can now engineer a predictive model from features through monitored deployment. Next you will reuse that data and evaluation discipline for language models, beginning with why scalable general methods matter."

**Handoff 6: After Core LLM Foundations (lesson 60: instruction-tuning-chat-templates) → Applied LLM Engineering (lesson 61: dimensionality-reduction-embeddings)**
Reader has intuition for tokenization, embeddings, evaluation limits, ingestion, chunking, and chat templates.
**Example callout:** "You now understand the core mechanics that make LLM behavior possible. The Applied phase shows how those mechanics become production features: embedding text for retrieval, ranking evidence, evaluating answers, and wiring the first real agent and RAG systems."

**Handoff 7: After Applied LLM Engineering (lesson 85: design-conversational-ai-support-bot) → Portfolio Capstones (lesson 86: capstone-delivery-eta-prediction)**
Reader has designed and reasoned about a full conversational support bot for returns and order status.
**Example callout:** "You can combine data, models, evaluation, retrieval, and tools into product designs. Now ship nine portfolio projects that turn those ideas into concrete systems, ending with a reproducible study that tests and communicates one claim."

**Handoff 8: After Portfolio Capstones (lesson 94: capstone-reproducible-research-study) → Transformer Deep Dives (lesson 95: sentence-embeddings-contrastive-learning)**
Reader has shipped predictive-ML products, a managed pipeline, document QA, an evaluation dashboard, a fine-tuned intake classifier, and a reproducible study with a baseline, ablations, uncertainty, and a public report.
**Example callout:** "You can now turn a research claim into reproducible evidence and communicate its limits. The next phase opens transformer components underneath earlier projects, beginning with contrastive objectives that shape reusable sentence vectors for semantic similarity and retrieval."

**Handoff 9: After Transformer Deep Dives (lesson 102: decoding-strategies...) → Advanced Training & Adaptation (lesson 103: scaling-laws...)**
Deep understanding of attention, positions, normalization, and decoding inside the models the reader has already used and shipped.
**Example callout:** "You can now open the hood on the attention and decoding that power every RAG answer and agent decision you've built. Next we study how those models are actually trained at scale: scaling laws, synthetic data, LoRA, RLHF/DPO, and evaluation-backed adaptation, so you can improve the models themselves instead of only prompting them."

**Handoff 10: After Advanced Training (lesson 120: model-merging-weight-interpolation) → Advanced Agents & Retrieval (lesson 121: vector-database-internals...)**
Reader understands modern training, adaptation, and data flywheels.
**Example callout:** "You know how the best models are built and adapted today. Now productionize the *systems* around them: advanced retrieval, GraphRAG, agent orchestration with memory and recovery, guardrails, computer-use for browser tasks, and multi-agent patterns for complex workflows."

**Handoff 11: After Advanced Agents & Retrieval (lesson 136: capstone-production-llm-agent) → Inference & Production Scale (lesson 137: inference-mechanics-ttft-tps-kv-cache)**
Reader has combined advanced retrieval and agent patterns into a robust product with explicit release gates.
**Example callout:** "You can now design and ship agent systems that handle complex workflows with memory, recovery, human review, and measured release gates. Next focus on the engines that run those model calls reliably and affordably: KV cache, paged attention, batching, quantization, long context, and serving infrastructure."

**Handoff 12: After Inference & Production Scale (lesson 167: ab-testing-online-evaluation-llms) → System Design Capstones (lesson 168: design-real-time-content-moderation-system)**
Reader understands inference mechanics, deployment, observability, and online eval at depth.
**Example callout:** "You can now design, serve, and measure LLM systems that handle real traffic. Next, nine end-to-end system design breakdowns put those capabilities together for content moderation, multi-tenant serving, search, multimodal systems, voice agents, and reasoning systems."

**Handoff 13: After System Design Capstones (lesson 176: design-reasoning-agent-test-time-compute) → AI Lab Interviewing (lesson 177: ai-lab-coding-interview-python-systems)**
Reader can design complete production AI architectures and defend the important trade-offs.
**Example callout:** "You can now reason through complete AI systems from requirements to failure recovery. The final phase turns that knowledge into interview execution: production-shaped Python coding, system design communication, behavioral evidence, and a clear technical presentation."

**Handoff 14: After AI Lab Interviewing (lesson 180: ai-lab-technical-presentation) → Project Deep Dives (lesson 181: deep-dive-vllm)**
Reader can explain and defend complete AI systems under interview pressure.
**Example callout:** "You can now present architecture, tradeoffs, evidence, and failures clearly. The final phase applies that discipline to seventeen influential open, academic, and hosted AI systems, beginning with how vLLM turns GPU memory and scheduling into a production serving engine."

The very last article (`deep-dive-light-peft`) ends with a course-complete callout pointing back to the roadmap, career next steps, and invitation to use the seventeen projects as a continuing source-reading practice loop.

### Per-Article **Next:** Callout Rules (Enforced by Structure Validator + Human Review)

Every article except the final one **must** contain exactly one callout at the very end in this format (the page renderer extracts it):

```markdown title="next-callout.md"
> **Next:** Continue to [Exact Title of Next Lesson](/learn/exact-next-slug). [One or two clear sentences explaining the conceptual connection and why this is the natural next step in the learning progression.]
```

**Important distinction:**

- **Inside the article** (explanations, code examples, tables, diagrams, failure cases, worked problems): Prefer concrete topic-fit examples that make the material memorable without hiding the core idea behind an unrelated story.
- **In the "Next" callout itself**: Keep the focus on the *learning progression* and the new mental model or capability the reader is about to gain. Don't force a fictional company, account, ticket, incident, or product story into every handoff.

The callout should help the reader understand why the next concept matters for what they are learning.

Use the phase handoffs above to check each article's place in the course. Verify its final callout against the canonical order, then read the transition into the next lesson. A correct URL alone doesn't prove a good prerequisite bridge.

### Individual Article Review

Keep each review scoped to one complete bundle, including metadata, prose, code, exercises, citations, and every illustration. If parallel reviewers are authorized, give each reviewer one article with exclusive write ownership. Never give an agent a section-wide rewrite job or treat a shared prompt as an article-specific review.

A review is complete only after the reviewer has read the full article, checked its claims against primary sources, run applicable examples and validators, and inspected every rendered illustration in both themes. Check the previous and next lessons for prerequisite continuity without silently expanding write scope. Corpus completion requires that evidence for every article and blog, including unpublished bundles; a sample or green structural check isn't sufficient.

### How to Use This Document

- Before touching any article, read the relevant phase handoff note(s).
- When writing or editing a **Next:** callout, match the spirit of the phase handoff and make it specific to the article's running example.
- If you believe a slug should move (to improve prerequisite flow or difficulty block), propose the change here first with a one-paragraph justification, then update `questions.ts`, metadata, and all affected callouts together.
- Run `uv run scripts/validate-content-structure.py`, `uv run scripts/validate-illustration-quality.py --fail-layout-warnings`, and the Python example validator for the article under review.
- Explain the article-specific changes, source verification, executed checks, visual review, and remaining gaps in the review response. Don't infer a pass from a completion log or a validator alone.

This guide is the shared standard that turns 199 individual articles into one complete beginner-to-research-ready LLM engineering curriculum.

**Status:** Active curriculum standard updated during the 2026 Content & Visual Overhaul. All future edits must keep this section and the canonical order in sync.
