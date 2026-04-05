import { useGetMe } from "@workspace/api-client-react";
import { Navigate } from "react-router-dom";
import { type ReactNode } from "react";

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { data, isLoading, isError } = useGetMe();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (isError || !data?.user || data.user.role !== "admin") {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
