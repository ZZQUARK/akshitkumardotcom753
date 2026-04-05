import { useState } from "react";
import { TopNav } from "@/components/top-nav";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { refetch } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const loginMutation = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({
      data: { email, password }
    }, {
      onSuccess: () => {
        refetch();
        navigate("/archives");
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "Login failed",
          description: error.data?.error || "Please check your credentials"
        });
      }
    });
  };

  return (
    <div className="min-h-screen w-full flex flex-col relative">
      <TopNav backHref="/archives" />
      
      <main className="flex-1 flex flex-col px-6 max-w-md mx-auto w-full mt-32">
        <h1 className="text-4xl font-serif mb-12">log in</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          <div className="flex flex-col gap-1 border-b border-border">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email address"
              className="w-full py-2 bg-transparent focus:outline-none font-sans placeholder:text-muted-foreground/50"
              required
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

          <div className="flex flex-col gap-4 mt-4">
            <button 
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full py-3 bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors font-sans text-sm tracking-wide lowercase disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {loginMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              log in
            </button>
            <Link 
              to="/forgot-password"
              className="w-full py-3 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-sans text-sm tracking-wide lowercase text-center block"
            >
              forgot password
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
