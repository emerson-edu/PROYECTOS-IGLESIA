import { GoogleGenAI } from "@google/genai";
import { EditorTask } from '../types';

// Proveedores con plan gratuito y endpoint compatible con OpenAI.
// Fuente: https://github.com/open-free-llm-api/awesome-freellm-apis (freellm.net)
const FREE_PROVIDERS: { [key: string]: { baseUrl: string; defaultModel: string } } = {
  groq: { baseUrl: "https://api.groq.com/openai/v1", defaultModel: "llama-3.3-70b-versatile" },
  openrouter: { baseUrl: "https://openrouter.ai/api/v1", defaultModel: "nvidia/nemotron-3-ultra-550b-a55b:free" },
  mistral: { baseUrl: "https://api.mistral.ai/v1", defaultModel: "mistral-small-latest" },
  cerebras: { baseUrl: "https://api.cerebras.ai/v1", defaultModel: "llama-3.3-70b" },
  nvidia: { baseUrl: "https://integrate.api.nvidia.com/v1", defaultModel: "z-ai/glm-5.2" },
  llm7: { baseUrl: "https://api.llm7.io/v1", defaultModel: "gpt-oss-20b" },
  huggingface: { baseUrl: "https://router.huggingface.co/v1", defaultModel: "openai/gpt-oss-120b" },
};

const PROVIDER = (process.env.LLM_PROVIDER || "gemini").toLowerCase();
const API_KEY = process.env.LLM_API_KEY || process.env.API_KEY;
const MODEL = process.env.LLM_MODEL;
const BASE_URL = process.env.LLM_BASE_URL;

const SYSTEM_INSTRUCTION = `Eres un experto asistente teológico, escritor y editor. Tu propósito es ayudar a los usuarios a crear libros y manuales de alta calidad sobre teología, la Biblia y educación cristiana. Tienes conocimientos en hermenéutica, teología sistemática, historia de la iglesia y principios educativos. Tu tono debe ser claro, respetuoso y académico, a menos que el usuario especifique lo contrario. Responde siempre en español. Para los cuestionarios, asegúrate de que cada pregunta tenga 4 opciones y marca la respuesta correcta.`;

const getPromptForTask = (task: EditorTask, input: string, options: { [key: string]: any } = {}): string => {
  switch (task) {
    case EditorTask.GENERATE_CONTENT:
      return `Genera contenido detallado y bien estructurado sobre el siguiente tema: "${input}"`;
    case EditorTask.SUMMARIZE:
      return `Resume el siguiente texto, manteniendo las ideas teológicas clave y la coherencia: "${input}"`;
    case EditorTask.EXPAND:
      return `Expande sobre el siguiente punto o texto, añadiendo más detalles, explicaciones y profundidad teológica: "${input}"`;
    case EditorTask.PROOFREAD:
      return `Corrige la gramática y la ortografía del siguiente texto, y sugiere mejoras de estilo para un público académico/eclesiástico. Devuelve solo el texto corregido: "${input}"`;
    case EditorTask.GENERATE_STRUCTURE:
      return `Crea una estructura o un índice detallado para un libro o manual sobre el siguiente tema: "${input}"`;
    case EditorTask.FIND_VERSES:
      return `Encuentra y lista versículos bíblicos relevantes (con sus citas, por ejemplo, Juan 3:16) para el siguiente tema o pasaje. Proporciona una breve explicación de por qué cada versículo es relevante: "${input}"`;
    case EditorTask.GENERATE_QUIZ:
        return `Genera un cuestionario de opción múltiple con ${options.quizQuestions || 10} preguntas sobre el siguiente tema: "${input}". Cada pregunta debe tener 4 opciones (A, B, C, D) y debes indicar claramente cuál es la respuesta correcta.`;
    default:
      throw new Error("Unknown task");
  }
};

const callGemini = async (prompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const response = await ai.models.generateContent({
    model: MODEL || "gemini-2.5-pro",
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.7,
      topP: 0.95,
    },
  });
  return response.text;
};

const callOpenAICompatible = async (prompt: string): Promise<string> => {
  const preset = FREE_PROVIDERS[PROVIDER];
  const baseUrl = BASE_URL || preset?.baseUrl;
  const model = MODEL || preset?.defaultModel;
  if (!baseUrl || !model) {
    throw new Error(`Proveedor "${PROVIDER}" desconocido: defina LLM_BASE_URL y LLM_MODEL en .env.local`);
  }

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_INSTRUCTION },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      top_p: 0.95,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`${PROVIDER} respondió ${response.status}: ${detail.slice(0, 300)}`);
  }
  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? "";
};

export const generateContent = async (task: EditorTask, input: string, options: { [key: string]: any } = {}): Promise<string> => {
  try {
    if (!API_KEY) {
      throw new Error("Falta la clave de API: defina LLM_API_KEY (o GEMINI_API_KEY) en .env.local");
    }
    const prompt = getPromptForTask(task, input, options);
    return PROVIDER === "gemini" ? await callGemini(prompt) : await callOpenAICompatible(prompt);
  } catch (error) {
    console.error(`Error calling ${PROVIDER} API:`, error);
    if (error instanceof Error) {
        return `Error al contactar al asistente de IA: ${error.message}`;
    }
    return "Ocurrió un error desconocido al procesar la solicitud.";
  }
};
