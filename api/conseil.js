import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@vercel/kv"; // On utilise le client standard

export default async function handler(req, res) {
  // 1. On utilise TON nom de clé : GEMINI_API_KEY_Jalena
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY_Jalena);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  // 2. Connexion à TON Redis (Vercel KV utilise REDIS_URL par défaut)
  const kv = createClient({
    url: process.env.REDIS_URL,
    token: process.env.REDIS_REST_API_TOKEN,
  });

  try {
    let config = await kv.get("config_jalena");

    if (req.method === 'POST') {
      const { text } = JSON.parse(req.body);
      const result = await model.generateContent(`Crée un résumé JSON : {"inventaire": "${text}"}`);
      const responseText = result.response.text().replace(/```json|```/g, "").trim();
      await kv.set("config_jalena", JSON.parse(responseText));
      return res.status(200).json({ success: true });
    }

    const { temp, vent, pluie, tempHier } = req.query;

    if (!config) {
      return res.status(200).json({ message: "Note tes couvertures dans la zone Configuration !" });
    }

    const prompt = `Météo : ${temp}°C, Vent ${vent}km/h, Pluie ${pluie}mm. Hier : ${tempHier}°C. Règles : ${config.inventaire}. Dis quelle couverture mettre.`;
    const result = await model.generateContent(prompt);

    res.status(200).json({ 
      message: result.response.text(), 
      isAlerte: (tempHier - temp) >= 5,
      config: config
    });

  } catch (error) {
    res.status(500).json({ message: "Erreur de connexion. Vérifie que GEMINI_API_KEY_Jalena est correcte." });
  }
}
