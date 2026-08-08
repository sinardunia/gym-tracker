/* eslint-disable react/only-export-components */
import { createContext, useContext, type ReactNode } from 'react'

export type Lang = 'id' | 'en'

export const LANG_KEY = 'gym-tracker.lang'

type Vars = Record<string, string | number>

const ID: Record<string, string> = {
  'home.tagline': 'Catat workout-mu, satu exercise dan set pada satu waktu.',
  'home.today': 'Latihan hari ini',
  'home.todayNoExercises': 'Hari ini belum ada exercise.',
  'home.todayScheduled': 'Tidak ada latihan terjadwal hari ini.',
  'home.nextWorkout': 'Berikutnya — {day}',
  'home.resumeWorkoutHint': 'Lanjutkan workout yang sedang berjalan di atas untuk mulai.',
  'home.startWorkout': 'Mulai workout',
  'home.startEmpty': 'Mulai workout kosong',
  'home.pickRoutine': 'Pilih routine',
  'home.noRoutines': 'Belum ada routine. Buat dulu di menu Routines.',
  'home.workoutInProgress': 'Workout sedang berjalan',
  'home.startedAt': 'Mulai {time}',
  'home.resumeWorkout': 'Lanjutkan workout',
  'home.recentSessions': 'Sesi terakhir',
  'home.noSessions': 'Belum ada sesi yang selesai.',
  'home.routines': 'Routines',
  'home.progress': 'Progress',
  'home.showMore': 'Tampilkan lebih banyak',
  'home.noDaysInRoutine': 'Belum ada hari di routine ini.',
  'lang.switchToEn': 'Switch to English',
  'lang.switchToId': 'Ganti ke Bahasa Indonesia',

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
  'ex.lastSet': 'Terakhir: {reps} reps{weight}',
  'ex.noSets': 'Belum ada set.',
  'ex.collapseHint': 'Ketuk panah untuk mencatat set.',
  'ex.repeatLastSet': 'Ulangi set terakhir',
  'ex.setLabel': 'Set {n}',
  'ex.reps': 'Reps',
  'ex.repsCount': '{reps} reps',
  'ex.weightKg': 'Berat (kg)',
  'ex.plates': 'Plat',
  'ex.addSet': 'Tambah set',
  'ex.repsError': 'Reps harus bilangan bulat minimal 1.',
  'ex.plateError': 'Jumlah plat harus bilangan bulat minimal 0.',
  'ex.weightError': 'Berat harus 0 atau angka positif.',
  'ex.nameRequired': 'Nama exercise wajib diisi.',
  'ex.notePlaceholder': 'Catatan… (posisi seat, form cue, dropset)',
  'ex.rename': 'Ubah nama exercise',
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
  'addEx.recent': 'Baru dipakai',
  'addEx.add': 'Tambah exercise',

  'backup.title': 'Cadangan',
  'backup.desc': 'Ekspor atau pulihkan semua data Gym Tracker lokal.',
  'backup.export': 'Ekspor JSON',
  'backup.import': 'Impor JSON',
  'backup.exported': 'Cadangan diunduh.',
  'backup.invalid': 'File cadangan tidak valid. Data yang ada tidak diubah.',
  'backup.importWarning':
    'Mengimpor cadangan ini akan menggantikan semua data lokal, termasuk workout aktif dan sesi terakhir.',
  'backup.confirmImport': 'Konfirmasi impor',
  'backup.imported': 'Cadangan diimpor.',

  'routine.title': 'Routines',
  'routine.desc': 'Siapkan hari dan exercise workout lebih awal.',
  'routine.back': 'Kembali',
  'routine.addRoutine': 'Tambah routine',
  'routine.noRoutines': 'Belum ada routine. Buat satu untuk merencanakan minggumu.',
  'routine.newName': 'Routine baru',
  'routine.newDayName': 'Hari baru',
  'routine.noDays': 'Belum ada hari. Tambahkan hari pertama.',
  'routine.addDay': 'Tambah hari',
  'routine.weekday': 'Hari',
  'routine.notScheduled': 'Tidak dijadwalkan',
  'routine.conflict':
    '{weekday} sudah dijadwalkan untuk {routine} / {day}. Ganti?',
  'routine.replace': 'Ganti',
  'routine.noExercises': 'Belum ada exercise.',
  'routine.addExercise': 'Tambah exercise',
  'routine.exercisePlaceholder': 'Nama exercise',
  'routine.duplicate': 'Exercise sudah ada di hari ini.',
  'routine.rename': 'Ubah nama routine',
  'routine.delete': 'Hapus routine',
  'routine.renameDay': 'Ubah nama hari',
  'routine.removeDay': 'Hapus hari',
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
  'program.strength.title': 'Strength Foundation',
  'program.strength.desc':
    'Pondasi kekuatan: squat, bench, dan deadlift sebagai tulang punggung.',
  'program.strength.daySquat': 'Squat Day',
  'program.strength.dayBench': 'Bench Day',
  'program.strength.dayDeadlift': 'Deadlift Day',
  'program.days': 'Hari',
  'program.apply': 'Terapkan program',
  'program.applyHint': 'Menambah Routine baru yang bisa kamu ubah dan jadwalkan.',
  'program.backToList': 'Kembali ke daftar program',

  'weekday.0': 'Minggu',
  'weekday.1': 'Senin',
  'weekday.2': 'Selasa',
  'weekday.3': 'Rabu',
  'weekday.4': 'Kamis',
  'weekday.5': 'Jumat',
  'weekday.6': 'Sabtu',

  'summary.title': 'Workout selesai',
  'summary.startAnother': 'Mulai workout lain',
  'summary.back': 'Kembali',

  'progress.title': 'Progress',
  'progress.desc': 'Perkembangan per exercise dari sesi-sesi yang selesai.',
  'progress.noSessions':
    'Belum ada sesi yang selesai — selesaikan workout pertama untuk melihat progress.',
  'progress.noExercises': 'Belum ada exercise yang pernah dicatat.',
  'progress.backToList': 'Kembali ke daftar exercise',

  'about.title': 'Tentang',
  'about.desc':
    'Gym Tracker v{version} — gratis, open source, semua data tetap di perangkatmu.',
  'about.github': 'GitHub',
  'about.support': 'Dukung (Saweria)',

  'feedback.send': 'Kirim masukan',
  'feedback.title': 'Masukan & saran',
  'feedback.body':
    'Ada yang mengganggu atau kurang? Tulis di sini — tersimpan di perangkatmu. Lebih suka diskusi publik? Buka issue di GitHub.',
  'feedback.placeholder': 'Ide, masalah, atau kritik-saran…',
  'feedback.messageLabel': 'Pesan masukan',
  'feedback.saved': 'Terima kasih, tercatat!',
  'feedback.save': 'Simpan masukan',
  'feedback.openIssue': 'Buka issue GitHub',
  'feedback.close': 'Tutup',

  'unit.kg': 'kg',
  'unit.plates': 'plat',
}

const EN: Record<string, string> = {
  'home.tagline': 'Log your workout, one exercise and set at a time.',
  'home.today': "Today's workout",
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
  'home.noSessions': 'No completed sessions yet.',
  'home.routines': 'Routines',
  'home.progress': 'Progress',
  'home.showMore': 'Show more',
  'home.noDaysInRoutine': 'No days in this routine yet.',
  'lang.switchToEn': 'Switch to English',
  'lang.switchToId': 'Ganti ke Bahasa Indonesia',

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
  'ex.lastSet': 'Last: {reps} reps{weight}',
  'ex.noSets': 'No sets yet.',
  'ex.collapseHint': 'Tap the arrow to log sets.',
  'ex.repeatLastSet': 'Repeat last set',
  'ex.setLabel': 'Set {n}',
  'ex.reps': 'Reps',
  'ex.repsCount': '{reps} reps',
  'ex.weightKg': 'Weight (kg)',
  'ex.plates': 'Plates',
  'ex.addSet': 'Add set',
  'ex.repsError': 'Reps must be a whole number of at least 1.',
  'ex.plateError': 'Plate count must be a whole number of at least 0.',
  'ex.weightError': 'Weight must be 0 or a positive number.',
  'ex.nameRequired': 'Exercise name is required.',
  'ex.notePlaceholder': 'Note… (seat position, form cue, dropset)',
  'ex.rename': 'Rename exercise',
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
  'addEx.recent': 'Recently used',
  'addEx.add': 'Add exercise',

  'backup.title': 'Backup',
  'backup.desc': 'Export or restore all local Gym Tracker data.',
  'backup.export': 'Export JSON',
  'backup.import': 'Import JSON',
  'backup.exported': 'Backup downloaded.',
  'backup.invalid': 'Backup file is invalid. Existing data was not changed.',
  'backup.importWarning':
    'Importing this backup will replace all current local data, including any active workout and recent sessions.',
  'backup.confirmImport': 'Confirm import',
  'backup.imported': 'Backup imported.',

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
  'routine.renameDay': 'Rename day',
  'routine.removeDay': 'Remove day',
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
  'summary.startAnother': 'Start another workout',
  'summary.back': 'Back',

  'progress.title': 'Progress',
  'progress.desc': 'Per-exercise progress from finished sessions.',
  'progress.noSessions':
    'No finished sessions yet — complete your first workout to see progress.',
  'progress.noExercises': 'No exercises logged yet.',
  'progress.backToList': 'Back to exercises',

  'about.title': 'About',
  'about.desc':
    'Gym Tracker v{version} — free, open source, all data stays on your device.',
  'about.github': 'GitHub',
  'about.support': 'Support (Saweria)',

  'feedback.send': 'Send feedback',
  'feedback.title': 'Feedback & suggestions',
  'feedback.body':
    'Anything annoying or missing? Write it here — it is saved on your device. Prefer public discussion? Open a GitHub issue.',
  'feedback.placeholder': 'Ideas, problems, or feedback…',
  'feedback.messageLabel': 'Feedback message',
  'feedback.saved': 'Thanks, noted!',
  'feedback.save': 'Save feedback',
  'feedback.openIssue': 'Open GitHub issue',
  'feedback.close': 'Close',

  'unit.kg': 'kg',
  'unit.plates': 'plates',
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

const I18nContext = createContext<I18n | null>(null)

export function I18nProvider({
  lang,
  children,
}: {
  lang: Lang
  children: ReactNode
}) {
  const value: I18n = {
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
  }
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
