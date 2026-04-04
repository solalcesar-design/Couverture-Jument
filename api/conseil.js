import { GoogleGenerativeAI } from "@google/generative-ai";
import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  try {
    // 1. On vérifie la clé Gemini
    const geminiKey = process.env.GEMINI_API_KEY_Jalena;
    if (!geminiKey) throw new Error("Clé Gemini manquante");

    // 2. Gestion de l'enregistrement (POST)
    if (req.method === 'POST') {
      const { text } = JSON.parse(req.body);
      await kv.set("config_jalena", text);
      return res.status(200).json({ success: true });
    }

    // 3. Demande de conseil (GET)
    const config = await kv.get("config_jalena");
    const { temp, vent, pluie } = req.query;

    if (!config) {
      return res.status(200).json({ message: "⚙️ Configure tes couvertures d'abord !" });
    }

    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Jalena : ${temp}°C, vent ${vent}km/h, pluie ${pluie}mm. Règles : ${config}. Quel conseil ?`;
    const result = await model.generateContent(prompt);
    const responseText = await result.response.text();

    return res.status(200).json({ message: responseText });

  } catch (error) {
    console.error(error);
    return res.status(200).json({ message: "Erreur IA : " + error.message });
  }
}
