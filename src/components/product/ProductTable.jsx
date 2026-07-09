import React from "react";
import RowActionsMenu from "./RowActionsMenu";

export default function ProductTable({ products, onEdit, onDelete, onView }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-100/50 dark:shadow-none overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-sm text-left text-slate-500 dark:text-slate-400">
          <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <tr>
              <th scope="col" className="px-6 py-4">Product</th>
              <th scope="col" className="px-6 py-4 text-right">Price (₹)</th>
              <th scope="col" className="px-6 py-4 hidden md:table-cell text-center">Category</th>
              <th scope="col" className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/70 dark:divide-slate-800/70">
            {products.map((item) => (
              <tr
                key={item.id}
                className="transition-colors hover:bg-slate-50/40 dark:hover:bg-slate-800/30"
              >
                <td className="px-6 py-5">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border border-slate-150 dark:border-slate-700 bg-slate-100/50">
                      <img
                        className="h-full w-full object-cover"
                        src={item.imageUrl}
                        alt={item.title}
                      />
                    </div>
                    <p className="max-w-md font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                      {item.title}
                    </p>
                  </div>
                </td>
                <td className="px-6 py-5 text-right font-semibold text-slate-900 dark:text-white tabular-nums whitespace-nowrap">
                  {Number(item.price).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="hidden px-6 py-5 md:table-cell text-center">
                  <span className="inline-block rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 capitalize">
                    {item.category}
                  </span>
                </td>
                <td className="px-6 py-5 text-right">
                  <RowActionsMenu product={item} onEdit={onEdit} onDelete={onDelete} onView={onView} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}