import express from "express";
import bodyParser from "body-parser";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const port = 3000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(express.static("public"));
app.use(bodyParser.json());

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// --- Existing Quiz Endpoints ---
app.post("/api/generate-quiz", async (req, res) => {
  const { topic } = req.body;
  const prompt = `Create a technical quiz with 5 questions about "${topic}". Return PURE JSON: [{"question": "...", "options": ["a", "b", "c", "d"], "answer": "a"}]`;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    res.json(JSON.parse(response.text.replace(/```json|```/g, '').trim()));
  } catch (error) { res.status(500).json({ error: "Quiz failed" }); }
});

app.post("/api/analyze", async (req, res) => {
  const { topic, userScore, totalQuestions } = req.body;
  const prompt = `User scored ${userScore}/${totalQuestions} in "${topic}". Return PURE JSON: { "stats": {"Logic": 80, "Syntax": 50}, "role": "Job Title", "salary": "$X-Y", "roadmap": ["Step 1", "Step 2"] }`;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    res.json(JSON.parse(response.text.replace(/```json|```/g, '').trim()));
  } catch (error) { res.status(500).json({ error: "Analysis failed" }); }
});

// --- NEW TOOL: Future Skills Predictor ---
app.post("/api/future-skills", async (req, res) => {
  const { role } = req.body;
  
  const prompt = `Act as a futurist career coach. The user wants to be a "${role}".
  Identify the skills they will need in the next 3-5 years.
  Return PURE JSON with this structure:
  {
    "core_skills": ["List 3 fundamental skills"],
    "future_skills": ["List 3 emerging AI/Tech skills"],
    "trends": ["List 2 industry shifts"],
    "advice": "One sentence of strategic advice."
  }`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    res.json(JSON.parse(response.text.replace(/```json|```/g, '').trim()));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Prediction failed" });
  }
});

app.listen(port, () => console.log(`Server running at http://localhost:${port}`));