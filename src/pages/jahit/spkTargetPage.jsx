/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { useEffect, useMemo, useState, useCallback } from "react";
import { loadUser } from "../../utils/storage";
import {
    getLini,
    getSpkTargets,
    createSpkTarget,
    updateSpkTarget,
    deleteSpkTarget,
    cariSpkTarget,
} from "../../services/spkTarget.service";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { MdEdit, MdDelete } from "react-icons/md";
import { RxCross1 } from "react-icons/rx";
import { SkeletonTable } from "../../components/Skeleton";

export default function SpkTargetPage() {
    const navigate = useNavigate();

    // Ambil state dari navigasi jika ada (misal dari MenuPage)
    const locationState =
        typeof window !== "undefined" && window.history?.state?.usr
            ? window.history.state.usr
            : {};
    const user = useMemo(() => loadUser(), []);
    const isAdmin = ["ADMIN", "IT"].includes(
        (user?.user_bagian || "").toUpperCase(),
    );

    // --- Responsive Detection ---
    const [windowWidth, setWindowWidth] = useState(
        typeof window !== "undefined" ? window.innerWidth : 1024,
    );

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const isMobile = windowWidth <= 600;
    const isTablet = windowWidth > 600 && windowWidth <= 1024;

    // --- States ---
    const [liniList, setLiniList] = useState([]);
    const [selectedLini, setSelectedLini] = useState("");
    const [rows, setRows] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isLiniOpen, setIsLiniOpen] = useState(false);
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
        if (!nomor.trim() || !targetPerJam)
            return toast.warning("Data belum lengkap");

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
                    user_create: user.user_kode,
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
            const res = await deleteSpkTarget(
                r.nomor,
                user.user_cab,
                selectedLini,
            );
            if (res.ok) {
                toast.success("Terhapus");
                refresh();
            }
        } catch (e) {
            toast.error("Gagal hapus");
        }
    };

    const filteredRows = useMemo(() => {
        const keyword = searchTerm.trim().toLowerCase();
        if (!keyword) return rows;

        return rows.filter((r) => {
            const nomor = String(r.nomor || "").toLowerCase();
            const nama = String(r.nama || "").toLowerCase();
            return nomor.includes(keyword) || nama.includes(keyword);
        });
    }, [rows, searchTerm]);

    return (
        <div
            style={{
                ...styles.page,
                padding: isMobile ? "12px" : "20px",
            }}
        >
            <div
                style={{
                    ...styles.header,
                    flexDirection: isMobile ? "column" : "row",
                    alignItems: isMobile ? "stretch" : "center",
                    gap: isMobile ? "16px" : "12px",
                    padding: isMobile ? "16px" : "15px 20px",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <button
                        style={styles.btnGhost}
                        onClick={() => navigate("/menu")}
                    >
                        ← Back
                    </button>
                    <div>
                        <div style={styles.title}>SPK Target per Jam</div>
                        <div style={styles.sub}>
                            {user?.user_nama} • {selectedLini}
                        </div>
                    </div>
                </div>
                <div
                    style={{
                        display: "flex",
                        gap: 8,
                        width: isMobile ? "100%" : "auto",
                        justifyContent: isMobile ? "stretch" : "flex-end",
                    }}
                >
                    <button
                        style={{
                            ...styles.btnSecondary,
                            flex: isMobile ? 1 : "none",
                            height: "44px",
                        }}
                        onClick={() =>
                            toast.promise(refreshWithToast(), {
                                pending: "Sinkronisasi data...",
                                success: "Sinkronisasi selesai",
                                error: "Gagal sinkronisasi",
                            })
                        }
                        disabled={loading}
                    >
                        Refresh
                    </button>
                    {isAdmin && (
                        <button
                            style={{
                                ...styles.btnPrimary,
                                flex: isMobile ? 1 : "none",
                                height: "44px",
                            }}
                            onClick={() => {
                                setEditMode(false);
                                setNomor("");
                                setNama("");
                                setTargetPerJam("");
                                setSpkClosed(false);
                                setOpenForm(true);
                            }}
                        >
                            + Tambah SPK
                        </button>
                    )}
                </div>
            </div>

            <div
                style={{
                    ...styles.filters,
                    flexDirection: isMobile ? "column" : "row",
                    alignItems: isMobile ? "stretch" : "end",
                    gap: isMobile ? 16 : 12,
                    padding: isMobile ? "16px" : "15px 20px",
                }}
            >
                <div style={{ flex: 1, width: "100%" }}>
                    <label style={styles.label}>Pilih Lini Produksi</label>
                    <div
                        style={{
                            ...styles.selectWrap,
                            maxWidth: isMobile ? "none" : "300px",
                        }}
                    >
                        <select
                            value={selectedLini}
                            onChange={(e) => {
                                setSelectedLini(e.target.value);
                                setIsLiniOpen(false);
                            }}
                            onFocus={() => setIsLiniOpen(true)}
                            onBlur={() => setIsLiniOpen(false)}
                            onKeyDown={(e) => {
                                if (e.key === "Escape") {
                                    setIsLiniOpen(false);
                                }
                            }}
                            style={{
                                ...styles.select,
                                maxWidth: isMobile ? "none" : "300px",
                            }}
                        >
                            {liniList.map((l) => (
                                <option
                                    key={l.lini_kode || l.lini_nama}
                                    value={l.lini_nama}
                                >
                                    {l.lini_nama}
                                </option>
                            ))}
                        </select>
                        <span
                            style={{
                                ...styles.selectArrow,
                                transform: isLiniOpen
                                    ? "translateY(-50%) rotate(180deg)"
                                    : "translateY(-50%) rotate(0deg)",
                            }}
                        />
                    </div>
                </div>

                <div style={{ flex: 1, width: "100%" }}>
                    <label style={styles.label}>Cari SPK / Nama Produk</label>
                    <div
                        style={{
                            ...styles.searchWrap,
                            maxWidth: isMobile ? "none" : "420px",
                        }}
                    >
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Ketik nomor SPK atau Nama Produk..."
                            style={styles.searchInput}
                        />
                        {searchTerm && (
                            <button
                                type="button"
                                onClick={() => setSearchTerm("")}
                                style={styles.clearSearchBtn}
                            >
                                ×
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {isMobile ? (
                /* Tampilan Card untuk Mobile */
                <div style={styles.cardList}>
                    {loading ? (
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 12,
                            }}
                        >
                            {[1, 2, 3].map((n) => (
                                <div key={n} style={styles.mobileCard}>
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            marginBottom: 12,
                                        }}
                                    >
                                        <div
                                            className="skeleton"
                                            style={{
                                                width: "120px",
                                                height: "20px",
                                                borderRadius: "4px",
                                            }}
                                        ></div>
                                        <div
                                            className="skeleton"
                                            style={{
                                                width: "80px",
                                                height: "36px",
                                                borderRadius: "8px",
                                            }}
                                        ></div>
                                    </div>
                                    <div
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: 8,
                                        }}
                                    >
                                        <div
                                            className="skeleton"
                                            style={{
                                                width: "100%",
                                                height: "16px",
                                                borderRadius: "4px",
                                            }}
                                        ></div>
                                        <div
                                            className="skeleton"
                                            style={{
                                                width: "60px",
                                                height: "24px",
                                                borderRadius: "4px",
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : filteredRows.length === 0 ? (
                        <div style={styles.empty}>Data tidak ditemukan</div>
                    ) : (
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 12,
                            }}
                        >
                            {filteredRows.map((r) => (
                                <div key={r.nomor} style={styles.mobileCard}>
                                    <div style={styles.cardHeader}>
                                        <div style={styles.cardTitleWrap}>
                                            <span style={styles.cardLabel}>
                                                No. SPK
                                            </span>
                                            <span style={styles.cardNomor}>
                                                {r.nomor}
                                            </span>
                                        </div>
                                        {isAdmin && (
                                            <div style={styles.cardActions}>
                                                <button
                                                    style={styles.btnEditMobile}
                                                    onClick={() => {
                                                        setEditMode(true);
                                                        setNomor(r.nomor);
                                                        setNama(r.nama);
                                                        setTargetPerJam(
                                                            r.target,
                                                        );
                                                        setSpkClosed(false);
                                                        setOpenForm(true);
                                                    }}
                                                >
                                                    <MdEdit size={18} />
                                                </button>
                                                <button
                                                    style={
                                                        styles.btnDeleteMobile
                                                    }
                                                    onClick={() => onDelete(r)}
                                                >
                                                    <MdDelete size={18} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div style={styles.cardBody}>
                                        <div style={styles.cardField}>
                                            <span style={styles.cardFieldLabel}>
                                                Nama Produk
                                            </span>
                                            <span style={styles.cardFieldVal}>
                                                {r.nama || "-"}
                                            </span>
                                        </div>
                                        <div style={styles.cardFieldTarget}>
                                            <span style={styles.cardFieldLabel}>
                                                Target / Jam
                                            </span>
                                            <span style={styles.cardTargetVal}>
                                                {r.target}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                /* Tampilan Tabel untuk Tablet & Desktop */
                <div style={styles.tableWrap}>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Nomor SPK</th>
                                <th style={styles.th}>Nama Produk</th>
                                <th style={styles.thCenter}>Target/Jam</th>
                                {isAdmin && (
                                    <th style={styles.thCenter}>Aksi</th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <SkeletonTable
                                    cols={isAdmin ? 4 : 3}
                                    rows={5}
                                />
                            ) : (
                                filteredRows.map((r, i) => (
                                    <tr
                                        key={r.nomor}
                                        style={
                                            i % 2 === 0
                                                ? styles.trEven
                                                : styles.trOdd
                                        }
                                    >
                                        <td style={styles.tdNomor}>
                                            {r.nomor}
                                        </td>
                                        <td style={styles.td}>
                                            {r.nama || "-"}
                                        </td>
                                        <td style={styles.tdTarget}>
                                            {r.target}
                                        </td>
                                        {isAdmin && (
                                            <td style={styles.tdCenter}>
                                                <button
                                                    style={styles.btnEdit}
                                                    onClick={() => {
                                                        setEditMode(true);
                                                        setNomor(r.nomor);
                                                        setNama(r.nama);
                                                        setTargetPerJam(
                                                            r.target,
                                                        );
                                                        setSpkClosed(false);
                                                        setOpenForm(true);
                                                    }}
                                                >
                                                    <MdEdit />
                                                </button>
                                                <button
                                                    style={styles.btnDelete}
                                                    onClick={() => onDelete(r)}
                                                >
                                                    <MdDelete />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                    {filteredRows.length === 0 && !loading && (
                        <div style={styles.empty}>Data tidak ditemukan</div>
                    )}
                </div>
            )}

            {/* MODAL */}
            {openForm && (
                <div
                    style={styles.modalOverlay}
                    onClick={() => setOpenForm(false)}
                >
                    <div
                        style={{
                            ...styles.modal,
                            width: isMobile ? "92%" : "90%",
                            padding: isMobile ? "20px" : "24px",
                            maxHeight: "90vh",
                            overflowY: "auto",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={styles.modalTitle}>
                            {editMode ? "Edit Target" : "Tambah Target"}
                        </div>
                        <p style={styles.modalSub}>
                            Lini: {selectedLini} | Cabang: {user?.user_cab}
                        </p>

                        <form onSubmit={onSave} style={{ marginTop: 20 }}>
                            <div style={styles.formGroup}>
                                <label style={styles.labelForm}>
                                    Nomor SPK
                                </label>
                                <div style={{ display: "flex", gap: 8 }}>
                                    <input
                                        style={{
                                            ...styles.input,
                                            flex: 1,
                                            backgroundColor:
                                                editMode || spkClosed
                                                    ? "#F3F4F6"
                                                    : "#fff",
                                        }}
                                        value={nomor}
                                        onChange={(e) => {
                                            setNomor(
                                                e.target.value.toUpperCase(),
                                            );
                                            if (!editMode) {
                                                setNama("");
                                                setSpkClosed(false);
                                            }
                                        }}
                                        disabled={editMode || spkClosed}
                                        placeholder="Input Nomor..."
                                    />
                                    {!editMode && (
                                        <button
                                            type="button"
                                            style={{
                                                ...styles.btnCari,
                                                height: "42px",
                                            }}
                                            onClick={handleCariSpk}
                                            disabled={loadingCari || !nomor}
                                        >
                                            {loadingCari ? "..." : "Cari"}
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.labelForm}>
                                    Nama Produk
                                </label>
                                <input
                                    style={{
                                        ...styles.input,
                                        backgroundColor: "#F9FAFB",
                                    }}
                                    disabled={true}
                                    value={nama}
                                    readOnly
                                    placeholder="Otomatis terisi..."
                                />
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.labelForm}>
                                    Target per Jam
                                </label>
                                <input
                                    style={styles.input}
                                    type="number"
                                    value={targetPerJam}
                                    onChange={(e) =>
                                        setTargetPerJam(e.target.value)
                                    }
                                    disabled={spkClosed}
                                />
                            </div>

                            <div
                                style={{
                                    display: "flex",
                                    gap: 10,
                                    marginTop: 24,
                                }}
                            >
                                <button
                                    type="button"
                                    style={styles.btnSecondaryModal}
                                    onClick={() => setOpenForm(false)}
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    style={{
                                        ...styles.btnPrimaryModal,
                                        opacity: spkClosed ? 0.5 : 1,
                                    }}
                                    disabled={spkClosed || loading}
                                >
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
    page: {
        minHeight: "100vh",
        background: "#F9FAFB",
        padding: "20px",
        fontFamily: "'Readex Pro', sans-serif",
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "12px",
        background: "#fff",
        padding: "15px 20px",
        borderRadius: "16px",
        border: "1px solid #E5E7EB",
        marginBottom: 20,
    },
    title: { fontSize: "18px", fontWeight: 800, color: "#111827" },
    sub: { fontSize: "12px", color: "#6B7280" },
    filters: {
        background: "#fff",
        border: "1px solid #E5E7EB",
        borderRadius: "12px",
        padding: "15px 20px",
        marginBottom: 15,
        display: "flex",
        flexWrap: "wrap",
        gap: 12,
        alignItems: "end",
    },
    label: {
        fontSize: "11px",
        fontWeight: 800,
        color: "#374151",
        textTransform: "uppercase",
        marginBottom: 8,
        display: "block",
    },
    select: {
        width: "100%",
        maxWidth: "300px",
        height: "40px",
        borderRadius: "8px",
        border: "1px solid #D1D5DB",
        padding: "0 36px 0 10px",
        outline: "none",
        appearance: "none",
        WebkitAppearance: "none",
        MozAppearance: "none",
        boxSizing: "border-box",
    },
    selectWrap: { position: "relative", width: "100%", maxWidth: "300px" },
    selectArrow: {
        position: "absolute",
        right: 12,
        top: "50%",
        width: 0,
        height: 0,
        borderLeft: "5px solid transparent",
        borderRight: "5px solid transparent",
        borderTop: "6px solid #6B7280",
        pointerEvents: "none",
        transition: "transform 180ms ease",
    },
    searchWrap: {
        position: "relative",
        width: "100%",
        maxWidth: "420px",
        display: "flex",
        alignItems: "center",
    },
    searchInput: {
        width: "100%",
        height: "40px",
        borderRadius: "8px",
        border: "1px solid #D1D5DB",
        padding: "0 36px 0 12px",
        outline: "none",
        boxSizing: "border-box",
    },
    clearSearchBtn: {
        position: "absolute",
        right: 10,
        background: "transparent",
        border: "none",
        cursor: "pointer",
        fontSize: "20px",
        color: "#B34E33",
    },
    tableWrap: {
        background: "#fff",
        border: "1px solid #E5E7EB",
        borderRadius: "16px",
        overflowX: "auto",
        WebkitOverflowScrolling: "touch",
    },
    table: { width: "100%", borderCollapse: "collapse", minWidth: "600px" },
    th: {
        textAlign: "left",
        padding: "14px 20px",
        fontSize: "11px",
        fontWeight: 800,
        background: "#F9FAFB",
        borderBottom: "1px solid #E5E7EB",
        color: "#4B5563",
    },
    thCenter: {
        textAlign: "center",
        padding: "14px 20px",
        fontSize: "11px",
        fontWeight: 800,
        background: "#F9FAFB",
        borderBottom: "1px solid #E5E7EB",
        color: "#4B5563",
    },
    td: {
        padding: "14px 20px",
        borderBottom: "1px solid #F3F4F6",
        fontSize: "14px",
    },
    tdNomor: {
        padding: "14px 20px",
        borderBottom: "1px solid #F3F4F6",
        fontSize: "14px",
        fontWeight: 700,
    },
    tdTarget: {
        padding: "14px 20px",
        borderBottom: "1px solid #F3F4F6",
        fontSize: "14px",
        fontWeight: 800,
        color: "#B34E33",
        textAlign: "center",
        fontFamily: "'Inter', sans-serif",
    },
    tdCenter: {
        padding: "14px 20px",
        borderBottom: "1px solid #F3F4F6",
        textAlign: "center",
    },
    trEven: { background: "#fff" },
    trOdd: { background: "#FBFBFA" },
    empty: {
        padding: "40px",
        textAlign: "center",
        color: "#9CA3AF",
        fontStyle: "italic",
    },
    btnPrimary: {
        background: "#B34E33",
        color: "#fff",
        border: 0,
        padding: "0 20px",
        height: "40px",
        borderRadius: "8px",
        fontWeight: 700,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
    },
    btnSecondary: {
        background: "#fff",
        border: "1px solid #D1D5DB",
        height: "40px",
        padding: "0 15px",
        borderRadius: "8px",
        cursor: "pointer",
        fontWeight: 700,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
    },
    btnGhost: {
        background: "none",
        border: "none",
        color: "#6B7280",
        fontWeight: 600,
        cursor: "pointer",
    },
    btnEdit: {
        color: "#fff",
        background: "#b38600",
        border: "1px solid #D1D5DB",
        padding: "8px 14px",
        borderRadius: "6px",
        fontSize: "13px",
        marginRight: 5,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "36px",
    },
    btnDelete: {
        background: "#a01c29",
        border: "1px solid #FEE2E2",
        color: "#ffffff",
        padding: "8px 14px",
        borderRadius: "6px",
        fontSize: "13px",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "36px",
    },
    modalOverlay: {
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "grid",
        placeItems: "center",
        zIndex: 100,
    },
    modal: {
        background: "#fff",
        width: "90%",
        maxWidth: "400px",
        borderRadius: "20px",
        padding: "24px",
        boxSizing: "border-box",
    },
    modalTitle: { fontSize: "20px", fontWeight: 800 },
    modalSub: { fontSize: "12px", color: "#6B7280" },
    formGroup: { marginBottom: "15px" },
    labelForm: {
        fontSize: "12px",
        fontWeight: 700,
        marginBottom: "5px",
        display: "block",
    },
    input: {
        width: "100%",
        height: "42px",
        borderRadius: "8px",
        border: "1px solid #D1D5DB",
        padding: "0 12px",
        boxSizing: "border-box",
    },
    btnCari: {
        background: "#E5E7EB",
        border: "1px solid #D1D5DB",
        borderRadius: "8px",
        padding: "0 15px",
        fontWeight: 700,
        cursor: "pointer",
    },
    btnPrimaryModal: {
        flex: 1,
        background: "#B34E33",
        color: "#fff",
        border: 0,
        height: "44px",
        borderRadius: "10px",
        fontWeight: 700,
        cursor: "pointer",
    },
    btnSecondaryModal: {
        flex: 1,
        background: "#F3F4F6",
        border: 0,
        height: "44px",
        borderRadius: "10px",
        fontWeight: 700,
        cursor: "pointer",
    },

    /* --- Mobile Card List Styles --- */
    cardList: {
        display: "flex",
        flexDirection: "column",
        gap: "12px",
    },
    mobileCard: {
        background: "#ffffff",
        border: "1px solid #E5E7EB",
        borderRadius: "16px",
        padding: "16px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.03)",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
    },
    cardHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "1px solid #F3F4F6",
        paddingBottom: "10px",
    },
    cardTitleWrap: {
        display: "flex",
        flexDirection: "column",
        gap: "2px",
    },
    cardLabel: {
        fontSize: "10px",
        fontWeight: 700,
        color: "#9CA3AF",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
    },
    cardNomor: {
        fontSize: "15px",
        fontWeight: 800,
        color: "#111827",
    },
    cardActions: {
        display: "flex",
        gap: "6px",
    },
    btnEditMobile: {
        color: "#fff",
        background: "#b38600",
        border: "none",
        width: "38px",
        height: "38px",
        borderRadius: "8px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "opacity 0.2s",
    },
    btnDeleteMobile: {
        color: "#fff",
        background: "#a01c29",
        border: "none",
        width: "38px",
        height: "38px",
        borderRadius: "8px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "opacity 0.2s",
    },
    cardBody: {
        display: "flex",
        flexDirection: "column",
        gap: "10px",
    },
    cardField: {
        display: "flex",
        flexDirection: "column",
        gap: "2px",
    },
    cardFieldLabel: {
        fontSize: "11px",
        fontWeight: 700,
        color: "#6B7280",
    },
    cardFieldVal: {
        fontSize: "14px",
        color: "#374151",
        fontWeight: 500,
    },
    cardFieldTarget: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: "#FFFBF7",
        padding: "8px 12px",
        borderRadius: "8px",
        border: "1px solid #F1E9E2",
    },
    cardTargetVal: {
        fontSize: "15px",
        fontWeight: 800,
        color: "#B34E33",
        fontFamily: "'Inter', sans-serif",
    },
};
