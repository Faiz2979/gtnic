import dayjs from "dayjs";

export async function autoClosing() {
    const isLastDay = dayjs().isSame(dayjs().endOf("month"), "day");

    if (isLastDay) {
        console.log("Menjalankan automated monthly closing via node-cron...");

        try {
            const response = await fetch("http://localhost:3000/api/cron/auto-closing", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${process.env.CRON_SECRET_KEY}`,
                },
            });
            const data = await response.json();
            console.log("Hasil closing:", data);
        } catch (error) {
            console.error("Gagal menjalankan cron closing:", error);
        }
    }
} 