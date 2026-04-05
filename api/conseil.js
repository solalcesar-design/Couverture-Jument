import { GoogleGenerativeAI } from "@google/generative-ai";
import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  try {
    const key = process.env.GEMINI_API_KEY_Jalena;

    // ── POST : enregistrer les règles ──
    if (req.method === 'POST') {
      const { text: configText } = req.body; // ✅ renommé pour éviter conflit
      if (!configText) {
        return res.status(400).json({ error: "Contenu vide" });
      }
      await kv.set("config_jalena", configText);
      return res.status(200).json({ success: true });
    }

    // ── GET mode=config : retourner les règles brutes pour l'admin ──
    if (req.query.mode === 'config') {
      const config = await kv.get("config_jalena");
      return res.status(200).json({ config: config || "" });
    }

    // ── GET normal : conseil IA ──
    const config = await kv.get("config_jalena");
    const { temp, vent, pluie } = req.query;

    if (!config) {
      return res.status(200).json({
        message: "Aucune règle configurée. Va dans Configuration pour les enregistrer."
      });
    }

    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Tu es un assistant pour un cheval. Voici la météo actuelle : Température: ${temp}°C, Vent: ${vent}km/h, Pluie: ${pluie}mm. Voici les règles de couverture de la propriétaire : ${config}. Quelle couverture mettre ce soir ? Réponds très brièvement, en une ou deux phrases maximum, de façon directe et chaleureuse.`;

    const result = await model.generateContent(prompt);
    const iaText = result.response.text(); // ✅ renommé, pas de conflit

    return res.status(200).json({ message: iaText });

  } catch (error) {
    return res.status(200).json({ message: "Erreur IA : " + error.message });
  }
}
