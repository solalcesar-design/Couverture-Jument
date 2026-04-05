import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@vercel/kv";

export default async function handler(req, res) {
  try {
    const key = process.env.GEMINI_API_KEY_Jalena;

    // On crée le client manuellement pour éviter le bug auto de Vercel
    const kv = createClient({
      url: process.env.KV_REST_API_URL || process.env.KV_URL || process.env.REDIS_URL,
      token: process.env.KV_REST_API_TOKEN,
    });

    // 1. Sauvegarder (POST)
    if (req.method === 'POST') {
      const { text } = req.body;
      await kv.set("config_jalena", text);
      return res.status(200).json({ success: true });
    }

    // 2. Récupérer le conseil (GET)
    const config = await kv.get("config_jalena");
    const { temp, vent, pluie } = req.query;

    if (!config) {
      return res.status(200).json({ message: "⚙️ Va dans 'Configuration' pour enregistrer tes couvertures !" });
    }

    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Jalena : ${temp}°C, vent ${vent}km/h, pluie ${pluie}mm. Règles : ${config}. Quel conseil ?`;
    
    const result = await model.generateContent(prompt);
    return res.status(200).json({ message: result.response.text() });

  } catch (error) {
    return res.status(200).json({ message: "Erreur de connexion : " + error.message });
  }
}
