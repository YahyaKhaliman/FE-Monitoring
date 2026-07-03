import { useNavigate } from "react-router-dom";
import { FcSupport } from "react-icons/fc";

export default function UnderConstructionPage() {
    const navigate = useNavigate();

    function handleKembali() {
        navigate("/menu", { replace: true });
    }

    return (
        <div style={styles.page}>
            <div style={styles.container}>
                <div style={styles.iconWrapper}>
                    <FcSupport size={80} color="#B34E33" />
                </div>

                <h1 style={styles.title}>Menu Dalam Pengembangan</h1>

                <p style={styles.description}>
                    Mohon maaf, fitur ini sedang proses pengembangan oleh tim IT.
                </p>

                <button
                    style={styles.btnPrimary}
                    onClick={handleKembali}
                    onMouseOver={(e) => e.target.style.opacity = '0.8'}
                    onMouseOut={(e) => e.target.style.opacity = '1'}
                >
                    Kembali ke Menu Utama
                </button>

                <div style={styles.footer}>
                    &copy; 2026 Monitoring Job.
                </div>
            </div>
        </div>
    );
}

const styles = {
    page: {
        minHeight: "100vh",
        background: "#F9FAFB",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        fontFamily: "'Readex Pro', sans-serif",
    },
    container: {
        maxWidth: "450px",
        width: "100%",
        textAlign: "center",
        background: "#ffffff",
        padding: "48px 32px",
        borderRadius: "24px",
        border: "1px solid #E5E7EB",
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05)",
    },
    iconWrapper: {
        background: "#FFF7ED",
        width: "120px",
        height: "120px",
        borderRadius: "30px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "0 auto 24px",
    },
    title: {
        fontSize: "24px",
        fontWeight: 800,
        color: "#111827",
        marginBottom: "12px",
        letterSpacing: "-0.02em",
    },
    description: {
        fontSize: "14px",
        color: "#6B7280",
        lineHeight: "1.6",
        marginBottom: "32px",
    },
    btnPrimary: {
        background: "#B34E33",
        color: "#fff",
        border: 0,
        width: "100%",
        padding: "14px 0",
        borderRadius: "12px",
        fontSize: "15px",
        fontWeight: 700,
        cursor: "pointer",
        transition: "opacity 0.2s",
    },
    footer: {
        marginTop: "32px",
        fontSize: "11px",
        fontWeight: 700,
        color: "#9CA3AF",
        textTransform: "uppercase",
        letterSpacing: "0.1em",
    }
};