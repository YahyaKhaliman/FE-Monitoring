/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState, useMemo } from "react";
import { getRealisasi } from "../services/realisasi.service";
import { loadUser } from "../utils/storage";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function RealisasiJobPage() {
    const navigate = useNavigate();
    const user = useMemo(() => loadUser(), []);
    const isAdmin = ["ADMIN", "IT"].includes((user?.user_bagian || "").toUpperCase());

    // --- States ---
    const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
    const [lini, setLini] = useState(isAdmin ? "JAHIT" : (user?.user_bagian || "JAHIT"));
    const [kelompok, setKelompok] = useState(isAdmin ? "" : (user?.user_kelompok || ""));
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    const userLabel = useMemo(() => {
        if (!user) return "";
        return `${user.user_nama || ""} • ${user.user_cab || ""} ${user.user_bagian || ""}`.trim();
    }, [user]);

    // --- Data Loading ---
    const refreshData = async () => {
        setLoading(true);
        try {
            const res = await getRealisasi({
                cab: user.user_cab,
                tanggal,
                lini: isAdmin ? lini : user.user_bagian,
                kelompok: isAdmin ? kelompok || undefined : user.user_kelompok,
            });

            if (!res?.ok) {
                setData([]);
                throw new Error(res?.message || "Gagal memuat data");
            }
            setData(res.data || []);
            return res;
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.user_cab) refreshData();
    }, [tanggal, lini, kelompok]);

    return (
        <div style={styles.page}>
            {/* HEADER - Konsisten dengan SpkTarget & ManPower */}
            <div style={styles.header}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <button style={styles.btnBack} onClick={() => navigate("/menu")}>← Back</button>
                    <div>
                        <div style={styles.title}>REALISASI JOB PRODUKSI</div>
                        <div style={styles.sub}>{userLabel}</div>
                    </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                    <button
                        style={styles.btnSecondary}
                        onClick={() => toast.promise(refreshData(), {
                            pending: 'Memuat realisasi...',
                            success: 'Data diperbarui',
                            error: 'Gagal sinkronisasi'
                        })}
                        disabled={loading}
                    >
                        {loading ? "..." : "Refresh"}
                    </button>
                </div>
            </div>

            {/* FILTERS PANEL */}
            <div style={styles.filters}>
                <div style={styles.filterGroup}>
                    <label style={styles.label}>Tanggal</label>
                    <input
                        type="date"
                        style={styles.input}
                        value={tanggal}
                        onChange={(e) => setTanggal(e.target.value)}
                    />
                </div>

                {isAdmin && (
                    <>
                        <div style={styles.filterGroup}>
                            <label style={styles.label}>Lini Produksi</label>
                            <select style={styles.select} value={lini} onChange={(e) => setLini(e.target.value)}>
                                <option value="JAHIT">JAHIT</option>
                                <option value="CUTTING">CUTTING</option>
                                <option value="FINISHING">FINISHING</option>
                            </select>
                        </div>
                        <div style={styles.filterGroup}>
                            <label style={styles.label}>Kelompok</label>
                            <input
                                style={styles.input}
                                placeholder="Cari Kelompok..."
                                value={kelompok}
                                onChange={(e) => setKelompok(e.target.value)}
                            />
                        </div>
                    </>
                )}
                {!isAdmin && (
                    <div style={styles.filterGroup}>
                        <label style={styles.label}>Info Kelompok</label>
                        <input style={{...styles.input, backgroundColor: '#F3F4F6'}} value={user.user_kelompok} disabled />
                    </div>
                )}
            </div>

            {/* DATA TABLE */}
            <div style={styles.tableWrap}>
                <table style={styles.table}>
                    <thead>
                        {/* Baris 1: Judul Utama */}
                        <tr>
                            <th rowSpan={2} style={styles.th}>Jam</th>
                            <th rowSpan={2} style={styles.th}>Identitas Barang / SPK</th>
                            <th colSpan={2} style={styles.thHighlight}>Target & Realisasi</th>
                            <th rowSpan={2} style={styles.thCenter}>Kelompok</th>
                            <th rowSpan={2} style={styles.thCenter}>Lini</th>
                        </tr>
                        {/* Baris 2: Sub-header */}
                        <tr>
                            <th style={styles.thSub}>Target</th>
                            <th style={styles.thSub}>Realisasi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.length === 0 ? (
                            <tr>
                                <td style={styles.tdEmpty} colSpan={6}>
                                    {loading ? "Sedang memuat..." : "Tidak ada data realisasi untuk kriteria ini"}
                                </td>
                            </tr>
                        ) : (
                            data.map((d, i) => (
                                <tr key={i} style={i % 2 === 0 ? styles.trEven : styles.trOdd}>
                                    <td style={styles.tdJam}>Jam {d.jam}</td>
                                    <td style={styles.td}>
                                        <div style={styles.spkName}>{d.spk_nama}</div>
                                        <div style={styles.spkDate}>{d.tanggal}</div>
                                    </td>
                                    <td style={styles.tdTarget}>{d.mr_target}</td>
                                    <td style={styles.tdRealisasi}>{d.mr_realisasi}</td>
                                    <td style={styles.tdCenter}>{d.kelompok}</td>
                                    <td style={styles.tdCenter}>{d.lini}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

const styles = {
    page: {
        minHeight: "100vh",
        background: "#F9FAFB",
        padding: "32px 20px",
        fontFamily: "'Readex Pro', sans-serif",
        maxWidth: "1200px",
        margin: "0 auto"
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: "#fff",
        padding: "20px 24px",
        borderRadius: "16px",
        border: "1px solid #E5E7EB",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        marginBottom: 24
    },
    title: { fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em" },
    sub: { marginTop: 4, fontSize: 12, color: "#6B7280", fontWeight: 500 },

    filters: {
        display: "flex",
        gap: 16,
        background: "#fff",
        border: "1px solid #E5E7EB",
        borderRadius: "12px",
        padding: "16px 20px",
        marginBottom: 16,
        alignItems: "flex-end"
    },
    filterGroup: { flex: 1, display: "flex", flexDirection: "column", gap: 6 },
    label: { fontSize: 10, fontWeight: 800, color: "#374151", textTransform: "uppercase" },
    input: { height: 40, borderRadius: 8, border: "1px solid #D1D5DB", padding: "0 12px", outline: "none", fontSize: 14 },
    select: { height: 40, borderRadius: 8, border: "1px solid #D1D5DB", padding: "0 12px", outline: "none", cursor: "pointer" },

    tableWrap: { background: "#fff", border: "1px solid #E5E7EB", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" },
    table: { width: "100%", borderCollapse: "collapse" },
    th: { padding: "12px 16px", background: "#F9FAFB", border: "1px solid #E5E7EB", fontSize: "11px", fontWeight: 800, color: "#4B5563", textTransform: "uppercase", textAlign: "left", verticalAlign: "middle" },
    thHighlight: { padding: "10px", background: "#FFF7ED", border: "1px solid #E5E7EB", fontSize: "11px", color: "#B34E33", fontWeight: 800, textAlign: "center" },
    thSub: { padding: "8px", background: "#F9FAFB", border: "1px solid #E5E7EB", fontSize: "10px", fontWeight: 800, textAlign: "center", color: "#6B7280" },
    thCenter: { textAlign: "center", padding: "12px 16px", background: "#F9FAFB", border: "1px solid #E5E7EB", fontSize: "11px", fontWeight: 800, textTransform: "uppercase" },

    td: { padding: "14px 16px", borderBottom: "1px solid #F3F4F6", fontSize: 14 },
    tdJam: { padding: "14px 16px", borderBottom: "1px solid #F3F4F6", fontSize: 13, fontWeight: 700, color: "#1E40AF", background: "#F0F7FF" },
    tdTarget: { padding: "14px 16px", borderBottom: "1px solid #F3F4F6", textAlign: "center", fontWeight: 700, color: "#4B5563", background: "#F9FAFB" },
    tdRealisasi: { padding: "14px 16px", borderBottom: "1px solid #F3F4F6", textAlign: "center", fontWeight: 800, color: "#B34E33", fontSize: 16, fontFamily: "'Inter', sans-serif" },
    tdCenter: { padding: "14px 16px", borderBottom: "1px solid #F3F4F6", textAlign: "center", fontSize: 13 },
    tdEmpty: { padding: 48, textAlign: "center", color: "#9CA3AF", fontStyle: "italic" },

    trEven: { background: "#FFFFFF" },
    trOdd: { background: "#FBFBFA" },
    spkName: { fontWeight: 800, color: "#111827", fontSize: "14px" },
    spkDate: { fontSize: "11px", color: "#9CA3AF", marginTop: 2 },

    btnBack: { background: "none", border: "none", color: "#6B7280", fontWeight: 700, cursor: "pointer", fontSize: 14 },
    btnSecondary: { height: 38, padding: "0 16px", borderRadius: 8, border: "1px solid #D1D5DB", background: "#fff", color: "#374151", fontWeight: 700, cursor: "pointer" },
};