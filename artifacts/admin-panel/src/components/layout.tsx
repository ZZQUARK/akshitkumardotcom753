import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useLogout, useGetMe } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

export function Layout() {
  const { data } = useGetMe();
  const logout = useLogout();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  function handleLogout() {
    logout.mutate(undefined, {
      onSuccess: () => {
        queryClient.clear();
        navigate("/login");
      },
    });
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-56 bg-sidebar border-r border-sidebar-border flex flex-col shrink-0">
        <div className="px-4 py-4 border-b border-sidebar-border">
          <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-0.5">
            Admin
          </p>
          <p className="text-sm font-medium text-sidebar-foreground truncate">
            {data?.user?.email ?? ""}
          </p>
        </div>
        <nav className="flex-1 px-2 py-3 space-y-0.5">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `block px-3 py-2 text-sm rounded-md transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-foreground font-medium"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              }`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/articles"
            className={({ isActive }) =>
              `block px-3 py-2 text-sm rounded-md transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-foreground font-medium"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              }`
            }
          >
            Articles
          </NavLink>
          <NavLink
            to="/subscribers"
            className={({ isActive }) =>
              `block px-3 py-2 text-sm rounded-md transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-foreground font-medium"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              }`
            }
          >
            Subscribers
          </NavLink>
        </nav>
        <div className="px-2 py-3 border-t border-sidebar-border">
          <button
            onClick={handleLogout}
            disabled={logout.isPending}
            className="w-full text-left px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent rounded-md transition-colors"
          >
            {logout.isPending ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
