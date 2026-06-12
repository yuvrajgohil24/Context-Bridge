import { GoogleGenerativeAI } from "@google/generative-ai";
import { COMPRESSION_SYSTEM_PROMPT } from "../../../lib/prompts";

export async function POST(req: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return Response.json({ error: "GEMINI_API_KEY is not set" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const { conversation } = await req.json();

    if (!conversation) {
       return Response.json({ error: "No conversation provided" }, { status: 400 });
    }

    // Using gemini-2.0-flash for reliability and speed
    const modelName = process.env.GEMINI_MODEL || "gemini-2.0-flash";
    const model = genAI.getGenerativeModel({ model: modelName });

    const prompt = `${COMPRESSION_SYSTEM_PROMPT}\n\nConversation:\n${conversation}`;
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return Response.json({ compressed: text });
  } catch (error: any) {
    console.error("Compression Error:", error);
    return Response.json({ error: error.message || "Something went wrong during compression" }, { status: 500 });
  }
}
