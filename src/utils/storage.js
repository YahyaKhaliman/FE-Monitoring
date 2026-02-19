/* eslint-disable no-unused-vars */
const KEY_USER = "monjob_user";
const KEY_CRED = "monjob_cred";
const KEY_TOKEN = "monjob_token";

export function saveUser(user) {
    if (!user) {
        localStorage.removeItem(KEY_USER);
        return;
    }
    localStorage.setItem(KEY_USER, JSON.stringify(user));
}

export function loadUser() {
    const raw = localStorage.getItem(KEY_USER);

    if (!raw) return null;

    if (raw === "undefined" || raw === "null") {
        localStorage.removeItem(KEY_USER);
        return null;
    }

    try {
        return JSON.parse(raw);
    } catch (e) {
        localStorage.removeItem(KEY_USER);
        return null;
    }
}

export function clearUser() {
    localStorage.removeItem(KEY_USER);
}

export function saveToken(token) {
    if (!token) {
        localStorage.removeItem(KEY_TOKEN);
        return;
    }
    localStorage.setItem(KEY_TOKEN, token);
}

export function loadToken() {
    const token = localStorage.getItem(KEY_TOKEN);
    if (!token || token === "undefined" || token === "null") {
        localStorage.removeItem(KEY_TOKEN);
        return null;
    }
    return token;
}

export function clearToken() {
    localStorage.removeItem(KEY_TOKEN);
}

export function saveCred(user_kode) {
    if (!user_kode) {
        localStorage.removeItem(KEY_CRED);
        return;
    }
    localStorage.setItem(KEY_CRED, JSON.stringify({ user_kode }));
}

export function loadCred() {
    const raw = localStorage.getItem(KEY_CRED);
    if (!raw) return null;

    if (raw === "undefined" || raw === "null") {
        localStorage.removeItem(KEY_CRED);
        return null;
    }

    try {
        const parsed = JSON.parse(raw);

        // cleanup legacy credential format that stored plaintext password
        if (parsed?.password || parsed?.username) {
            localStorage.removeItem(KEY_CRED);
            return null;
        }

        return parsed;
    } catch (e) {
        localStorage.removeItem(KEY_CRED);
        return null;
    }
}

export function clearCred() {
    localStorage.removeItem(KEY_CRED);
}
