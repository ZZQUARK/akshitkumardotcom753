import { useState } from "react";
import { useLogin } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [, setLocation] = useLocation();
  const loginMutation = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    loginMutation.mutate(
      { data: { email, password } },
      {
        onSuccess: (data) => {
          if (data.user.role !== "admin") {
            setError("Access denied. Admin account required.");
            return;
          }
          setLocation("/admin");
        },
        onError: (err) => {
          setError(err.data?.error || "Login failed. Please check your credentials.");
        },
      }
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf9f7]">
      <div className="w-full max-w-sm px-8 py-12">
        <h1 className="text-3xl font-serif mb-2 text-[#1a1a1a]">admin</h1>
        <p className="text-sm text-[#888] mb-10 lowercase">thoughts in knots</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-1 border-b border-[#ddd]">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email"
              className="w-full py-2 bg-transparent focus:outline-none text-sm text-[#1a1a1a] placeholder:text-[#aaa]"
              required
            />
          </div>

          <div className="flex flex-col gap-1 border-b border-[#ddd]">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password"
              className="w-full py-2 bg-transparent focus:outline-none text-sm text-[#1a1a1a] placeholder:text-[#aaa]"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full py-3 bg-[#1a1a1a] text-white text-sm lowercase tracking-wide flex justify-center items-center gap-2 disabled:opacity-50"
          >
            {loginMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            sign in
          </button>
        </form>
      </div>
    </div>
  );
}
