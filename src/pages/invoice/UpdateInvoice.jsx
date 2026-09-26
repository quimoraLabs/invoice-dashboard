import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom"; 
import InvoiceForm from "../../components/invoice/InvoiceForm";
import { listenToCustomers } from "../../firebase/customer";
import { listenToProducts } from "../../firebase/product";
import { getInvoiceById, updateInvoice } from "../../firebase/invoice"; 
import { useAuth } from "../../contexts/authContext/useAuth";
import toast from "react-hot-toast";

export default function EditInvoice() {
  const { currentUser } = useAuth();
  const { invoiceId } = useParams(); 
  const navigate = useNavigate();
  
  const [allCustomers, setAllCustomers] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [invoiceData, setInvoiceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!currentUser?.uid) return;
    const unsubCust = listenToCustomers(setAllCustomers, currentUser.uid);
    const unsubProd = listenToProducts(setAllProducts, currentUser.uid);
    return () => { 
      unsubCust(); 
      unsubProd(); 
    };
  }, [currentUser?.uid]);

  useEffect(() => {
    async function loadTargetInvoice() {
      if (!invoiceId) return;
      try {
        setLoading(true);
        const data = await getInvoiceById(invoiceId);
        if (data) {
          setInvoiceData(data);
        } else {
          toast.error("Invoice target document not found!");
          navigate(-1);
        }
      } catch (error) {
        console.error("Failed to load invoice:", error);
        toast.error("Error retrieving target record details.");
      } finally {
        setLoading(false);
      }
    }
    loadTargetInvoice();
  }, [invoiceId, navigate]);

  const handleUpdateSubmit = async (finalInvoice) => {
    setSubmitting(true);
    try {
      await updateInvoice(invoiceId, finalInvoice);
      toast.success("Invoice successfully modified!");
      setTimeout(() => {
        navigate(-1);
      }, 800);
    } catch (error) {
      console.error(error);
      toast.error("Modification routine execution failed!");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-100">
        <span className="text-sm font-medium text-slate-500 animate-pulse">Loading target document configuration details...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h2 className="text-2xl font-bold mb-6 text-slate-800">Update Invoice #{invoiceData?.invoice_no}</h2>
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