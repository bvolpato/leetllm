# Salary comparison research, checked September 23, 2026

## The editorial question

How can a reader compare an AI-engineering offer when published wage estimates, employer salary disclosures, crowdsourced packages, and private equity quotes measure different things?

The article teaches source definitions before dollar comparisons, then uses worked Offer A/B schedules to separate vesting, target cash, paper equity value, and liquidity. A job title doesn't define a single salary market. The evidence below does not generalize to market-wide AI pay, junior/senior bands, a specialization premium, or an employment outcome.

## Verified public evidence

- BLS May 2025 national table: software developers have employment 1,687,890, annual mean wage 148,100 dollars, hourly median 65.38 dollars; data scientists 262,440 / 126,800 / 57.80; computer and information research scientists 37,200 / 153,930 / 67.45. These are broad occupations, not AI-engineer pay bands. Source: https://www.bls.gov/news.release/ocwage.t01.htm
- BLS wages include base rates, incentive pay, and production bonuses, but exclude stock bonuses, nonproduction bonuses, and employer-paid benefits. Means and medians differ; the table's annual and hourly columns also have different units. Source: https://www.bls.gov/oes/oes_ques.htm
- OpenAI Research Engineer (San Francisco) displays Compensation 250K-445K dollars + Offers Equity. The explanatory paragraph identifies base pay and says total compensation also includes equity and performance-related bonuses for eligible employees. No internal level or priced equity amount supports a level-specific TC band. Source: https://openai.com/careers/research-engineer-san-francisco/
- Anthropic Research Engineer, Machine Learning (Reinforcement Learning) displays Annual Salary 500K-850K dollars. Locations SF/NY; required years correlate with an unspecified internal level; staff office expectation at least 25%, with some roles requiring more. Preserve the published field name rather than relabeling it base. Source: https://job-boards.greenhouse.io/anthropic/jobs/4613568008
- Anthropic ML/Research Engineer, Safeguards displays Annual Salary 350K-500K dollars. It asks for 4+ years, but doesn't publish an internal level. Locations SF/NY; same office qualification. Source: https://job-boards.greenhouse.io/anthropic/jobs/4949336008
- These three posts were chosen to contrast disclosures, not to sample a population. They are research-oriented frontier-lab examples. Their upper endpoints are neither market ceilings nor typical offers.
- Levels.fyi's own data guide describes crowdsourcing, yearly base/stock/bonus, and an inexact normalized level mapping. Total can also include extraneous relocation or profit-sharing; a new hire's bonus field can include signing bonus. No fixed live company median was checked or published here. Source: https://www.levels.fyi/reports/archive/guides/Levels.fyi%20Compensation%20Data%20Guide.pdf
- OFLC's official LCA worksite layout describes employer-provided administrative applications and separate offered/prevailing wage fields. Wage unit can be Hour, Week, Bi-Weekly, Month, or Year. This isn't a workforce-wide compensation sample and the fields aren't TC. Source: https://www.dol.gov/sites/dolgov/files/ETA/oflc/pdfs/LCA_Worksites_Record_Layout_FY2026_Q1.pdf
- The main OFLC performance page failed direct web opens in this review. The official foreign-labor home page confirms public disclosure data and a 2026 Q3 release; no filing dataset or aggregator median was downloaded/recomputed. Sources: https://www.dol.gov/agencies/eta/foreign-labor/performance and https://www.dol.gov/agencies/eta/foreign-labor
- IRS Topic 427 says exercising an ISO may trigger AMT. Most nonstatutory options without readily determinable fair market value create exercise income equal to received stock FMV less paid amount. This doesn't determine an individual tax bill. Source: https://www.irs.gov/taxtopics/tc427

## Worked-offer arithmetic, not market evidence

Offer A: 175K annual base + 26.25K target bonus + 110K initial RSU vest value per year. A 40K refresher at the start of year 3 vests 10K in year 3 and 10K in year 4. Another 40K at the start of year 4 contributes 10K within the window. Four-year stated value is 1.275M, not 1.33M. The remaining 50K of these refreshers falls after the four-year comparison.

Offer B: 190K base + 19K target bonus + 95K stated private option value per year gives 1.216M over four years. Target cash alone is 836K; salary alone 760K. Counting options at 0%, 50%, and 100% gives 836K / 1.026M / 1.216M. These are sensitivity cases, not expected values or probabilities.

A worked 20,000-option grant with 4-dollar strike costs 80K to exercise. At 23-dollar common-share sale price, net exercise payoff before tax/fees is 380K; at 13.50 it is 190K; at/below 4 it has no positive exercise payoff. Without a permitted sale, none of these paper scenarios produces spendable proceeds.

The FAQ assistant 4.2s-to-1.1s p95 and 62% token-cost reduction are worked metrics, not live compensation evidence. A real claim needs comparable task, load, and quality conditions and an inspectable report; changing three things together doesn't isolate each contribution.

## Teaching additions and verification limits

The recurring-pay checkpoint distinguishes a 300K first-year report containing 30K signing bonus from a 270K recurring sum. The LCA example distinguishes 95 dollars/hour from 95K/year; multiplying by 2,080 adds a full-year 40-hour assumption.

The previous generated packet called the Anthropic fields base, labeled frontier posts ceilings, named obsolete illustrations, and overcounted refresher grant values. Those claims are superseded by the checked selections above. Unreverified third-party company figures aren't retained as current anchors.

A Python program verifies all Offer A and Offer B four-year cash, vested RSU, refresher, and option exit scenarios via `--write-outputs`, matching the prose, table, and illustrations. Both body illustrations and the social banner were built and inspected in dark and light modes.
