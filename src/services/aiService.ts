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
    const response = await fetch('/api/text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: userPrompt,
        systemInstruction: systemPrompt,
        step: 'describer'
      })
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.text || "Failed to generate garment description.";
  } catch (error) {
    console.error("Garment Describer Error:", error);
    throw new Error("Failed to stabilize garment structure.");
  }
}

// 2. GARMENT INTERPRETER MODULE
// Converts concept to realistic specs.
export async function interpretGarment(concept: string): Promise<string> {
  const systemPrompt = `You are a Garment Structure Interpreter.

Your task is NOT to create fashion ideas.
Your task is to convert conceptual fashion descriptions into
realistic, wearable garment construction specifications.

STRICT ENFORCEMENT:
- **Main Garment Only**: If the input still contains accessories or secondary garments, IGNORE THEM.
- **No Accessory Expansion**: Do not invent accessories.
- **No Styling Variation**: Do not suggest how to wear it.

Rules:
1. All garments must be physically wearable by humans.
2. Construction must follow logical tailoring structure.
3. Seams must align naturally.
4. Sleeves must attach realistically.
5. Fabric must behave according to gravity.
6. No distorted proportions.
7. No fantasy elements.
8. No logos.
9. No brand references.
10. Minimal decorative details (maximum 3).

Output format:

- Garment Type
- Silhouette Structure
- Construction Details
- Fabric Weight & Texture
- Fit Description
- Structural Stability Notes

Only output structured garment specification.
Do NOT add styling commentary.
Do NOT add background description.
Do NOT describe lighting.`;

  try {
    const response = await fetch('/api/text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: concept,
        systemInstruction: systemPrompt,
        step: 'interpreter'
      })
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.text || "Failed to interpret garment.";
  } catch (error) {
    console.error("Interpreter Error:", error);
    throw new Error("Failed to interpret garment structure.");
  }
}

// 3. EXECUTION MODULE
// Generates the final image.
export async function executeDesign(specs: string): Promise<string> {
  // Mandatory block from requirements
  const mandatoryBlock = `realistic tailoring construction,
logical seam alignment,
natural fabric gravity,
balanced human proportions,
no distorted garment structure,
no extra fabric,
no melting textile,
no warped symmetry`;

  // Pre-execution safety check injection (simulated by prompt engineering for the image model)
  // We ensure the prompt focuses strictly on the specs provided.
  const finalPrompt = `Generate a high-quality fashion image based STRICTLY on these specifications.
  
${specs}

${mandatoryBlock}

IMPORTANT:
- Render ONLY the garment described.
- NO extra accessories.
- NO complex background.
- Focus on structural realism.`;

  try {
    const response = await fetch('/api/image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: finalPrompt
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.imageUrl || "";
  } catch (error) {
    console.error("Execution Error:", error);
    throw new Error("Failed to execute design generation.");
  }
}
