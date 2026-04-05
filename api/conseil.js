import { GoogleGenerativeAI } from "@google/generative-ai";
import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  try {
    const key = process.env.GEMINI_API_KEY_Jalena;

    if (req.method === 'POST') {
      const { text } = req.body;
      await kv.set("config_jalena", text);
      return res.status(200).json({ success: true });
    }

    const config = await kv.get("config_jalena");
    const { temp, vent, pluie } = req.query;

    if (!config) {
      return res.status(200).json({ message: "Note tes couvertures dans Configuration !" });
    }

    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Prompt ultra-court pour une réponse instantanée
    const prompt = `Météo : ${temp}°C, vent ${vent}km/h. Règles : ${config}. Quelle couverture ? Réponds en une phrase.`;
    
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    return res.status(200).json({ message: text });

  } catch (error) {
    return res.status(200).json({ message: "L'IA est timide, réessaie dans 2 secondes !" });
  }
}
