# Agent Note: Optional live token-usage projection

Status: implemented

English | [中文](2026-08-04-optional-live-token-usage-projection.zh.md)

## Problem

The durable `tokenUsage` session projection changes when a provider reports usage, so the composer status row remains static while a response streams. A presentation plugin can estimate partial input, output, and throughput, but it needs a typed session-scoped channel that does not weaken the durable provider-usage contract.

## Decision

The token-meter client vocabulary includes `liveTokenUsage`, an optional session projection supplied by an extension plugin. Its input and output buckets use the same shape as `tokenUsage`; `estimated` distinguishes heuristic buckets from provider-corrected values, and `tokensPerSecond` carries output throughput when the producer has a measurable interval.

The built-in composer status row prefers `liveTokenUsage` for input and output while it is present, renders their sum as an unabridged grouped integer, prefixes estimated values with `~`, and falls back to the durable `tokenUsage` projection when no live producer is registered. The sum is billed input (`uncachedInputTokens + cacheReadTokens + cacheWriteTokens`) plus output. Cache-hit percentage always comes from `tokenUsage`, because cache accounting is provider-owned and has no reliable streaming estimate. The built-in row does not render throughput; a plugin can add that presentation through `conversation.composer.dock` without changing the conversation package.

The live projection does not become a billing, context-pressure, or persistence authority. Its producer owns estimation, provider correction, retry replacement, abort rollback, and update cadence. The durable `tokenUsage` projection remains the complete-session source for exact provider usage.

## Alternatives considered

**Register a live estimator in the built-in token-meter plugin.** Rejected because estimation policy and update cadence are presentation choices. Owning them in the default runtime would turn an optional display feature into product-wide behavior and hard-code tunables that deployments need to control.

**Derive streaming totals directly in the React status component.** Rejected because the component would need to interpret request, chunk, retry, and abort events itself. That duplicates session projection logic in a render path and prevents other client contributions from consuming the same state.

**Replace the complete built-in status row from an external plugin.** Rejected because the plugin would duplicate turns, steps, context pressure, cache usage, and formatting merely to add one changing field. A typed projection lets the existing owner retain those fields while a separate dock contribution owns an additional row such as throughput.

**Publish estimates through `tokenUsage`.** Rejected because consumers rely on that projection as provider-reported durable usage. Mixing estimates into it would make cache accounting and exact totals ambiguous.

## Verification

The composer component test drives `liveTokenUsage` through its projection subscription and verifies that input, output, and their unabridged sum change during streaming, that estimated values carry `~`, and that the final display returns to exact provider usage. Token-meter projection tests continue to pin the durable usage and context-pressure contracts independently.

## Consequences

Without a live producer, the default composition keeps its existing exact final totals and does not show throughput. A plugin can provide continuously changing totals and a second dock row without replacing the built-in status strip. Consumers and producers gain one client projection contract whose optional presence and estimate marker must remain compatible.
