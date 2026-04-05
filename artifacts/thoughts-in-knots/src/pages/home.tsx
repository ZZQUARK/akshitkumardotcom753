import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { TopNav } from "@/components/top-nav";

export default function Home() {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      navigate(`/subscribe?email=${encodeURIComponent(email)}`);
    } else {
      navigate("/subscribe");
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col relative">
      <TopNav />
      <div className="absolute top-6 left-6">
        <a
          href="/"
          className="text-muted-foreground hover:text-foreground transition-colors font-sans text-sm tracking-wide lowercase"
        >
          ← akshitkumar.com
        </a>
      </div>
      
      <main className="flex-1 flex flex-col items-center justify-center px-6 max-w-2xl mx-auto w-full mt-24">
        <h1 className="text-5xl md:text-7xl font-serif text-center tracking-tight mb-4">
          thoughts in knots
        </h1>
        <p className="text-muted-foreground text-center font-sans tracking-wide lowercase mb-12">
          a weekly dispatch by akshit kumar
        </p>

        <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email address"
            className="w-full border-b border-border py-2 px-0 bg-transparent text-center focus:outline-none focus:border-foreground transition-colors font-sans placeholder:text-muted-foreground/50 lowercase"
          />
          <button 
            type="submit"
            className="w-full py-3 bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors font-sans text-sm tracking-wide lowercase"
          >
            subscribe
          </button>
        </form>

        <div className="mt-16">
          <Link to="/archives" className="text-muted-foreground hover:text-foreground transition-colors font-sans text-sm tracking-wide lowercase border-b border-transparent hover:border-foreground pb-0.5">
            enter without subscribing
          </Link>
        </div>
      </main>
    </div>
  );
}
