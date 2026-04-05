import { useAdminListArticles, useListSubscribers } from "@workspace/api-client-react";

export default function DashboardPage() {
  const { data: articlesData, isLoading: articlesLoading } = useAdminListArticles();
  const { data: subscribersData, isLoading: subscribersLoading } = useListSubscribers();

  const articles = articlesData?.articles ?? [];
  const subscribers = subscribersData?.subscribers ?? [];

  const totalArticles = articlesData?.total ?? articles.length;
  const totalSubscribers = subscribers.length;
  const monthlyCount = subscribers.filter((s) => s.plan === "monthly").length;
  const yearlyCount = subscribers.filter((s) => s.plan === "yearly").length;
  const activeCount = subscribers.filter((s) => s.status === "active").length;
  const mostLiked = articles.length > 0
    ? articles.reduce((a, b) => (a.likesCount > b.likesCount ? a : b))
    : null;

  return (
    <div className="p-8">
      <h1 className="text-lg font-semibold text-foreground mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 mb-8 lg:grid-cols-4">
        <StatCard
          label="Total Subscribers"
          value={subscribersLoading ? "—" : totalSubscribers}
        />
        <StatCard
          label="Active"
          value={subscribersLoading ? "—" : activeCount}
        />
        <StatCard
          label="Monthly Plans"
          value={subscribersLoading ? "—" : monthlyCount}
        />
        <StatCard
          label="Yearly Plans"
          value={subscribersLoading ? "—" : yearlyCount}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="border border-border rounded-md bg-card">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-medium text-foreground">Article Stats</h2>
          </div>
          <div className="px-4 py-4 space-y-3">
            <Row label="Total Articles" value={articlesLoading ? "—" : totalArticles} />
            <Row
              label="Free Articles"
              value={articlesLoading ? "—" : articles.filter((a) => a.isFree).length}
            />
            <Row
              label="Subscriber-only"
              value={articlesLoading ? "—" : articles.filter((a) => !a.isFree).length}
            />
          </div>
        </div>

        <div className="border border-border rounded-md bg-card">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-medium text-foreground">Most Liked Article</h2>
          </div>
          <div className="px-4 py-4">
            {articlesLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : mostLiked ? (
              <div>
                <p className="text-sm font-medium text-foreground leading-snug">
                  {mostLiked.title}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {mostLiked.likesCount} like{mostLiked.likesCount !== 1 ? "s" : ""}
                  {" · "}
                  {mostLiked.isFree ? "Free" : "Subscriber-only"}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No articles yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-border rounded-md bg-card px-4 py-4">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-2xl font-semibold text-foreground tabular-nums">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground tabular-nums">{value}</span>
    </div>
  );
}
