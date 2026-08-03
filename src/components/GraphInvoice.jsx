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
        (invoice) => invoice.status?.toLowerCase() === "paid",
      );

      // Group invoices by date and sum their amounts
      const aggregatedDataMap = paidInvoices.reduce((acc, invoice) => {
        const date = invoice.paid_date?.split("T")[0] || "Unknown";
        // Ensure total_price is treated as a number, defaulting to 0 if invalid
        const amount = Number(invoice?.total_price) || 0;

        if (!acc[date]) {
          acc[date] = { date: date, amount: 0 };
        }
        acc[date].amount += amount;
        return acc;
      }, {});

      // Convert the aggregated map back to an array of objects
      let formattedData = Object.values(aggregatedDataMap);

      // Sort the data by date to ensure correct chronological order in the chart
      formattedData.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );

      setInvoices(formattedData);
    });
    return () => unsubscribe();
  }, []);
  console.log(invoices);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">
            Revenue
          </p>
          <h2 className="mt-1 text-xl font-semibold text-slate-900">
            Paid invoices trend
          </h2>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-600">
          Live data
        </span>
      </div>

      {invoices.length > 0 ? (
        <div className="h-60 lg:h-50">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={invoices}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                // Optional: Add a custom tick formatter for dates if needed, e.g., to show month/day
                tick={{ fill: "#64748b", fontSize: 12 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#64748b", fontSize: 12 }}
                // Format Y-axis ticks to display currency
                tickFormatter={(value) => `₹${Number(value).toFixed(2)}`}
              />
              <Tooltip
                // Customize tooltip to show formatted amount and label
                formatter={(value) => [
                  `₹${Number(value).toFixed(2)}`,
                  "Total Amount",
                ]}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#4F46E5"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
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
