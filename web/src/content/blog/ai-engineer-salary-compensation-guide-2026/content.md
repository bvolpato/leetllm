---
{
  "id": "blog-ai-engineer-salary-compensation-guide-2026",
  "title": "AI Engineer Salary Guide 2026",
  "slug": "ai-engineer-salary-compensation-guide-2026",
  "author": {
    "name": "LeetLLM Team"
  },
  "publishedAt": "2026-03-16",
  "updatedAt": "2026-11-23",
  "verifiedAt": "2026-11-23",
  "refreshAfter": "2026-12-23",
  "excerpt": "A salary number can mean wages, base pay, or total compensation. Learn to line up the role, level, location, equity terms, and source date before comparing offers.",
  "tags": [
    "Career",
    "Compensation"
  ],
  "coverImage": "illustrations/_generated/offer_comparison_stack_dark.png",
  "featured": false,
  "draft": false
}
---

The US annual mean wage for software developers and one employer's research-role salary range describe different labor markets. The first is \$148,100 in the Bureau of Labor Statistics (BLS) May 2025 table. The second is \$500,000-\$850,000 on one Anthropic reinforcement-learning research posting.[^bls2025wages][^anthropicagents2026]

Both figures are real; they cover different populations and compensation fields.

Pay figures below are US dollars for US roles, before tax. Before comparing them, identify the work, the level, the location, the pay field, and the date attached to each number. If job families still feel blurry, start with the [AI engineer role guide](/blog/what-does-an-ai-engineer-do).

## Start with the measuring stick

Picture a recruiter saying, "The range is \$500K." What should you write down: annual salary, base salary, target cash, or total compensation? **Base salary** is the fixed pay rate for your work. **Target cash** adds the bonus the employer aims to pay, which may differ from the actual payout. **Total compensation (TC)** typically adds an equity value to cash; check what each source includes and which year it describes.

Salary sources answer different questions. Mixing them can make an offer look stronger or weaker than the source supports.

| Source | What it measures | What it misses | Best use |
|---|---|---|---|
| BLS Occupational Employment and Wage Statistics[^bls2025wages] | Employer-surveyed wages for a broad occupation and geography | No AI engineer category; the wage definition excludes stock, nonproduction bonuses, and benefits[^bls2026oesfaq] | Broad US occupation and location context |
| Employer posting | One role's disclosed salary or pay range, location, and sometimes bonus or equity labels | Actual offer, internal level, grant size, and negotiable components may be absent | Current employer-specific anchor |
| Levels.fyi | Crowdsourced yearly base, stock, bonus, and normalized company levels[^levelsfyi2026] | User selection, changing samples, and inexact cross-company level mapping | Level-specific total-compensation cross-check |
| Department of Labor Office of Foreign Labor Certification (OFLC) disclosure data[^dol2026oflc] | Employer-submitted wage fields from selected immigration applications | Equity, bonus, full workforce, and a clean market sample | A dated wage-record cross-check, never a total-compensation estimate |

> **Source scope:** Don't average rows from these sources. First match source definition, job family, level, location, and date. Only then compare values.

That headline can feel decisive. Before you compare it with another number, check what the source actually includes. BLS's published wage can include base rates and some incentive pay, but it excludes stock bonuses, nonproduction bonuses, and employer-paid benefits.[^bls2026oesfaq]

For an OFLC Labor Condition Application (LCA) record, inspect the wage unit too. The official worksite layout distinguishes the offered wage range from the prevailing wage (a benchmark for the job and location). Its unit can be hour, week, biweekly, month, or year. A row with `WAGE_RATE_OF_PAY_FROM = 95` and `WAGE_UNIT_OF_PAY = Hour` reports an hourly rate. Annualizing it as $95 \times 2{,}080 = 197{,}600$ dollars assumes a full-year, 40-hour schedule; the wage field leaves that schedule as an assumption.[^dol2026lcaworksites]

Treat missing components as unknown. An employer might mention equity without pricing the grant, or publish salary without explaining bonuses. Levels.fyi generally combines base, stock, and bonus into a yearly total; its guide notes that relocation or profit-sharing can add other amounts, and a new hire's bonus field can include a signing bonus. Inspect the component fields and notes before assuming the total recurs every year.[^levelsfyi2026]

```checkpoint
A submission shows 180,000 dollars in base, 80,000 in annual stock value, and 40,000 in bonus. Its notes say 30,000 of the bonus was a one-time signing payment. What recurring annual package follows if the other components stay unchanged?
---
270,000 dollars: 180,000 base + 80,000 stock + 10,000 recurring bonus. The reported first-year sum is 300,000 dollars. Stock value depends on vesting and market price; future bonuses depend on payout decisions.
```

| Source | Headline field | Bonus treatment | Equity treatment |
| --- | --- | --- | --- |
| BLS OEWS | Wages | Some types included | Stock bonuses excluded |
| OpenAI | Base pay in description | Separate if eligible | Separate; unpriced |
| Anthropic | Annual Salary | Not specified | Grant not specified |
| Levels.fyi | Total compensation | Included in total | Annual value in total |

These employer rows refer to the cited postings checked November 23, 2026. Compare down each column before comparing headline dollars. “Not specified” describes missing information; “excluded” describes a source definition.

## Use occupation data for context

When you need a national baseline, BLS is useful precisely because its table is broad. The May 2025 release groups workers into nearby occupations; use those figures as national context and build AI-engineer pay bands from role-specific sources.

The annual wage column reports **means** for broad occupations; the table also lists median hourly wages. Software developers cover a much larger workforce than computer and information research scientists, so use these figures as broad occupational context when assessing AI-engineering roles. SOC means Standard Occupational Classification, the system used to identify the occupations.[^bls2025wages][^bls2026oesfaq]

| BLS occupation | SOC code | US employment | US annual mean wage | Median hourly wage | Coverage note |
|---|---:|---:|---:|---:|---|
| Software developers | 15-1252 | 1,687,890 | \$148,100 | \$65.38 | Covers software work across industries and specialties |
| Data scientists | 15-2051 | 262,440 | \$126,800 | \$57.80 | Covers data-science work beyond model-backed product engineering |
| Computer and information research scientists | 15-1221 | 37,200 | \$153,930 | \$67.45 | Smaller research occupation; broad context for research-engineering roles |

Read the two wage columns separately. A **median** is the middle worker's wage, while a **mean** is the average across workers. The columns also use different units: one covers a year and the other an hour. Use them for broad occupation context; build starting offers and AI-specific pay bands from role-level data.

BLS also publishes state and metro estimates, which are better context when an offer is tied to one location.[^bls2026oesfaq]

OEWS wages are closer to cash-wage context than to total compensation. They include base rates and some incentive pay, but exclude stock, nonproduction bonuses, and employer-paid benefits.[^bls2026oesfaq] That difference in coverage is why the next source, an employer posting, needs to be read field by field.

## Read a posting field by field

These three employer pages were checked on November 23, 2026 and selected to show different disclosed fields. They illustrate research-oriented roles at two frontier labs. Broader, representative data is needed to estimate pay across the applied-AI market. Recheck the pages before using them in an offer conversation.

| Posting | Exact published field | Role and level evidence | Location evidence |
|---|---:|---|---|
| OpenAI Research Engineer[^openaire2026] | Compensation: \$250K-\$445K + Offers Equity | Cited page publishes no internal level | San Francisco |
| Anthropic Research Engineer, ML (Reinforcement Learning)[^anthropicagents2026] | Annual Salary: \$500K-\$850K | Posting says required experience correlates with internal level; the cited page gives no level | San Francisco or New York City; at least 25% office expectation |
| Anthropic ML/Research Engineer, Safeguards[^anthropicsafeguards2026] | Annual Salary: \$350K-\$500K | Posting asks for 4+ years; the cited page gives no internal level | San Francisco or New York City; at least 25% office expectation |

OpenAI labels its range **Compensation**, then describes the offered amount as base pay and says total compensation also includes equity and performance-related bonuses for eligible employees. The cited page gives no prices for those additional components. Anthropic's two pages label their figures **Annual Salary** and list no equity grant alongside those amounts.[^openaire2026]

Keep the Anthropic field label as "Annual Salary," and leave hypothetical equity out of the published numbers.

Anthropic's safeguards role asks for 4+ years; years alone give limited evidence about staff or senior scope. OpenAI publishes no level on the cited page. These ranges cover three specific postings and cannot define universal junior, mid-level, senior, or staff AI-engineer bands.

> **Field-name check:** If a recruiter says "500 to 850," ask whether that string is annual salary, base salary, or total compensation. The cited Anthropic RL posting uses Annual Salary for those dollars.

When using Levels.fyi, match the level and location, then inspect base, stock per year, bonus, submission date, and sample details. A median across several levels answers a different question from a median for your level. Read the live breakdown instead of carrying a company-wide snapshot into an offer call.[^levelsfyi2026]

A posting gives you a number to inspect. To know whether it's a fair comparison, ask whether the role involves work like yours.

## Match the work before the title

Two jobs can use "AI engineer" while buying different work. Build your peer set from the deliverable and technical ownership.

| Role family | Work to match | Strong comparator |
|---|---|---|
| Applied AI engineer | Retrieval, tool use, product workflows, evals, and user-facing reliability | Product software roles with similar end-to-end scope |
| Machine learning engineer | Training, ranking, retrieval, feature pipelines, and deployed models | ML roles on comparable product and infrastructure ladders |
| ML systems engineer | <span data-glossary="gpu">GPU</span> efficiency, distributed training, serving, compilers, or runtimes | Infrastructure roles with the same performance and scale ownership |
| Research engineer | Experiments, model methods, training loops, and evaluation design | Lab or research-platform roles with comparable research and systems depth |
| Agent systems engineer | Tool loops, <span data-glossary="sandbox">sandboxes</span>, coding agents, and long-horizon evaluation | Applied or systems roles with the same risk and reliability scope |

Role family narrows the peer set. Compare responsibility and organizational scope when estimating a premium. Owning one retrieval feature differs from setting evaluation and serving architecture across teams.

If the role specifically owns serving latency or throughput, [Inference Mechanics](/learn/inference-mechanics-ttft-tps-kv-cache) explains the latency and memory constraints behind that work. Technical relevance makes a role a better comparator; it doesn't justify a salary premium by itself.

Match the employment arrangement too. A San Francisco office role and an international contractor quote differ in more than currency. Ask which location sets the band, whether a move changes it, and who pays for benefits, leave, equipment, and required travel. For a concrete budget check, an extra \$1,500 a month in housing consumes \$18,000 a year after tax. Don't subtract that directly from a pre-tax salary difference and call the remainder disposable income.

Comparable roles can still pay on different clocks. Does the larger number arrive as salary this year, or as a grant you might not be able to sell?

## Put every offer on one clock

Recruiters may quote annual base, target bonus, a four-year grant, annualized equity, or first-year cash. Put each offer on the same four-year window, then write down when each component pays or vests. That keeps a large paper grant from hiding a weak first year or a long wait for liquidity.

**Vesting** is the schedule on which you earn rights to an equity award. A **cliff** delays the first vest until a specified date. **Liquidity** means you can actually sell the shares, which may happen much later than vesting. A <span data-glossary="restricted-stock-unit">restricted stock unit (RSU)</span> is a promise to deliver shares or their value after specified conditions are met; an option is a right to buy shares at a fixed **strike price**. A **refresher** is a later equity award with its own vesting schedule; track vesting and liquidity to estimate what it may deliver in a given year.

### Worked example with explicit assumptions

The two worked offers below separate vesting timing, target cash, and equity risk under one set of pre-tax assumptions.

- **Offer A, public company:** \$175K base, an initial \$440K RSU grant vesting equally over four years, and a 15% target bonus. Also model an unpromised \$40K refresher granted at the start of each of years 3 and 4, each vesting quarterly over four years with no cliff.
- **Offer B, private company:** \$190K base, 10% target bonus, and an initial option grant quoted as \$380K over four years (\$95K annualized), vesting equally each year. No refresher or announced opportunity to sell shares back to the company or another buyer.

Assume four complete years of employment, unchanged base salaries, full target bonus, constant public share price, and no taxes or transaction fees. Carry private options at the employer's stated value and report sale proceeds separately. Include equity that vests within the four-year window; later vesting falls outside this total.

| Four-year component | Offer A | Offer B |
|---|---:|---:|
| Base | $4 \times 175\text{K USD} = 700\text{K USD}$ | $4 \times 190\text{K USD} = 760\text{K USD}$ |
| Target bonus | $4 \times 26.25\text{K USD} = 105\text{K USD}$ | $4 \times 19\text{K USD} = 76\text{K USD}$ |
| Initial equity at stated value | $4 \times 110\text{K USD} = 440\text{K USD}$ in public RSUs | $4 \times 95\text{K USD} = 380\text{K USD}$ in private options |
| Refreshers vesting within the window | Year 3: $10\text{K USD}$ + year 4: $20\text{K USD}$ = $30\text{K USD}$ | \$0 |
| **Stated pre-tax total** | **\$1.275M** | **\$1.216M** |

The first refresher contributes \$10K in year 3 and another \$10K in year 4. Only \$10K of the second grant vests in year 4. Another \$50K vests after this comparison ends. Adding both full \$40K grants would overstate Offer A's four-year value by \$50K.

<figure>
  <img src="illustrations/_generated/offer_comparison_stack_dark.png" alt="Annual offer stacks share a 350 thousand dollar scale. Offer A totals 311,250 dollars in years 1 and 2, 321,250 in year 3, and 331,250 in year 4 as 10,000 and then 20,000 dollars of refreshers vest. Offer B shows 209,000 dollars of target cash plus 95,000 of stated private option value each year. Option value is not spendable cash." />
  <figcaption>Use refresher amounts as they vest. Offer A's purple slice grows from zero to 10,000 to 20,000 dollars, while Offer B's orange slice remains an unverified private-option valuation. The common scale shows stated value; liquidity is a separate factor.</figcaption>
</figure>

> **Assumptions check:** "Stated pre-tax total" reports the offer assumptions before taxes, spending, or expected-wealth analysis. Re-run the table when stock price, bonus payout, vesting, start date, exercise cost, or refresher assumption changes.

Offer A comes out higher on paper. Before that difference feels like a win, ask what each equity slice could actually turn into.

## Let uncertainty show up in the math

Salary accrues while employment continues, so model continued employment alongside the quoted annual rate. Target bonuses need payout scenarios. Public stock needs price and sale-restriction scenarios. Private options need exercise cost, dilution, tax, and liquidity scenarios. Dilution reduces your ownership percentage when the company issues additional shares. Model each offer component separately.

<!-- leetllm: test, output=show, output_title="Four-year offer schedule and downside sensitivity" -->
```python title="offer_comparison.py"
def offer_a_year_totals(
    base: float = 175_000,
    bonus_rate: float = 0.15,
    initial_rsu_total: float = 440_000,
    refresher_grant: float = 40_000,
    equity_factor: float = 1.0,
) -> list[float]:
    bonus = base * bonus_rate
    initial_per_year = initial_rsu_total / 4
    years = []
    for year in range(1, 5):
        refresher_vested = 0.0
        if year >= 3:
            refresher_vested += refresher_grant / 4
        if year >= 4:
            refresher_vested += refresher_grant / 4
        equity = (initial_per_year + refresher_vested) * equity_factor
        years.append(base + bonus + equity)
    return years


def offer_b_option_payoff(shares: int, strike: float, exit_price: float) -> float:
    return shares * max(0.0, exit_price - strike)


a_years = offer_a_year_totals()
a_half_equity = sum(offer_a_year_totals(equity_factor=0.5))
b_cash = 4 * (190_000 + 19_000)

assert a_years == [311_250.0, 311_250.0, 321_250.0, 331_250.0]
assert sum(a_years) == 1_275_000.0
assert a_half_equity == 1_040_000.0
assert b_cash + offer_b_option_payoff(20_000, 4.0, 23.0) == 1_216_000.0
assert b_cash + offer_b_option_payoff(20_000, 4.0, 13.50) == 1_026_000.0
assert b_cash + offer_b_option_payoff(20_000, 4.0, 4.0) == 836_000.0

print(f"Offer A Y1-Y4: {[int(v) for v in a_years]} | 4-yr total: ${int(sum(a_years)):,}")
print(f"Offer A 50% equity case: ${int(a_half_equity):,} (4-yr cash: ${round(4 * 175_000 * 1.15):,})")
for label, exit_px in [("100% ($23.00)", 23.0), ("50% ($13.50)", 13.5), ("0% ($4.00)", 4.0)]:
    payoff = offer_b_option_payoff(20_000, 4.0, exit_px)
    print(f"Offer B {label}: ${int(b_cash + payoff):,} (option payoff: ${int(payoff):,})")
```

<!-- leetllm: output:start -->
```text title="Four-year offer schedule and downside sensitivity" output compact
Offer A Y1-Y4: [311250, 311250, 321250, 331250] | 4-yr total: $1,275,000
Offer A 50% equity case: $1,040,000 (4-yr cash: $805,000)
Offer B 100% ($23.00): $1,216,000 (option payoff: $380,000)
Offer B 50% ($13.50): $1,026,000 (option payoff: $190,000)
Offer B 0% ($4.00): $836,000 (option payoff: $0)
```
<!-- leetllm: output:end -->

If all equity becomes worthless but target bonuses pay in full, Offer A leaves \$805K and Offer B leaves \$836K over four years. If bonuses also pay zero, those figures fall to the salary-only \$700K and \$760K. This separates a higher cash rate from a higher headline package.

For Offer B, counting options at 0%, 50%, and 100% of stated value produces \$836K, \$1.026M, and \$1.216M. The three totals show how the calculation changes with assumed option value; they leave outcome likelihood unspecified.

An option valuation needs an additional calculation. Suppose the quoted \$380K represents 20,000 options with a \$4 strike and a hypothetical \$23 sale price for common shares. Ignoring taxes and fees, proceeds after exercise cost would be $20{,}000 \times (23\text{ USD} - 4\text{ USD}) = 380\text{K USD}$. A \$13.50 sale price gives \$190K. A price at or below \$4 gives no positive exercise payoff. If there's no permitted sale, none of those scenarios produces spendable proceeds yet.

The purchase alone costs $20{,}000 \times 4\text{ USD} = 80\text{K USD}$. Exercising before a sale can therefore put your own cash at risk, even if a compensation spreadsheet assigns the options a positive value. A headline company valuation or preferred-investor share price can differ from the amount common shareholders receive. Ask how the employer calculated its quoted option value before comparing it with RSUs.

Public equity is uncertain too. With no refreshers, Offer A's total falls from \$1.275M to \$1.245M. If all its assumed RSU vest values, including refreshers, are 50% lower, it totals \$1.040M: \$805K target cash plus \$235K equity. Apply comparable downside assumptions to both offers.

Using the zero-equity case, predict Offer B's four-year cash total if bonuses also pay zero. Then check your reasoning:

<details>
<summary>Why only salary remains</summary>

<p>At an annual salary of 190,000 dollars, four years produce 760,000 dollars if employment continues. That's 76,000 dollars below the earlier 836,000-dollar total because the target bonus is now zero. Exercising those 20,000 options would require another 80,000 dollars before taxes; a paper valuation doesn't fund that purchase.</p>

</details>

Before treating a private grant as cash, ask for its type, number of shares or options, strike price, fully diluted share count or ownership percentage, vesting and cliff, post-employment exercise window, tender policy, and transfer restrictions. A company valuation headline can't answer those questions.

US tax treatment also varies by instrument and event. The IRS says incentive stock options may trigger alternative minimum tax at exercise, while most nonstatutory options without a readily determinable fair market value create income at exercise equal to share value minus price paid.[^irs2026stockoptions] State and non-US rules differ. Get personalized tax advice before exercising a material grant.

The package math frames the pay comparison. To assess level, show what bottleneck you owned and the evidence a reviewer can inspect.

## Turn ownership into evidence

When you discuss your level, a list of tools won't show what you owned. A short account of the bottleneck, your decision, and a result you can verify will.

Start with five facts: bottleneck, constraint, decision, measured result, and business effect.

Consider a concrete impact summary. An internal FAQ assistant took 4.2 seconds at <span data-glossary="p95-latency">p95</span> because each request sent a full document dump to the highest-cost model. Routing, caching, and shorter context reduced p95 to 1.1 seconds and <span data-glossary="token">token</span> cost per conversation by 62%.

Here, p95 is the latency at or below which 95% of requests finish. The comparison needs the same task mix, load, and evaluation harness, plus an answer-quality check. Otherwise faster, cheaper answers might be less useful. A before-and-after result for three changes also doesn't prove which change caused how much of the improvement.

<figure>
  <img src="illustrations/_generated/impact_story_chain_dark.png" alt="Before-and-after bars for an internal FAQ assistant. p95 latency falls from 4.2 seconds to 1.1 seconds, and a token-cost index falls from 100 to 38, after routing, caching, and shorter context replace a full document dump to the highest-cost model." />
  <figcaption>The bar encodes the measured delta across baseline, intervention, and outcome metrics recorded in a trace or cost ledger.</figcaption>
</figure>

Don't borrow those figures. Bring an eval report, trace, benchmark, cost ledger, incident reduction, or adoption result you can inspect. Separate work you owned from the team outcome. If you need to produce this kind of evidence, [Model Gateways, Routing, and Fallbacks](/learn/llm-cost-engineering-token-economics) covers the router, and [LLM Cost Engineering](/learn/llm-cost-engineering-token-economics) shows how to keep the token ledger honest. The [portfolio project guide](/blog/ai-engineer-portfolio-projects-interviews) shows how to package that evidence. Use the [technical presentation lesson](/learn/ai-lab-system-design-interview) to rehearse trade-offs without inflating credit. The call still needs one page that keeps the pay field, the four-year clock, and those stories together.

## Build one offer-call worksheet

Before the call, put the decision on one page:

- exact role family, expected scope, likely level, and location policy
- three closest employer postings with field name and date captured
- one broad occupation or metro benchmark for context
- four-year schedule for base, sign-on, target bonus, equity, and refreshers
- downside, stated-value, and upside equity scenarios
- vesting, cliff, exercise, clawback, and liquidity terms
- two measured ownership stories tied to the role's current bottlenecks
- questions whose answers would change your decision

Ask the recruiter to name the compensation field alongside the number: "Is that annual salary, base salary, target cash, or total compensation?" That question catches the category error before you start negotiating around the wrong number.

Ask whether the equity quote is grant-date value, current annualized value, or a number of shares. Ask which components are guaranteed, targeted, discretionary, or subject to approval.

Salary-negotiation laws and tax rules vary by jurisdiction. Don't turn a general script into legal advice. Keep the arithmetic pre-tax, record the assumptions, and bring local counsel or a tax professional into any material equity or relocation decision.

Keep a BLS wage, a posting, and an offer in separate columns, and name which parts of a package are cash this year. Before you use any of these numbers in a real offer call, reopen the source pages. The BLS figures use the May 2025 OEWS release, and the OpenAI and Anthropic postings were checked on November 23, 2026. If the role you want asks for evidence you haven't built yet, the [AI engineer learning route](/blog/how-to-become-ai-engineer-from-zero-2026) can help you choose what to work on next.
