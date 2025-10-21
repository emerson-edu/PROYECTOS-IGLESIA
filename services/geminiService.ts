import { GoogleGenAI } from "@google/genai";
import { EditorTask } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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

export const generateContent = async (task: EditorTask, input: string, options: { [key: string]: any } = {}): Promise<string> => {
  try {
    const prompt = getPromptForTask(task, input, options);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
        topP: 0.95,
      },
    });

    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        return `Error al contactar al asistente de IA: ${error.message}`;
    }
    return "Ocurrió un error desconocido al procesar la solicitud.";
  }
};