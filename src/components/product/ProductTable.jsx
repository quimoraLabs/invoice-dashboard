import React from "react";
import RowActionsMenu from "../ActionMenu";

export default function ProductTable({ products, onEdit, onDelete, onView }) {
  return (
    <div className="rounded-[22px] border border-border bg-surface-elevated shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-muted-foreground">
          <thead className="text-xs text-muted-foreground uppercase bg-surface border-b border-border font-semibold tracking-wider">
            <tr>
              <th scope="col" className="px-4 py-3 sm:px-6">
                Product
              </th>
              <th scope="col" className="px-4 py-3 text-right sm:px-6">
                Price (₹)
              </th>
              <th scope="col" className="px-4 py-3 text-center sm:px-6">
                Category
              </th>
              <th scope="col" className="px-4 py-3 text-right sm:px-6">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {products.length > 0 ? (
              products.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-border hover:bg-surface transition duration-200"
                >
                  <td className="px-4 py-4 sm:px-6">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="h-14 w-14 sm:h-16 sm:w-16 flex-shrink-0 overflow-hidden rounded-xl border border-border bg-surface">
                        <img
                          className="h-full w-full object-cover"
                          src={item.imageUrl}
                          alt={item.title}
                        />
                      </div>
                      <p className="max-w-md font-medium text-foreground leading-snug line-clamp-1">
                        {item.title}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right font-medium text-foreground tabular-nums whitespace-nowrap sm:px-6">
                    {Number(item.price).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-4 py-4 text-center sm:px-6">
                    <span className="inline-block rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground capitalize">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right sm:px-6">
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
                  className="px-4 py-8 text-center text-sm text-muted-foreground sm:px-6"
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
