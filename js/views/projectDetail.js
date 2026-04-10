// — projectDetail.js —
// Renders a single project's dashboard.

import { getProject, updateProject } from "../store.js";
import { runTaskWithAI, generatePRD, INTENTS } from "../ai.js";

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// — Guidance helpers —

function extractDescription(prd) {
  if (!prd) return null;

  // Grab first 2 non-empty lines
  const lines = prd
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) return null;

  const joined = lines.join(" ");
  const sentences = joined.split(/(?<=[.!?])\s+/);

  return sentences.slice(0, 2).join(" ");
}

function getRecentActivity(logs) {
  if (!logs || logs.length === 0) return [];

  return logs.slice(-3).reverse();
}

function getSuggestedActions(logs) {
  const recent = logs ? logs.slice(-5) : [];
  const usedLabels = new Set();

  for (const entry of recent) {
    const match = entry.message.match(/\[(.*?)\]/);
    if (match) usedLabels.add(match[1]);
  }

  const unused = INTENTS.filter((intent) => !usedLabels.has(intent.label));

  if (!unused.length) {
    return ["All intents used recently. Run any again or update guidance."];
  }

  return unused.map((intent) => `Try "${intent.label}" to get a new perspective.`);
}

function renderGuidance(project) {
  const description = extractDescription(project.prd);
  const activity = getRecentActivity(project.logs || []);
  const suggestions = getSuggestedActions(project.logs || []);

  return `
    <div class="guidance">
      <h3>Project Guidance</h3>

      <div class="guidance-section">
        <h4>About</h4>
        <p class="guidance-text">
          ${description || "No PRD attached — add one to get project guidance."}
        </p>
      </div>

      <div class="guidance-section">
        <h4>Recent Activity</h4>
        ${
          activity.length > 0
            ? `
              <ul class="guidance-activity">
                ${activity
                  .map(
                    (entry) => `
                    <li>
                      <span class="guidance-time">${formatDate(entry.timestamp)} ${formatTime(entry.timestamp)}</span>
                      ${entry.message}
                    </li>
                  `
                  )
                  .join("")}
              </ul>
            `
            : `<p class="guidance-text">No tasks run yet.</p>`
        }
      </div>

      <div class="guidance-section">
        <h4>Suggested Next</h4>
        <ul class="guidance-suggestions">
          ${suggestions.map((suggestion) => `<li>${suggestion}</li>`).join("")}
        </ul>
      </div>
    </div>
  `;
}

export function renderProjectDetail(projectId) {
  const project = getProject(projectId);

  if (!project) {
    return `
      <div class="view-placeholder">
        <h2>Project not found</h2>
        <p>No project with ID <code>${projectId}</code>.</p>
        <a href="#/" class="back-link">← Back to Projects</a>
      </div>
    `;
  }

  return `
    <section class="project-detail">
      <a href="#/" class="back-link">← Back to Projects</a>
      <h2 class="detail-name">${project.name}</h2>

      <dl class="detail-meta">
        <div>
          <dt>ID</dt>
          <dd><code>${project.id}</code></dd>
        </div>
        <div>
          <dt>Created</dt>
          <dd>${formatDate(project.createdAt)}</dd>
        </div>
      </dl>

      ${renderGuidance(project)}

      <div class="detail-prd">
        <h3>PRD</h3>
        ${
          project.prd
            ? `<pre class="prd-content">${project.prd}</pre>`
            : `
              <div class="prd-empty">
                <p>No PRD attached yet.</p>
                <button id="generate-prd-btn" class="btn-generate">✦ Generate PRD</button>
              </div>
            `
        }
      </div>

      <div class="detail-actions">
        <select id="intent-select" class="intent-select">
          ${INTENTS.map(
            (intent) => `<option value="${intent.value}">${intent.label}</option>`
          ).join("")}
        </select>
        <button id="run-task-btn" class="btn-run">▶ Run Task</button>
      </div>

      <div class="detail-logs">
        <h3>Output Log</h3>
        ${
          project.logs && project.logs.length > 0
            ? `
              <ul class="log-list">
                ${[...project.logs]
                  .reverse()
                  .map(
                    (entry) => `
                    <li class="log-entry">
                      <span class="log-time">${formatDate(entry.timestamp)} ${formatTime(entry.timestamp)}</span>
                      <span class="log-msg">${entry.message}</span>
                    </li>
                  `
                  )
                  .join("")}
              </ul>
            `
            : `<p class="log-empty">No task runs yet.</p>`
        }
      </div>
    </section>
  `;
}

export function bindProjectDetailEvents(projectId) {
  // — Generate PRD button —
  const genBtn = document.getElementById("generate-prd-btn");

  if (genBtn) {
    genBtn.addEventListener("click", async () => {
      const project = getProject(projectId);
      if (!project) return;

      genBtn.textContent = "Generating...";
      genBtn.disabled = true;

      try {
        const prd = await generatePRD({
          name: project.name,
          type: project.type,
          objective: project.objective,
          brief: project.brief,
        });

        if (prd) {
          updateProject(projectId, { prd });

          const appEl = document.getElementById("app");
          appEl.innerHTML = renderProjectDetail(projectId);
          bindProjectDetailEvents(projectId);
        } else {
          genBtn.textContent = "Generate PRD";
          genBtn.disabled = false;
          alert("PRD generation returned no content.");
        }
      } catch (error) {
        console.error("Generate PRD failed:", error);
        genBtn.textContent = "Generate PRD";
        genBtn.disabled = false;
        alert(error.message || "PRD generation failed.");
      }
    });
  }

  // — Run Task button —
  const btn = document.getElementById("run-task-btn");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    const project = getProject(projectId);
    if (!project) return;

    let message = "";

    if (project.prd) {
      // Read selected intent
      const intentSelect = document.getElementById("intent-select");
      const intent = intentSelect ? intentSelect.value : "summarize";
      const intentLabel =
        INTENTS.find((item) => item.value === intent)?.label || intent;

      // Show loading state
      btn.textContent = "Running...";
      btn.disabled = true;

      try {
        // Gather last 3 log entries for context
        const recentLogs = (project.logs || []).slice(-3);

        // Call AI with PRD, intent, and recent logs
        const aiResponse = await runTaskWithAI(project.prd, intent, recentLogs);

        message = `[${intentLabel}] ${aiResponse}`;
      } catch (error) {
        console.error("Run Task failed:", error);
        message = "Task failed. Please try again.";
      } finally {
        btn.textContent = "▶ Run Task";
        btn.disabled = false;
      }
    } else {
      message = "Task executed (no PRD attached)";
    }

    const entry = {
      timestamp: new Date().toISOString(),
      projectId: project.id,
      message,
    };

    const logs = project.logs ? [...project.logs, entry] : [entry];
    updateProject(projectId, { logs });

    // Re-render to show new log entry
    const appEl = document.getElementById("app");
    appEl.innerHTML = renderProjectDetail(projectId);
    bindProjectDetailEvents(projectId);
  });
}
