// src/app/api/cron/auto-closing/route.ts
import { ClosingActions } from "@/server/routers/closing/closing.actions";
import dayjs from "dayjs";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get("authorization");
        const cronSecret = process.env.CRON_SECRET_KEY;

        if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: "Unauthorized: Invalid API Key" }, { status: 401 });
        }

        const currentPeriod = dayjs().format("YYYY-MM");

        // MEMANGGIL GENERATE DRAFT (Menyimpan rekapitulasi awal & JSON snapshot ke database)
        const result = await ClosingActions.generateDraft(currentPeriod);

        return NextResponse.json({
            success: true,
            message: `Draft rekapitulasi periode ${currentPeriod} berhasil digenerate otomatis dan disimpan ke database. Menunggu validasi Staff & review Owner.`,
            data: result,
        }, { status: 200 });

    } catch (error: unknown) {
        console.error("Error automated closing cron:", error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "Internal Server Error" },
            { status: 500 }
        );
    }
}