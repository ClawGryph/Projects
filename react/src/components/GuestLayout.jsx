import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Navigate, useMatches } from "react-router-dom";
import { useStateContext } from "../context/ContextProvider";

export default function GuestLayout() {
    const { token } = useStateContext();
    const matches = useMatches();

    useEffect(() => {
        const current = matches[matches.length - 1];
        const title = current?.handle?.title;

        if (title) {
            document.title = `${title} | Client Management System`;
        } else {
            document.title = "Client Management System";
        }
    }, [matches]);

    if (token) {
        return <Navigate to="/" />;
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <Outlet />
        </div>
    );
}
