import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Navigate, useMatches } from "react-router-dom";
import { useStateContext } from "../context/ContextProvider";

export default function GuestLayout() {
    const { token } = useStateContext();
    const matches = useMatches();

    // Handles tab title name for browser
    useEffect(() => {
        const current = matches[matches.length - 1];
        const title = current?.handle?.title;

        if (title) {
            document.title = `${title} | Invoicing System`;
        } else {
            document.title = "Invoicing System";
        }
    }, [matches]);

    // If access token exists navigate to main page
    if (token) {
        return <Navigate to="/" />;
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <Outlet />
        </div>
    );
}
