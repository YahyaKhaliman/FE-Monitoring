/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getManPower, saveManPower, deleteManPower } from "../services/manPower.service";
import { useAuth } from "../context/authProvider";
import { toast } from "react-toastify";
import { MdEdit, MdDelete } from "react-icons/md";

function formatDateDDMMYYYY(dateStr) {
    if (!dateStr) return "";
    const dateOnly = String(dateStr).split("T")[0];
    const [y, m, d] = dateOnly.split("-");
    if (!y || !m || !d) return dateStr;
    return `${d}/${m}/${y}`;
}

export default function ManPowerPage() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const isAdmin = ["ADMIN", "IT"].includes((user?.user_bagian || "").toUpperCase());
    const canInput = isAdmin || (user?.user_bagian || "").toUpperCase() === "JAHIT";
    const today = new Date().toISOString().slice(0, 10);

    // --- States ---
    const [tanggal, setTanggal] = useState(today);
    const [lini] = useState("JAHIT"); // Default sesuai kebutuhan Anda
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);

    // Form States (Modal)
    const [openForm, setOpenForm] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [formKelompok, setFormKelompok] = useState("");
    const [mp, setMp] = useState("");

    const kelompokOptions = ["Line A", "Line B", "Line C", "Line D", "Line E", "Line F", "Line G", "Line H", "Line I", "Line J", "Line K"];

    const userLabel = useMemo(() => {
        if (!user) return "";
        return `${user.user_nama || ""} • ${user.user_bagian || ""}`.trim();
    }, [user]);

    // --- Data Loading ---
    const refreshData = async () => {
        setLoading(true);
        try {
            const res = await getManPower({ lini, tanggal, cab: user?.user_cab });
            if (!res.ok) {
                setRows([]);
                throw new Error(res.message || "Gagal memuat data");
            }
            setRows(res.data || []);
            return res;
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.user_cab) refreshData();
    }, [tanggal]);

    // --- Form Logic ---
    const openAdd = () => {
        setEditMode(false);
        setFormKelompok("");
        setMp("");
        setOpenForm(true);
    };

    const openEdit = (r) => {
        setEditMode(true);
        setFormKelompok(r.kelompok);
        setMp(r.mp);
        setOpenForm(true);
    };

    const onSave = async (e) => {
        e.preventDefault();
        if (!formKelompok || !mp) return toast.warning("Lengkapi Kelompok dan Jumlah MP");

        setLoading(true);
        try {
            const payload = {
                tanggal,
                cab: user?.user_cab,
                lini,
                kelompok: formKelompok,
                mp: Number(mp || 0),
                user: user?.user_kode,
            };

            const res = await saveManPower(payload);
            if (res.ok) {
                toast.success(editMode ? "Data diperbarui" : "Data ditambahkan");
                setOpenForm(false);
                refreshData();
            } else {
                toast.error(res.message);
            }
        } catch (e) {
            toast.error("Gagal menyimpan data");
        } finally {
            setLoading(false);
        }
    };

    const onDelete = async (r) => {
        if (!window.confirm(`Hapus Man Power kelompok ${r.kelompok}?`)) return;
        try {
            const res = await deleteManPower({
                cab: user?.user_cab,
                lini: r.lini || lini,
                tanggal: r.tanggal,
                kelompok: r.kelompok,
            });
            if (res.ok) {
                toast.success("Data dihapus");
                refreshData();
            }
        } catch (e) { toast.error("Gagal menghapus"); }
    };

    return (
        <div style={styles.page}>
            {/* HEADER - Identik dengan SpkTargetPage */}
            <div style={styles.header}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <button style={styles.btnGhost} onClick={() => navigate("/menu")}>← Back</button>
                    <div>
                        <div style={styles.title}>Man Power Management</div>
                        <div style={styles.sub}>{userLabel}</div>
                    </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                    <button
                        style={styles.btnSecondary}
                        onClick={() => toast.promise(refreshData(), { pending: 'Memuat data...', success: 'Data dimuat', error: 'Gagal muat data' })}
                        disabled={loading}
                    >
                        Refresh
                    </button>
                    {canInput && (
                        <button style={styles.btnPrimary} onClick={openAdd}>
                            + Tambah MP
                        </button>
                    )}
                </div>
            </div>

            {/* FILTERS */}
            <div style={styles.filters}>
                <div style={{ flex: 1 }}>
                    <label style={styles.label}>Tanggal Produksi</label>
                    <input
                        type="date"
                        style={styles.inputFilter}
                        value={tanggal}
                        onChange={(e) => setTanggal(e.target.value)}
                    />
                </div>
                <div style={{ flex: 1 }}>
                    <label style={styles.label}>Lini</label>
                    <input style={styles.inputFilter} value={lini} disabled />
                </div>
            </div>

            {/* TABLE */}
            <div style={styles.tableWrap}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>Tanggal</th>
                            <th style={styles.th}>Kelompok</th>
                            <th style={styles.thCenter}>Jumlah</th>
                            {canInput && <th style={styles.thCenter}>Aksi</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r, i) => (
                            <tr key={i} style={i % 2 === 0 ? styles.trEven : styles.trOdd}>
                                <td style={styles.td}>{r.tanggal}</td>
                                <td style={styles.tdBold}>{r.kelompok}</td>
                                <td style={styles.tdTarget}>{r.mp}</td>
                                {canInput && (
                                    <td style={styles.tdCenter}>
                                        <button style={styles.btnEdit} onClick={() => openEdit(r)}><MdEdit /></button>
                                        <button style={styles.btnDelete} onClick={() => onDelete(r)}><MdDelete /></button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
                {rows.length === 0 && !loading && <div style={styles.empty}>Data tidak ditemukan</div>}
            </div>

            {/* MODAL FORM */}
            {openForm && (
                <div style={styles.modalOverlay} onClick={() => setOpenForm(false)}>
                    <div style={styles.modal} onClick={e => e.stopPropagation()}>
                        <div style={styles.modalTitle}>{editMode ? "Edit Man Power" : "Tambah Man Power"}</div>
                        <p style={styles.modalSub}>Lini: {lini} | Tanggal: {formatDateDDMMYYYY(tanggal)}</p>
                        <form onSubmit={onSave}>
                            <div style={styles.formGroup}>
                                <label style={styles.labelForm}>Kelompok Produksi</label>
                                <select
                                    style={styles.input}
                                    value={formKelompok}
                                    onChange={e => setFormKelompok(e.target.value)}
                                >
                                    <option value="">Pilih Kelompok</option>
                                    {kelompokOptions.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.labelForm}>Jumlah Tenaga Kerja (MP)</label>
                                <input
                                    style={styles.input}
                                    value={mp}
                                    onChange={e => setMp(e.target.value)}
                                    type="number"
                                    placeholder="0"
                                />
                            </div>
                            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
                                <button type="button" style={styles.btnSecondaryModal} onClick={() => setOpenForm(false)}>Batal</button>
                                <button type="submit" style={styles.btnPrimaryModal} disabled={loading}>
                                    {loading ? "Proses..." : editMode ? "Update" : "Simpan"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

const styles = {
    page: { minHeight: "100vh", background: "#F9FAFB", padding: "20px", fontFamily: "'Readex Pro', sans-serif" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", padding: "15px 20px", borderRadius: "16px", border: "1px solid #E5E7EB", marginBottom: 20 },
    title: { fontSize: "18px", fontWeight: 800, color: "#111827" },
    sub: { fontSize: "12px", color: "#6B7280" },

    filters: { display: "flex", gap: 16, background: "#fff", border: "1px solid #E5E7EB", borderRadius: "12px", padding: "15px 20px", marginBottom: 15 },
    label: { fontSize: "13px", fontWeight: 800, color: "#374151", textTransform: "uppercase", marginBottom: 8, display: "block" },
    inputFilter: { width: "98%", height: "40px", borderRadius: "8px", border: "1px solid #D1D5DB", padding: "0 10px", outline: "none", fontFamily: "Inherit", },

    tableWrap: { background: "#fff", border: "1px solid #E5E7EB", borderRadius: "16px", overflow: "hidden" },
    table: { width: "100%", borderCollapse: "collapse" },
    th: { textAlign: "left", padding: "14px 20px", fontSize: "11px", fontWeight: 800, background: "#F9FAFB", borderBottom: "1px solid #E5E7EB", color: "#4B5563", textTransform: "uppercase" },
    thCenter: { textAlign: "center", padding: "14px 20px", fontSize: "11px", fontWeight: 800, background: "#F9FAFB", borderBottom: "1px solid #E5E7EB", textTransform: "uppercase" },

    td: { padding: "14px 20px", borderBottom: "1px solid #F3F4F6", fontSize: "14px" },
    tdBold: { padding: "14px 20px", borderBottom: "1px solid #F3F4F6", fontSize: "14px", fontWeight: 700 },
    tdTarget: { padding: "14px 20px", borderBottom: "1px solid #F3F4F6", fontSize: "16px", fontWeight: 800, color: "#B34E33", textAlign: "center", fontFamily: "'Inter', sans-serif" },
    tdCenter: { padding: "14px 20px", borderBottom: "1px solid #F3F4F6", textAlign: "center" },
    trEven: { background: "#fff" },
    trOdd: { background: "#FBFBFA" },
    empty: { padding: "40px", textAlign: "center", color: "#9CA3AF", fontStyle: "italic" },

    btnPrimary: { background: "#B34E33", color: "#fff", border: 0, padding: "0 20px", height: "40px", borderRadius: "8px", fontWeight: 700, cursor: "pointer" },
    btnSecondary: { background: "#fff", border: "1px solid #D1D5DB", height: "40px", padding: "0 15px", borderRadius: "8px", cursor: "pointer", fontWeight: 700 },
    btnGhost: { background: "none", border: "none", color: "#6B7280", fontWeight: 600, cursor: "pointer" },

    btnEdit: { color: "#fff", background: "#b38600", border: "none", padding: "6px", borderRadius: "6px", fontSize: "18px", marginRight: 5, cursor: "pointer", display: "inline-flex" },
    btnDelete: { color: "#fff", background: "#a01c29", border: "none", padding: "6px", borderRadius: "6px", fontSize: "18px", cursor: "pointer", display: "inline-flex" },

    modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "grid", placeItems: "center", zIndex: 100 },
    modal: { background: "#fff", width: "400px", borderRadius: "20px", padding: "24px" },
    modalTitle: { fontSize: "20px", fontWeight: 800 },
    modalSub: { fontSize: "12px", color: "#6B7280", marginBottom: 15 },
    formGroup: { marginBottom: "15px" },
    labelForm: { fontSize: "12px", fontWeight: 700, marginBottom: "5px", display: "block" },
    input: { width: "100%", height: "42px", borderRadius: "8px", border: "1px solid #D1D5DB", padding: "0 12px", boxSizing: "border-box" },
    btnPrimaryModal: { flex: 1, background: "#B34E33", color: "#fff", border: 0, height: "44px", borderRadius: "10px", fontWeight: 700, cursor: "pointer" },
    btnSecondaryModal: { flex: 1, background: "#F3F4F6", border: 0, color: "#374151", height: "44px", borderRadius: "10px", fontWeight: 700, cursor: "pointer" }
};