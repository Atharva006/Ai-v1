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

// Middleware
app.use(express.static("public"));
app.use(bodyParser.json());

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// --- TOOL 1: QUIZ & ANALYSIS ---

app.post("/api/generate-quiz", async (req, res) => {
  const { topic } = req.body;
  
  const prompt = `Create a technical quiz with 5 questions about "${topic}" to assess a developer's skill level.
  Return PURE JSON in this format: 
  [{"question": "...", "options": ["a", "b", "c", "d"], "answer": "a"}]`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    let cleanText = response.text.replace(/```json|```/g, '').trim();
    res.json(JSON.parse(cleanText));
  } catch (error) {
    console.error("Quiz Error:", error);
    res.status(500).json({ error: "Failed to generate quiz" });
  }
});

app.post("/api/analyze", async (req, res) => {
  const { topic, userScore, totalQuestions } = req.body;

  const prompt = `The user took a quiz on "${topic}" and scored ${userScore}/${totalQuestions}.
  
  Based on this score and topic, generate a Career Guidance profile. 
  Return PURE JSON with these exact fields:
  1. "stats": Object with values (0-100) for "Logic", "Architecture", "Syntax", "Efficiency".
  2. "role": A recommended job title (e.g., "Senior Backend Engineer", "Junior React Dev").
  3. "salary": A realistic salary range in USD (e.g. "$80k - $120k").
  4. "roadmap": An array of 4 strings, representing a 4-week study plan to improve.
  
  Format: { "stats": {...}, "role": "...", "salary": "...", "roadmap": ["Week 1: ...", "Week 2: ..."] }`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    let cleanText = response.text.replace(/```json|```/g, '').trim();
    res.json(JSON.parse(cleanText));
  } catch (error) {
    console.error("Analysis Error:", error);
    res.status(500).json({ error: "Failed to analyze results" });
  }
});

// --- TOOL 2: FUTURE COMPASS ---

app.post("/api/future-skills", async (req, res) => {
  const { role } = req.body;
  
  const prompt = `Act as a futurist career coach. The user wants to apply for the role: "${role}".
  Identify the skills they will need in the next 3-5 years.
  
  Return PURE JSON with this structure:
  {
    "core_skills": ["List 3 fundamental skills"],
    "future_skills": ["List 3 emerging AI/Tech skills for 2028"],
    "trends": ["List 2 major industry shifts"],
    "advice": "One sentence of strategic advice."
  }`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    let cleanText = response.text.replace(/```json|```/g, '').trim();
    res.json(JSON.parse(cleanText));
  } catch (error) {
    console.error("Future Skills Error:", error);
    res.status(500).json({ error: "Prediction failed" });
  }
});

// Start Server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});