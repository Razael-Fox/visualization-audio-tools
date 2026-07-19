---
name: mantine-v7-grid-gap
description: Perbaikan property Grid pada Mantine v7 dari gutter menjadi gap untuk menghindari TypeScript error
---

# Mantine v7 Grid Property Fix

**Konteks**: Saat melakukan migrasi atau menggunakan template berbasis Mantine versi 7, komponen `<Grid>` telah mengalami perubahan API. Properti `gutter` yang sebelumnya digunakan di v6 ke bawah kini telah diganti menjadi `gap`.

## Error yang Sering Terjadi
```
Type error: Type '{ children: Element[]; gutter: string; mt: number; }' is not assignable to type 'IntrinsicAttributes & GridProps & RefAttributes<HTMLDivElement> & ...'.
Property 'gutter' does not exist on type 'IntrinsicAttributes & GridProps ...'
```

## Solusi
Ganti semua penggunaan prop `gutter` pada komponen `<Grid>` menjadi `gap`.

**Kode yang Salah (Mantine v6):**
```tsx
<Grid gutter="xl">
  ...
</Grid>
```

**Kode yang Benar (Mantine v7):**
```tsx
<Grid gap="xl">
  ...
</Grid>
```
