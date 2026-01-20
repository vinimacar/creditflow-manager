import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Deploy: 2026-01-20 18:40 - Build v2 - Fix DataTable customActions undefined
createRoot(document.getElementById("root")!).render(<App />);
