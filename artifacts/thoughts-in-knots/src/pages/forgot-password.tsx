import { useState } from "react";
import { TopNav } from "@/components/top-nav";
import { useForgotPassword } from "@workspace/api-client-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();
  const forgotPasswordMutation = useForgotPassword();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    forgotPasswordMutation.mutate({
      data: { email }
    }, {
      onSuccess: () => {
        setSubmitted(true);
      },
      onError: (error) => {
        const errData = error.data as { error?: string } | null;
        toast({
          variant: "destructive",
          title: "Request failed",
          description: errData?.error || "Please try again later"
        });
      }
    });
  };

  return (
    <div className="min-h-screen w-full flex flex-col relative">
      <TopNav backHref="/login" backLabel="← login" />
      
      <main className="flex-1 flex flex-col px-6 max-w-md mx-auto w-full mt-32">
        <h1 className="text-4xl font-serif mb-12">reset password</h1>

        {submitted ? (
          <div className="flex flex-col gap-6 items-center text-center">
            <p className="font-sans text-muted-foreground text-sm tracking-wide lowercase">
              if an account exists for that email, a reset link has been sent.
            </p>
            <Link 
              to="/login"
              className="w-full py-3 bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors font-sans text-sm tracking-wide lowercase block mt-4"
            >
              back to login
            </Link>
          </div>
        ) : (
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

            <div className="flex flex-col gap-4 mt-4">
              <button 
                type="submit"
                disabled={forgotPasswordMutation.isPending}
                className="w-full py-3 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-sans text-sm tracking-wide lowercase disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {forgotPasswordMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                send reset link
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
