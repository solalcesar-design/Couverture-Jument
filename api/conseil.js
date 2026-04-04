import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@redis/client";

export default async function handler(req, res) {
  // On utilise TON nom de clé exact : GEMINI_API_KEY_Jalena
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY_Jalena);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  // Connexion à TON Redis avec la variable REDIS_URL
  const client = createClient({ url: process.env.REDIS_URL });
  client.on('error', (err) => console.log('Redis Client Error', err));
  if (!client.isOpen) await client.connect();

  try {
    // 1. Sauvegarder les règles (POST)
    if (req.method === 'POST') {
      const { text } = JSON.parse(req.body);
      await client.set("config_jalena", text);
      return res.status(200).json({ success: true });
    }

    // 2. Donner un conseil (GET)
    const configHorses = await client.get("config_jalena");
    const { temp, vent, pluie } = req.query;

    if (!configHorses) {
      return res.status(200).json({ message: "⚠️ Clique sur 'Configuration' en bas pour me dire quelles couvertures Jalena possède !" });
    }

    const prompt = `
      Tu es l'assistant de Jalena.
      METEO : ${temp}°C, Vent ${vent}km/h, Pluie ${pluie}mm.
      RÈGLES DE L'ÉCURIE : ${configHorses}
      CONSEIL : Dis quelle couverture mettre. Si pluie > 1mm ou vent > 30km/h, adapte selon les règles. Sois bref.`;

    const result = await model.generateContent(prompt);
    res.status(200).json({ message: result.response.text(), config: { inventaire: configHorses } });

  } catch (error) {
    res.status(500).json({ message: "Erreur de connexion. Vérifie tes clés sur Vercel." });
  } finally {
    await client.disconnect();
  }
}
