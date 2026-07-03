import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { changePassword } from "../../services/user.service";
import { loadUser } from "../../utils/storage";
import { toast } from "react-toastify";
import { MdLock, MdArrowBack, MdVpnKey } from "react-icons/md";

export default function ChangePasswordPage() {
    const nav = useNavigate();
    const user = loadUser();

    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const isMobile = windowWidth <= 480;

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const [oldPass, setOldPass] = useState("");
    const [newPass, setNewPass] = useState("");
    const [loading, setLoading] = useState(false);
    const [isFocusOld, setIsFocusOld] = useState(false);
    const [isFocusNew, setIsFocusNew] = useState(false);

    async function submit(e) {
        e.preventDefault();

        if (!oldPass || !newPass) {
            toast.warning("Password lama dan baru wajib diisi");
            return;
        }

        setLoading(true);
        try {
            const res = await changePassword(user?.user_kode, oldPass, newPass);

            if (res.ok) {
                setOldPass("");
                setNewPass("");
                toast.success("Password Berhasil diubah");

                setTimeout(() => nav("/menu"), 1500);
                return;
            }
            toast.error("Gagal ubah password");
        } catch (err) {
            const serverMsg =
                err?.response?.data?.message ||
                err?.message ||
                "Gagal ubah password";
            toast.error(serverMsg);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{
            ...styles.page,
            background: isMobile ? "#ffffff" : "#F9FAFB",
            padding: isMobile ? 0 : "24px",
            justifyContent: isMobile ? "flex-start" : "center",
        }}>
            {/* MOBILE NAVBAR */}
            {isMobile && (
                <div style={styles.mobileNavbar}>
                    <button
                        style={styles.mobileNavBack}
                        onClick={() => nav("/menu")}
                        aria-label="Kembali"
                    >
                        <MdArrowBack size={24} color="#111827" />
                    </button>
                    <span style={styles.mobileNavTitle}>Ganti Password</span>
                    <div style={{ width: 40 }} />
                </div>
            )}

            {/* MAIN CONTENT AREA */}
            <div style={{
                ...styles.card,
                width: isMobile ? "100%" : 400,
                padding: isMobile ? "24px 16px" : "40px 32px",
                border: isMobile ? "none" : "1px solid #E5E7EB",
                boxShadow: isMobile ? "none" : "0 10px 25px -5px rgba(0, 0, 0, 0.05)",
                background: "#ffffff",
                borderRadius: isMobile ? 0 : 24,
                boxSizing: "border-box",
            }}>
                {/* DESKTOP HEADER */}
                {!isMobile && (
                    <div style={styles.header}>
                        <div style={styles.iconCircle}>
                            <MdLock size={28} color="#B34E33" />
                        </div>
                        <h1 style={styles.title}>Ganti Password</h1>
                    </div>
                )}

                {/* MOBILE SUB-HEADER DESCRIPTION */}
                {isMobile && (
                    <div style={styles.mobileHeaderDesc}>
                        Gunakan password yang kuat dan aman untuk melindungi akun pemantauan Anda.
                    </div>
                )}

                <form onSubmit={submit}>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Password Lama</label>
                        <div style={styles.inputWrapper}>
                            <MdVpnKey
                                size={18}
                                color={isFocusOld ? "#B34E33" : "#9CA3AF"}
                                style={styles.inputIcon}
                            />
                            <input
                                type="password"
                                value={oldPass}
                                onChange={(e) => setOldPass(e.target.value)}
                                onFocus={() => setIsFocusOld(true)}
                                onBlur={() => setIsFocusOld(false)}
                                style={{
                                    ...styles.input,
                                    borderColor: isFocusOld ? "#B34E33" : "#D1D5DB",
                                    boxShadow: isFocusOld ? "0 0 0 2px rgba(179, 78, 51, 0.15)" : "none",
                                }}
                                placeholder="Masukkan password saat ini"
                            />
                        </div>
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.label}>Password Baru</label>
                        <div style={styles.inputWrapper}>
                            <MdVpnKey
                                size={18}
                                color={isFocusNew ? "#B34E33" : "#9CA3AF"}
                                style={styles.inputIcon}
                            />
                            <input
                                type="password"
                                value={newPass}
                                onChange={(e) => setNewPass(e.target.value)}
                                onFocus={() => setIsFocusNew(true)}
                                onBlur={() => setIsFocusNew(false)}
                                style={{
                                    ...styles.input,
                                    borderColor: isFocusNew ? "#B34E33" : "#D1D5DB",
                                    boxShadow: isFocusNew ? "0 0 0 2px rgba(179, 78, 51, 0.15)" : "none",
                                }}
                                placeholder="Masukkan password baru"
                            />
                        </div>
                    </div>

                    <div style={{
                        ...styles.actionWrapper,
                        flexDirection: isMobile ? "column-reverse" : "row",
                        gap: isMobile ? 8 : 12,
                        marginTop: isMobile ? 28 : 32,
                    }}>
                        {!isMobile && (
                            <button
                                type="button"
                                onClick={() => nav("/menu")}
                                style={styles.btnSecondary}
                                disabled={loading}
                            >
                                Kembali
                            </button>
                        )}
                        <button
                            type="submit"
                            style={{
                                ...styles.btnPrimary,
                                width: "100%",
                                height: isMobile ? "44px" : "48px",
                            }}
                            disabled={loading}
                        >
                            {loading ? "Proses..." : "Update Password"}
                        </button>
                    </div>
                </form>
            </div>

            <div style={{
                ...styles.footerInfo,
                marginTop: isMobile ? 32 : 24,
                textAlign: isMobile ? "center" : "left",
            }}>
                Logged in as: <b>{user?.user_nama}</b>
            </div>
        </div>
    );
}

const styles = {
    page: {
        minHeight: "100vh",
        background: "#F9FAFB",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        fontFamily: "'Readex Pro', sans-serif",
    },
    card: {
        width: 400,
        maxWidth: "100%",
        background: "#ffffff",
        border: "1px solid #E5E7EB",
        borderRadius: 24,
        padding: "40px 32px",
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05)",
    },
    header: { textAlign: "center", marginBottom: 32 },
    iconCircle: {
        width: 60,
        height: 60,
        background: "#FFF7ED",
        borderRadius: 20,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 24,
        margin: "0 auto 16px",
    },
    title: { fontSize: 22, fontWeight: 800, color: "#111827", margin: 0 },

    formGroup: { marginBottom: 20 },
    label: {
        display: "block",
        fontSize: 12,
        fontWeight: 700,
        color: "#374151",
        textTransform: "uppercase",
        marginBottom: 8,
        letterSpacing: "0.02em",
    },
    input: {
        width: "100%",
        height: 45,
        borderRadius: 12,
        border: "1px solid #D1D5DB",
        background: "#fff",
        color: "#111827",
        padding: "0 16px 0 42px",
        outline: "none",
        fontSize: 14,
        transition: "border-color 0.2s",
        boxSizing: "border-box",
    },

    actionWrapper: { display: "flex", gap: 12, marginTop: 32 },
    btnSecondary: {
        height: 48,
        padding: "0 20px",
        borderRadius: 12,
        border: "1px solid #D1D5DB",
        background: "#fff",
        color: "#374151",
        fontWeight: 700,
        cursor: "pointer",
        flex: 1,
        fontSize: 14,
        fontFamily: "'Readex Pro', sans-serif",
        transition: "all 0.2s ease",
    },
    btnPrimary: {
        height: 48,
        padding: "0 20px",
        borderRadius: 12,
        border: 0,
        background: "#B34E33",
        color: "white",
        fontWeight: 700,
        cursor: "pointer",
        flex: 1.5,
        fontSize: 14,
        fontFamily: "'Readex Pro', sans-serif",
        boxShadow: "0 4px 6px -1px rgba(179, 78, 51, 0.2)",
        transition: "all 0.2s ease",
    },
    footerInfo: { marginTop: 24, fontSize: 12, color: "#9CA3AF" },

    /* --- Mobile Native Layout Styles --- */
    mobileNavbar: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: "56px",
        width: "100%",
        padding: "0 16px",
        background: "#ffffff",
        borderBottom: "1px solid #F3F4F6",
        boxSizing: "border-box",
    },
    mobileNavBack: {
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: "8px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "50%",
        transition: "background 0.2s",
        outline: "none",
    },
    mobileNavTitle: {
        fontSize: "16px",
        fontWeight: 800,
        color: "#111827",
    },
    mobileHeaderDesc: {
        fontSize: "13px",
        color: "#6B7280",
        lineHeight: "1.5",
        marginBottom: "24px",
        textAlign: "left",
    },
    inputWrapper: {
        position: "relative",
        width: "100%",
    },
    inputIcon: {
        position: "absolute",
        left: "14px",
        top: "50%",
        transform: "translateY(-50%)",
        pointerEvents: "none",
        transition: "color 0.2s",
    },
};
