import { createBrowserRouter } from "react-router-dom";
import { Navigate } from "react-router-dom";
import Login from "./views/Login.jsx";
import GuestLayout from "./components/GuestLayout.jsx";
import DefaultLayout from "./components/DefaultLayout.jsx";
import Dashboard from "./views/Dashboard.jsx";
import Clients from "./views/Clients.jsx";
import NotFound from "./views/NotFound.jsx";
import ClientForm from "./views/ClientForm.jsx";
import Projects from "./views/Projects.jsx";
import ProjectsForm from "./views/ProjectsForm.jsx";
import ClientsProject from "./views/ClientsProject.jsx";
import Payments from "./views/Payments.jsx";
import Users from "./views/Users.jsx";
import UserForm from "./views/UserForm.jsx";
import UploadFiles from "./views/UploadFiles.jsx";
import ReportModule from "./views/ReportModule.jsx";

const router = createBrowserRouter([
    {
        path: "/",
        element: <DefaultLayout />,
        children: [
            {
                path: "/",
                element: <Navigate to="/dashboard" />,
            },
            {
                path: "/dashboard",
                element: <Dashboard />,
            },
            {
                path: "/users",
                element: <Users />,
            },
            {
                path: "/users/new",
                element: <UserForm key="userCreate" />,
            },
            {
                path: "/users/:id",
                element: <UserForm key="userUpdate" />,
            },
            {
                path: "/clients",
                element: <Clients />,
            },
            {
                path: "/clients/project/:id",
                element: <ClientsProject />,
            },
            {
                path: "/clients/new",
                element: <ClientForm key="clientCreate" />,
            },
            {
                path: "/clients/:id",
                element: <ClientForm key="clientUpdate" />,
            },
            {
                path: "/projects",
                element: <Projects />,
            },
            {
                path: "/projects/new",
                element: <ProjectsForm key="projectCreate" />,
            },
            {
                path: "/projects/:id",
                element: <ProjectsForm key="projectUpdate" />,
            },
            {
                path: "/payments",
                element: <Payments />,
            },
            {
                path: "/upload",
                element: <UploadFiles />,
            },
            {
                path: "/report",
                element: <ReportModule />,
            },
        ],
    },
    {
        path: "/",
        element: <GuestLayout />,
        children: [
            {
                path: "/login",
                element: <Login />,
            },
        ],
    },
    {
        path: "*",
        element: <NotFound />,
    },
]);

export default router;
