import { Routes, Route, Navigate } from "react-router-dom";
import { loadUser } from "../utils/storage";
import { useAuth } from "../context/authProvider";

import LoginPage from "../pages/loginPage";
import MenuPage from "../pages/menuPage";
import SpkTargetPage from "../pages/spkTargetPage";
import ManPowerPage from "../pages/manPowerPage";
import RealisasiPage from "../pages/realisasiPage";
import MonitoringJobPage from "../pages/monitoringJobPage";
import ChangePasswordPage from "../pages/changePasswordPage";
import LaporanPage from "../pages/laporanSatuPage";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DalamPengembanganPage from "../pages/dalamPengembanganPage";
import AksesCabangPage from "../pages/aksesCabangPage";

function AuthRoute({ allow, children }) {
    const user = loadUser();
    if (!user) return <Navigate to="/login" replace />;

    const userCab = String(
        user?.user_cab ||
            user?.cab ||
            user?.user_cabang ||
            user?.cabang ||
            user?.cab_kode ||
            "",
    )
        .trim()
        .toUpperCase();

    // Sistem monitoring ini khusus untuk cabang P04
    if (userCab && userCab !== "P04") {
        return <Navigate to="/akses-cabang" replace />;
    }

    if (allow) {
        const role = (user.user_bagian || "").toUpperCase();
        if (!allow.includes(role)) {
            if (role === "OWNER") return <Navigate to="/laporan" replace />;
            return <Navigate to="/menu" replace />;
        }
    }
    return children;
}

export default function AppRoute() {
    const { isReady } = useAuth();
    if (!isReady)
        return (
            <div style={{ textAlign: "center", marginTop: 80 }}>Loading...</div>
        );

    return (
        <>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/akses-cabang" element={<AksesCabangPage />} />
                <Route
                    path="/laporan"
                    element={
                        <AuthRoute>
                            <LaporanPage />
                        </AuthRoute>
                    }
                />
                <Route
                    path="/menu"
                    element={
                        <AuthRoute>
                            <MenuPage />
                        </AuthRoute>
                    }
                />
                <Route
                    path="/spk-target"
                    element={
                        <AuthRoute>
                            <SpkTargetPage />
                        </AuthRoute>
                    }
                />
                <Route
                    path="/manpower"
                    element={
                        <AuthRoute>
                            <ManPowerPage />
                        </AuthRoute>
                    }
                />
                <Route
                    path="/realisasi"
                    element={
                        <AuthRoute>
                            <RealisasiPage />
                        </AuthRoute>
                    }
                />
                <Route
                    path="/monitoring"
                    element={
                        <AuthRoute>
                            <MonitoringJobPage />
                        </AuthRoute>
                    }
                />
                <Route
                    path="/change-password"
                    element={
                        <AuthRoute>
                            <ChangePasswordPage />
                        </AuthRoute>
                    }
                />
                <Route path="*" element={<DalamPengembanganPage />} />
            </Routes>
            <ToastContainer position="top-center" autoClose={3000} />
        </>
    );
}
