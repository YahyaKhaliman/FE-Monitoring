/* eslint-disable react-refresh/only-export-components */
/* eslint-disable react-hooks/set-state-in-effect */
import React, { createContext, useContext, useEffect, useState } from "react";
import { loadUser, saveUser, clearUser } from "../utils/storage";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const navigate = useNavigate();
    const [user, setUser] = useState(() => loadUser());
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        setUser(loadUser());
        setIsReady(true);
    }, []);

    function login(userObject) {
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
    return useContext(AuthContext);
}
