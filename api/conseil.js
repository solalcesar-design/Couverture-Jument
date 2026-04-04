import { GoogleGenerativeAI } from "@google/generative-ai";
import { createKVCustom } from "@vercel/kv"; // On utilise la version personnalisée

export default async function handler(req, res) {
  try {
    const geminiKey = process.env.GEMINI_API_KEY_Jalena;
    
    // On crée la connexion en utilisant TES noms de variables Vercel
    const kv = createKVCustom({
      url: process.env.REDIS_REST_API_URL || process.env.REDIS_URL,
      token: process.env.REDIS_REST_API_TOKEN,
    });

    if (!geminiKey) throw new Error("Clé Gemini manquante");

    // Enregistrement (POST)
    if (req.method === 'POST') {
      const { text } = JSON.parse(req.body);
      await kv.set("config_jalena", text);
      return res.status(200).json({ success: true });
    }

    // Demande de conseil (GET)
    const config = await kv.get("config_jalena");
    const { temp, vent, pluie } = req.query;

    if (!config) {
      return res.status(200).json({ message: "⚙️ Enregistre tes couvertures dans 'Configuration' !" });
    }

    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Météo : ${temp}°C, vent ${vent}km/h, pluie ${pluie}mm. Règles : ${config}. Quel conseil ?`;
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    return res.status(200).json({ message: responseText });

  } catch (error) {
    return res.status(200).json({ message: "Erreur : " + error.message });
  }
}
