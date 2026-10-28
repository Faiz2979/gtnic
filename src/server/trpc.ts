import { createServerClient } from "@supabase/ssr";
import { initTRPC, TRPCError } from "@trpc/server";
import { cookies } from "next/headers"; // Gunakan cookies dari next/headers jika app router

// 1. Fungsi untuk membuat context dengan membaca cookie Supabase
export const createTRPCContext = async (opts: { req: Request; resHeaders: Headers }) => {
    // Buat Supabase server client untuk mengambil sesi user dari cookie request
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {
                        // Diabaikan jika terpanggil dari Server Component / tRPC query read-only
                    }
                },
            },
        }
    );

    // Ambil data user yang sedang aktif
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
        throw new Error(`Error fetching user: ${error.message}`);
    }

    return {
        user, // Mengembalikan user (bisa User atau null) ke dalam context tRPC
    };
};

type Context = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
    // Cek apakah user sudah login, jika tidak maka lempar TRPCError
    if (!ctx.user) {
        throw new TRPCError({ 
            code: "UNAUTHORIZED", 
            message: "Unauthorized - Silakan login terlebih dahulu." 
        });
    }
    
    return next({
        ctx: {
            ...ctx,
            user: ctx.user, // TypeScript sekarang tahu user di sini pasti ada dan tidak null
        },
    });
});