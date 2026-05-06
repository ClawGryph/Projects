import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import axiosClient from "../axios-client";
import { useStateContext } from "../context/ContextProvider";
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

export default function ScheduleBilling() {
    const { id, clientsProjectId } = useParams();
    const [client, setClient] = useState(null);

    useEffect(() => {
        axiosClient.get(`/clients/${id}`).then(({ data }) => {
            setClient(data);
        });
        // fetch schedule billing data using clientsProjectId when needed
    }, []);

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
                    to={`/clients/assign/${id}`}
                    className="text-gray-500 hover:text-cyan-700 hover:underline transition"
                >
                    Assign
                </Link>

                <FontAwesomeIcon
                    icon={faChevronRight}
                    className="text-[10px] text-gray-400"
                />

                <span className="text-gray-800 font-semibold">
                    Schedule Billing
                </span>
            </div>
        </>
    );
}
