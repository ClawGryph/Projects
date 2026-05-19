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
import Payments from "./views/Payments.jsx";
import Users from "./views/Users.jsx";
import UserForm from "./views/UserForm.jsx";
import UploadFiles from "./views/UploadFiles.jsx";
import Company from "./views/Company.jsx";
import CompanyManagement from "./views/CompanyManagement.jsx";
import CompanyType from "./views/CompanyType.jsx";
import Subsciptions from "./views/Subscriptions.jsx";
import SubscriptionsForm from "./views/SubscriptionsForm.jsx";
import Assign from "./views/Assign.jsx";
import ScheduleBilling from "./views/ScheduleBilling.jsx";
import ClientDashboard from "./views/ClientDashboard.jsx";
import CompanyPaymentDetails from "./views/CompanyPaymentDetails.jsx";
import SalesReport from "./views/SalesReport.jsx";
import ReceivablesReport from "./views/ReceivablesReport.jsx";
import OverdueReport from "./views/OverdueReport.jsx";
import MismatchReport from "./views/MismatchReport.jsx";

const router = createBrowserRouter([
    {
        path: "/company",
        element: <Company />,
    },
    {
        path: "/",
        element: <DefaultLayout />,
        children: [
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
                path: "/clients/:id/dashboard",
                element: <ClientDashboard key="clientDashboard" />,
                handle: { title: "Client Dashboard" },
            },
            {
                path: "/clients/assign/:id",
                element: <Assign key="clientAssign" />,
                handle: { title: "Add Service" },
            },
            {
                path: "/clients/assign/:id/scheduleBilling/:clientsProjectId",
                element: <ScheduleBilling key="clientScheduleBilling" />,
                handle: { title: "Schedule Billing" },
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
                path: "/subscriptions",
                element: <Subsciptions />,
                handle: { title: "Subscriptions" },
            },
            {
                path: "/subscriptions/new",
                element: <SubscriptionsForm key="subscriptionCreate" />,
                handle: { title: "Create Subscription" },
            },
            {
                path: "/subscriptions/:id",
                element: <SubscriptionsForm key="subscriptionUpdate" />,
                handle: { title: "Edit Subscription" },
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
                path: "/sales-report",
                element: <SalesReport />,
                handle: { title: "Sales Report" },
            },
            {
                path: "/receivables-report",
                element: <ReceivablesReport />,
                handle: { title: "Receivables Report" },
            },
            {
                path: "/overdue-report",
                element: <OverdueReport />,
                handle: { title: "Overdue Report" },
            },
            {
                path: "/mismatch-report",
                element: <MismatchReport />,
                handle: { title: "Mismatch Report" },
            },
            {
                path: "/company-management",
                element: <CompanyManagement />,
                handle: { title: "Edit Company" },
            },
            {
                path: "/company-type",
                element: <CompanyType />,
                handle: { title: "Company Type" },
            },
            {
                path: "/payment-details",
                element: <CompanyPaymentDetails />,
                handle: { title: "Company Payment Details" },
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
