import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/authContext/index";
import IncomeGraph from "../components/GraphInvoice";
import { listenToCustomers } from "../firebase/customer";
import { listenToProducts } from "../firebase/product";
import { listenToInvoices } from "../firebase/invoice";

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

  useEffect(() => {
    const unsubscribeInvoices = listenToInvoices((invoices) => {
      const paidInvoices = invoices.filter((invoice) => invoice.status?.toLowerCase() === "paid");
      const pendingInvoices = invoices.filter((invoice) => invoice.status?.toLowerCase() !== "paid");
      const revenue = paidInvoices.reduce((sum, invoice) => sum + Number(invoice.total_price || 0), 0);

      setStats((prev) => ({
        ...prev,
        invoices: invoices.length,
        paidInvoices: paidInvoices.length,
        pendingInvoices: pendingInvoices.length,
        revenue,
      }));
    });

    const unsubscribeCustomers = listenToCustomers((customers) => {
      setStats((prev) => ({ ...prev, customers: customers.length }));
    });

    const unsubscribeProducts = listenToProducts((products) => {
      setStats((prev) => ({ ...prev, products: products.length }));
    });

    return () => {
      unsubscribeInvoices();
      unsubscribeCustomers();
      unsubscribeProducts();
    };
  }, []);

  const summaryCards = [
    { title: "Invoices", value: stats.invoices, detail: "Total records" },
    { title: "Customers", value: stats.customers, detail: "Active contacts" },
    { title: "Products", value: stats.products, detail: "Available items" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-800 p-6 text-white shadow-xl sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-indigo-200">Overview</p>
              <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
                Hello, {userName}! Your workspace is ready.
              </h1>
              <p className="mt-3 text-sm leading-7 text-slate-300 sm:text-base">
                Track your invoices, keep customer records tidy, and stay focused on what matters most.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link to="/invoice" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100">
                View invoices
              </Link>
              <Link to="/invoice/create" className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20">
                New invoice
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {summaryCards.map((card) => (
            <div key={card.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">{card.title}</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">{card.value}</p>
              <p className="mt-2 text-sm text-slate-500">{card.detail}</p>
            </div>
          ))}

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm md:col-span-3 lg:col-span-1">
            <p className="text-sm font-medium text-emerald-700">Collected revenue</p>
            <p className="mt-3 text-3xl font-semibold text-emerald-900">${stats.revenue.toLocaleString()}</p>
            <p className="mt-2 text-sm text-emerald-700">From {stats.paidInvoices} paid invoices</p>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
          <IncomeGraph />

          <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">Quick actions</p>
            <div className="mt-5 space-y-3">
              <Link to="/customers" className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50">
                <span>Manage customers</span>
                <span className="text-indigo-600">→</span>
              </Link>
              <Link to="/products" className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50">
                <span>Review products</span>
                <span className="text-indigo-600">→</span>
              </Link>
              <Link to="/invoice" className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50">
                <span>{stats.pendingInvoices} pending invoices</span>
                <span className="text-indigo-600">→</span>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Home;
