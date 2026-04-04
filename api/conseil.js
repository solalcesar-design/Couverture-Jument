import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@vercel/kv";

export default async function handler(req, res) {
  // On utilise ton nom de clé exact : GEMINI_API_KEY_Jalena
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY_Jalena);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  // On utilise ta variable REDIS_URL que l'on voit sur tes captures
  const kv = createClient({
    url: process.env.REDIS_URL || process.env.KV_REST_API_URL,
    token: process.env.REDIS_REST_API_TOKEN || process.env.KV_REST_API_TOKEN,
  });

  try {
    let config = await kv.get("config_jalena");

    if (req.method === 'POST') {
      const { text } = JSON.parse(req.body);
      const result = await model.generateContent(`Analyse ces règles de couverture : "${text}". Réponds en JSON : {"inventaire": "ton résumé ici"}`);
      const responseText = result.response.text().replace(/```json|```/g, "").trim();
      await kv.set("config_jalena", JSON.parse(responseText));
      return res.status(200).json({ success: true });
    }

    const { temp, vent, pluie, tempHier } = req.query;

    if (!config) {
      return res.status(200).json({ message: "Note tes couvertures dans la Zone Configuration d'abord !" });
    }

    const prompt = `Météo : ${temp}°C, Vent ${vent}km/h, Pluie ${pluie}mm. Hier : ${tempHier}°C. Règles : ${config.inventaire}. Dis précisément quelle couverture mettre ce soir à Jalena.`;
    const result = await model.generateContent(prompt);

    res.status(200).json({ 
      message: result.response.text(), 
      isAlerte: (tempHier - temp) >= 5,
      config: config
    });

  } catch (error) {
    res.status(500).json({ message: "Erreur de connexion. Vérifie tes clés API sur Vercel." });
  }
}
