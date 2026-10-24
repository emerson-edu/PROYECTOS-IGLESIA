<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1Gewhxp4Uz8ENVnFPt_bQ7-2IfKTokc-3

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
   (o use un proveedor gratuito, ver abajo)
3. Run the app:
   `npm run dev`

## Proveedores de IA gratuitos

La app acepta, además de Gemini, cualquier API compatible con OpenAI de la lista
[awesome-freellm-apis](https://github.com/open-free-llm-api/awesome-freellm-apis)
(datos actualizados en [freellm.net](https://freellm.net)). Copie `.env.example`
como `.env.local` y defina el proveedor y su clave:

```
LLM_PROVIDER=groq
LLM_API_KEY=gsk_...
```

| Proveedor | `LLM_PROVIDER` | Modelo predeterminado | Obtener clave |
|---|---|---|---|
| Groq (sin tarjeta, 30 RPM) | `groq` | `llama-3.3-70b-versatile` | https://console.groq.com/keys |
| OpenRouter (modelos `:free`) | `openrouter` | `nvidia/nemotron-3-ultra-550b-a55b:free` | https://openrouter.ai/keys |
| Mistral AI | `mistral` | `mistral-small-latest` | https://console.mistral.ai/api-keys |
| Cerebras | `cerebras` | `llama-3.3-70b` | https://cloud.cerebras.ai/ |
| NVIDIA NIM | `nvidia` | `z-ai/glm-5.2` | https://build.nvidia.com/settings/api-keys |
| LLM7.io | `llm7` | `gpt-oss-20b` | https://token.llm7.io |
| Hugging Face | `huggingface` | `openai/gpt-oss-120b` | https://huggingface.co/settings/tokens |

`LLM_MODEL` cambia el modelo y `LLM_BASE_URL` permite usar cualquier otro proveedor
de la lista. Reinicie `npm run dev` después de editar `.env.local`.

