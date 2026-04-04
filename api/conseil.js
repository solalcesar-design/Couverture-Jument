import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@vercel/kv";

export default async function handler(req, res) {
  try {
    // On utilise tes noms de variables Vercel exacts
    const kv = createClient({
      url: process.env.REDIS_REST_API_URL || process.env.REDIS_URL,
      token: process.env.REDIS_REST_API_TOKEN,
    });

    const geminiKey = process.env.GEMINI_API_KEY_Jalena;
    if (!geminiKey) throw new Error("Clé Gemini manquante dans Vercel");

    // 1. Sauvegarder les règles (POST)
    if (req.method === 'POST') {
      const { text } = JSON.parse(req.body);
      await kv.set("config_jalena", text);
      return res.status(200).json({ success: true });
    }

    // 2. Demander un conseil (GET)
    const config = await kv.get("config_jalena");
    const { temp, vent, pluie } = req.query;

    if (!config) {
      return res.status(200).json({ message: "⚙️ Enregistre tes couvertures dans 'Configuration' !" });
    }

    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Jalena : ${temp}°C, vent ${vent}km/h, pluie ${pluie}mm. Règles : ${config}. Quel conseil ?`;
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    return res.status(200).json({ message: responseText });

  } catch (error) {
    return res.status(200).json({ message: "Désolé, il y a un souci : " + error.message });
  }
}
