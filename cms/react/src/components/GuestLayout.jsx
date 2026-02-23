import { Outlet } from "react-router-dom";
import { Navigate } from "react-router-dom";
import { useStateContext } from "../context/ContextProvider";

export default function GuestLayout() {
    const { token } = useStateContext();

    if (token) {
        return <Navigate to="/" />;
    }

    return (
        <div className="flex justify-center items center min-h-screen">
            <Outlet />
        </div>
    );
}
