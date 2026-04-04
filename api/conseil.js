import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@redis/client";

export default async function handler(req, res) {
  try {
    // On utilise l'URL qui contient déjà ton mot de passe/token
    const redisUrl = process.env.REDIS_URL;
    const geminiKey = process.env.GEMINI_API_KEY_Jalena;

    if (!redisUrl || !geminiKey) {
      throw new Error("Variables manquantes sur Vercel");
    }

    const client = createClient({ url: redisUrl });
    await client.connect();

    // 1. Sauvegarder les règles (POST)
    if (req.method === 'POST') {
      const { text } = JSON.parse(req.body);
      await client.set("config_jalena", text);
      await client.disconnect();
      return res.status(200).json({ success: true });
    }

    // 2. Demander un conseil (GET)
    const config = await client.get("config_jalena");
    const { temp, vent, pluie } = req.query;

    if (!config) {
      await client.disconnect();
      return res.status(200).json({ message: "⚙️ Va dans Configuration pour enregistrer tes couvertures !" });
    }

    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Jalena : ${temp}°C, vent ${vent}km/h, pluie ${pluie}mm. Règles : ${config}. Quel conseil ?`;
    const result = await model.generateContent(prompt);
    
    await client.disconnect();
    return res.status(200).json({ message: result.response.text() });

  } catch (error) {
    return res.status(200).json({ message: "Note tes couvertures dans la zone Configuration !" });
  }
}
