// ── createProject.js ──
// Renders the new-project intake form and handles submission.

import { createProject } from "../store.js";

const PROJECT_TYPES = ["Tool", "App", "Workflow", "Experiment", "Other"];

export function renderCreateProject() {
  return `
    <section class="create-project">
      <a href="#/" class="back-link">← Back to Projects</a>

      <h2>New Project</h2>

      <form id="create-form" class="intake-form">
        <div class="form-field">
          <label for="project-name">Project Name <span class="required">*</span></label>
          <input type="text" id="project-name" placeholder="e.g. AI Task Runner" required />
        </div>

        <div class="form-field">
          <label for="project-type">Project Type</label>
          <select id="project-type">
            ${PROJECT_TYPES.map(
              (t) => `<option value="${t}">${t}</option>`
            ).join("")}
          </select>
        </div>

        <div class="form-field">
          <label for="project-objective">Objective</label>
          <input type="text" id="project-objective" placeholder="One-line goal for this project" />
        </div>

        <div class="form-field">
          <label for="project-brief">Brief</label>
          <textarea id="project-brief" rows="4" placeholder="What does this project do and why?"></textarea>
        </div>

        <button type="submit" class="btn-create">Create Project</button>
      </form>
    </section>
  `;
}

function generateId() {
  return "proj-" + Math.random().toString(36).slice(2, 9);
}

export function bindCreateProjectEvents() {
  const form = document.getElementById("create-form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = document.getElementById("project-name").value.trim();
    if (!name) return;

    const project = {
      id: generateId(),
      name,
      type: document.getElementById("project-type").value,
      objective: document.getElementById("project-objective").value.trim(),
      brief: document.getElementById("project-brief").value.trim(),
      createdAt: new Date().toISOString(),
      prd: null,
      logs: [],
    };

    createProject(project);
    window.location.hash = `#/projects/${project.id}`;
  });
}
