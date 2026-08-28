/* eslint-disable react/only-export-components */
import { createContext, useContext, useMemo, type ReactNode } from 'react'

export type Lang = 'id' | 'en'

export const LANG_KEY = 'gym-tracker.lang'

type Vars = Record<string, string | number>

const ID: Record<string, string> = {
  'home.tagline': 'Catat workout-mu, satu exercise dan set pada satu waktu.',
  'home.today': 'Latihan hari ini',
  'home.recommendedNext': 'Rekomendasi Lanjutan Rotasi (Opsional)',
  'home.calendarContext': 'Jadwal kalender hari ini: {day}.',
  'home.switchToCalendar': 'Ganti ke jadwal kalender ({day})',
  'home.switchToSequence': 'Lanjut rotasi ({day})',
  'home.todayNoExercises': 'Hari ini belum ada exercise.',
  'home.todayScheduled': 'Tidak ada latihan terjadwal hari ini.',
  'home.nextWorkout': 'Berikutnya — {day}',
  'home.resumeWorkoutHint': 'Lanjutkan workout yang sedang berjalan di atas untuk mulai.',
  'home.startWorkout': 'Mulai workout',
  'home.startEmpty': 'Mulai workout kosong',
  'home.pickRoutine': 'Pilih jadwal',
  'home.noRoutines': 'Belum ada jadwal. Buat dulu di menu Jadwal.',
  'home.workoutInProgress': 'Workout sedang berjalan',
  'home.startedAt': 'Mulai {time}',
  'home.resumeWorkout': 'Lanjutkan workout',
  'home.recentSessions': 'Sesi terakhir',
  'home.viewAllHistory': 'Lihat Semua Riwayat →',
  'home.noSessions': 'Belum ada sesi yang selesai.',
  'home.weeklySchedule': 'Jadwal Mingguan',
  'home.routines': 'Jadwal',
  'home.progress': 'Progress',

  'nav.home': 'Home',
  'nav.planning': 'Rencana',
  'nav.history': 'Riwayat',
  'nav.progress': 'Progress',
  'nav.myRoutines': 'Jadwal Saya',
  'nav.programs': 'Template Program',
  'home.showMore': 'Tampilkan lebih banyak',
  'home.noDaysInRoutine': 'Belum ada hari di jadwal ini.',
  'home.settings': 'Pengaturan & Cadangan Data',
  'lang.switchToEn': 'Switch to English',
  'lang.switchToId': 'Ganti ke Bahasa Indonesia',
  'lang.title': 'Bahasa',

  'pwa.installTitle': 'Install Gym Tracker',
  'pwa.installDesc': 'Akses cepat & 100% offline dari layar utama HP kamu.',
  'pwa.installBtn': 'Install',
  'pwa.iosGuide': 'Tekan ikon Bagikan (Share) lalu pilih "Tambah ke Layar Utama".',
  'pwa.updateAvailable': 'Versi baru tersedia.',
  'pwa.updateReload': 'Muat ulang',
  'pwa.offlineReady': 'Aplikasi siap digunakan offline.',

  'count.days.one': 'hari',
  'count.days.other': 'hari',
  'count.exercises.one': 'exercise',
  'count.exercises.other': 'exercise',
  'count.sets.one': 'set',
  'count.sets.other': 'set',
  'count.sessions.one': 'sesi',
  'count.sessions.other': 'sesi',

  'workout.title': 'Workout',
  'workout.startedAt': 'Mulai {time}',
  'workout.finish': 'Selesai workout',
  'workout.finishHint':
    'Tambahkan minimal satu exercise dengan set untuk menyelesaikan workout.',
  'workout.exitTitle': 'Keluar dari workout?',
  'workout.exitBody':
    'Progresmu tersimpan. Ke home dan lanjutkan kapan saja, atau buang workout ini.',
  'workout.goHome': 'Ke home',
  'workout.discard': 'Buang workout',
  'workout.noExercises': 'Belum ada exercise. Tambahkan yang pertama di bawah.',
  'workout.notesPlaceholder':
    'Catatan workout… (mis. dada terasa kuat saat bench)',
  'workout.backHome': 'Kembali ke home',
  'workout.notes': 'Catatan workout',
  'workout.finishNotesTitle': 'Catatan Workout (Opsional)',
  'common.cancel': 'Batal',

  'timer.rest': 'Istirahat',
  'timer.setRest': 'Atur durasi istirahat',
  'timer.startRest': 'Mulai istirahat {durasi}',
  'timer.start': 'Mulai',
  'timer.reset': 'Reset',
  'timer.restart': 'Ulangi',
  'timer.timeUp': 'Waktu habis!',
  'timer.customMinutes': 'Menit istirahat custom',
  'timer.resetAria': 'Reset timer istirahat',
  'timer.restartAria': 'Ulangi timer istirahat',

  'ex.sets': 'set',
  'ex.lastSet.one': '{count} set tercatat',
  'ex.lastSet.other': '{count} set tercatat',
  'ex.noSets': 'Belum ada set',
  'ex.fillInput': 'Isi input ({weight} × {reps})',
  'ex.fillInputBodyweight': 'Isi input ({reps} reps)',
  'ex.collapseHint': 'Ketuk panah untuk mencatat set.',
  'ex.repeatLastSet': 'Ulangi set terakhir',
  'ex.setLabel': 'Set {n}',
  'ex.reps': 'Reps',
  'ex.repsCount': '{reps} reps',
  'ex.weightKg': 'Berat (kg)',
  'ex.plates': 'Plat',
  'ex.addSet': 'Tambah set',
  'ex.completeSet': 'Selesaikan set',
  'ex.currentSet': 'SET {n} — Sedang dikerjakan',
  'ex.completed': 'Selesai',
  'ex.options': 'Opsi exercise',
  'ex.repsError': 'Reps harus bilangan bulat minimal 1.',
  'ex.plateError': 'Jumlah plat harus bilangan bulat minimal 0.',
  'ex.weightError': 'Berat harus 0 atau angka positif.',
  'ex.nameRequired': 'Nama exercise wajib diisi.',
  'ex.notePlaceholder': 'Catatan… (posisi seat, form cue, dropset)',
  'ex.rename': 'Ubah nama exercise',
  'ex.moveUp': 'Pindah exercise ke atas',
  'ex.moveDown': 'Pindah exercise ke bawah',
  'ex.remove': 'Hapus exercise',
  'ex.confirmRemove': 'Konfirmasi hapus',
  'ex.removeSet': 'Hapus set {n}',
  'ex.removeDrop': 'Hapus set dropset',
  'ex.editSet': 'Ubah set',
  'ex.collapse': 'Tutup exercise',
  'ex.expand': 'Buka exercise',
  'ex.unitLabel': 'Satuan berat',
  'ex.setTypeLabel': 'Tipe set',
  'ex.drop': 'Drop',
  'ex.dropAria': 'Tambahkan set dropset',
  'ex.note': 'Catatan exercise',
  'ex.previous': 'Sebelumnya — {date}',
  'ex.previousShort': 'Sebelumnya: {sets}',
  'ex.best': 'Best: {weight} × {reps}',
  'ex.bestBodyweight': 'Best: {reps} reps',
  'ex.target': 'Coba: {weight} × {reps}+',
  'ex.targetBodyweight': 'Coba: {reps}+ reps',

  'setType.working': 'Working',
  'setType.warmup': 'Pemanasan',
  'setType.dropset': 'Dropset',

  'save': 'Simpan',
  'cancel': 'Batal',
  'nameRequired': 'Nama wajib diisi.',

  'addEx.title': 'Tambah exercise',
  'addEx.nameLabel': 'Nama exercise',
  'addEx.namePlaceholder': 'mis. Bench Press',
  'addEx.library': 'Pustaka exercise',
  'addEx.yourExercises': 'Exercise-mu',
  'addEx.recent': 'Baru dipakai',
  'addEx.add': 'Tambah exercise',

  'backup.title': 'Cadangan Data',
  'backup.desc': 'Simpan atau kembalikan semua data latihanmu di sini.',
  'backup.exportHint': 'Klik "Unduh" untuk menyimpan semua data ke file di perangkatmu.',
  'backup.export': 'Unduh Cadangan',
  'backup.import': 'Unggah Cadangan',
  'backup.exported': 'Cadangan diunduh.',
  'backup.invalid': 'File tidak valid. Gunakan file cadangan dari Gym Tracker.',
  'backup.importWarning':
    'Mengunggah cadangan akan menggantikan semua data yang ada. Pastikan file berasal dari Gym Tracker.',
  'backup.confirmImport': 'Ya, impor sekarang',
  'backup.imported': 'Cadangan berhasil diimpor.',

  'routine.title': 'Jadwal Latihan',
  'routine.desc': 'Siapkan hari dan exercise workout lebih awal.',
  'routine.back': 'Kembali',
  'routine.addRoutine': 'Tambah jadwal',
  'routine.noRoutines': 'Belum ada jadwal. Buat satu untuk merencanakan minggumu.',
  'routine.newName': 'Jadwal baru',
  'routine.newDayName': 'Hari baru',
  'routine.noDays': 'Belum ada hari. Tambahkan hari pertama.',
  'routine.addDay': 'Tambah hari',
  'routine.weekday': 'Jadwal Hari',
  'routine.notScheduled': 'Tidak dijadwalkan',
  'routine.conflict':
    '{weekday} sudah dijadwalkan untuk {routine} / {day}. Ganti?',
  'routine.replace': 'Ganti',
  'routine.noExercises': 'Belum ada exercise.',
  'routine.addExercise': 'Tambah exercise',
  'routine.exercisePlaceholder': 'Nama exercise',
  'routine.duplicate': 'Exercise sudah ada di hari ini.',
  'routine.rename': 'Ubah nama jadwal',
  'routine.delete': 'Hapus jadwal',
  'routine.options': 'Opsi jadwal',
  'routine.renameDay': 'Ubah nama hari',
  'routine.removeDay': 'Hapus hari',
  'routine.dayOptions': 'Opsi hari',
  'routine.moveDayUp': 'Pindah hari ke atas',
  'routine.moveDayDown': 'Pindah hari ke bawah',
  'routine.moveExUp': 'Pindah exercise ke atas',
  'routine.moveExDown': 'Pindah exercise ke bawah',
  'routine.removeEx': 'Hapus exercise',
  'routine.confirm': 'Konfirmasi',
  'routine.day.one': 'hari',
  'routine.day.other': 'hari',
  'routine.exercise.one': 'exercise',
  'routine.exercise.other': 'exercise',

  'home.chooseProgram': 'Pilih Program',
  'program.title': 'Program',
  'program.desc': 'Pilih program latihan yang sesuai dengan tujuanmu.',
  'program.back': 'Kembali',
  'program.chooseGoal': 'Apa tujuanmu?',
  'program.goalHint': 'Kami akan menyarankan program yang paling cocok.',
  'program.direction.beginner': 'Pemula',
  'program.direction.beginner.desc':
    'Baru mulai? Bangun kebiasaan dengan gerakan dasar 3x seminggu.',
  'program.direction.aesthetic': 'Estetis',
  'program.direction.aesthetic.desc':
    'Bentuk tubuh proporsional dengan porsi latihan seimbang.',
  'program.direction.strength': 'Kekuatan',
  'program.direction.strength.desc':
    'Fokus pada angkatan compound berat dengan progres bertahap.',
  'program.direction.athletic': 'Atletis',
  'program.direction.athletic.desc':
    'Volume tinggi dan variasi gerakan untuk performa dan kebugaran.',
  'program.changeGoal': 'Ganti tujuan',
  'program.recommended': 'Rekomendasi untukmu',
  'program.allPrograms': 'Semua program',
  'program.fullbody.title': 'Full Body 3x',
  'program.fullbody.desc':
    'Tiga sesi full body per minggu untuk pemula — simpel dan efektif.',
  'program.fullbody.dayA': 'Full Body A',
  'program.fullbody.dayB': 'Full Body B',
  'program.fullbody.dayC': 'Full Body C',
  'program.upperlower.title': 'Upper/Lower 4x',
  'program.upperlower.desc':
    'Empat hari per minggu: atas dan bawah bergantian untuk otot seimbang.',
  'program.upperlower.dayU1': 'Upper 1',
  'program.upperlower.dayL1': 'Lower 1',
  'program.upperlower.dayU2': 'Upper 2',
  'program.upperlower.dayL2': 'Lower 2',
  'program.ppl.title': 'PPL 6x',
  'program.ppl.desc':
    'Push, pull, dan legs — dua putaran per minggu, 6 hari latihan.',
  'program.ppl.dayPush1': 'Push 1',
  'program.ppl.dayPull1': 'Pull 1',
  'program.ppl.dayLegs1': 'Legs 1',
  'program.ppl.dayPush2': 'Push 2',
  'program.ppl.dayPull2': 'Pull 2',
  'program.ppl.dayLegs2': 'Legs 2',
  'program.ppl5.title': 'PPL 5x',
  'program.ppl5.desc':
    'Push, pull, dan legs lima hari per minggu — porsi isolasi ekstra untuk bentuk proporsional.',
  'program.ppl5.dayPushA': 'Push A',
  'program.ppl5.dayPullA': 'Pull A',
  'program.ppl5.dayLegs': 'Legs',
  'program.ppl5.dayPushB': 'Push B',
  'program.ppl5.dayPullB': 'Pull B',
  'program.strength.title': 'Strength Foundation',
  'program.strength.desc':
    'Pondasi kekuatan: squat, bench, dan deadlift sebagai tulang punggung.',
  'program.strength.daySquat': 'Squat Day',
  'program.strength.dayBench': 'Bench Day',
  'program.strength.dayDeadlift': 'Deadlift Day',
  'program.days': 'Hari',
  'program.apply': 'Terapkan program',
  'program.applyHint': 'Menambah Jadwal baru yang bisa kamu ubah dan jadwalkan.',
  'program.backToList': 'Kembali ke daftar program',

  'weekday.0': 'Minggu',
  'weekday.1': 'Senin',
  'weekday.2': 'Selasa',
  'weekday.3': 'Rabu',
  'weekday.4': 'Kamis',
  'weekday.5': 'Jumat',
  'weekday.6': 'Sabtu',

  'summary.title': 'Workout selesai',
  'summary.saving': 'Menyimpan...',
  'summary.savedNotice': '✓ Workout berhasil disimpan',
  'summary.startAnother': 'Mulai workout lain',
  'summary.back': 'Kembali',
  'summary.edit': 'Edit sesi',
  'summary.delete': 'Hapus sesi',
  'summary.deleteTitle': 'Hapus sesi ini?',
  'summary.deleteBody': 'Sesi dan semua set-nya akan dihapus permanen.',
  'summary.confirmDelete': 'Konfirmasi hapus',

  'progress.title': 'Progress',
  'progress.desc': 'Perkembangan per exercise dari sesi-sesi yang selesai.',
  'progress.noSessions':
    'Belum ada sesi yang selesai — selesaikan workout pertama untuk melihat progress.',
  'progress.noExercises': 'Belum ada exercise yang pernah dicatat.',
  'progress.backToList': 'Kembali ke daftar exercise',
  'progress.last12Weeks': '12-Minggu Terakhir',
  'progress.monthlyVolume': 'Volume Bulanan',
  'progress.recorded': 'tercatat',
  'progress.chart.yAxisUnit': '{unit}',

  'about.title': 'Tentang',
  'about.desc':
    'Gym Tracker v{version} — gratis, open source.',
  'about.github': 'GitHub',
  'about.support': 'Dukung (Saweria)',

  'theme.title': 'Tampilan',
  'theme.light': 'Terang',
  'theme.dark': 'Gelap',
  'theme.system': 'Ikuti Sistem',

  'feedback.email': 'Kirim email',
  'feedback.openIssue': 'Buka issue GitHub',
  'feedback.close': 'Tutup',

  // ConsistencyWidget
  'consistency.weekStreak': 'Minggu ke-{n} berturut-turut',
  'consistency.weekStreakOne': 'Minggu pertama aktif',
  'consistency.dayStreak': '{n} hari berturut-turut',
  'consistency.dayStreakOne': '1 hari berturut-turut',
  'consistency.totalSessions': '{n} sesi total',
  'consistency.lastTrained': 'Terakhir latihan {n} hari lalu',
  'consistency.newChapter': 'Mulai babak baru',
  'consistency.comeback7': 'Sudah {n} hari. Kamu kembali sekarang.',
  'consistency.comeback14': 'Sudah {n} hari. Kamu kembali sekarang — itu yang penting.',
  'consistency.startStory': 'Mulai ceritamu hari ini.',

  // SummaryScreen identity line
  'summary.identityLine1': 'Sesi pertamamu. Setiap kali kamu kembali, ini jadi bukti siapa kamu.',
  'summary.identityLine': 'Minggu ke-{n} berturut-turut. Kamu orang yang melatih diri.',
  'summary.identityLineSessions': '{n} sesi. Kamu mulai membangun sesuatu.',
  'summary.comebackLine': 'Kamu kembali. {n} sesi total. Lanjutkan dari sini.',

  // PR callout
  'summary.prTitle': 'PR Baru',
  'summary.prLine': '{exercise} — {weight} × {reps}',
  'summary.prLinePrev': '(sebelumnya {weight} × {reps})',
  'summary.prLineFirst': '(pertama kali dicatat)',
  'summary.prBodyweight': '{exercise} — {reps} reps',
  'summary.prBodyweightPrev': '(sebelumnya {reps} reps)',
  'summary.analysisTitle': 'Analisis Workout',
  'summary.analysisDuration': 'Durasi: {n} menit',

  // Milestone callouts
  'milestone.first-workout': 'Sesi pertama selesai.',
  'milestone.first-workout.sub': 'Setiap perjalanan dimulai dari langkah pertama.',
  'milestone.sessions-10': '10 sesi selesai.',
  'milestone.sessions-10.sub': 'Kebiasaan ini mulai terbentuk.',
  'milestone.sessions-50': '50 sesi selesai.',
  'milestone.sessions-50.sub': 'Ini bukan lagi kebiasaan — ini bagian dari siapa kamu.',
  'milestone.streak-4w': '4 minggu berturut-turut.',
  'milestone.streak-4w.sub': 'Ini bukan lagi coba-coba — ini bagian dari siapa kamu.',
  'milestone.streak-8w': '8 minggu berturut-turut.',
  'milestone.streak-8w.sub': 'Kamu membuktikan kepada dirimu sendiri.',
  'milestone.first-pr': 'PR pertamamu.',
  'milestone.first-pr.sub': 'Data menunjukkan kamu semakin kuat.',
  'milestone.comeback-7d': 'Kamu kembali setelah istirahat.',
  'milestone.comeback-7d.sub': '{n} sesi total. Lanjutkan.',
  'milestone.dismiss': 'Tutup',

  'unit.kg': 'kg',
  'unit.plates': 'plat',

  'calc.title': 'Kalkulator',
  'calc.btn': 'Kalkulator',

  'error.title': 'Terjadi kesalahan',
  'error.reload': 'Muat ulang aplikasi',
}

const EN: Record<string, string> = {
  'home.tagline': 'Log your workout, one exercise and set at a time.',
  'home.today': "Today's workout",
  'home.recommendedNext': 'Next in Rotation (Optional)',
  'home.calendarContext': "Today's calendar schedule: {day}.",
  'home.switchToCalendar': 'Switch to calendar schedule ({day})',
  'home.switchToSequence': 'Continue rotation ({day})',
  'home.todayNoExercises': 'This day has no exercises yet.',
  'home.todayScheduled': 'No workout scheduled today.',
  'home.nextWorkout': 'Next — {day}',
  'home.resumeWorkoutHint': 'Resume the workout in progress above to start.',
  'home.startWorkout': 'Start workout',
  'home.startEmpty': 'Start empty workout',
  'home.pickRoutine': 'Pick a routine',
  'home.noRoutines': 'No routines yet. Create one in Routines first.',
  'home.workoutInProgress': 'Workout in progress',
  'home.startedAt': 'Started at {time}',
  'home.resumeWorkout': 'Resume workout',
  'home.recentSessions': 'Recent sessions',
  'home.viewAllHistory': 'View Full History →',
  'home.noSessions': 'No completed sessions yet.',
  'home.weeklySchedule': 'Weekly Schedule',
  'home.routines': 'Routines',
  'home.progress': 'Progress',

  'nav.home': 'Home',
  'nav.planning': 'Planning',
  'nav.history': 'History',
  'nav.progress': 'Progress',
  'nav.myRoutines': 'My Routines',
  'nav.programs': 'Program Templates',
  'home.showMore': 'Show more',
  'home.noDaysInRoutine': 'No days in this routine yet.',
  'home.settings': 'Settings & Data Backup',
  'lang.switchToEn': 'Switch to English',
  'lang.switchToId': 'Ganti ke Bahasa Indonesia',
  'lang.title': 'Language',

  'pwa.installTitle': 'Install Gym Tracker',
  'pwa.installDesc': 'Fast access & 100% offline right from your home screen.',
  'pwa.installBtn': 'Install',
  'pwa.iosGuide': 'Tap the Share button then select "Add to Home Screen".',
  'pwa.updateAvailable': 'A new version is available.',
  'pwa.updateReload': 'Reload',
  'pwa.offlineReady': 'The app is ready to work offline.',

  'count.days.one': 'day',
  'count.days.other': 'days',
  'count.exercises.one': 'exercise',
  'count.exercises.other': 'exercises',
  'count.sets.one': 'set',
  'count.sets.other': 'sets',
  'count.sessions.one': 'session',
  'count.sessions.other': 'sessions',

  'workout.title': 'Workout',
  'workout.startedAt': 'Started at {time}',
  'workout.finish': 'Finish workout',
  'workout.finishHint':
    'Add at least one exercise with a set to finish the workout.',
  'workout.exitTitle': 'Exit workout?',
  'workout.exitBody':
    'Your progress is saved. Go home and resume anytime, or discard the workout.',
  'workout.goHome': 'Go home',
  'workout.discard': 'Discard workout',
  'workout.noExercises': 'No exercises yet. Add your first one below.',
  'workout.notesPlaceholder': 'Workout notes… (e.g. felt strong on bench)',
  'workout.backHome': 'Back to home',
  'workout.notes': 'Workout notes',
  'workout.finishNotesTitle': 'Workout Notes (Optional)',
  'common.cancel': 'Cancel',

  'timer.rest': 'Rest',
  'timer.setRest': 'Set rest duration',
  'timer.startRest': 'Start rest {durasi}',
  'timer.start': 'Start',
  'timer.reset': 'Reset',
  'timer.restart': 'Restart',
  'timer.timeUp': "Time's up!",
  'timer.customMinutes': 'Custom rest minutes',
  'timer.resetAria': 'Reset rest timer',
  'timer.restartAria': 'Restart rest timer',

  'ex.sets': 'sets',
  'ex.lastSet.one': '{count} set logged',
  'ex.lastSet.other': '{count} sets logged',
  'ex.noSets': 'No sets logged yet',
  'ex.fillInput': 'Fill input ({weight} × {reps})',
  'ex.fillInputBodyweight': 'Fill input ({reps} reps)',
  'ex.collapseHint': 'Tap the arrow to log sets.',
  'ex.repeatLastSet': 'Repeat last set',
  'ex.setLabel': 'Set {n}',
  'ex.reps': 'Reps',
  'ex.repsCount': '{reps} reps',
  'ex.weightKg': 'Weight (kg)',
  'ex.plates': 'Plates',
  'ex.addSet': 'Add set',
  'ex.completeSet': 'Complete set',
  'ex.currentSet': 'SET {n} — In progress',
  'ex.completed': 'Done',
  'ex.options': 'Exercise options',
  'ex.repsError': 'Reps must be a whole number of at least 1.',
  'ex.plateError': 'Plate count must be a whole number of at least 0.',
  'ex.weightError': 'Weight must be 0 or a positive number.',
  'ex.nameRequired': 'Exercise name is required.',
  'ex.notePlaceholder': 'Note… (seat position, form cue, dropset)',
  'ex.rename': 'Rename exercise',
  'ex.moveUp': 'Move exercise up',
  'ex.moveDown': 'Move exercise down',
  'ex.remove': 'Remove exercise',
  'ex.confirmRemove': 'Confirm remove',
  'ex.removeSet': 'Remove set {n}',
  'ex.removeDrop': 'Remove dropset set',
  'ex.editSet': 'Edit set',
  'ex.collapse': 'Collapse exercise',
  'ex.expand': 'Expand exercise',
  'ex.unitLabel': 'Weight unit',
  'ex.setTypeLabel': 'Set type',
  'ex.drop': 'Drop',
  'ex.dropAria': 'Add a dropset set',
  'ex.note': 'Exercise note',
  'ex.previous': 'Previous — {date}',
  'ex.previousShort': 'Prev: {sets}',
  'ex.best': 'Best: {weight} × {reps}',
  'ex.bestBodyweight': 'Best: {reps} reps',
  'ex.target': 'Try: {weight} × {reps}+',
  'ex.targetBodyweight': 'Try: {reps}+ reps',

  'setType.working': 'Working',
  'setType.warmup': 'Warmup',
  'setType.dropset': 'Dropset',

  'save': 'Save',
  'cancel': 'Cancel',
  'nameRequired': 'Name is required.',

  'addEx.title': 'Add exercise',
  'addEx.nameLabel': 'Exercise name',
  'addEx.namePlaceholder': 'e.g. Bench Press',
  'addEx.library': 'Exercise library',
  'addEx.yourExercises': 'Your exercises',
  'addEx.recent': 'Recently used',
  'addEx.add': 'Add exercise',

  'backup.title': 'Data Backup',
  'backup.desc': 'Save or restore all your workout data here.',
  'backup.exportHint': 'Click "Download" to save all your data as a file on your device.',
  'backup.export': 'Download Backup',
  'backup.import': 'Upload Backup',
  'backup.exported': 'Backup downloaded.',
  'backup.invalid': 'Invalid file. Please use a backup file from Gym Tracker.',
  'backup.importWarning':
    'Uploading a backup will replace all your current data. Make sure the file is from Gym Tracker.',
  'backup.confirmImport': 'Yes, import now',
  'backup.imported': 'Backup imported successfully.',

  'routine.title': 'Routines',
  'routine.desc': 'Prepare workout days and exercises ahead of time.',
  'routine.back': 'Back',
  'routine.addRoutine': 'Add routine',
  'routine.noRoutines': 'No routines yet. Create one to plan your week.',
  'routine.newName': 'New routine',
  'routine.newDayName': 'New day',
  'routine.noDays': 'No days yet. Add your first day.',
  'routine.addDay': 'Add day',
  'routine.weekday': 'Weekday',
  'routine.notScheduled': 'Not scheduled',
  'routine.conflict':
    '{weekday} is already scheduled for {routine} / {day}. Replace it?',
  'routine.replace': 'Replace',
  'routine.noExercises': 'No exercises yet.',
  'routine.addExercise': 'Add exercise',
  'routine.exercisePlaceholder': 'Exercise name',
  'routine.duplicate': 'Exercise already in this day.',
  'routine.rename': 'Rename routine',
  'routine.delete': 'Delete routine',
  'routine.options': 'Routine options',
  'routine.renameDay': 'Rename day',
  'routine.removeDay': 'Remove day',
  'routine.dayOptions': 'Day options',
  'routine.moveDayUp': 'Move day up',
  'routine.moveDayDown': 'Move day down',
  'routine.moveExUp': 'Move exercise up',
  'routine.moveExDown': 'Move exercise down',
  'routine.removeEx': 'Remove exercise',
  'routine.confirm': 'Confirm',
  'routine.day.one': 'day',
  'routine.day.other': 'days',
  'routine.exercise.one': 'exercise',
  'routine.exercise.other': 'exercises',

  'home.chooseProgram': 'Choose Program',
  'program.title': 'Programs',
  'program.desc': 'Pick a workout program that fits your goal.',
  'program.back': 'Back',
  'program.chooseGoal': 'What is your goal?',
  'program.goalHint': 'We will recommend the best matching program.',
  'program.direction.beginner': 'Beginner',
  'program.direction.beginner.desc':
    'Just starting out? Build the habit with basic movements 3x a week.',
  'program.direction.aesthetic': 'Aesthetic',
  'program.direction.aesthetic.desc':
    'A balanced, proportional physique with even training volume.',
  'program.direction.strength': 'Strength',
  'program.direction.strength.desc':
    'Focus on heavy compound lifts with steady progression.',
  'program.direction.athletic': 'Athletic',
  'program.direction.athletic.desc':
    'High volume and varied movements for performance and fitness.',
  'program.changeGoal': 'Change goal',
  'program.recommended': 'Recommended for you',
  'program.allPrograms': 'All programs',
  'program.fullbody.title': 'Full Body 3x',
  'program.fullbody.desc':
    'Three full-body sessions per week for beginners — simple and effective.',
  'program.fullbody.dayA': 'Full Body A',
  'program.fullbody.dayB': 'Full Body B',
  'program.fullbody.dayC': 'Full Body C',
  'program.upperlower.title': 'Upper/Lower 4x',
  'program.upperlower.desc':
    'Four days a week: upper and lower alternating for balanced muscle.',
  'program.upperlower.dayU1': 'Upper 1',
  'program.upperlower.dayL1': 'Lower 1',
  'program.upperlower.dayU2': 'Upper 2',
  'program.upperlower.dayL2': 'Lower 2',
  'program.ppl.title': 'PPL 6x',
  'program.ppl.desc':
    'Push, pull, and legs — two rounds per week, 6 training days.',
  'program.ppl.dayPush1': 'Push 1',
  'program.ppl.dayPull1': 'Pull 1',
  'program.ppl.dayLegs1': 'Legs 1',
  'program.ppl.dayPush2': 'Push 2',
  'program.ppl.dayPull2': 'Pull 2',
  'program.ppl.dayLegs2': 'Legs 2',
  'program.ppl5.title': 'PPL 5x',
  'program.ppl5.desc':
    'Push, pull, and legs five days per week — extra isolation volume for a balanced physique.',
  'program.ppl5.dayPushA': 'Push A',
  'program.ppl5.dayPullA': 'Pull A',
  'program.ppl5.dayLegs': 'Legs',
  'program.ppl5.dayPushB': 'Push B',
  'program.ppl5.dayPullB': 'Pull B',
  'program.strength.title': 'Strength Foundation',
  'program.strength.desc':
    'A strength base built around squat, bench, and deadlift.',
  'program.strength.daySquat': 'Squat Day',
  'program.strength.dayBench': 'Bench Day',
  'program.strength.dayDeadlift': 'Deadlift Day',
  'program.days': 'Days',
  'program.apply': 'Apply program',
  'program.applyHint': 'Adds a new routine you can edit and schedule.',
  'program.backToList': 'Back to programs',

  'weekday.0': 'Sunday',
  'weekday.1': 'Monday',
  'weekday.2': 'Tuesday',
  'weekday.3': 'Wednesday',
  'weekday.4': 'Thursday',
  'weekday.5': 'Friday',
  'weekday.6': 'Saturday',

  'summary.title': 'Workout complete',
  'summary.saving': 'Saving...',
  'summary.savedNotice': '✓ Workout saved successfully',
  'summary.startAnother': 'Start another workout',
  'summary.back': 'Back',
  'summary.edit': 'Edit session',
  'summary.delete': 'Delete session',
  'summary.deleteTitle': 'Delete this session?',
  'summary.deleteBody': 'The session and all its sets will be permanently removed.',
  'summary.confirmDelete': 'Confirm delete',

  'progress.title': 'Progress',
  'progress.desc': 'Per-exercise progress from finished sessions.',
  'progress.noSessions':
    'No finished sessions yet — complete your first workout to see progress.',
  'progress.noExercises': 'No exercises logged yet.',
  'progress.backToList': 'Back to exercises',
  'progress.last12Weeks': 'Last 12 Weeks',
  'progress.monthlyVolume': 'Monthly Volume',
  'progress.recorded': 'recorded',
  'progress.chart.yAxisUnit': '{unit}',

  'about.title': 'About',
  'about.desc':
    'Gym Tracker v{version} — free, open source.',
  'about.github': 'GitHub',
  'about.support': 'Support (Saweria)',

  'theme.title': 'Appearance',
  'theme.light': 'Light',
  'theme.dark': 'Dark',
  'theme.system': 'System',

  'feedback.email': 'Send email',
  'feedback.openIssue': 'Open GitHub issue',
  'feedback.close': 'Close',

  // ConsistencyWidget
  'consistency.weekStreak': 'Week {n} in a row',
  'consistency.weekStreakOne': 'First active week',
  'consistency.dayStreak': '{n} days in a row',
  'consistency.dayStreakOne': '1 day in a row',
  'consistency.totalSessions': '{n} sessions total',
  'consistency.lastTrained': 'Last trained {n} days ago',
  'consistency.newChapter': 'Start a new chapter',
  'consistency.comeback7': '{n} days since last session. Good to be back.',
  'consistency.comeback14': '{n} days away. You\'re back now — that\'s what matters.',
  'consistency.startStory': 'Start your story today.',

  // SummaryScreen identity line
  'summary.identityLine1': 'Your first session. Every time you come back, this becomes evidence of who you are.',
  'summary.identityLine': 'Week {n} in a row. You are someone who trains.',
  'summary.identityLineSessions': '{n} sessions. You\'re starting to build something.',
  'summary.comebackLine': 'You\'re back. {n} sessions total. Continue from here.',

  // PR callout
  'summary.prTitle': 'New PR',
  'summary.prLine': '{exercise} — {weight} × {reps}',
  'summary.prLinePrev': '(was {weight} × {reps})',
  'summary.prLineFirst': '(first time recorded)',
  'summary.prBodyweight': '{exercise} — {reps} reps',
  'summary.prBodyweightPrev': '(was {reps} reps)',
  'summary.analysisTitle': 'Workout Analysis',
  'summary.analysisDuration': 'Duration: {n} minutes',

  // Milestone callouts
  'milestone.first-workout': 'First session complete.',
  'milestone.first-workout.sub': 'Every journey starts with a first step.',
  'milestone.sessions-10': '10 sessions done.',
  'milestone.sessions-10.sub': 'The habit is forming.',
  'milestone.sessions-50': '50 sessions done.',
  'milestone.sessions-50.sub': 'This is no longer a habit — it\'s part of who you are.',
  'milestone.streak-4w': '4 weeks in a row.',
  'milestone.streak-4w.sub': 'This is no longer a trial — it\'s part of who you are.',
  'milestone.streak-8w': '8 weeks in a row.',
  'milestone.streak-8w.sub': 'You\'ve proven it to yourself.',
  'milestone.first-pr': 'Your first personal record.',
  'milestone.first-pr.sub': 'The data shows you\'re getting stronger.',
  'milestone.comeback-7d': 'You\'re back after a break.',
  'milestone.comeback-7d.sub': '{n} sessions total. Keep going.',
  'milestone.dismiss': 'Close',

  'unit.kg': 'kg',
  'unit.plates': 'plates',

  'calc.title': 'Calculator',
  'calc.btn': 'Calculator',

  'error.title': 'Something went wrong',
  'error.reload': 'Reload app',
}

const DICTS: Record<Lang, Record<string, string>> = { id: ID, en: EN }

function warnMissing(key: string) {
  if (import.meta.env.DEV) {
    console.warn(`[i18n] Missing key: "${key}"`)
  }
}

function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    key in vars ? String(vars[key]) : match,
  )
}

type I18n = {
  lang: Lang
  tr: (key: string, vars?: Vars) => string
  p: (count: number, key: string) => string
}

export type { I18n }

export const I18nContext = createContext<I18n | null>(null)

export function I18nProvider({
  lang,
  children,
}: {
  lang: Lang
  children: ReactNode
}) {
  const value: I18n = useMemo(() => ({
    lang,
    tr: (key, vars) => {
      const template = DICTS[lang][key] ?? DICTS.en[key]
      if (template === undefined) warnMissing(key)
      return interpolate(template ?? key, vars)
    },
    p: (count, key) => {
      const template =
        DICTS[lang][`${key}.${count === 1 ? 'one' : 'other'}`] ??
        DICTS.en[`${key}.${count === 1 ? 'one' : 'other'}`]
      if (template === undefined) warnMissing(key)
      return interpolate(template ?? key, { count })
    },
  }), [lang])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18n {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}

export function localeOf(lang: Lang): string {
  return lang === 'id' ? 'id-ID' : 'en-US'
}
