import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import InvoiceForm from "../../components/invoice/InvoiceForm";
import { listenToCustomers } from "../../firebase/customer";
import { listenToProducts } from "../../firebase/product";
import { createInvoice, getNextInvoiceNumber } from "../../firebase/invoice";
import { formatCurrentDate } from "../../components/helper";
import { useAuth } from "../../contexts/authContext/useAuth";
import toast from "react-hot-toast";

export default function AddInvoice() {
  const { currentUser } = useAuth();
  const [allCustomers, setAllCustomers] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const targetUid = currentUser?.uid || currentUser?.id || currentUser?.clerkUser?.id;

  useEffect(() => {
    if (!targetUid) return;
    const unsubCust = listenToCustomers(setAllCustomers, targetUid);
    const unsubProd = listenToProducts(setAllProducts, targetUid);
    return () => {
      unsubCust();
      unsubProd();
    };
  }, [targetUid]);

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
    if (!targetUid) {
      toast.error("User authentication required to create invoice.");
      return;
    }
    setSubmitting(true);
    try {
      const nextNo = await getNextInvoiceNumber(targetUid);
      finalInvoice.invoice_no = nextNo;
      finalInvoice.userId = targetUid;
      await createInvoice(finalInvoice, setSubmitting, targetUid);
      toast.success("Invoice successfully created!");
      setTimeout(() => {
        navigate(-1);
      }, 800);
    } catch (error) {
      console.error("Error creating invoice:", error);
      toast.error(error?.message || "Creation failed!");
    } finally {
      setSubmitting(false);
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
        submitting={submitting}
      />
    </div>
  );
}
