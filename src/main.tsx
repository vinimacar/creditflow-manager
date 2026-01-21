import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Deploy: 2026-01-20 22:00 - Debug GitHub Pages blank screen
console.log("🚀 CreditFlow Manager iniciando...");
console.log("📍 Base URL:", import.meta.env.BASE_URL);
console.log("🌍 Mode:", import.meta.env.MODE);

// Aplicar tema salvo antes de renderizar
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
  document.documentElement.classList.add("dark");
} else {
  document.documentElement.classList.remove("dark");
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error("❌ Root element não encontrado!");
  document.body.innerHTML = '<div style="padding:20px;"><h1>Erro: Root não encontrado</h1></div>';
} else {
  console.log("✅ Root encontrado, renderizando...");
  try {
    createRoot(rootElement).render(<App />);
    console.log("✅ App renderizado com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao renderizar App:", error);
    document.body.innerHTML = `<div style="padding:20px;"><h1>Erro ao carregar aplicação</h1><pre>${error}</pre></div>`;
  }
}
