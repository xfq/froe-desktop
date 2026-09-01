import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./app.css";

const root = document.getElementById("root");
if (root === null) throw new Error("Froe could not find its root element.");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
