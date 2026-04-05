import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { articlesTable, usersTable, subscriptionsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAdmin } from "../middlewares/auth";

const router = Router();

router.post("/login", async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    res.status(400).json({ error: "email and password are required" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);

  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  req.session.userId = user.id;
  req.session.userRole = user.role;

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  });
});

router.use(requireAdmin);

router.get("/subscribers", async (_req, res) => {
  const results = await db
    .select({
      id: usersTable.id,
      email: usersTable.email,
      name: usersTable.name,
      createdAt: usersTable.createdAt,
      plan: subscriptionsTable.plan,
      status: subscriptionsTable.status,
      region: subscriptionsTable.region,
      startsAt: subscriptionsTable.startsAt,
      endsAt: subscriptionsTable.endsAt,
    })
    .from(usersTable)
    .leftJoin(subscriptionsTable, eq(subscriptionsTable.userId, usersTable.id))
    .where(eq(usersTable.role, "subscriber"))
    .orderBy(desc(usersTable.createdAt));

  res.json({
    subscribers: results.map((r) => ({
      id: r.id,
      email: r.email,
      name: r.name,
      plan: r.plan ?? "none",
      status: r.status ?? "none",
      region: r.region ?? "IN",
      createdAt: r.createdAt.toISOString(),
      startsAt: r.startsAt?.toISOString() ?? null,
      endsAt: r.endsAt?.toISOString() ?? null,
    })),
  });
});

router.get("/articles", async (_req, res) => {
  const articles = await db
    .select()
    .from(articlesTable)
    .orderBy(desc(articlesTable.createdAt));

  res.json({
    articles: articles.map((a) => ({
      id: a.id,
      title: a.title,
      slug: a.slug,
      summary: a.summary,
      thumbnailUrl: a.thumbnailUrl,
      isFree: a.isFree,
      publishedAt: a.publishedAt?.toISOString() ?? null,
      likesCount: a.likesCount,
    })),
    total: articles.length,
    page: 1,
    limit: articles.length,
  });
});

router.get("/articles/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [article] = await db
    .select()
    .from(articlesTable)
    .where(eq(articlesTable.id, id))
    .limit(1);

  if (!article) {
    res.status(404).json({ error: "Article not found" });
    return;
  }

  res.json({
    article: {
      id: article.id,
      title: article.title,
      slug: article.slug,
      summary: article.summary,
      thumbnailUrl: article.thumbnailUrl,
      body: article.body,
      isFree: article.isFree,
      isLocked: false,
      publishedAt: article.publishedAt?.toISOString() ?? null,
      likesCount: article.likesCount,
    },
  });
});

router.post("/articles", async (req, res) => {
  const { title, slug, summary, thumbnailUrl, body, isFree, publishedAt } =
    req.body as {
      title: string;
      slug: string;
      summary: string;
      thumbnailUrl?: string;
      body: string;
      isFree: boolean;
      publishedAt?: string;
    };

  if (!title || !slug || !summary || !body) {
    res.status(400).json({ error: "title, slug, summary, body are required" });
    return;
  }

  const [article] = await db
    .insert(articlesTable)
    .values({
      title,
      slug,
      summary,
      thumbnailUrl: thumbnailUrl ?? null,
      body,
      isFree: isFree ?? false,
      publishedAt: publishedAt ? new Date(publishedAt) : null,
    })
    .returning();

  res.status(201).json({
    article: {
      id: article.id,
      title: article.title,
      slug: article.slug,
      summary: article.summary,
      thumbnailUrl: article.thumbnailUrl,
      body: article.body,
      isFree: article.isFree,
      isLocked: false,
      publishedAt: article.publishedAt?.toISOString() ?? null,
      likesCount: article.likesCount,
    },
  });
});

router.put("/articles/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const { title, slug, summary, thumbnailUrl, body, isFree, publishedAt } =
    req.body as {
      title?: string;
      slug?: string;
      summary?: string;
      thumbnailUrl?: string;
      body?: string;
      isFree?: boolean;
      publishedAt?: string;
    };

  const updateData: Partial<typeof articlesTable.$inferInsert> = {};
  if (title !== undefined) updateData.title = title;
  if (slug !== undefined) updateData.slug = slug;
  if (summary !== undefined) updateData.summary = summary;
  if (thumbnailUrl !== undefined) updateData.thumbnailUrl = thumbnailUrl;
  if (body !== undefined) updateData.body = body;
  if (isFree !== undefined) updateData.isFree = isFree;
  if (publishedAt !== undefined)
    updateData.publishedAt = publishedAt ? new Date(publishedAt) : null;
  updateData.updatedAt = new Date();

  const [article] = await db
    .update(articlesTable)
    .set(updateData)
    .where(eq(articlesTable.id, id))
    .returning();

  if (!article) {
    res.status(404).json({ error: "Article not found" });
    return;
  }

  res.json({
    article: {
      id: article.id,
      title: article.title,
      slug: article.slug,
      summary: article.summary,
      thumbnailUrl: article.thumbnailUrl,
      body: article.body,
      isFree: article.isFree,
      isLocked: false,
      publishedAt: article.publishedAt?.toISOString() ?? null,
      likesCount: article.likesCount,
    },
  });
});

router.delete("/articles/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  await db.delete(articlesTable).where(eq(articlesTable.id, id));
  res.json({ success: true });
});

export default router;
