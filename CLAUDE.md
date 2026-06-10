# Project Rules

## Product context
- App ini adalah **Revenue Assistant** untuk satu RA mengelola **~20 properti kecil** (villa, guesthouse, boutique hotel — Indonesia). Tesis: 1 RA bisa menangani 20 properti karena AI **menyiapkan saran siap-pakai**, dan RA tinggal review + menerapkan.
- **Pengguna utama: RA pemula** (belum tentu pakar revenue management) → UI harus memandu aksi berikutnya dan selalu menjelaskan "why". Pengguna sekunder: **Lead/Admin** (oversight banyak RA + set limit rekomendasi).
- Metrik sukses: **properti per RA** (~20), **adoption/acceptance** saran AI, dan **uplift RevPAR/occupancy**.
- Status: **prototype clickable dengan dummy data** (Pinia, reset saat reload). Tujuannya mengunci UX & memberi tim backend bentuk layar + data. Lihat `README.md` untuk detail fitur & data contract.

## Workflow
- Setelah selesai melakukan perubahan atau update kode, JANGAN menjalankan verifikasi/preview untuk mengecek hasilnya. Tidak perlu konfirmasi atau pengecekan dari Claude — user akan mengecek perubahan secara manual.
- Cukup lakukan perubahan kode yang diminta, lalu ringkas singkat apa yang diubah. Jangan membuka preview server, screenshot, atau eval untuk validasi kecuali user secara eksplisit memintanya.

## Product principles
- TIDAK ADA otomatisasi eksekusi revenue di app ini. AI hanya **menyiapkan saran**; RA yang me-review dan menerapkan setiap perubahan secara manual. Jangan menambahkan kembali fitur auto-execution (mis. "Run all auto-eligible", autonomy mode "Auto", kill-switch, status "auto-executed").
- Catatan: "Social Media Automation" (penjadwalan post) adalah fitur/integrasi terpisah yang sah — bukan termasuk larangan di atas.
- Label risk suggestion memakai istilah non-otomatis: `risk: 'auto'` → "Quick win", `risk: 'approval'` → "Needs review".
- **Fokus operasional, BUKAN analitik/BI.** App ini untuk pekerjaan harian (triage, review & terapkan saran, kelola tugas/channel/pricing, balas review, laporan owner, monitor hasil aksi). Hindari menambah dashboard tren, eksplorasi data, atau laporan analitik mendalam sebagai fitur baru.

## Non-goals (jangan ditambahkan)
- ❌ Eksekusi otomatis aksi revenue (lihat prinsip di atas).
- ❌ Fitur analitik/BI baru (dashboard tren, deep-dive data, scorecard analitis).
- ❌ Menjadi PMS / channel manager / booking engine — app ini duduk di atas sistem itu (lihat Integrations di Settings).

## Glossary (istilah domain)
- **RA (Revenue Assistant)** — pengguna utama; mengelola portfolio properti.
- **Lead/Admin** — mengawasi banyak RA, menetapkan limit rekomendasi.
- **Smart Suggest / Suggestion** — rekomendasi aksi revenue yang disiapkan AI; RA yang menerapkan.
- **Quick win** (`risk: 'auto'`) — saran berisiko rendah & reversible. **Needs review** (`risk: 'approval'`) — saran berdampak besar, perlu ditinjau lebih teliti.
- **Monitoring** — melacak *hasil* dari aksi yang sudah diterapkan (bukan otomatisasi).
- **Occupancy** — % kamar/unit terisi. **ADR** — Average Daily Rate. **RevPAR** — Revenue per Available Room (≈ ADR × occupancy). **Pace** — laju booking vs tahun lalu (year-over-year).
- **Compset** — competitor set; rate-shopping pesaing di radius pasar. **BAR** — Best Available Rate (baseline harga).
- **OTA** — Online Travel Agent (Booking.com, Agoda, dll). **Parity** — konsistensi harga antar channel.
