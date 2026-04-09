// ── store.js ──
// All localStorage CRUD for projects lives here.
// Swap this file to switch to a real backend later.

const STORAGE_KEY = "hub_projects";

// ── Mock data: seed once if storage is empty ──
const MOCK_PROJECTS = [
  {
    id: "proj-001",
    name: "Hub",
    createdAt: "2026-04-09T10:00:00Z",
    prd: "# Project Hub v1\n\n## Goal\nCreate a simple browser-based project hub to manage AI-driven projects.\n\n## Core Flow\n1. User creates a project\n2. User uploads or attaches a PRD\n3. User sees project dashboard\n4. User can trigger an AI task manually\n5. System logs output",
    logs: [],
  },
  {
    id: "proj-002",
    name: "AI Task Runner",
    createdAt: "2026-04-08T14:30:00Z",
    prd: "# AI Task Runner\n\n## Goal\nBuild a lightweight task execution layer that can run AI prompts on demand.\n\n## Requirements\n- Accept a prompt string\n- Return structured output\n- Log every execution with timestamp",
    logs: [],
  },
  {
    id: "proj-003",
    name: "Memory Layer",
    createdAt: "2026-04-07T09:15:00Z",
    prd: null,
    logs: [],
  },
];

function loadAll() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    // First run — seed with mock data
    saveAll(MOCK_PROJECTS);
    return [...MOCK_PROJECTS];
  }
  return JSON.parse(raw);
}

function saveAll(projects) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function getProjects() {
  return loadAll();
}

export function getProject(id) {
  return loadAll().find((p) => p.id === id) || null;
}

export function createProject(project) {
  const projects = loadAll();
  projects.push(project);
  saveAll(projects);
  return project;
}

export function updateProject(id, updates) {
  const projects = loadAll();
  const idx = projects.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  projects[idx] = { ...projects[idx], ...updates };
  saveAll(projects);
  return projects[idx];
}

export function deleteProject(id) {
  const projects = loadAll().filter((p) => p.id !== id);
  saveAll(projects);
}
