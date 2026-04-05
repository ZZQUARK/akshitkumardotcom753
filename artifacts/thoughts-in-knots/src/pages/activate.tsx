import { useState, useEffect } from "react";
import { TopNav } from "@/components/top-nav";
import { useVerifyToken, useCreateAccount } from "@workspace/api-client-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

export default function Activate() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const navigate = useNavigate();
  const { refetch } = useAuth();
  const { toast } = useToast();
  
  const verifyTokenMutation = useVerifyToken();
  const createAccountMutation = useCreateAccount();

  const searchParams = new URLSearchParams(window.location.search);
  const token = searchParams.get("token");

  useEffect(() => {
    if (token) {
      verifyTokenMutation.mutate({
        data: { token }
      }, {
        onSuccess: (data) => {
          setVerifiedEmail(data.email);
        },
        onError: (error) => {
          toast({
            variant: "destructive",
            title: "Invalid token",
            description: error.data?.error || "Please request a new activation link."
          });
        }
      });
    }
  }, [token]);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="font-sans lowercase text-muted-foreground text-sm tracking-wide">invalid or missing activation token.</p>
      </div>
    );
  }

  if (verifyTokenMutation.isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (verifyTokenMutation.isError || !verifiedEmail) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="font-sans lowercase text-muted-foreground text-sm tracking-wide">this activation link has expired or is invalid.</p>
        <button 
          onClick={() => navigate("/subscribe")}
          className="py-2 px-6 bg-secondary text-secondary-foreground transition-colors font-sans text-sm tracking-wide lowercase"
        >
          subscribe again
        </button>
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

    createAccountMutation.mutate({
      data: { token, password }
    }, {
      onSuccess: () => {
        refetch();
        navigate("/archives");
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "Account creation failed",
          description: error.data?.error || "Please try again."
        });
      }
    });
  };

  return (
    <div className="min-h-screen w-full flex flex-col relative">
      <TopNav />
      
      <main className="flex-1 flex flex-col px-6 max-w-md mx-auto w-full mt-32">
        <h1 className="text-4xl font-serif mb-12">create account</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          <div className="flex flex-col gap-1 border-b border-border">
            <input
              type="email"
              value={verifiedEmail}
              disabled
              className="w-full py-2 bg-transparent focus:outline-none font-sans text-muted-foreground/70 cursor-not-allowed"
            />
          </div>

          <div className="flex flex-col gap-1 border-b border-border relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password"
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
              placeholder="confirm password"
              className="w-full py-2 bg-transparent focus:outline-none font-sans placeholder:text-muted-foreground/50 pr-16"
              required
            />
          </div>

          <div className="flex flex-col gap-4 mt-4">
            <button 
              type="submit"
              disabled={createAccountMutation.isPending}
              className="w-full py-3 bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors font-sans text-sm tracking-wide lowercase disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {createAccountMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              create account
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
