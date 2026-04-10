// — app.js —
// Hash-based router. Reads window.location.hash and renders the right view.

import { renderProjectList } from "./views/projectList.js";
import { renderCreateProject, bindCreateProjectEvents } from "./views/createProject.js";
import { renderProjectDetail, bindProjectDetailEvents } from "./views/projectDetail.js";

const appEl = document.getElementById("app");

function route() {
  const hash = window.location.hash || "#/";

  // #/projects/new   -> Create Project
  // #/projects/:id   -> Project Detail
  // #/               -> Project List

  if (hash === "#/projects/new") {
    appEl.innerHTML = renderCreateProject();
    bindCreateProjectEvents();
  } else if (hash.startsWith("#/projects/")) {
    const id = hash.replace("#/projects/", "");
    appEl.innerHTML = renderProjectDetail(id);
    bindProjectDetailEvents(id);
  } else {
    appEl.innerHTML = renderProjectList();
  }
}

// Re-route on hash change and on initial load
window.addEventListener("hashchange", route);
route();
