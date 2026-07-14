import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles.css";

// No <StrictMode>: the Motion section counts real renders and mounts, and
// StrictMode's deliberate double-invoke would make those numbers lie.
createRoot(document.getElementById("root")!).render(<App />);
