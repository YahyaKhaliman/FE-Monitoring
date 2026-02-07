/* eslint-disable no-unused-vars */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { changePassword } from "../services/user.service";
import { loadUser } from "../utils/storage";

export default function ChangePasswordPage() {
    const nav = useNavigate();
    const user = loadUser();

    const [oldPass, setOldPass] = useState("");
    const [newPass, setNewPass] = useState("");
    const [msg, setMsg] = useState(null);
    const [loading, setLoading] = useState(false);

    async function submit(e) {
        e.preventDefault();
        setMsg(null);

        if (!oldPass || !newPass) {
        setMsg("Password lama dan baru wajib diisi");
        return;
        }

        setLoading(true);
        try {
        const res = await changePassword(user.user_kode, oldPass, newPass);

        if (!res.ok) {
            setMsg(res.message || "Gagal ubah password");
            return;
        }

        setOldPass("");
        setNewPass("");
        setMsg("Password Berhasil di ubah");
        } catch (err) {
        setMsg("Server error");
        } finally {
        setLoading(false);
        }
    }

    return (
        <div style={styles.page}>
        <div style={styles.card}>
            <div style={styles.title}>Ganti Password</div>

            <form onSubmit={submit}>
            <label style={styles.label}>Password Lama</label>
            <input
                type="password"
                value={oldPass}
                onChange={(e) => setOldPass(e.target.value)}
                style={styles.input}
            />

            <label style={styles.label}>Password Baru</label>
            <input
                type="password"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                style={styles.input}
            />

            {msg && <div style={styles.msg}>{msg}</div>}

            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button
                type="button"
                onClick={() => nav("/menu")}
                style={styles.btnGhost}
                disabled={loading}
                >
                Back
                </button>
                <button type="submit" style={styles.btnPrimary} disabled={loading}>
                {loading ? "Menyimpan..." : "Simpan"}
                </button>
            </div>
            </form>
        </div>
        </div>
    );
}

const styles = {
    page: { minHeight: "100vh", background: "#0f172a", display: "grid", placeItems: "center", padding: 16, color: "#e5e7eb" },
    card: { width: 420, maxWidth: "100%", background: "#111827", border: "1px solid #1f2937", borderRadius: 14, padding: 16 },
    title: { fontSize: 18, fontWeight: 900, marginBottom: 12 },
    label: { display: "block", fontSize: 12, color: "#cbd5e1", marginTop: 10, marginBottom: 6 },
    input: { width: "100%", height: 38, borderRadius: 10, border: "1px solid #334155", background: "#0b1220", color: "#e5e7eb", padding: "0 10px", outline: "none" },
    msg: { marginTop: 10, padding: 10, borderRadius: 10, background: "#0b1220", border: "1px solid #334155", color: "#e5e7eb", fontSize: 13 },
    btnGhost: { height: 36, padding: "0 12px", borderRadius: 10, border: "1px solid #334155", background: "transparent", color: "#e5e7eb", cursor: "pointer", flex: 1 },
    btnPrimary: { height: 36, padding: "0 12px", borderRadius: 10, border: 0, background: "#16a34a", color: "white", fontWeight: 900, cursor: "pointer", flex: 1 },
};
