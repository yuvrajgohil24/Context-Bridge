// Dev utility: lists Gemini models available to the configured API key.
// Run with: npx tsx check-models.ts (requires GEMINI_API_KEY in the environment)

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("GEMINI_API_KEY is not set in .env.local");
  process.exit(1);
}

interface ModelInfo {
  name: string;
  supportedGenerationMethods?: string[];
}

async function checkModels() {
  try {
    // Key goes in a header, not the URL, so it never lands in logs or shell history.
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models", {
      headers: { "x-goog-api-key": apiKey! },
    });
    const data: { models?: ModelInfo[] } = await response.json();

    if (data.models) {
      console.log("=== ADMISSIBLE MODELS FOR YOUR KEY ===");
      for (const m of data.models) {
        if (m.supportedGenerationMethods?.includes("generateContent")) {
          console.log(`Model: ${m.name}`);
        }
      }
      console.log("======================================");
    } else {
      console.log("Response:", data);
    }
  } catch (err) {
    console.error("Error fetching models:", err);
  }
}

checkModels();
