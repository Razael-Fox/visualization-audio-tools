---
name: mantine-v7-grid-gap
description: Panduan penting Mantine v7 untuk komponen Grid yang menggunakan prop 'gap' bukan 'gutter'.
---

# Mantine v7 Grid Prop Migration (`gutter` -> `gap`)

## Masalah
Pada Mantine v7, komponen `<Grid>` tidak lagi memiliki prop `gutter`. Penggunaan `gutter="xs"` atau nilai gutter lainnya akan menyebabkan error saat TypeScript build:
`Type error: Property 'gutter' does not exist on type 'GridProps'`.

## Solusi
Gunakan `gap` (atau `columnGap` / `rowGap`) pada komponen `<Grid>`:

```tsx
// ❌ SALAH (Mantine v6 legacy)
<Grid gutter="xs">

// ✅ BENAR (Mantine v7)
<Grid gap="xs">
```
