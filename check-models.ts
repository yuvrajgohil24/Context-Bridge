import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("GEMINI_API_KEY is not set in .env.local");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function checkModels() {
  try {
    const aiPlatform = genAI; 
    
    // Using fetch directly since getGenerativeModel doesn't list models on its own
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    
    if (data.models) {
      console.log("=== ADMISSIBLE MODELS FOR YOUR KEY ===");
      data.models.forEach((m: any) => {
        if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")) {
          console.log(`Model: ${m.name}`);
        }
      });
      console.log("======================================");
    } else {
      console.log("Response:", data);
    }
  } catch (err) {
    console.error("Error fetching models:", err);
  }
}

checkModels();
