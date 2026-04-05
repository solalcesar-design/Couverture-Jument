import { GoogleGenerativeAI } from "@google/generative-ai";
import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  try {
    const key = process.env.GEMINI_API_KEY_Jalena;

    // 1. SAUVEGARDE
    if (req.method === 'POST') {
      const { text } = JSON.parse(req.body);
      // On force l'écriture dans "config_jalena"
      await kv.set("config_jalena", text);
      return res.status(200).json({ success: true });
    }

    // 2. LECTURE
    // On force la lecture de "config_jalena"
    const config = await kv.get("config_jalena");
    
    // DEBUG : Si vraiment vide, on renvoie un message précis
    if (!config || config === "") {
      return res.status(200).json({ message: "La base de données est vide. Retourne dans Configuration et clique bien sur Enregistrer." });
    }

    const { temp, vent, pluie } = req.query;
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Météo : ${temp}°C, vent ${vent}km/h. Règles : ${config}. Quel conseil ?`;
    const result = await model.generateContent(prompt);
    
    return res.status(200).json({ message: result.response.text() });

  } catch (error) {
    return res.status(200).json({ message: "Erreur technique : " + error.message });
  }
}
