---
name: nextjs-mantine-link-component
description: Perbaikan error saat menggunakan komponen Link Next.js sebagai prop component di Mantine Server Components
---

# Next.js & Mantine Link Component Fix

**Konteks**: Di Next.js App Router, secara default setiap file berada di *Server Component*. Saat kita menggunakan komponen Mantine (seperti `Button`) dan mengoper fungsi atau komponen React (seperti `Link` dari `next/link`) melalui properti `component`, Next.js akan memunculkan error karena fungsi tidak dapat diserialisasi untuk dikirim dari Server Component ke Client Component.

## Error yang Sering Terjadi
```
Error occurred prerendering page "/". 
Error: Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with "use server".
```

## Solusi
Jika sebuah halaman/komponen banyak menggunakan interaktivitas atau mengoper fungsi/komponen sebagai props ke komponen Mantine (contoh: `component={Link}`), ubah halaman/komponen tersebut menjadi *Client Component*.

Tambahkan deklarasi `"use client";` di baris paling atas file:

**Kode yang Benar:**
```tsx
"use client";

import { Button } from "@mantine/core";
import Link from "next/link";

export default function Page() {
  return (
    <Button component={Link} href="/path">
      Go to Path
    </Button>
  );
}
```
