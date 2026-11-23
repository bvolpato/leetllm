---
query: "We are creating a research-backed page for the following: \"Experiment Design and A/B Testing\". Suggest a useful structure and the content that must be present and is relevant.\n\nPage type: curriculum article\nCurriculum section: foundations\nCurrent page scope: Design a trustworthy online experiment for an AI support change: randomize customers, measure useful outcomes, quantify uncertainty, and reject false wins.\nResearch refresh ID: 2026-07-15-soft-v1\n\nThis is a curriculum article. Prefer teaching order, mechanisms, worked examples, and mastery outcomes when useful, but do not force a stock lesson template.\n\nPublished LeetLLM pages do not use one fixed H2 template. `_research.md` is editorial context only: humans and agents use it while writing or updating `content.md`. It is not rendered on the site. Adapt the outline to this topic.\n\nSuggested coverage to include when relevant:\n- teaching or narrative order and prerequisites\n- core concepts, mechanisms, equations, implementation details, and tradeoffs\n- current tools, model versions, APIs, benchmarks, prices, policies, or standards when relevant\n- concrete examples, labs, analogies, diagrams, tables, and practice ideas\n- common mistakes, misconceptions, failure modes, and expected reader outcomes\n- claims that may already be stale, disputed, or incomplete\n- primary-source URLs that verify the important claims\n\nGuidance, not rigid requirements:\n- Use clear Markdown headings. Rename, merge, split, or omit suggested themes when the topic calls for it.\n- Prefer concise bullets and short sections over long essays.\n- Attach exact dates and direct URLs to volatile claims such as versions, prices, benchmarks, policies, and current product capabilities.\n- Prefer primary sources, official docs, standards, and original papers.\n- Every source mention must include a full `https://...` URL in the same bullet or row. Never write `(Source: Vendor)`, `(Sources: Vendor + 1)`, footnote-style markers, or other opaque citations without the link.\n- Separate stable foundations from facts that need periodic reverification.\n- State uncertainty and source disagreement directly.\n\nResearch the current state of this topic instead of relying only on general memory. Do not invent citations, metrics, product details, release information, or future products. Omit any specific claim you cannot support with a direct source URL.\n\nQuality correction attempt 2: previous response failed validation:\n- research body has 0 direct URLs; minimum is 3\n\nReplace it with a complete research packet. Keep useful Markdown structure, include at least 3 direct primary-source URLs, and avoid opaque source labels without links."
model: "Pro"
task_id: "4dba21afd3f3643dd0745acb103f0628"
status: "completed"
---

This research packet is structured for the **LeetLLM** curriculum under the Foundations module. It is designed to teach engineers and data scientists how to build trustworthy experimentation pipelines for AI systems, specifically focusing on a support chatbot scenario.

# Experiment Design and A/B Testing

**Module:** Foundations

**Scope:** Design a trustworthy online experiment for an AI support change: randomize customers, measure useful outcomes, quantify uncertainty, and reject false wins.

## 1. Narrative Order and Prerequisites

Before writing code for an experiment, students must understand the statistical mechanics that separate true signal from random noise.

- **Prerequisites:** Basic probability (normal vs. binomial distributions), hypothesis formulation, and foundational telemetry (logging user actions).
- **Teaching Flow:**

1. Define the business problem (e.g., AI hallucinations are driving up support handoff fallbacks).
2. Formulate a testable hypothesis and set an Overall Evaluation Criterion (OEC).
3. Calculate required sample sizes to ensure statistical power.
4. Randomize users safely (e.g., hashing user IDs).
5. Interpret results defensively against common data anomalies.

## 2. Core Concepts & Implementation Mechanics

A/B testing evaluates two versions of a system (Control vs. Treatment) by randomly assigning traffic and measuring the difference in outcomes.

- **The Randomization Unit:** For AI support agents, the randomization unit must be the **User ID** (or Account ID), not the Session ID or Pageview. If an angry user refreshes the page and suddenly gets a completely different LLM persona, the user experience breaks and the data is corrupted.
- **Metrics Hierarchy:**

- **Overall Evaluation Criterion (OEC):** The single, agreed-upon metric determining the winner. *Example: First-Contact Resolution Rate (FCR).*
- **Guardrail Metrics:** Metrics that monitor system health and cannot significantly degrade. *Example: Average Token Generation Latency, Compute Cost per Session, and Customer Satisfaction (CSAT).*
- **Server-Side vs. Client-Side:** AI experiments should almost exclusively be executed server-side. Delivering multiple large payload variants or complex system prompts to the client-side introduces severe latency and exposes proprietary prompts.

## 3. Statistical Foundations: Quantifying Uncertainty

To confidently declare an AI model update a "win," you must quantify the uncertainty of the data.

- **The Null Hypothesis (H0​):** The assumption that there is zero true difference between the current AI system and the new AI system. The goal of the experiment is to gather enough evidence to reject this.
- **P-values:** The probability of observing an outcome at least as extreme as the current data, assuming H0​ is true. A standard industry threshold is p<0.05 (a 5% false-positive rate).
- **Statistical Power:** The probability of correctly rejecting the null hypothesis when a true effect exists. The industry standard is 80%. Power dictates your sample size; testing an LLM tweak on 500 users is usually underpowered to detect a realistic 2% shift in resolution rates.
- **Frequentist vs. Bayesian:** Most commercial A/B testing still uses Frequentist math (requiring fixed sample sizes and durations). Bayesian methods are gaining traction because they output probabilities (e.g., "Variant B has an 85% chance of being better") which are easier for product managers to interpret.

## 4. Trustworthiness: Rejecting False Wins

The most critical skill in experimentation is skepticism. Teams frequently ship "winning" A/B tests that actually failed due to bad instrumentation.

- **Twyman’s Law:** *"Any figure that looks interesting or different is usually wrong."* If your new AI model shows a +25% jump in resolution rates overnight, it is almost certainly a logging bug, double-counting, or a broken metric, not a sudden AI breakthrough.

- *Primary Source:* Ron Kohavi's Microsoft ExP presentation on Twyman's Law and trustworthy metrics: [https://www.exp-platform.com/Documents/TwymansLaw.pdf](https://www.exp-platform.com/Documents/TwymansLaw.pdf)
- **Simpson’s Paradox:** An effect observed in the aggregate data disappears or reverses when split by segments. *Example:* Your new AI model looks like it wins overall, but it actually degraded performance for both desktop and mobile users individually. This happens when the ratio of mobile/desktop users is mismatched between the Control and Treatment groups.
- **Novelty and Primacy Effects:** Users might click a new AI widget more simply because it is new (Novelty Effect), or they might ignore it because it broke their familiar workflow (Primacy Effect). Tests must run long enough (typically 2 to 4 weeks) to capture stable, habituated user behavior.
- *Primary Source for Industry Standards:* Kohavi, Tang, and Xu's definitive guide *Trustworthy Online Controlled Experiments: A Practical Guide to A/B Testing* details these exact failure modes. Cambridge University Press Excerpt: [https://assets.cambridge.org/97811087/24265/frontmatter/9781108724265_frontmatter.pdf](https://assets.cambridge.org/97811087/24265/frontmatter/9781108724265_frontmatter.pdf)

## 5. Common Mistakes in AI Experimentation

- **Peeking (Continuous Monitoring):** Checking the dashboard daily and stopping the test the exact moment the p-value dips below 0.05. This destroys the statistical validity of frequentist tests and heavily inflates false positives.
- **Ignoring Latency Tradeoffs:** You upgrade the support bot from a 8B parameter model to a 70B parameter model. The answer quality (OEC) improves by 4%, but the time-to-first-token degrades by 3 seconds. If you didn't set latency as a guardrail metric, you might ship a net-negative user experience.
- **Testing Without Offline Evals:** Live A/B testing should never be the first line of defense for generative AI. You must first use offline frameworks (e.g., LLM-as-a-judge, BLEU, ROUGE) to ensure the new model isn't hallucinating aggressively before exposing it to real users.

## 6. Current Frameworks and Tooling (Mid-2026)

- **GrowthBook:** An open-source, warehouse-native experimentation platform heavily used for server-side feature flagging and Bayesian/Frequentist A/B testing.

- *Source:* GrowthBook Guide to A/B Testing Architecture: [https://www.growthbook.io/blog/what-is-a-b-testing](https://www.growthbook.io/blog/what-is-a-b-testing)
- **Eppo:** Another popular warehouse-native tool designed to handle complex data models and automated guardrail metric monitoring.
