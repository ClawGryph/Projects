import { useState, useRef } from "react";
import axiosClient from "../axios-client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faUpload,
    faFilePdf,
    faFileImage,
    faFile,
    faTimes,
    faCheckCircle,
    faExternalLinkAlt,
} from "@fortawesome/free-solid-svg-icons";

export default function UploadFileModal({ transaction, onClose, onSaved }) {
    const or = transaction?.official_receipt;
    const has2307 = or?.has_2307;

    const [activeTab, setActiveTab] = useState("or"); // "or" | "2307"

    // O.R. tab state
    const [orFile, setOrFile] = useState(null);
    const [orUploading, setOrUploading] = useState(false);
    const [orError, setOrError] = useState("");
    const [orSuccess, setOrSuccess] = useState(false);
    const orInputRef = useRef(null);

    // 2307 tab state
    const [form2307File, setForm2307File] = useState(null);
    const [form2307Uploading, setForm2307Uploading] = useState(false);
    const [form2307Error, setForm2307Error] = useState("");
    const [form2307Success, setForm2307Success] = useState(false);
    const form2307InputRef = useRef(null);

    const orFileUploaded = !!(or?.or_file_url || orSuccess);

    const ACCEPTED = "image/jpeg,image/png,application/pdf";

    const fileIcon = (file) => {
        if (!file) return faFile;
        if (file.type === "application/pdf") return faFilePdf;
        return faFileImage;
    };

    // Validation for uploaded file
    const validateFile = (file) => {
        const allowed = ["image/jpeg", "image/png", "application/pdf"];
        if (!allowed.includes(file.type))
            return "Only JPG, PNG, or PDF files are allowed.";
        if (file.size > 10 * 1024 * 1024)
            return "File must be 10MB or smaller.";
        return null;
    };

    // Validate the O.R. file uploaded before storing
    const handleOrFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const err = validateFile(file);
        if (err) {
            setOrError(err);
            setOrFile(null);
            return;
        }
        setOrError("");
        setOrSuccess(false);
        setOrFile(file);
    };

    // Validate the 2307 file uploaded before storing
    const handleForm2307FileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const err = validateFile(file);
        if (err) {
            setForm2307Error(err);
            setForm2307File(null);
            return;
        }
        setForm2307Error("");
        setForm2307Success(false);
        setForm2307File(file);
    };

    const uploadOrFile = () => {
        if (!orFile || !or?.id) return;
        setOrUploading(true);
        setOrError("");
        const formData = new FormData();
        formData.append("file", orFile);
        axiosClient
            .post(`/official-receipts/${or.id}/upload-file`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            })
            .then(() => {
                setOrSuccess(true);
                setOrFile(null);
                onSaved();
            })
            .catch((err) => {
                setOrError(
                    err.response?.data?.message ||
                        err.response?.data?.errors?.file?.[0] ||
                        "Upload failed. Please try again.",
                );
            })
            .finally(() => setOrUploading(false));
    };

    const uploadForm2307File = () => {
        if (!form2307File || !or?.form2307_id) return;
        setForm2307Uploading(true);
        setForm2307Error("");
        const formData = new FormData();
        formData.append("file", form2307File);
        axiosClient
            .post(`/form-2307s/${or.form2307_id}/upload-file`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            })
            .then(() => {
                setForm2307Success(true);
                setForm2307File(null);
                onSaved();
            })
            .catch((err) => {
                setForm2307Error(
                    err.response?.data?.message ||
                        err.response?.data?.errors?.file?.[0] ||
                        "Upload failed. Please try again.",
                );
            })
            .finally(() => setForm2307Uploading(false));
    };

    // Uploading file field
    const DropZone = ({ file, onZoneClick, inputRef, onChange, accept }) => (
        <>
            <div
                onClick={onZoneClick}
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-950/20 transition-colors"
            >
                <FontAwesomeIcon
                    icon={file ? fileIcon(file) : faUpload}
                    className={`h-8 w-8 ${file ? "text-cyan-600" : "text-gray-400"}`}
                />
                {file ? (
                    <span className="text-sm text-gray-700 dark:text-gray-300 text-center break-all">
                        {file.name}
                    </span>
                ) : (
                    <>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            Click to choose a file
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                            JPG, PNG, or PDF — max 10MB
                        </span>
                    </>
                )}
            </div>
            <input
                ref={inputRef}
                type="file"
                accept={accept}
                onChange={onChange}
                className="hidden"
            />
        </>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                            Upload Files
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {transaction?.client?.name} —{" "}
                            {transaction?.project?.title}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    >
                        <FontAwesomeIcon icon={faTimes} className="h-5 w-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => setActiveTab("or")}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${
                            activeTab === "or"
                                ? "border-b-2 border-cyan-600 text-cyan-700 dark:text-cyan-400"
                                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        }`}
                    >
                        Official Receipt (O.R.)
                    </button>
                    <button
                        onClick={() => orFileUploaded && setActiveTab("2307")}
                        disabled={!orFileUploaded}
                        title={!orFileUploaded ? "Upload O.R. file first" : ""}
                        className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
                            !orFileUploaded
                                ? "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                                : activeTab === "2307"
                                  ? "border-b-2 border-amber-500 text-amber-600 dark:text-amber-400"
                                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        }`}
                    >
                        BIR Form 2307
                        {!orFileUploaded && (
                            <span className="ml-1.5 text-xs">🔒</span>
                        )}
                    </button>
                </div>

                {/* Tab Body */}
                <div className="px-6 py-5">
                    {/* O.R. Tab */}
                    {activeTab === "or" && (
                        <div className="space-y-3">
                            {or?.or_file_url && (
                                <div className="flex justify-end">
                                    <a
                                        href={or.or_file_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-xs text-cyan-600 hover:underline flex items-center gap-1"
                                    >
                                        View current file
                                        <FontAwesomeIcon
                                            icon={faExternalLinkAlt}
                                            className="h-2.5 w-2.5"
                                        />
                                    </a>
                                </div>
                            )}

                            <DropZone
                                file={orFile}
                                onZoneClick={() => orInputRef.current?.click()}
                                inputRef={orInputRef}
                                onChange={handleOrFileChange}
                                accept={ACCEPTED}
                            />

                            {orError && (
                                <p className="text-xs text-red-500">
                                    {orError}
                                </p>
                            )}
                            {orSuccess && (
                                <p className="text-xs text-emerald-600 flex items-center gap-1">
                                    <FontAwesomeIcon icon={faCheckCircle} />
                                    Uploaded successfully
                                </p>
                            )}
                            {!or?.id && (
                                <p className="text-xs text-amber-500">
                                    No Official Receipt record found. Issue an
                                    O.R. first from the Payments page.
                                </p>
                            )}

                            <button
                                onClick={uploadOrFile}
                                disabled={!orFile || orUploading || !or?.id}
                                className="w-full flex items-center justify-center gap-2 bg-cyan-700 hover:bg-cyan-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
                            >
                                <FontAwesomeIcon
                                    icon={faUpload}
                                    className="h-3.5 w-3.5"
                                />
                                {orUploading
                                    ? "Uploading…"
                                    : or?.or_file_url
                                      ? "Replace O.R. File"
                                      : "Upload O.R. File"}
                            </button>
                        </div>
                    )}

                    {/* 2307 Tab */}
                    {activeTab === "2307" && (
                        <div className="space-y-3">
                            {or?.form2307_file_url && (
                                <div className="flex justify-end">
                                    <a
                                        href={or.form2307_file_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-xs text-cyan-600 hover:underline flex items-center gap-1"
                                    >
                                        View current file
                                        <FontAwesomeIcon
                                            icon={faExternalLinkAlt}
                                            className="h-2.5 w-2.5"
                                        />
                                    </a>
                                </div>
                            )}

                            {orFileUploaded ? (
                                <>
                                    <DropZone
                                        file={form2307File}
                                        onZoneClick={() =>
                                            form2307InputRef.current?.click()
                                        }
                                        inputRef={form2307InputRef}
                                        onChange={handleForm2307FileChange}
                                        accept={ACCEPTED}
                                    />

                                    {form2307Error && (
                                        <p className="text-xs text-red-500">
                                            {form2307Error}
                                        </p>
                                    )}
                                    {form2307Success && (
                                        <p className="text-xs text-emerald-600 flex items-center gap-1">
                                            <FontAwesomeIcon
                                                icon={faCheckCircle}
                                            />
                                            Uploaded successfully
                                        </p>
                                    )}

                                    <button
                                        onClick={uploadForm2307File}
                                        disabled={
                                            !form2307File || form2307Uploading
                                        }
                                        className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
                                    >
                                        <FontAwesomeIcon
                                            icon={faUpload}
                                            className="h-3.5 w-3.5"
                                        />
                                        {form2307Uploading
                                            ? "Uploading…"
                                            : or?.form2307_file_url
                                              ? "Replace 2307 File"
                                              : "Upload 2307 File"}
                                    </button>
                                </>
                            ) : null}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
