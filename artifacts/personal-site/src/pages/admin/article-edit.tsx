import { useState, useEffect } from "react";
import { useLocation, useParams, Link } from "wouter";
import {
  useGetMe,
  useAdminListArticles,
  useCreateArticle,
  useUpdateArticle,
} from "@workspace/api-client-react";
import type { ArticleSummary } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, ArrowLeft } from "lucide-react";

type ArticleForm = {
  title: string;
  slug: string;
  summary: string;
  thumbnailUrl: string;
  body: string;
  isFree: boolean;
  publishedAt: string;
};

const emptyForm: ArticleForm = {
  title: "",
  slug: "",
  summary: "",
  thumbnailUrl: "",
  body: "",
  isFree: false,
  publishedAt: "",
};

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export default function AdminArticleEdit() {
  const params = useParams<{ id?: string }>();
  const articleId = params.id ? Number(params.id) : null;
  const isNew = articleId === null;
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<ArticleForm>(emptyForm);
  const [error, setError] = useState("");
  const [autoSlug, setAutoSlug] = useState(true);

  const { data: meData, isLoading: meLoading } = useGetMe({
    query: { queryKey: ["adminMe"], retry: false },
  });

  const { data: articlesData, isLoading: articlesLoading } = useAdminListArticles({
    query: {
      queryKey: ["adminArticles"],
      enabled: !isNew,
    },
  });

  useEffect(() => {
    if (!isNew && articlesData) {
      const article = articlesData.articles.find((a: ArticleSummary) => a.id === articleId);
      if (article) {
        setForm({
          title: article.title,
          slug: article.slug,
          summary: article.summary ?? "",
          thumbnailUrl: article.thumbnailUrl ?? "",
          body: "",
          isFree: article.isFree,
          publishedAt: article.publishedAt ? article.publishedAt.slice(0, 16) : "",
        });
        setAutoSlug(false);
      }
    }
  }, [articlesData, articleId, isNew]);

  const createMutation = useCreateArticle();
  const updateMutation = useUpdateArticle();

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setForm((f) => ({
      ...f,
      title,
      slug: autoSlug ? slugify(title) : f.slug,
    }));
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAutoSlug(false);
    setForm((f) => ({ ...f, slug: e.target.value }));
  };

  const handleChange = (field: keyof ArticleForm) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.title || !form.slug || !form.summary || (!isNew && form.body === "" && !articleId)) {
      setError("title, slug, summary and body are required");
      return;
    }

    const data = {
      title: form.title,
      slug: form.slug,
      summary: form.summary,
      thumbnailUrl: form.thumbnailUrl || null,
      body: form.body,
      isFree: form.isFree,
      publishedAt: form.publishedAt ? new Date(form.publishedAt).toISOString() : null,
    };

    if (isNew) {
      if (!form.body) {
        setError("body is required");
        return;
      }
      createMutation.mutate(
        { data },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["adminArticles"] });
            setLocation("/admin");
          },
          onError: (err) => {
            setError(err.data?.error || "Failed to create article");
          },
        }
      );
    } else if (articleId !== null) {
      updateMutation.mutate(
        { id: articleId, data },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["adminArticles"] });
            setLocation("/admin");
          },
          onError: (err) => {
            setError(err.data?.error || "Failed to update article");
          },
        }
      );
    }
  };

  if (meLoading || (!isNew && articlesLoading)) {
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
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-[#888] hover:text-[#1a1a1a] transition-colors">
            <ArrowLeft size={16} strokeWidth={1.5} />
          </Link>
          <span className="text-sm text-[#888]">
            {isNew ? "new article" : "edit article"}
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-8 py-10">
        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <label className="text-xs text-[#888] lowercase tracking-wide">title</label>
            <input
              type="text"
              value={form.title}
              onChange={handleTitleChange}
              placeholder="article title"
              className="w-full py-2 px-0 bg-transparent border-b border-[#ddd] focus:outline-none focus:border-[#1a1a1a] text-2xl font-serif text-[#1a1a1a] placeholder:text-[#ccc] transition-colors"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs text-[#888] lowercase tracking-wide">slug</label>
              <input
                type="text"
                value={form.slug}
                onChange={handleSlugChange}
                placeholder="url-slug"
                className="w-full py-2 px-0 bg-transparent border-b border-[#ddd] focus:outline-none focus:border-[#1a1a1a] text-sm font-mono text-[#555] placeholder:text-[#ccc] transition-colors"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs text-[#888] lowercase tracking-wide">publish date</label>
              <input
                type="datetime-local"
                value={form.publishedAt}
                onChange={handleChange("publishedAt")}
                className="w-full py-2 px-0 bg-transparent border-b border-[#ddd] focus:outline-none focus:border-[#1a1a1a] text-sm text-[#555] transition-colors"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs text-[#888] lowercase tracking-wide">summary / teaser</label>
            <textarea
              value={form.summary}
              onChange={handleChange("summary")}
              placeholder="a brief description shown in article listings..."
              rows={3}
              className="w-full py-2 px-0 bg-transparent border-b border-[#ddd] focus:outline-none focus:border-[#1a1a1a] text-sm text-[#555] placeholder:text-[#ccc] resize-none transition-colors"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs text-[#888] lowercase tracking-wide">thumbnail url</label>
            <input
              type="url"
              value={form.thumbnailUrl}
              onChange={handleChange("thumbnailUrl")}
              placeholder="https://..."
              className="w-full py-2 px-0 bg-transparent border-b border-[#ddd] focus:outline-none focus:border-[#1a1a1a] text-sm text-[#555] placeholder:text-[#ccc] transition-colors"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs text-[#888] lowercase tracking-wide">
              body <span className="text-[#bbb]">(html)</span>
              {!isNew && <span className="ml-2 text-[#bbb]">— leave empty to keep existing</span>}
            </label>
            <textarea
              value={form.body}
              onChange={handleChange("body")}
              placeholder="<p>Write your essay here...</p>"
              rows={20}
              className="w-full py-3 px-3 bg-white border border-[#ddd] focus:outline-none focus:border-[#1a1a1a] text-sm text-[#555] placeholder:text-[#ccc] resize-y font-mono transition-colors"
              required={isNew}
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isFree"
              checked={form.isFree}
              onChange={(e) => setForm((f) => ({ ...f, isFree: e.target.checked }))}
              className="w-4 h-4 accent-[#1a1a1a]"
            />
            <label htmlFor="isFree" className="text-sm text-[#555] lowercase cursor-pointer">
              free for all readers (no subscription required)
            </label>
          </div>

          {error && (
            <p className="text-sm text-red-600 border border-red-200 bg-red-50 px-4 py-2">{error}</p>
          )}

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={isPending}
              className="px-8 py-3 bg-[#1a1a1a] text-white text-sm lowercase tracking-wide flex items-center gap-2 hover:bg-[#333] transition-colors disabled:opacity-50"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {isNew ? "create article" : "save changes"}
            </button>
            <Link href="/admin" className="text-sm text-[#888] hover:text-[#1a1a1a] transition-colors lowercase">
              cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
