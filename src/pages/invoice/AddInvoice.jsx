import React, { useState, useEffect } from "react";
import { listenToCustomers } from "../../firebase/customer";
import { listenToProducts } from "../../firebase/product";
import ProductDetailsModal from "../../components/modals/ProductDetails";
import toast from "react-hot-toast";
import { createInvoice, getNextInvoiceNumber } from "../../firebase/invoice";
import { formatCurrentDate } from "../../components/helper";

function AddInvoice() {
  const [invoice, setInvoice] = useState({
    invoice_no: "INV-00",
    client: {
      name: "",
      email: "",
      phone: "",
      id: "",
    },
    invoice_date: formatCurrentDate(),
    total_price: 0,
    paid_date: "",
    items: [{ id: "", title: "", quantity: 1, price: 0 }],
    status: "",
    payment_type: "",
  });

  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [allCustomers, setAllCustomers] = useState([]);
  const [allProducts, setAllProducts] = useState([]);

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState(null);

  useEffect(() => {
    const unsubscribe = listenToCustomers(setAllCustomers); // real-time
    return () => unsubscribe();
  }, []);
  useEffect(() => {
    const unsubscribe = listenToProducts(setAllProducts); // real-time
    return () => unsubscribe();
  }, []);

  const handleCustomerSelect = (customer) => {
    setInvoice((prev) => ({
      ...prev,
      client: {
        name: customer.full_name,
        email: customer.email,
        phone: customer.phone_number,
        id: customer.id,
      },
    }));
    setIsCustomerModalOpen(false);
  };
  const openProductModal = (index) => {
    setSelectedItemIndex(index);
    setIsProductModalOpen(true);
  };

  const handleProductSelect = (product) => {
    const updatedItems = [...invoice.items];
    updatedItems[selectedItemIndex] = {
      ...updatedItems[selectedItemIndex],
      id: product.id,
      title: product.title,
      price: Number(product.price) || 0,
      quantity: 1, // default quantity
    };
    setInvoice({ ...invoice, items: updatedItems });
    setIsProductModalOpen(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInvoice({ ...invoice, [name]: value });
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...invoice.items];
    updatedItems[index][field] =
      field === "quantity" || field === "price" ? Number(value) || 0 : value;
    setInvoice({ ...invoice, items: updatedItems });
  };

  const addItem = () => {
    setInvoice({
      ...invoice,
      items: [...invoice.items, { title: "", quantity: 1, price: 0 }],
    });
  };

  const removeItem = (index) => {
    const updatedItems = invoice.items.filter((_, i) => i !== index);
    setInvoice({ ...invoice, items: updatedItems });
  };

  const calculateTotal = () => {
    return invoice.items.reduce(
      (total, item) => total + item.quantity * item.price,
      0
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!invoice.client.id) {
      toast.error("Please select a customer");
      return;
    }

    if (invoice.items.some((item) => !item.title || item.price <= 0)) {
      toast.error("Please select valid products with prices");
      return;
    }

    if (!invoice.payment_type) {
      toast.error("Please select a payment type");
      return;
    }

    const today = formatCurrentDate().split("T")[0];

    // console.log(today);
    // console.log(invoice.invoice_date);

    if (invoice.invoice_date < today) {
      toast.error("Please select today or a future date.");
      return;
    }

    const total_price = calculateTotal();
    try {
      const nextInvoiceNo = await getNextInvoiceNumber();

      const finalInvoice = {
        ...invoice, // keep all existing invoice data
        invoice_no: nextInvoiceNo, // replace only invoice number
        total_price,
        payment_type: invoice.status !== "Unpaid" ? invoice.payment_type : "",
        paid_date: invoice.status === "Paid" ? formatCurrentDate() : "",
      };

      await createInvoice(finalInvoice);

      toast.success("Invoice created successsfully");
      setInvoice({
        invoice_no: "INV-00",
        client: {
          name: "",
          email: "",
          phone: "",
          id: "",
        },
        invoice_date: formatCurrentDate(),
        total_price: 0,
        paid_date: "",
        items: [{ id: "", title: "", quantity: 1, price: 0 }],
        status: "",
        payment_type: "",
      });
    } catch (error) {
      toast.error("Error in creating invoice");
      console.error("Error inVoice : ", error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Create Invoice</h2>

      <form className="space-y-6" onSubmit={handleSubmit}>
        {/* <button
          type="button"
          onClick={() => setIsCustomerModalOpen(true)}
          className="text-indigo-600 hover:underline"
        >
          {invoice.client_name ? invoice.client_name : "Select Customer"}
        </button> */}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <input
            type="text"
            name="name"
            readOnly
            onClick={() => setIsCustomerModalOpen(true)}
            placeholder="Select Customer"
            value={invoice.client?.name}
            onChange={handleChange}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white cursor-pointer"
          />
          <input
            type="email"
            name="email"
            readOnly
            placeholder="Client Email"
            value={invoice.client?.email || ""}
            // onChange={handleChange}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
          />
          <input
            type="tel"
            name="phone"
            readOnly
            placeholder="Client Phone"
            value={invoice.client?.phone || ""}
            // onChange={handleChange}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
          />
          <input
            type="datetime-local"
            name="invoice_date"
            min={formatCurrentDate().slice(0, 10)} // today's date
            value={invoice.invoice_date}
            onChange={handleChange}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
          />
        </div>

        {isCustomerModalOpen && (
          <CustomerDetailsModal
            customers={allCustomers}
            onSelect={handleCustomerSelect}
            onClose={() => setIsCustomerModalOpen(false)}
          />
        )}

        {isProductModalOpen && (
          <ProductDetailsModal
            products={allProducts}
            onSelect={handleProductSelect}
            onClose={() => setIsProductModalOpen(false)}
          />
        )}

        <div>
          {invoice.items?.map((item, index) => (
            <div
              key={index}
              className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-2"
            >
              <input
                type="text"
                placeholder="Select Product"
                value={item.title || ""}
                readOnly
                onClick={() => openProductModal(index)}
                className="cursor-pointer bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
              />
              <input
                type="number"
                placeholder="Qty"
                value={item.quantity}
                onChange={(e) =>
                  handleItemChange(index, "quantity", e.target.value)
                }
                min={1}
                max={100}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
              />
              <input
                type="number"
                placeholder="Price"
                value={item.price}
                onChange={(e) =>
                  handleItemChange(index, "price", e.target.value)
                }
                // readOnly
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
              />
              <div className="flex items-center justify-between">
                <span className="text-gray-800 font-medium">
                  ₹{(item.quantity * item.price).toFixed(2)}
                </span>

                {invoice.items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="text-red-700 hover:text-white border border-red-700 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2 dark:border-red-500 dark:text-red-500 dark:hover:text-white dark:hover:bg-red-600 dark:focus:ring-red-900"
                  >
                    Remove Item
                  </button>
                )}
              </div>
            </div>
          ))}
          <button
            type="button"
            className="text-white bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2"
            onClick={addItem}
          >
            {" "}
            Add Item
          </button>
          <div className="flex items-center gap-4 mt-4">
            <select
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg 
             focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 
             dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 
             dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 cursor-pointer"
              onChange={handleChange}
              value={invoice.status || ""}
              name="status"
            >
              <option value="" disabled>
                Select status
              </option>
              {["Paid", "Unpaid", "Pending"].map((status, id) => (
                <option value={status} key={id} className="capitalize">
                  {status}
                </option>
              ))}
            </select>

            {invoice.status !== "Unpaid" && (
              <select
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 cursor-pointer"
                name="payment_type"
                onChange={handleChange}
                // defaultValue={invoice.payment_type}
                value={invoice.payment_type||""}
              >
                <option value="" disabled> Select Payment Type</option>
                {["UPI", "Card", "Cash"].map((mode, id) => (
                  <option
                    value={mode}
                    key={id}
                    className="capitalize cursor-pointer hover:bg-gray-100"
                  >
                    {mode}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-6 gap-4">
          <span className="text-xl font-semibold text-gray-800">
            Total: ₹{calculateTotal().toFixed(2)}
          </span>

          <button
            type="submit"
            className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700"
          >
            Save Invoice
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddInvoice;
