import { GoogleGenerativeAI } from "@google/generative-ai";
import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  // Récupération de tes réglages personnalisés
  let config = await kv.get("config_jalena") || { inventaire: "Non défini", tranches: "Non définies" };

  if (req.method === 'POST') {
    const { text } = JSON.parse(req.body);
    const updatePrompt = `Tu es l'assistant de Jalena. L'utilisateur configure l'écurie : "${text}". 
    Mémorise les tranches de température, les couvertures et les conditions (pluie, vent).
    Réponds uniquement en JSON: {"inventaire": "...", "tranches": "..."}`;
    
    const result = await model.generateContent(updatePrompt);
    const responseText = result.response.text().replace(/```json|```/g, "");
    await kv.set("config_jalena", JSON.parse(responseText));
    return res.status(200).json({ success: true });
  }

  const { temp, vent, pluie, tempHier } = req.query;

  const prompt = `
    DÉTAILS MÉTÉO : Température ${temp}°C, Vent ${vent}km/h, Pluie ${pluie}mm.
    HISTORIQUE : Hier il faisait ${tempHier}°C.
    REGLAGES ADMIN : ${config.tranches} / ${config.inventaire}.
    MISSION : Donne un conseil précis. Si le vent est fort ou s'il pleut beaucoup, adapte la couverture (ex: mettre l'imperméable par dessus ou une plus chaude).
    Sois bref et direct.`;

  const result = await model.generateContent(prompt);
  res.status(200).json({ message: result.response.text(), isAlerte: (tempHier - temp) >= 5 });
}
