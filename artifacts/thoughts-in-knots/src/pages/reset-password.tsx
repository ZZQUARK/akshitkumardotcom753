import { useState } from "react";
import { TopNav } from "@/components/top-nav";
import { useResetPassword } from "@workspace/api-client-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const resetPasswordMutation = useResetPassword();

  const searchParams = new URLSearchParams(window.location.search);
  const token = searchParams.get("token");

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="font-sans lowercase text-muted-foreground text-sm tracking-wide">invalid or missing reset token.</p>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords do not match",
        description: "Please ensure both passwords are exactly the same."
      });
      return;
    }

    resetPasswordMutation.mutate({
      data: { token, password }
    }, {
      onSuccess: () => {
        toast({
          title: "Password reset successful",
          description: "You can now log in with your new password."
        });
        navigate("/login");
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "Reset failed",
          description: error.data?.error || "Please try again later"
        });
      }
    });
  };

  return (
    <div className="min-h-screen w-full flex flex-col relative">
      <TopNav />
      
      <main className="flex-1 flex flex-col px-6 max-w-md mx-auto w-full mt-32">
        <h1 className="text-4xl font-serif mb-12">create new password</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          <div className="flex flex-col gap-1 border-b border-border relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="new password"
              className="w-full py-2 bg-transparent focus:outline-none font-sans placeholder:text-muted-foreground/50 pr-16"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-0 top-2 text-xs font-sans text-muted-foreground hover:text-foreground lowercase tracking-wide"
            >
              {showPassword ? "hide" : "show"}
            </button>
          </div>

          <div className="flex flex-col gap-1 border-b border-border relative">
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="confirm new password"
              className="w-full py-2 bg-transparent focus:outline-none font-sans placeholder:text-muted-foreground/50 pr-16"
              required
            />
          </div>

          <div className="flex flex-col gap-4 mt-4">
            <button 
              type="submit"
              disabled={resetPasswordMutation.isPending}
              className="w-full py-3 bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors font-sans text-sm tracking-wide lowercase disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {resetPasswordMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              update password
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
