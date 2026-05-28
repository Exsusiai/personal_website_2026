# Token Usage Display Strategy

Date: 2026-05-28

Scope: 网站首页/公开页面的 Token Usage 展示口径，以及后台计算时应保留的语义边界。

## Decision

网站上建议使用一组最直观的公开指标：

```text
AI Usage
2.9B tokens processed
≈ $1,740 API-rate value
Last 30 days
```

推荐主口径：

- `Tokens processed`：展示 raw token traffic，即模型实际处理过的 token 规模。
- `API-rate value`：展示按公开 API 单价折算出的等价价值，而不是宣称真实账单花费。
- 小字说明：`Cache-aware estimate · not actual subscription spend`

不要在公开页面主卡片里展示过多分类，例如 input/output/cache read/cache write/reasoning 的完整 breakdown。那些适合后台、tooltip、debug 页面或 review 报告，不适合作为个人网站的第一层表达。

## Why Not "Billable Tokens"

不建议使用 `billable tokens` 这个词，因为行业里没有统一的 billable token 单位。

不同供应商和模型会把 token 分成不同计费 SKU：

- 普通 input tokens
- cached input / cache read tokens
- cache write / cache creation tokens
- output tokens
- reasoning tokens
- tool/search/image/audio 等非纯文本费用

这些类别的单价不同。把它们硬折算成一个 token 数，会比直接展示金额更难理解，也更容易误导。

更清晰的表达是：

- Token 数表示处理规模：`tokens processed`
- 金额表示价值折算：`API-rate value`

## Terms

### Raw Token Traffic

Raw token traffic 表示模型实际处理过的总 token 流量：

```text
raw_tokens =
  uncached_input_tokens
+ output_tokens
+ cache_read_tokens
+ cache_write_tokens
+ reasoning_tokens
```

它回答的是：

```text
这段时间模型/工具链一共处理了多大规模的上下文、代码和输出？
```

这个口径适合展示个人网站上的影响力或使用规模，因为它直观、数字稳定，也能体现 coding agent 场景中大量上下文缓存复用的真实规模。

### API-Rate Value

API-rate value 表示如果这些 token 按公开 API 价格表计价，大概相当于多少钱：

```text
api_rate_value =
  uncached_input_tokens * input_price
+ output_tokens * output_price
+ cache_write_tokens * cache_write_price
+ cache_read_tokens * cache_read_price
+ reasoning_tokens * reasoning_or_output_price
```

它回答的是：

```text
如果这些使用量按 API 单价购买，大概值多少钱？
```

注意它不是实际账单。原因是很多 usage 来自订阅制工具、代理服务、OAuth/Plus/Max/Codex/Claude Code 等环境，真实内部 quota 或账单可能和公开 API SKU 不完全一致。

## Recommended Public UI

### Primary Card

```text
AI Usage
2.9B tokens processed
≈ $1,740 API-rate value
Last 30 days
```

### Supporting Copy

```text
Cache-aware estimate · not actual subscription spend
```

### Tooltip Copy

```text
Tokens processed includes input, output, cached context, cache writes, and reasoning tokens when available. API-rate value estimates what the usage would cost under public provider API pricing; subscription tools may bill or meter differently.
```

## Provider Alignment

This strategy matches the way major providers separate usage from cost:

- OpenAI exposes granular usage fields such as `input_tokens`, `output_tokens`, and `input_cached_tokens`, while recommending Costs endpoint / dashboard cost data for financial reconciliation.
- Anthropic exposes uncached input, cache creation, cache read, and output token fields separately; cache read and cache write have distinct prices.
- Gemini / Vertex AI expose usage metadata including prompt, cached content, candidate/output, and total token counts; cached input is priced separately.
- OpenRouter exposes token usage details plus final charged cost in the response.

So the industry pattern is:

```text
usage = token/activity breakdown
cost = provider-specific priced result
```

The website should follow the same separation, but compress it into two public-facing numbers.

## Calculation Guidance

### Store Detailed Fields Internally

Even if the UI stays simple, the data model should keep granular fields:

- `input_tokens`
- `output_tokens`
- `cache_read_tokens`
- `cache_write_tokens`
- `reasoning_tokens` or `extra_tokens`
- `cost_usd` if reported by the source
- `estimated_api_value_usd` if calculated locally
- `source`
- `platform`
- `model`

The UI can then aggregate cleanly without losing future flexibility.

### Display Tokens

For public display:

```text
tokens_processed =
  input_tokens
+ output_tokens
+ cache_read_tokens
+ cache_write_tokens
+ reasoning_tokens
```

For OpenAI org usage, be careful: OpenAI's `input_tokens` includes cached tokens, and `input_cached_tokens` is a subset. Do not add `input_cached_tokens` on top of `input_tokens` unless the data has first been normalized into uncached/cached parts.

### Display Value

Prefer a normalized estimator:

```text
estimated_api_value_usd =
  uncached_input_tokens * model.input_price
+ output_tokens * model.output_price
+ cache_read_tokens * model.cache_read_price
+ cache_write_tokens * model.cache_write_price
+ reasoning_tokens * model.reasoning_price_or_output_price
```

If a source already reports reliable cost, store it separately as `reported_cost_usd`. Do not silently mix reported actual costs and estimated API-rate value under the same label.

Recommended public label:

```text
API-rate value
```

Avoid:

```text
Spend
Cost
Billable tokens
Money spent
```

Those imply actual billing, which is not always true for subscription-backed local tools.

## Current Project Implications

The current dashboard already uses a raw-token-like total because `usage_daily.total_tokens` includes:

```text
input_tokens + output_tokens + cache_read_tokens + cache_write_tokens
```

That is directionally correct for `tokens processed`.

Known gaps from the review:

- Hermes reasoning/extra tokens can be present in `ccusage.totalTokens` but are not yet stored in this project.
- `cost_usd` is incomplete because org pollers currently emit zero cost.
- Some sources represent cached tokens differently, so normalization is required before value estimation.
- Hermes named profiles are not auto-discovered by `ccusage` v20.0.4 unless `HERMES_HOME` explicitly includes each profile home.

## Recommended Implementation Plan

1. Keep the public UI simple: `tokens processed` plus `API-rate value`.
2. Rename current spend copy away from actual spend language unless backed by provider cost reports.
3. Add `reasoning_tokens` or `extra_tokens` to ingestion and `usage_daily`.
4. Add a pricing normalization layer keyed by provider/model/token type.
5. Store both `reported_cost_usd` and `estimated_api_value_usd` separately.
6. Show detailed breakdown only in tooltip/admin/debug contexts.

## References

- OpenAI Usage API: https://platform.openai.com/docs/api-reference/usage
- OpenAI Costs endpoint: https://platform.openai.com/docs/api-reference/usage/costs
- OpenAI Pricing: https://platform.openai.com/docs/pricing/
- Anthropic Messages Usage Report: https://docs.anthropic.com/en/api/admin-api/usage-cost/get-messages-usage-report
- Anthropic Pricing: https://docs.anthropic.com/en/docs/about-claude/pricing
- Anthropic Prompt Caching: https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching
- Gemini Context Caching: https://ai.google.dev/gemini-api/docs/caching
- Vertex AI Pricing: https://cloud.google.com/vertex-ai/generative-ai/pricing
- OpenRouter Usage Accounting: https://openrouter.ai/docs/guides/guides/usage-accounting
