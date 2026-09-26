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
    full_name: "",
    email: "",
    profile: "",
    phone_number: "",
    address: "",
  });

  useEffect(() => {
    if (isEditMode) {
      setFormData({
        full_name: customer.full_name || customer.name || "",
        email: customer.email || "",
        profile: customer.profile || "",
        phone_number: customer.phone_number || customer.phone || "",
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

    if (!formData.full_name.trim() || !formData.email.trim()) {
      toast.error("Please fill in the required fields.");
      return;
    }

    if (!validatePhoneNumber(formData.phone_number)) return;

    try {
      const payload = {
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        phone_number: String(formData.phone_number).trim(),
        address: formData.address.trim(),
        profile: formData.profile || "",
        userId: currentUser?.uid,
      };

      if (!isEditMode) {
        await createCustomer(payload, setLoading, currentUser?.uid);
        toast.success("Customer added successfully!");
      } else {
        await updateCustomer(customer.id, payload, setLoading);
        toast.success("Customer updated successfully!");
      }
      onClose();
    } catch (error) {
      toast.error(
        `Something went wrong while ${isEditMode ? "updating" : "saving"} the customer.`,
      );
      console.error(error);
    } 
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="w-full max-w-2xl rounded-[24px] border border-slate-200 bg-white shadow-2xl">
        {/* Modern Clean Header */}
        <div className="flex items-center justify-between border-b border-slate-200 p-5">
          <h3 className="text-xl font-semibold text-slate-900">
            {isEditMode ? "Update Customer Details" : "Add New Customer"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100"
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
                htmlFor="full_name"
                className="text-sm font-medium text-slate-700"
              >
                Full name
              </label>
              <input
                type="text"
                name="full_name"
                id="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:bg-white"
                placeholder="Alex John"
                required
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="text-sm font-medium text-slate-700"
              >
                Email
              </label>
              <input
                type="email"
                name="email"
                id="email"
                value={formData.email}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:bg-white"
                placeholder="abc@mail.com"
                required
              />
            </div>

            <div>
              <label
                htmlFor="phone_number"
                className="text-sm font-medium text-slate-700"
              >
                Phone number
              </label>
              <input
                type="tel"
                pattern="[0-9]{10}"
                title="Enter a 10-digit phone number"
                name="phone_number"
                id="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:bg-white"
                placeholder="10-digit number"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="address"
                className="text-sm font-medium text-slate-700"
              >
                Address
              </label>
              <textarea
                id="address"
                rows="3"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:bg-white"
                placeholder="Customer address"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-2xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
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
