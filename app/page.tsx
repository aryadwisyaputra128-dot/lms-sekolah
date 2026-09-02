"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Login gagal");
        return;
      }

      if (!data.user) {
        setError("Data pengguna tidak ditemukan");
        return;
      }

      switch (data.user.role) {
        case "ADMIN":
          router.push("/admin");
          break;
        case "GURU":
          router.push("/guru");
          break;
        case "MURID":
          router.push("/murid");
          break;
        case "WAKAKURI":
          router.push("/wakakur");
          break;
        case "KEPSEK":
          router.push("/kepsek");
          break;
        default:
          setError("Role pengguna tidak dikenali");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Tidak dapat terhubung ke server");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F4F6FB] flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-5xl bg-white rounded-[28px] shadow-xl overflow-hidden grid md:grid-cols-2">
        {/* ================= LEFT: BRAND PANEL ================= */}
        <section className="relative hidden md:flex flex-col justify-between overflow-hidden bg-[#0058be] p-10 lg:p-12">
          {/* decorative rings */}
          <div className="pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -right-10 top-32 h-52 w-52 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute left-1/2 bottom-0 h-64 w-64 -translate-x-1/2 translate-y-1/2 rounded-full bg-blue-500/20 blur-3xl" />

          {/* logo */}
          <div className="relative flex items-center gap-2 text-white">
            <Image src="/logo-sekola.png" alt="Logo Sekolah" width={28} height={28} priority />
            <span className="font-semibold tracking-tight">LMS Sekolah</span>
          </div>

          {/* headline */}
          <div className="relative space-y-4 my-10">
            <h1 className="text-3xl lg:text-[2.15rem] font-bold leading-tight text-white">
              Wujudkan Potensi Mu
              <br />
              Mulai Dari Satu Klik
            </h1>
            <p className="text-sm text-blue-100/80 leading-relaxed max-w-xs">
              Akses dashboard kamu dan nikmati semua fitur belajar yang asik
              dan menyenangkan.
            </p>
          </div>

          {/* social proof */}
          <div className="relative flex items-center gap-3">
            <div className="flex -space-x-2">
              {["bg-orange-300", "bg-emerald-300", "bg-pink-300", "bg-yellow-300"].map(
                (c, i) => (
                  <span
                    key={i}
                    className={`h-8 w-8 rounded-full ring-2 ring-[#0B1440] ${c}`}
                  />
                )
              )}
            </div>
            <span className="text-xs text-blue-100/80">
              Bergabung bersama 15.000+ siswa hari ini
            </span>
          </div>
        </section>

        {/* ================= RIGHT: FORM PANEL ================= */}
        <section className="flex items-center justify-center p-8 sm:p-12">
          <div className="w-full max-w-sm">
            <h2 className="text-2xl font-bold text-slate-900">Login</h2>
            <p className="mt-1 text-sm text-slate-500">
              Selamat datang di LMS Sekolah. Masuk untuk melanjutkan.
            </p>

            <form onSubmit={handleLogin} className="mt-8 space-y-5">
              {/* EMAIL */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Email sekolah
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 focus-within:border-[#0B1440] focus-within:bg-white transition-colors">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    className="text-slate-400 shrink-0"
                  >
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="m3 7 9 6 9-6" />
                  </svg>
                  <input
                    id="email"
                    type="email"
                    placeholder="nama@sekolah.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none"
                  />
                </div>
              </div>

              {/* PASSWORD */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="text-sm font-medium text-slate-700"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      alert("Silakan hubungi administrator sekolah.")
                    }
                    className="text-xs font-medium text-[#0B1440] hover:underline"
                  >
                    Lupa password?
                  </button>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 focus-within:border-[#0B1440] focus-within:bg-white transition-colors">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    className="text-slate-400 shrink-0"
                  >
                    <rect x="4" y="10" width="16" height="11" rx="2" />
                    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                  </svg>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Masukkan password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="shrink-0 text-slate-400 hover:text-slate-600"
                    aria-label={
                      showPassword ? "Sembunyikan password" : "Lihat password"
                    }
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                        <path d="M3 3l18 18" />
                        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                        <path d="M9.5 5.2A10.4 10.4 0 0 1 12 5c5 0 9 4.5 10 7-.4 1-1.1 2.1-2 3.1M6.2 6.6C4.3 8 3 9.6 2 12c1 2.5 5 7 10 7 1.4 0 2.7-.3 3.9-.8" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                        <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* KEEP SIGNED IN */}
              <label className="flex items-center gap-2 text-sm text-slate-600 select-none">
                <input
                  type="checkbox"
                  checked={keepSignedIn}
                  onChange={(e) => setKeepSignedIn(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-[#0B1440] focus:ring-[#0B1440]"
                />
                Tetap masuk
              </label>

              {/* ERROR */}
              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                  <span className="font-bold">!</span>
                  {error}
                </div>
              )}

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0B1440] py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {loading ? "Memproses..." : "Masuk ke Portal"}
                {!loading && <span aria-hidden>→</span>}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}