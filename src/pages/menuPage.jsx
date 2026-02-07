import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/authProvider";

export default function MenuPage() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const isAdmin = (user?.user_bagian || "").toUpperCase() === "ADMIN";

    const userLabel = useMemo(() => {
        if (!user) return "";
        const nama = user.user_nama || "";
        const cab = user.user_cab || "";
        const bagian = user.user_bagian || "";
        const kelompok = user.user_kelompok || "";
        return `${nama} : ${cab} ${bagian} ${kelompok}`.trim();
    }, [user]);

    const menus = [
        ...(isAdmin
        ? [
            { key: "spk", title: "SPK Target", desc: "Input target produksi", path: "/spk-target" },
            { key: "manpower", title: "Man Power", desc: "Input tenaga kerja", path: "/manpower" },
            ]
        : []),

        { key: "realisasi", title: "Realisasi Job", desc: "Input realisasi produksi", path: "/realisasi" },
        { key: "monitoring", title: "Monitoring Job", desc: "Tampilan monitoring", path: "/monitoring" },
        { key: "change-password", title: "Ganti Password", desc: "Ubah password akun", path: "/change-password" },
    ];

    return (
        <div style={styles.page}>
        <div style={styles.header}>
            <div>
            <div style={styles.title}>MENU</div>
            <div style={styles.sub}>{userLabel}</div>
            </div>

            <div style={styles.headerActions}>
            <button style={styles.btnDanger} onClick={logout}>
                Keluar
            </button>
            </div>
        </div>

        <div style={styles.grid}>
            {menus.map((m) => (
            <button
                key={m.key}
                onClick={() => navigate(m.path)}
                style={styles.card}
                type="button"
            >
                <div style={styles.cardTitle}>{m.title}</div>
                <div style={styles.cardDesc}>{m.desc}</div>
            </button>
            ))}
        </div>
        </div>
    );
}

const styles = {
    page: { minHeight: "100vh", background: "#0f172a", padding: 16, color: "#e5e7eb" },
    header: {
        background: "#111827",
        border: "1px solid #1f2937",
        borderRadius: 12,
        padding: 16,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
    },
    title: { fontSize: 18, fontWeight: 800, letterSpacing: 0.5 },
    sub: { marginTop: 4, fontSize: 12, color: "#9ca3af" },
    headerActions: { display: "flex", gap: 8 },
    btnDanger: {
        height: 36,
        padding: "0 12px",
        borderRadius: 10,
        border: 0,
        background: "#dc2626",
        color: "white",
        fontWeight: 700,
        cursor: "pointer",
    },
    grid: {
        marginTop: 16,
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 12,
    },
    card: {
        textAlign: "left",
        background: "#111827",
        border: "1px solid #1f2937",
        borderRadius: 14,
        padding: 16,
        cursor: "pointer",
    },
    cardTitle: { fontSize: 16, fontWeight: 800 },
    cardDesc: { marginTop: 6, fontSize: 12, color: "#9ca3af" },
};
