import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  useCreateArticle,
  useUpdateArticle,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import type { ArticleInput, ArticleDetail } from "@workspace/api-client-react";

function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function ArticleEditorPage() {
  const { id } = useParams<{ id?: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const createArticle = useCreateArticle();
  const updateArticle = useUpdateArticle();

  const [loading, setLoading] = useState(isEditing);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [body, setBody] = useState("");
  const [isFree, setIsFree] = useState(false);
  const [publishedAt, setPublishedAt] = useState<string | null>(null);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isEditing || !id) return;

    setLoading(true);
    fetch(`/api/admin/articles/${id}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data: { article?: ArticleDetail }) => {
        if (data.article) {
          const a = data.article;
          setTitle(a.title);
          setSlug(a.slug);
          setSummary(a.summary);
          setThumbnailUrl(a.thumbnailUrl ?? "");
          setBody(a.body ?? "");
          setIsFree(a.isFree);
          setPublishedAt(a.publishedAt ?? null);
          setSlugManuallyEdited(true);
        }
      })
      .catch(() => setError("Failed to load article."))
      .finally(() => setLoading(false));
  }, [id, isEditing]);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugManuallyEdited) {
      setSlug(slugify(value));
    }
  }

  function handleSlugChange(value: string) {
    setSlug(value);
    setSlugManuallyEdited(true);
  }

  function buildPayload(overridePublishedAt?: string | null): ArticleInput {
    return {
      title: title.trim(),
      slug: slug.trim(),
      summary: summary.trim(),
      thumbnailUrl: thumbnailUrl.trim() || null,
      body: body.trim(),
      isFree,
      publishedAt: overridePublishedAt !== undefined ? overridePublishedAt : publishedAt,
    };
  }

  function validate(): boolean {
    if (!title.trim() || !slug.trim() || !summary.trim() || !body.trim()) {
      setError("Title, slug, summary, and body are required.");
      return false;
    }
    return true;
  }

  function submit(payload: ArticleInput) {
    if (isEditing && id) {
      updateArticle.mutate(
        { id: Number(id), data: payload },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/articles"] });
            navigate("/articles");
          },
          onError: () => setError("Failed to save article. Please try again."),
        }
      );
    } else {
      createArticle.mutate(
        { data: payload },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/articles"] });
            navigate("/articles");
          },
          onError: () => setError("Failed to create article. Please try again."),
        }
      );
    }
  }

  function handleSaveDraft(e: React.MouseEvent) {
    e.preventDefault();
    setError("");
    if (!validate()) return;
    submit(buildPayload(null));
  }

  function handlePublish(e: React.MouseEvent) {
    e.preventDefault();
    setError("");
    if (!validate()) return;
    const now = publishedAt ?? new Date().toISOString();
    submit(buildPayload(now));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!validate()) return;
    submit(buildPayload());
  }

  const isPending = createArticle.isPending || updateArticle.isPending;
  const isPublished = Boolean(publishedAt);

  if (isEditing && loading) {
    return (
      <div className="p-8">
        <p className="text-sm text-muted-foreground">Loading article...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6">
        <Link
          to="/articles"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Articles
        </Link>
        <span className="text-muted-foreground mx-2">/</span>
        <span className="text-sm text-foreground">
          {isEditing ? "Edit article" : "New article"}
        </span>
        {isEditing && (
          <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
            isPublished ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"
          }`}>
            {isPublished ? "Published" : "Draft"}
          </span>
        )}
      </div>

      <h1 className="text-lg font-semibold text-foreground mb-6">
        {isEditing ? "Edit article" : "New article"}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="Title" required>
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            required
            className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Article title"
          />
        </Field>

        <Field label="Slug" required hint="URL-friendly identifier, auto-generated from title">
          <input
            type="text"
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            required
            className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background font-mono focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="article-slug"
          />
        </Field>

        <Field label="Summary" required>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            required
            rows={3}
            className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-y"
            placeholder="Short description shown in article lists"
          />
        </Field>

        <Field label="Thumbnail URL" hint="Optional image URL">
          <input
            type="url"
            value={thumbnailUrl}
            onChange={(e) => setThumbnailUrl(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="https://..."
          />
        </Field>

        <Field label="Body" required hint="HTML is supported">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            rows={20}
            className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background font-mono focus:outline-none focus:ring-2 focus:ring-ring resize-y"
            placeholder="Article body (HTML supported)"
          />
        </Field>

        <div className="flex items-center gap-3">
          <input
            id="isFree"
            type="checkbox"
            checked={isFree}
            onChange={(e) => setIsFree(e.target.checked)}
            className="h-4 w-4 rounded border-border text-primary"
          />
          <label htmlFor="isFree" className="text-sm text-foreground">
            Free article (visible without subscription)
          </label>
        </div>

        {publishedAt && (
          <div className="text-xs text-muted-foreground">
            Published:{" "}
            {new Date(publishedAt).toLocaleString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <div className="flex items-center gap-3 pt-2 flex-wrap">
          <button
            type="button"
            onClick={handlePublish}
            disabled={isPending}
            className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {isPending ? "Saving..." : isPublished ? "Save & keep published" : "Publish"}
          </button>
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isPending}
            className="px-4 py-2 text-sm font-medium text-foreground bg-secondary border border-border rounded-md hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {isPublished ? "Unpublish (save as draft)" : "Save draft"}
          </button>
          <Link
            to="/articles"
            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      {hint && <p className="text-xs text-muted-foreground mb-1.5">{hint}</p>}
      {children}
    </div>
  );
}
