/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    getManPower,
    saveManPower,
    deleteManPower,
} from "../../services/manPower.service";
import { useAuth } from "../../context/authProvider";
import { toast } from "react-toastify";
import { MdEdit, MdDelete } from "react-icons/md";
import { SkeletonTable } from "../../components/Skeleton";
import { formatDate } from "../../utils/date";

export default function ManPowerPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const userBagian = String(user?.user_bagian || "")
        .trim()
        .toUpperCase();
    const userKelompok = String(user?.user_kelompok || "").trim();

    const isAdmin = ["ADMIN", "IT"].includes(userBagian);
    const isJahit = userBagian === "JAHIT";
    const canInput = isAdmin || isJahit;
    const today = new Date().toISOString().slice(0, 10);

    // --- Responsive Detection ---
    const [windowWidth, setWindowWidth] = useState(
        typeof window !== "undefined" ? window.innerWidth : 1024
    );

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const isMobile = windowWidth <= 600;
    const isTablet = windowWidth > 600 && windowWidth <= 1024;

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

    const kelompokOptions = [
        "Line A",
        "Line B",
        "Line C",
        "Line D",
        "Line E",
        "Line F",
        "Line G",
        "Line H",
        "Line I",
        "Line J",
        "Line K",
    ];

    const isSameKelompok = (a, b) =>
        String(a || "")
            .trim()
            .toUpperCase() ===
        String(b || "")
            .trim()
            .toUpperCase();

    const canManageRow = (kelompokValue) => {
        if (isAdmin) return true;
        if (!isJahit) return false;
        return isSameKelompok(kelompokValue, userKelompok);
    };

    const kelompokSelectOptions = useMemo(() => {
        const normalized = (v) =>
            String(v || "")
                .trim()
                .toLowerCase();
        const current = normalized(formKelompok);
        const exists = kelompokOptions.some(
            (opt) => normalized(opt) === current,
        );

        if (!isAdmin && isJahit && userKelompok) {
            const own = kelompokOptions.find((opt) =>
                isSameKelompok(opt, userKelompok),
            );
            return [own || userKelompok];
        }

        if (editMode && formKelompok && !exists) {
            return [formKelompok, ...kelompokOptions];
        }

        return kelompokOptions;
    }, [editMode, formKelompok, isAdmin, isJahit, userKelompok]);

    const userLabel = useMemo(() => {
        if (!user) return "";
        return `${user.user_nama || ""} • ${user.user_bagian || ""}`.trim();
    }, [user]);

    // --- Data Loading ---
    const refreshData = async () => {
        setLoading(true);
        try {
            const res = await getManPower({
                lini,
                tanggal,
                cab: user?.user_cab,
                kelompok:
                    !isAdmin && isJahit && userKelompok
                        ? userKelompok
                        : undefined,
            });
            if (!res || !res.ok) {
                setRows([]);
                console.error(
                    "Gagal load manpower:",
                    res?.message || "Format response tidak valid",
                );
                return;
            }
            const serverRows = Array.isArray(res.data) ? res.data : [];
            const filteredRows =
                !isAdmin && isJahit && userKelompok
                    ? serverRows.filter((r) =>
                          isSameKelompok(r.kelompok, userKelompok),
                      )
                    : serverRows;

            setRows(filteredRows);
            return res;
        } catch (error) {
            setRows([]);
            console.error("Error fetching manpower:", error);
            toast.error("Gagal memuat data Man Power");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.user_cab) {
            refreshData();
        }
    }, [tanggal, user]);

    // --- Form Logic ---
    const openAdd = () => {
        setEditMode(false);
        setFormKelompok(!isAdmin && isJahit ? userKelompok : "");
        setMp("");
        setOpenForm(true);
    };

    const openEdit = (r) => {
        if (!canManageRow(r.kelompok)) {
            toast.warning("Anda hanya dapat mengelola kelompok sendiri");
            return;
        }

        const normalized = (v) =>
            String(v || "")
                .trim()
                .toLowerCase();
        const matchedOption = kelompokOptions.find(
            (opt) => normalized(opt) === normalized(r.kelompok),
        );

        setEditMode(true);
        setFormKelompok(matchedOption || r.kelompok || "");
        setMp(r.mp);
        setOpenForm(true);
    };

    const onSave = async (e) => {
        e.preventDefault();
        if (!formKelompok || !mp)
            return toast.warning("Lengkapi Kelompok dan Jumlah MP");

        setLoading(true);
        try {
            const finalKelompok = isAdmin
                ? formKelompok
                : isJahit
                  ? userKelompok
                  : formKelompok;

            const payload = {
                tanggal,
                cab: user?.user_cab,
                lini,
                kelompok: finalKelompok,
                mp: Number(mp || 0),
                user: user?.user_kode,
            };

            const res = await saveManPower(payload);
            if (res.ok) {
                toast.success(
                    editMode ? "Data diperbarui" : "Data ditambahkan",
                );
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
        if (!canManageRow(r.kelompok)) {
            toast.warning("Anda hanya dapat menghapus kelompok sendiri");
            return;
        }

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
        } catch (e) {
            toast.error("Gagal menghapus");
        }
    };

    return (
        <div style={{
            ...styles.page,
            padding: isMobile ? "12px" : "20px",
        }}>
            {/* HEADER - Identik dengan SpkTargetPage */}
            <div style={{
                ...styles.header,
                flexDirection: isMobile ? "column" : "row",
                alignItems: isMobile ? "stretch" : "center",
                gap: isMobile ? "16px" : "12px",
                padding: isMobile ? "16px" : "15px 20px",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <button
                        style={styles.btnGhost}
                        onClick={() => navigate("/menu")}
                    >
                        ← Back
                    </button>
                    <div>
                        <div style={styles.title}>Man Power Management</div>
                        <div style={styles.sub}>{userLabel}</div>
                    </div>
                </div>
                <div style={{
                    display: "flex",
                    gap: 8,
                    width: isMobile ? "100%" : "auto",
                    justifyContent: isMobile ? "stretch" : "flex-end"
                }}>
                    <button
                        style={{
                            ...styles.btnSecondary,
                            flex: isMobile ? 1 : "none",
                            height: "44px",
                        }}
                        onClick={() =>
                            toast.promise(refreshData(), {
                                pending: "Memuat data...",
                                success: "Data dimuat",
                                error: "Gagal muat data",
                            })
                        }
                        disabled={loading}
                    >
                        Refresh
                    </button>
                    {canInput && (
                        <button
                            style={{
                                ...styles.btnPrimary,
                                flex: isMobile ? 1 : "none",
                                height: "44px",
                            }}
                            onClick={openAdd}
                        >
                            + Tambah MP
                        </button>
                    )}
                </div>
            </div>

            {/* FILTERS */}
            <div style={{
                ...styles.filters,
                flexDirection: isMobile ? "column" : "row",
                alignItems: isMobile ? "stretch" : "end",
                gap: isMobile ? 16 : 12,
                padding: isMobile ? "16px" : "15px 20px",
            }}>
                <div style={{ flex: 1, width: "100%" }}>
                    <label style={styles.label}>Tanggal Produksi</label>
                    <input
                        type="date"
                        style={{ ...styles.inputFilter, width: "100%" }}
                        value={tanggal}
                        onChange={(e) => setTanggal(e.target.value)}
                    />
                </div>
                <div style={{ flex: 1, width: "100%" }}>
                    <label style={styles.label}>Lini</label>
                    <input style={{ ...styles.inputFilter, width: "100%" }} value={lini} disabled />
                </div>
            </div>

            {isMobile ? (
                /* Tampilan Card untuk Mobile */
                <div style={styles.cardList}>
                    {loading ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            {[1, 2, 3].map((n) => (
                                <div key={n} style={styles.mobileCard}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                                        <div className="skeleton" style={{ width: "120px", height: "20px", borderRadius: "4px" }}></div>
                                        <div className="skeleton" style={{ width: "80px", height: "36px", borderRadius: "8px" }}></div>
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                        <div className="skeleton" style={{ width: "100%", height: "16px", borderRadius: "4px" }}></div>
                                        <div className="skeleton" style={{ width: "60px", height: "24px", borderRadius: "4px" }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : rows.length === 0 ? (
                        <div style={styles.empty}>Data tidak ditemukan</div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            {rows.map((r, i) => (
                                <div key={i} style={styles.mobileCard}>
                                    <div style={styles.cardHeader}>
                                        <div style={styles.cardTitleWrap}>
                                            <span style={styles.cardLabel}>Kelompok</span>
                                            <span style={styles.cardNomor}>{r.kelompok}</span>
                                        </div>
                                        {canInput && canManageRow(r.kelompok) && (
                                            <div style={styles.cardActions}>
                                                <button
                                                    style={styles.btnEditMobile}
                                                    onClick={() => openEdit(r)}
                                                >
                                                    <MdEdit size={18} />
                                                </button>
                                                <button
                                                    style={styles.btnDeleteMobile}
                                                    onClick={() => onDelete(r)}
                                                >
                                                    <MdDelete size={18} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div style={styles.cardBody}>
                                        <div style={styles.cardField}>
                                            <span style={styles.cardFieldLabel}>Tanggal</span>
                                            <span style={styles.cardFieldVal}>{formatDate(r.tanggal)}</span>
                                        </div>
                                        <div style={styles.cardFieldTarget}>
                                            <span style={styles.cardFieldLabel}>Jumlah Tenaga Kerja (MP)</span>
                                            <span style={styles.cardTargetVal}>{r.mp} orang</span>
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
                                <th style={styles.th}>Tanggal</th>
                                <th style={styles.th}>Kelompok</th>
                                <th style={styles.thCenter}>Jumlah</th>
                                {canInput && <th style={styles.thCenter}>Aksi</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <SkeletonTable cols={canInput ? 4 : 3} rows={5} />
                            ) : (
                                rows.map((r, i) => (
                                    <tr
                                        key={i}
                                        style={
                                            i % 2 === 0
                                                ? styles.trEven
                                                : styles.trOdd
                                        }
                                    >
                                        <td style={styles.td}>{formatDate(r.tanggal)}</td>
                                        <td style={styles.tdBold}>{r.kelompok}</td>
                                        <td style={styles.tdTarget}>{r.mp}</td>
                                        {canInput && canManageRow(r.kelompok) && (
                                            <td style={styles.tdCenter}>
                                                <button
                                                    style={styles.btnEdit}
                                                    onClick={() => openEdit(r)}
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
                    {rows.length === 0 && !loading && (
                        <div style={styles.empty}>Data tidak ditemukan</div>
                    )}
                </div>
            )}

            {/* MODAL FORM */}
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
                            {editMode ? "Edit Man Power" : "Tambah Man Power"}
                        </div>
                        <p style={styles.modalSub}>
                            Lini: {lini} | Tanggal:{" "}
                            {formatDate(tanggal)}
                        </p>
                        <form onSubmit={onSave}>
                            <div style={styles.formGroup}>
                                <label style={styles.labelForm}>
                                    Kelompok Produksi
                                </label>
                                <select
                                    style={styles.input}
                                    value={formKelompok ?? ""}
                                    onChange={(e) =>
                                        setFormKelompok(e.target.value)
                                    }
                                    disabled={!isAdmin && isJahit}
                                >
                                    <option value="" disabled>
                                        Pilih kelompok produksi
                                    </option>

                                    {userKelompok &&
                                        !kelompokSelectOptions.some((opt) =>
                                            isSameKelompok(opt, userKelompok),
                                        ) && (
                                            <option value={userKelompok}>
                                                {userKelompok}
                                            </option>
                                        )}

                                    {(Array.isArray(kelompokSelectOptions)
                                        ? kelompokSelectOptions
                                        : []
                                    ).map((opt) => (
                                        <option
                                            key={`kelompok-${opt}`}
                                            value={opt}
                                        >
                                            {opt}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.labelForm}>
                                    Jumlah Tenaga Kerja (MP)
                                </label>
                                <input
                                    style={styles.input}
                                    value={mp}
                                    onChange={(e) => setMp(e.target.value)}
                                    type="number"
                                    placeholder="0"
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
                                    style={styles.btnPrimaryModal}
                                    disabled={loading}
                                >
                                    {loading
                                        ? "Proses..."
                                        : editMode
                                          ? "Update"
                                          : "Simpan"}
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
        display: "flex",
        flexWrap: "wrap",
        gap: 16,
        background: "#fff",
        border: "1px solid #E5E7EB",
        borderRadius: "12px",
        padding: "15px 20px",
        marginBottom: 15,
    },
    label: {
        fontSize: "13px",
        fontWeight: 800,
        color: "#374151",
        textTransform: "uppercase",
        marginBottom: 8,
        display: "block",
    },
    inputFilter: {
        width: "100%",
        height: "40px",
        borderRadius: "8px",
        border: "1px solid #D1D5DB",
        padding: "0 10px",
        outline: "none",
        fontFamily: "Inherit",
        boxSizing: "border-box",
    },

    tableWrap: {
        background: "#fff",
        border: "1px solid #E5E7EB",
        borderRadius: "16px",
        overflowX: "auto",
        WebkitOverflowScrolling: "touch",
    },
    table: { width: "100%", borderCollapse: "collapse", minWidth: "500px" },
    th: {
        textAlign: "left",
        padding: "14px 20px",
        fontSize: "11px",
        fontWeight: 800,
        background: "#F9FAFB",
        borderBottom: "1px solid #E5E7EB",
        color: "#4B5563",
        textTransform: "uppercase",
    },
    thCenter: {
        textAlign: "center",
        padding: "14px 20px",
        fontSize: "11px",
        fontWeight: 800,
        background: "#F9FAFB",
        borderBottom: "1px solid #E5E7EB",
        color: "#4B5563",
        textTransform: "uppercase",
    },

    td: {
        padding: "14px 20px",
        borderBottom: "1px solid #F3F4F6",
        fontSize: "14px",
    },
    tdBold: {
        padding: "14px 20px",
        borderBottom: "1px solid #F3F4F6",
        fontSize: "14px",
        fontWeight: 700,
    },
    tdTarget: {
        padding: "14px 20px",
        borderBottom: "1px solid #F3F4F6",
        fontSize: "16px",
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
        border: "none",
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
        color: "#fff",
        background: "#a01c29",
        border: "none",
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
    modalSub: { fontSize: "12px", color: "#6B7280", marginBottom: 15 },
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
        color: "#374151",
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
