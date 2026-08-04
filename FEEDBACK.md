# Gym Tracker — Feedback Log

Date: 2026-08-04
Source: Real gym usage after Day 0
Status: Raw evidence / ideas, not commitments

> Living feedback log dari pemakaian nyata. Bukan roadmap dan tidak menentukan
> solusi. Setiap item dicatat sebagai masalah/konteks apa adanya.

## Pemakaian Day 2 (2026-08-05)

### Masalah terbesar (prioritas)
- Masih harus buka Notes/jadwal di luar app untuk tahu latihan hari ini.
- Recent Exercises tidak menyelesaikan; tetap butuh daftar exercise hari itu.
- Visi: buka app → Today's Workout → Start → exercise otomatis tersedia.
- Manual/custom workout tetap harus tersedia.

### Bagus & jangan rusak
- Repeat last set; previous-value/prefill; fitur Day 0/Day 1 yang sudah jalan.

### Konfirmasi kebutuhan
- Routine/program mingguan (Push/Pull/Legs/UL/Upper/Lower); bisa edit exercise saat latihan.
- Warmup vs working set; dropset; bodyweight tanpa pura-pura 0 kg; machine plate/stack.
- Rest timer; notes untuk workout/exercise; Bahasa Indonesia default + opsi English.
- UX: icon familiar (delete→trash, rename→pencil, repeat→repeat icon); Back/Home + konfirmasi
  menggantikan "Cancel Workout"; collapse/expand pakai kontrol konsisten; Add Exercise hijau;
  Rename: Enter langsung save; Finish Workout mudah dijangkau; mobile-first.

### Nanti, bukan sekarang
- Preset PPL/UL/ULPPL + pilih program/goal; tanpa nama/foto public figure (copyright/personality rights).
- Exercise library/discovery, icon/visual exercise.
- Progress: tracking, strength, PR, chart, streak; copy motivasi harus berbasis data.
- Backup auto (Google Drive); backend/AI — keputusan akhir tetap di user.

## Perencanaan workout & rutinitas
1. Saat mulai workout belum tahu/belum punya workout dan exercise apa saja yang
   harus dilakukan; tiba-tiba harus input manual.
2. Ingin bisa memiliki workout/program mingguan yang sudah disiapkan.
3. Ingin pilihan routine seperti UL/PPL dan custom routine.
4. Ada ide program/body-goal presets; contoh inspirasi physique seperti David
   Laid, CBum, Toji — masih ide, belum tervalidasi.

## Hierarchy, navigasi & UI
5. UI/UX membingungkan untuk pemula: cara tambah exercise, tambah set, dan
   hubungan exercise dengan sets kurang jelas.
6. Ingin hierarchy lebih jelas: exercise sebagai bagian utama, sets di bawah
   exercise.
7. Exercise yang sudah panjang sebaiknya bisa collapse/dropdown agar tidak perlu
   scroll jauh.
8. Setelah menambahkan set, mudah kehilangan konteks sedang berada di
   exercise/set mana karena halaman memanjang.
9. Action seperti edit/delete lebih cocok memakai icon yang familiar; destructive
   action harus jelas.
10. Finish Workout sulit dijangkau karena harus scroll.
11. "Discard Workout" besar di bawah terasa mengganggu dan istilahnya tidak
    intuitif.
12. Import/export backup berada di tempat yang salah jika muncul dalam konteks
    workout.

## Kecepatan input set
13. Exercise name harus diketik sendiri dan terasa lambat.
14. Kadang lupa mencatat reps/set setelah selesai dan malas mengisi satu per satu.
15. Weight/reps sering sama dengan set sebelumnya; ingin menghindari mengetik
    ulang.
16. Set belum bisa diedit langsung; remove + re-add terasa cukup tetapi re-entry
    masih merepotkan.
17. Ingin exercise selector/dropdown tetapi tetap bisa custom.
18. Kadang tidak tahu nama exercise.

## Tipe set & kasus khusus
19. Belum ada penanda warmup; belum jelas apakah warmup dihitung sebagai working
    set.
20. Dropset sangat melelahkan jika harus dicatat satu per satu seperti set biasa.
21. Bodyweight exercise seperti leg raise/pull-up tidak semestinya bergantung
    pada input weight=0 yang membingungkan.
22. Beberapa machine lebih natural dicatat berdasarkan plate/stack daripada kg
    yang diketahui pasti.
23. Butuh rest timer; bentuk dan posisi terbaik belum diketahui.

## App, identitas & ekosistem
24. App harus mobile-first karena penggunaan nyata dilakukan lewat HP di gym.
25. Ingin Bahasa Indonesia sebagai default dan opsi English.
26. Ingin versioning aplikasi yang jelas.
27. Ingin link GitHub dan Saweria/donation karena app direncanakan gratis.
28. Ingin halaman feedback/kritik-saran yang sangat mudah digunakan.
29. App icon/branding belum diputuskan; penggunaan foto public figure perlu
    dicek hak penggunaannya terlebih dahulu.
30. Nama aplikasi belum final dan bisa melibatkan feedback penonton.
31. Security/privacy akan menjadi penting jika nanti ada backend/user data.

## Progress & ide advanced (belum divalidasi)
32. Ingin melihat progress dari data workout.
33. Ide advanced: app dapat belajar pola user untuk memberi nilai yang relevan.
34. Ide advanced: natural-language/AI input yang mengubah teks bebas menjadi
    structured workout data.
35. Ide advanced: camera push-up counting.
36. Ide advanced: AI progressive-overload feedback/recommendation.
37. Ide advanced: nutrition logging via natural language dan AI advice, dengan
    keputusan akhir tetap di user.
38. Ide advanced: AI dapat mengklasifikasikan input sebagai food/exercise dan
    menyimpannya ke data yang benar.
