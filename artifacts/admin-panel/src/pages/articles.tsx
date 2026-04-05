import { useState } from "react";
import { Link } from "react-router-dom";
import { useAdminListArticles, useDeleteArticle, useUpdateArticle } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import type { ArticleSummary } from "@workspace/api-client-react";

type Filter = "all" | "published" | "draft" | "free" | "subscriber";

function getArticleStatus(article: ArticleSummary): "published" | "draft" {
  return article.publishedAt ? "published" : "draft";
}

export default function ArticlesPage() {
  const { data, isLoading, isError } = useAdminListArticles();
  const deleteArticle = useDeleteArticle();
  const updateArticle = useUpdateArticle();
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "most-liked">("newest");

  const allArticles = data?.articles ?? [];

  const filtered = allArticles.filter((a) => {
    if (filter === "published") return Boolean(a.publishedAt);
    if (filter === "draft") return !a.publishedAt;
    if (filter === "free") return a.isFree;
    if (filter === "subscriber") return !a.isFree;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "newest") {
      const ta = a.publishedAt ?? "";
      const tb = b.publishedAt ?? "";
      return tb.localeCompare(ta);
    }
    if (sortBy === "oldest") {
      const ta = a.publishedAt ?? "";
      const tb = b.publishedAt ?? "";
      return ta.localeCompare(tb);
    }
    if (sortBy === "most-liked") return b.likesCount - a.likesCount;
    return 0;
  });

  function handleDelete(id: number) {
    setDeletingId(id);
    deleteArticle.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/admin/articles"] });
          setDeletingId(null);
          setConfirmId(null);
        },
        onError: () => setDeletingId(null),
      }
    );
  }

  function handleToggleFree(article: ArticleSummary) {
    setTogglingId(article.id);
    fetch(`/api/admin/articles/${article.id}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d: { article?: { body?: string } }) => {
        const body = d.article?.body ?? "";
        updateArticle.mutate(
          {
            id: article.id,
            data: {
              title: article.title,
              slug: article.slug,
              summary: article.summary,
              thumbnailUrl: article.thumbnailUrl ?? null,
              body,
              isFree: !article.isFree,
              publishedAt: article.publishedAt ?? null,
            },
          },
          {
            onSuccess: () => {
              queryClient.invalidateQueries({ queryKey: ["/api/admin/articles"] });
              setTogglingId(null);
            },
            onError: () => setTogglingId(null),
          }
        );
      })
      .catch(() => setTogglingId(null));
  }

  const counts = {
    all: allArticles.length,
    published: allArticles.filter((a) => Boolean(a.publishedAt)).length,
    draft: allArticles.filter((a) => !a.publishedAt).length,
    free: allArticles.filter((a) => a.isFree).length,
    subscriber: allArticles.filter((a) => !a.isFree).length,
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold text-foreground">Articles</h1>
        <Link
          to="/articles/new"
          className="px-3 py-1.5 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:opacity-90 transition-opacity"
        >
          New article
        </Link>
      </div>

      {!isLoading && !isError && (
        <div className="flex items-center gap-4 mb-4 flex-wrap">
          <div className="flex gap-1 flex-wrap">
            {(["all", "published", "draft", "free", "subscriber"] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  filter === f
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {f === "all"
                  ? "All"
                  : f === "published"
                  ? "Published"
                  : f === "draft"
                  ? "Draft"
                  : f === "free"
                  ? "Free"
                  : "Subscriber-only"}
                {" "}
                <span className="opacity-70">({counts[f]})</span>
              </button>
            ))}
          </div>
          <div className="ml-auto">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="text-xs border border-border rounded px-2 py-1 bg-background text-foreground"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="most-liked">Most liked</option>
            </select>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : isError ? (
        <p className="text-sm text-destructive">Failed to load articles.</p>
      ) : sorted.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-md">
          <p className="text-sm text-muted-foreground">
            {filter === "all" ? "No articles yet." : `No ${filter} articles.`}
          </p>
          {filter === "all" && (
            <Link
              to="/articles/new"
              className="mt-3 inline-block text-sm text-primary hover:underline"
            >
              Create your first article
            </Link>
          )}
        </div>
      ) : (
        <div className="border border-border rounded-md overflow-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Title</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Access</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Likes</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Published</th>
                <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {sorted.map((article) => {
                const status = getArticleStatus(article);
                return (
                  <tr key={article.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 max-w-xs">
                      <span className="font-medium text-foreground truncate block">
                        {article.title}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">{article.slug}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          status === "published"
                            ? "bg-green-50 text-green-700"
                            : "bg-yellow-50 text-yellow-700"
                        }`}
                      >
                        {status === "published" ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleFree(article)}
                        disabled={togglingId === article.id}
                        title="Click to toggle free/subscriber access"
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-50 cursor-pointer ${
                          article.isFree
                            ? "bg-sky-50 text-sky-700"
                            : "bg-violet-50 text-violet-700"
                        }`}
                      >
                        {togglingId === article.id ? "..." : article.isFree ? "Free" : "Subscriber"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground tabular-nums text-xs">
                      {article.likesCount}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {article.publishedAt
                        ? new Date(article.publishedAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {confirmId === article.id ? (
                        <span className="text-xs text-muted-foreground">
                          Sure?{" "}
                          <button
                            onClick={() => handleDelete(article.id)}
                            disabled={deletingId === article.id}
                            className="text-destructive hover:underline font-medium"
                          >
                            {deletingId === article.id ? "Deleting..." : "Yes"}
                          </button>
                          {" · "}
                          <button
                            onClick={() => setConfirmId(null)}
                            className="text-muted-foreground hover:underline"
                          >
                            Cancel
                          </button>
                        </span>
                      ) : (
                        <>
                          <Link
                            to={`/articles/${article.id}/edit`}
                            className="text-primary hover:underline mr-3"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => setConfirmId(article.id)}
                            className="text-destructive hover:underline"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
