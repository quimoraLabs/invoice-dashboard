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
import { useAuth } from "../contexts/authContext/useAuth";

function IncomeGraph() {
  const { currentUser } = useAuth();
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    if (!currentUser?.uid) return;
    const unsubscribe = listenToInvoices((allInvoices) => {
      const paidInvoices = allInvoices.filter(
        (invoice) => invoice.status?.toLowerCase() === "paid",
      );

      // Group invoices by date and sum their amounts
      const aggregatedDataMap = paidInvoices.reduce((acc, invoice) => {
        const rawDate = invoice.paid_date || invoice.invoice_date;
        let date = "Unknown";
        if (typeof rawDate === "string") {
          date = rawDate.split("T")[0];
        } else if (rawDate?.toDate) {
          date = rawDate.toDate().toISOString().split("T")[0];
        } else if (rawDate?.seconds) {
          date = new Date(rawDate.seconds * 1000).toISOString().split("T")[0];
        }

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
    }, currentUser.uid);
    return () => unsubscribe();
  }, [currentUser?.uid]);

  return (
    <div className="rounded-3xl border border-border bg-surface-elevated p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            Revenue
          </p>
          <h2 className="mt-1 text-xl font-semibold text-foreground">
            Paid invoices trend
          </h2>
        </div>
        <span className="rounded-full bg-success-muted px-3 py-1 text-sm font-medium text-success">
          Live data
        </span>
      </div>

      {invoices.length > 0 ? (
        <div className="h-60 lg:h-50">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={invoices}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                tickFormatter={(value) => `₹${Number(value).toFixed(2)}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--surface-elevated)",
                  borderColor: "var(--border)",
                  color: "var(--foreground)",
                  borderRadius: "1rem",
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                }}
                formatter={(value) => [
                  `₹${Number(value).toFixed(2)}`,
                  "Total Amount",
                ]}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="var(--primary)"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex h-72 items-center justify-center rounded-2xl border border-dashed border-border bg-surface text-sm text-muted-foreground">
          No paid invoices yet.
        </div>
      )}
    </div>
  );
}

export default IncomeGraph;
