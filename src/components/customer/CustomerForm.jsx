import { X, User, FileSpreadsheet, Camera } from "lucide-react";
import { useState, useEffect } from "react";
import { createCustomer, updateCustomer } from "../../firebase/customer";
import { useAuth } from "../../contexts/authContext/useAuth";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import { toast } from "react-hot-toast";
import ImageUploader from "../ImageUploader";
import BulkImportView from "../BulkImportView";
import CameraReceiptScannerModal from "../invoice/CameraReceiptScannerModal";
import { generateUniqueCode } from "../../utils/excelHelper";

export default function CustomerModal({ onClose, customer }) {
  const { currentUser } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const isEditMode = !!customer;
  const [entryMode, setEntryMode] = useState("single");
  const [loading, setLoading] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    customerCode: "",
    name: "",
    companyName: "",
    displayTradingName: "",
    industryType: "Other",
    email: "",
    profile: "",
    phone: "",
    gstin: "",
    pan: "",
    address: "",
    shippingAddress: "",
    sameAsBilling: true,
    paymentTerms: "Net 30",
    currency: "INR",
    openingBalance: 0,
  });

  useEffect(() => {
    if (isEditMode) {
      setFormData({
        customerCode: customer.customerCode || "",
        name: customer.name || customer.full_name || "",
        companyName: customer.companyName || customer.company || "",
        displayTradingName: customer.displayTradingName || "",
        industryType: customer.industryType || "Other",
        email: customer.email || "",
        profile: customer.profile || "",
        phone: customer.phone || customer.phone_number || "",
        gstin: customer.gstin || "",
        pan: customer.pan || "",
        address: customer.address || "",
        shippingAddress: customer.shippingAddress || customer.address || "",
        sameAsBilling: !customer.shippingAddress || customer.shippingAddress === customer.address,
        paymentTerms: customer.paymentTerms || "Net 30",
        currency: customer.currency || "INR",
        openingBalance: customer.openingBalance || 0,
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        customerCode: generateUniqueCode("CUST"),
      }));
    }
  }, [customer, isEditMode]);

  const validatePhoneNumber = (phone) => {
    const numeric = String(phone || "").replace(/\D/g, "");
    if (numeric.length !== 10) {
      toast.error("Please enter a valid 10-digit phone number");
      return false;
    }
    return true;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageUpload = (url) => {
    setFormData((prev) => ({
      ...prev,
      profile: url,
    }));
  };

  const targetUid = currentUser?.uid || currentUser?.id || currentUser?.clerkUser?.id;
  const workspaceId = activeWorkspace?.id;
  const targetScope = {
    workspaceId,
    userId: targetUid,
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error("Please fill in the required fields (Name & Email).");
      return;
    }

    if (!validatePhoneNumber(formData.phone)) return;

    try {
      if (!targetUid && !workspaceId) {
        toast.error("Authentication required to save customer.");
        return;
      }

      const payload = {
        customerCode: formData.customerCode || generateUniqueCode("CUST"),
        name: formData.name.trim(),
        companyName: formData.companyName.trim(),
        displayTradingName: formData.displayTradingName.trim(),
        industryType: formData.industryType,
        email: formData.email.trim(),
        phone: String(formData.phone).trim(),
        gstin: formData.gstin.trim().toUpperCase(),
        pan: formData.pan.trim().toUpperCase(),
        address: formData.address.trim(),
        shippingAddress: (formData.sameAsBilling ? formData.address : formData.shippingAddress).trim(),
        paymentTerms: formData.paymentTerms,
        currency: formData.currency,
        openingBalance: Number(formData.openingBalance) || 0,
        profile: formData.profile || "",
      };
      if (targetUid) payload.userId = targetUid;
      if (workspaceId) payload.workspaceId = workspaceId;

      if (!isEditMode) {
        await createCustomer(payload, setLoading, targetScope);
        toast.success("B2B Customer added successfully!");
      } else {
        await updateCustomer(customer.id, payload, setLoading, targetScope);
        toast.success("B2B Customer updated successfully!");
      }
      onClose();
    } catch (error) {
      toast.error(error?.message || "Failed to save customer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-24px border border-border bg-surface-elevated shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-5">
          <h3 className="text-xl font-semibold text-foreground">
            {isEditMode ? "Update Customer Details" : "Add Customer"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground transition hover:bg-surface hover:text-foreground"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab switcher: Single vs Bulk Excel */}
        {!isEditMode && (
          <div className="flex border-b border-border bg-surface/40 p-2 gap-2">
            <button
              type="button"
              onClick={() => setEntryMode("single")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs sm:text-sm font-medium transition ${
                entryMode === "single"
                  ? "bg-surface-elevated text-primary shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <User size={16} />
              Single Entry
            </button>
            <button
              type="button"
              onClick={() => setEntryMode("bulk")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs sm:text-sm font-medium transition ${
                entryMode === "bulk"
                  ? "bg-surface-elevated text-primary shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileSpreadsheet size={16} />
              Multiple (Bulk Excel/CSV)
            </button>
          </div>
        )}

        {entryMode === "bulk" && !isEditMode ? (
          <div className="p-5">
            <BulkImportView
              type="customer"
              scope={targetScope}
              onSuccess={onClose}
              onCancel={onClose}
            />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5">
            {/* Unique Code Badge & Scan Card */}
            <div className="mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 rounded-xl bg-surface p-3 border border-border">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">Unique Customer Code:</span>
                <span className="font-mono text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20">
                  {formData.customerCode || "Generating..."}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsCameraModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground active:scale-95 shadow-2xs"
              >
                <Camera size={14} />
                Scan Visiting Card (Camera / AI)
              </button>
            </div>

            <ImageUploader
              onUpload={handleImageUpload}
              currentImage={formData.profile}
              customFileName={formData.customerCode}
              folder="/invomora/customers"
            />

            {/* Form Fields: Structured B2B Sections */}
            <div className="space-y-4">
              {/* 1. Company Identity */}
              <div className="rounded-xl border border-border bg-surface p-3.5 space-y-3">
                <span className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                  Company & Business Identity
                </span>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label htmlFor="companyName" className="text-xs font-medium text-foreground">
                      Company / Business Legal Name
                    </label>
                    <input
                      type="text"
                      name="companyName"
                      id="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      className="mt-1.5 w-full rounded-xl border border-border bg-surface-elevated px-3 py-2 text-xs sm:text-sm text-foreground placeholder-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                      placeholder="Sharma Enterprises Pvt Ltd"
                    />
                  </div>
                  <div>
                    <label htmlFor="displayTradingName" className="text-xs font-medium text-foreground">
                      Trading / Brand Name (Optional)
                    </label>
                    <input
                      type="text"
                      name="displayTradingName"
                      id="displayTradingName"
                      value={formData.displayTradingName}
                      onChange={handleChange}
                      className="mt-1.5 w-full rounded-xl border border-border bg-surface-elevated px-3 py-2 text-xs sm:text-sm text-foreground placeholder-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                      placeholder="Sharma Retail"
                    />
                  </div>
                  <div>
                    <label htmlFor="industryType" className="text-xs font-medium text-foreground">
                      Industry Type
                    </label>
                    <select
                      name="industryType"
                      id="industryType"
                      value={formData.industryType}
                      onChange={handleChange}
                      className="mt-1.5 w-full rounded-xl border border-border bg-surface-elevated px-3 py-2 text-xs sm:text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 cursor-pointer"
                    >
                      <option value="IT & Software">IT & Software</option>
                      <option value="Manufacturing">Manufacturing</option>
                      <option value="Retail">Retail</option>
                      <option value="Consulting">Consulting</option>
                      <option value="Logistics">Logistics</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 2. Contact Person */}
              <div className="rounded-xl border border-border bg-surface p-3.5 space-y-3">
                <span className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                  Primary Contact Person
                </span>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label htmlFor="name" className="text-xs font-medium text-foreground">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="mt-1.5 w-full rounded-xl border border-border bg-surface-elevated px-3 py-2 text-xs sm:text-sm text-foreground placeholder-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                      placeholder="Ramesh Sharma"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="text-xs font-medium text-foreground">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      pattern="[0-9]{10}"
                      name="phone"
                      id="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="mt-1.5 w-full rounded-xl border border-border bg-surface-elevated px-3 py-2 text-xs sm:text-sm text-foreground placeholder-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                      placeholder="10-digit mobile"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="text-xs font-medium text-foreground">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="mt-1.5 w-full rounded-xl border border-border bg-surface-elevated px-3 py-2 text-xs sm:text-sm text-foreground placeholder-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                      placeholder="ramesh@sharma.in"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* 3. Tax & Compliance */}
              <div className="rounded-xl border border-border bg-surface p-3.5 space-y-3">
                <span className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                  Tax & Compliance
                </span>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="gstin" className="text-xs font-medium text-foreground">
                      GSTIN / Tax ID
                    </label>
                    <input
                      type="text"
                      name="gstin"
                      id="gstin"
                      value={formData.gstin}
                      onChange={handleChange}
                      maxLength={15}
                      className="mt-1.5 w-full rounded-xl border border-border bg-surface-elevated px-3 py-2 text-xs sm:text-sm text-foreground uppercase placeholder-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                      placeholder="07AAAAA0000A1Z5"
                    />
                  </div>
                  <div>
                    <label htmlFor="pan" className="text-xs font-medium text-foreground">
                      PAN Number
                    </label>
                    <input
                      type="text"
                      name="pan"
                      id="pan"
                      value={formData.pan}
                      onChange={handleChange}
                      maxLength={10}
                      className="mt-1.5 w-full rounded-xl border border-border bg-surface-elevated px-3 py-2 text-xs sm:text-sm text-foreground uppercase placeholder-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                      placeholder="AAAAA0000A"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Address Details */}
              <div className="rounded-xl border border-border bg-surface p-3.5 space-y-3">
                <span className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                  Address Details
                </span>
                <div>
                  <label htmlFor="address" className="text-xs font-medium text-foreground">
                    Billing Address
                  </label>
                  <textarea
                    id="address"
                    rows="2"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="mt-1.5 w-full rounded-xl border border-border bg-surface-elevated px-3 py-2 text-xs sm:text-sm text-foreground placeholder-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                    placeholder="Plot / Street, City, State, Pincode"
                  />
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="sameAsBilling"
                    name="sameAsBilling"
                    checked={formData.sameAsBilling}
                    onChange={handleChange}
                    className="rounded border-border text-primary focus:ring-primary cursor-pointer"
                  />
                  <label htmlFor="sameAsBilling" className="text-xs text-foreground cursor-pointer select-none">
                    Shipping Address is same as Billing Address
                  </label>
                </div>
                {!formData.sameAsBilling && (
                  <div>
                    <label htmlFor="shippingAddress" className="text-xs font-medium text-foreground">
                      Shipping Address
                    </label>
                    <textarea
                      id="shippingAddress"
                      rows="2"
                      name="shippingAddress"
                      value={formData.shippingAddress}
                      onChange={handleChange}
                      className="mt-1.5 w-full rounded-xl border border-border bg-surface-elevated px-3 py-2 text-xs sm:text-sm text-foreground placeholder-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                      placeholder="Shipping destination address"
                    />
                  </div>
                )}
              </div>

              {/* 5. Financial Settings */}
              <div className="rounded-xl border border-border bg-surface p-3.5 space-y-3">
                <span className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                  Financial Terms
                </span>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label htmlFor="paymentTerms" className="text-xs font-medium text-foreground">
                      Payment Terms
                    </label>
                    <select
                      name="paymentTerms"
                      id="paymentTerms"
                      value={formData.paymentTerms}
                      onChange={handleChange}
                      className="mt-1.5 w-full rounded-xl border border-border bg-surface-elevated px-3 py-2 text-xs sm:text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 cursor-pointer"
                    >
                      <option value="Immediate">Immediate / Due on Receipt</option>
                      <option value="Net 15">Net 15 Days</option>
                      <option value="Net 30">Net 30 Days</option>
                      <option value="Net 60">Net 60 Days</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="currency" className="text-xs font-medium text-foreground">
                      Currency
                    </label>
                    <select
                      name="currency"
                      id="currency"
                      value={formData.currency}
                      onChange={handleChange}
                      className="mt-1.5 w-full rounded-xl border border-border bg-surface-elevated px-3 py-2 text-xs sm:text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 cursor-pointer"
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="openingBalance" className="text-xs font-medium text-foreground">
                      Opening Balance (₹)
                    </label>
                    <input
                      type="number"
                      name="openingBalance"
                      id="openingBalance"
                      value={formData.openingBalance}
                      onChange={handleChange}
                      className="mt-1.5 w-full rounded-xl border border-border bg-surface-elevated px-3 py-2 text-xs sm:text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-surface hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-2xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover active:scale-95 shadow-sm"
            >
              {loading
                ? isEditMode
                  ? "Updating..."
                  : "Saving..."
                : isEditMode
                  ? "Update Customer"
                  : "Save Customer"}
            </button>
          </div>
        </form>
        )}
      </div>

      <CameraReceiptScannerModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        mode="customer"
        onApply={(extracted, imagePreview) => {
          setFormData((prev) => ({
            ...prev,
            name: extracted.name || prev.name,
            email: extracted.email || prev.email,
            phone: extracted.phone || prev.phone,
            address: extracted.address || prev.address,
            profile: prev.profile || imagePreview || "",
          }));
        }}
      />
    </div>
  );
}
