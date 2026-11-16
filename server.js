import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = process.env.PORT || 3000;

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

const chefInstructions = `You are Savor's warm, practical AI chef. Give useful, safe, everyday cooking guidance.
When asked for a recipe, use this compact format:
TITLE
One-sentence description

Time: X min | Serves: X | Difficulty: X

INGREDIENTS
- amount ingredient

METHOD
1. step

CHEF'S NOTE
short substitution, storage, or plating tip

Honor dietary restrictions. Do not claim certainty about allergens. Keep recipes realistic and use common measurements.`;

app.post("/api/chef", async (req, res) => {
  const { message, pantry = [], preferences = [] } = req.body ?? {};
  if (typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ error: "Please send a cooking question." });
  }
  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({
      error: "AI is not configured yet. Add OPENAI_API_KEY to a .env file, then restart the app."
    });
  }

  const context = [
    pantry.length ? `Available pantry ingredients: ${pantry.join(", ")}.` : "",
    preferences.length ? `Dietary preferences: ${preferences.join(", ")}.` : ""
  ].filter(Boolean).join("\n");

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        instructions: chefInstructions,
        input: `${context}\n\nCook's request: ${message.trim()}`,
        max_output_tokens: 900
      })
    });
    const data = await response.json();
    if (!response.ok) {
      console.error("OpenAI error:", data);
      return res.status(response.status).json({
        error: data?.error?.message || "The AI chef could not respond right now."
      });
    }
    const reply = data.output_text || data.output?.flatMap(item => item.content || [])
      .filter(part => part.type === "output_text")
      .map(part => part.text).join("\n");
    return res.json({ reply: reply || "I couldn't prepare a response. Please try again." });
  } catch (error) {
    console.error("Chef request failed:", error);
    return res.status(500).json({ error: "Could not reach the AI chef. Check your connection and try again." });
  }
});

app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

app.listen(port, () => console.log(`Savor is cooking at http://localhost:${port}`));
