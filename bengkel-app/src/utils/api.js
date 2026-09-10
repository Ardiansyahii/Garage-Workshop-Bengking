export async function fetchWithAuth(endpoint, options = {}) {
  if (typeof window === "undefined") {
    return fetch(endpoint, options);
  }

  const headers = { ...(options.headers || {}) };

  // Token sudah di httpOnly cookie — browser otomatis kirim
  // Tidak perlu baca dari localStorage lagi

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
    credentials: "include", // Kirim cookie silang port (localhost:3000 -> :4000)
  };

  const finalUrl = endpoint.startsWith("http")
    ? endpoint
    : `${process.env.NEXT_PUBLIC_API_URL || ""}${endpoint}`;

  const response = await fetch(finalUrl, requestOptions);

  if (response.status === 401 || response.status === 403) {
    // Token expired — bersihkan cookie via backend lalu redirect
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ""}/api/auth/logout`,
        { method: "POST", credentials: "same-origin" },
      );
    } catch {
      //-ignore — cookie mungkin sudah expired
    }
    document.cookie = "user_role=; path=/; max-age=0";
    localStorage.removeItem("user");
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
