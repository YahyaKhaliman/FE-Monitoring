/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { useEffect, useMemo, useState, useCallback } from "react";
import { loadUser } from "../utils/storage";
import {
    getLini,
    getSpkTargets,
    createSpkTarget,
    updateSpkTarget,
    deleteSpkTarget,
    cariSpkTarget,
} from "../services/spkTarget.service";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { MdEdit, MdDelete } from "react-icons/md";

export default function SpkTargetPage() {
    const navigate = useNavigate();

    // Ambil state dari navigasi jika ada (misal dari MenuPage)
    const locationState = (typeof window !== 'undefined' && window.history?.state?.usr) ? window.history.state.usr : {};
    const user = useMemo(() => loadUser(), []);
    const isAdmin = ["ADMIN", "IT"].includes((user?.user_bagian || "").toUpperCase());

    // --- States ---
    const [liniList, setLiniList] = useState([]);
    const [selectedLini, setSelectedLini] = useState("");
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState(null);

    // Form States
    const [openForm, setOpenForm] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [nomor, setNomor] = useState("");
    const [nama, setNama] = useState("");
    const [targetPerJam, setTargetPerJam] = useState("");
    const [spkClosed, setSpkClosed] = useState(false);
    const [loadingCari, setLoadingCari] = useState(false);

    // --- 1. Load Initial Data (Lini) ---
    useEffect(() => {
        if (!user) {
            navigate("/login", { replace: true });
            return;
        }

        async function initPage() {
            try {
                const res = await getLini();
                if (res.ok) {
                    setLiniList(res.data || []);

                    if (locationState?.lini) {
                        setSelectedLini(locationState.lini);
                    }
                }
            } catch (e) {
                console.error("Gagal load lini");
            }
        }
        initPage();
    }, [navigate, user]);

    useEffect(() => {
        if (user?.user_cab && selectedLini) {
            refresh();
        }
    }, [selectedLini]);

    const refresh = async () => {
        setLoading(true);
        setMsg(null);
        try {
            const res = await getSpkTargets(user.user_cab, selectedLini);
            if (!res.ok) {
                setRows([]);
                setMsg(res.message);
                return;
            }
            setRows(res.data || []);
        } catch (e) {
            toast.error("Gagal sinkronisasi data");
        } finally {
            setLoading(false);
        }
    };

    // Variant that rejects on error so it can be used with toast.promise
    const refreshWithToast = async () => {
        setLoading(true);
        setMsg(null);
        try {
            const res = await getSpkTargets(user.user_cab, selectedLini);
            if (!res.ok) {
                setRows([]);
                setMsg(res.message);
                throw new Error(res.message || "Gagal sinkronisasi data");
            }
            setRows(res.data || []);
            return res;
        } finally {
            setLoading(false);
        }
    };

    // --- Form Logic ---
    const handleCariSpk = async () => {
        if (!nomor) return toast.warning("Masukkan Nomor SPK");
        setLoadingCari(true);
        try {
            const res = await cariSpkTarget(nomor);
            if (res.ok && res.data) {
                setNama(res.data.spk_nama || "");
                const isClosed = Number(res.data.spk_close) === 1;
                setSpkClosed(isClosed);
                if (isClosed) toast.error("SPK sudah CLOSE");
                else toast.success("Data ditemukan");
            } else {
                setNama("");
                toast.error("SPK tidak ditemukan");
            }
        } catch (e) {
            toast.error("Error mencari SPK");
        } finally {
            setLoadingCari(false);
        }
    };

    const onSave = async (e) => {
        e.preventDefault();
        if (!nomor.trim() || !targetPerJam) return toast.warning("Data belum lengkap");

        setLoading(true);
        try {
            let res;
            const payload = {
                cab: user.user_cab,
                lini: selectedLini,
                target_per_jam: Number(targetPerJam),
            };

            if (editMode) {
                res = await updateSpkTarget(nomor.trim(), payload);
            } else {
                res = await createSpkTarget({
                    ...payload,
                    nomor: nomor.trim(),
                    nama,
                    user_create: user.user_kode
                });
            }

            if (res.ok) {
                toast.success("Berhasil disimpan");
                setOpenForm(false);
                refresh();
            } else {
                toast.error(res.message);
            }
        } catch (e) {
            toast.error("Gagal simpan");
        } finally {
            setLoading(false);
        }
    };

    const onDelete = async (r) => {
        if (!window.confirm(`Hapus target SPK ${r.nomor}?`)) return;
        try {
            const res = await deleteSpkTarget(r.nomor, user.user_cab, selectedLini);
            if (res.ok) {
                toast.success("Terhapus");
                refresh();
            }
        } catch (e) { toast.error("Gagal hapus"); }
    };

    return (
        <div style={styles.page}>
            <div style={styles.header}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <button style={styles.btnGhost} onClick={() => navigate("/menu")}>← Back</button>
                    <div>
                        <div style={styles.title}>SPK Target per Jam</div>
                        <div style={styles.sub}>{user?.user_nama} • {selectedLini}</div>
                    </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                    <button
                        style={styles.btnSecondary}
                        onClick={() => toast.promise(refreshWithToast(), { pending: 'Sinkronisasi data...', success: 'Sinkronisasi selesai', error: 'Gagal sinkronisasi' })}
                        disabled={loading}
                    >
                        Refresh
                    </button>
                    {isAdmin && <button style={styles.btnPrimary} onClick={() => { setEditMode(false); setNomor(""); setNama(""); setTargetPerJam(""); setSpkClosed(false); setOpenForm(true); }}>+ Tambah</button>}
                </div>
            </div>

            <div style={styles.filters}>
                <div style={{ flex: 1 }}>
                    <label style={styles.label}>Pilih Lini Produksi</label>
                    <select value={selectedLini} onChange={(e) => setSelectedLini(e.target.value)} style={styles.select}>
                        {liniList.map((l) => (
                            <option key={l.lini_kode || l.lini_nama} value={l.lini_nama}>{l.lini_nama}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div style={styles.tableWrap}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>Nomor SPK</th>
                            <th style={styles.th}>Nama Barang</th>
                            <th style={styles.thCenter}>Target/Jam</th>
                            {isAdmin && <th style={styles.thCenter}>Aksi</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r, i) => (
                            <tr key={r.nomor} style={i % 2 === 0 ? styles.trEven : styles.trOdd}>
                                <td style={styles.tdNomor}>{r.nomor}</td>
                                <td style={styles.td}>{r.nama || "-"}</td>
                                <td style={styles.tdTarget}>{r.target}</td>
                                {isAdmin && (
                                    <td style={styles.tdCenter}>
                                        <button style={styles.btnEdit} onClick={() => { setEditMode(true); setNomor(r.nomor); setNama(r.nama); setTargetPerJam(r.target); setSpkClosed(false); setOpenForm(true); }}><MdEdit /></button>
                                        <button style={styles.btnDelete} onClick={() => onDelete(r)}><MdDelete /></button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
                {rows.length === 0 && !loading && <div style={styles.empty}>Data tidak ditemukan</div>}
            </div>

            {/* MODAL */}
            {openForm && (
                <div style={styles.modalOverlay} onClick={() => setOpenForm(false)}>
                    <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div style={styles.modalTitle}>{editMode ? "Edit Target" : "Tambah Target"}</div>
                        <p style={styles.modalSub}>Lini: {selectedLini} | Cabang: {user?.user_cab}</p>

                        <form onSubmit={onSave} style={{ marginTop: 20 }}>
                            <div style={styles.formGroup}>
                                <label style={styles.labelForm}>Nomor SPK</label>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <input
                                        style={{ ...styles.input, flex: 1, backgroundColor: (editMode || spkClosed) ? "#F3F4F6" : "#fff" }}
                                        value={nomor}
                                        onChange={(e) => { setNomor(e.target.value.toUpperCase()); if(!editMode){setNama(""); setSpkClosed(false);} }}
                                        disabled={editMode || spkClosed}
                                        placeholder="Input Nomor..."
                                    />
                                    {!editMode && <button type="button" style={styles.btnCari} onClick={handleCariSpk} disabled={loadingCari || !nomor}>{loadingCari ? '...' : 'Cari'}</button>}
                                </div>
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.labelForm}>Nama Barang</label>
                                <input style={{...styles.input, backgroundColor: "#F9FAFB"}} value={nama} readOnly placeholder="Otomatis terisi..." />
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.labelForm}>Target per Jam</label>
                                <input style={styles.input} type="number" value={targetPerJam} onChange={(e) => setTargetPerJam(e.target.value)} disabled={spkClosed} />
                            </div>

                            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
                                <button type="button" style={styles.btnSecondaryModal} onClick={() => setOpenForm(false)}>Batal</button>
                                <button type="submit" style={{...styles.btnPrimaryModal, opacity: spkClosed ? 0.5 : 1}} disabled={spkClosed || loading}>
                                    {spkClosed ? "SPK CLOSED" : "Simpan"}
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
    filters: { background: "#fff", border: "1px solid #E5E7EB", borderRadius: "12px", padding: "15px 20px", marginBottom: 15 },
    label: { fontSize: "11px", fontWeight: 800, color: "#374151", textTransform: "uppercase", marginBottom: 8, display: "block" },
    select: { width: "100%", maxWidth: "300px", height: "40px", borderRadius: "8px", border: "1px solid #D1D5DB", padding: "0 10px", outline: "none" },
    tableWrap: { background: "#fff", border: "1px solid #E5E7EB", borderRadius: "16px", overflow: "hidden" },
    table: { width: "100%", borderCollapse: "collapse" },
    th: { textAlign: "left", padding: "14px 20px", fontSize: "11px", fontWeight: 800, background: "#F9FAFB", borderBottom: "1px solid #E5E7EB", color: "#4B5563" },
    thCenter: { textAlign: "center", padding: "14px 20px", fontSize: "11px", fontWeight: 800, background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" },
    td: { padding: "14px 20px", borderBottom: "1px solid #F3F4F6", fontSize: "14px" },
    tdNomor: { padding: "14px 20px", borderBottom: "1px solid #F3F4F6", fontSize: "14px", fontWeight: 700 },
    tdTarget: { padding: "14px 20px", borderBottom: "1px solid #F3F4F6", fontSize: "14px", fontWeight: 800, color: "#B34E33", textAlign: "center", fontFamily: "'Inter', sans-serif" },
    tdCenter: { padding: "14px 20px", borderBottom: "1px solid #F3F4F6", textAlign: "center" },
    trEven: { background: "#fff" },
    trOdd: { background: "#FBFBFA" },
    empty: { padding: "40px", textAlign: "center", color: "#9CA3AF", fontStyle: "italic" },
    btnPrimary: { background: "#B34E33", color: "#fff", border: 0, padding: "0 20px", height: "40px", borderRadius: "8px", fontWeight: 700, cursor: "pointer" },
    btnSecondary: { background: "#fff", border: "1px solid #D1D5DB", height: "40px", padding: "0 15px", borderRadius: "8px", cursor: "pointer", fontWeight: 700 },
    btnGhost: { background: "none", border: "none", color: "#6B7280", fontWeight: 600, cursor: "pointer" },
    btnEdit: { color: "#fff", background: "#b38600", border: "1px solid #D1D5DB", padding: "5px 12px", borderRadius: "6px", fontSize: "12px", marginRight: 5, cursor: "pointer" },
    btnDelete: { background: "#a01c29", border: "1px solid #FEE2E2", color: "#ffffff", padding: "5px 12px", borderRadius: "6px", fontSize: "12px", cursor: "pointer" },
    modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "grid", placeItems: "center", zIndex: 100 },
    modal: { background: "#fff", width: "400px", borderRadius: "20px", padding: "24px" },
    modalTitle: { fontSize: "20px", fontWeight: 800 },
    modalSub: { fontSize: "12px", color: "#6B7280" },
    formGroup: { marginBottom: "15px" },
    labelForm: { fontSize: "12px", fontWeight: 700, marginBottom: "5px", display: "block" },
    input: { width: "100%", height: "42px", borderRadius: "8px", border: "1px solid #D1D5DB", padding: "0 12px", boxSizing: "border-box" },
    btnCari: { background: "#E5E7EB", border: "1px solid #D1D5DB", borderRadius: "8px", padding: "0 15px", fontWeight: 700, cursor: "pointer" },
    btnPrimaryModal: { flex: 1, background: "#B34E33", color: "#fff", border: 0, height: "44px", borderRadius: "10px", fontWeight: 700, cursor: "pointer" },
    btnSecondaryModal: { flex: 1, background: "#F3F4F6", border: 0, height: "44px", borderRadius: "10px", fontWeight: 700, cursor: "pointer" }
};