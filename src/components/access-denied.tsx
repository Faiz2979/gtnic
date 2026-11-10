"use client";

import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface AccessDeniedCardProps {
  pageName: string;
  description?: string;
}

export function AccessDeniedCard({
  pageName,
  description,
}: AccessDeniedCardProps) {
  return (
    <div className="flex min-h-[520px] flex-col items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-8 text-center shadow-lg shadow-slate-900/5 animate-in fade-in zoom-in-95 duration-200">
        <CardContent className="p-0">
          {/* Icon Badge */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600 shadow-sm border border-red-100">
            <ShieldAlert className="h-8 w-8" strokeWidth={1.8} />
          </div>

          {/* Heading */}
          <h2 className="mt-5 text-xl font-bold tracking-tight text-[#0F172A]">
            Akses Dibatasi
          </h2>

          {/* Role Pill */}
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
            <span>Khusus Hak Akses Owner</span>
          </div>

          {/* Description */}
          <p className="mt-4 text-xs text-[#64748B] leading-relaxed">
            {description || (
              <>
                Halaman <strong>{pageName}</strong> memuat data rahasia/kebijakan finansial yang hanya dapat diakses oleh akun dengan peran <strong>Owner</strong>.
              </>
            )}
          </p>

          <p className="mt-1 text-[11px] text-slate-400">
            Jika Anda membutuhkan akses ke menu ini, silakan hubungi pemilik usaha Anda.
          </p>

          {/* Action Button: Back to Dashboard */}
          <div className="mt-7">
            <Link href="/dashboard" className="w-full">
              <Button className="h-11 w-full rounded-xl bg-[#2563EB] font-medium text-white shadow-sm hover:bg-[#1D4ED8] text-xs flex items-center justify-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Kembali ke Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

