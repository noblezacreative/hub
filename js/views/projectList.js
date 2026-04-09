// ── projectList.js ──
// Renders the list of all projects from the store.

import { getProjects } from "../store.js";

export function renderProjectList() {
  const projects = getProjects();

  const items = projects
    .map(
      (p) => `
      <li class="project-item">
        <a href="#/projects/${p.id}">
          <span class="project-name">${p.name}</span>
          <span class="project-id">${p.id}</span>
        </a>
      </li>`
    )
    .join("");

  return `
    <section class="project-list">
      <div class="list-header">
        <h2>Projects</h2>
        <a href="#/projects/new" class="btn-new">+ New Project</a>
      </div>
      ${
        projects.length > 0
          ? `<ul>${items}</ul>`
          : `<p class="list-empty">No projects yet. Create one to get started.</p>`
      }
    </section>
  `;
}
