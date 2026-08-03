# Gym Tracker PRD

Status: Living document · Owner: waltahh · Updated: 2026-08-04

## Product vision
Gym Tracker: pencatatan workout mobile-first yang sangat cepat sehingga tidak
mengganggu ritme latihan.

## Problem
Mencatat workout di ponsel saat berlatih merepotkan: entri set butuh banyak
tap, exercise harus diketik/disiapkan satu per satu tiap sesi, dan tidak ada
memori berat/reps terakhir — padahal kebanyakan set mirip dengan sesi lalu.

## Target user/context
- Primary: waltahh sendiri, dipakai sungguhan di gym.
- Context: ponsel, tangan berkeringat, sela istirahat antar set singkat,
  perhatian terbagi ke latihan.

## Core job
Mencatat satu set dengan usaha sekecil mungkin: dari mulai berinteraksi dengan
app sampai set tercatat, tanpa mengetik ulang data yang sudah pernah ada.

## Product principles
1. Kecepatan > kelengkapan.
2. Memori yang baik: jangan minta diisi ulang yang sudah diketahui.
3. Mobile-first; bisa dipakai satu tangan dalam kondisi kurang ideal.
4. Data lokal dulu; offline tidak boleh mengganggu.
5. Tidak boleh ada data hilang (persist + backup tetap berlaku).

## Success metrics
- Time to log a set: waktu dari mulai berinteraksi dengan app untuk mencatat
  set sampai set berhasil tercatat.
- Hipotesis target awal: <5 detik, divalidasi lewat pemakaian nyata
  (baseline Day 0 cukup diukur manual untuk sekarang).
- Konsistensi: tiap sesi latihan sungguhan tercatat, tidak ada sesi terlewat.

## Current evidence/problems (pemakaian Day 0)
- Entri set lambat: 2 field + tombol "Add set" per set, terlalu banyak tap.
- Tidak ada prefill berat/reps terakhir → isi ulang manual tiap set.
- Nama exercise harus diketik ulang tiap workout.
- Workout tidak siap saat mulai; exercise harus ditambahkan manual satu per satu.
- Scroll jadi panjang dan kehilangan konteks exercise/set.
- Action penting seperti Finish tidak selalu mudah dijangkau.
- Beberapa label/action membingungkan, mis. Discard Workout.
- Backup/import-export berada di konteks workout dan terasa salah tempat.
- Kebutuhan nyata muncul: warmup, dropset, bodyweight/no-weight,
  plate-based machine, dan rest timer.
  (Dicatat sebagai evidence/kebutuhan yang ditemukan, bukan semuanya langsung
  dikerjakan.)

## Current priorities
1. Exercise library / search / recent.
2. Workout templates.
3. Fast set logging: previous values/prefill + keyboard/interaction flow.
4. Mobile workout navigation: collapse/sticky actions dan pengurangan scroll.

## Non-goals (saat ini)
- Backend/cloud sync, akun, AI, dan analytics.
- Visual polish.
- Rest timer aktif (notification) — kebutuhan baru saja ditemukan, belum
  diprioritaskan.
- Multi-user / multi-device.
