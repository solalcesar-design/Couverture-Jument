import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@vercel/kv";

export default async function handler(req, res) {
  try {
    // On récupère tes variables telles qu'elles sont nommées sur ton screen
    const geminiKey = process.env.GEMINI_API_KEY_Jalena;
    const url = process.env.KV_URL || process.env.REDIS_URL;

    // IMPORTANT: Pour Vercel KV, le token est souvent inclus dans l'URL 
    // ou stocké à part. On crée le client de façon robuste :
    const kv = createClient({
      url: url.startsWith('http') ? url : `https://${url}`,
      token: process.env.KV_REST_API_TOKEN || url.split('@')[1]?.split('.')[0] 
    });

    // Gestion de l'enregistrement (POST)
    if (req.method === 'POST') {
      const { text } = req.body;
      await kv.set("config_jalena", text);
      return res.status(200).json({ success: true });
    }

    // Récupération des règles (GET)
    const config = await kv.get("config_jalena");
    const { temp, vent, pluie } = req.query;

    if (!config) {
      return res.status(200).json({ message: "⚙️ Mémoire vide. Enregistre tes règles dans Configuration !" });
    }

    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Jalena : ${temp}°C, vent ${vent}km/h, pluie ${pluie}mm. Règles : ${config}. Quel conseil ?`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return res.status(200).json({ message: response.text() });

  } catch (error) {
    return res.status(200).json({ message: "Note tes couvertures dans la zone Configuration !" });
  }
}
