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

        const systemOwnerId = process.env.SYSTEM_OWNER_ID;

        if (!systemOwnerId) {
            throw new Error("SYSTEM_OWNER_ID belum diset di environment variables.");
        }

        const result = await ClosingActions.executeClosing(currentPeriod, systemOwnerId);

        return NextResponse.json({
            success: true,
            message: "Automated closing berhasil dieksekusi.",
            data: result,
        }, { status: 200 });

    } catch (error: any) {
        console.error("Error automated closing cron:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}