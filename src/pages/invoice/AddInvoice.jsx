import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import InvoiceForm from "../../components/invoice/InvoiceForm";
import { listenToCustomers } from "../../firebase/customer";
import { listenToProducts } from "../../firebase/product";
import { createInvoiceWithNumber } from "../../firebase/invoice";
import { formatCurrentDate } from "../../components/helper";
import { useAuth } from "../../contexts/authContext/useAuth";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import toast from "react-hot-toast";

export default function AddInvoice() {
  const { currentUser } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const [allCustomers, setAllCustomers] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const targetUid = currentUser?.uid || currentUser?.id || currentUser?.clerkUser?.id;
  const workspaceId = activeWorkspace?.id;

  const targetScope = useMemo(() => ({
    workspaceId,
    userId: targetUid,
  }), [workspaceId, targetUid]);

  useEffect(() => {
    if (!targetUid && !workspaceId) return;
    const unsubCust = listenToCustomers(setAllCustomers, targetScope);
    const unsubProd = listenToProducts(setAllProducts, targetScope);
    return () => {
      unsubCust();
      unsubProd();
    };
  }, [targetScope, targetUid, workspaceId]);

  const emptyInvoiceState = {
    invoiceNumber: "INV-00",
    client: { name: "", email: "", phone: "", id: "" },
    invoiceDate: formatCurrentDate(),
    taxRate: 18,
    items: [{ id: "", title: "", quantity: 1, price: 0 }],
    status: "Pending",
    paymentType: "",
  };


  const handleCreateSubmit = async (finalInvoice) => {
    if (!targetUid && !workspaceId) {
      toast.error("Authentication required to create invoice.");
      return;
    }
    setSubmitting(true);
    try {
      if (targetUid) finalInvoice.userId = targetUid;
      if (workspaceId) finalInvoice.workspaceId = workspaceId;
      const created = await createInvoiceWithNumber(targetScope, finalInvoice, setSubmitting);
      toast.success(`Invoice #${created.invoiceNumber} successfully created!`);
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
    <div className="min-h-screen bg-background max-w-7xl mx-auto px-4 py-10">
      <h2 className="text-2xl font-bold mb-6 text-foreground">
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
