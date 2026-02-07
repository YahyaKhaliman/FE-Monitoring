/* eslint-disable no-unused-vars */
import { useEffect, useMemo, useState } from "react";
import { loadUser } from "../utils/storage";
import {
    getLini,
    getSpkTargets,
    createSpkTarget,
    updateSpkTarget,
    deleteSpkTarget,
} from "../services/spkTarget.service";
import { useNavigate } from "react-router-dom";

export default function SpkTargetPage() {
    const navigate = useNavigate();
    const user = useMemo(() => loadUser(), []);
    const isAdmin = (user?.user_bagian || "").toUpperCase() === "ADMIN"; // mapping zlini Delphi

    const [liniList, setLiniList] = useState([]);
    const [selectedLini, setSelectedLini] = useState("");

    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState(null);

    const [openForm, setOpenForm] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [nomor, setNomor] = useState("");
    const [nama, setNama] = useState("");
    const [targetPerJam, setTargetPerJam] = useState("");

    useEffect(() => {
        if (!user) {
        navigate("/login", { replace: true });
        return;
        }

        (async () => {
        try {
            const res = await getLini();
            if (!res.ok) {
            setMsg(res.message || "Gagal load lini");
            return;
            }
            setLiniList(res.data || []);
            const first = res.data?.[0];
            if (first) setSelectedLini(first.lini_nama || first.lini_kode || "");
        } catch (e) {
            setMsg("Server error (load lini)");
        }
        })();
    }, [navigate, user]);

    useEffect(() => {
        if (!selectedLini || !user?.user_cab) return;
        refresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedLini]);

    async function refresh() {
        setLoading(true);
        setMsg(null);
        try {
        const res = await getSpkTargets(user.user_cab, selectedLini);
        if (!res.ok) {
            setMsg(res.message || "Gagal load data");
            setRows([]);
            return;
        }
        setRows(res.data || []);
        } catch (e) {
        setMsg("Server error (load data)");
        } finally {
        setLoading(false);
        }
    }

    function openAdd() {
        setEditMode(false);
        setNomor("");
        setNama("");
        setTargetPerJam("");
        setOpenForm(true);
    }

    function openEdit(r) {
        setEditMode(true);
        setNomor(r.nomor);
        setNama(r.nama);
        setTargetPerJam(String(r.target ?? ""));
        setOpenForm(true);
    }

    async function onSave(e) {
        e.preventDefault();
        setMsg(null);

        if (!nomor.trim()) return setMsg("Nomor SPK wajib diisi");
        if (!targetPerJam || Number(targetPerJam) <= 0) return setMsg("Target per jam harus > 0");

        try {
        if (editMode) {
            const res = await updateSpkTarget(nomor.trim(), {
            cab: user.user_cab,
            lini: selectedLini,
            target_per_jam: Number(targetPerJam),
            });
            if (!res.ok) return setMsg(res.message || "Gagal update");
        } else {
            const res = await createSpkTarget({
            nomor: nomor.trim(),
            cab: user.user_cab,
            lini: selectedLini,
            target_per_jam: Number(targetPerJam),
            user_create: user.user_kode,
            });
            if (!res.ok) return setMsg(res.message || "Gagal simpan");
        }

        setOpenForm(false);
        await refresh();
        } catch (e) {
        setMsg("Server error (simpan)");
        }
    }

    async function onDelete(r) {
        if (!window.confirm(`Hapus target SPK ${r.nomor}?`)) return;

        setMsg(null);
        try {
        const res = await deleteSpkTarget(r.nomor, user.user_cab, selectedLini);
        if (!res.ok) return setMsg(res.message || "Gagal hapus");
        await refresh();
        } catch (e) {
        setMsg("Server error (hapus)");
        }
    }

    return (
        <div style={styles.page}>
        <div style={styles.header}>
            <button style={styles.btnGhost} onClick={() => navigate("/menu")}>Back</button>
            <div>
            <div style={styles.title}>List SPK Target per Jam</div>
            <div style={styles.sub}>{user?.user_nama} : {user?.user_cab} {user?.user_bagian} {user?.user_kelompok}</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
            <button style={styles.btnGhost} onClick={refresh} disabled={loading}>
                Refresh
            </button>
            {isAdmin && (
                <button style={styles.btnPrimary} onClick={openAdd}>
                Tambah
                </button>
            )}
            </div>
        </div>

        <div style={styles.filters}>
            <label style={styles.label}>Lini</label>
            <select
            value={selectedLini}
            onChange={(e) => setSelectedLini(e.target.value)}
            style={styles.select}
            >
            {liniList.map((l) => {
                const val = l.lini_nama || l.lini_kode;
                return (
                <option key={l.lini_kode || val} value={val}>
                    {val}
                </option>
                );
            })}
            </select>
        </div>

        {msg && <div style={styles.msg}>{msg}</div>}

        <div style={styles.tableWrap}>
            <table style={styles.table}>
            <thead>
                <tr>
                <th style={styles.th}>Nomor</th>
                <th style={styles.th}>Nama</th>
                <th style={styles.th}>Target/Jam</th>
                {isAdmin && <th style={styles.th}>Aksi</th>}
                </tr>
            </thead>
            <tbody>
                {rows.map((r) => (
                <tr key={r.nomor}>
                    <td style={styles.td}>{r.nomor}</td>
                    <td style={styles.td}>{r.nama}</td>
                    <td style={styles.td}>{r.target}</td>
                    {isAdmin && (
                    <td style={styles.td}>
                        <button style={styles.btnSmall} onClick={() => openEdit(r)}>Edit</button>
                        <button style={styles.btnSmallDanger} onClick={() => onDelete(r)}>Hapus</button>
                    </td>
                    )}
                </tr>
                ))}
                {!loading && rows.length === 0 && (
                <tr>
                    <td style={styles.td} colSpan={isAdmin ? 4 : 3}>
                    Tidak ada data
                    </td>
                </tr>
                )}
                {loading && (
                <tr>
                    <td style={styles.td} colSpan={isAdmin ? 4 : 3}>
                    Loading...
                    </td>
                </tr>
                )}
            </tbody>
            </table>
        </div>

        {/* Form modal sederhana */}
        {openForm && (
            <div style={styles.modalOverlay} onClick={() => setOpenForm(false)}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div style={styles.modalTitle}>{editMode ? "Edit SPK Target" : "Tambah SPK Target"}</div>

                <form onSubmit={onSave}>
                <label style={styles.label}>Nomor SPK</label>
                <input
                    style={styles.input}
                    value={nomor}
                    onChange={(e) => setNomor(e.target.value)}
                    disabled={editMode}
                    placeholder="mis: SPK-001"
                />

                <label style={styles.label}>Nama</label>
                <input
                    style={styles.input}
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    placeholder="(opsional, bisa otomatis nanti)"
                />

                <label style={styles.label}>Target per Jam</label>
                <input
                    style={styles.input}
                    value={targetPerJam}
                    onChange={(e) => setTargetPerJam(e.target.value)}
                    inputMode="numeric"
                    placeholder="mis: 120"
                />

                <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                    <button type="button" style={styles.btnGhost} onClick={() => setOpenForm(false)}>
                    Batal
                    </button>
                    <button type="submit" style={styles.btnPrimary}>
                    Simpan
                    </button>
                </div>
                </form>

                <div style={styles.note}>
                Cab: <b>{user.user_cab}</b> | Lini: <b>{selectedLini}</b>
                </div>
            </div>
            </div>
        )}
        </div>
    );
}

const styles = {
    page: { minHeight: "100vh", background: "#0f172a", padding: 16, color: "#e5e7eb" },
    header: {
        background: "#111827",
        border: "1px solid #1f2937",
        borderRadius: 12,
        padding: 14,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
    },
    title: { fontSize: 16, fontWeight: 800 },
    sub: { fontSize: 12, color: "#9ca3af", marginTop: 4 },

    filters: {
        marginTop: 12,
        background: "#111827",
        border: "1px solid #1f2937",
        borderRadius: 12,
        padding: 12,
        display: "flex",
        alignItems: "center",
        gap: 10,
    },
    label: { fontSize: 12, color: "#cbd5e1", display: "block", marginBottom: 6 },
    select: {
        height: 36,
        borderRadius: 10,
        border: "1px solid #334155",
        background: "#0b1220",
        color: "#e5e7eb",
        padding: "0 10px",
        outline: "none",
        minWidth: 220,
    },

    msg: {
        marginTop: 12,
        padding: 10,
        borderRadius: 10,
        background: "#3b1111",
        border: "1px solid #7f1d1d",
        color: "#fecaca",
    },

    tableWrap: {
        marginTop: 12,
        background: "#111827",
        border: "1px solid #1f2937",
        borderRadius: 12,
        overflow: "hidden",
    },
    table: { width: "100%", borderCollapse: "collapse" },
    th: { textAlign: "left", padding: 12, fontSize: 12, color: "#9ca3af", borderBottom: "1px solid #1f2937" },
    td: { padding: 12, borderBottom: "1px solid #1f2937", fontSize: 13 },

    btnGhost: {
        height: 34,
        padding: "0 12px",
        borderRadius: 10,
        border: "1px solid #334155",
        background: "transparent",
        color: "#e5e7eb",
        cursor: "pointer",
    },
    btnPrimary: {
        height: 34,
        padding: "0 12px",
        borderRadius: 10,
        border: 0,
        background: "#16a34a",
        color: "white",
        fontWeight: 800,
        cursor: "pointer",
    },
    btnSmall: {
        height: 28,
        padding: "0 10px",
        borderRadius: 10,
        border: "1px solid #334155",
        background: "transparent",
        color: "#e5e7eb",
        cursor: "pointer",
        marginRight: 8,
    },
    btnSmallDanger: {
        height: 28,
        padding: "0 10px",
        borderRadius: 10,
        border: 0,
        background: "#dc2626",
        color: "white",
        cursor: "pointer",
    },

    modalOverlay: {
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        display: "grid",
        placeItems: "center",
        padding: 16,
    },
    modal: {
        width: 420,
        maxWidth: "100%",
        background: "#111827",
        border: "1px solid #1f2937",
        borderRadius: 14,
        padding: 16,
    },
    modalTitle: { fontSize: 16, fontWeight: 800, marginBottom: 10 },
    input: {
        width: "100%",
        height: 38,
        borderRadius: 10,
        border: "1px solid #334155",
        background: "#0b1220",
        color: "#e5e7eb",
        padding: "0 10px",
        outline: "none",
        marginBottom: 10,
    },
    note: { marginTop: 12, fontSize: 12, color: "#9ca3af" },
};
