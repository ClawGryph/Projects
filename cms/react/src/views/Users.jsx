import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faPen, faTrash } from "@fortawesome/free-solid-svg-icons";
import axiosClient from "../axios-client";
import { useStateContext } from "../context/ContextProvider";

export default function Users() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const { setNotification } = useStateContext();

    useEffect(() => {
        getUsers();
    }, []);

    const onDelete = (u) => {
        if (!window.confirm("Are you sure you want to delete this user?")) {
            return;
        }

        axiosClient.delete(`/users/${u.id}`).then(() => {
            setNotification("Employee was successfully deleted");
            getUsers();
        });
    };

    const getUsers = () => {
        setLoading(true);

        axiosClient
            .get("/users")
            .then(({ data }) => {
                setLoading(false);
                setUsers(data.data);
                console.log(data);
            })
            .catch(() => {
                setLoading(false);
            });
    };

    return (
        <>
            <div className="flex justify-between items-center p-5 mt-5">
                <h1 className="text-3xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                    Employees
                </h1>
                <Link
                    to={"/users/new"}
                    className="w-20 bg-sky-400 text-xs text-white cta-btn font-semibold py-2 rounded-br-lg rounded-bl-lg rounded-tr-lg shadow-lg hover:shadow-xl hover:bg-sky-500 flex items-center justify-center"
                >
                    <FontAwesomeIcon icon={faPlus} />
                    Add new
                </Link>
            </div>
            <div className="flex flex-col justify-center items-center overflow-x-auto">
                <table className="max-w-[1100px] w-full bg-white border border-gray-200 shadow-sm rounded-lg border-collapse">
                    <thead>
                        <tr className="bg-cyan-800">
                            <th className="px-4 py-2 text-white text-sm font-medium text-gray-700">
                                ID
                            </th>
                            <th className="px-4 py-2 text-white text-sm font-medium text-gray-700">
                                Name
                            </th>
                            <th className="px-4 py-2 text-white text-sm font-medium text-gray-700">
                                Email
                            </th>
                            <th className="px-4 py-2 text-white text-sm font-medium text-gray-700">
                                Role
                            </th>
                            <th className="px-4 py-2 text-white text-sm font-medium text-gray-700">
                                Created at
                            </th>
                            <th className="px-4 py-2 text-white text-sm font-medium text-gray-700">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    {loading && (
                        <tbody>
                            <tr>
                                <td colSpan="6" className="text-center">
                                    Loading...
                                </td>
                            </tr>
                        </tbody>
                    )}
                    {!loading && (
                        <tbody>
                            {users.length > 0 ? (
                                users.map((u) => (
                                    <tr
                                        key={u.id}
                                        className="border-b border-gray-200 hover:bg-cyan-50 text-center"
                                    >
                                        <td className="px-4 py-2">{u.id}</td>
                                        <td className="px-4 py-2">{u.name}</td>
                                        <td className="px-4 py-2">{u.email}</td>
                                        <td className="px-4 py-2">
                                            {u.role_label}
                                        </td>
                                        <td className="px-4 py-2">
                                            {u.created_at}
                                        </td>
                                        <td className="px-4 py-2 flex justify-center items-center gap-2">
                                            <Link
                                                to={"/users/" + u.id}
                                                className="inline-block px-2 py-1 text-xs bg-cyan-800 text-white font-semibold rounded-md shadow hover:bg-cyan-900"
                                            >
                                                <FontAwesomeIcon icon={faPen} />
                                                Edit
                                            </Link>
                                            <button
                                                onClick={() => onDelete(u)}
                                                className="inline-block px-2 py-1 text-xs bg-red-700 text-white font-semibold rounded-md shadow hover:bg-red-800 cursor-pointer"
                                            >
                                                <FontAwesomeIcon
                                                    icon={faTrash}
                                                />
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={8}
                                        className="px-4 py-6 text-center text-gray-500"
                                    >
                                        No clients
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    )}
                </table>
                {/* <div className="flex justify-center items-center gap-2 mt-4">
                    {meta?.current_page > 1 && (
                        <button
                            onClick={() =>
                                getPaymentSchedules(meta.current_page - 1)
                            }
                            className="px-3 py-1 text-sm bg-cyan-800 text-white rounded hover:bg-cyan-900"
                        >
                            Previous
                        </button>
                    )}

                    {meta?.current_page && (
                        <span className="text-sm text-gray-600">
                            Page {meta.current_page} of {meta.last_page}
                        </span>
                    )}

                    {meta?.current_page < meta?.last_page && (
                        <button
                            onClick={() =>
                                getPaymentSchedules(meta.current_page + 1)
                            }
                            className="px-3 py-1 text-sm bg-cyan-800 text-white rounded hover:bg-cyan-900"
                        >
                            Next
                        </button>
                    )}
                </div> */}
            </div>
        </>
    );
}
