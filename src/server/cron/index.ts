import cron from "node-cron";
import { autoClosing } from "./auto-closing.cron";

console.log("⏰ [CRON SYSTEM] Modul automated closing cron berhasil didaftarkan.");

cron.schedule("* * * * *", async () => {
    console.log("[TEST CRON] Menjalankan simulasi per menit...");
});

cron.schedule("* * * * *", async () => await autoClosing());

// Menjalankan tugas setiap tanggal 28-31 pada pukul 23:59
cron.schedule("59 23 28-31 * *", async () => await autoClosing());
