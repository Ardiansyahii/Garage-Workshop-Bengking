import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "auth_token";
const USER_KEY = "user";

// ==========================================
// TOKEN (SecureStore — encrypted on device)
// ==========================================
export const getToken = async () => {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setToken = async (token) => {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch {
    // silently fail
  }
};

export const removeToken = async () => {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    // silently fail
  }
};

// ==========================================
// USER DATA (AsyncStorage-like via SecureStore)
// ==========================================
export const getUser = async () => {
  try {
    const raw = await SecureStore.getItemAsync(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setUser = async (userData) => {
  try {
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(userData));
  } catch {
    // silently fail
  }
};

export const removeUser = async () => {
  try {
    await SecureStore.deleteItemAsync(USER_KEY);
  } catch {
    // silently fail
  }
};

// ==========================================
// CLEAR ALL SESSION
// ==========================================
export const clearSession = async () => {
  await removeToken();
  await removeUser();
};
