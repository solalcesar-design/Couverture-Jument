import { GoogleGenerativeAI } from "@google/generative-ai";
import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  try {
    // On vérifie que la clé Gemini est bien présente
    const key = process.env.GEMINI_API_KEY_Jalena;
    if (!key) {
      return res.status(200).json({ message: "Clé GEMINI_API_KEY_Jalena manquante dans Vercel." });
    }

    // Sauvegarde des règles
    if (req.method === 'POST') {
      const { text } = req.body;
      await kv.set("config_jalena", text);
      return res.status(200).json({ success: true });
    }

    // Récupération des règles
    const config = await kv.get("config_jalena");
    if (!config) {
      return res.status(200).json({ message: "⚙️ Mémoire vide. Enregistre tes règles dans Configuration !" });
    }

    const { temp, vent, pluie } = req.query;

    // Appel à l'IA
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `En tant qu'assistant pour la jument Jalena. Météo : ${temp}°C, vent ${vent}km/h. Voici les couvertures disponibles et mes préférences : ${config}. Que dois-je mettre ce soir ? Réponds courtement.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return res.status(200).json({ message: text });

  } catch (error) {
    // Ce message s'affiche si la clé Gemini est invalide ou si l'IA sature
    return res.status(200).json({ message: "L'IA ne parvient pas à générer de réponse. Vérifie ta clé Gemini API." });
  }
}
