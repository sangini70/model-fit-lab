import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(
  import.meta.env.VITE_GEMINI_API_KEY!
);

// 1. GARMENT DESCRIBER MODULE (formerly Brain)
// Filters input and isolates the main garment structure.
export async function generateGarmentDescription(userPrompt: string): Promise<string> {
  const systemPrompt = `You are a "Garment Structure Stabilizer".
Your goal is to isolate and describe the PHYSICAL STRUCTURE of the SINGLE MAIN GARMENT from the user's input.

CRITICAL RULES:
1.  **Main Garment Only**: Identify the primary piece (usually coat, jacket, dress, or top). Ignore secondary pieces like leggings, skirts, pants (unless the user explicitly asks for a bottom *only*), and shoes.
2.  **Remove Styling & Accessories**: COMPLETELY REMOVE references to:
    *   Accessories: bags, necklaces, rings, watches, jewelry, hats, glasses.
    *   Styling: "styled with", "matched with", "wear it with", "coordination".
    *   Keywords to purge: leggings, skirt, pants, bottoms, coordination, match, styling, accessory, necklace, ring, watch, bag, suggestion, usage.
3.  **Focus on Structure**: Describe ONLY:
    *   Cut and Silhouette (e.g., oversized, tailored, boxy).
    *   Fabric properties (e.g., heavy wool, rigid denim, fluid silk).
    *   Construction details (e.g., drop shoulder, double-breasted, raw hem).
    *   Proportions.
4.  **No "Ideas"**: Do not generate new creative ideas. Just stabilize and refine the input into a structural description.

Input: "${userPrompt}"

Output: A concise, technical description of the SINGLE main garment's structure. No styling advice.`;

  try {
  const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash"
});

const result = await model.generateContent({
  contents: [
    {
      role: "user",
      parts: [
        { text: systemPrompt + "\n\n" + userPrompt }
      ]
    }
  ]
});
    return result.response.text();
    } catch (error) {
  console.error("Garment Describer Error:", error);
  throw error;
}

