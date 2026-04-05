import { GoogleGenerativeAI } from "@google/generative-ai";
import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  try {
    const key = process.env.GEMINI_API_KEY_Jalena;
    
    // 1. GESTION DE L'ENREGISTREMENT (Quand tu cliques sur Enregistrer)
    if (req.method === 'POST') {
      const { text } = JSON.parse(req.body);
      await kv.set("config_jalena", text);
      return res.status(200).json({ success: true });
    }

    // 2. GESTION DU CONSEIL (Quand tu cliques sur le bouton marron)
    const config = await kv.get("config_jalena");
    const { temp, vent, pluie } = req.query;

    // Si on n'a pas encore enregistré de règles dans la config
    if (!config) {
      return res.status(200).json({ message: "⚙️ Clique sur 'Configuration Écurie' en bas pour me dire quelles couvertures Jalena possède !" });
    }

    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Tu es l'assistant de Jalena. 
      Météo : ${temp}°C, Vent ${vent}km/h, Pluie ${pluie}mm. 
      Règles de la propriétaire : ${config}. 
      Dis-moi précisément quelle couverture mettre. Sois bref et amical.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    return res.status(200).json({ message: response.text() });

  } catch (error) {
    // Si ça bug, ce message s'affichera
    return res.status(200).json({ message: "Note tes couvertures dans la zone Configuration pour activer l'IA !" });
  }
}
