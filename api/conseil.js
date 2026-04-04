import { GoogleGenerativeAI } from "@google/generative-ai";
import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  // 1. Récupérer la config enregistrée par l'admin (couvre-cou, tranches...)
  let config = await kv.get("config_jalena") || { 
    inventaire: "Non défini", 
    tranches: "Non définies" 
  };

  // 2. MODE ADMIN : Si on envoie du texte depuis la zone Admin
  if (req.method === 'POST') {
    const { text } = JSON.parse(req.body);
    const updatePrompt = `Tu es l'assistant de Jalena. L'utilisateur veut modifier l'inventaire ou les tranches : "${text}".
    Reformule l'inventaire actuel en précisant bien quelles couvertures ont des couvre-cou.
    Réponds UNIQUEMENT au format JSON : {"inventaire": "...", "tranches": "..."}`;
    
    const result = await model.generateContent(updatePrompt);
    const responseText = result.response.text().replace(/```json|```/g, "");
    const nouvelleConfig = JSON.parse(responseText);
    
    await kv.set("config_jalena", nouvelleConfig);
    return res.status(200).json({ success: true });
  }

  // 3. MODE CONSEIL : Analyse de la météo et chute de température
  const { temp, tempHier } = req.query;
  const chute = tempHier - temp;
  let alerteFroid = chute >= 5 ? `⚠️ ALERTE : La température a chuté de ${chute}°C !` : "";

  const prompt = `Température : ${temp}°C. ${alerteFroid}
  Inventaire : ${config.inventaire}. Tranches : ${config.tranches}.
  Donne un conseil court. Si la couverture choisie a un couvre-cou (amovible ou fixe), précise s'il faut le mettre.`;

  const result = await model.generateContent(prompt);
  res.status(200).json({ message: result.response.text(), isAlerte: chute >= 5 });
}
