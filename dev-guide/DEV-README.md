src/
├── app/
│   ├── _components/
│   ├── (authenticated)/
│   │   └── path/
│   │       ├── _components/
│   │       ├── _hooks/
│   │       ├── _types/
│   │       └── path/
│   │           ├── _components/
│   │           ├── _hooks/
│   │           ├── _types/
│   │           └── page.tsx
│   ├── (public)/
# Next.js Development Guideline

Panduan standar arruktur direktori, konvensi penamaan, dan struktur modul untuk pengembangan proyek Next.js.

---

## 1. Konvensi Penamaan (File Naming Convention)

* **Hooks:** Menggunakan format `[nama-hooks].ts` dengan nama yang kontekstual (contoh: `use-users-query.ts`).
* **Page Components:** Menggunakan `page.tsx` untuk halaman utama atau entry point route.
* **Global Components:** Menggunakan format `[nama-component].tsx` (contoh: `navbar.tsx`, `footer.tsx`).
* **Utils:** Menggunakan format `[nama-utils].ts` (contoh: `date-formatter.ts`, `api-client.ts`).
* **Constants:** Menggunakan format `[nama-constants].ts` (contoh: `api-endpoints.ts`, `form-config.ts`).

---

## 2. Struktur Folder (Folder Structure)

```text
└── src/
    ├── app/
    │   ├── _components/
    │   ├── (authenticated)/
    │   │   └── path/
    │   │       ├── _components/
    │   │       ├── _hooks/
    │   │       ├── _types/
    │   │       └── path/
    │   │           ├── _components/
    │   │           ├── _hooks/
    │   │           ├── _types/
    │   │           └── page.tsx
    │   ├── (public)/
    │   │   └── path/
    │   │       ├── _components/
    │   │       ├── _hooks/
    │   │       └── path/
    │   │           └── page.tsx
    │   └── api/
    ├── common/
    │   ├── enums/
    │   ├── constants/
    │   └── types/
    ├── libs/
    ├── types/
    ├── utils/
    ├── api/
    └── middleware.ts