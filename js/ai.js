// ── ai.js ──
// Minimal AI integration. Sends PRD to OpenAI and returns a short response.
// Swap this file to change providers later.

const API_KEY_STORAGE = "hub_openai_key";
const API_URL = "https://api.openai.com/v1/chat/completions";

function getApiKey() {
  let key = localStorage.getItem(API_KEY_STORAGE);
  if (!key) {
    key = prompt("Enter your OpenAI API key:")?.trim() || null;
    if (key) localStorage.setItem(API_KEY_STORAGE, key);
  }
  return key;
}

export function clearApiKey() {
  localStorage.removeItem(API_KEY_STORAGE);
}

const INTENT_PROMPTS = {
  summarize:
    "You are a project assistant. Given a PRD, respond with a concise 1–2 sentence summary of what the project is about.",
  generate_tasks:
    "You are a project planner. Given a PRD, respond with a short numbered list of the 3–5 most important next tasks. Keep each task to one sentence.",
  suggest_improvements:
    "You are a product reviewer. Given a PRD, respond with 2–3 brief suggestions for how the PRD or project could be improved.",
};

export const INTENTS = [
  { value: "summarize", label: "Summarize PRD" },
  { value: "generate_tasks", label: "Generate Tasks" },
  { value: "suggest_improvements", label: "Suggest Improvements" },
];

export async function generatePRD({ name, type, objective, brief }) {
  const key = getApiKey();
  if (!key) return null;

  const userContent = [
    `Project Name: ${name}`,
    `Type: ${type || "General"}`,
    `Objective: ${objective || "Not specified"}`,
    `Brief: ${brief || "Not provided"}`,
  ].join("\n");

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a product document writer. Given project intake info, generate a concise PRD in this exact format:

# [Project Name]

## Overview
1–2 sentence summary of what the project is and why it exists.

## Objective
Clear statement of the primary goal.

## Scope
- What's included in v1
- What's explicitly excluded

## Core Features
1. Feature one
2. Feature two
3. Feature three

## Success Criteria
- How we know this project is working

Keep the entire PRD under 300 words. Be specific, not generic.`,
          },
          {
            role: "user",
            content: userContent,
          },
        ],
        max_tokens: 500,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error(`PRD generation failed (${res.status}):`, err);
      return null;
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch (err) {
    console.error("PRD generation request failed:", err);
    return null;
  }
}

export async function runTaskWithAI(prd, intent = "summarize", recentLogs = []) {
  const key = getApiKey();
  if (!key) return "No API key provided.";

  const systemPrompt = INTENT_PROMPTS[intent] || INTENT_PROMPTS.summarize;

  // Build user message: PRD + recent log context
  let userContent = `PRD:\n${prd}`;

  if (recentLogs.length > 0) {
    const logText = recentLogs
      .map((l) => `[${l.timestamp}] ${l.message}`)
      .join("\n");
    userContent += `\n\nRecent task history:\n${logText}`;
  }

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: systemPrompt + " Take into account any recent task history provided — avoid repeating prior suggestions and build on what was already done.",
          },
          {
            role: "user",
            content: userContent,
          },
        ],
        max_tokens: 200,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return `API error (${res.status}): ${err.error?.message || "Unknown error"}`;
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || "No response from model.";
  } catch (err) {
    return `Request failed: ${err.message}`;
  }
}
