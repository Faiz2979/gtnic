export interface ClosingItemSnapshot {
  productId: string;
  productName: string;
  systemStock: number;
  physicalStock: number;
  discrepancy: number; // Positif = Lebih, Negatif = Kurang
  notes: string | null;  // Catatan staff (misal: "Barang rusak / tumpah")
}