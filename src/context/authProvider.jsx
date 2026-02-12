/* eslint-disable no-unused-vars */
/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from "react";
import { loadUser, saveUser, clearUser } from "../utils/storage";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const navigate = useNavigate();
    const [user, setUser] = useState(() => loadUser());
    const isReady = true;

    function login(userObject) {
        if (!userObject) return;
        saveUser(userObject);
        setUser(userObject);
    }

    function logout() {
        clearUser();
        setUser(null);
        navigate("/login", { replace: true });
    }

    return (
        <AuthContext.Provider value={{ user, login, logout, isReady }}>
            {children}
        </AuthContext.Provider>
    );
}

// Hook
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
