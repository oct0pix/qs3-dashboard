import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import App from "./App.tsx"
import "./index.css"

// Follow the reader's system theme. A dashboard checked on a phone at night
// should not be a flashlight.
if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
  document.documentElement.classList.add("dark")
}
window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", (e) =>
    document.documentElement.classList.toggle("dark", e.matches)
  )

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
