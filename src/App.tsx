import { NavLink, Outlet } from "react-router-dom";
import Icon from "./components/Icon";
import FollowUpPrompt from "./components/FollowUpPrompt";

const tabs = [
  { to: "/", label: "Accueil", icon: "home" as const, end: true },
  { to: "/sante", label: "Santé", icon: "health" as const },
  { to: "/budget", label: "Budget", icon: "wallet" as const },
  { to: "/stocks", label: "Stocks", icon: "box" as const },
  { to: "/partage", label: "Partage", icon: "share" as const },
];

export default function App() {
  return (
    <div className="app">
      <FollowUpPrompt />
      <Outlet />
      <nav className="tabbar">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <Icon name={t.icon} size={22} className="ic" />
            {t.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
