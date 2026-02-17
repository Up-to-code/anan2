import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import TaskDetail from "./pages/TaskDetail";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";

function Nav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[var(--card)] border-t border-[var(--border)] safe-area-pb z-50">
      <div className="max-w-lg mx-auto flex justify-around py-2">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex flex-col items-center py-2 px-4 rounded-lg min-w-[44px] min-h-[44px] justify-center ${
              isActive ? "text-[var(--accent)] font-medium" : "text-[var(--muted)]"
            }`
          }
        >
          <span className="text-xs">Tasks</span>
        </NavLink>
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex flex-col items-center py-2 px-4 rounded-lg min-w-[44px] min-h-[44px] justify-center ${
              isActive ? "text-[var(--accent)] font-medium" : "text-[var(--muted)]"
            }`
          }
        >
          <span className="text-xs">Settings</span>
        </NavLink>
        <NavLink
          to="/admin"
          className={({ isActive }) =>
            `flex flex-col items-center py-2 px-4 rounded-lg min-w-[44px] min-h-[44px] justify-center ${
              isActive ? "text-[var(--accent)] font-medium" : "text-[var(--muted)]"
            }`
          }
        >
          <span className="text-xs">Admin</span>
        </NavLink>
      </div>
    </nav>
  );
}

function AppRoutes() {
  return (
    <div className="min-h-screen bg-[var(--bg)] pb-20">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/task/:taskId" element={<TaskDetail />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
      <Nav />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ThemeProvider>
  );
}
