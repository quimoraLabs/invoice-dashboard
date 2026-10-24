import React from "react";
import { Package } from "lucide-react";
import RowActionsMenu from "../ActionMenu";
import { getSmartImageUrl } from "../../utils/imagekit";

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
                      <div className="h-14 w-14 sm:h-16 sm:w-16 shrink-0 overflow-hidden rounded-xl border border-border bg-surface flex items-center justify-center">
                        {item.imageUrl ? (
                          <img
                            className="h-full w-full object-cover"
                            src={getSmartImageUrl(item.imageUrl, { width: 120, height: 120 })}
                            alt={item.title}
                          />
                        ) : (
                          <Package size={24} className="text-muted-foreground/60" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="max-w-md font-medium text-foreground leading-snug line-clamp-1">
                            {item.title}
                          </p>
                          {item.type && (
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                                item.type === "Service"
                                  ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                                  : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                              }`}
                            >
                              {item.type}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap text-[11px] text-muted-foreground">
                          {item.itemCode && (
                            <span className="font-mono">{item.itemCode}</span>
                          )}
                          {item.hsn && (
                            <>
                              <span>•</span>
                              <span className="font-mono">
                                {item.type === "Service" ? "SAC" : "HSN"}: {item.hsn}
                              </span>
                            </>
                          )}
                          {item.stockQuantity !== undefined && item.type !== "Service" && (
                            <>
                              <span>•</span>
                              <span>Stock: {item.stockQuantity}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right font-medium text-foreground tabular-nums whitespace-nowrap sm:px-6">
                    <div>
                      {Number(item.price).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                      {item.unit && (
                        <span className="text-xs font-normal text-muted-foreground ml-1">
                          / {item.unit}
                        </span>
                      )}
                    </div>
                    {item.taxRate !== undefined && (
                      <span className="text-[10px] text-muted-foreground font-normal">
                        ({item.taxRate}% GST)
                      </span>
                    )}
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
