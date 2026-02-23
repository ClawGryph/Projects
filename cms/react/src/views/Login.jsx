import { useRef, useState } from "react";
import axiosClient from "../axios-client";
import { useStateContext } from "../context/ContextProvider";

export default function Login() {
    const emailRef = useRef();
    const passwordRef = useRef();

    const [errors, setErrors] = useState(null);
    const { setUser, setToken } = useStateContext();

    const onSubmit = (e) => {
        e.preventDefault();
        const payload = {
            email: emailRef.current.value,
            password: passwordRef.current.value,
        };

        setErrors(null);

        axiosClient
            .post("/login", payload)
            .then(({ data }) => {
                setUser(data.user);
                setToken(data.token);
            })
            .catch((err) => {
                const response = err.response;
                if (response && response.status === 422) {
                    if (response.data.errors) {
                        setErrors(response.data.errors);
                    } else {
                        setErrors({
                            email: [response.data.message],
                        });
                    }
                }
            });
    };

    return (
        <div className="rounded-xl border border-gray-200 py-8 px-6 max-w-90 w-full self-start mt-auto mb-auto">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                <svg
                    className="h-8 w-8 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    ></path>
                </svg>
            </div>

            <h3 className="mb-6 text-center text-xl font-bold text-gray-800">
                Quick Login
            </h3>

            <form onSubmit={onSubmit}>
                {errors && (
                    <div className="alert">
                        {Object.keys(errors).map((key) => (
                            <p key={key}>{errors[key][0]}</p>
                        ))}
                    </div>
                )}

                <div className="mb-4">
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                        Email
                    </label>
                    <input
                        ref={emailRef}
                        type="text"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 transition outline-none focus:border-cyan-800 focus:ring-2 focus:ring-cyan-800"
                        required=""
                    />
                </div>

                <div className="mb-6">
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                        Password
                    </label>
                    <input
                        ref={passwordRef}
                        type="password"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 transition outline-none focus:border-cyan-800 focus:ring-2 focus:ring-cyan-800"
                        required=""
                    />
                </div>

                <button
                    type="submit"
                    className="w-full rounded-lg bg-cyan-800 px-4 py-2 font-medium text-white transition duration-300 hover:bg-cyan-900 cursor-pointer"
                >
                    Sign In
                </button>

                <div className="mt-4 text-center">
                    <a
                        href="#"
                        className="text-sm text-cyan-800 hover:text-cyan-900"
                    >
                        Forgot Password?
                    </a>
                </div>
            </form>
        </div>
    );
}
