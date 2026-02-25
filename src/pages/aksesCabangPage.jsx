import { BiSolidNoEntry } from "react-icons/bi";
import { useAuth } from "../context/authProvider";

export default function AksesCabangPage() {
    const { logout } = useAuth();

    function handleKembaliLogin() {
        logout();
    }

    return (
        <div style={styles.page}>
            <div style={styles.card}>
                <div style={styles.iconWrap}>
                    <BiSolidNoEntry size={76} color="#DC2626" />
                </div>

                <h1 style={styles.title}>Akses Ditolak</h1>

                <p style={styles.desc}>
                    Sistem Monitoring ini khusus untuk user dengan cabang
                    <strong> P04</strong>.
                </p>

                <button
                    type="button"
                    style={styles.btn}
                    onClick={handleKembaliLogin}
                >
                    Kembali ke Login
                </button>
            </div>
        </div>
    );
}

const styles = {
    page: {
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#F8FAFC",
        fontFamily: "'Readex Pro', sans-serif",
        padding: 16,
    },
    card: {
        width: "min(520px, 95vw)",
        background: "#FFFFFF",
        border: "1px solid #E5E7EB",
        borderRadius: 18,
        boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
        padding: "28px 24px",
        textAlign: "center",
    },
    iconWrap: {
        width: 96,
        height: 96,
        borderRadius: 24,
        display: "grid",
        placeItems: "center",
        background: "#F1F5F9",
        margin: "0 auto 16px",
    },
    title: {
        margin: 0,
        fontSize: 24,
        fontWeight: 800,
        color: "#0F172A",
    },
    desc: {
        marginTop: 12,
        marginBottom: 22,
        color: "#475569",
        fontSize: 14,
        lineHeight: 1.6,
    },
    btn: {
        border: "none",
        borderRadius: 10,
        background: "#B34E33",
        color: "#FFFFFF",
        fontWeight: 700,
        padding: "11px 18px",
        cursor: "pointer",
    },
};
