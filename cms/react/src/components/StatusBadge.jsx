export default function StatusBadge({ status, isEnded = false }) {
    const statusConfig = {
        completed: {
            bg: "bg-green-100",
            text: "text-green-700",
            label: "Completed",
            icon: (
                <svg
                    className="w-3 h-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                >
                    <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                    />
                </svg>
            ),
        },
        ongoing: {
            bg: "bg-blue-100",
            text: "text-blue-700",
            label: "Ongoing",
            icon: (
                <svg
                    className="w-3 h-3 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                >
                    <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                    ></circle>
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    ></path>
                </svg>
            ),
        },
        pending: {
            bg: "bg-yellow-100",
            text: "text-yellow-700",
            label: "Pending",
            icon: (
                <svg
                    className="w-3 h-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                >
                    <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                        clipRule="evenodd"
                    />
                </svg>
            ),
        },
    };

    let config = statusConfig[status?.toLowerCase()] || statusConfig.pending;

    // Override ongoing color if project is ended
    if (status?.toLowerCase() === "ongoing" && isEnded) {
        config = {
            ...config,
            bg: "bg-red-100",
            text: "text-red-700",
            label: "Ongoing",
        };
    }

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}
        >
            {config.icon}
            {config.label}
        </span>
    );
}
