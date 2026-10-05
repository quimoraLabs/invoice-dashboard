import { IoClose } from "react-icons/io5";
import { useState, useEffect } from "react";
import { createProduct, updateProduct } from "../../firebase/product";
import { useAuth } from "../../contexts/authContext/useAuth";
import { toast } from "react-hot-toast";
import ImageUploader from "../ImageUploader";

export default function ProductModal({ onClose, product }) {
  const { currentUser } = useAuth();
  const isEditMode = !!product;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: 0,
    category: "",
    imageUrl: "",
  });

  useEffect(() => {
    if (isEditMode) {
      setFormData({
        title: product.title || "",
        description: product.description || "",
        price: product.price || 0,
        imageUrl: product.imageUrl || "",
        category: product.category || "",
      });
    }
  }, [isEditMode, product]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (url) => {
    setFormData((prev) => ({
      ...prev,
      imageUrl: url,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const targetUid = currentUser?.uid || currentUser?.id || currentUser?.clerkUser?.id;
      if (!targetUid) {
        toast.error("User authentication required to save product.");
        return;
      }

      const payload = {
        ...formData,
        userId: targetUid,
      };

      if (!isEditMode) {
        await createProduct(payload, setLoading, targetUid);
        toast.success("Product added successfully!");
      } else {
        await updateProduct(product.id, payload, setLoading, targetUid);
        toast.success("Product updated successfully!");
      }
      onClose();
    } catch (error) {
      toast.error(
        error?.message ||
        `Something went wrong while ${
          isEditMode ? "updating" : "saving"
        } the product.`
      );
      console.error("Error saving product:", error);
    }
  };


  return (
    <div
      id="crud-modal"
      tabIndex={-1}
      aria-hidden="true"
      className="fixed inset-0 z-50 flex justify-center items-center bg-black/40 backdrop-blur-sm transition-all duration-200"
    >
      <div className="relative p-4 w-full max-w-md max-h-[90vh] overflow-y-auto scrollbar-thin scroll-smooth animate-in fade-in zoom-in-95 duration-200">
        {/* Modal content */}
        <div className="relative bg-surface-elevated rounded-2xl shadow-xl border border-border">
          {/* Modal header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h3 className="text-lg font-semibold text-foreground">
              {isEditMode ? "Update Product" : "New Product"}
            </h3>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-muted-foreground hover:bg-surface hover:text-foreground transition-colors"
            >
              <IoClose className="text-xl" title="close" />
            </button>
          </div>

          {/* Modal body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Title Input */}
            <ImageUploader
              onUpload={handleImageUpload}
              currentImage={formData?.imageUrl}
            />
            <div>
              <label
                htmlFor="title"
                className="block mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Title
              </label>
              <input
                type="text"
                name="title"
                id="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full bg-surface border border-border text-foreground text-sm rounded-xl px-3 py-2.5 outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 placeholder:text-muted-foreground"
                placeholder="Tomato"
                required
              />
            </div>

            {/* Description Input */}
            <div>
              <label
                htmlFor="description"
                className="block mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Description
              </label>
              <textarea
                name="description"
                id="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                className="w-full bg-surface border border-border text-foreground text-sm rounded-xl px-3 py-2.5 outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 placeholder:text-muted-foreground resize-none"
                placeholder="product stock location"
                required
              />
            </div>
            {/* Category Input */}
            <div>
              <label
                htmlFor="category"
                className="block mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Category
              </label>
              <select
                name="category"
                id="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full bg-surface border border-border text-foreground text-sm rounded-xl px-3 py-2.5 outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
                required
              >
                <option value="" disabled>
                  Select a category
                </option>
                <option value="Design Services">Design Services</option>
                <option value="Development">Development</option>
                <option value="Marketing">Marketing</option>
                <option value="DevOps & Cloud">DevOps & Cloud</option>
                <option value="Branding">Branding</option>
                <option value="Database">Database</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Electronics">Electronics</option>
                <option value="Food">Food</option>
                <option value="Clothing">Clothing</option>
                <option value="Books">Books</option>
                <option value="Other">Other</option>
                {formData.category &&
                  ![
                    "Design Services",
                    "Development",
                    "Marketing",
                    "DevOps & Cloud",
                    "Branding",
                    "Database",
                    "Maintenance",
                    "Electronics",
                    "Food",
                    "Clothing",
                    "Books",
                    "Other",
                  ].includes(formData.category) && (
                    <option value={formData.category}>{formData.category}</option>
                  )}
              </select>
            </div>

            {/* Price Input */}
            <div>
              <label
                htmlFor="price"
                className="block mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Price (INR)
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-muted-foreground text-sm pointer-events-none">
                  ₹
                </span>
                <input
                  type="number"
                  maxLength={6}
                  title="price"
                  name="price"
                  id="price"
                  placeholder="140"
                  value={formData.price}
                  onChange={handleChange}
                  className="w-full bg-surface border border-border text-foreground text-sm rounded-xl pl-7 pr-3 py-2.5 outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
                  required
                />
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-surface rounded-xl transition-colors border border-border"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary-hover active:scale-95 rounded-xl transition-all shadow-sm"
              >
                {loading
                  ? isEditMode
                    ? "Updating..."
                    : "Saving..."
                  : isEditMode
                    ? "Update Product"
                    : "Save Product"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
