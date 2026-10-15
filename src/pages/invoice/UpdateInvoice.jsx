import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom"; 
import InvoiceForm from "../../components/invoice/InvoiceForm";
import { listenToCustomers } from "../../firebase/customer";
import { listenToProducts } from "../../firebase/product";
import { getInvoiceById, updateInvoice } from "../../firebase/invoice"; 
import { useAuth } from "../../contexts/authContext/useAuth";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import toast from "react-hot-toast";

export default function EditInvoice() {
  const { currentUser } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const { invoiceId } = useParams(); 
  const navigate = useNavigate();

  const targetUid = currentUser?.uid || currentUser?.id || currentUser?.clerkUser?.id;
  const workspaceId = activeWorkspace?.id;

  const targetScope = useMemo(() => ({
    workspaceId,
    userId: targetUid,
  }), [workspaceId, targetUid]);
  
  const [allCustomers, setAllCustomers] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [invoiceData, setInvoiceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!targetUid && !workspaceId) return;
    const unsubCust = listenToCustomers(setAllCustomers, targetScope);
    const unsubProd = listenToProducts(setAllProducts, targetScope);
    return () => { 
      unsubCust(); 
      unsubProd(); 
    };
  }, [targetScope, targetUid, workspaceId]);

  useEffect(() => {
    async function loadTargetInvoice() {
      if (!invoiceId || (!targetUid && !workspaceId)) return;
      try {
        setLoading(true);
        const data = await getInvoiceById(invoiceId, targetScope);
        if (data) {
          setInvoiceData(data);
        } else {
          toast.error("Invoice target document not found!");
          navigate(-1);
        }
      } catch (error) {
        console.error("Failed to load invoice:", error);
        toast.error(error?.message || "Error retrieving target record details.");
        navigate("/invoice", { replace: true });
      } finally {
        setLoading(false);
      }
    }
    loadTargetInvoice();
  }, [invoiceId, navigate, targetScope, targetUid, workspaceId]);

  const handleUpdateSubmit = async (finalInvoice) => {
    setSubmitting(true);
    try {
      await updateInvoice(invoiceId, finalInvoice, setSubmitting, targetScope);
      toast.success("Invoice successfully modified!");
      setTimeout(() => {
        navigate(-1);
      }, 800);
    } catch (error) {
      console.error(error);
      toast.error(error?.message || "Modification routine execution failed!");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-100">
        <span className="text-sm font-medium text-muted-foreground animate-pulse">Loading target document configuration details...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background max-w-7xl mx-auto px-4 py-10">
      <h2 className="text-2xl font-bold mb-6 text-foreground">Update Invoice #{invoiceData?.invoiceNumber || invoiceData?.invoice_no}</h2>
      <InvoiceForm 
        initialData={invoiceData} 
        onSubmit={handleUpdateSubmit} 
        allCustomers={allCustomers} 
        allProducts={allProducts} 
        isEditMode={true} 
        submitting={submitting}
      />
    </div>
  );
}