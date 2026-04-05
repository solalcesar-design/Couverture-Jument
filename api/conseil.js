import { GoogleGenerativeAI } from "@google/generative-ai";
import Redis from "ioredis";

const kv = new Redis(process.env.REDIS_URL);

export default async function handler(req, res) {
  try {
    const key = process.env.GEMINI_API_KEY_Jalena;

    if (req.method === 'POST') {
      const { text: configText } = req.body;
      if (!configText) return res.status(400).json({ error: "Contenu vide" });
      await kv.set("config_jalena", configText);
      return res.status(200).json({ success: true });
    }

    if (req.query.mode === 'config') {
      const config = await kv.get("config_jalena");
      return res.status(200).json({ config: config || "" });
    }

    const config = await kv.get("config_jalena");
    const { temp, vent, pluie } = req.query;

    if (!config) {
      return res.status(200).json({
        message: "Aucune règle configurée. Va dans Configuration pour les enregistrer."
      });
    }

    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `Tu es un assistant pour un cheval. Voici la météo : Température: ${temp}°C, Vent: ${vent}km/h, Pluie: ${pluie}mm. Règles de couverture : ${config}. Quelle couverture ce soir ? Réponds brièvement en une ou deux phrases.`;

    const result = await model.generateContent(prompt);
    const iaText = result.response.text();

    return res.status(200).json({ message: iaText });

  } catch (error) {
    return res.status(200).json({ message: "Erreur : " + error.message });
  }
}
