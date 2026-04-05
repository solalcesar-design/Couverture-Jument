import { GoogleGenerativeAI } from "@google/generative-ai";
import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  try {
    const key = process.env.GEMINI_API_KEY_Jalena;
    
    // Test POST pour enregistrer
    if (req.method === 'POST') {
      const { text } = req.body;
      await kv.set("config_jalena", text);
      return res.status(200).json({ success: true });
    }

    // Lecture des règles
    const config = await kv.get("config_jalena");
    const { temp, vent, pluie } = req.query;

    if (!config) {
      return res.status(200).json({ message: "Veuillez enregistrer vos couvertures dans Configuration." });
    }

    // Appel IA avec diagnostic
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Température: ${temp}°C, Vent: ${vent}km/h. Voici mes règles: ${config}. Quelle couverture mettre ? Réponds très brièvement.`;
    
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    return res.status(200).json({ message: text });

  } catch (error) {
    // Ce message nous dira précisément ce qui ne va pas avec Gemini
    return res.status(200).json({ message: "Erreur IA : " + error.message });
  }
}
