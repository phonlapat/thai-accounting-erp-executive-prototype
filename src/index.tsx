import "./index.css";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { AppErrorBoundary } from "./error-boundary";

const rootEl = document.getElementById("root");
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(<AppErrorBoundary><App /></AppErrorBoundary>);
}
