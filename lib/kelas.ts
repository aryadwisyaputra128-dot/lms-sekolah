// Pencocokan nama kelas yang tidak peduli huruf besar-kecil dan spasi di pinggir.
// Contoh: "12 pplg 1", " 12 PPLG 1 ", dan "12 PPLG 1" dianggap sama.
export function kelasRegex(kelas: string) {
    const escaped = String(kelas || "")
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`^\\s*${escaped}\\s*$`, "i");
}