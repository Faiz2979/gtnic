"use client"

import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import * as React from "react"

export type Column<T> = {
  header: string
  accessorKey: keyof T | string
  cell?: (item: T) => React.ReactNode
  className?: string
}

interface FlexibleTableProps<T> {
  data: T[]
  columns: Column<T>[]
  searchKey?: keyof T
  searchPlaceholder?: string
  actionButton?: React.ReactNode // <-- Tambahan slot untuk tombol di kanan atas
}

export function FlexibleTable<T extends Record<string, any>>({
  data,
  columns,
  searchKey,
  searchPlaceholder = "Cari data...",
  actionButton,
}: FlexibleTableProps<T>) {
  const [searchQuery, setSearchQuery] = React.useState("")

  const filteredData = React.useMemo(() => {
    if (!searchKey || !searchQuery) return data
    return data.filter((item) => {
      const val = item[searchKey]
      if (val == null) return false
      return String(val).toLowerCase().includes(searchQuery.toLowerCase())
    })
  }, [data, searchKey, searchQuery])

  return (
    <div className="space-y-4">
      {/* Baris Search & Tombol Aksi Sejajar di Kanan-Kiri */}
      <div className="flex items-center justify-between gap-4">
        {searchKey ? (
          <Input
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        ) : (
          <div /> // Spacer jika search tidak dipakai
        )}
        
        {/* Tombol Aksi di Kanan Atas */}
        {actionButton && <div>{actionButton}</div>}
      </div>

      <div className="rounded-md border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col, index) => (
                <TableHead key={index} className={col.className}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {columns.map((col, colIndex) => {
                    const value = row[col.accessorKey as string]
                    return (
                      <TableCell key={colIndex} className={col.className}>
                        {col.cell ? col.cell(row) : (value ?? "-")}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  Tidak ada data produk ditemukan.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}