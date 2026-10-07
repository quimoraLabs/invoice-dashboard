import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/authContext/useAuth";
import IncomeGraph from "../components/GraphInvoice";
import { listenToCustomers } from "../firebase/customer";
import { listenToProducts } from "../firebase/product";
import { listenToInvoices } from "../firebase/invoice";
import StatCard from "../components/StatCard";
import * as FiIcons from "react-icons/fi";

function Home() {
  const { currentUser } = useAuth();
  const userName = currentUser?.displayName || currentUser?.email || "there";

  const [stats, setStats] = useState({
    invoices: 0,
    paidInvoices: 0,
    pendingInvoices: 0,
    customers: 0,
    products: 0,
    revenue: 0,
  });

  const targetUid = currentUser?.uid || currentUser?.id || currentUser?.clerkUser?.id;

  useEffect(() => {
    if (!targetUid) return;

    const unsubscribeInvoices = listenToInvoices((invoices) => {
      const paidInvoices = invoices.filter(
        (invoice) => invoice.status?.toLowerCase() === "paid"
      );
      const pendingInvoices = invoices.filter(
        (invoice) => invoice.status?.toLowerCase() === "pending"
      );
      const revenue = paidInvoices.reduce(
        (sum, invoice) => sum + Number(invoice.totalAmount ?? invoice.total_price ?? 0),
        0
      );

      setStats((prev) => ({
        ...prev,
        invoices: invoices.length,
        paidInvoices: paidInvoices.length,
        pendingInvoices: pendingInvoices.length,
        revenue,
      }));
    }, targetUid);

    const unsubscribeCustomers = listenToCustomers((customers) => {
      setStats((prev) => ({ ...prev, customers: customers.length }));
    }, targetUid);

    const unsubscribeProducts = listenToProducts((products) => {
      setStats((prev) => ({ ...prev, products: products.length }));
    }, targetUid);

    return () => {
      unsubscribeInvoices();
      unsubscribeCustomers();
      unsubscribeProducts();
    };
  }, [targetUid]);

  const cardsConfig = [
    {
      title: "Invoices",
      value: stats.invoices,
      detail: "Total records",
      iconName: "FiFileText",
      theme: "blue",
    },
    {
      title: "Customers",
      value: stats.customers,
      detail: "Active contacts",
      iconName: "FiUsers",
      theme: "purple",
    },
    {
      title: "Products",
      value: stats.products,
      detail: "Available items",
      iconName: "FiBox",
      theme: "amber",
    },
    {
      title: "Collected Revenue",
      value: `${stats.revenue.toLocaleString()}`,
      detail: `From ${stats.paidInvoices} paid invoices`,
      iconName: "FiDollarSign",
      theme: "emerald",
    },
  ];

  return (
    <div className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Sleek, Compact Welcome Banner */}
        <section className="overflow-hidden rounded-2xl border border-border bg-linear-to-r from-primary to-violet-700 p-5 text-white shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl text-white">
                Hello, {userName}!
              </h1>
              <p className="text-xs text-white/80 mt-0.5">
                Your workspace is ready. Track your invoices, keep customer
                records tidy, and stay focused.
              </p>
            </div>

            <div className="flex gap-2.5">
              <Link
                to="/invoice"
                className="rounded-xl bg-white px-4 py-2 text-xs font-semibold text-zinc-900 transition hover:bg-white/90 shadow-sm"
              >
                View invoices
              </Link>
              <Link
                to="/invoice/create"
                className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/20"
              >
                New invoice
              </Link>
            </div>
          </div>
        </section>

        {/* Strict 4-Column Unified Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {cardsConfig.map((card, idx) => (
            <StatCard key={idx} {...card} />
          ))}
        </section>

        {/* Side-by-Side Graph & Quick Actions */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Graph on Left (2 Columns wide) */}
          <div className="lg:col-span-2">
            <IncomeGraph />
          </div>

          {/* Quick Actions on Right (1 Column wide) */}
          <div className="rounded-2xl border border-border bg-surface-elevated p-6 shadow-sm">
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Actions
              </p>
              <h2 className="mt-0.5 text-lg font-bold text-foreground">
                Quick shortcuts
              </h2>
            </div>
            <div className="mt-4 mb-3 space-y-2.5">
              {[
                {
                  to: "/customers",
                  label: "Manage customers",
                  icon: "FiUsers",
                  hoverBorder: "hover:border-primary/40 hover:bg-surface",
                  iconBg:
                    "bg-primary-muted text-primary group-hover:bg-primary group-hover:text-primary-foreground",
                },
                {
                  to: "/products",
                  label: "Review products",
                  icon: "FiBox",
                  hoverBorder: "hover:border-warning/40 hover:bg-surface",
                  iconBg:
                    "bg-warning-muted text-warning group-hover:bg-warning group-hover:text-white",
                },
                {
                  to: "/invoice",
                  label: `${stats.pendingInvoices} pending invoices`,
                  icon: "FiAlertCircle",
                  hoverBorder: "hover:border-danger/40 hover:bg-surface",
                  iconBg:
                    "bg-danger-muted text-danger group-hover:bg-danger group-hover:text-white",
                },
              ].map((action, idx) => {
                const StartIcon = FiIcons[action.icon] || FiIcons.FiLayers;

                return (
                  <Link
                    key={idx}
                    to={action.to}
                    className={`group flex items-center justify-between rounded-xl border border-border p-3 text-sm font-medium text-foreground transition-all duration-200 shadow-sm hover:shadow-md ${action.hoverBorder}`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg transition-all duration-200 shrink-0 ${action.iconBg}`}
                      >
                        <StartIcon className="w-4 h-4" />
                      </div>
                      <span className="transition-colors duration-200 group-hover:text-primary">
                        {action.label}
                      </span>
                    </div>

                    <FiIcons.FiChevronRight className="w-4 h-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-foreground" />
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Home;
