import { BrowserRouter, Routes, Route, NavLink, Navigate } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useConvexAuth } from "convex/react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import Dashboard from "./pages/Dashboard";
import TaskDetail from "./pages/TaskDetail";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";
import SignIn from "./pages/SignIn";

function Nav() {
  const me = useQuery(api.users.getMe);
  const isAdmin = me?.role === "admin";

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
        {isAdmin && (
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
        )}
      </div>
    </nav>
  );
}

function AppRoutes() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const me = useQuery(api.users.getMe);
  const isAdmin = me?.role === "admin";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <p className="text-[var(--muted)]">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/signin" element={<SignIn />} />
        <Route path="*" element={<Navigate to="/signin" replace />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] pb-20">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/task/:taskId" element={<TaskDetail />} />
        <Route path="/settings" element={<Settings />} />
        <Route
          path="/admin"
          element={isAdmin ? <Admin /> : <Navigate to="/" replace />}
        />
        <Route path="/signin" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
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
