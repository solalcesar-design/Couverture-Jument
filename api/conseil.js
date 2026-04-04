const { GoogleGenerativeAI } = require("@google/generative-ai");
const { createClient } = require("@redis/client");

module.exports = async (req, res) => {
  // Récupération des clés configurées dans Vercel
  const geminiKey = process.env.GEMINI_API_KEY_Jalena;
  const redisUrl = process.env.REDIS_URL;

  // Sécurité : Vérification des clés avant de lancer
  if (!geminiKey || !redisUrl) {
    return res.status(200).json({ message: "⚠️ Configuration incomplète sur Vercel (Variables d'environnement)." });
  }

  const client = createClient({ url: redisUrl });
  
  try {
    await client.connect();

    // Gestion de l'enregistrement des règles
    if (req.method === 'POST') {
      const { text } = JSON.parse(req.body);
      await client.set("config_jalena", text);
      return res.status(200).json({ success: true });
    }

    // Gestion de la demande de conseil
    const config = await client.get("config_jalena");
    const { temp, vent, pluie } = req.query;

    if (!config) {
      return res.status(200).json({ message: "⚙️ Enregistre tes règles dans 'Configuration' pour commencer." });
    }

    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Météo : ${temp}°C, Vent ${vent}km/h, Pluie ${pluie}mm. Règles : ${config}. Quel conseil pour Jalena ?`;
    const result = await model.generateContent(prompt);

    return res.status(200).json({ message: result.response.text() });

  } catch (error) {
    return res.status(200).json({ message: "Désolé, j'ai un petit problème technique. Réessaie dans une minute !" });
  } finally {
    if (client.isOpen) await client.disconnect();
  }
};
