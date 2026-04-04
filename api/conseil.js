import { GoogleGenerativeAI } from "@google/generative-ai";
import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  // 1. Initialisation de l'IA (Gemini)
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  try {
    // 2. RECUPERATION DES DONNÉES ENREGISTRÉES (Redis)
    // On récupère ce que tu as tapé dans la zone Admin
    let config = await kv.get("config_jalena");

    // 3. SI L'ADMIN ENVOIE UNE NOUVELLE CONFIG (Méthode POST)
    if (req.method === 'POST') {
      const { text } = JSON.parse(req.body);
      
      const updatePrompt = `Tu es l'assistant spécialisé pour la jument Jalena. 
      L'utilisateur te donne ses préférences de couvertures et tranches météo : "${text}".
      Analyse ces informations et crée un résumé structuré que tu pourras utiliser plus tard.
      Réponds UNIQUEMENT avec un objet JSON comme ceci : {"inventaire": "ton résumé ici"}`;
      
      const result = await model.generateContent(updatePrompt);
      const responseText = result.response.text().replace(/```json|```/g, "").trim();
      const cleanedConfig = JSON.parse(responseText);
      
      // Sauvegarde définitive dans la mémoire Redis
      await kv.set("config_jalena", cleanedConfig);
      return res.status(200).json({ success: true });
    }

    // 4. SI ON DEMANDE UN CONSEIL (Méthode GET)
    const { temp, vent, pluie, tempHier } = req.query;

    // Si aucune config n'est trouvée dans Redis
    if (!config || !config.inventaire) {
      return res.status(200).json({ 
        message: "Je n'ai pas encore tes règles de couvertures. Va dans 'Configuration' pour me dire quoi mettre selon la température !" 
      });
    }

    // Calcul de la chute de température pour l'alerte
    const chute = tempHier ? (tempHier - temp) : 0;
    let alerteBrutale = chute >= 5 ? `⚠️ ALERTE : La température a chuté de ${chute}°C depuis hier !` : "";

    const conseilPrompt = `
      CONTEXTE MÉTÉO ACTUEL :
      - Température : ${temp}°C
      - Vent : ${vent} km/h
      - Pluie : ${pluie} mm
      - ${alerteBrutale}

      TES RÈGLES ENREGISTRÉES :
      ${config.inventaire}

      MISSION : 
      En fonction de la météo et de tes règles, dis précisément quelle couverture mettre à Jalena. 
      Si la météo indique de la pluie ou du vent fort, précise s'il faut ajouter un couvre-cou ou une protection imperméable selon tes règles.
      Sois bref, amical et donne une réponse directe.`;

    const result = await model.generateContent(conseilPrompt);
    const reponseIA = result.response.text();

    res.status(200).json({ 
      message: reponseIA, 
      isAlerte: chute >= 5,
      config: config // On renvoie la config pour que l'admin puisse la voir
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Petit bug de connexion avec l'IA. Vérifie ta clé GEMINI_API_KEY dans Vercel." });
  }
}
