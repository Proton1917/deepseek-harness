---
kind: upgrade-guide
description: "Anthropic Messages profiles preserve unsigned thinking blocks by default during history replay."
---

# Anthropic Messages unsigned thinking

English | [中文](guide.zh.md)

## Change

The pi-ai adapter defaults `compat.allowEmptySignature` to `true` for `anthropic-messages`. A same-model thinking block with an empty signature previously became ordinary text during request serialization. It now remains a thinking block. Signed thinking and regular answer text retain their types and content. Explicit catalog, provider, and model values keep their existing precedence.

## Migration

1. Keep the default for endpoints that accept empty thinking signatures, including DeepSeek-compatible Messages endpoints.
2. For an endpoint that requires the previous text conversion, set `compat.allowEmptySignature: false` in its provider or model entry in the profile's `cordis.patch.yml`:

   ```yaml
   compat:
     allowEmptySignature: false
   ```

3. Check the next serialized request: the default emits `type: thinking` with `signature: ""`; the explicit `false` setting emits the prior `type: text` representation.
