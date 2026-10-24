import React, { useState, useRef, useEffect } from "react";
import {
  Camera,
  Upload,
  Sparkles,
  Check,
  RefreshCw,
  X,
  FileText,
  AlertCircle,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { compressImageToBase64, extractReceiptData } from "../../utils/receiptScanner";

export default function CameraReceiptScannerModal({
  isOpen,
  onClose,
  onApply,
  mode = "invoice",
  allCustomers = [],
  allProducts = [],
}) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");

  const fileInputRef = useRef(null);
  const mobileCameraInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const stopCamera = React.useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  const resetState = React.useCallback(() => {
    setSelectedImage(null);
    setIsScanning(false);
    setExtractedData(null);
    setCameraError("");
    stopCamera();
  }, [stopCamera]);

  // Stop camera stream on unmount or close
  useEffect(() => {
    if (!isOpen) {
      resetState();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, resetState, stopCamera]);

  const startCamera = async () => {
    try {
      setCameraError("");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err) {
      console.warn("Desktop webcam unavailable, fallback to file input:", err);
      setCameraError("Camera access was blocked or is unavailable. Please upload an image instead.");
      setIsCameraActive(false);
    }
  };

  const captureDesktopFrame = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);

    stopCamera();
    setSelectedImage(dataUrl);
    processScan(dataUrl);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file (JPG, PNG, WebP).");
      return;
    }

    try {
      const base64 = await compressImageToBase64(file);
      setSelectedImage(base64);
      processScan(base64);
    } catch (err) {
      toast.error("Failed to process image: " + err.message);
    }
  };

  const processScan = async (imageBase64) => {
    setIsScanning(true);
    setExtractedData(null);
    try {
      const data = await extractReceiptData(imageBase64, mode);

      if (mode === "customer") {
        setExtractedData({
          name: data.name || "",
          companyName: data.companyName || "",
          phone: data.phone || "",
          email: data.email || "",
          gstin: data.gstin || "",
          address: data.address || "",
        });
        toast.success("Business document scanned & details extracted!");
      } else if (mode === "product") {
        setExtractedData({
          title: data.title || "",
          price: Number(data.price) || 0,
          category: data.category || "Other",
          hsn: data.hsn || "",
          taxRate: Number(data.taxRate) || 18,
          description: data.description || "",
        });
        toast.success("Product label / price tag scanned!");
      } else {
        // Attempt matching with existing customer in workspace
        let matchedClient = null;
        if (data.clientName && allCustomers.length > 0) {
          const query = data.clientName.toLowerCase();
          matchedClient = allCustomers.find(
            (c) =>
              (c.name || c.full_name || "").toLowerCase().includes(query) ||
              (c.customerCode || "").toLowerCase() === query
          );
        }

        setExtractedData({
          clientName: matchedClient?.name || data.clientName || "",
          clientEmail: matchedClient?.email || data.clientEmail || "",
          clientPhone: matchedClient?.phone || data.clientPhone || "",
          clientId: matchedClient?.id || "",
          invoiceDate: data.invoiceDate || new Date().toISOString().split("T")[0],
          invoiceNumber: data.invoiceNumber || "",
          paymentType: data.paymentType || "UPI",
          taxRate: Number(data.taxRate) || 18,
          items: (data.items || []).map((item) => {
            const matchedProd = allProducts.find(
              (p) =>
                (p.title || "").toLowerCase() === (item.title || "").toLowerCase() ||
                (p.itemCode || "").toLowerCase() === (item.title || "").toLowerCase()
            );
            return {
              id: matchedProd?.id || "",
              title: matchedProd?.title || item.title || "Custom Item",
              quantity: Number(item.quantity) || 1,
              price: Number(item.price) || Number(matchedProd?.price) || 0,
              taxRate: Number(item.taxRate) || 18,
            };
          }),
        });
        toast.success("Receipt scanned and line items extracted!");
      }
    } catch (err) {
      toast.error("Scan failed: " + err.message);
    } finally {
      setIsScanning(false);
    }
  };

  const handleApply = () => {
    if (!extractedData) return;
    onApply(extractedData, selectedImage);
    toast.success("Data applied successfully!");
    onClose();
  };

  const updateItemField = (index, field, val) => {
    setExtractedData((prev) => {
      const copy = [...prev.items];
      copy[index] = { ...copy[index], [field]: val };
      return { ...prev, items: copy };
    });
  };

  const removeItem = (index) => {
    setExtractedData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const addNewItem = () => {
    setExtractedData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { id: "", title: "New Item", quantity: 1, price: 0, taxRate: 18 },
      ],
    }));
  };

  if (!isOpen) return null;

  const headerTitle =
    mode === "customer"
      ? "AI Visiting Card & Business Card Scanner"
      : mode === "product"
      ? "AI Product & Price Tag Scanner"
      : "AI Receipt & Invoice Scanner";

  const headerSubtitle =
    mode === "customer"
      ? "Snap a photo of a business card, letterhead, or GST doc to extract customer info."
      : mode === "product"
      ? "Snap a photo of an item, price tag, or barcode to extract product details."
      : "Take a photo or upload a paper receipt to extract line items directly.";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border p-4 sm:p-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">
                {headerTitle}
              </h3>
              <p className="text-xs text-muted-foreground">
                {headerSubtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface-elevated hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Action Choice: No image selected yet */}
          {!selectedImage && !isCameraActive && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Mobile / Native Camera Button */}
                <button
                  type="button"
                  onClick={() => mobileCameraInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-6 sm:p-8 text-center transition hover:border-primary hover:bg-primary/10 active:scale-98"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                    <Camera size={24} />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-foreground block">
                      Snap Photo (Camera)
                    </span>
                    <span className="text-xs text-muted-foreground mt-0.5 block">
                      Opens device camera with autofocus
                    </span>
                  </div>
                </button>

                {/* File Upload Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-surface-elevated p-6 sm:p-8 text-center transition hover:border-primary hover:bg-primary/5 active:scale-98"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface border border-border text-foreground shadow-xs">
                    <Upload size={24} />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-foreground block">
                      Upload Image / File
                    </span>
                    <span className="text-xs text-muted-foreground mt-0.5 block">
                      JPG, PNG, or WebP photo/document
                    </span>
                  </div>
                </button>
              </div>

              {/* Desktop Webcam Fallback Option */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={startCamera}
                  className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1.5"
                >
                  <Camera size={14} />
                  Or open desktop webcam viewfinder
                </button>
              </div>

              {cameraError && (
                <div className="flex items-center gap-2 p-3 rounded-xl border border-warning/30 bg-warning/5 text-warning text-xs">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{cameraError}</span>
                </div>
              )}

              {/* Hidden file inputs */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />
              <input
                type="file"
                ref={mobileCameraInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                capture="environment"
                className="hidden"
              />
            </div>
          )}

          {/* Desktop Webcam Live Stream */}
          {isCameraActive && (
            <div className="flex flex-col items-center gap-4">
              <div className="relative w-full max-w-md aspect-4/3 rounded-2xl overflow-hidden bg-black border border-border">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-x-4 top-4 flex justify-between items-center">
                  <span className="rounded-lg bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-xs">
                    Point camera at document or product
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={captureDesktopFrame}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary-hover active:scale-95"
                >
                  <Camera size={16} />
                  Capture Photo
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground hover:bg-surface-elevated"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Image Captured & Scanner View */}
          {selectedImage && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                {/* Thumbnail Preview */}
                <div className="relative w-full sm:w-48 aspect-3/4 rounded-xl overflow-hidden border border-border bg-black/5 shrink-0 group">
                  <img
                    src={selectedImage}
                    alt="Captured preview"
                    className="w-full h-full object-contain"
                  />
                  {isScanning && (
                    <div className="absolute inset-0 bg-primary/20 flex flex-col items-center justify-center gap-2 backdrop-blur-2xs">
                      <RefreshCw size={24} className="animate-spin text-primary" />
                      <span className="text-xs font-semibold text-foreground bg-surface/90 px-2 py-0.5 rounded-md shadow-xs">
                        Scanning with AI...
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions / Status summary */}
                <div className="flex-1 space-y-3 w-full">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <FileText size={14} />
                      Photo Captured
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedImage(null);
                        setExtractedData(null);
                      }}
                      className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                    >
                      <RefreshCw size={12} />
                      Retake / Change
                    </button>
                  </div>

                  {isScanning && (
                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center space-y-1">
                      <p className="text-xs font-medium text-primary">
                        Analyzing photo with AI engine...
                      </p>
                      <p className="text-2xs text-muted-foreground">
                        Extracting structured master data fields.
                      </p>
                    </div>
                  )}

                  {/* Customer Review Fields */}
                  {extractedData && mode === "customer" && (
                    <div className="space-y-2 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="rounded-lg border border-border bg-surface-elevated p-2">
                          <label className="text-2xs text-muted-foreground block font-medium">Contact Person Name</label>
                          <input
                            type="text"
                            value={extractedData.name}
                            onChange={(e) => setExtractedData((p) => ({ ...p, name: e.target.value }))}
                            className="w-full bg-transparent font-medium text-foreground outline-hidden"
                            placeholder="Full Name"
                          />
                        </div>
                        <div className="rounded-lg border border-border bg-surface-elevated p-2">
                          <label className="text-2xs text-muted-foreground block font-medium">Company Name</label>
                          <input
                            type="text"
                            value={extractedData.companyName}
                            onChange={(e) => setExtractedData((p) => ({ ...p, companyName: e.target.value }))}
                            className="w-full bg-transparent font-medium text-foreground outline-hidden"
                            placeholder="Company Name"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="rounded-lg border border-border bg-surface-elevated p-2">
                          <label className="text-2xs text-muted-foreground block font-medium">Phone Number</label>
                          <input
                            type="text"
                            value={extractedData.phone}
                            onChange={(e) => setExtractedData((p) => ({ ...p, phone: e.target.value }))}
                            className="w-full bg-transparent font-medium text-foreground outline-hidden"
                            placeholder="10-digit Phone"
                          />
                        </div>
                        <div className="rounded-lg border border-border bg-surface-elevated p-2">
                          <label className="text-2xs text-muted-foreground block font-medium">Email</label>
                          <input
                            type="email"
                            value={extractedData.email}
                            onChange={(e) => setExtractedData((p) => ({ ...p, email: e.target.value }))}
                            className="w-full bg-transparent font-medium text-foreground outline-hidden"
                            placeholder="Email address"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="rounded-lg border border-border bg-surface-elevated p-2">
                          <label className="text-2xs text-muted-foreground block font-medium">GSTIN</label>
                          <input
                            type="text"
                            value={extractedData.gstin}
                            onChange={(e) => setExtractedData((p) => ({ ...p, gstin: e.target.value }))}
                            className="w-full bg-transparent font-medium text-foreground outline-hidden uppercase"
                            placeholder="GSTIN"
                          />
                        </div>
                        <div className="rounded-lg border border-border bg-surface-elevated p-2">
                          <label className="text-2xs text-muted-foreground block font-medium">Address</label>
                          <input
                            type="text"
                            value={extractedData.address}
                            onChange={(e) => setExtractedData((p) => ({ ...p, address: e.target.value }))}
                            className="w-full bg-transparent font-medium text-foreground outline-hidden"
                            placeholder="Full Address"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Product Review Fields */}
                  {extractedData && mode === "product" && (
                    <div className="space-y-2 text-xs">
                      <div className="rounded-lg border border-border bg-surface-elevated p-2">
                        <label className="text-2xs text-muted-foreground block font-medium">Product Title</label>
                        <input
                          type="text"
                          value={extractedData.title}
                          onChange={(e) => setExtractedData((p) => ({ ...p, title: e.target.value }))}
                          className="w-full bg-transparent font-medium text-foreground outline-hidden"
                          placeholder="Product Name"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div className="rounded-lg border border-border bg-surface-elevated p-2">
                          <label className="text-2xs text-muted-foreground block font-medium">Selling Price (₹)</label>
                          <input
                            type="number"
                            value={extractedData.price}
                            onChange={(e) => setExtractedData((p) => ({ ...p, price: Number(e.target.value) }))}
                            className="w-full bg-transparent font-medium text-foreground outline-hidden"
                          />
                        </div>
                        <div className="rounded-lg border border-border bg-surface-elevated p-2">
                          <label className="text-2xs text-muted-foreground block font-medium">Category</label>
                          <input
                            type="text"
                            value={extractedData.category}
                            onChange={(e) => setExtractedData((p) => ({ ...p, category: e.target.value }))}
                            className="w-full bg-transparent font-medium text-foreground outline-hidden"
                          />
                        </div>
                        <div className="rounded-lg border border-border bg-surface-elevated p-2">
                          <label className="text-2xs text-muted-foreground block font-medium">HSN Code</label>
                          <input
                            type="text"
                            value={extractedData.hsn}
                            onChange={(e) => setExtractedData((p) => ({ ...p, hsn: e.target.value }))}
                            className="w-full bg-transparent font-medium text-foreground outline-hidden uppercase"
                          />
                        </div>
                      </div>
                      <div className="rounded-lg border border-border bg-surface-elevated p-2">
                        <label className="text-2xs text-muted-foreground block font-medium">Description</label>
                        <input
                          type="text"
                          value={extractedData.description}
                          onChange={(e) => setExtractedData((p) => ({ ...p, description: e.target.value }))}
                          className="w-full bg-transparent font-medium text-foreground outline-hidden"
                          placeholder="Description"
                        />
                      </div>
                    </div>
                  )}

                  {/* Invoice Review Fields */}
                  {extractedData && mode === "invoice" && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="rounded-lg border border-border bg-surface-elevated p-2">
                          <label className="text-2xs text-muted-foreground block font-medium">Customer / Client</label>
                          <input
                            type="text"
                            value={extractedData.clientName}
                            onChange={(e) =>
                              setExtractedData((p) => ({ ...p, clientName: e.target.value }))
                            }
                            className="w-full bg-transparent font-medium text-foreground outline-hidden"
                            placeholder="Enter customer name"
                          />
                        </div>
                        <div className="rounded-lg border border-border bg-surface-elevated p-2">
                          <label className="text-2xs text-muted-foreground block font-medium">Invoice Date</label>
                          <input
                            type="date"
                            value={extractedData.invoiceDate}
                            onChange={(e) =>
                              setExtractedData((p) => ({ ...p, invoiceDate: e.target.value }))
                            }
                            className="w-full bg-transparent font-medium text-foreground outline-hidden"
                          />
                        </div>
                      </div>

                      {/* Extracted Line Items List */}
                      <div className="border border-border rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between bg-surface-elevated px-3 py-2 border-b border-border text-xs font-medium text-muted-foreground">
                          <span>Extracted Items ({extractedData.items.length})</span>
                          <button
                            type="button"
                            onClick={addNewItem}
                            className="text-primary hover:underline inline-flex items-center gap-1 text-2xs"
                          >
                            <Plus size={12} />
                            Add Item
                          </button>
                        </div>
                        <div className="divide-y divide-border/60 max-h-48 overflow-y-auto">
                          {extractedData.items.map((item, idx) => (
                            <div key={idx} className="p-2.5 flex items-center gap-2 text-xs">
                              <input
                                type="text"
                                value={item.title}
                                onChange={(e) => updateItemField(idx, "title", e.target.value)}
                                className="flex-1 bg-surface-elevated border border-border rounded-lg px-2 py-1 text-foreground"
                                placeholder="Item title"
                              />
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) =>
                                  updateItemField(idx, "quantity", Number(e.target.value))
                                }
                                className="w-16 bg-surface-elevated border border-border rounded-lg px-2 py-1 text-foreground text-center"
                                placeholder="Qty"
                              />
                              <input
                                type="number"
                                min="0"
                                value={item.price}
                                onChange={(e) =>
                                  updateItemField(idx, "price", Number(e.target.value))
                                }
                                className="w-20 bg-surface-elevated border border-border rounded-lg px-2 py-1 text-foreground text-right"
                                placeholder="Price ₹"
                              />
                              <button
                                type="button"
                                onClick={() => removeItem(idx)}
                                className="text-danger hover:text-danger/80 p-1 rounded-md"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-border p-4 bg-surface-elevated">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border px-4 py-2 text-xs font-medium text-foreground hover:bg-surface"
          >
            Cancel
          </button>

          {extractedData && (
            <button
              type="button"
              onClick={handleApply}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary-hover active:scale-95"
            >
              <Check size={14} />
              {mode === "customer"
                ? "Apply to Customer"
                : mode === "product"
                ? "Apply to Product"
                : "Apply to Invoice"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
