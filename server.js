import express from "express";
import bodyParser from "body-parser";
import { GoogleGenAI } from "@google/genai"; // <--- FIXED: Removed SchemaType
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

// 1. Generate Quiz Endpoint
app.post("/api/generate-quiz", async (req, res) => {
  const { topic } = req.body;
  
  const prompt = `Create a quiz with 3 short technical questions about "${topic}" to test programming knowledge. 
  Return PURE JSON in this format: 
  [{"question": "...", "options": ["a", "b", "c", "d"], "answer": "a"}]`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    // Handle potential markdown code blocks in response
    let cleanText = response.text.replace(/```json|```/g, '').trim();
    res.json(JSON.parse(cleanText));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to generate quiz" });
  }
});

// 2. Analyze Results Endpoint
app.post("/api/analyze", async (req, res) => {
  const { topic, userScore, totalQuestions } = req.body;

  const prompt = `The user took a quiz on "${topic}" and scored ${userScore}/${totalQuestions}.
  Analyze their potential thinking style based on this topic and score.
  
  Return PURE JSON with two parts:
  1. "stats": An object with values (0-100) for these keys: "Logic", "Syntax", "Creativity", "Efficiency".
  2. "feedback": A short advice paragraph on what to learn next.
  
  Format: { "stats": { "Logic": 80, ... }, "feedback": "..." }`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    let cleanText = response.text.replace(/```json|```/g, '').trim();
    res.json(JSON.parse(cleanText));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to analyze results" });
  }
});

// Start Server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});