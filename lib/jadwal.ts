import Schedule from "@/models/Schedule";

export const DAYS = ["SEN", "SEL", "RAB", "KAM", "JUM"] as const;
export type Hari = (typeof DAYS)[number];

export const HARI_LABEL: Record<Hari, string> = {
    SEN: "Senin",
    SEL: "Selasa",
    RAB: "Rabu",
    KAM: "Kamis",
    JUM: "Jumat",
};

export interface JadwalLean {
    _id: { toString(): string };
    guruId: { toString(): string };
    judul: string;
    kelas?: string;
    hari: string;
    jamMulai: string;
    jamSelesai: string;
}

export function isValidTime(v: unknown): v is string {
    return typeof v === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
}

export function toMin(v: string): number {
    const [h, m] = v.split(":").map(Number);
    return h * 60 + m;
}

export function toHHmm(min: number): string {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function overlap(a1: number, a2: number, b1: number, b2: number): boolean {
    return a1 < b2 && b1 < a2;
}

/** Nama kelas dibandingkan tanpa peduli huruf besar/kecil dan spasi ganda. */
export function normKelas(v?: string): string {
    return (v || "").trim().replace(/\s+/g, " ").toLowerCase();
}

export interface JadwalInput {
    guruId: string;
    judul: string;
    kelas?: string;
    hari: Hari;
    jamMulai: string;
    jamSelesai: string;
}

export function validateJadwal(b: Record<string, unknown>): { error: string } | { data: JadwalInput } {
    const guruId = typeof b.guruId === "string" ? b.guruId : "";
    const judul = typeof b.judul === "string" ? b.judul.trim() : "";
    const kelas = typeof b.kelas === "string" ? b.kelas.trim() : "";
    const hari = b.hari as Hari;

    if (!guruId) return { error: "Guru wajib dipilih" };
    if (!judul) return { error: "Judul/mapel wajib diisi" };
    if (!DAYS.includes(hari)) return { error: "Hari tidak valid" };
    if (!isValidTime(b.jamMulai) || !isValidTime(b.jamSelesai)) return { error: "Format jam harus HH:mm" };
    if (toMin(b.jamSelesai) <= toMin(b.jamMulai)) return { error: "Jam selesai harus lebih besar dari jam mulai" };

    return {
        data: { guruId, judul, kelas: kelas || undefined, hari, jamMulai: b.jamMulai, jamSelesai: b.jamSelesai },
    };
}

/** Cek bentrok: guru yang sama atau kelas yang sama di hari dan jam yang beririsan. */
export async function findConflict(data: JadwalInput, excludeId?: string): Promise<string | null> {
    const query: Record<string, unknown> = { hari: data.hari };
    if (excludeId) query._id = { $ne: excludeId };

    const rows = (await Schedule.find(query).lean()) as unknown as JadwalLean[];
    const start = toMin(data.jamMulai);
    const end = toMin(data.jamSelesai);

    for (const s of rows) {
        if (!overlap(start, end, toMin(s.jamMulai), toMin(s.jamSelesai))) continue;
        if (s.guruId.toString() === data.guruId) {
            return `Guru sudah punya jadwal "${s.judul}" pada ${s.jamMulai}-${s.jamSelesai}`;
        }
        if (data.kelas && normKelas(s.kelas) === normKelas(data.kelas)) {
            return `Kelas ${data.kelas} sudah ada jadwal "${s.judul}" pada ${s.jamMulai}-${s.jamSelesai}`;
        }
    }
    return null;
}