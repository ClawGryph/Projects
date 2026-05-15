export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = "Proceed",
    cancelLabel = "Cancel",
    confirmClassName = "bg-sky-500 hover:bg-sky-600",
    iconClassName = "bg-yellow-100",
    iconColor = "text-yellow-500",
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
                <div className="flex items-center gap-3 mb-3">
                    <div
                        className={`flex items-center justify-center w-10 h-10 rounded-full ${iconClassName}`}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={`h-5 w-5 ${iconColor}`}
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fillRule="evenodd"
                                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </div>
                    <h2 className="text-base font-semibold text-gray-800">
                        {title}
                    </h2>
                </div>
                <p className="text-sm text-gray-600 mb-5">{message}</p>
                <div className="flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-1.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 transition cursor-pointer"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-4 py-1.5 text-sm font-medium text-white rounded-md transition cursor-pointer ${confirmClassName}`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
