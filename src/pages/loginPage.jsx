/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { login as apiLogin } from "../services/user.service";
import { loadCred, saveCred, clearCred } from "../utils/storage";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/authProvider";
import { AiOutlineEye, AiOutlineEyeInvisible, AiOutlineLock, AiOutlineUser } from "react-icons/ai";
import { toast } from 'react-toastify';

export default function LoginPage() {
  const [userKode, setUserKode] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [savePassword, setSavePassword] = useState(false);
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();

  function goAfterLogin(user) {
    const bagian = (user?.user_bagian || "").toUpperCase();
    if (bagian === "OWNER") {
      navigate("/laporan", { replace: true });
      return;
    }
    const from = location.state?.from?.pathname || "/menu";
    navigate(from, { replace: true });
  }

  useEffect(() => {
    if (auth.user) {
      goAfterLogin(auth.user);
      return;
    }
    const cred = loadCred();
    if (cred) {
      setUserKode(cred.username || "");
      setPassword(cred.password || "");
      setSavePassword(true);
    }
  }, [auth.user]);

  async function submit(e) {
    e.preventDefault();
    setMsg(null);

    if (!userKode || !password) {
      toast.warning("Kode User dan Password wajib diisi", {theme: "colored"});
      return;
    }

    setLoading(true);
    try {
      const res = await apiLogin(userKode, password);
      if (!res?.ok) {
        toast.error(res?.message, {theme: "colored"});
        return;
      }

      const payload = res?.data ?? res;
      const userObj = payload?.data ?? payload ?? {};

      const normalizedUser = {
        ...userObj,
        user_cab: userObj.user_cab ?? userObj.cab ?? userObj.user_cabang ?? userObj.cabang ?? userObj.cab_kode,
      };

      auth.login(normalizedUser);
      if (savePassword) saveCred(userKode, password);
      else clearCred();

      goAfterLogin(normalizedUser);
    } catch (err) {
      toast.error(err.response?.data?.message, {theme: "colored"});
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.loginCard}>
        <div style={styles.brandSection}>
          {/* <div style={styles.logoIcon}>☀️</div> */}
          <h2 style={styles.title}>{"Monitoring Job (Jahit)"}</h2>
          <p style={styles.subtitle}>Selamat datang kembali</p>
        </div>

        <form onSubmit={submit} style={styles.form}>
          {/* User Kode Input */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>User Kode</label>
            <div style={styles.inputWrapper}>
              <AiOutlineUser style={styles.icon} />
              <input
                style={styles.input}
                placeholder="Masukkan kode user"
                value={userKode}
                onChange={(e) => setUserKode(e.target.value)}
              />
            </div>
          </div>

          {/* Password Input */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <div style={styles.inputWrapper}>
              <AiOutlineLock style={styles.icon} />
              <input
                type={showPassword ? "text" : "password"}
                style={styles.input}
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
              >
                {showPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={savePassword}
              onChange={(e) => setSavePassword(e.target.checked)}
              style={styles.checkbox}
            />
            <span>Ingat saya di perangkat ini</span>
          </label>

          {/* Submit Button */}
          <button type="submit" disabled={loading} style={styles.submitBtn}>
            {loading ? "Loading..." : "Masuk Sekarang"}
          </button>

          {/* Error Message */}
          {msg && <div style={styles.errorMessage}>{msg}</div>}
        </form>

        <div style={styles.footer}>
          &copy; 2026 Monitoring Job.
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    background: "linear-gradient(135deg, #FFFBF7 0%, #F1E9E2 100%)",
    fontFamily: "'Readex Pro', sans-serif",
    padding: "20px"
  },
  loginCard: {
    background: "#ffffff",
    width: "100%",
    maxWidth: "400px",
    padding: "40px",
    borderRadius: "24px",
    boxShadow: "0 10px 40px rgba(179, 78, 51, 0.1)",
    border: "1px solid #F1E9E2",
    textAlign: "center"
  },
  brandSection: { marginBottom: "32px" },
  logoIcon: { fontSize: "40px", marginBottom: "10px" },
  title: { fontSize: "28px", fontWeight: 800, color: "#8E5A44", margin: 0 },
  subtitle: { fontSize: "14px", color: "#6B7280", marginTop: "8px", lineHeight: "1.5" },

  form: { display: "grid", gap: "20px", textAlign: "left" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "8px" },
  label: { fontSize: "12px", fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em" },

  inputWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center"
  },
  icon: {
    position: "absolute",
    left: "12px",
    color: "#B34E33",
    fontSize: "18px"
  },
  input: {
    width: "100%",
    height: "48px",
    padding: "0 40px",
    borderRadius: "12px",
    border: "2px solid #F1E9E2",
    fontSize: "14px",
    fontFamily: "'Inter', sans-serif",
    outline: "none",
    transition: "all 0.3s ease",
    boxSizing: "border-box",
    "&:focus": { borderColor: "#B34E33" }
  },
  eyeBtn: {
    position: "absolute",
    right: "12px",
    background: "none",
    border: "none",
    color: "#9CA3AF",
    cursor: "pointer",
    fontSize: "20px",
    display: "flex",
    alignItems: "center"
  },

  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "13px",
    color: "#4B5563",
    cursor: "pointer",
    userSelect: "none"
  },
  checkbox: { accentColor: "#B34E33", width: "16px", height: "16px" },

  submitBtn: {
    height: "50px",
    background: "#B34E33",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(179, 78, 51, 0.25)",
    transition: "transform 0.2s ease, opacity 0.2s",
    marginTop: "10px"
  },
  errorMessage: {
    background: "#FEE2E2",
    color: "#B91C1C",
    padding: "12px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: 600,
    textAlign: "center",
    marginTop: "10px"
  },
  footer: {
    marginTop: "32px",
    fontSize: "11px",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: "0.1em"
  }
};