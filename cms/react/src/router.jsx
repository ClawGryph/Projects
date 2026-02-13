import { createBrowserRouter } from "react-router-dom";
import { Navigate } from "react-router-dom";
import DefaultLayout from "./components/DefaultLayout.jsx";
import Dashboard from "./views/Dashboard.jsx";
import Users from "./views/Users.jsx";
import NotFound from "./views/NotFound.jsx";
import UserForm from "./views/UserForm.jsx";
import Projects from "./views/Projects.jsx";
import ProjectsForm from "./views/ProjectsForm.jsx";
import UsersProject from "./views/UsersProject.jsx";

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
                path: "/users/project/:id",
                element: <UsersProject />,
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
        ],
    },
    {
        path: "*",
        element: <NotFound />,
    },
]);

export default router;
