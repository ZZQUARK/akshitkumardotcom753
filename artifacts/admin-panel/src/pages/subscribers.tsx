import { useState } from "react";
import { useListSubscribers } from "@workspace/api-client-react";

type SortField = "createdAt" | "startsAt" | "plan" | "status" | "region";
type SortDir = "asc" | "desc";

type Subscriber = {
  id: number;
  email: string;
  name: string | null;
  plan: string;
  status: string;
  region: string;
  createdAt: string;
  startsAt?: string | null;
  endsAt?: string | null;
};

function fmt(date: string | null | undefined) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function SubscribersPage() {
  const { data, isLoading, isError } = useListSubscribers();
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "lapsed">("all");

  const rawSubscribers = (data?.subscribers ?? []) as Subscriber[];

  const active = rawSubscribers.filter(
    (s) => s.status === "active" || s.status === "trialing"
  );
  const lapsed = rawSubscribers.filter(
    (s) => s.status !== "active" && s.status !== "trialing" && s.status !== "none"
  );

  const filtered = rawSubscribers.filter((s) => {
    if (statusFilter === "active") return s.status === "active" || s.status === "trialing";
    if (statusFilter === "lapsed")
      return s.status !== "active" && s.status !== "trialing" && s.status !== "none";
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    let va = "";
    let vb = "";
    if (sortField === "createdAt") {
      va = a.createdAt;
      vb = b.createdAt;
    } else if (sortField === "startsAt") {
      va = (a as Subscriber).startsAt ?? "";
      vb = (b as Subscriber).startsAt ?? "";
    } else if (sortField === "plan") {
      va = a.plan;
      vb = b.plan;
    } else if (sortField === "status") {
      va = a.status;
      vb = b.status;
    } else if (sortField === "region") {
      va = a.region;
      vb = b.region;
    }
    const cmp = va.localeCompare(vb);
    return sortDir === "asc" ? cmp : -cmp;
  });

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <span className="ml-1 opacity-30 text-xs">↕</span>;
    return <span className="ml-1 text-xs">{sortDir === "asc" ? "↑" : "↓"}</span>;
  }

  function StatusBadge({ status }: { status: string }) {
    const map: Record<string, string> = {
      active: "bg-green-50 text-green-700",
      trialing: "bg-sky-50 text-sky-700",
      expired: "bg-red-50 text-red-700",
      cancelled: "bg-orange-50 text-orange-700",
      none: "bg-muted text-muted-foreground",
    };
    const cls = map[status] ?? "bg-muted text-muted-foreground";
    const label =
      status === "none"
        ? "No sub"
        : status.charAt(0).toUpperCase() + status.slice(1);
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cls}`}
      >
        {label}
      </span>
    );
  }

  function SortTh({
    field,
    children,
  }: {
    field: SortField;
    children: React.ReactNode;
  }) {
    return (
      <th
        className="px-4 py-2.5 text-left font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground"
        onClick={() => handleSort(field)}
      >
        {children}
      </th>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-lg font-semibold text-foreground mb-6">Subscribers</h1>

      {!isLoading && !isError && (
        <div className="grid grid-cols-4 gap-3 mb-6">
          <StatCard label="Total" value={rawSubscribers.length} />
          <StatCard label="Active" value={active.length} highlight="green" />
          <StatCard label="Lapsed" value={lapsed.length} highlight="red" />
          <StatCard
            label="No subscription"
            value={rawSubscribers.filter((s) => s.status === "none").length}
          />
        </div>
      )}

      {!isLoading && !isError && (
        <div className="flex gap-1 mb-4 flex-wrap">
          {(["all", "active", "lapsed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                statusFilter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {f === "all"
                ? `All (${rawSubscribers.length})`
                : f === "active"
                ? `Active (${active.length})`
                : `Lapsed (${lapsed.length})`}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : isError ? (
        <p className="text-sm text-destructive">Failed to load subscribers.</p>
      ) : (
        <div className="border border-border rounded-md overflow-auto">
          <table className="w-full text-sm min-w-[780px]">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                  Subscriber
                </th>
                <SortTh field="status">
                  Status <SortIcon field="status" />
                </SortTh>
                <SortTh field="plan">
                  Plan <SortIcon field="plan" />
                </SortTh>
                <SortTh field="region">
                  Region <SortIcon field="region" />
                </SortTh>
                <SortTh field="startsAt">
                  Started <SortIcon field="startsAt" />
                </SortTh>
                <SortTh field="createdAt">
                  Joined <SortIcon field="createdAt" />
                </SortTh>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {sorted.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-16 text-center text-sm text-muted-foreground"
                  >
                    No subscribers yet.
                  </td>
                </tr>
              ) : (
                sorted.map((sub) => (
                  <tr key={sub.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{sub.email}</div>
                      {sub.name && (
                        <div className="text-xs text-muted-foreground">{sub.name}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={sub.status} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs capitalize">
                      {sub.plan === "none" ? "—" : sub.plan}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {sub.region}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {fmt((sub as Subscriber).startsAt)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {fmt(sub.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: "green" | "red";
}) {
  const valueClass =
    highlight === "green"
      ? "text-green-700"
      : highlight === "red"
      ? "text-red-700"
      : "text-foreground";
  return (
    <div className="border border-border rounded-md p-4 bg-card">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-2xl font-semibold tabular-nums ${valueClass}`}>{value}</p>
    </div>
  );
}
