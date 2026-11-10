import { NextResponse } from "next/server";

export function proxy(request) {
  // Ambil path URL saat ini (misal: /admin, /superadmin, /login)
  const path = request.nextUrl.pathname;

  // Cek apakah pengguna punya "tanda pengenal" (cookie) yang akan kita buat nanti
  const role = request.cookies.get("user_role")?.value;

  // 1. Jika BELUM LOGIN tapi nekat buka halaman dashboard -> Usir ke /login
  if (
    !role &&
    (path.startsWith("/admin") ||
      path.startsWith("/superadmin") ||
      path.startsWith("/dashboard") ||
      path.startsWith("/pelanggan"))
  ) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (path.startsWith("/pelanggan")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 2. Jika SUDAH LOGIN, tapi mencoba menyusup ke kamar orang lain -> Usir ke /login
  if (path.startsWith("/superadmin") && role !== "superadmin") {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (path.startsWith("/admin") && role !== "admin_bengkel") {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (path.startsWith("/dashboard") && role !== "pelanggan") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 3. Jika SUDAH LOGIN tapi malah buka halaman /login atau Beranda (/) -> Langsung arahkan ke kamarnya masing-masing
  if (role && (path === "/login" || path === "/")) {
    if (role === "superadmin")
      return NextResponse.redirect(new URL("/superadmin", request.url));
    if (role === "admin_bengkel")
      return NextResponse.redirect(new URL("/admin", request.url));
    if (role === "pelanggan")
      return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 4. Lanjutkan perjalanan jika semuanya aman dan sesuai aturan
  return NextResponse.next();
}

// Konfigurasi route mana saja yang wajib dijaga ketat oleh Proxy ini
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
