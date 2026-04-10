export const INTENTS = [
  { value: "summarize", label: "Summarize PRD" },
  { value: "generate_tasks", label: "Generate Tasks" },
  { value: "suggest_improvements", label: "Suggest Improvements" }
];

const INTENT_PROMPTS = {
  summarize: "Summarize this PRD in 1–2 clear sentences.",
  generate_tasks: "List the 3–5 most important next tasks based on this PRD.",
  suggest_improvements: "Suggest 2–3 useful improvements to strengthen this PRD."
};

export async function generatePRD(project) {
  const response = await fetch("/api/generate-prd", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name: project.name,
      type: project.type,
      objective: project.objective,
      brief: project.brief
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to generate PRD.");
  }

  return data.prd;
}

export async function runTaskWithAI(prd, intent = "summarize", recentLogs = []) {
  const intentPrompt = INTENT_PROMPTS[intent] || INTENT_PROMPTS.summarize;

  const logContext = recentLogs.length
    ? `\n\nRecent activity:\n${recentLogs
        .map((log) => `- ${log.message}`)
        .join("\n")}`
    : "";

  return `${intentPrompt}

PRD Context:
${prd}${logContext}`;
}
