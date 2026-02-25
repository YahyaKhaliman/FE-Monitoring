import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/authProvider";
import { toast } from "react-toastify";

export default function MenuPage() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const userLabel = useMemo(() => {
        if (!user) return "";
        const { user_nama: nama, user_bagian: bagian } = user;
        return `${nama} • ${bagian}`.trim();
    }, [user]);

    function handleLogout() {
        toast.dismiss();
        toast.info(
            <div
                style={{
                    fontFamily: "'Readex Pro', sans-serif",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    width: "100%",
                }}
            >
                <p
                    style={{
                        margin: "0 0 12px 0",
                        fontWeight: 600,
                        color: "#111827",
                        fontSize: "14px",
                    }}
                >
                    Apakah Anda yakin ingin keluar?
                </p>
                <div
                    style={{
                        display: "flex",
                        gap: "10px",
                        justifyContent: "center",
                    }}
                >
                    <button
                        onClick={() => {
                            if (logout) logout();
                            navigate("/login", { replace: true });
                            toast.dismiss();
                        }}
                        style={{
                            background: "#B34E33",
                            color: "#fff",
                            border: "none",
                            padding: "8px 20px",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontWeight: 700,
                            fontSize: "12px",
                            transition: "opacity 0.2s",
                        }}
                        onMouseOver={(e) =>
                            (e.currentTarget.style.opacity = "0.8")
                        }
                        onMouseOut={(e) =>
                            (e.currentTarget.style.opacity = "1")
                        }
                    >
                        Ya, Keluar
                    </button>
                    <button
                        onClick={() => toast.dismiss()}
                        style={{
                            background: "#E5E7EB",
                            color: "#374151",
                            border: "none",
                            padding: "8px 20px",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontWeight: 700,
                            fontSize: "12px",
                        }}
                    >
                        Batal
                    </button>
                </div>
            </div>,
            {
                position: "top-center",
                autoClose: false,
                closeOnClick: false,
                draggable: false,
                icon: false,
                closeButton: false,
                style: { borderRadius: "12px", padding: "16px" },
            },
        );
    }

    const menus = [
        {
            key: "spk",
            title: "SPK Target",
            desc: "Input target produksi harian",
            path: "/spk-target",
            icon: "📋",
            state: { lini: "JAHIT" },
        },
        {
            key: "manpower",
            title: "Man Power",
            desc: "Manajemen tenaga kerja",
            path: "/manpower",
            icon: "👥",
        },
        {
            key: "realisasi",
            title: "Realisasi Job",
            desc: "Input hasil produksi lapangan",
            path: "/realisasi",
            icon: "⚙️",
        },

        {
            key: "monitoring",
            title: "Monitoring Job",
            desc: "Pantau capaian produksi",
            path: "/monitoring",
            icon: "📊",
        },

        {
            key: "change-password",
            title: "Ganti Password",
            desc: "Keamanan akun user",
            path: "/change-password",
            icon: "🔐",
        },
    ];

    return (
        <div style={styles.page}>
            <div style={styles.header}>
                <div>
                    <div style={styles.title}>Menu</div>
                    <div style={styles.sub}>{userLabel}</div>
                </div>
                <button style={styles.btnSecondary} onClick={handleLogout}>
                    Keluar
                </button>
            </div>

            <div style={styles.grid}>
                {menus.map((m) => (
                    <button
                        key={m.key}
                        onClick={() =>
                            navigate(
                                m.path,
                                m.state ? { state: m.state } : undefined,
                            )
                        }
                        style={styles.card}
                        type="button"
                    >
                        <div style={styles.iconBox}>{m.icon}</div>
                        <div>
                            <div style={styles.cardTitle}>{m.title}</div>
                            <div style={styles.cardDesc}>{m.desc}</div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}

const styles = {
    page: {
        minHeight: "100vh",
        background: "#F9FAFB", // Konsisten dengan LaporanPage
        padding: "40px 20px",
        fontFamily: "'Readex Pro', sans-serif",
        maxWidth: "1200px",
        margin: "0 auto",
    },
    header: {
        background: "#ffffff",
        border: "1px solid #E5E7EB",
        borderRadius: 16,
        padding: "24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        marginBottom: 32,
    },
    title: { fontSize: 24, fontWeight: 800, color: "#111827" },
    sub: { marginTop: 4, fontSize: 13, color: "#6B7280", fontWeight: 500 },

    btnSecondary: {
        height: 42,
        padding: "0 20px",
        borderRadius: 8,
        border: "1px solid #D1D5DB",
        background: "#fff",
        color: "#374151",
        fontWeight: 700,
        cursor: "pointer",
        transition: "all 0.2s",
    },

    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: 20,
    },
    card: {
        textAlign: "left",
        background: "#ffffff",
        border: "1px solid #E5E7EB",
        borderRadius: 16,
        padding: 24,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 20,
        transition: "transform 0.2s, border-color 0.2s",
        outline: "none",
    },
    iconBox: {
        fontSize: 28,
        background: "#FFF7ED",
        width: 60,
        height: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 12,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 800,
        color: "#111827",
        fontFamily: "'Inter', sans-serif",
    },
    cardDesc: { marginTop: 4, fontSize: 12, color: "#6B7280", fontWeight: 500 },

    // Toast Confirmation Styles
    toastContainer: { textAlign: "center" },
    toastText: { fontWeight: 600, color: "#111827", marginBottom: 12 },
    btnToastYa: {
        background: "#B34E33",
        color: "#fff",
        border: "none",
        padding: "6px 15px",
        borderRadius: "6px",
        cursor: "pointer",
        fontWeight: 700,
    },
    btnToastBatal: {
        background: "#E5E7EB",
        color: "#374151",
        border: "none",
        padding: "6px 15px",
        borderRadius: "6px",
        cursor: "pointer",
        fontWeight: 700,
    },
};
