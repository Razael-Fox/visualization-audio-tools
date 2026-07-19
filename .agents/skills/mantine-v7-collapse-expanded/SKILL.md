---
name: mantine-v7-collapse-expanded
description: Perbaikan property Collapse pada Mantine v7 dari in menjadi expanded untuk menghindari TypeScript error
---

# Mantine v7 Collapse Property Fix

**Konteks**: Pada versi-versi awal atau komponen transisi lain di Mantine, properti `in` sering digunakan untuk menentukan status tampil tidaknya sebuah elemen. Namun pada komponen `<Collapse>` di Mantine v7, properti ini sudah diganti namanya menjadi `expanded`.

## Error yang Sering Terjadi
```
Type error: Type '{ children: (false | "" | Element | null)[]; in: boolean; }' is not assignable to type 'IntrinsicAttributes & CollapseProps ...'
Property 'in' does not exist on type 'IntrinsicAttributes & CollapseProps ...'
```

## Solusi
Ganti prop `in` menjadi `expanded` pada komponen `<Collapse>`.

**Kode yang Salah (Mantine v6/Transitions):**
```tsx
<Collapse in={opened}>
  ...
</Collapse>
```

**Kode yang Benar (Mantine v7):**
```tsx
<Collapse expanded={opened}>
  ...
</Collapse>
```
