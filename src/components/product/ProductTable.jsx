import React from "react";
import RowActionsMenu from "../ActionMenu";

export default function ProductTable({ products, onEdit, onDelete, onView }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-[22px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-sm text-left text-slate-500 dark:text-slate-400">
          <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-400">
            <tr>
              <th scope="col" className="px-6 py-3">
                Product
              </th>
              <th scope="col" className="px-6 py-3 text-right">
                Price (₹)
              </th>
              <th
                scope="col"
                className="px-6 py-3 hidden md:table-cell text-center"
              >
                Category
              </th>
              <th scope="col" className="px-6 py-3 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
            {products.length > 0 ? (
              products.map((item) => (
                <tr
                  key={item.id}
                  // YAHAN BADLA HAI: CustomerTable jaisa exact smooth hover aur border logic laga diya hai
                  className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/30 transition"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100/50">
                        <img
                          className="h-full w-full object-cover"
                          src={item.imageUrl}
                          alt={item.title}
                        />
                      </div>
                      {/* PRO TIP: max-w-md ke sath line-clamp-1 lagaya hai taaki lamba naam ek line me simat jaye */}
                      <p className="max-w-md font-medium text-slate-900 dark:text-slate-200 leading-snug line-clamp-1">
                        {item.title}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-slate-900 dark:text-white tabular-nums whitespace-nowrap">
                    {Number(item.price).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="hidden px-6 py-4 md:table-cell text-center">
                    <span className="inline-block rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 capitalize">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right z-50 relative">
                    <RowActionsMenu
                      data={item}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onView={onView}
                    />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="4"
                  className="px-6 py-8 text-center text-sm text-slate-500"
                >
                  No products found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
