import { Outlet } from "react-router-dom";
import { Navigate } from "react-router-dom";
import { useStateContext } from "../context/ContextProvider";

export default function GuestLayout() {
    const { token } = useStateContext();

    if (token) {
        return <Navigate to="/" />;
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <Outlet />
        </div>
    );
}
