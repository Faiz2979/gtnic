// src/lib/cloudinary.ts

export const uploadToCloudinary = async (file: File): Promise<string> => {
  if (!file.type.startsWith("image/")) {
    throw new Error("File harus berupa gambar (image).")
  }

  const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
  
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Ukuran file maksimal adalah 5MB.")
  }

  const formData = new FormData()
  formData.append("file", file)
  
  // Masukkan Upload Preset unsigned Anda di sini
  formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "nama_upload_preset_anda")

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "nama_cloud_anda"

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: formData,
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error?.message || "Gagal mengunggah gambar ke Cloudinary.")
  }

  return data.secure_url
}