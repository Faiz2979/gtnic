"use client"

import { trpc } from "@/client/trpc"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Column, FlexibleTable } from "@/components/ui/flexible-table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { uploadToCloudinary } from "@/lib/cloudinary"; // <-- Import utility di sini
import { Loader2, Plus, Upload, X } from "lucide-react"
import Image from "next/image"
import { useEffect, useState } from "react"

type Product = {
  id: string
  imageLink: string
  name: string
  initialStock: number
  defaultCost: string | number
  defaultPrice: string | number
  updatedAt: Date | string
}

const formatRupiah = (val: number | string) => {
  const numericVal = typeof val === "string" ? parseFloat(val) : val
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(numericVal)
}

export default function ProductPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [uploading, setUploading] = useState(false)

  // State form
  const [formData, setFormData] = useState({
    name: "",
    defaultCost: "",
    defaultPrice: "",
    initialStock: 0,
    imageLink: "",
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [initialStock, setInitialStock] = useState<number>(0)

  const utils = trpc.useUtils()
  const { data, isLoading, error: fetchError } = trpc.product.getAllProducts.useQuery()
  const createProduct = trpc.product.createProduct.useMutation()

  useEffect(() => {
    setLoading(isLoading)
    if (fetchError) setError(fetchError.message)
    else setError(null)
    if (data) setProducts(data)
  }, [data, isLoading, fetchError])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploading(true)

    try {
      let finalImageLink = formData.imageLink

      // Jika user melampirkan file baru, panggil utility uploadToCloudinary
      if (imageFile) {
        finalImageLink = await uploadToCloudinary(imageFile)
      }

      await createProduct.mutateAsync({
        name: formData.name,
        defaultCost: parseFloat(formData.defaultCost),
        defaultPrice: parseFloat(formData.defaultPrice),
        initialStock: formData.initialStock,
        imageLink: finalImageLink,
      })

      alert(`Berhasil menyimpan produk: ${formData.name}\nURL Gambar: ${finalImageLink}`)
      
      // Reset form & tutup modal
      setIsModalOpen(false)
      setFormData({ name: "", defaultCost: "", defaultPrice: "", imageLink: "", initialStock: 0 })
      setImageFile(null)
      setPreviewUrl(null)
      utils.product.getAllProducts.invalidate()
    } catch (err: any) {
      alert(`Gagal: ${err.message}`)
    } finally {
      setUploading(false)
    }
  }

  const columns: Column<Product>[] = [
    {
      header: "Gambar",
      accessorKey: "imageLink",
      cell: (row) => (
        <div className="relative h-10 w-10 overflow-hidden rounded-md border bg-muted">
          <Image
            src={row.imageLink || "/placeholder.png"}
            alt={row.name}
            fill
            className="object-cover"
          />
        </div>
      ),
    },
    { header: "Nama Produk", accessorKey: "name" },
    {
      header: "Harga Modal",
      accessorKey: "defaultCost",
      cell: (row) => formatRupiah(row.defaultCost),
      className: "text-right font-medium",
    },
    {
      header: "Harga Jual",
      accessorKey: "defaultPrice",
      cell: (row) => formatRupiah(row.defaultPrice),
      className: "text-right font-medium",
    },
    {
      header: "Terakhir Diubah",
      accessorKey: "updatedAt",
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.updatedAt).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </span>
      ),
    },
    {
      header: "Aksi",
      accessorKey: "id",
      cell: (row) => (
        <div className="flex gap-2">
          <button className="rounded bg-blue-500 px-3 py-1 text-white hover:bg-blue-600" onClick={() => alert(`Edit ID: ${row.id}`)}>Edit</button>
          <button className="rounded bg-red-500 px-3 py-1 text-white hover:bg-red-600" onClick={() => alert(`Hapus ID: ${row.id}`)}>Hapus</button>
        </div>
      ),
    },
  ]

  return (
    <div className="container mx-auto py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Manajemen Produk</h1>
        <p className="text-muted-foreground">Kelola inventaris dan daftar harga produk UMKM Anda.</p>
      </div>

      {error && <div className="mb-4 rounded-md bg-destructive/15 p-4 text-sm text-destructive">Gagal memuat produk: {error}</div>}

      {loading ? (
        <div className="flex h-24 items-center justify-center text-muted-foreground">Memuat data produk...</div>
      ) : (
        <FlexibleTable
          data={products}
          columns={columns}
          searchKey="name"
          searchPlaceholder="Cari nama produk..."
          actionButton={
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Tambah Produk
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Tambah Produk Baru</DialogTitle>
                  <DialogDescription>Masukkan informasi detail produk master baru untuk inventaris UMKM Anda.</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nama Produk</Label>
                    <Input
                      id="name"
                      placeholder="Contoh: Kopi Susu Aren"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="defaultCost">Harga Modal</Label>
                      <Input
                        id="defaultCost"
                        type="number"
                        placeholder="15000"
                        value={formData.defaultCost}
                        onChange={(e) => setFormData({ ...formData, defaultCost: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="defaultPrice">Harga Jual</Label>
                      <Input
                        id="defaultPrice"
                        type="number"
                        placeholder="25000"
                        value={formData.defaultPrice}
                        onChange={(e) => setFormData({ ...formData, defaultPrice: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                    <div className="space-y-2">
                      <Label htmlFor="initialStock">Stok Awal</Label>
                      <Input
                        id="initialStock"
                        type="number"
                        placeholder="100"
                        value={formData.initialStock}
                        onChange={(e) =>
                          setFormData({ ...formData, initialStock: Number(e.target.value) })
                        }
                        required
                      />
                    </div>

                  {/* Input File dengan Styling Shadcn & Preview */}
                  <div className="space-y-2">
                    <Label>Gambar Produk</Label>
                    <div className="flex flex-col gap-3">
                      {previewUrl ? (
                        <div className="relative flex items-center justify-between rounded-lg border p-2 bg-muted/50">
                          <div className="relative h-14 w-14 overflow-hidden rounded border bg-background">
                            <Image src={previewUrl} alt="Preview" fill className="object-cover" />
                          </div>
                          <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                            {imageFile?.name}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              setImageFile(null)
                              setPreviewUrl(null)
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center rounded-lg border border-dashed border-input p-6 text-center cursor-pointer hover:bg-accent/50 transition-colors">
                          <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                          <span className="text-sm font-medium">Klik untuk upload gambar</span>
                          <span className="text-xs text-muted-foreground mt-1">PNG, JPG atau WEBP (Maks. 5MB)</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                const file = e.target.files[0]
                                setImageFile(file)
                                setPreviewUrl(URL.createObjectURL(file))
                              }
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  <DialogFooter className="pt-4">
                    <Button type="submit" disabled={uploading}>
                      {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {uploading ? "Mengunggah & Menyimpan..." : "Simpan Produk"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          }
        />
      )}
    </div>
  )
}