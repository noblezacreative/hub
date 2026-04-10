const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.post("/api/generate-prd", async (req, res) => {
  try {
    const { name, type, objective, brief } = req.body || {};

    if (!name || !objective || !brief) {
      return res.status(400).json({
        error: "Missing required fields: name, objective, or brief."
      });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "OPENAI_API_KEY is not set on the server."
      });
    }

    const prompt = `
You are a senior product strategist and creative systems thinker.

Create a concise but high-quality PRD for this project.

Project Name: ${name}
Project Type: ${type || "Other"}
Objective: ${objective}
Brief: ${brief}

Return the PRD in this structure:

# ${name}

## Overview
A concise summary of the project.

## Objective
A refined version of the project's goal.

## Users
Who this project is for.

## Core Flow
The main user journey.

## Features
A short bullet list of core features.

## Constraints
A short bullet list of guardrails and limitations.

## Success Criteria
What success looks like.
`.trim();

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You write clear, structured, thoughtful PRDs for digital products."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || "OpenAI request failed."
      });
    }

    const prd = data.choices?.[0]?.message?.content?.trim();

    if (!prd) {
      return res.status(500).json({
        error: "No PRD content returned."
      });
    }

    res.json({ prd });
  } catch (error) {
    console.error("PRD generation error:", error);
    res.status(500).json({
      error: "Server error while generating PRD."
    });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
