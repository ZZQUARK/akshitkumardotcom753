import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useLogout } from "@workspace/api-client-react";
import { MoreVertical } from "lucide-react";

interface TopNavProps {
  backHref?: string;
  backLabel?: string;
}

export function TopNav({ backHref, backLabel = "← archives" }: TopNavProps) {
  const { user, refetch } = useAuth();
  const logoutMutation = useLogout();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        refetch();
        navigate("/");
      }
    });
  };

  return (
    <header className="w-full flex items-center justify-between p-6 max-w-4xl mx-auto absolute top-0 left-0 right-0">
      <div>
        {backHref ? (
          <Link to={backHref} className="text-muted-foreground hover:text-foreground transition-colors font-sans text-sm tracking-wide lowercase">
            {backLabel}
          </Link>
        ) : <div />}
      </div>
      
      <div className="flex items-center gap-6">
        {user ? (
          <button 
            onClick={handleLogout}
            className="text-muted-foreground hover:text-foreground transition-colors font-sans text-sm tracking-wide lowercase"
          >
            log out
          </button>
        ) : (
          <Link to="/login" className="text-muted-foreground hover:text-foreground transition-colors font-sans text-sm tracking-wide lowercase">
            log in
          </Link>
        )}
        <button className="text-muted-foreground hover:text-foreground">
          <MoreVertical size={20} strokeWidth={1.5} />
        </button>
      </div>
    </header>
  );
}
