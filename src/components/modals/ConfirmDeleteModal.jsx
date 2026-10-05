import { IoClose } from "react-icons/io5";

export default function ConfirmDeleteModal({ onClose, onConfirm, type }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-[24px] border border-border bg-surface-elevated p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-danger">Delete</p>
            <h3 className="mt-1 text-xl font-semibold text-foreground">Remove this {type}?</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-muted-foreground transition hover:bg-surface hover:text-foreground">
            <IoClose size={18} />
          </button>
        </div>

        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          This action will permanently remove the selected {type} from your records. You can’t undo it once it’s gone.
        </p>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            onClick={onClose}
            type="button"
            className="rounded-2xl border border-border px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-surface"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            type="button"
            className="rounded-2xl bg-danger px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 active:scale-95"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
