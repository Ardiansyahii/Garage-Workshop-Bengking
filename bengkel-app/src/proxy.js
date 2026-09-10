import { NextResponse } from "next/server";

function decodeJwtPayload(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function proxy(request) {
  const path = request.nextUrl.pathname;

  const authToken = request.cookies.get("auth_token")?.value;

  let role = null;
  if (authToken) {
    const payload = decodeJwtPayload(authToken);
    if (payload && payload.exp && payload.exp * 1000 > Date.now()) {
      role = payload.role;
    }
  }

  // 1. BELUM LOGIN tapi buka halaman protected → redirect ke /login
  if (
    !role &&
    (path.startsWith("/admin") ||
      path.startsWith("/superadmin") ||
      path.startsWith("/dashboard") ||
      path.startsWith("/pelanggan"))
  ) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    // Bersihkan cookie sisa
    response.cookies.delete("auth_token");
    response.cookies.delete("user_role");
    return response;
  }

  if (path.startsWith("/pelanggan")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 2. SALAH ROLE → redirect ke /login
  if (path.startsWith("/superadmin") && role !== "superadmin") {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (path.startsWith("/admin") && role !== "admin_bengkel") {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (path.startsWith("/dashboard") && role !== "pelanggan") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 3. SUDAH LOGIN tapi buka /login atau / → arahkan ke dashboard sesuai role
  if (role && (path === "/login" || path === "/")) {
    if (role === "superadmin")
      return NextResponse.redirect(new URL("/superadmin", request.url));
    if (role === "admin_bengkel")
      return NextResponse.redirect(new URL("/admin", request.url));
    if (role === "pelanggan")
      return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/superadmin/:path*",
    "/admin/:path*",
    "/dashboard/:path*",
    "/pelanggan/:path*",
  ],
};
