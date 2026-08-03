import React, { useState, useEffect, useRef } from "react";
import CustomDropdown from "../CustomDropdown";
import {
  HiOutlineTrash,
  HiOutlinePlusCircle,
  HiCurrencyRupee,
} from "react-icons/hi";

function InvoiceForm({
  initialData,
  onSubmit,
  allCustomers,
  allProducts,
  isEditMode,
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

  console.log(invoice);

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
    // Keep all internal backend fields completely secure and intact
    setInvoice((prev) => ({
      ...prev,
      client: {
        name: customer.full_name,
        email: customer.email,
        phone: customer.phone_number || "",
        id: customer.id,
      },
    }));
    // Visually update the input to show only the clean name
    setCustomerSearch(customer.full_name);
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
        c.full_name?.toLowerCase().includes(value.toLowerCase()) ||
        c.email?.toLowerCase().includes(value.toLowerCase()),
    );
    setFilteredCustomers(filtered);
  };

  const handleProductSelect = (index, product) => {
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
    onSubmit({
      ...invoice,
      subtotal,
      tax_amount: taxAmount,
      total_price: totalPrice,
    });
  };

  return (
    <form className="space-y-6" onSubmit={handleFormSubmit} autoComplete="off">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
        {/* Customer Selection Block with ref tracking outside clicks */}
        <div className="relative" ref={customerRef}>
          <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            Customer Selection
          </label>
          <input
            type="text"
            value={customerSearch}
            readOnly={isEditMode}
            onChange={handleCustomerSearchChange}
            onFocus={() => setShowCustomerDropdown(true)}
            placeholder="Search or click to select client..."
            className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
          />
          {showCustomerDropdown && !isEditMode && (
            <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg max-h-60 overflow-y-auto">
              {filteredCustomers.map((c) => (
                <div
                  key={c.id}
                  onClick={() => handleCustomerSelect(c)}
                  className="px-4 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 cursor-pointer text-sm"
                >
                  <div className="font-semibold text-slate-700 dark:text-slate-200">
                    {c.full_name}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            Invoice Issue Date
          </label>
          <input
            type="datetime-local"
            readOnly={isEditMode}
            value={invoice.invoice_date}
            onChange={(e) =>
              setInvoice({ ...invoice, invoice_date: e.target.value })
            }
            className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Line Items & Products
        </label>
        {invoice.items.map((item, index) => (
          <div
            key={index}
            className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center bg-slate-50 dark:bg-slate-800/50 rounded-xl"
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
                className="w-full p-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
              {activeProductIndex === index && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {allProducts.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => handleProductSelect(index, p)}
                      className="px-4 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 cursor-pointer text-sm text-slate-700 dark:text-slate-200"
                    >
                      {p.title}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="sm:col-span-2">
              <p className="text-gray-500 text-sm px-2">₹{item.price || "0"}</p>
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
                className="w-full p-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div className="sm:col-span-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                ₹{(item.quantity * item.price).toFixed(2)}
              </span>
              {/* {invoice.items.length > 1 && (*/}
              <div className="flex items-center gap-2">
                {invoice.items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    title="Delete item"
                    className="text-gray-400 hover:text-red-500 "
                  >
                    <HiOutlineTrash size={20} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={addItem}
                  title="add item"
                  className="hover:text-indigo-500 text-gray-400"
                >
                  <HiOutlinePlusCircle size={20} />
                </button>
              </div>
              {/* )}*/}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
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

        {invoice.status !== "Unpaid" &&
          invoice.status !== "Pending" &&
          invoice.status !== "" && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Payment Gateway
              </label>
              <CustomDropdown
                readOnly={isEditMode}
                value={invoice.payment_type}
                onChange={(val) =>
                  setInvoice({ ...invoice, payment_type: val })
                }
                options={paymentOptions}
                labelPrefix="Type:"
              />
            </div>
          )}
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col items-end space-y-4">
        <div className="w-full sm:w-72 space-y-2 text-sm text-slate-600 dark:text-slate-400">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span className="text-slate-900 dark:text-slate-100 font-medium">
              ₹{subtotal.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span>Tax Config (%):</span>
            <p className="text-gray-900">{invoice.tax_percentage}%</p>
          </div>
          <div className="flex justify-between">
            <span>Tax Calculated:</span>
            <span className="text-slate-900 dark:text-slate-100 font-medium">
              ₹{taxAmount.toFixed(2)}
            </span>
          </div>
          <div className="border-t my-2"></div>
          <div className="flex justify-between text-lg font-bold text-slate-900 dark:text-slate-100">
            <span>Total:</span>
            <span className="text-indigo-600 dark:text-indigo-400">
              ₹{totalPrice.toFixed(2)}
            </span>
          </div>
        </div>
        <button
          type="submit"
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-xl shadow-sm transition-all"
        >
          {isEditMode ? "Update Invoice" : "Save Invoice"}
        </button>
      </div>
    </form>
  );
}

export default InvoiceForm;
