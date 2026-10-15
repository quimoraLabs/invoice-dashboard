import React, { useState, useEffect, useMemo } from "react";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import { listenToActivityLogs } from "../../firebase/activity";
import {
  HiClipboardList,
  HiSearch,
  HiDocumentText,
  HiUsers,
  HiCube,
  HiUserGroup,
  HiCog,
  HiClock,
  HiCheckCircle,
  HiExclamationCircle,
  HiTrash,
  HiPencilAlt,
  HiUserAdd,
  HiRefresh,
} from "react-icons/hi";

export default function ActivityLogPage() {
  const { activeWorkspace } = useWorkspace();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");

  useEffect(() => {
    if (!activeWorkspace?.id) {
      setLogs([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = listenToActivityLogs(activeWorkspace.id, (loadedLogs) => {
      setLogs(loadedLogs);
      setLoading(false);
    });

    return () => unsub();
  }, [activeWorkspace?.id]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Filter by category
      if (selectedFilter !== "all" && log.entityType !== selectedFilter) {
        return false;
      }

      // Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const actorName = (log.actorName || "").toLowerCase();
        const actorEmail = (log.actorEmail || "").toLowerCase();
        const title = (log.entityTitle || "").toLowerCase();
        const details = (log.details || "").toLowerCase();
        const action = (log.action || "").toLowerCase();

        return (
          actorName.includes(q) ||
          actorEmail.includes(q) ||
          title.includes(q) ||
          details.includes(q) ||
          action.includes(q)
        );
      }

      return true;
    });
  }, [logs, selectedFilter, searchQuery]);

  const stats = useMemo(() => {
    return {
      total: logs.length,
      invoices: logs.filter((l) => l.entityType === "invoice").length,
      customers: logs.filter((l) => l.entityType === "customer").length,
      products: logs.filter((l) => l.entityType === "product").length,
      team: logs.filter((l) => l.entityType === "member").length,
    };
  }, [logs]);

  const filterTabs = [
    { id: "all", label: "All Activities", count: stats.total },
    { id: "invoice", label: "Invoices", count: stats.invoices },
    { id: "customer", label: "Customers", count: stats.customers },
    { id: "product", label: "Products", count: stats.products },
    { id: "member", label: "Team & Invites", count: stats.team },
  ];

  const getActionBadge = (action) => {
    switch (action) {
      case "invoice_create":
      case "customer_create":
      case "product_create":
      case "workspace_create":
        return {
          label: "Created",
          bg: "bg-success-muted text-success border-success/20",
          icon: <HiCheckCircle size={14} />,
        };
      case "invoice_update":
      case "customer_update":
      case "product_update":
      case "workspace_update":
        return {
          label: "Updated",
          bg: "bg-primary-muted text-primary border-primary/20",
          icon: <HiPencilAlt size={14} />,
        };
      case "invoice_status":
        return {
          label: "Status Changed",
          bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
          icon: <HiRefresh size={14} />,
        };
      case "invoice_delete":
      case "customer_delete":
      case "product_delete":
      case "member_remove":
        return {
          label: "Deleted",
          bg: "bg-danger-muted text-danger border-danger/20",
          icon: <HiTrash size={14} />,
        };
      case "member_invite":
        return {
          label: "Invited",
          bg: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
          icon: <HiUserAdd size={14} />,
        };
      case "member_join":
        return {
          label: "Joined",
          bg: "bg-success-muted text-success border-success/20",
          icon: <HiCheckCircle size={14} />,
        };
      default:
        return {
          label: action || "Change",
          bg: "bg-muted text-muted-foreground border-border",
          icon: <HiExclamationCircle size={14} />,
        };
    }
  };

  const getEntityIcon = (entityType) => {
    switch (entityType) {
      case "invoice":
        return <HiDocumentText className="text-primary" size={18} />;
      case "customer":
        return <HiUsers className="text-violet-500" size={18} />;
      case "product":
        return <HiCube className="text-emerald-500" size={18} />;
      case "member":
        return <HiUserGroup className="text-amber-500" size={18} />;
      case "workspace":
        return <HiCog className="text-cyan-500" size={18} />;
      default:
        return <HiClipboardList className="text-muted-foreground" size={18} />;
    }
  };

  const formatTimestamp = (ts) => {
    if (!ts) return "Recently";
    try {
      const date = ts.toDate ? ts.toDate() : new Date(ts);
      return new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    } catch {
      return "Recently";
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-muted text-primary shadow-xs">
              <HiClipboardList size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Workspace Audit Log
              </h1>
              <p className="text-xs text-muted-foreground">
                Immutable activity records for <span className="font-semibold text-foreground">{activeWorkspace?.name || "Workspace"}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-border bg-surface px-3 py-1.5 text-xs text-muted-foreground">
            Total Logged Events: <span className="font-bold text-foreground">{logs.length}</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedFilter(tab.id)}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${
                selectedFilter === tab.id
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-surface border border-border text-muted-foreground hover:bg-surface-elevated hover:text-foreground"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  selectedFilter === tab.id
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full lg:w-72">
          <HiSearch className="absolute left-3 top-2.5 text-muted-foreground" size={16} />
          <input
            type="text"
            placeholder="Search activities or members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface py-2 pl-9 pr-3 text-xs text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Audit Log Timeline */}
      <div className="rounded-2xl border border-border bg-surface-elevated shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mb-3" />
            <p className="text-sm font-medium text-muted-foreground">Loading workspace activity logs...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface border border-border text-muted-foreground mb-3">
              <HiClipboardList size={24} />
            </div>
            <h3 className="text-base font-bold text-foreground">No Activity Records Found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mt-1">
              {searchQuery
                ? "No activities match your current search query. Try clearing the filter."
                : "All future actions (creating invoices, updating products, adding team members) will be recorded here automatically."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredLogs.map((log) => {
              const badge = getActionBadge(log.action);
              const entityIcon = getEntityIcon(log.entityType);

              return (
                <div
                  key={log.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 hover:bg-surface/50 transition"
                >
                  {/* Left: Entity & Details */}
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface border border-border shadow-xs">
                      {entityIcon}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold ${badge.bg}`}
                        >
                          {badge.icon}
                          {badge.label}
                        </span>

                        <span className="font-semibold text-sm text-foreground truncate">
                          {log.entityTitle || "Item"}
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground leading-relaxed wrap-break-word">
                        {log.details || "No additional details"}
                      </p>
                    </div>
                  </div>

                  {/* Right: Actor & Timestamp */}
                  <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center gap-1 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-muted text-[11px] font-bold text-primary">
                        {log.actorName?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                      <div className="text-left sm:text-right leading-tight">
                        <p className="text-xs font-semibold text-foreground">
                          {log.actorName || "User"}
                        </p>
                        {log.actorEmail && (
                          <p className="text-[10px] text-muted-foreground truncate max-w-35">
                            {log.actorEmail}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <HiClock size={12} />
                      <span>{formatTimestamp(log.createdAt)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
