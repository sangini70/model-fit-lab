import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize Gemini client
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("Warning: GEMINI_API_KEY is not set.");
}
const ai = new GoogleGenAI({ apiKey: apiKey });

// Middleware to parse JSON bodies
app.use(express.json());

// Logging helper
const logRequest = (requestId: string, step: string, model: string, startTime: number, status: 'success' | 'failure', error?: any) => {
  const latency = Date.now() - startTime;
  console.log(JSON.stringify({
    request_id: requestId,
    step,
    model,
    latency_ms: latency,
    status,
    error_code: error ? (error.status || error.code || 'unknown') : undefined
  }));
};

// --- API Routes ---

// 1. Text Generation Endpoint (Garment Describer & Interpreter)
app.post("/api/text", async (req, res) => {
  const { prompt, systemInstruction, step } = req.body;
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const startTime = Date.now();
  const modelName = process.env.GEMINI_TEXT_MODEL || "gemini-3-flash-preview";

  try {
    // Preprocessing for Garment Describer (Step 1)
    let finalPrompt = prompt;
    if (step === 'describer') {
      // Prepend strict instruction
      finalPrompt = `Main garment only. No secondary garments. No accessory expansion. No styling variation.\n\n${prompt}`;
      
      // Additional keyword filtering logic could go here if we were doing manual string manipulation,
      // but the prompt instruction handles the "rewrite" requirement.
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents: finalPrompt,
      config: {
        systemInstruction: systemInstruction,
      },
    });

    const text = response.text || "";
    
    logRequest(requestId, step || 'text', modelName, startTime, 'success');
    res.json({ text });

  } catch (error: any) {
    console.error("Text API Error:", error);
    logRequest(requestId, step || 'text', modelName, startTime, 'failure', error);
    
    // Simple fallback logic (retry once with same model, or switch if we had a backup)
    // For now, we just return error
    res.status(500).json({ error: "Failed to generate text", details: error.message });
  }
});

// 2. Image Generation Endpoint (Execution)
app.post("/api/image", async (req, res) => {
  const { prompt } = req.body;
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const startTime = Date.now();
  const modelName = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";

  // Validation Logic: Check for forbidden keywords in the prompt (specs)
  const forbiddenKeywords = /pants|skirt|leggings|denim|jewelry|necklace|ring|watch|bag|sunglasses/i;
  
  let finalPrompt = prompt;

  if (forbiddenKeywords.test(prompt)) {
    console.log(`[Validation] Forbidden keywords detected in image prompt. Triggering rewrite.`);
    
    // Automatic rewrite loop (1 time)
    try {
      const rewriteResponse = await ai.models.generateContent({
        model: process.env.GEMINI_TEXT_MODEL || "gemini-3-flash-preview",
        contents: `Rewrite the following fashion specification to REMOVE all references to secondary garments (pants, skirts, leggings) and accessories (jewelry, bags, etc). Keep ONLY the main garment structure.
        
        Input: "${prompt}"`,
      });
      
      const rewrittenPrompt = rewriteResponse.text;
      if (rewrittenPrompt) {
        finalPrompt = rewrittenPrompt;
        console.log(`[Validation] Prompt rewritten.`);
      }
      
      // Re-check (optional, but good for safety)
      if (forbiddenKeywords.test(finalPrompt)) {
         logRequest(requestId, 'image_validation', 'validation_check', startTime, 'failure', { code: 'VALIDATION_FAILED' });
         return res.status(400).json({ error: "Validation Failed: Input contains forbidden items (secondary garments or accessories) even after rewrite." });
      }

    } catch (rewriteError) {
      console.error("Rewrite failed:", rewriteError);
      // Proceed with original or fail? Let's fail to be safe as per "Stabilizer" goal.
      return res.status(500).json({ error: "Validation rewrite failed." });
    }
  }

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: finalPrompt,
    });

    const candidate = response.candidates?.[0];
    const imagePart = candidate?.content?.parts?.find(p => p.inlineData);

    if (imagePart && imagePart.inlineData && imagePart.inlineData.data) {
      const imageUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
      logRequest(requestId, 'image', modelName, startTime, 'success');
      res.json({ imageUrl });
    } else {
      throw new Error("No image data in response");
    }

  } catch (error: any) {
    console.error("Image API Error:", error);
    logRequest(requestId, 'image', modelName, startTime, 'failure', error);
    res.status(500).json({ error: "Failed to generate image", details: error.message });
  }
});

// --- Vite Integration ---

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production static file serving (if we were building for prod)
    // app.use(express.static('dist'));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
