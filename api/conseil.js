import { GoogleGenerativeAI } from "@google/generative-ai";
import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  try {
    const key = process.env.GEMINI_API_KEY_Jalena;

    if (req.method === 'POST') {
      const { text: configText } = req.body; // ✅ renommé
      await kv.set("config_jalena", configText);
      return res.status(200).json({ success: true });
    }

    // GET pour récupérer les règles brutes (pour admin)
    if (req.query.mode === 'config') {
      const config = await kv.get("config_jalena");
      return res.status(200).json({ config: config || "" });
    }

    const config = await kv.get("config_jalena");
    const { temp, vent, pluie } = req.query;

    if (!config) {
      return res.status(200).json({ message: "Veuillez enregistrer vos couvertures dans Configuration." });
    }

    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Température: ${temp}°C, Vent: ${vent}km/h, Pluie: ${pluie}mm. Voici mes règles: ${config}. Quelle couverture mettre ? Réponds très brièvement.`;

    const result = await model.generateContent(prompt);
    const iaText = result.response.text(); // ✅ renommé

    return res.status(200).json({ message: iaText });
  } catch (error) {
    return res.status(200).json({ message: "Erreur IA : " + error.message });
  }
}
