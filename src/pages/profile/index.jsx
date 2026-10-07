import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/authContext/useAuth";
import { getBusinessProfile, saveBusinessProfile } from "../../firebase/profile";
import ImageUploader from "../../components/ImageUploader";
import Loader from "../../components/Loader";
import toast from "react-hot-toast";
import {
  HiOfficeBuilding,
  HiMail,
  HiPhone,
  HiLocationMarker,
  HiGlobeAlt,
  HiIdentification,
  HiUser,
  HiCreditCard,
  HiCheck,
} from "react-icons/hi";

export default function BusinessProfilePage() {
  const { currentUser } = useAuth();
  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    companyName: "",
    ownerName: "",
    email: "",
    phone: "",
    address: "",
    gstin: "",
    website: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    logoUrl: "",
    signatureUrl: "",
  });

  // Track pristine state for discard changes
  const [savedData, setSavedData] = useState(null);

  const targetUid = currentUser?.uid || currentUser?.id || currentUser?.clerkUser?.id;

  // Load business profile on mount
  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      if (!targetUid) {
        setInitialLoading(false);
        return;
      }

      try {
        setInitialLoading(true);
        const profile = await getBusinessProfile(targetUid);
        if (isMounted && profile) {
          const loaded = {
            companyName: profile.companyName || "",
            ownerName: profile.ownerName || "",
            email: profile.email || "",
            phone: profile.phone || "",
            address: profile.address || "",
            gstin: profile.gstin || "",
            website: profile.website || "",
            bankName: profile.bankName || "",
            accountNumber: profile.accountNumber || "",
            ifscCode: profile.ifscCode || "",
            logoUrl: profile.logoUrl || "",
            signatureUrl: profile.signatureUrl || "",
          };
          setFormData(loaded);
          setSavedData(loaded);
        }
      } catch (err) {
        console.error("Failed to load business profile:", err);
        toast.error("Failed to load business profile");
      } finally {
        if (isMounted) setInitialLoading(false);
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [targetUid]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = (url) => {
    setFormData((prev) => ({ ...prev, logoUrl: url }));
    toast.success("Logo uploaded! Remember to save profile.");
  };

  const handleSignatureUpload = (url) => {
    setFormData((prev) => ({ ...prev, signatureUrl: url }));
    toast.success("Signature uploaded! Remember to save profile.");
  };

  const handleDiscard = () => {
    if (savedData) {
      setFormData(savedData);
    } else {
      setFormData({
        companyName: "",
        ownerName: "",
        email: "",
        phone: "",
        address: "",
        gstin: "",
        website: "",
        bankName: "",
        accountNumber: "",
        ifscCode: "",
        logoUrl: "",
        signatureUrl: "",
      });
    }
    toast("Changes reverted", { icon: "↩️" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.companyName.trim()) {
      toast.error("Company name is required");
      return;
    }

    if (formData.phone) {
      const numeric = String(formData.phone).replace(/\D/g, "");
      if (numeric.length !== 10) {
        toast.error("Please enter a valid 10-digit phone number");
        return;
      }
    }

    if (!targetUid) {
      toast.error("User authentication required");
      return;
    }

    try {
      setSaving(true);
      await saveBusinessProfile(targetUid, formData, targetUid, setSaving);
      setSavedData({ ...formData });
      toast.success("Business profile saved successfully!");
    } catch (err) {
      console.error("Failed to save profile:", err);
      toast.error(err?.message || "Failed to save business profile");
    } finally {
      setSaving(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Loader text="Loading business profile..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Page Header */}
        <div className="rounded-24px border border-border bg-surface-elevated p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <HiOfficeBuilding size={26} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground sm:text-2xl">
                  Business Profile
                </h1>
                <p className="text-xs text-muted-foreground sm:text-sm">
                  Manage your legal business entity, tax identifiers, branding, and payout details for invoices.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Profile Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Branding Assets (Logo & Signature) */}
          <div className="rounded-24px border border-border bg-surface-elevated p-6 shadow-sm">
            <h2 className="text-base font-semibold text-foreground sm:text-lg mb-1">
              Branding & Sign-off
            </h2>
            <p className="text-xs text-muted-foreground mb-6">
              Your logo will appear on invoice headers and your signature will appear in the authorized declaration box.
            </p>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Logo Uploader */}
              <div className="rounded-2xl border border-border/70 bg-surface p-4 sm:p-5">
                <h3 className="text-sm font-medium text-foreground mb-1">
                  Company Logo
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Recommended: Square or horizontal logo with transparent background.
                </p>
                <ImageUploader
                  id="business-logo-uploader"
                  label="Upload Logo"
                  subtext="PNG, JPG, or SVG recommended."
                  currentImage={formData.logoUrl}
                  onUpload={handleLogoUpload}
                />
              </div>

              {/* Signature Uploader */}
              <div className="rounded-2xl border border-border/70 bg-surface p-4 sm:p-5">
                <h3 className="text-sm font-medium text-foreground mb-1">
                  Authorized Signature / Stamp
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Digital sign or company seal printed on finalized PDF invoices.
                </p>
                <ImageUploader
                  id="business-signature-uploader"
                  label="Upload Signature"
                  subtext="PNG with transparent background recommended."
                  currentImage={formData.signatureUrl}
                  onUpload={handleSignatureUpload}
                />
              </div>
            </div>
          </div>

          {/* 2. Business Entity Information */}
          <div className="rounded-24px border border-border bg-surface-elevated p-6 shadow-sm">
            <h2 className="text-base font-semibold text-foreground sm:text-lg mb-1">
              Company Information
            </h2>
            <p className="text-xs text-muted-foreground mb-6">
              Primary identification details printed under your invoice issuer header.
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Company Name */}
              <div className="md:col-span-2">
                <label
                  htmlFor="companyName"
                  className="block text-sm font-medium text-foreground"
                >
                  Company / Trade Name <span className="text-danger">*</span>
                </label>
                <div className="relative mt-2">
                  <input
                    type="text"
                    id="companyName"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Acme Technologies Pvt Ltd"
                    className="w-full rounded-2xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </div>
              </div>

              {/* Owner / Authorized Person */}
              <div>
                <label
                  htmlFor="ownerName"
                  className="block text-sm font-medium text-foreground"
                >
                  Owner / Authorized Signatory
                </label>
                <div className="relative mt-2">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground">
                    <HiUser size={16} />
                  </span>
                  <input
                    type="text"
                    id="ownerName"
                    name="ownerName"
                    value={formData.ownerName}
                    onChange={handleChange}
                    placeholder="Full legal name"
                    className="w-full rounded-2xl border border-border bg-surface pl-10 pr-4 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </div>
              </div>

              {/* GSTIN / Tax ID */}
              <div>
                <label
                  htmlFor="gstin"
                  className="block text-sm font-medium text-foreground"
                >
                  GSTIN / Tax ID
                </label>
                <div className="relative mt-2">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground">
                    <HiIdentification size={16} />
                  </span>
                  <input
                    type="text"
                    id="gstin"
                    name="gstin"
                    value={formData.gstin}
                    onChange={handleChange}
                    maxLength={15}
                    placeholder="e.g. 27AAAAA0000A1Z5"
                    className="w-full rounded-2xl border border-border bg-surface pl-10 pr-4 py-2.5 text-sm text-foreground placeholder-muted-foreground uppercase outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </div>
              </div>

              {/* Official Billing Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-foreground"
                >
                  Billing Email
                </label>
                <div className="relative mt-2">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground">
                    <HiMail size={16} />
                  </span>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="billing@company.com"
                    className="w-full rounded-2xl border border-border bg-surface pl-10 pr-4 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </div>
              </div>

              {/* Contact Phone */}
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-foreground"
                >
                  Contact Phone
                </label>
                <div className="relative mt-2">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground">
                    <HiPhone size={16} />
                  </span>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    maxLength={10}
                    placeholder="10-digit mobile number"
                    className="w-full rounded-2xl border border-border bg-surface pl-10 pr-4 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </div>
              </div>

              {/* Website */}
              <div className="md:col-span-2">
                <label
                  htmlFor="website"
                  className="block text-sm font-medium text-foreground"
                >
                  Website URL
                </label>
                <div className="relative mt-2">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground">
                    <HiGlobeAlt size={16} />
                  </span>
                  <input
                    type="url"
                    id="website"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="https://example.com"
                    className="w-full rounded-2xl border border-border bg-surface pl-10 pr-4 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </div>
              </div>

              {/* Registered Address */}
              <div className="md:col-span-2">
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-foreground"
                >
                  Registered Business Address
                </label>
                <div className="relative mt-2">
                  <span className="pointer-events-none absolute top-3 left-3.5 text-muted-foreground">
                    <HiLocationMarker size={16} />
                  </span>
                  <textarea
                    id="address"
                    name="address"
                    rows={3}
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Street, Building, City, State, PIN code"
                    className="w-full rounded-2xl border border-border bg-surface pl-10 pr-4 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3. Bank & Remittance Details */}
          <div className="rounded-24px border border-border bg-surface-elevated p-6 shadow-sm">
            <div className="flex items-center gap-2.5 mb-1">
              <HiCreditCard size={20} className="text-primary" />
              <h2 className="text-base font-semibold text-foreground sm:text-lg">
                Bank & Payment Remittance
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mb-6">
              These details are printed on invoices so customers can send direct bank/NEFT/RTGS transfers.
            </p>

            <div className="grid gap-4 md:grid-cols-3">
              {/* Bank Name */}
              <div>
                <label
                  htmlFor="bankName"
                  className="block text-sm font-medium text-foreground"
                >
                  Bank Name
                </label>
                <input
                  type="text"
                  id="bankName"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleChange}
                  placeholder="e.g. HDFC Bank Ltd"
                  className="mt-2 w-full rounded-2xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </div>

              {/* Account Number */}
              <div>
                <label
                  htmlFor="accountNumber"
                  className="block text-sm font-medium text-foreground"
                >
                  Account Number
                </label>
                <input
                  type="text"
                  id="accountNumber"
                  name="accountNumber"
                  value={formData.accountNumber}
                  onChange={handleChange}
                  placeholder="e.g. 50100234567890"
                  className="mt-2 w-full rounded-2xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </div>

              {/* IFSC Code */}
              <div>
                <label
                  htmlFor="ifscCode"
                  className="block text-sm font-medium text-foreground"
                >
                  IFSC / Branch Code
                </label>
                <input
                  type="text"
                  id="ifscCode"
                  name="ifscCode"
                  value={formData.ifscCode}
                  onChange={handleChange}
                  maxLength={11}
                  placeholder="e.g. HDFC0001234"
                  className="mt-2 w-full rounded-2xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground uppercase outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </div>
            </div>
          </div>

          {/* Form Action Controls */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleDiscard}
              disabled={saving}
              className="w-full sm:w-auto rounded-full border border-border bg-surface-elevated px-6 py-2.5 text-sm font-medium text-foreground shadow-xs transition hover:bg-surface disabled:opacity-50"
            >
              Discard Changes
            </button>
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary-hover disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  <span>Saving Profile...</span>
                </>
              ) : (
                <>
                  <HiCheck size={18} />
                  <span>Save Profile</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
