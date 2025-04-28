import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import App from "./App.js"
import "./components/login/WalletConnectHandler"

const rootElement = document.getElementById("root")

if (!rootElement) {
  throw new Error("Root element not found")
} else {
  const root = createRoot(rootElement)
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
