import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { changePassword } from "../services/user.service";
import { loadUser } from "../utils/storage";
import { toast } from "react-toastify";

export default function ChangePasswordPage() {
    const nav = useNavigate();
    const user = loadUser();

    const [oldPass, setOldPass] = useState("");
    const [newPass, setNewPass] = useState("");
    const [loading, setLoading] = useState(false);

    async function submit(e) {
        e.preventDefault();

        if (!oldPass || !newPass) {
            toast.warning("Password lama dan baru wajib diisi");
            return;
        }

        setLoading(true);
        try {
            const res = await changePassword(user.user_kode, oldPass, newPass);

            if (res.ok) {
                setOldPass("");
                setNewPass("");
                toast.success("Password Berhasil diubah");

                setTimeout(() => nav("/menu"), 1500);
                return;
            }
            toast.error("Gagal ubah password");

        } catch (err) {
            const serverMsg = err?.response?.data?.message || err?.message || "Gagal ubah password";
            toast.error(serverMsg);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={styles.page}>
            <div style={styles.card}>
                <div style={styles.header}>
                    <div style={styles.iconCircle}>🔐</div>
                    <h1 style={styles.title}>Ganti Password</h1>
                </div>

                <form onSubmit={submit}>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Password Lama</label>
                        <input
                            type="password"
                            value={oldPass}
                            onChange={(e) => setOldPass(e.target.value)}
                            style={styles.input}
                            placeholder="Masukkan password saat ini"
                        />
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.label}>Password Baru</label>
                        <input
                            type="password"
                            value={newPass}
                            onChange={(e) => setNewPass(e.target.value)}
                            style={styles.input}
                            placeholder="Masukkan password baru"
                        />
                    </div>

                    <div style={styles.actionWrapper}>
                        <button
                            type="button"
                            onClick={() => nav("/menu")}
                            style={styles.btnSecondary}
                            disabled={loading}
                        >
                            Kembali
                        </button>
                        <button type="submit" style={styles.btnPrimary} disabled={loading}>
                            {loading ? "Proses..." : "Update Password"}
                        </button>
                    </div>
                </form>
            </div>

            <div style={styles.footerInfo}>
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
        fontFamily: "'Readex Pro', sans-serif"
    },
    card: {
        width: 400,
        maxWidth: "100%",
        background: "#ffffff",
        border: "1px solid #E5E7EB",
        borderRadius: 24,
        padding: "40px 32px",
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05)"
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
        margin: "0 auto 16px"
    },
    title: { fontSize: 22, fontWeight: 800, color: "#111827", margin: 0 },

    formGroup: { marginBottom: 20 },
    label: { display: "block", fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase", marginBottom: 8, letterSpacing: "0.02em" },
    input: {
        width: "100%",
        height: 45,
        borderRadius: 12,
        border: "1px solid #D1D5DB",
        background: "#fff",
        color: "#111827",
        padding: "0 16px",
        outline: "none",
        fontSize: 14,
        transition: "border-color 0.2s",
        boxSizing: "border-box"
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
        fontSize: 14
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
        boxShadow: "0 4px 6px -1px rgba(179, 78, 51, 0.2)"
    },
    footerInfo: { marginTop: 24, fontSize: 12, color: "#9CA3AF" }
};