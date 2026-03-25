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
                handle: { title: "Dashboard" },
            },
            {
                path: "/users",
                element: <Users />,
                handle: { title: "Users" },
            },
            {
                path: "/users/new",
                element: <UserForm key="userCreate" />,
                handle: { title: "Create User" },
            },
            {
                path: "/users/:id",
                element: <UserForm key="userUpdate" />,
                handle: { title: "Edit User" },
            },
            {
                path: "/clients",
                element: <Clients />,
                handle: { title: "Client" },
            },
            {
                path: "/clients/project/:id",
                element: <ClientsProject />,
            },
            {
                path: "/clients/new",
                element: <ClientForm key="clientCreate" />,
                handle: { title: "Create Client" },
            },
            {
                path: "/clients/:id",
                element: <ClientForm key="clientUpdate" />,
                handle: { title: "Edit Client" },
            },
            {
                path: "/projects",
                element: <Projects />,
                handle: { title: "Projects" },
            },
            {
                path: "/projects/new",
                element: <ProjectsForm key="projectCreate" />,
                handle: { title: "Create Project" },
            },
            {
                path: "/projects/:id",
                element: <ProjectsForm key="projectUpdate" />,
                handle: { title: "Edit Project" },
            },
            {
                path: "/payments",
                element: <Payments />,
                handle: { title: "Payments" },
            },
            {
                path: "/upload",
                element: <UploadFiles />,
                handle: { title: "Upload Files" },
            },
            {
                path: "/report",
                element: <ReportModule />,
                handle: { title: "Report" },
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
                handle: { title: "Login" },
            },
        ],
    },
    {
        path: "*",
        element: <NotFound />,
        handle: { title: "Not Found" },
    },
]);

export default router;
