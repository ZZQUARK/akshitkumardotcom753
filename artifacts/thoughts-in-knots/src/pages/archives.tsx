import { useState } from "react";
import { TopNav } from "@/components/top-nav";
import { useListArticles, useGetMostLovedArticles } from "@workspace/api-client-react";
import type { ArticleSummary } from "@workspace/api-client-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { Lock, Loader2 } from "lucide-react";

const BOOKS_I_READ = [
  { title: "The Rings of Saturn", author: "W.G. Sebald", description: "A walking tour through East Anglia that becomes a tour of human history." },
  { title: "The Year of Magical Thinking", author: "Joan Didion", description: "An exploration of grief and the stories we tell ourselves to live." },
  { title: "Austerlitz", author: "W.G. Sebald", description: "Architecture, memory, and the slow excavation of a childhood lost to the Kindertransport." },
  { title: "Outline", author: "Rachel Cusk", description: "A novel constructed entirely from the conversations others have with the narrator." },
  { title: "The Emigrants", author: "W.G. Sebald", description: "Four narratives of displacement and the lingering ghosts of the past." },
  { title: "Play It As It Lays", author: "Joan Didion", description: "Hollywood, nihilism, and driving the freeways to avoid falling apart." }
];

export default function Archives() {
  const [activeTab, setActiveTab] = useState<"all" | "most loved" | "books i read" | "search">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();

  const { data: allArticlesResponse, isLoading: loadingAll } = useListArticles(
    undefined,
    {
      query: {
        enabled: activeTab === "all",
        queryKey: ["listArticles", "all"],
      }
    }
  );

  const { data: mostLovedResponse, isLoading: loadingMostLoved } = useGetMostLovedArticles({
    query: {
      enabled: activeTab === "most loved",
      queryKey: ["mostLovedArticles"],
    }
  });

  const { data: searchResponse, isLoading: loadingSearch } = useListArticles(
    { q: searchQuery },
    {
      query: {
        enabled: activeTab === "search" && searchQuery.length > 2,
        queryKey: ["listArticles", "search", searchQuery],
      }
    }
  );

  const tabs: ("all" | "most loved" | "books i read" | "search")[] = ["all", "most loved", "books i read", "search"];

  const renderArticleCard = (article: ArticleSummary) => (
    <Link to={`/articles/${article.slug}`} key={article.id}>
      <div className="flex flex-col md:flex-row gap-6 py-8 border-b border-border hover:bg-secondary/20 transition-colors group cursor-pointer">
        {article.thumbnailUrl ? (
          <div className="w-full md:w-48 aspect-video md:aspect-[4/3] bg-muted overflow-hidden flex-shrink-0">
            <img src={article.thumbnailUrl} alt="" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-full md:w-48 aspect-video md:aspect-[4/3] bg-muted flex-shrink-0" />
        )}
        <div className="flex-1 flex flex-col justify-center">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-2xl font-serif leading-tight group-hover:text-muted-foreground transition-colors">{article.title}</h2>
            {!article.isFree && !user && (
              <Lock size={16} className="text-muted-foreground flex-shrink-0 mt-2" strokeWidth={1.5} />
            )}
          </div>
          <p className="font-sans text-muted-foreground text-sm tracking-wide lowercase mt-3 line-clamp-2 leading-relaxed">
            {article.summary}
          </p>
          {article.publishedAt && (
            <p className="font-sans text-xs text-muted-foreground/60 tracking-widest lowercase mt-4">
              {new Date(article.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          )}
        </div>
      </div>
    </Link>
  );

  const renderContent = () => {
    if (activeTab === "all") {
      if (loadingAll) return <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-muted-foreground w-6 h-6" /></div>;
      return (
        <div className="flex flex-col border-t border-border mt-8">
          {allArticlesResponse?.articles.map(renderArticleCard)}
        </div>
      );
    }

    if (activeTab === "most loved") {
      if (loadingMostLoved) return <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-muted-foreground w-6 h-6" /></div>;
      const articles = (mostLovedResponse as { articles?: ArticleSummary[] })?.articles ?? [];
      return (
        <div className="flex flex-col border-t border-border mt-8">
          {articles.map(renderArticleCard)}
        </div>
      );
    }

    if (activeTab === "books i read") {
      return (
        <div className="flex flex-col border-t border-border mt-8">
          {BOOKS_I_READ.map((book, idx) => (
            <div key={idx} className="py-8 border-b border-border">
              <h2 className="text-2xl font-serif">{book.title}</h2>
              <p className="font-sans text-xs text-muted-foreground tracking-widest uppercase mt-2 mb-3">by {book.author}</p>
              <p className="font-sans text-muted-foreground text-sm tracking-wide lowercase leading-relaxed">
                {book.description}
              </p>
            </div>
          ))}
        </div>
      );
    }

    const canSearch = user?.isActive || user?.role === "admin";
    if (!canSearch) {
      return (
        <div className="relative mt-8 py-16 border-y border-border overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-background/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-6">
              <Lock size={24} strokeWidth={1} className="text-muted-foreground" />
              <p className="font-sans text-sm tracking-wide lowercase text-muted-foreground">subscribe to access search</p>
              <Link to="/subscribe" className="py-2 px-6 bg-primary text-primary-foreground font-sans text-sm tracking-wide lowercase">
                subscribe
              </Link>
            </div>
          </div>
          
          <div className="opacity-20 pointer-events-none select-none blur-[2px]">
            <div className="mb-12">
              <input 
                type="text" 
                disabled
                placeholder="search by keyword..." 
                className="w-full text-3xl font-serif bg-transparent border-b border-border pb-4 focus:outline-none"
              />
            </div>
            <div className="flex flex-wrap gap-4 font-sans text-sm tracking-wide lowercase">
              <span className="text-muted-foreground">writing</span>
              <span className="text-muted-foreground">memory</span>
              <span className="text-muted-foreground">grief</span>
              <span className="text-muted-foreground">architecture</span>
              <span className="text-muted-foreground">photography</span>
              <span className="text-muted-foreground">travel</span>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="mt-12">
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="search..." 
          className="w-full text-3xl font-serif bg-transparent border-b border-border pb-4 focus:outline-none placeholder:text-muted-foreground/30"
        />
        
        {searchQuery.length < 3 && (
          <div className="flex flex-wrap gap-4 font-sans text-sm tracking-wide lowercase mt-12">
            {['writing', 'memory', 'grief', 'architecture', 'photography', 'travel'].map(tag => (
              <button 
                key={tag}
                onClick={() => setSearchQuery(tag)}
                className="text-muted-foreground hover:text-foreground transition-colors border-b border-transparent hover:border-foreground pb-0.5"
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {searchQuery.length >= 3 && (
          <div className="flex flex-col border-t border-border mt-12">
            {loadingSearch ? (
              <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-muted-foreground w-6 h-6" /></div>
            ) : searchResponse?.articles.length === 0 ? (
              <p className="py-12 text-center font-sans text-sm tracking-wide lowercase text-muted-foreground">no results found</p>
            ) : (
              searchResponse?.articles.map(renderArticleCard)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full flex flex-col relative pb-32">
      <TopNav backHref="/" backLabel="← home" />
      
      <main className="flex-1 flex flex-col px-6 max-w-3xl mx-auto w-full mt-32">
        <div className="flex overflow-x-auto no-scrollbar gap-8 font-sans text-sm tracking-wide lowercase">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-1 border-b whitespace-nowrap transition-colors ${activeTab === tab ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {renderContent()}
      </main>
    </div>
  );
}
