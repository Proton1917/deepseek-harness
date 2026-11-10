import { describe, expect, it } from 'vitest'
import { createMessage } from '@deepseek-ai/dsh-llm'
import { normalizeContext } from '@earendil-works/pi-ai/utils/transcript'
import { resolveProfiles } from '../src/config.ts'
import { toPiContext } from '../src/context.ts'
import type { PiAiReplayResponse } from '../src/replay.ts'

describe('Anthropic thinking history', () => {
  it.each([
    { label: 'unsigned default', route: undefined, model: undefined, signature: '', type: 'thinking' },
    { label: 'route override', route: false, model: undefined, signature: '', type: 'text' },
    { label: 'model opt-in', route: false, model: true, signature: '', type: 'thinking' },
    { label: 'model opt-out', route: true, model: false, signature: '', type: 'text' },
    { label: 'signed default', route: undefined, model: undefined, signature: 'signature', type: 'thinking' },
  ])('preserves the configured thinking policy: $label', async ({ route, model: override, signature, type }) => {
    const providerId = 'gateway'
    const modelId = 'ccor/deepseek/deepseek-v4.1-flash-1017'
    const profile = resolveProfiles({
      [providerId]: {
        api: 'anthropic-messages',
        baseURL: 'https://example.invalid',
        ...route === undefined ? {} : { compat: { allowEmptySignature: route } },
        models: [{
          id: modelId,
          ...override === undefined ? {} : { compat: { allowEmptySignature: override } },
        }],
      },
    }).get(providerId)
    const provider = profile?.piProvider
    const model = provider?.getModels()[0]
    if (provider === undefined || model === undefined) throw new Error('Configured model is unavailable')
    const replay: PiAiReplayResponse = {
      kind: 'pi-ai', version: 2, api: 'anthropic-messages',
      provider: providerId, model: modelId, stopReason: 'stop',
      responseModel: 'deepseek/deepseek-v4.1-flash-1017',
    }
    const context = toPiContext({
      provider: providerId,
      model: modelId,
      messages: [createMessage({
        role: 'assistant',
        content: [{ type: 'reasoning', text: 'Add 2 and 3.' }, { type: 'text', text: '5' }],
        source: {
          kind: 'model', provider: providerId, model: modelId,
          replayState: {
            response: replay,
            blocks: [{ type: 'reasoning', thinkingSignature: signature }, { type: 'text' }],
          },
        },
      })],
    })
    const controller = new AbortController()
    const payloads: unknown[] = []
    const stream = provider.streamSimple(model, normalizeContext(context), {
      apiKey: 'unused',
      cacheRetention: 'none',
      signal: controller.signal,
      onPayload(payload) {
        payloads.push(payload)
        controller.abort()
      },
    })
    await stream.result()
    expect(payloads).toEqual([expect.objectContaining({
      messages: [{
        role: 'assistant',
        content: [
          type === 'thinking'
            ? { type: 'thinking', thinking: 'Add 2 and 3.', signature }
            : { type: 'text', text: 'Add 2 and 3.' },
          { type: 'text', text: '5' },
        ],
      }],
    })])
  })
})
