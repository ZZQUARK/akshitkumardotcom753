import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center gap-6">
      <p className="font-serif text-5xl text-muted-foreground/30">404</p>
      <p className="font-sans text-sm tracking-wide lowercase text-muted-foreground">
        this page doesn't exist.
      </p>
      <Link to="/" className="font-sans text-sm tracking-wide lowercase text-foreground border-b border-foreground pb-0.5">
        ← home
      </Link>
    </div>
  );
}
