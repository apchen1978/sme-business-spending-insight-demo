# SME Business Spending Insight v0.1

**企業支出決策啟發** is a new local shadow prototype. It tests whether a Taiwan SME owner gains a useful business lens when considering or reviewing company spending.

## Product hypothesis

An SME owner does not need another bookkeeping tool or an accounting textbook. Before or after spending money, the owner may benefit from a short explanation of the commercial meaning: cash timing, expected benefit, future cost, evidence, and the next question for a CPA or other professional.

The intended reaction is: **「原來這筆錢還可以這樣想。」**

## What changed from Tax Review Prep

`tax-review-prep-v0.1` remains preserved as historical prototype evidence. This sibling prototype changes the default entry experience from structured tax preparation to two owner decisions:

- `我正在考慮這筆支出` — think before committing company money.
- `我已經花了這筆錢` — understand what deserves attention after spending.

Owner Insight appears first. Professional Handoff is optional progressive disclosure.

The opening visual is intentionally a semantic cover rather than a dashboard: it shows the five owner lenses (cash, benefit, timing, evidence, and professional confirmation) without inventing scores, savings, or case outcomes.

## Owner Insight philosophy

Each case presents:

1. What is happening.
2. Why it may matter.
3. One step further for the owner to consider.
4. What to keep.
5. What to ask a CPA or other professional.

The prototype translates accounting and tax concepts into business questions. It does not answer the professional question.

## Boundaries

This is not a tax engine, savings calculator, bookkeeping system, filing service, accounting classification engine, or professional endorsement. It does not determine deductibility, final accounting treatment, incentive eligibility, depreciation, or tax savings. No artificial tax-avoidance transaction is suggested.

All examples are synthetic. Synthetic owner, synthetic CPA question, and synthetic reaction are not customer evidence or testimonials.

## Owner BEFORE / AFTER test

1. Choose the considering mode.
2. Before reading the result, answer: “公司準備花 NT$600,000 裝修辦公室。在做決定之前，你會考慮哪些事情？”
3. Enter the same case or click the synthetic sample.
4. Read Layer 1 only; do not open Professional Handoff.
5. Answer: “現在你還會多考慮什麼？”
6. Record whether the owner gained a useful new decision lens: `YES`, `PARTIAL`, or `NO`.

Secondary questions: Was the insight understood? Was it actionable? Was it too accounting-heavy? Did it accidentally sound like tax advice? Would the owner want to check another spending decision?

## Known limitations

The insight logic is a deliberately small local heuristic, not an AI model or legal rules engine. It uses the description and selected focus to generate educational wording. It has not been validated by real SME owners or CPAs. No external data, API, persistence, authentication, or production deployment is included.

## Evidence status

- `PROTOTYPE_IMPLEMENTATION`: pending local validation
- `DESIGN VALIDATED INTERNALLY`: yes, pending final smoke test
- `OWNER_INSIGHT`: not human validated
- `CPA HANDOFF`: not human validated
- `PUBLIC_OUTCOME_CLAIMS`: not validated

## Exactly one next action

Run one Owner BEFORE / AFTER test with the synthetic office-renovation case and record whether the Owner added a useful consideration that was absent before the insight.
