import { Link } from "react-router-dom";
import { useLocation, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faPlus,
    faTrash,
    faPen,
    faDiagramProject,
    faTimes,
    faRotateRight,
    faLock,
    faHome,
    faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect } from "react";
import axiosClient from "../axios-client";
import { useStateContext } from "../context/ContextProvider";
import AssignServiceModal from "../components/AssignServiceModal";
import ScheduleBilling from "./ScheduleBilling";

export default function Assign() {
    const { id } = useParams();
    const [client, setClient] = useState(null);
    const [assigns, setAssigns] = useState([]);
    const [meta, setMeta] = useState({});
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState("all");
    const { setNotification, user } = useStateContext();
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState(null);
    const [editData, setEditData] = useState(null);
    const [renewData, setRenewData] = useState(null);
    const location = useLocation();

    useEffect(() => {
        // fetch client name
        axiosClient.get(`/clients/${id}`).then(({ data }) => {
            setClient(data);
        });
        getAssigns();
    }, []);

    const getAssigns = (page = 1, refreshRenewId = null) => {
        setLoading(true);
        axiosClient
            .get(`/clients/${id}/projects?page=${page}`)
            .then(({ data }) => {
                setLoading(false);
                setAssigns(data.data);
                setMeta(data.meta);
                if (refreshRenewId) {
                    const updated = data.data.find(
                        (a) => a.id === refreshRenewId,
                    );
                    if (updated) setRenewData(updated);
                    else setRenewData(null);
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

    const filteredAssigns = assigns.filter((a) => {
        if (filter === "projects") return a.project !== null;
        if (filter === "subscriptions") return a.subscription !== null;
        return true; // all
    });

    const openModal = (mode) => {
        setRenewData(null);
        setEditData(null);
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

    const PAYMENT_TYPE_LABELS = {
        one_time: "One Time",
        installment: "Installment",
        monthly: "Monthly",
        quarterly: "Quarterly",
        half_yearly: "Half Yearly",
        yearly: "Yearly",
    };

    const tableHeaders = [
        "Service",
        "Service Name",
        "Total Cost",
        "Start Date",
        "End Date",
        "Payment Type",
        "Actions",
    ];

    return (
        <>
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 px-5 py-3">
                <Link
                    to="/clients"
                    className="text-gray-500 hover:text-cyan-700 hover:underline transition"
                >
                    Clients
                </Link>

                <FontAwesomeIcon
                    icon={faChevronRight}
                    className="text-[10px] text-gray-400"
                />

                <Link
                    to={`/clients/${id}/dashboard`}
                    className="text-gray-500 hover:text-cyan-700 hover:underline transition"
                >
                    Dashboard
                </Link>

                <FontAwesomeIcon
                    icon={faChevronRight}
                    className="text-[10px] text-gray-400"
                />

                <span className="text-gray-800 font-semibold">Assign</span>
            </div>

            <div className="flex justify-between items-center p-5 mt-5">
                <h1 className="text-3xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                    {client ? `${client.name}'s Services` : "Assign Service"}
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
                                                    <Link
                                                        to={`/clients/assign/${id}/scheduleBilling/${a.id}`}
                                                        className="text-cyan-800 hover:underline font-medium cursor-pointer bg-transparent border-none p-0"
                                                    >
                                                        {serviceName ?? "—"}
                                                    </Link>
                                                </td>
                                                <td className="border-b border-gray-200 px-4 py-2">
                                                    ₱{" "}
                                                    {new Intl.NumberFormat(
                                                        "en-PH",
                                                    ).format(
                                                        a.payment?.total_cost ??
                                                            0,
                                                    )}
                                                </td>
                                                <td className="border-b border-gray-200 px-4 py-2">
                                                    {startDate ?? "—"}
                                                </td>
                                                <td className="border-b border-gray-200 px-4 py-2">
                                                    {endDate ?? "—"}
                                                </td>
                                                <td className="border-b border-gray-200 px-4 py-2 capitalize">
                                                    {isProject
                                                        ? (PAYMENT_TYPE_LABELS[
                                                              a.project
                                                                  ?.payment_type
                                                          ] ?? " - ")
                                                        : (PAYMENT_TYPE_LABELS[
                                                              a.subscription
                                                                  ?.frequency
                                                          ] ?? " - ")}
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

            <AssignServiceModal
                isOpen={modalOpen}
                onClose={() => {
                    setModalOpen(false);
                    setEditData(null);
                    setRenewData(null);
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
                clientId={id}
            />
        </>
    );
}
