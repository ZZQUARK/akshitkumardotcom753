import { useEffect, useState, useRef } from "react";
import { ChevronDown, Menu, X, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import heroImg from "@assets/Hero_Image_1775320241204.JPG";
import logoImg from "@assets/Logo_1775389630576.png";

type Article = {
  id: number;
  title: string;
  slug: string;
  summary: string;
  isFree: boolean;
  publishedAt: string | null;
  likesCount: number;
};

function useTinkArticles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/articles?limit=20")
      .then((r) => r.json())
      .then((data) => {
        setArticles(data.articles ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { articles, loading };
}

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function scrollTo(id: string) {
    setMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }

  const links = [
    { label: "About", id: "about" },
    { label: "Writing", id: "writing" },
    { label: "Novel", id: "novel" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/90 backdrop-blur-sm border-b border-border"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-[900px] mx-auto px-6 h-14 flex items-center justify-between">
        <button
          onClick={() => scrollTo("hero")}
          className="flex items-center focus:outline-none"
          aria-label="Back to top"
        >
          <img
            src={logoImg}
            alt="Akshit Kumar"
            style={{
              height: "36px",
              width: "auto",
              filter: scrolled
                ? "none"
                : "brightness(0) invert(1) drop-shadow(0 1px 3px rgba(0,0,0,0.4))",
              transition: "filter 0.3s",
            }}
          />
        </button>

        <nav className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <button
              key={l.id}
              onClick={() => scrollTo(l.id)}
              className={`font-sans text-[0.8rem] uppercase tracking-widest transition-colors hover:opacity-70 ${
                scrolled ? "text-foreground" : "text-white"
              }`}
              style={scrolled ? {} : { textShadow: "0 1px 6px rgba(0,0,0,0.5)" }}
            >
              {l.label}
            </button>
          ))}
        </nav>

        <button
          className="md:hidden"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {menuOpen ? (
            <X size={20} className={scrolled ? "text-foreground" : "text-white"} />
          ) : (
            <Menu
              size={20}
              className={scrolled ? "text-foreground" : "text-white"}
              style={scrolled ? {} : { filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.5))" }}
            />
          )}
        </button>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="md:hidden bg-background border-b border-border px-6 pb-4"
          >
            {links.map((l) => (
              <button
                key={l.id}
                onClick={() => scrollTo(l.id)}
                className="block w-full text-left py-3 font-sans text-[0.8rem] uppercase tracking-widest text-foreground hover:opacity-70 transition-opacity"
              >
                {l.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function useTypingLoop(fullText: string) {
  const [display, setDisplay] = useState("");
  const stateRef = useRef<{
    phase: "typing" | "pausing" | "deleting" | "pauseafter";
    idx: number;
  }>({ phase: "typing", idx: 0 });

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    function tick() {
      const s = stateRef.current;
      if (s.phase === "typing") {
        s.idx += 1;
        setDisplay(fullText.slice(0, s.idx));
        if (s.idx >= fullText.length) {
          s.phase = "pausing";
          timeout = setTimeout(tick, 1600);
        } else {
          timeout = setTimeout(tick, 80);
        }
      } else if (s.phase === "pausing") {
        s.phase = "deleting";
        timeout = setTimeout(tick, 50);
      } else if (s.phase === "deleting") {
        s.idx -= 1;
        setDisplay(fullText.slice(0, s.idx));
        if (s.idx <= 0) {
          s.phase = "pauseafter";
          timeout = setTimeout(tick, 600);
        } else {
          timeout = setTimeout(tick, 45);
        }
      } else if (s.phase === "pauseafter") {
        s.phase = "typing";
        timeout = setTimeout(tick, 50);
      }
    }

    timeout = setTimeout(tick, 400);
    return () => clearTimeout(timeout);
  }, [fullText]);

  return display;
}

export default function Home() {
  const text = useTypingLoop("akshit kumar");
  const { articles, loading: articlesLoading } = useTinkArticles();

  return (
    <div className="min-h-[100dvh] w-full bg-background text-foreground flex flex-col">
      <Navbar />

      {/* HERO SECTION — 82vh so the scroll arrow sits in white below */}
      <section
        id="hero"
        data-testid="hero-section"
        className="relative w-screen overflow-hidden"
        style={{ height: "82vh" }}
      >
        <img
          src={heroImg}
          alt="Akshit Kumar"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center 68%",
          }}
        />

        <div
          className="absolute bottom-10 left-10 text-white font-serif text-[3rem] font-normal flex items-center"
          style={{ textShadow: "0 2px 12px rgba(0,0,0,0.65), 0 1px 3px rgba(0,0,0,0.5)" }}
        >
          {text}
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear", times: [0, 0.5] }}
            className="ml-[2px]"
          >
            |
          </motion.span>
        </div>
      </section>

      {/* SCROLL CHEVRON — sits below the photo in warm white */}
      <div className="flex justify-center py-8">
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="text-muted-foreground cursor-pointer"
          onClick={() => {
            const el = document.getElementById("about");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
        >
          <ChevronDown size={28} strokeWidth={1.5} />
        </motion.div>
      </div>

      {/* ABOUT SECTION */}
      <section
        id="about"
        data-testid="about-section"
        className="max-w-[680px] mx-auto px-6 py-16 w-full"
      >
        <div className="font-serif text-[1.1rem] md:text-[1.2rem] leading-[1.9] tracking-[0.01em] space-y-[1.6em]">
          <p>Hello,</p>

          <p>
            I'm Akshit. I live in Bengaluru. I am, despite whatever my current corporate job
            title says, a writer and an endurance athlete.
          </p>

          <p>
            For the last few years, I've built rigorous digital platforms and software systems to
            pay the bills (currently doing that as a Product Manager at Syngenta). But my actual
            life happens away from the desk. I spend my mornings training for ultra-marathons—like
            the upcoming UTMB in Chamonix—and my nights figuring out how to engineer a
            page-turning thriller novel.
          </p>

          <p>
            I am quietly building a few micro-software tools with one highly specific, unapologetic
            goal: to fund my escape to a snowy mountain town in Canada, where I will work at a local
            bookstore cafe, write books full-time, and run until my legs give out.
          </p>

          <p>
            At present, I publish a dispatch called{" "}
            <a
              href="/thoughtsinknots/"
              className="text-accent hover:opacity-80 transition-opacity"
            >
              Thoughts in Knots
            </a>
            , where I write about the mechanics of fiction, the physical reality of kilometer 35,
            and the absurdity of modern capitalism. The best of that work is listed lower down on
            this page.
          </p>

          <p>
            Before all this, I was a Quantum Physicist. I spent my early years obsessed with
            entropy—the universal law that order inevitably dissolves into chaos. I suppose I still
            am. I just channel it differently now. Aside from physics and tech, I am a vegan
            (purely as a logical framework to reduce supply-chain suffering), and my daily reality
            is largely anchored by a six-year-old Labrador named James.
          </p>

          <p>
            To talk about books, trails, or building things, you can reach me at{" "}
            <a
              href="mailto:hello@akshitkumar.com"
              className="text-accent hover:opacity-80 transition-opacity"
            >
              hello@akshitkumar.com
            </a>
            . To offer unprompted advice on my running pace or my plot holes, please hike to the
            Aghanashini River during a heavy thunderstorm and shout it into the wind. I'll get the
            message.
          </p>

          <p>Thank you for being here,</p>

          <p className="italic text-[1.4rem] mt-4">Akshit</p>
        </div>
      </section>

      {/* DISPATCHES SECTION */}
      <section
        id="writing"
        data-testid="tink-section"
        className="max-w-[680px] mx-auto px-6 py-16 w-full"
      >
        <hr className="border-border mb-8" />
        <p className="text-[0.75rem] uppercase tracking-widest text-muted-foreground mb-3 font-sans">
          Dispatches — Thoughts in Knots
        </p>
        <div className="font-serif text-[1.1rem] md:text-[1.2rem] leading-[1.9] tracking-[0.01em]">
          <p className="mb-8 text-muted-foreground text-[1rem]">
            Every week, I send out a dispatch exploring the invisible mechanics of fiction, the
            physical toll of the trails, and the quiet chaos of modern life. It is an unhurried
            space for ideas that need room to breathe.
          </p>

          {/* Article list */}
          {articlesLoading ? (
            <div className="space-y-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-5 bg-border/50 rounded animate-pulse w-3/4" />
              ))}
            </div>
          ) : articles.length > 0 ? (
            <ul className="space-y-5">
              {articles.map((article) => (
                <li key={article.id} className="flex items-start gap-3 group">
                  <span className="text-accent mt-[0.35em] text-[0.9rem] flex-shrink-0">→</span>
                  <div className="flex-1">
                    <a
                      href={`/thoughtsinknots/articles/${article.slug}`}
                      className="text-accent hover:opacity-70 transition-opacity font-serif text-[1.1rem] leading-snug"
                    >
                      {article.title}
                    </a>
                    {!article.isFree && (
                      <Lock
                        size={11}
                        className="inline ml-2 text-muted-foreground/60 mb-0.5"
                        strokeWidth={1.5}
                      />
                    )}
                    {article.publishedAt && (
                      <p className="text-muted-foreground text-[0.8rem] font-sans tracking-wide mt-0.5">
                        {new Date(article.publishedAt).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="mt-10">
            <a
              href="/thoughtsinknots/"
              data-testid="link-tink"
              className="text-accent lowercase hover:opacity-70 transition-opacity font-serif inline-flex items-center gap-2 group"
            >
              <span className="transition-transform group-hover:translate-x-1">→</span>
              read thoughts in knots
            </a>
          </div>
        </div>
      </section>

      {/* NOVEL SECTION */}
      <section
        id="novel"
        data-testid="novel-section"
        className="max-w-[680px] mx-auto px-6 py-16 w-full"
      >
        <hr className="border-border mb-8" />
        <p className="text-[0.75rem] uppercase tracking-widest text-muted-foreground mb-6 font-sans">
          Untitled Thriller
        </p>
        <div className="font-serif text-[1.1rem] md:text-[1.2rem] leading-[1.9] tracking-[0.01em]">
          <p className="mb-6">
            A high-stakes crime thriller set in the underbelly of India, where old grudges meet a
            rapidly modernizing world. It's a story of tension, consequence, and the kind of
            violence that lingers in the silence.
          </p>
          <p className="italic text-muted-foreground">Draft revision — in progress</p>
        </div>
      </section>

      {/* CONTACT SECTION */}
      <section className="max-w-[680px] mx-auto px-6 py-20 w-full text-center">
        <hr className="border-border mb-16" />
        <p className="font-serif text-[1.1rem] md:text-[1.2rem] leading-[1.9] tracking-[0.01em] mb-10">
          email me at{" "}
          <a
            href="mailto:akshit@zigzagquark.com"
            className="text-accent hover:opacity-80 transition-opacity"
          >
            akshit@zigzagquark.com
          </a>
        </p>
        <div className="flex items-center justify-center gap-6">
          <a
            href="https://www.instagram.com/zigzagquark"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:opacity-80 transition-opacity"
            aria-label="Instagram"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
            </svg>
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="text-center py-10 px-6 pb-16">
        <p className="text-[0.8rem] text-muted-foreground font-sans">© 2026 Akshit Kumar</p>
      </footer>
    </div>
  );
}
