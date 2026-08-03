import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState } from "react";

export default function UpdateStatusModal({
  isOpen,
  setIsOpen,
  invoice,
  onSave,
}) {
  const [status, setStatus] = useState(invoice?.status || "Paid");
  const [method, setMethod] = useState("");

  const handleSave = () => {
    if (status === "Paid" && !method) {
      alert("Payment method chuno bhai!");
      return;
    }
    onSave({
      id: invoice.id,
      status,
      paymentMethod: status === "Paid" ? method : null,
    });
    setIsOpen(false);
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog onClose={() => setIsOpen(false)} className="relative z-50">
        {/* Backdrop overlay */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>

        {/* Modal Center Container */}
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
              <Dialog.Title className="text-lg font-medium text-gray-900">
                Update Status for {invoice?.id}
              </Dialog.Title>

              {/* Status Radio / Select */}
              <div>
                <label className="text-sm text-gray-600 block mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-purple-600 outline-none"
                >
                  <option value="Paid">Paid</option>
                  <option value="Unpaid">Unpaid</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>

              {/* Conditional Payment Method Field */}
              {status === "Paid" && (
                <div>
                  <label className="text-sm text-gray-600 block mb-1">
                    Payment Method *
                  </label>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-purple-600 outline-none"
                  >
                    <option value="">Choose Method...</option>
                    <option value="UPI">UPI</option>
                    <option value="Card">Card</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 text-sm text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-md"
                >
                  Save Status
                </button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
