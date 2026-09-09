import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET;

export function proxy(request) {
  const path = request.nextUrl.pathname;

  // Ambil token dari cookie auth_token (httpOnly)
  const authToken = request.cookies.get("auth_token")?.value;

  // Decode JWT untuk dapat role (tanpa verify — middleware hanya cek existence)
  let role = null;
  if (authToken && SECRET_KEY) {
    try {
      const decoded = jwt.verify(authToken, SECRET_KEY);
      role = decoded.role;
    } catch {
      // Token invalid atau expired — anggap belum login
      role = null;
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
