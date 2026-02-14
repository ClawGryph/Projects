import { createBrowserRouter } from "react-router-dom";
import { Navigate } from "react-router-dom";
import DefaultLayout from "./components/DefaultLayout.jsx";
import Dashboard from "./views/Dashboard.jsx";
import Clients from "./views/Clients.jsx";
import NotFound from "./views/NotFound.jsx";
import ClientForm from "./views/ClientForm.jsx";
import Projects from "./views/Projects.jsx";
import ProjectsForm from "./views/ProjectsForm.jsx";
import ClientsProject from "./views/ClientsProject.jsx";
import Payments from "./views/Payments.jsx";

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
        ],
    },
    {
        path: "*",
        element: <NotFound />,
    },
]);

export default router;
