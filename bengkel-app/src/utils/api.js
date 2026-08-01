export async function fetchWithAuth(endpoint, options = {}) {
  if (typeof window === "undefined") {
    return fetch(endpoint, options);
  }

  const token = localStorage.getItem("auth_token");
  const headers = { ...(options.headers || {}) };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (
    options.body !== undefined &&
    typeof options.body === "string" &&
    !headers["Content-Type"] &&
    !headers["content-type"]
  ) {
    headers["Content-Type"] = "application/json";
  }

  const requestOptions = {
    ...options,
    headers,
  };

  const finalUrl = endpoint.startsWith("http")
    ? endpoint
    : `${process.env.NEXT_PUBLIC_API_URL || ""}${endpoint}`;

  const response = await fetch(finalUrl, requestOptions);

  if (response.status === 401 || response.status === 403) {
    localStorage.removeItem("user");
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_session");
    document.cookie = "user_role=; path=/; max-age=0";
    document.cookie =
      "user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    window.location.replace("/login");
    return null;
  }

  const contentType = response.headers.get("content-type") || "";
  const isJsonResponse = contentType.includes("application/json");

  if (response.status === 204) {
    return null;
  }

  if (!response.ok) {
    const errorData = isJsonResponse
      ? await response.json()
      : await response.text();
    const message =
      typeof errorData === "object" && errorData && errorData.message
        ? errorData.message
        : "Request gagal";
    throw new Error(message);
  }

  return isJsonResponse ? response.json() : response.text();
}
