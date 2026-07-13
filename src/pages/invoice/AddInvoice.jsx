import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Imported for navigation
import InvoiceForm from "../../components/invoice/InvoiceForm";
import { listenToCustomers } from "../../firebase/customer";
import { listenToProducts } from "../../firebase/product";
import { createInvoice, getNextInvoiceNumber } from "../../firebase/invoice";
import { formatCurrentDate } from "../../components/helper";
import toast from "react-hot-toast";

export default function AddInvoice() {
  const [allCustomers, setAllCustomers] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const navigate = useNavigate(); // Hook initialized

  useEffect(() => {
    const unsubCust = listenToCustomers(setAllCustomers);
    const unsubProd = listenToProducts(setAllProducts);
    return () => {
      unsubCust();
      unsubProd();
    };
  }, []);

  const emptyInvoiceState = {
    invoice_no: "INV-00",
    client: { name: "", email: "", phone: "", id: "" },
    invoice_date: formatCurrentDate(),
    tax_percentage: 18,
    items: [{ id: "", title: "", quantity: 1, price: 0 }],
    status: "",
    payment_type: "",
  };

  const handleCreateSubmit = async (finalInvoice) => {
    try {
      const nextNo = await getNextInvoiceNumber();
      finalInvoice.invoice_no = nextNo;
      await createInvoice(finalInvoice);
      toast.success("Invoice successfully created!");

      // Add a micro-delay of 800ms so the user can easily see the visual success toast before navigation unmounts the view
      setTimeout(() => {
        navigate(-1);
      }, 800);
      
    } catch (error) {
      console.log(error);
      toast.error("Creation failed!");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h2 className="text-2xl font-bold mb-6 text-slate-800">
        Create New Invoice
      </h2>
      <InvoiceForm
        initialData={emptyInvoiceState}
        onSubmit={handleCreateSubmit}
        allCustomers={allCustomers}
        allProducts={allProducts}
        isEditMode={false}
      />
    </div>
  );
}
