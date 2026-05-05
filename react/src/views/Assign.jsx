import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faPlus,
    faTrash,
    faPen,
    faDiagramProject,
    faTimes,
    faRotateRight,
    faLock,
} from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect } from "react";
import axiosClient from "../axios-client";
import { useStateContext } from "../context/ContextProvider";
import PaymentModal from "../components/PaymentModal";

export default function Assign() {
    const [assigns, setAssigns] = useState([]);
    const [meta, setMeta] = useState({});
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState("all");
    const { setNotification, user } = useStateContext();
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState(null);
    const [serviceModalOpen, setServiceModalOpen] = useState(false);
    const [selectedService, setSelectedService] = useState(null);
    const [editData, setEditData] = useState(null);
    const [renewData, setRenewData] = useState(null);
    const location = useLocation();

    useEffect(() => {
        getAssigns();
    }, []);

    useEffect(() => {
        if (location.state?.openService) {
            setSelectedService(location.state.openService);
            setServiceModalOpen(true);
            // Clear the state so it doesn't reopen on refresh
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    const getAssigns = (page = 1, refreshRenewId = null) => {
        setLoading(true);
        axiosClient
            .get(`/clients-projects?page=${page}`)
            .then(({ data }) => {
                setLoading(false);
                setAssigns(data.data);
                setMeta(data.meta);

                // Refresh renewData with updated subscription coverage dates
                if (refreshRenewId) {
                    const updated = data.data.find(
                        (a) => a.id === refreshRenewId,
                    );
                    if (updated) setRenewData(updated);
                }
            })
            .catch(() => setLoading(false));
    };

    const assignLink =
        filter === "projects"
            ? "/assign/project/new"
            : filter === "subscriptions"
              ? "/assign/subscription/new"
              : null;

    const assignLabel =
        filter === "projects"
            ? "Assign Project"
            : filter === "subscriptions"
              ? "Assign Subscription"
              : null;

    const filteredAssigns = assigns.filter((a) => {
        if (filter === "projects") return a.project !== null;
        if (filter === "subscriptions") return a.subscription !== null;
        return true; // all
    });

    const openModal = (mode) => {
        setModalMode(mode);
        setModalOpen(true);
    };

    const openEditModal = (a) => {
        const isProject = a.project !== null;
        setEditData(a);
        setModalMode(isProject ? "project" : "subscription");
        setModalOpen(true);
    };

    const openRenewModal = (a) => {
        setRenewData(a);
        setModalMode("subscription");
        setModalOpen(true);
    };

    // MODAL FOR VIEWING THE PAYMENT
    const openServiceModal = (assign) => {
        setSelectedService(assign);
        setServiceModalOpen(true);
    };

    const closeServiceModal = () => {
        setServiceModalOpen(false);
        setSelectedService(null);
    };

    const totalCount = assigns.length;
    const projectCount = assigns.filter((a) => a.project !== null).length;
    const subscriptionCount = assigns.filter(
        (a) => a.subscription !== null,
    ).length;

    const getCount = (tab) => {
        if (tab === "all") return totalCount;
        if (tab === "projects") return projectCount;
        if (tab === "subscriptions") return subscriptionCount;
    };

    const tableHeaders = [
        "Service",
        "Service Name",
        "Client Name",
        "Total Cost",
        "Start Date",
        "End Date",
        "Payment Type",
        "Actions",
    ];

    return (
        <>
            <div className="flex justify-between items-center p-5 mt-5">
                <h1 className="text-3xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                    Assign Service
                </h1>
                {user?.role_name !== "viewer" && (
                    <div className="flex gap-2">
                        {filter === "projects" && (
                            <button
                                onClick={() => openModal("project")}
                                className="flex items-center gap-1.5 bg-sky-400 hover:bg-sky-500 text-white text-sm font-medium px-3 py-1.5 rounded-md transition-colors"
                            >
                                <FontAwesomeIcon icon={faPlus} />
                                Assign Project
                            </button>
                        )}
                        {filter === "subscriptions" && (
                            <button
                                onClick={() => openModal("subscription")}
                                className="flex items-center gap-1.5 bg-sky-400 hover:bg-sky-500 text-white text-sm font-medium px-3 py-1.5 rounded-md transition-colors"
                            >
                                <FontAwesomeIcon icon={faPlus} />
                                Assign Subscription
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 px-5">
                {["all", "projects", "subscriptions"].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setFilter(tab)}
                        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-colors cursor-pointer ${
                            filter === tab
                                ? "bg-cyan-800 text-white"
                                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                    >
                        {tab === "all"
                            ? "All"
                            : tab.charAt(0).toUpperCase() + tab.slice(1)}
                        <span
                            className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                                filter === tab
                                    ? "bg-white text-cyan-800"
                                    : "bg-gray-100 text-gray-600"
                            }`}
                        >
                            {getCount(tab)}
                        </span>
                    </button>
                ))}
            </div>

            <div className="flex flex-col flex-1 min-h-0 justify-start items-center overflow-x-auto p-5">
                <div className="max-w-[1100px] w-full overflow-auto rounded-lg max-height">
                    <table className="w-full bg-white shadow-sm border-separate border-spacing-0">
                        <thead>
                            <tr className="bg-cyan-800">
                                {tableHeaders.map((header) => {
                                    if (
                                        header === "Actions" &&
                                        user?.role_name === "viewer"
                                    )
                                        return null;
                                    return (
                                        <th
                                            key={header}
                                            className="px-4 py-2 text-white text-sm font-medium"
                                        >
                                            {header}
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        {loading && (
                            <tbody>
                                <tr>
                                    <td
                                        colSpan={tableHeaders.length}
                                        className="text-center"
                                    >
                                        Loading...
                                    </td>
                                </tr>
                            </tbody>
                        )}
                        {!loading && (
                            <tbody>
                                {filteredAssigns.length > 0 ? (
                                    filteredAssigns.map((a) => {
                                        const isProject = a.project !== null;
                                        const serviceName = isProject
                                            ? a.project?.title
                                            : a.subscription?.title;
                                        const startDate = isProject
                                            ? a.project?.start_date
                                            : a.subscription?.start_coverage;
                                        const endDate = isProject
                                            ? a.project?.end_date
                                            : a.subscription?.end_coverage;

                                        return (
                                            <tr
                                                key={a.id}
                                                className="hover:bg-cyan-50 text-center"
                                            >
                                                <td className="border-b border-gray-200 px-4 py-2">
                                                    <span
                                                        className={`text-xs font-semibold px-2 py-0.5 rounded-full mr-2 ${
                                                            isProject
                                                                ? "bg-blue-100 text-blue-700"
                                                                : "bg-purple-100 text-purple-700"
                                                        }`}
                                                    >
                                                        {isProject
                                                            ? "Project"
                                                            : "Subscription"}
                                                    </span>
                                                </td>
                                                <td className="border-b border-gray-200 px-4 py-2">
                                                    <button
                                                        onClick={() =>
                                                            openServiceModal(a)
                                                        }
                                                        className="text-cyan-800 hover:text-cyan-600 font-medium hover:underline transition-colors"
                                                    >
                                                        {serviceName ?? "—"}
                                                    </button>
                                                </td>
                                                <td className="border-b border-gray-200 px-4 py-2">
                                                    {a.client?.name ?? "—"}
                                                </td>
                                                <td className="border-b border-gray-200 px-4 py-2">
                                                    ₱{" "}
                                                    {new Intl.NumberFormat(
                                                        "en-PH",
                                                    ).format(
                                                        a.final_price ?? 0,
                                                    )}
                                                </td>
                                                <td className="border-b border-gray-200 px-4 py-2">
                                                    {startDate ?? "—"}
                                                </td>
                                                <td className="border-b border-gray-200 px-4 py-2">
                                                    {endDate ?? "—"}
                                                </td>
                                                <td className="border-b border-gray-200 px-4 py-2 capitalize">
                                                    {a.payment?.payment_type ===
                                                    "recurring"
                                                        ? a.payment
                                                              ?.recurring_type
                                                        : a.payment
                                                              ?.payment_type}
                                                </td>
                                                {user?.role_name !==
                                                    "viewer" && (
                                                    <td className="border-b border-gray-200 px-4 py-3 flex justify-center items-center gap-2">
                                                        <button
                                                            onClick={() =>
                                                                openEditModal(a)
                                                            }
                                                            className="flex items-center gap-1 bg-cyan-800 hover:bg-cyan-900 text-white text-xs font-semibold py-1.5 px-3 rounded-lg transition"
                                                        >
                                                            <FontAwesomeIcon
                                                                icon={faPen}
                                                            />{" "}
                                                            Edit
                                                        </button>

                                                        {!isProject &&
                                                            (() => {
                                                                const secondToLast =
                                                                    a.payment_schedules?.at(
                                                                        -2,
                                                                    );
                                                                const isPaid =
                                                                    a
                                                                        .payment_schedules
                                                                        ?.length >
                                                                        0 &&
                                                                    secondToLast?.status ===
                                                                        "paid";

                                                                const endDate =
                                                                    a
                                                                        .subscription
                                                                        ?.adjusted_end_coverage ??
                                                                    a
                                                                        .subscription
                                                                        ?.end_coverage;
                                                                const isWithin3Days =
                                                                    endDate
                                                                        ? (() => {
                                                                              const end =
                                                                                  new Date(
                                                                                      endDate,
                                                                                  );
                                                                              const today =
                                                                                  new Date();
                                                                              today.setHours(
                                                                                  0,
                                                                                  0,
                                                                                  0,
                                                                                  0,
                                                                              );
                                                                              const diffDays =
                                                                                  Math.ceil(
                                                                                      (end -
                                                                                          today) /
                                                                                          (1000 *
                                                                                              60 *
                                                                                              60 *
                                                                                              24),
                                                                                  );
                                                                              return (
                                                                                  diffDays <=
                                                                                  3
                                                                              );
                                                                          })()
                                                                        : false;

                                                                const canRenew =
                                                                    isPaid &&
                                                                    isWithin3Days;

                                                                return (
                                                                    <button
                                                                        onClick={() =>
                                                                            canRenew &&
                                                                            openRenewModal(
                                                                                a,
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            !canRenew
                                                                        }
                                                                        title={
                                                                            !canRenew
                                                                                ? "Available 3 days before end coverage"
                                                                                : "Renew Subscription"
                                                                        }
                                                                        className={`flex items-center gap-1 text-white text-xs font-semibold py-1.5 px-3 rounded-lg transition ${
                                                                            canRenew
                                                                                ? "bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
                                                                                : "bg-gray-300 cursor-not-allowed"
                                                                        }`}
                                                                    >
                                                                        <FontAwesomeIcon
                                                                            icon={
                                                                                canRenew
                                                                                    ? faRotateRight
                                                                                    : faLock
                                                                            }
                                                                        />{" "}
                                                                        Renew
                                                                    </button>
                                                                );
                                                            })()}
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={tableHeaders.length}
                                            className="px-4 py-6 text-center text-gray-500"
                                        >
                                            No records found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        )}
                    </table>
                </div>
            </div>

            <PaymentModal
                isOpen={modalOpen}
                onClose={() => {
                    setModalOpen(false);
                    setEditData(null);
                }}
                onSuccess={() => {
                    const renewId = renewData?.id;
                    getAssigns(1, renewId);
                    setRenewData(null);
                    setModalOpen(false);
                    setEditData(null);
                }}
                mode={modalMode}
                editData={editData}
                renewData={renewData}
            />

            {serviceModalOpen &&
                selectedService &&
                (() => {
                    const isProject = selectedService.project !== null;
                    const service = isProject
                        ? selectedService.project
                        : selectedService.subscription;

                    return (
                        <div
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
                            onClick={closeServiceModal}
                        >
                            <div
                                className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Modal Header */}
                                <div className="flex justify-between items-start mb-5">
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                                            {isProject
                                                ? "Project Details"
                                                : "Subscription Details"}
                                        </p>
                                        <h2 className="text-xl font-bold text-gray-800">
                                            {service?.title ?? "—"}
                                        </h2>
                                    </div>
                                    <button
                                        onClick={closeServiceModal}
                                        className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                                    >
                                        <FontAwesomeIcon
                                            icon={faTimes}
                                            size="lg"
                                        />
                                    </button>
                                </div>

                                {/* Metric Cards */}
                                <div className="grid grid-cols-2 gap-3 mb-5">
                                    <div className="bg-gray-50 rounded-lg p-3">
                                        <p className="text-xs text-gray-400 mb-1">
                                            Status
                                        </p>
                                        <p className="text-sm font-semibold text-gray-800 capitalize">
                                            {service?.status ?? "—"}
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-3">
                                        <p className="text-xs text-gray-400 mb-1">
                                            {isProject ? "Price" : "Cost"}
                                        </p>
                                        <p className="text-sm font-semibold text-gray-800">
                                            ₱
                                            {new Intl.NumberFormat(
                                                "en-PH",
                                            ).format(
                                                isProject
                                                    ? service?.price
                                                    : (service?.cost ?? 0),
                                            )}
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-3">
                                        <p className="text-xs text-gray-400 mb-1">
                                            {isProject
                                                ? "Start Date"
                                                : "Start Coverage"}
                                        </p>
                                        <p className="text-sm font-semibold text-gray-800">
                                            {isProject
                                                ? service?.start_date
                                                : (service?.start_coverage ??
                                                  "—")}
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-3">
                                        <p className="text-xs text-gray-400 mb-1">
                                            {isProject
                                                ? "End Date"
                                                : "End Coverage"}
                                        </p>
                                        <p className="text-sm font-semibold text-gray-800">
                                            {isProject
                                                ? service?.end_date
                                                : (service?.end_coverage ??
                                                  "—")}
                                        </p>
                                    </div>
                                    {!isProject && (
                                        <>
                                            <div className="bg-gray-50 rounded-lg p-3">
                                                <p className="text-xs text-gray-400 mb-1">
                                                    Type
                                                </p>
                                                <p className="text-sm font-semibold text-gray-800 capitalize">
                                                    {service?.type ?? "—"}
                                                </p>
                                            </div>
                                            <div className="bg-gray-50 rounded-lg p-3">
                                                <p className="text-xs text-gray-400 mb-1">
                                                    Number of Renewals
                                                </p>
                                                <p className="text-sm font-semibold text-gray-800">
                                                    {selectedService.payment
                                                        ?.number_of_cycles ?? 0}
                                                </p>
                                            </div>
                                        </>
                                    )}
                                    <div className="bg-gray-50 rounded-lg p-3">
                                        <p className="text-xs text-gray-400 mb-1">
                                            VAT Type
                                        </p>
                                        <p className="text-sm font-semibold text-gray-800 capitalize">
                                            {selectedService.vat_type?.replace(
                                                "_",
                                                " ",
                                            ) ?? "—"}
                                        </p>
                                    </div>
                                </div>

                                {/* Additional Info */}
                                <div className="border-t border-gray-100 pt-4">
                                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">
                                        Additional Info
                                    </p>
                                    <table className="w-full text-sm">
                                        <tbody>
                                            <tr>
                                                <td className="text-gray-400 py-1.5 w-1/2">
                                                    {isProject
                                                        ? "Project ID"
                                                        : "Subscription ID"}
                                                </td>
                                                <td className="text-gray-800 font-medium py-1.5">
                                                    #{service?.id}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="text-gray-400 py-1.5">
                                                    Description
                                                </td>
                                                <td className="text-gray-800 font-medium py-1.5">
                                                    {service?.description ??
                                                        "—"}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="text-gray-400 py-1.5">
                                                    Payment Type
                                                </td>
                                                <td className="text-gray-800 font-medium py-1.5 capitalize">
                                                    {selectedService.payment?.payment_type?.replace(
                                                        "_",
                                                        " ",
                                                    ) ?? "—"}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="text-gray-400 py-1.5">
                                                    Final Price
                                                </td>
                                                <td className="text-gray-800 font-medium py-1.5">
                                                    ₱
                                                    {new Intl.NumberFormat(
                                                        "en-PH",
                                                    ).format(
                                                        selectedService.final_price ??
                                                            0,
                                                    )}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    );
                })()}
        </>
    );
}
