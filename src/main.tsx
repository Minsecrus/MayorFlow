import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../app/globals.css";
import { MayorFlowApp } from "../app/mayorflow/MayorFlowApp";

const root = document.getElementById("root");

if (!root) {
  throw new Error("MayorFlow root element was not found");
}

createRoot(root).render(
  <StrictMode>
    <MayorFlowApp />
  </StrictMode>,
);
