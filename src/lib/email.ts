import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

export interface ClosingEmailParams {
  to: string;
  period: string;
  totalRevenue: number;
  totalCapital: number;
  netProfit: number;
  closedByName: string;
  nextPeriod: string;
  itemsCount: number;
}

export async function sendClosingReportEmail(params: ClosingEmailParams) {
  if (!resend) {
    console.warn("⚠️ [EMAIL SERVICE] RESEND_API_KEY tidak ditemukan. Email dilewati.");
    return { success: false, message: "RESEND_API_KEY tidak dikonfigurasi." };
  }

  try {
    const formattedRevenue = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(params.totalRevenue);

    const formattedCapital = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(params.totalCapital);

    const formattedProfit = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(params.netProfit);

    const { data, error } = await resend.emails.send({
      from: "Smart Ledger <no-reply@woylah.akufaiz.my.id>",
      to: [params.to],
      subject: `[LAPORAN RESMI] Rekapitulasi Closing Periode ${params.period}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #ffffff; border: 1px solid #E2E8F0; border-radius: 16px;">
          <div style="margin-bottom: 20px;">
            <span style="background: #172554; color: #ffffff; font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 20px; text-transform: uppercase;">
              Penutupan Buku Resmi
            </span>
            <h2 style="color: #0F172A; margin: 12px 0 4px 0; font-size: 20px; font-weight: 700;">
              Laporan Rekapitulasi Closing Bulanan
            </h2>
            <p style="color: #64748B; font-size: 13px; margin: 0;">
              Periode Buku: <strong>${params.period}</strong> &bull; Carry-over ke: <strong>${params.nextPeriod}</strong>
            </p>
          </div>

          <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr>
                <td style="padding: 6px 0; color: #64748B;">Total Pemasukan (Omzet)</td>
                <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #0F172A;">${formattedRevenue}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748B;">Pengeluaran Modal (HPP)</td>
                <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #0F172A;">${formattedCapital}</td>
              </tr>
              <tr style="border-top: 1px solid #E2E8F0;">
                <td style="padding: 10px 0 6px 0; color: #16A34A; font-weight: 700; font-size: 14px;">Laba Bersih (Net Profit)</td>
                <td style="padding: 10px 0 6px 0; text-align: right; font-weight: 700; color: #16A34A; font-size: 16px;">${formattedProfit}</td>
              </tr>
            </table>
          </div>

          <div style="font-size: 12px; color: #64748B; line-height: 1.6; margin-bottom: 20px;">
            <p style="margin: 0 0 6px 0;">&bull; <strong>Status Periode:</strong> CLOSED (Terkunci &amp; Tidak dapat diubah lagi).</p>
            <p style="margin: 0 0 6px 0;">&bull; <strong>Carry-over Stok:</strong> ${params.itemsCount} produk telah dialihkan sebagai stok awal periode ${params.nextPeriod}.</p>
            <p style="margin: 0;">&bull; <strong>Otorisator:</strong> ${params.closedByName} (Owner).</p>
          </div>

          <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 20px 0;" />
          <p style="color: #94A3B8; font-size: 11px; margin: 0; text-align: center;">
            Notifikasi otomatis dikirim oleh Smart Ledger Financial Platform.
          </p>
        </div>
      `,
    });

    if (error) {
      console.warn("Gagal mengirim email closing via Resend:", error);
      return { success: false, error };
    }

    console.log("Email closing berhasil dikirim:", data);
    return { success: true, data };
  } catch (err: unknown) {
    console.error("Exception saat mengirim email closing:", err);
    return { success: false, error: err };
  }
}

