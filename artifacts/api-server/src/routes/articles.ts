import { Router } from "express";
import { db } from "@workspace/db";
import { articlesTable } from "@workspace/db";
import { eq, desc, sql, ilike, and, isNotNull } from "drizzle-orm";
import { getIsActiveSubscriber, requireAuth } from "../middlewares/auth";

const router = Router();

async function isSubscriberOrAdmin(req: {
  session: { userId?: number; userRole?: string };
}): Promise<boolean> {
  if (!req.session.userId) return false;
  if (req.session.userRole === "admin") return true;
  return getIsActiveSubscriber(req.session.userId);
}

router.get("/most-loved", async (req, res) => {
  const articles = await db
    .select()
    .from(articlesTable)
    .where(isNotNull(articlesTable.publishedAt))
    .orderBy(desc(articlesTable.likesCount))
    .limit(10);

  const result = articles.map((a) => ({
    id: a.id,
    title: a.title,
    slug: a.slug,
    summary: a.summary,
    thumbnailUrl: a.thumbnailUrl,
    isFree: a.isFree,
    publishedAt: a.publishedAt?.toISOString() ?? null,
    likesCount: a.likesCount,
  }));

  res.json({
    articles: result,
    total: result.length,
    page: 1,
    limit: 10,
  });
});

router.get("/", async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
  const offset = (page - 1) * limit;
  const filter = req.query.filter as string | undefined;
  const q = req.query.q as string | undefined;

  const conditions = [isNotNull(articlesTable.publishedAt)];
  if (q) {
    conditions.push(ilike(articlesTable.title, `%${q}%`));
  }

  const where = and(...conditions);

  const orderBy =
    filter === "most-loved"
      ? desc(articlesTable.likesCount)
      : desc(articlesTable.publishedAt);

  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(articlesTable)
    .where(where);

  const articles = await db
    .select()
    .from(articlesTable)
    .where(where)
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);

  const result = articles.map((a) => ({
    id: a.id,
    title: a.title,
    slug: a.slug,
    summary: a.summary,
    thumbnailUrl: a.thumbnailUrl,
    isFree: a.isFree,
    publishedAt: a.publishedAt?.toISOString() ?? null,
    likesCount: a.likesCount,
  }));

  res.json({
    articles: result,
    total: countRow?.count ?? 0,
    page,
    limit,
  });
});

router.get("/:slug", async (req, res) => {
  const slug = String(req.params.slug);
  const [article] = await db
    .select()
    .from(articlesTable)
    .where(and(eq(articlesTable.slug, slug), isNotNull(articlesTable.publishedAt)))
    .limit(1);

  if (!article) {
    res.status(404).json({ error: "Article not found" });
    return;
  }

  const canRead = await isSubscriberOrAdmin(req);
  const isLocked = !article.isFree && !canRead;
  const body = isLocked
    ? article.body.split(/\s+/).slice(0, 80).join(" ") + "…"
    : article.body;

  res.json({
    article: {
      id: article.id,
      title: article.title,
      slug: article.slug,
      summary: article.summary,
      thumbnailUrl: article.thumbnailUrl,
      body,
      isFree: article.isFree,
      isLocked,
      publishedAt: article.publishedAt?.toISOString() ?? null,
      likesCount: article.likesCount,
    },
  });
});

router.post("/:slug/like", requireAuth, async (req, res) => {
  const slug = String(req.params.slug);
  const [article] = await db
    .select()
    .from(articlesTable)
    .where(eq(articlesTable.slug, slug))
    .limit(1);

  if (!article) {
    res.status(404).json({ error: "Article not found" });
    return;
  }

  await db
    .update(articlesTable)
    .set({ likesCount: sql`${articlesTable.likesCount} + 1` })
    .where(eq(articlesTable.id, article.id));

  res.json({ likesCount: article.likesCount + 1 });
});

export default router;
