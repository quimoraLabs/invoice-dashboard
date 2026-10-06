import React, { useState, useEffect, useRef } from "react";
import CustomDropdown from "../CustomDropdown";
import {
  HiOutlineTrash,
  HiOutlinePlusCircle,
  HiCurrencyRupee,
} from "react-icons/hi";
import toast from "react-hot-toast";

function InvoiceForm({
  initialData,
  onSubmit,
  allCustomers,
  allProducts,
  isEditMode,
  submitting,
}) {
  const [invoice, setInvoice] = useState(initialData);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [activeProductIndex, setActiveProductIndex] = useState(null);
  const [productSearchTerms, setProductSearchTerms] = useState([]);

  // Refs to handle outside clicks for auto-closing search dropdowns
  const customerRef = useRef(null);
  const productRefs = useRef([]);

  useEffect(() => {
    setInvoice(initialData);
    // Show only the name in the input field to save space
    if (initialData?.client?.name) {
      setCustomerSearch(initialData.client.name);
    }
    if (initialData?.items) {
      setProductSearchTerms(initialData.items.map((item) => item.title || ""));
    }
  }, [initialData]);

  useEffect(() => {
    setFilteredCustomers(allCustomers);
  }, [allCustomers]);

  // Handle outside click to auto-close the customer dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (customerRef.current && !customerRef.current.contains(event.target)) {
        setShowCustomerDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle outside click to auto-close product search dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (activeProductIndex !== null) {
        const currentProductRef = productRefs.current[activeProductIndex];
        if (currentProductRef && !currentProductRef.contains(event.target)) {
          setActiveProductIndex(null);
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeProductIndex]);

  const statusOptions = [
    { label: "Paid", value: "Paid" },
    { label: "Unpaid", value: "Unpaid" },
    { label: "Pending", value: "Pending" },
  ];

  const paymentOptions = [
    { label: "UPI", value: "UPI" },
    { label: "Card", value: "Card" },
    { label: "Cash", value: "Cash" },
  ];

  const handleCustomerSelect = (customer) => {
    const custName = customer.full_name || customer.name || "";
    const custPhone = customer.phone_number || customer.phone || customer.phone_no || "";
    setInvoice((prev) => ({
      ...prev,
      client: {
        name: custName,
        full_name: custName,
        email: customer.email || "",
        phone: custPhone,
        phone_number: custPhone,
        address: customer.address || "",
        id: customer.id,
      },
    }));
    // Visually update the input to show only the clean name
    setCustomerSearch(custName);
    setShowCustomerDropdown(false);
  };

  const handleCustomerSearchChange = (e) => {
    const value = e.target.value;
    setCustomerSearch(value);
    setShowCustomerDropdown(true);
    if (!value.trim()) {
      setFilteredCustomers(allCustomers);
      return;
    }
    const filtered = allCustomers.filter(
      (c) =>
        (c.full_name || c.name)?.toLowerCase().includes(value.toLowerCase()) ||
        c.email?.toLowerCase().includes(value.toLowerCase()),
    );
    setFilteredCustomers(filtered);
  };

  const handleProductSelect = (index, product) => {
    const isDuplicate = invoice.items.some(
      (item, i) => i !== index && (
        item.id === product.id ||
        (item.title && item.title.toLowerCase() === product.title?.toLowerCase())
      )
    );
    if (isDuplicate) {
      toast.error("This product is already added to the invoice");
      const updatedTerms = [...productSearchTerms];
      updatedTerms[index] = "";
      setProductSearchTerms(updatedTerms);
      setActiveProductIndex(null);
      return;
    }

    const updatedItems = [...invoice.items];
    updatedItems[index] = {
      id: product.id,
      title: product.title,
      price: Number(product.price) || 0,
      quantity: updatedItems[index]?.quantity || 1,
    };
    const updatedTerms = [...productSearchTerms];
    updatedTerms[index] = product.title;
    setProductSearchTerms(updatedTerms);
    setInvoice((prev) => ({ ...prev, items: updatedItems }));
    setActiveProductIndex(null);
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...invoice.items];
    updatedItems[index][field] =
      field === "quantity" || field === "price" ? Number(value) || 0 : value;
    setInvoice((prev) => ({ ...prev, items: updatedItems }));
  };

  const addItem = () => {
    setInvoice((prev) => ({
      ...prev,
      items: [...prev.items, { id: "", title: "", quantity: 1, price: 0 }],
    }));
    setProductSearchTerms((prev) => [...prev, ""]);
  };

  const removeItem = (index) => {
    setInvoice((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
    setProductSearchTerms((prev) => prev.filter((_, i) => i !== index));
  };

  const subtotal = invoice.items.reduce(
    (total, item) => total + item.quantity * item.price,
    0,
  );
  const taxAmount = (subtotal * (Number(invoice.tax_percentage) || 0)) / 100;
  const totalPrice = subtotal + taxAmount;

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const invoiceDate = new Date(invoice.invoice_date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (invoiceDate > today) {
      toast.error("Invoice date cannot be in the future");
      return;
    }

    const minDate = new Date();
    minDate.setDate(minDate.getDate() - 90);
    minDate.setHours(0, 0, 0, 0);
    if (invoiceDate < minDate) {
      toast.error("Invoice date cannot be more than 90 days in the past");
      return;
    }

    if (invoice.status === "Paid" && !invoice.payment_type) {
      toast.error("Please select a payment method for paid invoices.");
      return;
    }

    onSubmit({
      ...invoice,
      subtotal,
      tax_amount: taxAmount.toFixed(2),
      total_price: totalPrice.toFixed(2),
      paid_date: invoice.status === "Paid" ? new Date().toISOString() : null
    });
  };

  return (
    <form className="space-y-6" onSubmit={handleFormSubmit} autoComplete="off">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-surface-elevated p-6 rounded-2xl border border-border">
        {/* Customer Selection Block with ref tracking outside clicks */}
        <div className="relative" ref={customerRef}>
          <label className="block mb-2 text-sm font-medium text-foreground">
            Customer Selection
          </label>
          <input
            type="text"
            value={customerSearch}
            readOnly={isEditMode}
            onChange={handleCustomerSearchChange}
            onFocus={() => setShowCustomerDropdown(true)}
            placeholder="Search or click to select client..."
            className="w-full p-2.5 text-sm bg-surface border border-border rounded-xl text-foreground placeholder:text-muted-foreground"
          />
          {showCustomerDropdown && !isEditMode && (
            <div className="absolute z-50 w-full mt-1 bg-surface-elevated border border-border rounded-xl shadow-lg max-h-60 overflow-y-auto">
              {filteredCustomers.map((c) => (
                <div
                  key={c.id}
                  onClick={() => handleCustomerSelect(c)}
                  className="px-4 py-2 hover:bg-surface cursor-pointer text-sm"
                >
                  <div className="font-semibold text-foreground">
                    {c.full_name}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-foreground">
            Invoice Issue Date
          </label>
          <input
            type="date"
            readOnly={isEditMode}
            min={new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}
            max={new Date().toISOString().split("T")[0]}
            value={invoice?.invoice_date ? String(invoice.invoice_date).split("T")[0] : ""}
            onClick={(e) => e.target.showPicker?.()}
            onChange={(e) =>
              setInvoice({ ...invoice, invoice_date: e.target.value })
            }
            className="w-full p-2.5 text-sm bg-surface border border-border rounded-xl font-medium text-foreground cursor-pointer"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Allowed: last 90 days to today (GST compliance).
          </p>
        </div>
      </div>

      <div className="bg-surface-elevated p-6 rounded-2xl border border-border space-y-4">
        <label className="block text-sm font-medium text-foreground">
          Line Items & Products
        </label>
        {invoice.items.map((item, index) => (
          <div
            key={index}
            className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center bg-surface rounded-xl p-3 border border-border/80"
            ref={(el) => (productRefs.current[index] = el)}
          >
            <div className="sm:col-span-5 relative">
              <input
                type="text"
                value={productSearchTerms[index] || ""}
                onChange={(e) => {
                  const updated = [...productSearchTerms];
                  updated[index] = e.target.value;
                  setProductSearchTerms(updated);
                  setActiveProductIndex(index);
                }}
                onFocus={() => setActiveProductIndex(index)}
                placeholder="Search product..."
                className="w-full p-2.5 text-sm bg-surface-elevated border border-border rounded-xl text-foreground placeholder:text-muted-foreground"
              />
              {activeProductIndex === index && (
                <div className="absolute z-50 w-full mt-1 bg-surface-elevated border border-border rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {allProducts
                    .filter((p) => {
                      const isSelectedInOtherRow = invoice.items.some(
                        (item, i) => i !== index && item.id === p.id
                      );
                      const matchesSearch = !productSearchTerms[index] || 
                        p.title?.toLowerCase().includes(productSearchTerms[index].toLowerCase());
                      return !isSelectedInOtherRow && matchesSearch;
                    })
                    .map((p) => (
                    <div
                      key={p.id}
                      onClick={() => handleProductSelect(index, p)}
                      className="px-4 py-2 hover:bg-surface cursor-pointer text-sm text-foreground"
                    >
                      {p.title}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="sm:col-span-2">
              <p className="text-muted-foreground text-sm px-2">₹{item.price || "0"}</p>
            </div>
            <div className="sm:col-span-1">
              <input
                type="number"
                placeholder="Qty"
                value={item.quantity || ""}
                onChange={(e) =>
                  handleItemChange(index, "quantity", e.target.value)
                }
                min={1}
                className="w-full p-2.5 text-sm bg-surface-elevated border border-border rounded-xl text-foreground"
              />
            </div>
            <div className="sm:col-span-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">
                ₹{(item.quantity * item.price).toFixed(2)}
              </span>
              <div className="flex items-center gap-2">
                {invoice.items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    title="Delete item"
                    className="text-muted-foreground hover:text-danger"
                  >
                    <HiOutlineTrash size={20} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={addItem}
                  title="add item"
                  className="hover:text-primary text-muted-foreground"
                >
                  <HiOutlinePlusCircle size={20} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-surface-elevated p-6 rounded-2xl border border-border">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground">
            Settlement Status
          </label>
          <CustomDropdown
            readOnly={isEditMode}
            value={invoice.status}
            onChange={(val) => setInvoice({ ...invoice, status: val })}
            options={statusOptions}
            labelPrefix="Status:"
          />
        </div>

        {invoice.status === "Paid" && (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">
              Payment Gateway
            </label>
            <CustomDropdown
              readOnly={isEditMode}
              value={invoice.payment_type}
              onChange={(val) => setInvoice({ ...invoice, payment_type: val })}
              options={paymentOptions}
              labelPrefix="Type:"
            />
          </div>
        )}
      </div>

      <div className="bg-surface-elevated p-6 rounded-2xl border border-border flex flex-col items-end space-y-4">
        <div className="w-full sm:w-72 space-y-2 text-sm text-muted-foreground">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span className="text-foreground font-medium">
              ₹{subtotal.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span>Tax Config (%):</span>
            <p className="text-foreground">{invoice.tax_percentage}%</p>
          </div>
          <div className="flex justify-between">
            <span>Tax Calculated:</span>
            <span className="text-foreground font-medium">
              ₹{taxAmount.toFixed(2)}
            </span>
          </div>
          <div className="border-t border-border my-2"></div>
          <div className="flex justify-between text-lg font-bold text-foreground">
            <span>Total:</span>
            <span className="text-primary">
              ₹{totalPrice.toFixed(2)}
            </span>
          </div>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="bg-success hover:opacity-90 text-white font-semibold px-6 py-3 rounded-xl shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting
            ? "Saving..."
            : isEditMode
              ? "Update Invoice"
              : "Save Invoice"}
        </button>
      </div>
    </form>
  );
}

export default InvoiceForm;
