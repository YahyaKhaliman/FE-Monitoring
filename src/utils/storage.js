/* eslint-disable no-unused-vars */
const KEY_USER = "monjob_user";
const KEY_CRED = "monjob_cred";

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

export function saveCred(username, password) {
    localStorage.setItem(KEY_CRED, JSON.stringify({ username, password }));
}

export function loadCred() {
    const raw = localStorage.getItem(KEY_CRED);
    if (!raw) return null;

    if (raw === "undefined" || raw === "null") {
        localStorage.removeItem(KEY_CRED);
        return null;
    }

    try {
        return JSON.parse(raw);
    } catch (e) {
        localStorage.removeItem(KEY_CRED);
        return null;
    }
}

export function clearCred() {
    localStorage.removeItem(KEY_CRED);
}
