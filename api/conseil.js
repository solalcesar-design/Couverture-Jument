import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@vercel/kv";

export default async function handler(req, res) {
  try {
    const key = process.env.GEMINI_API_KEY_Jalena;

    // On force la connexion avec TES variables exactes
    const kv = createClient({
      url: process.env.KV_URL || process.env.REDIS_URL,
      token: process.env.KV_REST_API_TOKEN || process.env.REDIS_REST_API_TOKEN,
    });

    if (req.method === 'POST') {
      const { text } = JSON.parse(req.body);
      await kv.set("config_jalena", text);
      return res.status(200).json({ success: true });
    }

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
