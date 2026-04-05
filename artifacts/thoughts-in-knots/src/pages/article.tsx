import { TopNav } from "@/components/top-nav";
import { useGetArticle, useLikeArticle } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useParams, Link } from "react-router-dom";
import { Heart, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function ArticleDetail() {
  const params = useParams();
  const slug = params.slug || "";
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const likeMutation = useLikeArticle();

  const { data: response, isLoading } = useGetArticle(slug, {
    query: {
      enabled: !!slug,
      queryKey: ["getArticle", slug]
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!response?.article) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="font-sans lowercase text-muted-foreground text-sm tracking-wide">article not found.</p>
        <Link to="/archives" className="text-foreground hover:underline font-sans lowercase text-sm">
          back to archives
        </Link>
      </div>
    );
  }

  const article = response.article;
  const isLockedForUser = article.isLocked;

  const canInteract = user?.isActive || user?.role === "admin";

  const handleLike = () => {
    if (!canInteract) return;
    likeMutation.mutate({ slug: article.slug }, {
      onSuccess: (data) => {
        queryClient.setQueryData(["getArticle", slug], (old: { article?: { likesCount?: number } } | undefined) => {
          if (!old?.article) return old;
          return {
            ...old,
            article: { ...old.article, likesCount: data.likesCount }
          };
        });
      }
    });
  };

  const contentToRender = article.body || article.summary;

  return (
    <div className="min-h-screen w-full flex flex-col relative pb-32">
      <TopNav backHref="/archives" />
      
      <main className="flex-1 flex flex-col px-6 max-w-2xl mx-auto w-full mt-32">
        <header className="mb-16">
          <h1 className="text-4xl md:text-5xl font-serif leading-tight mb-6">{article.title}</h1>
          <div className="flex items-center justify-between font-sans text-xs tracking-widest lowercase text-muted-foreground">
            {article.publishedAt && (
              <span>
                {new Date(article.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            )}
            {canInteract && (
              <button 
                onClick={handleLike}
                disabled={likeMutation.isPending}
                className="flex items-center gap-2 hover:text-foreground transition-colors group"
              >
                <span>{article.likesCount || 0}</span>
                <Heart size={14} className="group-hover:fill-foreground group-hover:text-foreground transition-all" strokeWidth={1.5} />
              </button>
            )}
          </div>
        </header>

        {article.thumbnailUrl && (
          <div className="w-full aspect-[16/9] bg-muted mb-16 overflow-hidden">
            <img src={article.thumbnailUrl} alt="" className="w-full h-full object-cover" />
          </div>
        )}

        <div className="prose prose-lg font-serif text-foreground/90 max-w-none leading-relaxed prose-p:mb-8 prose-headings:font-normal prose-a:text-foreground prose-a:font-sans prose-a:text-sm prose-a:underline prose-a:underline-offset-4 prose-blockquote:border-l-foreground/20 prose-blockquote:text-muted-foreground prose-blockquote:pl-6 relative">
          
          {isLockedForUser ? (
            <div>
              <div dangerouslySetInnerHTML={{ __html: contentToRender.substring(0, 800) }} />

              <div className="relative -mt-24 pb-8">
                <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-transparent to-background pointer-events-none" />
                
                <div className="relative z-10 mt-32 py-12 flex flex-col items-center gap-6 text-center">
                  <p className="font-sans text-sm tracking-wide lowercase text-foreground">
                    this essay continues for subscribers.
                  </p>
                  <Link
                    to="/subscribe"
                    className="py-3 px-8 bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors font-sans text-sm tracking-wide lowercase inline-block"
                  >
                    subscribe to read
                  </Link>
                  <div className="flex items-center gap-2 font-sans text-xs tracking-wide lowercase text-muted-foreground">
                    <span>already subscribed?</span>
                    <Link to="/login" className="text-foreground border-b border-foreground pb-0.5">
                      log in
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div dangerouslySetInnerHTML={{ __html: contentToRender }} />
          )}

        </div>
        
        {!isLockedForUser && (
          <div className="mt-24 pt-8 border-t border-border flex justify-center">
            <p className="font-sans text-sm tracking-wide lowercase text-muted-foreground/50">
              ***
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
