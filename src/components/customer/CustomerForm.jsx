import { IoClose } from "react-icons/io5";
import { useState, useEffect } from "react";
import { createCustomer, updateCustomer } from "../../firebase/customer";
import { useAuth } from "../../contexts/authContext/useAuth";
import { toast } from "react-hot-toast";
import ImageUploader from "../ImageUploader";

export default function CustomerModal({ onClose, customer }) {
  const { currentUser } = useAuth();
  const isEditMode = !!customer;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    profile: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    if (isEditMode) {
      setFormData({
        name: customer.name || customer.full_name || "",
        email: customer.email || "",
        profile: customer.profile || "",
        phone: customer.phone || customer.phone_number || "",
        address: customer.address || "",
      });
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
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (url) => {
    setFormData((prev) => ({
      ...prev,
      profile: url,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error("Please fill in the required fields.");
      return;
    }

    if (!validatePhoneNumber(formData.phone)) return;

    try {
      const targetUid = currentUser?.uid || currentUser?.id || currentUser?.clerkUser?.id;
      if (!targetUid) {
        toast.error("User authentication required to save customer.");
        return;
      }

      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: String(formData.phone).trim(),
        address: formData.address.trim(),
        profile: formData.profile || "",
        userId: targetUid,
      };

      if (!isEditMode) {
        await createCustomer(payload, setLoading, targetUid);
        toast.success("Customer added successfully!");
      } else {
        await updateCustomer(customer.id, payload, setLoading, targetUid);
        toast.success("Customer updated successfully!");
      }
      onClose();
    } catch (error) {
      toast.error(
        error?.message || `Something went wrong while ${isEditMode ? "updating" : "saving"} the customer.`
      );
      console.error("Error saving customer:", error);
    } 
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-2xl rounded-24px border border-border bg-surface-elevated shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-5">
          <h3 className="text-xl font-semibold text-foreground">
            {isEditMode ? "Update Customer Details" : "Add New Customer"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground transition hover:bg-surface hover:text-foreground"
          >
            <IoClose size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5">
          <ImageUploader
            onUpload={handleImageUpload}
            currentImage={formData.profile}
          />

          {/* Form Fields */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label
                htmlFor="name"
                className="text-sm font-medium text-foreground"
              >
                Full Name
              </label>
              <input
                type="text"
                name="name"
                id="name"
                value={formData.name}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-border bg-surface px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                placeholder="Alex John"
                required
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="text-sm font-medium text-foreground"
              >
                Email
              </label>
              <input
                type="email"
                name="email"
                id="email"
                value={formData.email}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-border bg-surface px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                placeholder="abc@mail.com"
                required
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="text-sm font-medium text-foreground"
              >
                Phone Number
              </label>
              <input
                type="tel"
                pattern="[0-9]{10}"
                title="Enter a 10-digit phone number"
                name="phone"
                id="phone"
                value={formData.phone}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-border bg-surface px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                placeholder="10-digit number"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="address"
                className="text-sm font-medium text-foreground"
              >
                Address
              </label>
              <textarea
                id="address"
                rows="3"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-border bg-surface px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                placeholder="Customer address"
              />
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
      </div>
    </div>
  );
}
