# Project Rules

## Workflow
- Setelah selesai melakukan perubahan atau update kode, JANGAN menjalankan verifikasi/preview untuk mengecek hasilnya. Tidak perlu konfirmasi atau pengecekan dari Claude — user akan mengecek perubahan secara manual.
- Cukup lakukan perubahan kode yang diminta, lalu ringkas singkat apa yang diubah. Jangan membuka preview server, screenshot, atau eval untuk validasi kecuali user secara eksplisit memintanya.

## Product principles
- TIDAK ADA otomatisasi eksekusi revenue di app ini. AI hanya **menyiapkan saran**; RA yang me-review dan menerapkan setiap perubahan secara manual. Jangan menambahkan kembali fitur auto-execution (mis. "Run all auto-eligible", autonomy mode "Auto", kill-switch, status "auto-executed").
- Catatan: "Social Media Automation" (penjadwalan post) adalah fitur/integrasi terpisah yang sah — bukan termasuk larangan di atas.
- Label risk suggestion memakai istilah non-otomatis: `risk: 'auto'` → "Quick win", `risk: 'approval'` → "Needs review".
