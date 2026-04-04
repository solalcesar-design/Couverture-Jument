import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "redis";

export default async function handler(req, res) {
  const client = createClient({ url: process.env.REDIS_URL });

  try {
    const geminiKey = process.env.GEMINI_API_KEY_Jalena;
    await client.connect();

    // 1. Sauvegarder les réglages (POST)
    if (req.method === 'POST') {
      const { text } = JSON.parse(req.body);
      await client.set("config_jalena", text);
      await client.disconnect();
      return res.status(200).json({ success: true });
    }

    // 2. Récupérer le conseil (GET)
    const config = await client.get("config_jalena");
    const { temp, vent, pluie } = req.query;

    if (!config) {
      await client.disconnect();
      return res.status(200).json({ message: "⚙️ Clique sur 'Configuration Écurie' pour me donner tes règles !" });
    }

    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Jalena météo : ${temp}°C, vent ${vent}km/h, pluie ${pluie}mm. Tes règles : ${config}. Quelle couverture mettre ? Sois très bref.`;
    const result = await model.generateContent(prompt);
    
    await client.disconnect();
    return res.status(200).json({ message: result.response.text() });

  } catch (error) {
    if (client.isOpen) await client.disconnect();
    return res.status(500).json({ message: "Erreur : " + error.message });
  }
}
