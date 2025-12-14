import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Initialize client with the API key
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

async function main() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash", // Updated to a valid model name (check documentation if unsure)
      contents: "Explain how AI works in a few words",
    });
    console.log(response.text()); // Note: .text() is usually a function
  } catch (error) {
    console.error("Error generating content:", error);
  }
}

main();