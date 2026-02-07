import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../context/authProvider";

export default function UnderConstructionPage() {
    const navigate = useNavigate();

    const { logout } = useAuth();

    function handleLogout() {
        toast.dismiss();
        toast.info(
            <div style={{
                fontFamily: "'Readex Pro', sans-serif",
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', width: '100%'
            }}>
                <p style={{ margin: '0 0 12px 0', fontWeight: 600, color: '#111827', fontSize: '14px' }}>
                    Apakah Anda yakin ingin keluar?
                </p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <button
                        onClick={() => {
                            if(logout) logout();
                            navigate("/login", { replace: true });
                            toast.dismiss();
                        }}
                        style={{
                            background: '#B34E33', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '12px', transition: 'opacity 0.2s'
                        }}
                        onMouseOver={e => e.currentTarget.style.opacity = '0.8'}
                        onMouseOut={e => e.currentTarget.style.opacity = '1'}
                    >
                        Ya, Keluar
                    </button>
                    <button
                        onClick={() => toast.dismiss()}
                        style={{
                            background: '#E5E7EB', color: '#374151', border: 'none', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '12px'
                        }}
                    >
                        Batal
                    </button>
                </div>
            </div>,
            {
                position: "top-center",
                autoClose: false,
                closeOnClick: false,
                draggable: false,
                icon: false,
                closeButton: false,
                style: { borderRadius: '12px', padding: '16px' }
            }
        );
    }

    return (
        <div style={{ textAlign: "center", marginTop: 100 }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: "#B34E33", marginBottom: 16 }}>
            Menu Masih Dalam Pengembangan
        </div>
        <button
            style={{
            background: "#B34E33",
            color: "#fff",
            border: 0,
            padding: "12px 32px",
            borderRadius: 8,
            fontSize: 16,
            fontWeight: 700,
            cursor: "pointer",
            marginTop: 24,
            }}
            onClick={handleLogout}
        >
            Kembali ke Login
        </button>
        </div>
    );
}