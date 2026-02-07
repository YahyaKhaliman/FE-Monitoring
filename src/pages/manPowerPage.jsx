/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getManPower, saveManPower, deleteManPower } from "../services/manPower.service";
import { useAuth } from "../context/authProvider";

export default function ManPowerPage() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const isAdmin = (user?.user_bagian || "").toUpperCase() === "ADMIN";
    const canInput = isAdmin || (user?.user_bagian || "").toUpperCase() === "JAHIT";

    const today = new Date().toISOString().slice(0, 10);

    // filter/list state
    const [tanggal, setTanggal] = useState(today);
    const [lini, setLini] = useState(isAdmin ? "JAHIT" : (user?.user_bagian || "JAHIT"));
    const [kelompok, setKelompok] = useState(isAdmin ? "" : (user?.user_kelompok || ""));
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState(null);

    // form input state
    const [formTanggal, setFormTanggal] = useState(today);
    const [formLini, setFormLini] = useState(isAdmin ? "JAHIT" : (user?.user_bagian || "JAHIT"));
    const [formKelompok, setFormKelompok] = useState(isAdmin ? "" : (user?.user_kelompok || ""));
    const [mp, setMp] = useState("");

    const userLabel = useMemo(() => {
        if (!user) return "";
        return `${user.user_nama || ""} : ${(user.user_cab || "")} ${(user.user_bagian || "")} ${(user.user_kelompok || "")}`.trim();
    }, [user]);

    async function loadList() {
        setMsg(null);

        const cab = user?.user_cab;
        if (!cab) {
        setMsg("User cab tidak ditemukan. Silakan login ulang.");
        return;
        }

        const effectiveLini = isAdmin ? lini : user.user_bagian;
        const effectiveKelompok = isAdmin ? (kelompok || undefined) : (user.user_kelompok || undefined);

        setLoading(true);
        try {
        const res = await getManPower({
            cab,
            lini: effectiveLini,
            tanggal,
            kelompok: effectiveKelompok,
        });

        if (!res.ok) {
            setMsg(res.message || "Gagal load manpower");
            setRows([]);
            return;
        }
        setRows(res.data || []);
        } catch (e) {
        setMsg("Server error saat load data");
        setRows([]);
        } finally {
        setLoading(false);
        }
    }

    useEffect(() => {
        if (!isAdmin && user?.user_bagian) setLini(user.user_bagian);
        if (!isAdmin && user?.user_kelompok) setKelompok(user.user_kelompok);
    }, [isAdmin, user]);

    useEffect(() => {
        loadList();
    }, [tanggal, lini, kelompok]);

    async function onSave(e) {
        e.preventDefault();
        setMsg(null);

        if (!canInput) {
        setMsg("Anda tidak punya akses input Man Power.");
        return;
        }

        const cab = user?.user_cab;
        if (!cab) {
        setMsg("User cab tidak ditemukan. Silakan login ulang.");
        return;
        }

        const payload = {
        tanggal: formTanggal,
        cab,
        lini: isAdmin ? formLini : user.user_bagian,
        kelompok: isAdmin ? formKelompok : user.user_kelompok,
        mp: Number(mp || 0),
        user: user?.user_kode,
        };

        if (!payload.lini || !payload.kelompok) {
        setMsg("Lini dan Kelompok wajib diisi.");
        return;
        }
        if (!payload.mp || payload.mp <= 0) {
        setMsg("Man Power harus > 0");
        return;
        }

        try {
        const res = await saveManPower(payload);
        if (!res.ok) {
            setMsg(res.message || "Gagal simpan Man Power");
            return;
        }
        setMp("");
        // refresh list sesuai filter tanggal sekarang
        await loadList();
        setMsg("Berhasil disimpan.");
        } catch (e2) {
        setMsg("Server error saat menyimpan");
        }
    }

    async function onDelete(row) {
        if (!canInput) {
        setMsg("Anda tidak punya akses hapus Man Power.");
        return;
        }

        const cab = user?.user_cab;
        if (!cab) {
        setMsg("User cab tidak ditemukan. Silakan login ulang.");
        return;
        }

        const params = {
        cab,
        lini: row.lini || (isAdmin ? lini : user.user_bagian),
        tanggal: row.tanggal, // pastikan dari BE format YYYY-MM-DD
        kelompok: row.kelompok,
        };

        if (!window.confirm(`Hapus Man Power ${params.kelompok} tanggal ${params.tanggal}?`)) return;

        try {
        const res = await deleteManPower(params);
        if (!res.ok) {
            setMsg(res.message || "Gagal hapus");
            return;
        }
        await loadList();
        } catch {
        setMsg("Server error saat hapus");
        }
    }

    return (
        <div style={styles.page}>
        <div style={styles.header}>
            <div>
            <div style={styles.title}>MAN POWER</div>
            <div style={styles.sub}>{userLabel}</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
            <button style={styles.btnGhost} onClick={() => navigate("/menu")}>Kembali</button>
            </div>
        </div>

        {/* Filter */}
        <div style={styles.panel}>
            <div style={styles.panelTitle}>Filter</div>
            <div style={styles.row}>
            <div style={styles.field}>
                <label style={styles.label}>Tanggal</label>
                <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
            </div>

            <div style={styles.field}>
                <label style={styles.label}>Lini</label>
                <input
                value={lini}
                onChange={(e) => setLini(e.target.value)}
                disabled={!isAdmin}
                placeholder="contoh: JAHIT"
                />
            </div>

            <div style={styles.field}>
                <label style={styles.label}>Kelompok</label>
                <input
                value={kelompok}
                onChange={(e) => setKelompok(e.target.value)}
                disabled={!isAdmin}
                placeholder={isAdmin ? "kosongkan untuk semua" : ""}
                />
            </div>

            <div style={styles.field}>
                <label style={styles.label}>&nbsp;</label>
                <button style={styles.btnGhost} type="button" onClick={loadList}>
                Refresh
                </button>
            </div>
            </div>
        </div>

        {/* Input */}
        {canInput && (
            <form style={styles.panel} onSubmit={onSave}>
            <div style={styles.panelTitle}>Input / Update Man Power</div>

            <div style={styles.row}>
                <div style={styles.field}>
                <label style={styles.label}>Tanggal</label>
                <input type="date" value={formTanggal} onChange={(e) => setFormTanggal(e.target.value)} />
                </div>

                <div style={styles.field}>
                <label style={styles.label}>Lini</label>
                <input
                    value={formLini}
                    onChange={(e) => setFormLini(e.target.value)}
                    disabled={!isAdmin}
                    placeholder="contoh: JAHIT"
                />
                </div>

                <div style={styles.field}>
                <label style={styles.label}>Kelompok</label>
                <input
                    value={formKelompok}
                    onChange={(e) => setFormKelompok(e.target.value)}
                    disabled={!isAdmin}
                    placeholder="contoh: A1"
                />
                </div>

                <div style={styles.field}>
                <label style={styles.label}>MP</label>
                <input
                    value={mp}
                    onChange={(e) => setMp(e.target.value)}
                    type="number"
                    min="0"
                    placeholder="contoh: 12"
                />
                </div>

                <div style={styles.field}>
                <label style={styles.label}>&nbsp;</label>
                <button style={styles.btnPrimary} type="submit">
                    Simpan
                </button>
                </div>
            </div>

            {msg && <div style={{ marginTop: 10, color: msg.includes("Berhasil") ? "#22c55e" : "#ef4444" }}>{msg}</div>}
            </form>
        )}

        {/* Table/List */}
        <div style={styles.panel}>
            <div style={styles.panelTitle}>List Man Power</div>

            {loading ? (
            <div style={{ padding: 12 }}>Loading...</div>
            ) : (
            <div style={{ overflowX: "auto" }}>
                <table style={styles.table}>
                <thead>
                    <tr>
                    <th style={styles.th}>Tanggal</th>
                    <th style={styles.th}>Lini</th>
                    <th style={styles.th}>Kelompok</th>
                    <th style={styles.th}>MP</th>
                    <th style={styles.th}>Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.length === 0 ? (
                    <tr>
                        <td style={styles.td} colSpan={5}>
                        Tidak ada data
                        </td>
                    </tr>
                    ) : (
                    rows.map((r, idx) => (
                        <tr key={idx}>
                        <td style={styles.td}>{r.tanggal}</td>
                        <td style={styles.td}>{r.lini || (isAdmin ? lini : user.user_bagian)}</td>
                        <td style={styles.td}>{r.kelompok}</td>
                        <td style={styles.td}>{r.mp}</td>
                        <td style={styles.td}>
                            <button
                            style={styles.btnDanger}
                            type="button"
                            onClick={() => onDelete(r)}
                            disabled={!canInput}
                            >
                            Hapus
                            </button>
                        </td>
                        </tr>
                    ))
                    )}
                </tbody>
                </table>
            </div>
            )}

            {!canInput && (
            <div style={{ marginTop: 10, color: "#9ca3af", fontSize: 12 }}>
                Anda hanya memiliki akses lihat (bukan input) Man Power.
            </div>
            )}

            {msg && !canInput && (
            <div style={{ marginTop: 10, color: "#ef4444" }}>{msg}</div>
            )}
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

    panel: {
        marginTop: 14,
        background: "#111827",
        border: "1px solid #1f2937",
        borderRadius: 12,
        padding: 14,
    },
    panelTitle: { fontWeight: 800, marginBottom: 10 },
    row: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 },
    field: { display: "grid", gap: 6 },
    label: { fontSize: 12, color: "#9ca3af" },

    btnGhost: {
        height: 36,
        padding: "0 12px",
        borderRadius: 10,
        border: "1px solid #334155",
        background: "transparent",
        color: "#e5e7eb",
        cursor: "pointer",
    },
    btnPrimary: {
        height: 36,
        padding: "0 12px",
        borderRadius: 10,
        border: 0,
        background: "#2563eb",
        color: "white",
        fontWeight: 700,
        cursor: "pointer",
    },
    btnDanger: {
        height: 32,
        padding: "0 10px",
        borderRadius: 10,
        border: 0,
        background: "#dc2626",
        color: "white",
        fontWeight: 700,
        cursor: "pointer",
    },

    table: { width: "100%", borderCollapse: "collapse" },
    th: { textAlign: "left", fontSize: 12, color: "#9ca3af", padding: "10px 8px", borderBottom: "1px solid #1f2937" },
    td: { padding: "10px 8px", borderBottom: "1px solid #1f2937" },
};
