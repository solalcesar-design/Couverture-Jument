import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // Cette variable process.env.GEMINI_API_KEY sera lue sur Vercel
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const { temp, tondu } = req.query;
  const estTondue = tondu === 'true' ? "tondue" : "non tondue";

  const prompt = `Il fait ${temp}°C ce soir. La jument est ${estTondue}. 
                  Dis-moi quelle couverture mettre (0g, 100g, 200g, 300g, 400g). 
                  Réponds de façon très courte (maximum 2 phrases) et amicale pour ma sœur.`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    res.status(200).json({ message: text });
  } catch (error) {
    res.status(500).json({ message: "Désolé, le service météo est indisponible." });
  }
}