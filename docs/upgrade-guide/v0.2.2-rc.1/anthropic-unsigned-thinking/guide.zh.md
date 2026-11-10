---
kind: upgrade-guide
description: "Anthropic Messages 配置在历史重放时默认保留空签名思考块。"
---

# Anthropic Messages 空签名思考块

[English](guide.md) | 中文

## 变更

pi-ai 适配器针对 `anthropic-messages` 将 `compat.allowEmptySignature` 默认设为 `true`。同模型的空签名思考块此前会在请求序列化时转为普通文本，现在保留思考块类型。带签名的思考块和正常回答文本均保留各自的类型和内容。目录、提供商和模型中的显式配置沿用既有优先级。

## 迁移

1. 接受空思考签名的端点沿用默认值，包括兼容 DeepSeek 的 Messages 端点。
2. 要求沿用文本转换的端点，在 profile 的 `cordis.patch.yml` 中为相应提供商或模型设置 `compat.allowEmptySignature: false`：

   ```yaml
   compat:
     allowEmptySignature: false
   ```

3. 查看下次序列化的请求：默认值产生带有 `signature: ""` 的 `type: thinking`；显式设置 `false` 时沿用此前的 `type: text` 表示。
