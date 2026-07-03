import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import App from "./App";
import AuthGate from "./components/AuthGate";
import Home from "./pages/Home";
import Sante from "./pages/Sante";
import Budget from "./pages/Budget";
import Rappels from "./pages/Rappels";
import Partage from "./pages/Partage";
import Profil from "./pages/Profil";
import PublicShare from "./pages/PublicShare";

const router = createBrowserRouter([
  // Public read-only share link — no login required.
  { path: "/s/:token", element: <PublicShare /> },
  // Main app — gated behind authentication.
  {
    path: "/",
    element: (
      <AuthGate>
        <App />
      </AuthGate>
    ),
    children: [
      { index: true, element: <Home /> },
      { path: "sante", element: <Sante /> },
      { path: "budget", element: <Budget /> },
      { path: "stocks", element: <Rappels /> },
      { path: "partage", element: <Partage /> },
      { path: "profil", element: <Profil /> },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
