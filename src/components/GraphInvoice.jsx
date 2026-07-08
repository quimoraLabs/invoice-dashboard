import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { listenToInvoices } from "../firebase/invoice";

function IncomeGraph() {
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    const unsubscribe = listenToInvoices((allInvoices) => {
      const paidInvoices = allInvoices.filter(
        (invoice) => invoice.status?.toLowerCase() === "paid"
      );

      const formattedData = paidInvoices.map((invoice) => ({
        date: invoice.paid_date?.split("T")[0] || "Unknown",
        amount: invoice.total_price || 0,
      }));

      setInvoices(formattedData);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">Revenue</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-900">Paid invoices trend</h2>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-600">
          Live data
        </span>
      </div>

      {invoices.length > 0 ? (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={invoices}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="amount" stroke="#4F46E5" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex h-72 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
          No paid invoices yet.
        </div>
      )}
    </div>
  );
}

export default IncomeGraph;
