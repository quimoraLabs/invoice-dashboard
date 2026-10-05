import React, { useState } from "react";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import toast from "react-hot-toast";
import { HiX, HiBriefcase } from "react-icons/hi";

export default function CreateWorkspaceModal({ isOpen, onClose }) {
  const { createNewWorkspace } = useWorkspace();
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a workspace name.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createNewWorkspace(name);
      setName("");
      onClose();
    } catch (err) {
      console.error("Create workspace error:", err);
      toast.error(err?.message || "Failed to create workspace.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-2xl bg-surface-elevated border border-border shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-muted text-primary">
              <HiBriefcase size={22} />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                New Business Workspace
              </h3>
              <p className="text-xs text-muted-foreground">
                Create an isolated team workspace
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface hover:text-foreground transition"
          >
            <HiX size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Business / Company Name
              </label>
              <input
                type="text"
                placeholder="e.g. Acme Tech Solutions"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
                className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 border-t border-border px-6 py-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-surface hover:text-foreground transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary-hover disabled:opacity-50 transition"
            >
              {isSubmitting ? "Creating..." : "Create Workspace"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
