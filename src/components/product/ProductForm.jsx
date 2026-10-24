import { X, Package, FileSpreadsheet, Camera, Sparkles, Zap } from "lucide-react";
import { useState, useEffect } from "react";
import { createProduct, updateProduct } from "../../firebase/product";
import { useAuth } from "../../contexts/authContext/useAuth";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import { toast } from "react-hot-toast";
import ImageUploader from "../ImageUploader";
import CustomDropdown from "../CustomDropdown";
import BulkImportView from "../BulkImportView";
import CameraReceiptScannerModal from "../invoice/CameraReceiptScannerModal";
import { generateUniqueCode } from "../../utils/excelHelper";

const CATEGORY_OPTIONS = [
  { value: "Design Services", label: "Design Services" },
  { value: "Development", label: "Development" },
  { value: "Marketing", label: "Marketing" },
  { value: "DevOps & Cloud", label: "DevOps & Cloud" },
  { value: "Branding", label: "Branding" },
  { value: "Database", label: "Database" },
  { value: "Maintenance", label: "Maintenance" },
  { value: "Electronics", label: "Electronics" },
  { value: "Food", label: "Food" },
  { value: "Clothing", label: "Clothing" },
  { value: "Books", label: "Books" },
  { value: "Other", label: "Other" },
];

const UNIT_OPTIONS = [
  { value: "Pcs", label: "Pcs (Pieces)" },
  { value: "Hours", label: "Hours (Hourly)" },
  { value: "Days", label: "Days (Daily)" },
  { value: "Month", label: "Month (Monthly)" },
  { value: "Project", label: "Project (Fixed / Milestone)" },
  { value: "Box", label: "Box" },
  { value: "Kg", label: "Kg (Kilogram)" },
  { value: "License", label: "License" },
  { value: "Units", label: "Units" },
];

const TAX_RATE_OPTIONS = [
  { value: 0, label: "0% GST (Exempted / Nil)" },
  { value: 5, label: "5% GST" },
  { value: 12, label: "12% GST" },
  { value: 18, label: "18% GST (Standard)" },
  { value: 28, label: "28% GST" },
];

export default function ProductModal({ onClose, product }) {
  const { currentUser } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const isEditMode = !!product;
  const [entryMode, setEntryMode] = useState("single");
  const [loading, setLoading] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    itemCode: "",
    title: "",
    type: "Product",
    description: "",
    price: 0,
    costPrice: 0,
    taxRate: 18,
    hsn: "",
    unit: "Pcs",
    stockQuantity: 0,
    category: "",
    imageUrl: "",
  });

  useEffect(() => {
    if (isEditMode) {
      setFormData({
        itemCode: product.itemCode || "",
        title: product.title || "",
        type: product.type || "Product",
        description: product.description || "",
        price: product.price || 0,
        costPrice: product.costPrice || 0,
        taxRate: product.taxRate ?? 18,
        hsn: product.hsn || product.sac || "",
        unit: product.unit || (product.type === "Service" ? "Hours" : "Pcs"),
        stockQuantity: product.stockQuantity || 0,
        imageUrl: product.imageUrl || "",
        category: product.category || "",
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        itemCode: generateUniqueCode(prev.type === "Service" ? "SRV" : "PRD"),
      }));
    }
  }, [isEditMode, product]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTypeChange = (newType) => {
    setFormData((prev) => ({
      ...prev,
      type: newType,
      unit: newType === "Service" ? "Hours" : "Pcs",
      itemCode: isEditMode
        ? prev.itemCode
        : generateUniqueCode(newType === "Service" ? "SRV" : "PRD"),
    }));
  };

  const handleImageUpload = (url) => {
    setFormData((prev) => ({
      ...prev,
      imageUrl: url,
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

    if (!formData.title.trim()) {
      toast.error("Please enter a title/name for the item.");
      return;
    }

    try {
      if (!targetUid && !workspaceId) {
        toast.error("User authentication required to save product.");
        return;
      }

      const payload = {
        itemCode: formData.itemCode || generateUniqueCode(formData.type === "Service" ? "SRV" : "PRD"),
        title: formData.title.trim(),
        type: formData.type,
        category: formData.category || "Other",
        price: Number(formData.price) || 0,
        costPrice: Number(formData.costPrice) || 0,
        taxRate: Number(formData.taxRate) || 18,
        hsn: (formData.hsn || "").trim(),
        unit: formData.unit,
        stockQuantity: formData.type === "Service" ? 0 : Number(formData.stockQuantity) || 0,
        description: (formData.description || "").trim(),
        imageUrl: formData.imageUrl || "",
      };
      if (targetUid) payload.userId = targetUid;
      if (workspaceId) payload.workspaceId = workspaceId;

      if (!isEditMode) {
        await createProduct(payload, setLoading, targetScope);
        toast.success(`${formData.type} added successfully!`);
      } else {
        await updateProduct(product.id, payload, setLoading, targetScope);
        toast.success(`${formData.type} updated successfully!`);
      }
      onClose();
    } catch (error) {
      toast.error(
        error?.message ||
        `Something went wrong while ${
          isEditMode ? "updating" : "saving"
        } the ${formData.type.toLowerCase()}.`
      );
      console.error("Error saving product:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="crud-modal"
      tabIndex={-1}
      aria-hidden="true"
      className="fixed inset-0 z-50 flex justify-center items-center bg-black/40 backdrop-blur-sm transition-all duration-200"
    >
      <div className="relative p-4 w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-thin scroll-smooth animate-in fade-in zoom-in-95 duration-200">
        {/* Modal content */}
        <div className="relative bg-surface-elevated rounded-2xl shadow-xl border border-border">
          {/* Modal header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h3 className="text-lg font-semibold text-foreground">
              {isEditMode ? "Update Product" : "Add Product"}
            </h3>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-muted-foreground hover:bg-surface hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
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
                <Package size={16} />
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
            <div className="p-6">
              <BulkImportView
                type="product"
                scope={targetScope}
                onSuccess={onClose}
                onCancel={onClose}
              />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Unique Code Badge & Scan Tag */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 rounded-xl bg-surface p-3 border border-border">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">Unique Item / SKU:</span>
                  <span className="font-mono text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20">
                    {formData.itemCode || "Generating..."}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCameraModalOpen(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground active:scale-95 shadow-2xs"
                >
                  <Camera size={14} />
                  Scan Product / Label (Camera / AI)
                </button>
              </div>

              {/* Type Switcher: Physical Product vs Professional Service */}
              <div>
                <label className="block mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Item Classification
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-surface rounded-xl border border-border">
                  <button
                    type="button"
                    onClick={() => handleTypeChange("Product")}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition ${
                      formData.type === "Product"
                        ? "bg-surface-elevated text-primary shadow-xs border border-border"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Package size={15} />
                    Physical Product
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTypeChange("Service")}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition ${
                      formData.type === "Service"
                        ? "bg-surface-elevated text-primary shadow-xs border border-border"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Zap size={15} />
                    Professional Service
                  </button>
                </div>
              </div>

              {/* Image Uploader */}
              <ImageUploader
                onUpload={handleImageUpload}
                currentImage={formData?.imageUrl}
                customFileName={formData.itemCode}
                folder="/invomora/products"
              />

              {/* Title & Category Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="title"
                    className="block mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    {formData.type === "Service" ? "Service Name *" : "Product Name *"}
                  </label>
                  <input
                    type="text"
                    name="title"
                    id="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full bg-surface border border-border text-foreground text-sm rounded-xl px-3 py-2.5 outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 placeholder:text-muted-foreground"
                    placeholder={formData.type === "Service" ? "e.g. Cloud Architecture Setup" : "e.g. Wireless Ergonomic Mouse"}
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="category"
                    className="block mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    Category
                  </label>
                  <CustomDropdown
                    value={formData.category}
                    onChange={(val) => setFormData((prev) => ({ ...prev, category: val }))}
                    options={
                      CATEGORY_OPTIONS.some((c) => c.value === formData.category)
                        ? CATEGORY_OPTIONS
                        : formData.category
                        ? [...CATEGORY_OPTIONS, { value: formData.category, label: formData.category }]
                        : CATEGORY_OPTIONS
                    }
                    placeholder="Select a category"
                    className="w-full"
                    buttonClassName="w-full !rounded-xl !py-2.5"
                  />
                </div>
              </div>

              {/* Pricing Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="price"
                    className="block mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    Selling Price (INR) *
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-muted-foreground text-sm pointer-events-none">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      name="price"
                      id="price"
                      placeholder="0.00"
                      value={formData.price}
                      onChange={handleChange}
                      className="w-full bg-surface border border-border text-foreground text-sm rounded-xl pl-7 pr-3 py-2.5 outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 font-medium"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="costPrice"
                    className="block mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    Cost Price (INR) <span className="text-[10px] text-muted-foreground font-normal">(Internal)</span>
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-muted-foreground text-sm pointer-events-none">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      name="costPrice"
                      id="costPrice"
                      placeholder="0.00"
                      value={formData.costPrice}
                      onChange={handleChange}
                      className="w-full bg-surface border border-border text-foreground text-sm rounded-xl pl-7 pr-3 py-2.5 outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
                    />
                  </div>
                </div>
              </div>

              {/* Tax & HSN/SAC Code Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="hsn"
                    className="block mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    {formData.type === "Service" ? "SAC Code (Services)" : "HSN Code (Goods)"}
                  </label>
                  <input
                    type="text"
                    name="hsn"
                    id="hsn"
                    value={formData.hsn}
                    onChange={handleChange}
                    className="w-full bg-surface border border-border text-foreground text-sm rounded-xl px-3 py-2.5 outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 placeholder:text-muted-foreground font-mono uppercase"
                    placeholder={formData.type === "Service" ? "e.g. 998314" : "e.g. 847130"}
                  />
                </div>

                <div>
                  <label
                    htmlFor="taxRate"
                    className="block mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    GST Tax Rate (%)
                  </label>
                  <CustomDropdown
                    value={formData.taxRate}
                    onChange={(val) => setFormData((prev) => ({ ...prev, taxRate: Number(val) }))}
                    options={TAX_RATE_OPTIONS}
                    placeholder="Select Tax Rate"
                    className="w-full"
                    buttonClassName="w-full !rounded-xl !py-2.5"
                  />
                </div>
              </div>

              {/* Unit & Inventory Stock Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="unit"
                    className="block mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    Measurement Unit
                  </label>
                  <CustomDropdown
                    value={formData.unit}
                    onChange={(val) => setFormData((prev) => ({ ...prev, unit: val }))}
                    options={UNIT_OPTIONS}
                    placeholder="Select Unit"
                    className="w-full"
                    buttonClassName="w-full !rounded-xl !py-2.5"
                  />
                </div>

                {formData.type === "Product" ? (
                  <div>
                    <label
                      htmlFor="stockQuantity"
                      className="block mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      Stock Quantity (In-Hand)
                    </label>
                    <input
                      type="number"
                      min="0"
                      name="stockQuantity"
                      id="stockQuantity"
                      value={formData.stockQuantity}
                      onChange={handleChange}
                      className="w-full bg-surface border border-border text-foreground text-sm rounded-xl px-3 py-2.5 outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 placeholder:text-muted-foreground"
                      placeholder="0"
                    />
                  </div>
                ) : (
                  <div className="flex items-center p-3 rounded-xl bg-surface/50 border border-border text-xs text-muted-foreground">
                    <span className="leading-relaxed">
                      ⚡ Services do not maintain physical inventory. Billing relies on units, hours, or milestones.
                    </span>
                  </div>
                )}
              </div>

              {/* Description Input */}
              <div>
                <label
                  htmlFor="description"
                  className="block mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Description & Specifications
                </label>
                <textarea
                  name="description"
                  id="description"
                  rows={2}
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full bg-surface border border-border text-foreground text-sm rounded-xl px-3 py-2.5 outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 placeholder:text-muted-foreground resize-none"
                  placeholder="Item specifications, scope of deliverables, or warranty info"
                />
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
                      ? `Update ${formData.type}`
                      : `Save ${formData.type}`}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <CameraReceiptScannerModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        mode="product"
        onApply={(extracted, imagePreview) => {
          setFormData((prev) => ({
            ...prev,
            title: extracted.title || prev.title,
            type: extracted.type || prev.type,
            price: extracted.price !== undefined ? Number(extracted.price) : prev.price,
            costPrice: extracted.costPrice !== undefined ? Number(extracted.costPrice) : prev.costPrice,
            taxRate: extracted.taxRate !== undefined ? Number(extracted.taxRate) : prev.taxRate,
            hsn: extracted.hsn || prev.hsn,
            unit: extracted.unit || prev.unit,
            stockQuantity: extracted.stockQuantity !== undefined ? Number(extracted.stockQuantity) : prev.stockQuantity,
            category: extracted.category || prev.category,
            description: extracted.description || prev.description,
            imageUrl: prev.imageUrl || imagePreview || "",
          }));
        }}
      />
    </div>
  );
}
