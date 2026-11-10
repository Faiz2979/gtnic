"use client";

import { trpc } from "@/client/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { AccessDeniedCard } from "@/components/access-denied";
import { ROLE } from "@/utils/enums/user-role.enum";
import dayjs from "dayjs";
import "dayjs/locale/id";
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  Clock,
  Edit3,
  Loader2,
  Package,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  TrendingUp,
  Upload,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

dayjs.locale("id");

const formatRupiah = (val: number | string | undefined | null) => {
  const num = typeof val === "string" ? parseFloat(val) : Number(val) || 0;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(num);
};

export default function ProductManagementPage() {
  const utils = trpc.useUtils();

  const { data: profile, isLoading: isProfileLoading } =
    trpc.user.getCurrentProfile.useQuery();
  const isOwner = profile?.role === ROLE.OWNER;

  const {
    data: products = [],
    isLoading: isProductsLoading,
    error: fetchError,
  } = trpc.product.getAllProducts.useQuery(undefined, {
    enabled: isOwner,
  });

  const [searchQuery, setSearchQuery] = useState("");

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    defaultCost: "",
    defaultPrice: "",
    initialStock: 0,
    imageLink: "",
  });
  const [addImageFile, setAddImageFile] = useState<File | null>(null);
  const [addPreviewUrl, setAddPreviewUrl] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<{
    id: string;
    name: string;
    defaultCost: number | string;
    defaultPrice: number | string;
    initialStock: number;
    imageLink: string;
  } | null>(null);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editPreviewUrl, setEditPreviewUrl] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [isRestockOpen, setIsRestockOpen] = useState(false);
  const [restockProduct, setRestockProduct] = useState<{
    id: string;
    name: string;
    initialStock: number;
    addedStock?: number;
    currentStock?: number;
  } | null>(null);
  const [restockQty, setRestockQty] = useState<number>(10);
  const [isRestocking, setIsRestocking] = useState(false);
  const [restockError, setRestockError] = useState<string | null>(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const createMutation = trpc.product.createProduct.useMutation({
    onSuccess: () => {
      setIsAddOpen(false);
      resetAddForm();
      utils.product.getAllProducts.invalidate();
      utils.dashboard.getOwnerDashboard.invalidate();
    },
    onError: (err) => {
      setAddError(err.message);
    },
  });

  const updateMutation = trpc.product.updateProduct.useMutation({
    onSuccess: () => {
      setIsEditOpen(false);
      setEditProduct(null);
      setEditImageFile(null);
      setEditPreviewUrl(null);
      utils.product.getAllProducts.invalidate();
      utils.dashboard.getOwnerDashboard.invalidate();
    },
    onError: (err) => {
      setEditError(err.message);
    },
  });

  const restockMutation = trpc.inventory.addStock.useMutation({
    onSuccess: () => {
      setIsRestockOpen(false);
      setRestockProduct(null);
      setRestockQty(10);
      utils.product.getAllProducts.invalidate();
      utils.dashboard.getOwnerDashboard.invalidate();
    },
    onError: (err) => {
      setRestockError(err.message);
    },
  });

  const deleteMutation = trpc.product.deleteProduct.useMutation({
    onSuccess: () => {
      setIsDeleteOpen(false);
      setProductToDelete(null);
      utils.product.getAllProducts.invalidate();
      utils.dashboard.getOwnerDashboard.invalidate();
    },
    onError: (err) => {
      setDeleteError(err.message);
    },
  });

  const resetAddForm = () => {
    setAddForm({
      name: "",
      defaultCost: "",
      defaultPrice: "",
      initialStock: 0,
      imageLink: "",
    });
    setAddImageFile(null);
    setAddPreviewUrl(null);
    setAddError(null);
  };

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    return products.filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  const totalProductsCount = products.length;
  const totalCurrentStock = products.reduce(
    (acc, curr) => acc + (Number(curr.currentStock) || 0),
    0
  );
  const lowStockProductsCount = products.filter(
    (p) => (Number(p.currentStock) || 0) < 10
  ).length;

  const todayFormatted = dayjs().format("dddd, D MMMM YYYY");

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    setIsAdding(true);

    try {
      let finalImageLink = addForm.imageLink;
      if (addImageFile) {
        finalImageLink = await uploadToCloudinary(addImageFile);
      }

      await createMutation.mutateAsync({
        name: addForm.name.trim(),
        defaultCost: parseFloat(addForm.defaultCost),
        defaultPrice: parseFloat(addForm.defaultPrice),
        initialStock: Number(addForm.initialStock),
        imageLink: finalImageLink,
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setAddError(err.message);
      } else {
        setAddError("Terjadi kesalahan saat menambahkan produk.");
      }
    } finally {
      setIsAdding(false);
    }
  };

  const handleOpenEdit = (prod: (typeof products)[0]) => {
    setEditProduct({
      id: prod.id,
      name: prod.name,
      defaultCost: Number(prod.defaultCost),
      defaultPrice: Number(prod.defaultPrice),
      initialStock: Number(prod.initialStock),
      imageLink: prod.imageLink || "",
    });
    setEditPreviewUrl(prod.imageLink || null);
    setEditImageFile(null);
    setEditError(null);
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProduct) return;
    setEditError(null);
    setIsUpdating(true);

    try {
      let finalImageLink = editProduct.imageLink;
      if (editImageFile) {
        finalImageLink = await uploadToCloudinary(editImageFile);
      }

      await updateMutation.mutateAsync({
        id: editProduct.id,
        name: editProduct.name.trim(),
        defaultCost: Number(editProduct.defaultCost),
        defaultPrice: Number(editProduct.defaultPrice),
        initialStock: Number(editProduct.initialStock),
        imageLink: finalImageLink,
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setEditError(err.message);
      } else {
        setEditError("Terjadi kesalahan saat memperbarui produk.");
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleOpenRestock = (prod: (typeof products)[0]) => {
    setRestockProduct({
      id: prod.id,
      name: prod.name,
      initialStock: Number(prod.initialStock) || 0,
      addedStock: Number(prod.addedStock) || 0,
      currentStock: Number(prod.currentStock) || 0,
    });
    setRestockQty(10);
    setRestockError(null);
    setIsRestockOpen(true);
  };

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockProduct) return;
    setRestockError(null);

    if (restockQty <= 0) {
      setRestockError("Jumlah penambahan stok harus lebih dari 0 unit.");
      return;
    }

    setIsRestocking(true);
    try {
      const currentPeriod = dayjs().format("YYYY-MM");
      await restockMutation.mutateAsync({
        productId: restockProduct.id,
        period: currentPeriod,
        quantity: Number(restockQty),
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setRestockError(err.message);
      } else {
        setRestockError("Gagal menambahkan stok barang.");
      }
    } finally {
      setIsRestocking(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    setDeleteError(null);
    setIsDeleting(true);
    try {
      await deleteMutation.mutateAsync({ id: productToDelete.id });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setDeleteError(err.message);
      } else {
        setDeleteError("Gagal menghapus produk.");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  if (isProfileLoading) {
    return (
      <div className="flex min-h-[500px] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-[#2563EB]" />
        <p className="text-sm font-medium text-[#64748B]">
          Memverifikasi hak akses...
        </p>
      </div>
    );
  }

  if (!isOwner) {
    return <AccessDeniedCard pageName="Manajemen Master Produk & Stok" />;
  }

  return (
    <div className="space-y-6 font-sans">
      {/* ──────────────── TOP HEADER (IDENTIK DENGAN DASHBOARD) ──────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">
              Manajemen Produk &amp; Stok
            </h1>
            {/* Badge Owner Identik dengan Dashboard (dengan Icon ShieldCheck) */}
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-[#172554]/10 text-[#172554] border border-[#172554]/20">
              <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} />
              Owner
            </span>
          </div>
          <p className="mt-1 text-sm text-[#64748B]" suppressHydrationWarning>
            {todayFormatted} · Kelola katalog produk, harga modal, harga jual, dan stok barang.
          </p>
        </div>

        {/* Action: Tambah Produk Button */}
        <Button
          onClick={() => {
            resetAddForm();
            setIsAddOpen(true);
          }}
          className="h-10 gap-2 rounded-xl bg-[#2563EB] px-4 font-medium text-white shadow-sm transition-all hover:bg-[#1D4ED8] active:scale-[0.98]"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          Tambah Produk
        </Button>
      </div>

      {/* ──────────────── 3 METRIC SUMMARY CARDS (PERSIS DENGAN KARTU DASHBOARD) ──────────────── */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {/* Card 1: Total Katalog Produk */}
        <Card className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-normal text-[#64748B]">
                Total katalog produk
              </span>
              <Package className="h-4.5 w-4.5 text-[#2563EB]" strokeWidth={1.8} />
            </div>
            <div className="mt-3">
              <h2 className="text-2xl font-bold tracking-tight text-[#0F172A]">
                {totalProductsCount} Produk
              </h2>
              <p className="mt-1 text-xs text-[#94A3B8]">
                Terdaftar aktif di sistem
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Total Stok Fisik Tersedia */}
        <Card className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-normal text-[#64748B]">
                Total stok fisik tersedia
              </span>
              <Boxes className="h-4.5 w-4.5 text-[#2563EB]" strokeWidth={1.8} />
            </div>
            <div className="mt-3">
              <h2 className="text-2xl font-bold tracking-tight text-[#0F172A]">
                {totalCurrentStock} Unit
              </h2>
              <p className="mt-1 text-xs text-[#94A3B8]">
                Stok siap untuk transaksi penjualan
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Perlu Restock Segera */}
        <Card className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-normal text-[#64748B]">
                Perlu restock segera
              </span>
              <AlertTriangle
                className={`h-4.5 w-4.5 ${
                  lowStockProductsCount > 0 ? "text-[#D97706]" : "text-[#2563EB]"
                }`}
                strokeWidth={1.8}
              />
            </div>
            <div className="mt-3">
              <h2 className="text-2xl font-bold tracking-tight text-[#0F172A]">
                {lowStockProductsCount} Produk
              </h2>
              <p className="mt-1 text-xs text-[#94A3B8]">
                {lowStockProductsCount > 0
                  ? "Stok di bawah 10 unit, segera restock"
                  : "Semua stok produk dalam kondisi aman"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ──────────────── MAIN PRODUCT TABLE CARD ──────────────── */}
      <Card className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <CardContent className="p-0">
          {/* Header Baris Dalam Kartu */}
          <div className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#F1F5F9]">
            <div>
              <h3 className="text-sm font-semibold text-[#0F172A]">
                Katalog produk &amp; stok
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Daftar harga modal, harga jual, dan pencatatan restock berjalan.
              </p>
            </div>

            {/* Input Pencarian Minimalis */}
            <div className="relative w-full sm:w-64">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                size={15}
                strokeWidth={1.8}
              />
              <Input
                type="text"
                placeholder="Cari nama produk..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full rounded-xl border-[#E2E8F0] bg-white pl-9 text-xs text-[#0F172A] placeholder:text-[#94A3B8] focus-visible:ring-2 focus-visible:ring-[#2563EB]"
              />
            </div>
          </div>

          {/* Konten Tabel */}
          {isProductsLoading ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-[#2563EB]" />
              <p className="text-xs text-[#64748B]">Memuat data produk...</p>
            </div>
          ) : fetchError ? (
            <div className="py-10 text-center text-xs text-[#DC2626]">
              Gagal memuat data produk: {fetchError.message}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-14 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F8FAFC] text-[#94A3B8]">
                <Package className="h-6 w-6" strokeWidth={1.8} />
              </div>
              <p className="mt-3 text-sm font-semibold text-[#0F172A]">
                {searchQuery ? "Produk tidak ditemukan" : "Belum ada produk yang tercatat"}
              </p>
              <p className="mt-1 text-xs text-[#94A3B8]">
                {searchQuery
                  ? `Tidak ada produk dengan kata kunci "${searchQuery}".`
                  : "Tambahkan produk pertama Anda untuk mulai mengelola stok."}
              </p>
              {!searchQuery && (
                <Button
                  onClick={() => setIsAddOpen(true)}
                  className="mt-4 h-9 gap-1.5 rounded-xl bg-[#2563EB] text-xs font-medium text-white hover:bg-[#1D4ED8]"
                >
                  <Plus className="h-3.5 w-3.5" /> Tambah Produk Sekarang
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#F1F5F9] text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                    <th className="py-3 px-3">Produk</th>
                    <th className="py-3 px-3">Harga Modal</th>
                    <th className="py-3 px-3">Harga Jual</th>
                    <th className="py-3 px-3">Margin Laba</th>
                    <th className="py-3 px-3 text-center">Stok Periode Ini</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9] text-xs">
                  {filteredProducts.map((prod) => {
                    const cost = Number(prod.defaultCost) || 0;
                    const price = Number(prod.defaultPrice) || 0;
                    const profitPerUnit = price - cost;
                    const marginPercent =
                      price > 0 ? ((profitPerUnit / price) * 100).toFixed(1) : "0";
                    const curStock = Number(prod.currentStock) || 0;
                    const initStock = Number(prod.initialStock) || 0;
                    const addStock = Number(prod.addedStock) || 0;

                    return (
                      <tr
                        key={prod.id}
                        className="transition-colors hover:bg-[#F8FAFC]"
                      >
                        {/* Thumbnail & Nama */}
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-3">
                            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
                              {prod.imageLink ? (
                                <Image
                                  src={prod.imageLink}
                                  alt={prod.name}
                                  fill
                                  sizes="40px"
                                  className="object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-[#94A3B8]">
                                  <Package size={18} strokeWidth={1.8} />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-[#0F172A]">
                                {prod.name}
                              </p>
                              <p className="text-[11px] text-[#94A3B8]">
                                ID: {prod.id.slice(0, 8).toUpperCase()}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Harga Modal */}
                        <td className="py-3.5 px-3 text-xs text-[#64748B]">
                          {formatRupiah(cost)}
                        </td>

                        {/* Harga Jual */}
                        <td className="py-3.5 px-3 text-sm font-semibold text-[#0F172A]">
                          {formatRupiah(price)}
                        </td>

                        {/* Margin Laba */}
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-1.5 font-medium text-[#16A34A]">
                            <TrendingUp size={13} strokeWidth={2} />
                            <span>+{formatRupiah(profitPerUnit)}</span>
                            <span className="text-[10px] text-[#64748B]">
                              ({marginPercent}%)
                            </span>
                          </div>
                        </td>

                        {/* Rincian Stok */}
                        <td className="py-3.5 px-3 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span className="text-sm font-bold tracking-tight text-[#0F172A]">
                              {curStock} unit
                            </span>
                            <span className="text-[11px] text-[#94A3B8]">
                              Awal: {initStock} · Restock: +{addStock}
                            </span>
                          </div>
                        </td>

                        {/* Status Stok (Persis Finara Pill Badge) */}
                        <td className="py-3.5 px-3 text-center">
                          {curStock <= 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#FEF2F2] px-2.5 py-0.5 text-xs font-medium text-[#DC2626]">
                              <AlertTriangle className="h-3.5 w-3.5 text-[#DC2626]" strokeWidth={2} />
                              Habis
                            </span>
                          ) : curStock < 10 ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#FFFBEB] px-2.5 py-0.5 text-xs font-medium text-[#D97706]">
                              <Clock className="h-3.5 w-3.5 text-[#D97706]" strokeWidth={2} />
                              Menipis ({curStock})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#F0FDF4] px-2.5 py-0.5 text-xs font-medium text-[#16A34A]">
                              <CheckCircle2 className="h-3.5 w-3.5 text-[#16A34A]" strokeWidth={2} />
                              Tersedia
                            </span>
                          )}
                        </td>

                        {/* Aksi: Restock, Edit, Delete */}
                        <td className="py-3.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Tombol Restock */}
                            <Button
                              size="sm"
                              onClick={() => handleOpenRestock(prod)}
                              className="h-8 gap-1.5 rounded-xl bg-[#2563EB] px-3 text-xs font-medium text-white shadow-sm hover:bg-[#1D4ED8] transition-all active:scale-[0.98]"
                              title="Tambah stok (Restock)"
                            >
                              <RefreshCw size={12} strokeWidth={2} />
                              Restock
                            </Button>

                            {/* Tombol Edit */}
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => handleOpenEdit(prod)}
                              className="h-8 w-8 rounded-xl border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors"
                              title="Edit Produk"
                            >
                              <Edit3 size={13} strokeWidth={1.8} />
                            </Button>

                            {/* Tombol Hapus */}
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => {
                                setProductToDelete({ id: prod.id, name: prod.name });
                                setDeleteError(null);
                                setIsDeleteOpen(true);
                              }}
                              className="h-8 w-8 rounded-xl border-[#E2E8F0] text-[#DC2626] hover:bg-[#FEF2F2] hover:border-[#FECACA] transition-colors"
                              title="Hapus Produk"
                            >
                              <Trash2 size={13} strokeWidth={1.8} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ──────────────── DIALOG 1: TAMBAH PRODUK BARU ──────────────── */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[460px] rounded-2xl bg-white border border-[#E2E8F0] p-6 shadow-xl">
          <form onSubmit={handleAddSubmit}>
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-[#0F172A]">
                Tambah Produk Baru
              </DialogTitle>
              <DialogDescription className="text-sm text-[#64748B]">
                Masukkan master data produk, harga modal, harga jual, dan stok awal.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {addError && (
                <div className="rounded-xl bg-[#FEF2F2] p-3 text-xs text-[#DC2626] border border-[#FECACA]">
                  {addError}
                </div>
              )}

              {/* Nama Produk */}
              <div className="space-y-1.5">
                <Label htmlFor="add-name" className="text-xs font-semibold text-[#0F172A]">
                  Nama Produk <span className="text-[#DC2626]">*</span>
                </Label>
                <Input
                  id="add-name"
                  placeholder="Contoh: Kopi Susu Gula Aren"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  required
                  className="h-10 rounded-xl border-[#E2E8F0] bg-white text-[#0F172A] focus-visible:ring-2 focus-visible:ring-[#2563EB]"
                />
              </div>

              {/* Harga Modal & Harga Jual */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="add-cost" className="text-xs font-semibold text-[#0F172A]">
                    Harga Modal (Cost) <span className="text-[#DC2626]">*</span>
                  </Label>
                  <Input
                    id="add-cost"
                    type="number"
                    min="1"
                    placeholder="12000"
                    value={addForm.defaultCost}
                    onChange={(e) =>
                      setAddForm({ ...addForm, defaultCost: e.target.value })
                    }
                    required
                    className="h-10 rounded-xl border-[#E2E8F0] bg-white text-[#0F172A] focus-visible:ring-2 focus-visible:ring-[#2563EB]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="add-price" className="text-xs font-semibold text-[#0F172A]">
                    Harga Jual (Price) <span className="text-[#DC2626]">*</span>
                  </Label>
                  <Input
                    id="add-price"
                    type="number"
                    min="1"
                    placeholder="20000"
                    value={addForm.defaultPrice}
                    onChange={(e) =>
                      setAddForm({ ...addForm, defaultPrice: e.target.value })
                    }
                    required
                    className="h-10 rounded-xl border-[#E2E8F0] bg-white text-[#0F172A] focus-visible:ring-2 focus-visible:ring-[#2563EB]"
                  />
                </div>
              </div>

              {/* Stok Awal Periode */}
              <div className="space-y-1.5">
                <Label htmlFor="add-stock" className="text-xs font-semibold text-[#0F172A]">
                  Stok Awal Periode <span className="text-[#DC2626]">*</span>
                </Label>
                <Input
                  id="add-stock"
                  type="number"
                  min="0"
                  placeholder="50"
                  value={addForm.initialStock}
                  onChange={(e) =>
                    setAddForm({
                      ...addForm,
                      initialStock: Number(e.target.value),
                    })
                  }
                  required
                  className="h-10 rounded-xl border-[#E2E8F0] bg-white text-[#0F172A] focus-visible:ring-2 focus-visible:ring-[#2563EB]"
                />
                <p className="text-[11px] text-[#94A3B8]">
                  Stok awal yang tersedia di awal pembukaan bulan berjalan.
                </p>
              </div>

              {/* Upload Gambar Produk */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#0F172A]">
                  Foto Produk (Opsional)
                </Label>
                {addPreviewUrl ? (
                  <div className="relative flex items-center justify-between rounded-xl border border-[#E2E8F0] p-2 bg-[#F8FAFC]">
                    <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-[#E2E8F0] bg-white">
                      <Image
                        src={addPreviewUrl}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <span className="text-xs text-[#64748B] truncate max-w-[200px]">
                      {addImageFile?.name || "Foto produk dipilih"}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-[#DC2626] hover:bg-[#FEF2F2]"
                      onClick={() => {
                        setAddImageFile(null);
                        setAddPreviewUrl(null);
                        setAddForm({ ...addForm, imageLink: "" });
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#CBD5E1] p-4 text-center cursor-pointer hover:bg-[#F8FAFC] transition-colors">
                    <Upload className="h-5 w-5 text-[#94A3B8] mb-1.5" />
                    <span className="text-xs font-medium text-[#0F172A]">
                      Pilih foto produk
                    </span>
                    <span className="text-[10px] text-[#94A3B8]">
                      PNG, JPG atau WEBP (Maks. 5MB)
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          setAddImageFile(file);
                          setAddPreviewUrl(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </label>
                )}
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddOpen(false)}
                className="rounded-xl border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isAdding || createMutation.isPending}
                className="rounded-xl bg-[#2563EB] text-white shadow-sm hover:bg-[#1D4ED8]"
              >
                {isAdding || createMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Simpan Produk
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ──────────────── DIALOG 2: EDIT PRODUK ──────────────── */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[460px] rounded-2xl bg-white border border-[#E2E8F0] p-6 shadow-xl">
          {editProduct && (
            <form onSubmit={handleEditSubmit}>
              <DialogHeader>
                <DialogTitle className="text-lg font-bold text-[#0F172A]">
                  Edit Data Produk
                </DialogTitle>
                <DialogDescription className="text-sm text-[#64748B]">
                  Perbarui nama, harga modal, harga jual, atau foto produk.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                {editError && (
                  <div className="rounded-xl bg-[#FEF2F2] p-3 text-xs text-[#DC2626] border border-[#FECACA]">
                    {editError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="edit-name" className="text-xs font-semibold text-[#0F172A]">
                    Nama Produk
                  </Label>
                  <Input
                    id="edit-name"
                    value={editProduct.name}
                    onChange={(e) =>
                      setEditProduct({ ...editProduct, name: e.target.value })
                    }
                    required
                    className="h-10 rounded-xl border-[#E2E8F0] bg-white text-[#0F172A] focus-visible:ring-2 focus-visible:ring-[#2563EB]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-cost" className="text-xs font-semibold text-[#0F172A]">
                      Harga Modal (Cost)
                    </Label>
                    <Input
                      id="edit-cost"
                      type="number"
                      min="1"
                      value={editProduct.defaultCost}
                      onChange={(e) =>
                        setEditProduct({
                          ...editProduct,
                          defaultCost: Number(e.target.value),
                        })
                      }
                      required
                      className="h-10 rounded-xl border-[#E2E8F0] bg-white text-[#0F172A] focus-visible:ring-2 focus-visible:ring-[#2563EB]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-price" className="text-xs font-semibold text-[#0F172A]">
                      Harga Jual (Price)
                    </Label>
                    <Input
                      id="edit-price"
                      type="number"
                      min="1"
                      value={editProduct.defaultPrice}
                      onChange={(e) =>
                        setEditProduct({
                          ...editProduct,
                          defaultPrice: Number(e.target.value),
                        })
                      }
                      required
                      className="h-10 rounded-xl border-[#E2E8F0] bg-white text-[#0F172A] focus-visible:ring-2 focus-visible:ring-[#2563EB]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-stock" className="text-xs font-semibold text-[#0F172A]">
                    Stok Awal Periode
                  </Label>
                  <Input
                    id="edit-stock"
                    type="number"
                    min="0"
                    value={editProduct.initialStock}
                    onChange={(e) =>
                      setEditProduct({
                        ...editProduct,
                        initialStock: Number(e.target.value),
                      })
                    }
                    required
                    className="h-10 rounded-xl border-[#E2E8F0] bg-white text-[#0F172A] focus-visible:ring-2 focus-visible:ring-[#2563EB]"
                  />
                </div>

                {/* Ganti Foto */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-[#0F172A]">
                    Foto Produk
                  </Label>
                  {editPreviewUrl ? (
                    <div className="relative flex items-center justify-between rounded-xl border border-[#E2E8F0] p-2 bg-[#F8FAFC]">
                      <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-[#E2E8F0] bg-white">
                        <Image
                          src={editPreviewUrl}
                          alt="Preview"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <span className="text-xs text-[#64748B] truncate max-w-[200px]">
                        {editImageFile?.name || "Foto saat ini"}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-[#DC2626] hover:bg-[#FEF2F2]"
                        onClick={() => {
                          setEditImageFile(null);
                          setEditPreviewUrl(null);
                          setEditProduct({ ...editProduct, imageLink: "" });
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#CBD5E1] p-4 text-center cursor-pointer hover:bg-[#F8FAFC]">
                      <Upload className="h-5 w-5 text-[#94A3B8] mb-1" />
                      <span className="text-xs font-medium text-[#0F172A]">
                        Ganti Foto Produk
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            setEditImageFile(file);
                            setEditPreviewUrl(URL.createObjectURL(file));
                          }
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditOpen(false)}
                  className="rounded-xl border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isUpdating || updateMutation.isPending}
                  className="rounded-xl bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
                >
                  {isUpdating || updateMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Simpan Perubahan
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ──────────────── DIALOG 3: MODAL RESTOCK (ADDED_STOCK) ──────────────── */}
      <Dialog open={isRestockOpen} onOpenChange={setIsRestockOpen}>
        <DialogContent className="sm:max-w-[460px] rounded-2xl bg-white border border-[#E2E8F0] p-6 shadow-xl">
          {restockProduct && (
            <form onSubmit={handleRestockSubmit}>
              <DialogHeader>
                <DialogTitle className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 text-[#2563EB]" />
                  Catat Restock Barang
                </DialogTitle>
                <DialogDescription className="text-sm text-[#64748B]">
                  Tambahkan unit stok baru ke dalam inventaris berjalan periode ini.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                {restockError && (
                  <div className="rounded-xl bg-[#FEF2F2] p-3 text-xs text-[#DC2626] border border-[#FECACA]">
                    {restockError}
                  </div>
                )}

                {/* Info Produk */}
                <div className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-3.5 space-y-1">
                  <p className="text-xs text-[#64748B]">Produk yang di-restock:</p>
                  <p className="text-sm font-bold text-[#0F172A]">
                    {restockProduct.name}
                  </p>
                  <div className="flex items-center gap-3 pt-1 text-xs text-[#64748B]">
                    <span>
                      Stok Awal:{" "}
                      <strong className="text-[#0F172A]">
                        {restockProduct.initialStock} unit
                      </strong>
                    </span>
                    <span>·</span>
                    <span>
                      Restock Sebelumnya:{" "}
                      <strong className="text-[#2563EB]">
                        +{restockProduct.addedStock || 0} unit
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Input Jumlah Unit yang Ditambahkan */}
                <div className="space-y-1.5">
                  <Label htmlFor="restock-qty" className="text-xs font-semibold text-[#0F172A]">
                    Jumlah Penambahan Unit (added_stock) <span className="text-[#DC2626]">*</span>
                  </Label>
                  <Input
                    id="restock-qty"
                    type="number"
                    min="1"
                    placeholder="Contoh: 25"
                    value={restockQty}
                    onChange={(e) => setRestockQty(Number(e.target.value))}
                    required
                    className="h-10 rounded-xl border-[#E2E8F0] bg-white text-[#0F172A] text-base font-semibold focus-visible:ring-2 focus-visible:ring-[#2563EB]"
                  />
                  <p className="text-[11px] text-[#94A3B8]">
                    Penambahan ini otomatis menambah nilai <code>added_stock</code> dan{" "}
                    <code>current_stock</code> <strong>tanpa mengubah nilai stok awal</strong>.
                  </p>
                </div>

                {/* Preview Estimasi Total Sisa Stok */}
                <div className="rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] p-3.5 text-xs text-[#16A34A] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Estimasi Total Sisa Stok:</span>
                    <span className="text-base font-bold text-[#16A34A]">
                      {(restockProduct.currentStock || 0) + (Number(restockQty) || 0)} Unit
                    </span>
                  </div>
                  <p className="text-[11px] text-[#16A34A]/80">
                    Stok saat ini ({restockProduct.currentStock || 0}) + Tambahan baru (+{restockQty || 0})
                  </p>
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsRestockOpen(false)}
                  className="rounded-xl border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isRestocking || restockMutation.isPending}
                  className="rounded-xl bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
                >
                  {isRestocking || restockMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Konfirmasi Restock
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ──────────────── DIALOG 4: KONFIRMASI HAPUS PRODUK ──────────────── */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-2xl bg-white border border-[#E2E8F0] p-6 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-[#DC2626]" />
              Hapus Produk
            </DialogTitle>
            <DialogDescription className="text-sm text-[#64748B]">
              Apakah Anda yakin ingin menghapus produk{" "}
              <strong className="text-[#0F172A]">{productToDelete?.name}</strong>?
              Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>

          {deleteError && (
            <div className="rounded-xl bg-[#FEF2F2] p-3 text-xs text-[#DC2626] border border-[#FECACA] my-2">
              {deleteError}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
              className="rounded-xl border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleDeleteConfirm}
              disabled={isDeleting || deleteMutation.isPending}
              className="rounded-xl bg-[#DC2626] text-white hover:bg-[#B91C1C]"
            >
              {isDeleting || deleteMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Hapus Permanen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
