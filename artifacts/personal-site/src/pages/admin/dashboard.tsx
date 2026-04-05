import { useState } from "react";
import { useLocation, Link } from "wouter";
import {
  useGetMe,
  useLogout,
  useAdminListArticles,
  useListSubscribers,
  useDeleteArticle,
} from "@workspace/api-client-react";
import type { ArticleSummary, SubscriberItem } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Pencil, Trash2, LogOut } from "lucide-react";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"articles" | "subscribers">("articles");
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: meData, isLoading: meLoading } = useGetMe({
    query: { queryKey: ["adminMe"], retry: false },
  });

  const logoutMutation = useLogout();

  const { data: articlesData, isLoading: articlesLoading } = useAdminListArticles({
    query: { queryKey: ["adminArticles"], enabled: activeTab === "articles" },
  });

  const { data: subscribersData, isLoading: subscribersLoading } = useListSubscribers({
    query: { queryKey: ["adminSubscribers"], enabled: activeTab === "subscribers" },
  });

  const deleteArticleMutation = useDeleteArticle();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => setLocation("/admin/login"),
    });
  };

  const handleDelete = (id: number, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    deleteArticleMutation.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["adminArticles"] });
      },
    });
  };

  if (meLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf9f7]">
        <Loader2 className="w-5 h-5 animate-spin text-[#888]" />
      </div>
    );
  }

  if (!meData?.user || meData.user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf9f7]">
        <div className="text-center">
          <p className="text-sm text-[#888] mb-4">not signed in as admin</p>
          <Link href="/admin/login" className="text-sm text-[#1a1a1a] border-b border-[#1a1a1a] pb-0.5">
            sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      <header className="border-b border-[#e8e8e8] px-8 py-4 flex items-center justify-between">
        <div>
          <span className="text-lg font-serif text-[#1a1a1a]">admin</span>
          <span className="text-[#bbb] mx-2">/</span>
          <span className="text-sm text-[#888] lowercase">thoughts in knots</span>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-xs text-[#aaa]">{meData.user.email}</span>
          <button
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            className="flex items-center gap-1.5 text-xs text-[#888] hover:text-[#1a1a1a] transition-colors"
          >
            <LogOut size={13} strokeWidth={1.5} />
            sign out
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex gap-8 text-sm">
            <button
              onClick={() => setActiveTab("articles")}
              className={`pb-1 border-b transition-colors lowercase ${activeTab === "articles" ? "border-[#1a1a1a] text-[#1a1a1a]" : "border-transparent text-[#888] hover:text-[#1a1a1a]"}`}
            >
              articles
            </button>
            <button
              onClick={() => setActiveTab("subscribers")}
              className={`pb-1 border-b transition-colors lowercase ${activeTab === "subscribers" ? "border-[#1a1a1a] text-[#1a1a1a]" : "border-transparent text-[#888] hover:text-[#1a1a1a]"}`}
            >
              subscribers
            </button>
          </div>

          {activeTab === "articles" && (
            <Link
              href="/admin/articles/new"
              className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] text-white text-xs lowercase tracking-wide hover:bg-[#333] transition-colors"
            >
              <Plus size={13} strokeWidth={1.5} />
              new article
            </Link>
          )}
        </div>

        {activeTab === "articles" && (
          <div>
            {articlesLoading ? (
              <div className="py-16 flex justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-[#888]" />
              </div>
            ) : (
              <div className="border border-[#e8e8e8]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#e8e8e8] bg-[#f5f4f2]">
                      <th className="text-left px-4 py-3 text-xs text-[#888] font-normal lowercase tracking-wide">title</th>
                      <th className="text-left px-4 py-3 text-xs text-[#888] font-normal lowercase tracking-wide">slug</th>
                      <th className="text-left px-4 py-3 text-xs text-[#888] font-normal lowercase tracking-wide">access</th>
                      <th className="text-left px-4 py-3 text-xs text-[#888] font-normal lowercase tracking-wide">published</th>
                      <th className="text-left px-4 py-3 text-xs text-[#888] font-normal lowercase tracking-wide">likes</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {articlesData?.articles.map((article: ArticleSummary, idx: number) => (
                      <tr key={article.id} className={`border-b border-[#e8e8e8] hover:bg-[#f8f7f5] transition-colors ${idx % 2 === 0 ? "" : "bg-[#faf9f7]"}`}>
                        <td className="px-4 py-3 font-serif text-[#1a1a1a] max-w-[280px] truncate">{article.title}</td>
                        <td className="px-4 py-3 text-xs text-[#888] font-mono max-w-[160px] truncate">{article.slug}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 ${article.isFree ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                            {article.isFree ? "free" : "paid"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-[#888]">
                          {article.publishedAt
                            ? new Date(article.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                            : <span className="text-[#bbb]">draft</span>}
                        </td>
                        <td className="px-4 py-3 text-xs text-[#888]">{article.likesCount ?? 0}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3 justify-end">
                            <Link
                              href={`/admin/articles/${article.id}/edit`}
                              className="text-[#888] hover:text-[#1a1a1a] transition-colors"
                            >
                              <Pencil size={13} strokeWidth={1.5} />
                            </Link>
                            <button
                              onClick={() => handleDelete(article.id, article.title)}
                              disabled={deleteArticleMutation.isPending}
                              className="text-[#888] hover:text-red-600 transition-colors"
                            >
                              <Trash2 size={13} strokeWidth={1.5} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!articlesLoading && articlesData?.articles.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-sm text-[#bbb]">
                          no articles yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "subscribers" && (
          <div>
            {subscribersLoading ? (
              <div className="py-16 flex justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-[#888]" />
              </div>
            ) : (
              <div className="border border-[#e8e8e8]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#e8e8e8] bg-[#f5f4f2]">
                      <th className="text-left px-4 py-3 text-xs text-[#888] font-normal lowercase tracking-wide">name</th>
                      <th className="text-left px-4 py-3 text-xs text-[#888] font-normal lowercase tracking-wide">email</th>
                      <th className="text-left px-4 py-3 text-xs text-[#888] font-normal lowercase tracking-wide">plan</th>
                      <th className="text-left px-4 py-3 text-xs text-[#888] font-normal lowercase tracking-wide">region</th>
                      <th className="text-left px-4 py-3 text-xs text-[#888] font-normal lowercase tracking-wide">status</th>
                      <th className="text-left px-4 py-3 text-xs text-[#888] font-normal lowercase tracking-wide">joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscribersData?.subscribers.map((sub: SubscriberItem, idx: number) => (
                      <tr key={sub.id} className={`border-b border-[#e8e8e8] hover:bg-[#f8f7f5] transition-colors ${idx % 2 === 0 ? "" : "bg-[#faf9f7]"}`}>
                        <td className="px-4 py-3 text-[#1a1a1a]">{sub.name}</td>
                        <td className="px-4 py-3 text-xs text-[#555]">{sub.email}</td>
                        <td className="px-4 py-3 text-xs text-[#888]">{sub.plan}</td>
                        <td className="px-4 py-3 text-xs text-[#888]">{sub.region}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 ${sub.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                            {sub.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-[#888]">
                          {new Date(sub.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                      </tr>
                    ))}
                    {!subscribersLoading && subscribersData?.subscribers.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-sm text-[#bbb]">
                          no subscribers yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
