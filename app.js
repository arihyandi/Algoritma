
/**
 * AlgoQuest - Core Game Logic & Interpreter
 */

// Web Audio API Synthesizer
class SoundSynth {
    constructor() {
        this.ctx = null;
        this.enabled = false;
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    toggle() {
        this.init();
        this.enabled = !this.enabled;
        // Resume context if suspended (browser security)
        if (this.enabled && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        return this.enabled;
    }

    play(freq, type, duration, slideTo = null) {
        if (!this.enabled) return;
        this.init();

        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

            if (slideTo) {
                osc.frequency.exponentialRampToValueAtTime(slideTo, this.ctx.currentTime + duration);
            }

            gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
            // Smooth fade out to prevent clicks
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch (e) {
            console.warn("Audio error:", e);
        }
    }

    playClick() {
        this.play(600, 'sine', 0.05);
    }

    playMove() {
        this.play(300, 'triangle', 0.1, 450);
    }

    playSuccess() {
        this.play(261.63, 'sine', 0.15); // C4
        setTimeout(() => this.play(329.63, 'sine', 0.15), 100); // E4
        setTimeout(() => this.play(392.00, 'sine', 0.15), 200); // G4
        setTimeout(() => this.play(523.25, 'sine', 0.3), 300); // C5
    }

    playFailure() {
        // Use two notes for a descending 'fail' sound
        this.play(220, 'sawtooth', 0.2);
        setTimeout(() => this.play(150, 'sawtooth', 0.3), 150);
    }

    playCorrect() {
        this.play(523.25, 'sine', 0.1); // C5
        setTimeout(() => this.play(659.25, 'sine', 0.2), 80); // E5
    }

    playWrong() {
        this.play(180, 'sawtooth', 0.3);
    }
}

const synth = new SoundSynth();

// Level Definitions
const LEVELS = {
    // --- TINGKAT PEMULA (Misi 1 - 5) & DASAR (Misi 6 - 10): peta 6x6 ---
    1: {
        id: 1,
        badge: "seq",
        title: "Misi 1: Langkah Pertama",
        concept: "Konsep: Sekuensial (Urutan)",
        instruction: "Susun langkah-langkah lurus dan belok untuk mengarahkan Albi ke Portal tujuan. Ingat, robot bergerak sesuai urutan kode dari atas ke bawah!",
        gridSize: 6,
        start: { x: 1, y: 4, dir: 'UP' }, // 0-indexed, bottom-left is (0,5) in a 6x6 grid
        goal: { x: 1, y: 1 },
        walls: [
            { x: 0, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }, { x: 5, y: 0 },
            { x: 0, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }, { x: 4, y: 1 }, { x: 5, y: 1 },
            { x: 0, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 }, { x: 4, y: 2 }, { x: 5, y: 2 },
            { x: 0, y: 3 }, { x: 2, y: 3 }, { x: 3, y: 3 }, { x: 4, y: 3 }, { x: 5, y: 3 },
            { x: 0, y: 4 }, { x: 2, y: 4 }, { x: 3, y: 4 }, { x: 4, y: 4 }, { x: 5, y: 4 },
            { x: 0, y: 5 }, { x: 1, y: 5 }, { x: 2, y: 5 }, { x: 3, y: 5 }, { x: 4, y: 5 }, { x: 5, y: 5 }
        ],
        // The path is (1,4) -> (1,3) -> (1,2) -> (1,1) straight line
        allowedBlocks: ['move', 'turn-left', 'turn-right'],
        maxBlocks: 5,
        debuggingSetup: null,
        insight: "Algoritma Sekuensial adalah rangkaian instruksi yang dieksekusi satu per satu dari atas ke bawah secara berurutan. Komputer tidak akan melompati langkah apa pun!"
    },
    2: {
        id: 2,
        badge: "loop",
        title: "Misi 2: Koridor Berulang",
        concept: "Konsep: Perulangan (Loops)",
        instruction: "Gunakan blok 'Ulangi' untuk membuat pola tangga (Maju, Kanan, Maju, Kiri) sebanyak 3 kali agar robot mencapai portal dengan jumlah blok minimal!",
        gridSize: 6,
        start: { x: 0, y: 5, dir: 'UP' },
        goal: { x: 3, y: 2 },
        // Simple corridor path (staircase from bottom-left to top-middle)
        walls: [
            // Row 0
            { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }, { x: 5, y: 0 }, { x: 0, y: 0 },
            // Row 1
            { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }, { x: 4, y: 1 }, { x: 5, y: 1 },
            // Row 2
            { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 4, y: 2 }, { x: 5, y: 2 },
            // Row 3
            { x: 0, y: 3 }, { x: 3, y: 3 }, { x: 4, y: 3 }, { x: 5, y: 3 },
            // Row 4
            { x: 2, y: 4 }, { x: 3, y: 4 }, { x: 4, y: 4 }, { x: 5, y: 4 },
            // Row 5
            { x: 1, y: 5 }, { x: 2, y: 5 }, { x: 3, y: 5 }, { x: 4, y: 5 }, { x: 5, y: 5 }
        ],
        // Path matches: (0,5)->(0,4)->(1,4)->(1,3)->(2,3)->(2,2)->(3,2)
        allowedBlocks: ['move', 'turn-left', 'turn-right', 'loop'],
        maxBlocks: 5, // Requires using the loop block
        debuggingSetup: null,
        insight: "Perulangan (Loop) mempermudah kita menjalankan perintah yang sama berkali-kali tanpa menulisnya berulang-ulang. Ini membuat kode kita lebih rapi dan hemat memori!"
    },
    3: {
        id: 3,
        badge: "cond",
        title: "Misi 3: Sensor Warna",
        concept: "Konsep: Kondisional (Percabangan)",
        instruction: "Gunakan sensor warna! Letakkan blok gerakan dan blok 'Jika Ubin Kuning/Ungu' di dalam perulangan 8 Kali agar robot otomatis berbelok saat menginjak ubin sensor.",
        gridSize: 6,
        start: { x: 0, y: 5, dir: 'UP' },
        goal: { x: 3, y: 0 },
        // Colored sensor tiles
        yellowTiles: [{ x: 0, y: 2 }], // Yellow turns RIGHT
        purpleTiles: [{ x: 3, y: 2 }], // Purple turns LEFT
        // Path: (0,5)->(0,4)->(0,3)->(0,2)[Yellow]->(1,2)->(2,2)->(3,2)[Purple]->(3,1)->(3,0)[Goal]
        walls: [
            { x: 1, y: 5 }, { x: 2, y: 5 }, { x: 3, y: 5 }, { x: 4, y: 5 }, { x: 5, y: 5 },
            { x: 1, y: 4 }, { x: 2, y: 4 }, { x: 3, y: 4 }, { x: 4, y: 4 }, { x: 5, y: 4 },
            { x: 1, y: 3 }, { x: 2, y: 3 }, { x: 3, y: 3 }, { x: 4, y: 3 }, { x: 5, y: 3 },
            { x: 4, y: 2 }, { x: 5, y: 2 },
            { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 4, y: 1 }, { x: 5, y: 1 },
            { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 4, y: 0 }, { x: 5, y: 0 }
        ],
        allowedBlocks: ['move', 'loop', 'if-yellow', 'if-purple'],
        maxBlocks: 4,
        debuggingSetup: null,
        insight: "Kondisional (If-Else) memungkinkan program mengambil keputusan cerdas. Komputer akan mengecek apakah suatu kondisi terpenuhi (Benar/True) sebelum menjalankan perintah khusus."
    },
    4: {
        id: 4,
        badge: "debug",
        title: "Misi 4: Membetulkan Kode",
        concept: "Konsep: Debugging (Menemukan Bug)",
        instruction: "Seseorang menulis program yang rusak! Albi menabrak dinding jika dijalankan. Cari kesalahan bloknya, hapus/atur ulang, dan buatlah program yang benar.",
        gridSize: 6,
        start: { x: 1, y: 4, dir: 'UP' },
        goal: { x: 4, y: 1 },
        // Path: (1,4)->(1,3)->(1,2)->[Turn Right]->(2,2)->(3,2)->(4,2)->[Turn Left]->(4,1)
        walls: [
            { x: 0, y: 5 }, { x: 2, y: 5 }, { x: 3, y: 5 }, { x: 4, y: 5 }, { x: 5, y: 5 }, { x: 1, y: 5 },
            { x: 0, y: 4 }, { x: 2, y: 4 }, { x: 3, y: 4 }, { x: 4, y: 4 }, { x: 5, y: 4 },
            { x: 0, y: 3 }, { x: 2, y: 3 }, { x: 3, y: 3 }, { x: 4, y: 3 }, { x: 5, y: 3 },
            { x: 0, y: 2 }, { x: 5, y: 2 },
            { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }, { x: 5, y: 1 },
            { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }, { x: 5, y: 0 }
        ],
        allowedBlocks: ['move', 'turn-left', 'turn-right'],
        maxBlocks: 8,
        // Buggy program preset
        debuggingSetup: [
            { type: 'move' },
            { type: 'turn-left' }, // BUG! Should be: move, then turn-right later
            { type: 'move' },
            { type: 'move' },
            { type: 'turn-right' },
            { type: 'move' },
            { type: 'move' }
        ],
        insight: "Debugging adalah keahlian penting programmer untuk menganalisis dan memperbaiki kesalahan (bug) secara mandiri. Jangan menyerah jika gagal; pelajari titik kegagalannya!"
    },
    5: {
        id: 5,
        badge: "loop",
        title: "Misi 5: Tangga Panjang",
        concept: "Konsep: Perulangan Lanjutan",
        instruction: "Robot harus menaiki tangga panjang melewati 5 anak tangga! Gunakan blok 'Ulangi 5 Kali' dan susun pola gerak dalam loop: Maju, Kanan, Maju, Kiri.",
        gridSize: 6,
        start: { x: 0, y: 5, dir: 'UP' },
        goal: { x: 5, y: 0 },
        // Path staircase: (0,5)->(0,4)->(1,4)->(1,3)->(2,3)->(2,2)->(3,2)->(3,1)->(4,1)->(4,0)->(5,0)
        walls: [
            { x: 1, y: 5 }, { x: 2, y: 5 }, { x: 3, y: 5 }, { x: 4, y: 5 }, { x: 5, y: 5 },
            { x: 2, y: 4 }, { x: 3, y: 4 }, { x: 4, y: 4 }, { x: 5, y: 4 },
            { x: 0, y: 3 }, { x: 3, y: 3 }, { x: 4, y: 3 }, { x: 5, y: 3 },
            { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 4, y: 2 }, { x: 5, y: 2 },
            { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 5, y: 1 },
            { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }
        ],
        allowedBlocks: ['move', 'turn-left', 'turn-right', 'loop'],
        maxBlocks: 6,
        debuggingSetup: null,
        insight: "Perulangan bersarang dan pola berulang memungkinkan kita menulis kode yang sangat efisien! Dengan 1 blok loop dan 4 perintah di dalamnya, kita bisa membuat 10 langkah sekaligus."
    },
    6: {
        id: 6,
        badge: "cond",
        title: "Misi 6: Sensor Ganda",
        concept: "Konsep: Kondisional Majemuk",
        instruction: "Terdapat 2 sensor warna di lintasan! Gunakan blok 'Ulangi 7 Kali' dengan pola: Maju, Jika Ubin Kuning, Jika Ubin Ungu. Sensor akan otomatis membelokkan robot!",
        gridSize: 6,
        start: { x: 0, y: 5, dir: 'UP' },
        goal: { x: 2, y: 0 },
        // Path: (0,5)->(0,4)->(0,3)[Yellow->RIGHT]->(1,3)->(2,3)[Purple->UP]->(2,2)->(2,1)->(2,0)[GOAL]
        // Solution: Loop 7x { Move, if-yellow, if-purple }
        yellowTiles: [{ x: 0, y: 3 }],
        purpleTiles: [{ x: 2, y: 3 }],
        walls: [
            { x: 1, y: 5 }, { x: 2, y: 5 }, { x: 3, y: 5 }, { x: 4, y: 5 }, { x: 5, y: 5 },
            { x: 1, y: 4 }, { x: 2, y: 4 }, { x: 3, y: 4 }, { x: 4, y: 4 }, { x: 5, y: 4 },
            { x: 3, y: 3 }, { x: 4, y: 3 }, { x: 5, y: 3 },
            { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 3, y: 2 }, { x: 4, y: 2 }, { x: 5, y: 2 },
            { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 3, y: 1 }, { x: 4, y: 1 }, { x: 5, y: 1 },
            { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }, { x: 5, y: 0 }
        ],
        allowedBlocks: ['move', 'loop', 'if-yellow', 'if-purple'],
        maxBlocks: 5,
        debuggingSetup: null,
        insight: "Kondisional majemuk memungkinkan program mengambil banyak keputusan cerdas sekaligus! Robot bisa bereaksi berbeda terhadap berbagai jenis kondisi yang ia temui."
    },
    7: {
        id: 7,
        badge: "loop",
        title: "Misi 7: Kode Hybrid",
        concept: "Konsep: Sekuensial + Perulangan",
        instruction: "Gabungkan sekuensial dan perulangan! Susun 2 blok 'Maju' lalu 'Belok Kanan', kemudian gunakan blok 'Ulangi 3 Kali' berisi 'Maju', lalu letakkan 'Belok Kiri' dan 2 'Maju' lagi di luar perulangan.",
        gridSize: 6,
        start: { x: 2, y: 5, dir: 'UP' },
        goal: { x: 5, y: 1 },
        // Path: (2,5)->(2,4)->(2,3)->[TurnRight]->(3,3)->(4,3)->(5,3)->[TurnLeft]->(5,2)->(5,1)
        // Solution: Move, Move, TurnR, Loop(3x){Move}, TurnL, Move, Move = 8 blocks total
        walls: [
            { x: 0, y: 5 }, { x: 1, y: 5 }, { x: 3, y: 5 }, { x: 4, y: 5 }, { x: 5, y: 5 },
            { x: 0, y: 4 }, { x: 1, y: 4 }, { x: 3, y: 4 }, { x: 4, y: 4 }, { x: 5, y: 4 },
            { x: 0, y: 3 }, { x: 1, y: 3 },
            { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 }, { x: 4, y: 2 },
            { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }, { x: 4, y: 1 },
            { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }, { x: 5, y: 0 }
        ],
        allowedBlocks: ['move', 'turn-left', 'turn-right', 'loop'],
        maxBlocks: 8,
        debuggingSetup: null,
        insight: "Pemrograman nyata sering menggabungkan berbagai teknik! Sekuensial untuk bagian yang unik, dan perulangan untuk pola yang berulang. Inilah yang disebut 'kode hybrid'."
    },
    8: {
        id: 8,
        badge: "seq",
        title: "Misi 8: Labirin Sempit",
        concept: "Konsep: Navigasi Presisi",
        instruction: "Labirin berliku! Susun instruksi berbelok dan maju yang presisi. Jalur: Maju 2x, Kanan, Maju 2x, Kiri, Maju 2x, Kanan, Maju 2x. Jangan sampai menabrak dinding!",
        gridSize: 6,
        start: { x: 0, y: 5, dir: 'UP' },
        goal: { x: 4, y: 1 },
        // Path: (0,5)->(0,4)->(0,3)->[R]->(1,3)->(2,3)->[L]->(2,2)->(2,1)->[R]->(3,1)->(4,1)[GOAL]
        // Solution: Move,Move,TurnR,Move,Move,TurnL,Move,Move,TurnR,Move,Move = 11 blocks
        walls: [
            { x: 1, y: 5 }, { x: 2, y: 5 }, { x: 3, y: 5 }, { x: 4, y: 5 }, { x: 5, y: 5 },
            { x: 1, y: 4 }, { x: 2, y: 4 }, { x: 3, y: 4 }, { x: 4, y: 4 }, { x: 5, y: 4 },
            { x: 3, y: 3 }, { x: 4, y: 3 }, { x: 5, y: 3 },
            { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 3, y: 2 }, { x: 4, y: 2 }, { x: 5, y: 2 },
            { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 5, y: 1 },
            { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }, { x: 5, y: 0 }
        ],
        allowedBlocks: ['move', 'turn-left', 'turn-right'],
        maxBlocks: 11,
        debuggingSetup: null,
        insight: "Navigasi presisi adalah keterampilan penting dalam pemrograman robot nyata! Setiap instruksi harus diperiksa dengan cermat agar robot tidak melenceng dari jalurnya."
    },
    9: {
        id: 9,
        badge: "debug",
        title: "Misi 9: Loop yang Rusak",
        concept: "Konsep: Debugging Perulangan",
        instruction: "Ada loop yang rusak! Program berisi loop yang salah konfigurasi. Periksa dan perbaiki: ubah jumlah pengulangan dan ganti urutan blok di dalamnya agar Albi mencapai portal.",
        gridSize: 6,
        start: { x: 0, y: 5, dir: 'UP' },
        goal: { x: 4, y: 1 },
        // Correct path: Loop 4x { Maju, Kanan, Maju, Kiri } gives staircase to (4,1)
        walls: [
            { x: 1, y: 5 }, { x: 2, y: 5 }, { x: 3, y: 5 }, { x: 4, y: 5 }, { x: 5, y: 5 },
            { x: 2, y: 4 }, { x: 3, y: 4 }, { x: 4, y: 4 }, { x: 5, y: 4 },
            { x: 0, y: 3 }, { x: 3, y: 3 }, { x: 4, y: 3 }, { x: 5, y: 3 },
            { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 4, y: 2 }, { x: 5, y: 2 },
            { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 5, y: 1 },
            { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }, { x: 5, y: 0 }
        ],
        allowedBlocks: ['move', 'turn-left', 'turn-right', 'loop'],
        maxBlocks: 6,
        debuggingSetup: [
            { type: 'loop', loopCount: 5, children: [
                { type: 'move' },
                { type: 'turn-left' },
                { type: 'move' },
                { type: 'turn-right' }
            ]}
        ],
        insight: "Bug di dalam perulangan sangat umum! Memilih jumlah iterasi yang salah atau urutan perintah yang terbalik adalah kesalahan klasik yang harus dideteksi dengan teliti."
    },
    10: {
        id: 10,
        badge: "cond",
        title: "Misi 10: Tantangan Master",
        concept: "Konsep: Logika Algoritma Master",
        instruction: "Tantangan terakhir sebelum kuis! Sensor warna membantu Albi berbelok otomatis, tetapi tikungan terakhir dekat portal TIDAK memiliki sensor. Gabungkan Loop + Kondisional untuk bagian bersensor, lalu tambahkan langkah Sekuensial manual di akhir!",
        gridSize: 6,
        start: { x: 0, y: 5, dir: 'UP' },
        goal: { x: 5, y: 0 },
        // Path with sensors: (0,5)->(0,4)->(0,3)[Yellow->Right]->(1,3)[Purple->Left]->(1,2)->(1,1)[Yellow->Right]->(2,1)->(3,1)[Purple->Left]->(3,0)
        // (3,0) sengaja tanpa sensor: siswa harus menambahkan Belok Kanan + Maju manual setelah loop.
        // Contoh solusi (7 blok): Ulangi 8x [Maju, Jika Kuning, Jika Ungu], Belok Kanan, Maju, Maju
        yellowTiles: [{ x: 0, y: 3 }, { x: 1, y: 1 }],
        purpleTiles: [{ x: 1, y: 3 }, { x: 3, y: 1 }],
        walls: [
            { x: 1, y: 5 }, { x: 2, y: 5 }, { x: 3, y: 5 }, { x: 4, y: 5 }, { x: 5, y: 5 },
            { x: 1, y: 4 }, { x: 2, y: 4 }, { x: 3, y: 4 }, { x: 4, y: 4 }, { x: 5, y: 4 },
            { x: 2, y: 3 }, { x: 3, y: 3 }, { x: 4, y: 3 }, { x: 5, y: 3 },
            { x: 0, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 }, { x: 4, y: 2 }, { x: 5, y: 2 },
            { x: 0, y: 1 }, { x: 4, y: 1 }, { x: 5, y: 1 },
            { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }
        ],
        allowedBlocks: ['move', 'turn-left', 'turn-right', 'loop', 'if-yellow', 'if-purple'],
        maxBlocks: 8,
        debuggingSetup: null,
        insight: "Seorang master programmer sejati mampu menggabungkan semua teknik algoritma: urutan, pengulangan, kondisional, dan debugging. Selamat, kamu telah menguasai dasar-dasar algoritmika!"
    },
    // --- TINGKAT MENENGAH (Misi 11 - 15): peta 7x7 ---
    11: {
        id: 11,
        badge: "seq",
        title: "Misi 11: Jalur Zig-Zag",
        concept: "Konsep: Sekuensial Lanjutan",
        instruction: "Tingkat Menengah dimulai! Peta kini lebih luas (7x7). Susun urutan langkah dan belokan dengan teliti untuk melewati jalur zig-zag panjang. Satu langkah salah saja, Albi akan menabrak!",
        startDir: 'UP',
        map: [
            "#####G#",
            "#####.#",
            "###...#",
            "###.###",
            "....###",
            ".######",
            "S######"
        ],
        allowedBlocks: ['move', 'turn-left', 'turn-right'],
        maxBlocks: 15,
        debuggingSetup: null,
        insight: "Semakin panjang program, semakin penting ketelitian menyusun urutan. Programmer profesional selalu menelusuri (trace) kodenya langkah demi langkah sebelum menjalankannya."
    },
    12: {
        id: 12,
        badge: "loop",
        title: "Misi 12: Keliling Laboratorium",
        concept: "Konsep: Perulangan Pola",
        instruction: "Albi harus berkeliling tiga sisi laboratorium. Perhatikan: setiap sisi terdiri dari 4 langkah lalu belok kanan. Temukan pola yang berulang dan bungkus dengan blok Ulangi!",
        startDir: 'UP',
        map: [
            "#######",
            "#.....#",
            "#.###.#",
            "#.###.#",
            "#.###.#",
            "#S###G#",
            "#######"
        ],
        allowedBlocks: ['move', 'turn-left', 'turn-right', 'loop'],
        maxBlocks: 6,
        debuggingSetup: null,
        insight: "Kunci perulangan adalah menemukan POLA: bagian instruksi yang sama persis dan terjadi berkali-kali. Setelah polanya ditemukan, cukup tulis sekali dan ulangi."
    },
    13: {
        id: 13,
        badge: "cond",
        title: "Misi 13: Tangga Sensor",
        concept: "Konsep: Kondisional Berulang",
        instruction: "Jalur berliku dipenuhi ubin sensor. Tanpa blok belok sama sekali, buat Albi berbelok otomatis: gabungkan Maju dan kedua blok Jika di dalam satu perulangan!",
        startDir: 'UP',
        map: [
            "####G##",
            "####.##",
            "##Y.P##",
            "##.####",
            "Y.P####",
            ".######",
            "S######"
        ],
        allowedBlocks: ['move', 'loop', 'if-yellow', 'if-purple'],
        maxBlocks: 4,
        debuggingSetup: null,
        insight: "Kondisional di dalam perulangan membuat program bisa beradaptasi: perintah yang sama diulang, tetapi tindakan robot berubah sesuai kondisi ubin yang sedang diinjak."
    },
    14: {
        id: 14,
        badge: "debug",
        title: "Misi 14: Langkah yang Hilang",
        concept: "Konsep: Debugging",
        instruction: "Program Albi sudah hampir benar, tetapi ia menabrak dinding! Jalankan dulu programnya, amati di mana Albi gagal, lalu temukan langkah yang terlewat di dalam perulangan.",
        startDir: 'UP',
        map: [
            "###...G",
            "###.###",
            "###.###",
            "....###",
            ".######",
            ".######",
            "S..####"
        ],
        allowedBlocks: ['move', 'turn-left', 'turn-right', 'loop'],
        maxBlocks: 9,
        debuggingSetup: [
            { type: 'loop', loopCount: 2, children: [{ type: 'move' }, { type: 'move' }, { type: 'move' }, { type: 'turn-right' }, { type: 'move' }, { type: 'move' }, { type: 'turn-left' }] }
        ],
        insight: "Bug yang paling sering terjadi adalah langkah yang terlewat atau berlebih satu (off-by-one). Menjalankan program lalu mengamati titik gagalnya adalah cara tercepat menemukan bug."
    },
    15: {
        id: 15,
        badge: "loop",
        title: "Misi 15: Tangga dan Lorong",
        concept: "Konsep: Perulangan + Sekuensial",
        instruction: "Rute ini terdiri dari dua bagian: tangga yang berulang, lalu lorong lurus menuju portal. Gunakan perulangan untuk bagian yang berpola dan perintah biasa untuk sisanya!",
        startDir: 'UP',
        map: [
            "#######",
            "###...G",
            "###.###",
            "##..###",
            "#..####",
            "..#####",
            "S.#####"
        ],
        allowedBlocks: ['move', 'turn-left', 'turn-right', 'loop'],
        maxBlocks: 10,
        debuggingSetup: null,
        insight: "Program nyata jarang hanya berisi satu jenis struktur. Programmer memecah masalah menjadi beberapa bagian (dekomposisi), lalu memilih struktur terbaik untuk tiap bagian."
    },
    // --- TINGKAT MAHIR (Misi 16 - 20): peta 7x7, perulangan bersarang ---
    16: {
        id: 16,
        badge: "loop",
        title: "Misi 16: Loop di Dalam Loop",
        concept: "Konsep: Perulangan Bersarang",
        instruction: "Tingkat Mahir! Albi harus maju 5 langkah, belok kanan, lalu maju 5 langkah lagi, hanya dengan 4 blok. Rahasianya: letakkan blok Ulangi DI DALAM blok Ulangi lain! Ketuk loop luar untuk memilihnya, lalu tambahkan loop kedua ke dalamnya.",
        startDir: 'UP',
        map: [
            ".######",
            ".....G#",
            ".#.####",
            ".#.####",
            ".#.####",
            ".######",
            "S######"
        ],
        allowedBlocks: ['move', 'turn-left', 'turn-right', 'loop'],
        maxBlocks: 4,
        debuggingSetup: null,
        insight: "Perulangan bersarang (nested loop) berarti loop di dalam loop. Loop dalam berjalan penuh setiap kali loop luar berputar satu kali, sehingga program menjadi sangat ringkas."
    },
    17: {
        id: 17,
        badge: "cond",
        title: "Misi 17: Sensor yang Rusak",
        concept: "Konsep: Kondisional + Sekuensial",
        instruction: "Dua ubin sensor masih berfungsi, tetapi sensor di tikungan terakhir rusak! Biarkan sensor memandu Albi di awal rute, lalu ambil alih kemudi secara manual setelah perulangan selesai.",
        startDir: 'UP',
        map: [
            "###...G",
            ".##.###",
            ".##.###",
            "Y..P..#",
            ".######",
            ".######",
            "S######"
        ],
        allowedBlocks: ['move', 'turn-left', 'turn-right', 'loop', 'if-yellow', 'if-purple'],
        maxBlocks: 7,
        debuggingSetup: null,
        insight: "Program yang baik tidak bergantung pada satu cara saja. Ketika otomatisasi (sensor) tidak tersedia, kita menambahkan instruksi manual yang tepat setelahnya."
    },
    18: {
        id: 18,
        badge: "debug",
        title: "Misi 18: Bug Bersarang",
        concept: "Konsep: Debugging Perulangan Bersarang",
        instruction: "Program loop bersarang ini memiliki DUA bug: jumlah ulangan yang keliru dan arah belokan yang salah. Albi harus berkeliling tiga sisi laboratorium. Perbaiki kedua bug tersebut!",
        startDir: 'UP',
        map: [
            ".######",
            ".......",
            ".##.#.#",
            ".##.#.#",
            ".####.#",
            ".####.#",
            "S####G#"
        ],
        allowedBlocks: ['move', 'turn-left', 'turn-right', 'loop'],
        maxBlocks: 4,
        debuggingSetup: [
            { type: 'loop', loopCount: 3, children: [{ type: 'loop', loopCount: 4, children: [{ type: 'move' }] }, { type: 'turn-left' }] }
        ],
        insight: "Satu program bisa memiliki lebih dari satu bug. Perbaiki satu per satu, jalankan ulang setiap selesai memperbaiki, dan amati apakah robot bergerak lebih jauh dari sebelumnya."
    },
    19: {
        id: 19,
        badge: "loop",
        title: "Misi 19: Tangga Raksasa",
        concept: "Konsep: Efisiensi Perulangan",
        instruction: "Tangga ini memiliki anak tangga selebar 2 langkah. Ada lorong buntu yang menjebak! Temukan pola satu anak tangga, lalu ulangi secukupnya untuk mencapai portal dalam 7 blok.",
        startDir: 'UP',
        map: [
            "####..G",
            "####.##",
            "#.....#",
            ".#.####",
            "....###",
            ".######",
            "S######"
        ],
        allowedBlocks: ['move', 'turn-left', 'turn-right', 'loop'],
        maxBlocks: 7,
        debuggingSetup: null,
        insight: "Satu putaran loop boleh berisi banyak perintah. Yang penting, isi loop menggambarkan satu pola lengkap yang kemudian berulang dengan sama persis."
    },
    20: {
        id: 20,
        badge: "cond",
        title: "Misi 20: Ular Sensor Panjang",
        concept: "Konsep: Kondisional + Perulangan Bersarang",
        instruction: "Rute sensor ini membutuhkan 12 langkah, lebih dari batas pilihan satu blok Ulangi! Gunakan perulangan bersarang agar pola Maju-Jika Kuning-Jika Ungu diulang cukup banyak dengan hanya 5 blok.",
        startDir: 'UP',
        map: [
            "######G",
            "###.##.",
            "###Y..P",
            ".##.###",
            "Y..P..#",
            ".######",
            "S######"
        ],
        allowedBlocks: ['move', 'loop', 'if-yellow', 'if-purple'],
        maxBlocks: 5,
        debuggingSetup: null,
        insight: "Loop bersarang mengalikan jumlah pengulangan: Ulangi 2x berisi Ulangi 6x menjalankan isinya 2 x 6 = 12 kali. Ini cara cerdas mengatasi batasan."
    },
    // --- TINGKAT MASTER (Misi 21 - 25): peta 8x8 dengan lorong buntu ---
    21: {
        id: 21,
        badge: "loop",
        title: "Misi 21: Labirin Master",
        concept: "Konsep: Perulangan Bersarang Lanjutan",
        instruction: "Tingkat Master! Peta 8x8 penuh lorong buntu. Rute Albi berbentuk tangga besar dengan anak tangga 3 langkah. Gunakan perulangan bersarang untuk menyelesaikannya dalam 7 blok saja!",
        startDir: 'UP',
        map: [
            "###.####",
            "###...G.",
            "###.####",
            ".##.####",
            "......##",
            ".#######",
            ".#######",
            "S..#####"
        ],
        allowedBlocks: ['move', 'turn-left', 'turn-right', 'loop'],
        maxBlocks: 7,
        debuggingSetup: null,
        insight: "Loop bersarang tidak hanya untuk satu perintah. Di dalam loop luar bisa terdapat beberapa loop dalam sekaligus, masing-masing menangani bagian pola yang berbeda."
    },
    22: {
        id: 22,
        badge: "cond",
        title: "Misi 22: Cermin Sensor",
        concept: "Konsep: Kondisional Master",
        instruction: "Kali ini Albi mulai dari pojok KANAN bawah dan harus bergerak ke kiri atas. Ubin ungu dan kuning akan memandunya. Gunakan perulangan bersarang dan sensor untuk mencapai portal dalam 5 blok!",
        startDir: 'UP',
        map: [
            "#G######",
            ".Y.P####",
            "###.#.##",
            "#..Y.P##",
            "#####.#.",
            "###..Y.P",
            "#######.",
            "#######S"
        ],
        allowedBlocks: ['move', 'turn-left', 'turn-right', 'loop', 'if-yellow', 'if-purple'],
        maxBlocks: 5,
        debuggingSetup: null,
        insight: "Program yang sama (Maju, Jika Kuning, Jika Ungu) bisa menyelesaikan rute yang sangat berbeda. Inilah kekuatan algoritma umum: logikanya tetap, datanya yang berubah."
    },
    23: {
        id: 23,
        badge: "debug",
        title: "Misi 23: Detektif Kode",
        concept: "Konsep: Debugging Master",
        instruction: "Program ini ditulis terburu-buru: jumlah ulangan dan arah kedua belokannya keliru. Telusuri rute Albi, bandingkan dengan program, dan perbaiki semua bug-nya!",
        startDir: 'UP',
        map: [
            "###G####",
            "##...###",
            "#..#####",
            "#...####",
            "..######",
            "....####",
            ".#######",
            "S#######"
        ],
        allowedBlocks: ['move', 'turn-left', 'turn-right', 'loop'],
        maxBlocks: 7,
        debuggingSetup: [
            { type: 'loop', loopCount: 2, children: [{ type: 'loop', loopCount: 2, children: [{ type: 'move' }] }, { type: 'turn-left' }, { type: 'move' }, { type: 'turn-right' }] },
            { type: 'move' }
        ],
        insight: "Detektif kode bekerja dengan membandingkan apa yang SEHARUSNYA terjadi dengan apa yang BENAR-BENAR terjadi. Selisih keduanya menunjukkan letak bug."
    },
    24: {
        id: 24,
        badge: "cond",
        title: "Misi 24: Gabungan Sempurna",
        concept: "Konsep: Kondisional + Perulangan + Sekuensial",
        instruction: "Sensor memandu Albi melewati bagian pertama rute, tetapi lorong panjang menuju portal tidak memiliki sensor. Gabungkan perulangan bersensor, belokan manual, dan perulangan kedua untuk lorong panjang!",
        startDir: 'UP',
        map: [
            "###.####",
            "##.....G",
            ".##.####",
            ".##.####",
            "Y..P..##",
            ".#######",
            ".#######",
            "S#######"
        ],
        allowedBlocks: ['move', 'turn-left', 'turn-right', 'loop', 'if-yellow', 'if-purple'],
        maxBlocks: 7,
        debuggingSetup: null,
        insight: "Menggabungkan beberapa struktur kontrol secara berurutan adalah inti pemrograman: setiap bagian program menyelesaikan satu sub-masalah, lalu menyerahkan hasilnya ke bagian berikutnya."
    },
    25: {
        id: 25,
        badge: "cond",
        title: "Misi 25: Ujian Akhir Albi",
        concept: "Konsep: Algoritma Master Lengkap",
        instruction: "Misi terakhir! Bagian pertama dipandu sensor, sedangkan bagian kedua berupa pola 'belok kanan lalu maju 3 langkah' yang terjadi dua kali. Gunakan SEMUA kemampuanmu untuk mencapai portal dalam 8 blok!",
        startDir: 'UP',
        map: [
            "####.###",
            "####....",
            "##.#.#..",
            "##Y.P...",
            ".#.####G",
            "Y.P.###.",
            ".#######",
            "S#######"
        ],
        allowedBlocks: ['move', 'turn-left', 'turn-right', 'loop', 'if-yellow', 'if-purple'],
        maxBlocks: 8,
        debuggingSetup: null,
        insight: "Selamat! Kamu telah menguasai sekuensial, perulangan, perulangan bersarang, kondisional, dan debugging. Inilah fondasi yang dipakai di semua bahasa pemrograman di dunia."
    }
};

// Level 11-25 ditulis sebagai peta teks agar mudah dibaca dan diubah guru.
// Simbol peta: # dinding, . lantai, S posisi awal Albi, G portal, Y sensor kuning, P sensor ungu
function buildLevelFromMap(lvl) {
    lvl.gridSize = lvl.map.length;
    lvl.walls = [];
    lvl.yellowTiles = [];
    lvl.purpleTiles = [];
    lvl.map.forEach((row, y) => {
        row.split('').forEach((cell, x) => {
            if (cell === '#') lvl.walls.push({ x, y });
            if (cell === 'S') lvl.start = { x, y, dir: lvl.startDir || 'UP' };
            if (cell === 'G') lvl.goal = { x, y };
            if (cell === 'Y') lvl.yellowTiles.push({ x, y });
            if (cell === 'P') lvl.purpleTiles.push({ x, y });
        });
    });
}
Object.values(LEVELS).forEach(lvl => {
    if (lvl.map) buildLevelFromMap(lvl);
});

const TOTAL_MAZE_LEVELS = Object.keys(LEVELS).length;

// Tingkat kesulitan: setiap 5 level (berlaku untuk Mode Maze dan Puzzle)
const LEVEL_TIERS = [
    { name: 'Pemula', icon: '🌱' },
    { name: 'Dasar', icon: '📘' },
    { name: 'Menengah', icon: '⚙️' },
    { name: 'Mahir', icon: '🚀' },
    { name: 'Master', icon: '👑' }
];

function getLevelTier(levelId, tierSize = 5) {
    return LEVEL_TIERS[Math.min(Math.ceil(levelId / tierSize), LEVEL_TIERS.length) - 1];
}

// Mode Pola memiliki 50 soal: setiap tingkat berisi 10 soal
const PATTERN_TIER_SIZE = 10;

// Quiz Questions
const QUIZ_QUESTIONS = [
    {
        question: "Apa definisi paling tepat dari istilah 'Algoritma'?",
        options: [
            "Langkah-langkah logis dan terstruktur untuk menyelesaikan suatu masalah.",
            "Alat keras komputer untuk memproses gambar dan audio secara fisik.",
            "Aplikasi pengeditan foto yang biasa diunduh di handphone.",
            "Layar komputer berteknologi canggih anti-radiasi."
        ],
        correct: 0
    },
    {
        question: "Jika kita ingin mengulangi perintah 'Maju' sebanyak 5 kali, manakah cara yang paling hemat dan efisien?",
        options: [
            "Menumpuk 5 blok 'Maju 1 Langkah' secara manual berturut-turut.",
            "Menulis kode program baru dari awal di komputer terpisah.",
            "Menggunakan 1 blok Perulangan (Loop) diatur ke angka 5 untuk membungkus blok 'Maju'.",
            "Mengarahkan robot berjalan mundur sejauh 5 langkah."
        ],
        correct: 2
    },
    {
        question: "Di kehidupan nyata, manakah aktivitas berikut yang mencontohkan konsep 'Kondisional (Percabangan/If-Else)'?",
        options: [
            "Membaca buku komik dari bab pertama sampai halaman terakhir selesai.",
            "Memakai payung JIKA di luar sedang turun hujan, JIKA TIDAK maka tidak memakai.",
            "Menyetel alarm handphone untuk berbunyi tepat pukul 06.00 setiap pagi.",
            "Berlari mengelilingi lapangan sekolah sebanyak tepat 3 kali putaran."
        ],
        correct: 1
    },
    {
        question: "Apa yang dilakukan seorang programmer saat melakukan proses 'Debugging'?",
        options: [
            "Menghapus seluruh file sistem operasi komputer agar bersih.",
            "Membeli komponen robot baru yang lebih mahal dan cepat.",
            "Mengunduh game online terbaru untuk melepas penat kerja.",
            "Menganalisis, menemukan, dan membetulkan baris kode yang salah agar program berjalan lancar."
        ],
        correct: 3
    },
    {
        question: "Mengapa komputer membutuhkan instruksi yang berurutan (Sequencing) secara jelas?",
        options: [
            "Karena komputer membaca dan mengeksekusi instruksi satu per satu sesuai urutan yang kita berikan.",
            "Agar tampilan antarmuka aplikasi menjadi bersinar warna-warni.",
            "Agar file program menjadi sangat besar dan berat saat disimpan.",
            "Karena komputer hanya bisa memahami perintah jika disusun secara acak."
        ],
        correct: 0
    }
];

// Puzzle Levels Definitions
const PUZZLE_LEVELS = {
    // --- TINGKAT PEMULA (Teka-Teki 1 - 5) & DASAR (Teka-Teki 6 - 10) ---
    1: {
        id: 1,
        badge: "seq",
        title: "Teka-Teki 1: Urutan Pagi Hari",
        concept: "Konsep: Sekuensial",
        instruction: "Urutkan aktivitas pagi hari dari bangun tidur hingga pergi ke sekolah agar membentuk algoritma harian yang logis!",
        blocks: [
            { id: "p1-1", text: "Bangun Tidur", correctOrder: 0 },
            { id: "p1-2", text: "Mandi Pagi", correctOrder: 1 },
            { id: "p1-3", text: "Sarapan Pagi", correctOrder: 2 },
            { id: "p1-4", text: "Pergi ke Sekolah", correctOrder: 3 }
        ],
        // Mandi dan sarapan boleh ditukar urutannya
        altOrders: [["p1-1", "p1-3", "p1-2", "p1-4"]]
    },
    2: {
        id: 2,
        badge: "seq",
        title: "Teka-Teki 2: Membuat Teh Hangat",
        concept: "Konsep: Algoritma Sekuensial",
        instruction: "Urutkan langkah-langkah membuat secangkir teh hangat manis secara tepat!",
        blocks: [
            { id: "p2-1", text: "Masukkan Kantong Teh & Gula ke Gelas", correctOrder: 0 },
            { id: "p2-2", text: "Tuangkan Air Panas Secukupnya", correctOrder: 1 },
            { id: "p2-3", text: "Aduk Air Hingga Gula Larut", correctOrder: 2 },
            { id: "p2-4", text: "Secangkir Teh Hangat Siap Dinikmati", correctOrder: 3 }
        ],
        // Air panas boleh dituang lebih dulu sebelum teh & gula dimasukkan
        altOrders: [["p2-2", "p2-1", "p2-3", "p2-4"]]
    },
    3: {
        id: 3,
        badge: "cond",
        title: "Teka-Teki 3: Menyeberang Jalan",
        concept: "Konsep: Kondisional (If-Else)",
        instruction: "Bantu Albi mengambil keputusan aman untuk menyeberang jalan berdasarkan warna lampu lalu lintas!",
        blocks: [
            { id: "p3-1", text: "Cek Warna Lampu Lalu Lintas", correctOrder: 0 },
            { id: "p3-2", text: "JIKA Lampu Merah untuk Kendaraan:", correctOrder: 1 },
            { id: "p3-3", text: "  Mulai Menyeberang dengan Aman", correctOrder: 2 },
            { id: "p3-4", text: "SEBALIKNYA (Jika Lampu Hijau):", correctOrder: 3 },
            { id: "p3-5", text: "  Berdiri di Trotoar dan Menunggu", correctOrder: 4 }
        ]
    },
    4: {
        id: 4,
        badge: "loop",
        title: "Teka-Teki 4: Mengambil Sampah Berulang",
        concept: "Konsep: Perulangan (Loop)",
        instruction: "Susun perintah loop untuk mengambil 3 buah botol plastik di lantai secara otomatis!",
        blocks: [
            { id: "p4-1", text: "Ulangi 3 Kali:", correctOrder: 0 },
            { id: "p4-2", text: "  Maju 1 Langkah", correctOrder: 1 },
            { id: "p4-3", text: "  Pungut Botol Plastik", correctOrder: 2 },
            { id: "p4-4", text: "Tumpukan Sampah Bersih!", correctOrder: 3 }
        ]
    },
    5: {
        id: 5,
        badge: "debug",
        title: "Teka-Teki 5: Logika Terbesar (Master)",
        concept: "Konsep: Logika Kompleks",
        instruction: "Urutkan jalannya algoritma untuk membandingkan dua angka A dan B, lalu mencetak nilai yang paling besar!",
        blocks: [
            { id: "p5-1", text: "Mulai Program", correctOrder: 0 },
            { id: "p5-2", text: "Baca Nilai A dan Nilai B", correctOrder: 1 },
            { id: "p5-3", text: "JIKA Nilai A lebih besar dari B:", correctOrder: 2 },
            { id: "p5-4", text: "  Tampilkan Nilai A ke Layar", correctOrder: 3 },
            { id: "p5-5", text: "SEBALIKNYA:", correctOrder: 4 },
            { id: "p5-6", text: "  Tampilkan Nilai B ke Layar", correctOrder: 5 }
        ]
    },
    6: {
        id: 6,
        badge: "seq",
        title: "Teka-Teki 6: Membaca Buku Perpustakaan",
        concept: "Konsep: Sekuensial Lanjutan",
        instruction: "Urutkan prosedur standar saat berkunjung ke perpustakaan untuk meminjam dan membaca buku secara logis!",
        blocks: [
            { id: "p6-1", text: "Cari Judul Buku di Komputer Katalog", correctOrder: 0 },
            { id: "p6-2", text: "Temukan Rak Sesuai Kode Klasifikasi", correctOrder: 1 },
            { id: "p6-3", text: "Ambil Buku dan Bawa ke Meja Baca", correctOrder: 2 },
            { id: "p6-4", text: "Kembalikan Buku ke Keranjang Pengembalian", correctOrder: 3 }
        ]
    },
    7: {
        id: 7,
        badge: "cond",
        title: "Teka-Teki 7: Verifikasi Akun Baru",
        concept: "Konsep: Kondisional Bersarang",
        instruction: "Urutkan langkah login aplikasi dengan pengecekan username dan password!",
        blocks: [
            { id: "p7-1", text: "Masukkan Username dan Password", correctOrder: 0 },
            { id: "p7-2", text: "JIKA Password Sesuai:", correctOrder: 1 },
            { id: "p7-3", text: "  Masuk ke Halaman Dashboard Utama", correctOrder: 2 },
            { id: "p7-4", text: "SEBALIKNYA:", correctOrder: 3 },
            { id: "p7-5", text: "  Tampilkan Pesan 'Password Salah, Coba Lagi'", correctOrder: 4 }
        ]
    },
    8: {
        id: 8,
        badge: "loop",
        title: "Teka-Teki 8: Menyiram Tanaman Berulang",
        concept: "Konsep: Loop Tingkat Lanjut",
        instruction: "Susun loop untuk menyiram 5 pot tanaman bunga di kebun secara teratur!",
        blocks: [
            { id: "p8-1", text: "Ulangi 5 Kali (Untuk Setiap Tanaman):", correctOrder: 0 },
            { id: "p8-2", text: "  Berjalan ke Arah Pot Tanaman Berikutnya", correctOrder: 1 },
            { id: "p8-3", text: "  Tuangkan Secangkir Air ke Dalam Tanah", correctOrder: 2 },
            { id: "p8-4", text: "Semua Bunga Segar dan Selesai Disiram", correctOrder: 3 }
        ]
    },
    9: {
        id: 9,
        badge: "cond",
        title: "Teka-Teki 9: Membuat Telur Rebus",
        concept: "Konsep: Pemantauan Kondisi",
        instruction: "Urutkan proses merebus telur setengah matang dengan batasan sensor waktu!",
        blocks: [
            { id: "p9-1", text: "Didihkan Air di Dalam Panci", correctOrder: 0 },
            { id: "p9-2", text: "Masukkan Telur Perlahan-Lahan", correctOrder: 1 },
            { id: "p9-3", text: "JIKA Timer Telah Berjalan 6 Menit:", correctOrder: 2 },
            { id: "p9-4", text: "  Angkat Telur dan Rendam di Air Dingin", correctOrder: 3 },
            { id: "p9-5", text: "Kupas Kulit Telur dan Sajikan Hangat", correctOrder: 4 }
        ]
    },
    10: {
        id: 10,
        badge: "loop",
        title: "Teka-Teki 10: Pencarian Linear Master",
        concept: "Konsep: Logika Pencarian (Search)",
        instruction: "Urutkan logika pencarian linear untuk menemukan angka target di dalam sebuah barisan acak!",
        blocks: [
            { id: "p10-1", text: "Mulai Pencarian Angka Target X", correctOrder: 0 },
            { id: "p10-2", text: "Untuk Setiap Angka di Barisan (Kiri ke Kanan):", correctOrder: 1 },
            { id: "p10-3", text: "  JIKA Angka Saat Ini Sama dengan X:", correctOrder: 2 },
            { id: "p10-4", text: "    Tampilkan 'Target Ditemukan' dan Selesai", correctOrder: 3 },
            { id: "p10-5", text: "Jika Seluruh Barisan Selesai Dicek & Tidak Ada:", correctOrder: 4 },
            { id: "p10-6", text: "  Tampilkan 'Target Tidak Ada' dan Selesai", correctOrder: 5 }
        ]
    },
    // --- TINGKAT MENENGAH (Teka-Teki 11 - 15) ---
    11: {
        id: 11,
        badge: "seq",
        title: "Teka-Teki 11: Mencuci Tangan dengan Benar",
        concept: "Konsep: Sekuensial",
        instruction: "Urutkan langkah mencuci tangan yang benar agar kuman hilang sepenuhnya!",
        blocks: [
            { id: "p11-1", text: "Basahi Tangan dengan Air Mengalir", correctOrder: 0 },
            { id: "p11-2", text: "Tuangkan Sabun ke Telapak Tangan", correctOrder: 1 },
            { id: "p11-3", text: "Gosok Seluruh Bagian Tangan Selama 20 Detik", correctOrder: 2 },
            { id: "p11-4", text: "Bilas Tangan Hingga Bersih dari Sabun", correctOrder: 3 },
            { id: "p11-5", text: "Keringkan Tangan dengan Handuk Bersih", correctOrder: 4 }
        ],
        insight: "Urutan sangat menentukan hasil. Membilas sebelum memakai sabun tidak akan membersihkan kuman, sama seperti program yang urutannya salah tidak akan memberi hasil yang benar."
    },
    12: {
        id: 12,
        badge: "seq",
        title: "Teka-Teki 12: Mengirim Email Tugas",
        concept: "Konsep: Sekuensial",
        instruction: "Bantu Albi mengirim tugas sekolah kepada guru melalui email. Urutkan langkahnya!",
        blocks: [
            { id: "p12-1", text: "Buka Aplikasi Email", correctOrder: 0 },
            { id: "p12-2", text: "Klik Tombol 'Tulis Email Baru'", correctOrder: 1 },
            { id: "p12-3", text: "Isi Alamat Email Guru", correctOrder: 2 },
            { id: "p12-4", text: "Tulis Subjek dan Isi Pesan", correctOrder: 3 },
            { id: "p12-5", text: "Lampirkan File Tugas", correctOrder: 4 },
            { id: "p12-6", text: "Klik Tombol 'Kirim'", correctOrder: 5 }
        ],
        altOrders: [
            ["p12-1", "p12-2", "p12-4", "p12-3", "p12-5", "p12-6"],
            ["p12-1", "p12-2", "p12-3", "p12-5", "p12-4", "p12-6"],
            ["p12-1", "p12-2", "p12-4", "p12-5", "p12-3", "p12-6"],
            ["p12-1", "p12-2", "p12-5", "p12-3", "p12-4", "p12-6"],
            ["p12-1", "p12-2", "p12-5", "p12-4", "p12-3", "p12-6"]
        ],
        insight: "Beberapa langkah boleh ditukar urutannya selama tidak saling bergantung (misalnya mengisi alamat dan subjek). Tetapi langkah 'Kirim' harus selalu paling akhir!"
    },
    13: {
        id: 13,
        badge: "cond",
        title: "Teka-Teki 13: Lampu Lalu Lintas Kendaraan",
        concept: "Konsep: Kondisional Bertingkat",
        instruction: "Albi mengemudikan mobil. Susun logika JIKA - SEBALIKNYA JIKA - SEBALIKNYA untuk ketiga warna lampu lalu lintas!",
        blocks: [
            { id: "p13-1", text: "Lihat Warna Lampu Lalu Lintas", correctOrder: 0 },
            { id: "p13-2", text: "JIKA Lampu Merah:", correctOrder: 1 },
            { id: "p13-3", text: "  Hentikan Mobil di Belakang Garis", correctOrder: 2 },
            { id: "p13-4", text: "SEBALIKNYA JIKA Lampu Kuning:", correctOrder: 3 },
            { id: "p13-5", text: "  Kurangi Kecepatan dan Bersiap Berhenti", correctOrder: 4 },
            { id: "p13-6", text: "SEBALIKNYA (Lampu Hijau):", correctOrder: 5 },
            { id: "p13-7", text: "  Jalankan Mobil dengan Hati-Hati", correctOrder: 6 }
        ],
        insight: "Kondisional bertingkat (else-if) dipakai ketika ada lebih dari dua kemungkinan. Komputer mengecek kondisi dari atas ke bawah dan berhenti di kondisi pertama yang benar."
    },
    14: {
        id: 14,
        badge: "loop",
        title: "Teka-Teki 14: Hitung Mundur Roket",
        concept: "Konsep: Perulangan dengan Kondisi",
        instruction: "Susun algoritma hitung mundur peluncuran roket dari angka 10 sampai 1!",
        blocks: [
            { id: "p14-1", text: "Simpan Angka 10 ke Variabel Hitungan", correctOrder: 0 },
            { id: "p14-2", text: "Ulangi Selama Hitungan Lebih dari 0:", correctOrder: 1 },
            { id: "p14-3", text: "  Tampilkan Nilai Hitungan ke Layar", correctOrder: 2 },
            { id: "p14-4", text: "  Kurangi Hitungan Sebanyak 1", correctOrder: 3 },
            { id: "p14-5", text: "Tampilkan 'Roket Meluncur!'", correctOrder: 4 }
        ],
        insight: "Perulangan 'selama' (while) terus berjalan selama kondisinya benar. Jika nilai hitungan tidak pernah dikurangi, perulangan tidak akan berhenti (infinite loop)!"
    },
    15: {
        id: 15,
        badge: "loop",
        title: "Teka-Teki 15: Menabung Setiap Hari",
        concept: "Konsep: Perulangan dan Variabel",
        instruction: "Albi menabung Rp5.000 setiap hari selama seminggu. Urutkan algoritma untuk menghitung total tabungannya!",
        blocks: [
            { id: "p15-1", text: "Siapkan Celengan Kosong (Saldo = 0)", correctOrder: 0 },
            { id: "p15-2", text: "Ulangi 7 Kali (Setiap Hari):", correctOrder: 1 },
            { id: "p15-3", text: "  Masukkan Rp5.000 ke Celengan", correctOrder: 2 },
            { id: "p15-4", text: "  Saldo = Saldo + 5.000", correctOrder: 3 },
            { id: "p15-5", text: "Tampilkan Total Saldo Tabungan", correctOrder: 4 }
        ],
        altOrders: [
            ["p15-1", "p15-2", "p15-4", "p15-3", "p15-5"]
        ],
        insight: "Variabel seperti 'Saldo' menyimpan nilai yang terus berubah di dalam perulangan. Nilai awal harus diatur SEBELUM perulangan dimulai."
    },
    // --- TINGKAT MAHIR (Teka-Teki 16 - 20) ---
    16: {
        id: 16,
        badge: "cond",
        title: "Teka-Teki 16: Absensi Kelas Otomatis",
        concept: "Konsep: Kondisional di Dalam Perulangan",
        instruction: "Bantu wali kelas membuat algoritma absensi untuk setiap siswa di kelas!",
        blocks: [
            { id: "p16-1", text: "Buka Daftar Hadir Kelas", correctOrder: 0 },
            { id: "p16-2", text: "Untuk Setiap Siswa di Daftar:", correctOrder: 1 },
            { id: "p16-3", text: "  JIKA Siswa Hadir:", correctOrder: 2 },
            { id: "p16-4", text: "    Beri Tanda Centang (Hadir)", correctOrder: 3 },
            { id: "p16-5", text: "  SEBALIKNYA:", correctOrder: 4 },
            { id: "p16-6", text: "    Tulis Keterangan 'Tidak Hadir'", correctOrder: 5 },
            { id: "p16-7", text: "Simpan dan Kirim Rekap Absensi", correctOrder: 6 }
        ],
        insight: "Menggabungkan perulangan dan kondisional memungkinkan komputer memproses banyak data sekaligus sambil mengambil keputusan berbeda untuk setiap data."
    },
    17: {
        id: 17,
        badge: "loop",
        title: "Teka-Teki 17: Menghitung Nilai Rata-Rata",
        concept: "Konsep: Akumulasi dalam Perulangan",
        instruction: "Urutkan algoritma untuk menghitung nilai rata-rata ulangan seluruh siswa!",
        blocks: [
            { id: "p17-1", text: "Siapkan Daftar Nilai Ulangan", correctOrder: 0 },
            { id: "p17-2", text: "Total = 0", correctOrder: 1 },
            { id: "p17-3", text: "Untuk Setiap Nilai di Daftar:", correctOrder: 2 },
            { id: "p17-4", text: "  Total = Total + Nilai", correctOrder: 3 },
            { id: "p17-5", text: "Rata-Rata = Total : Jumlah Siswa", correctOrder: 4 },
            { id: "p17-6", text: "Tampilkan Nilai Rata-Rata", correctOrder: 5 }
        ],
        altOrders: [
            ["p17-2", "p17-1", "p17-3", "p17-4", "p17-5", "p17-6"]
        ],
        insight: "Pola akumulasi (menjumlahkan sedikit demi sedikit di dalam loop) adalah salah satu pola algoritma yang paling sering dipakai, misalnya di aplikasi kasir dan rapor digital."
    },
    18: {
        id: 18,
        badge: "cond",
        title: "Teka-Teki 18: Kelulusan KKM",
        concept: "Konsep: Kondisional dengan Perbandingan",
        instruction: "Susun algoritma untuk menentukan apakah siswa lulus KKM (nilai minimal 75) atau perlu remedial!",
        blocks: [
            { id: "p18-1", text: "Baca Nilai Ujian Siswa", correctOrder: 0 },
            { id: "p18-2", text: "JIKA Nilai Lebih dari atau Sama dengan 75:", correctOrder: 1 },
            { id: "p18-3", text: "  Tampilkan 'Selamat, Kamu Lulus!'", correctOrder: 2 },
            { id: "p18-4", text: "SEBALIKNYA:", correctOrder: 3 },
            { id: "p18-5", text: "  Tampilkan 'Ikuti Remedial'", correctOrder: 4 },
            { id: "p18-6", text: "Simpan Hasil ke Rapor Digital", correctOrder: 5 }
        ],
        insight: "Kondisi dalam program sering berupa perbandingan (lebih dari, kurang dari, sama dengan). Hasil perbandingan selalu bernilai Benar atau Salah."
    },
    19: {
        id: 19,
        badge: "cond",
        title: "Teka-Teki 19: Permainan Tebak Angka",
        concept: "Konsep: Perulangan Sampai Berhasil",
        instruction: "Komputer menyimpan angka rahasia. Susun algoritma permainan tebak angka yang memberi petunjuk!",
        blocks: [
            { id: "p19-1", text: "Komputer Memilih Angka Rahasia", correctOrder: 0 },
            { id: "p19-2", text: "Ulangi Sampai Tebakan Benar:", correctOrder: 1 },
            { id: "p19-3", text: "  Minta Pemain Memasukkan Tebakan", correctOrder: 2 },
            { id: "p19-4", text: "  JIKA Tebakan Lebih Kecil dari Angka Rahasia:", correctOrder: 3 },
            { id: "p19-5", text: "    Tampilkan 'Terlalu Kecil!'", correctOrder: 4 },
            { id: "p19-6", text: "  JIKA Tebakan Lebih Besar dari Angka Rahasia:", correctOrder: 5 },
            { id: "p19-7", text: "    Tampilkan 'Terlalu Besar!'", correctOrder: 6 },
            { id: "p19-8", text: "Tampilkan 'Selamat, Tebakanmu Benar!'", correctOrder: 7 }
        ],
        altOrders: [
            ["p19-1", "p19-2", "p19-3", "p19-6", "p19-7", "p19-4", "p19-5", "p19-8"]
        ],
        insight: "Perulangan 'sampai' (repeat-until) dipakai ketika kita tidak tahu berapa kali harus mengulang. Program berhenti tepat ketika kondisi tujuan tercapai."
    },
    20: {
        id: 20,
        badge: "cond",
        title: "Teka-Teki 20: Mencari Nilai Terbesar",
        concept: "Konsep: Algoritma Pencarian Maksimum",
        instruction: "Urutkan algoritma untuk menemukan nilai tertinggi di kelas dari sebuah daftar nilai!",
        blocks: [
            { id: "p20-1", text: "Ambil Nilai Pertama, Simpan Sebagai Terbesar", correctOrder: 0 },
            { id: "p20-2", text: "Untuk Setiap Nilai Berikutnya di Daftar:", correctOrder: 1 },
            { id: "p20-3", text: "  JIKA Nilai Ini Lebih Besar dari Terbesar:", correctOrder: 2 },
            { id: "p20-4", text: "    Ganti Terbesar dengan Nilai Ini", correctOrder: 3 },
            { id: "p20-5", text: "Tampilkan Nilai Terbesar", correctOrder: 4 }
        ],
        insight: "Algoritma pencarian nilai maksimum membandingkan setiap data dengan 'juara sementara'. Jika ada yang lebih besar, juaranya diganti. Di akhir, juara sementara adalah jawabannya."
    },
    // --- TINGKAT MASTER (Teka-Teki 21 - 25) ---
    21: {
        id: 21,
        badge: "cond",
        title: "Teka-Teki 21: Mesin ATM",
        concept: "Konsep: Kondisional Bersarang",
        instruction: "Susun algoritma mesin ATM yang memeriksa PIN dan saldo sebelum mengeluarkan uang!",
        blocks: [
            { id: "p21-1", text: "Masukkan Kartu ATM", correctOrder: 0 },
            { id: "p21-2", text: "Masukkan Nomor PIN", correctOrder: 1 },
            { id: "p21-3", text: "JIKA PIN Benar:", correctOrder: 2 },
            { id: "p21-4", text: "  Pilih Jumlah Uang yang Ingin Diambil", correctOrder: 3 },
            { id: "p21-5", text: "  JIKA Saldo Mencukupi:", correctOrder: 4 },
            { id: "p21-6", text: "    Keluarkan Uang dan Cetak Struk", correctOrder: 5 },
            { id: "p21-7", text: "  SEBALIKNYA:", correctOrder: 6 },
            { id: "p21-8", text: "    Tampilkan 'Saldo Tidak Cukup'", correctOrder: 7 },
            { id: "p21-9", text: "SEBALIKNYA:", correctOrder: 8 },
            { id: "p21-10", text: "  Tampilkan 'PIN Salah' dan Kembalikan Kartu", correctOrder: 9 }
        ],
        insight: "Kondisional bersarang (if di dalam if) dipakai saat sebuah keputusan baru boleh diambil setelah keputusan sebelumnya terpenuhi, seperti saldo baru dicek setelah PIN benar."
    },
    22: {
        id: 22,
        badge: "loop",
        title: "Teka-Teki 22: Mengurutkan Kartu (Bubble Sort)",
        concept: "Konsep: Algoritma Pengurutan",
        instruction: "Albi ingin mengurutkan kartu angka dari kecil ke besar dengan cara Bubble Sort. Susun algoritmanya!",
        blocks: [
            { id: "p22-1", text: "Jajarkan Kartu Angka Secara Acak", correctOrder: 0 },
            { id: "p22-2", text: "Ulangi Sampai Tidak Ada Kartu yang Ditukar:", correctOrder: 1 },
            { id: "p22-3", text: "  Untuk Setiap Pasangan Kartu Bersebelahan:", correctOrder: 2 },
            { id: "p22-4", text: "    JIKA Kartu Kiri Lebih Besar dari Kartu Kanan:", correctOrder: 3 },
            { id: "p22-5", text: "      Tukar Posisi Kedua Kartu", correctOrder: 4 },
            { id: "p22-6", text: "Kartu Sudah Terurut dari Kecil ke Besar!", correctOrder: 5 }
        ],
        insight: "Bubble Sort membandingkan pasangan yang bersebelahan dan menukarnya bila urutannya salah. Angka besar perlahan 'menggelembung' ke kanan, seperti gelembung naik ke permukaan."
    },
    23: {
        id: 23,
        badge: "loop",
        title: "Teka-Teki 23: Tabel Perkalian",
        concept: "Konsep: Perulangan Bersarang",
        instruction: "Susun algoritma untuk mencetak tabel perkalian 1 sampai 5 menggunakan loop bersarang!",
        blocks: [
            { id: "p23-1", text: "Untuk Setiap Baris dari 1 Sampai 5:", correctOrder: 0 },
            { id: "p23-2", text: "  Untuk Setiap Kolom dari 1 Sampai 5:", correctOrder: 1 },
            { id: "p23-3", text: "    Tulis Hasil Baris × Kolom", correctOrder: 2 },
            { id: "p23-4", text: "  Pindah ke Baris Baru", correctOrder: 3 },
            { id: "p23-5", text: "Tabel Perkalian Selesai Dicetak!", correctOrder: 4 }
        ],
        insight: "Pada loop bersarang, loop dalam (kolom) berjalan penuh untuk setiap satu putaran loop luar (baris). 5 baris × 5 kolom menghasilkan 25 hasil perkalian."
    },
    24: {
        id: 24,
        badge: "debug",
        title: "Teka-Teki 24: Pencarian Biner",
        concept: "Konsep: Algoritma Pencarian Efisien",
        instruction: "Cari sebuah angka di daftar yang sudah terurut dengan cara membagi dua daftar berulang kali. Susun algoritma pencarian biner!",
        blocks: [
            { id: "p24-1", text: "Pastikan Daftar Angka Sudah Terurut", correctOrder: 0 },
            { id: "p24-2", text: "Tentukan Batas Kiri dan Batas Kanan Daftar", correctOrder: 1 },
            { id: "p24-3", text: "Ulangi Selama Batas Kiri Tidak Melewati Batas Kanan:", correctOrder: 2 },
            { id: "p24-4", text: "  Ambil Angka di Posisi Tengah", correctOrder: 3 },
            { id: "p24-5", text: "  JIKA Angka Tengah Sama dengan Target:", correctOrder: 4 },
            { id: "p24-6", text: "    Tampilkan 'Ditemukan!' dan Berhenti", correctOrder: 5 },
            { id: "p24-7", text: "  SEBALIKNYA JIKA Angka Tengah Lebih Kecil dari Target:", correctOrder: 6 },
            { id: "p24-8", text: "    Geser Batas Kiri ke Sebelah Kanan Tengah", correctOrder: 7 },
            { id: "p24-9", text: "  SEBALIKNYA:", correctOrder: 8 },
            { id: "p24-10", text: "    Geser Batas Kanan ke Sebelah Kiri Tengah", correctOrder: 9 },
            { id: "p24-11", text: "Tampilkan 'Angka Tidak Ditemukan'", correctOrder: 10 }
        ],
        insight: "Pencarian biner membuang separuh data di setiap langkah. Untuk 1.000 data, cukup sekitar 10 langkah, jauh lebih cepat daripada mengecek satu per satu (pencarian linear)."
    },
    25: {
        id: 25,
        badge: "debug",
        title: "Teka-Teki 25: Tantangan FizzBuzz",
        concept: "Konsep: Logika Master",
        instruction: "Tantangan klasik programmer! Untuk angka 1 sampai 15: tampilkan 'Fizz' jika habis dibagi 3, 'Buzz' jika habis dibagi 5, dan 'FizzBuzz' jika habis dibagi keduanya. Susun logikanya!",
        blocks: [
            { id: "p25-1", text: "Untuk Setiap Angka dari 1 Sampai 15:", correctOrder: 0 },
            { id: "p25-2", text: "  JIKA Habis Dibagi 3 dan 5:", correctOrder: 1 },
            { id: "p25-3", text: "    Tampilkan 'FizzBuzz'", correctOrder: 2 },
            { id: "p25-4", text: "  SEBALIKNYA JIKA Habis Dibagi 3:", correctOrder: 3 },
            { id: "p25-5", text: "    Tampilkan 'Fizz'", correctOrder: 4 },
            { id: "p25-6", text: "  SEBALIKNYA JIKA Habis Dibagi 5:", correctOrder: 5 },
            { id: "p25-7", text: "    Tampilkan 'Buzz'", correctOrder: 6 },
            { id: "p25-8", text: "  SEBALIKNYA:", correctOrder: 7 },
            { id: "p25-9", text: "    Tampilkan Angka Itu Sendiri", correctOrder: 8 }
        ],
        altOrders: [
            ["p25-1", "p25-2", "p25-3", "p25-6", "p25-7", "p25-4", "p25-5", "p25-8", "p25-9"]
        ],
        insight: "Urutan kondisi sangat penting! Jika 'habis dibagi 3' dicek lebih dulu, angka 15 akan menampilkan 'Fizz', bukan 'FizzBuzz'. Kondisi yang paling khusus harus dicek paling awal."
    }
};

// Pattern Recognition Levels Definitions (Computational Thinking Concept) - 50 Progressive Levels
const PATTERN_LEVELS = {
    // --- TINGKAT PEMULA (Pola 1 - 10) ---
    1: {
        id: 1,
        title: "Pola 1: Warna Berulang",
        concept: "Tingkat Pemula · Pola A-B",
        instruction: "Perhatikan urutan warna. Warna apa yang mengisi tanda tanya (?)?",
        sequence: ["🔴", "🔵", "🔴", "🔵", "🔴", "?"],
        options: ["🔵", "🔴", "🟡", "🟢"],
        correctIndex: 0,
        insight: "Pola A-B-A-B adalah pola paling dasar: dua elemen bergantian terus-menerus. Mengenali bagian yang berulang adalah langkah pertama berpikir komputasional."
    },
    2: {
        id: 2,
        title: "Pola 2: Buah Berulang",
        concept: "Tingkat Pemula · Pola A-B-C",
        instruction: "Tiga buah muncul bergantian. Buah apa yang datang berikutnya?",
        sequence: ["🍎", "🍌", "🍇", "🍎", "🍌", "?"],
        options: ["🍎", "🍌", "🍇", "🍓"],
        correctIndex: 2,
        insight: "Satu 'unit pola' bisa berisi lebih dari dua elemen. Di sini unitnya adalah apel-pisang-anggur yang diulang."
    },
    3: {
        id: 3,
        title: "Pola 3: Bintang dan Bulan",
        concept: "Tingkat Pemula · Pola A-A-B",
        instruction: "Perhatikan berapa kali bintang muncul sebelum bulan!",
        sequence: ["⭐", "⭐", "🌙", "⭐", "⭐", "🌙", "⭐", "?"],
        options: ["⭐", "🌙", "☀️", "☁️"],
        correctIndex: 0,
        insight: "Unit pola tidak harus berisi elemen yang berbeda semua. Pola A-A-B mengulang bintang dua kali sebelum bulan."
    },
    4: {
        id: 4,
        title: "Pola 4: Kucing dan Anjing",
        concept: "Tingkat Pemula · Pola A-B-B",
        instruction: "Satu kucing, lalu dua anjing... Hewan apa selanjutnya?",
        sequence: ["🐱", "🐶", "🐶", "🐱", "🐶", "🐶", "🐱", "?"],
        options: ["🐱", "🐶", "🐰", "🐭"],
        correctIndex: 1,
        insight: "Menentukan di mana sebuah unit pola dimulai dan berakhir membantu kita memprediksi elemen mana pun di dalam deret."
    },
    5: {
        id: 5,
        title: "Pola 5: Menghitung Maju",
        concept: "Tingkat Pemula · Bilangan +1",
        instruction: "Angka bertambah satu per satu. Angka berapa selanjutnya?",
        sequence: ["1", "2", "3", "4", "5", "?"],
        options: ["5", "7", "10", "6"],
        correctIndex: 3,
        insight: "Deret bilangan adalah pola yang dibentuk oleh sebuah aturan. Aturan di sini sangat sederhana: tambah 1."
    },
    6: {
        id: 6,
        title: "Pola 6: Bilangan Genap",
        concept: "Tingkat Pemula · Bilangan +2",
        instruction: "Setiap angka bertambah 2. Lanjutkan deretnya!",
        sequence: ["2", "4", "6", "8", "?"],
        options: ["9", "12", "11", "10"],
        correctIndex: 3,
        insight: "Selisih antara dua angka yang berurutan disebut beda. Dengan mengetahui bedanya, kita bisa menebak angka berikutnya."
    },
    7: {
        id: 7,
        title: "Pola 7: Panah Berputar",
        concept: "Tingkat Pemula · Pola Rotasi",
        instruction: "Panah berputar searah jarum jam. Ke mana arah panah berikutnya?",
        sequence: ["⬆️", "➡️", "⬇️", "⬅️", "⬆️", "?"],
        options: ["⬅️", "⬇️", "⬆️", "➡️"],
        correctIndex: 3,
        insight: "Rotasi adalah pola berulang dengan 4 posisi. Robot dan karakter game memakai pola seperti ini untuk berbelok."
    },
    8: {
        id: 8,
        title: "Pola 8: Bintang Bertambah",
        concept: "Tingkat Pemula · Pola Bertumbuh",
        instruction: "Jumlah bintang terus bertambah. Berapa bintang berikutnya?",
        sequence: ["⭐", "⭐⭐", "⭐⭐⭐", "?"],
        options: ["⭐⭐⭐", "⭐⭐⭐⭐", "⭐⭐⭐⭐⭐", "⭐⭐"],
        correctIndex: 1,
        insight: "Pola bertumbuh berbeda dengan pola berulang: setiap langkah menjadi lebih besar daripada langkah sebelumnya."
    },
    9: {
        id: 9,
        title: "Pola 9: Urutan Abjad",
        concept: "Tingkat Pemula · Huruf +1",
        instruction: "Huruf disusun sesuai abjad. Huruf apa selanjutnya?",
        sequence: ["A", "B", "C", "D", "?"],
        options: ["E", "F", "D", "G"],
        correctIndex: 0,
        insight: "Huruf juga bisa membentuk pola karena memiliki urutan. Komputer menyimpan setiap huruf sebagai angka, misalnya A = 65 dalam kode ASCII."
    },
    10: {
        id: 10,
        title: "Pola 10: Hitung Mundur",
        concept: "Tingkat Pemula · Bilangan -1",
        instruction: "Angka berkurang satu per satu. Angka berapa selanjutnya?",
        sequence: ["10", "9", "8", "7", "?"],
        options: ["6", "5", "8", "4"],
        correctIndex: 0,
        insight: "Pola bisa naik maupun turun. Hitung mundur adalah pola dengan beda -1, seperti pada peluncuran roket."
    },
    // --- TINGKAT DASAR (Pola 11 - 20) ---
    11: {
        id: 11,
        title: "Pola 11: Lampu Empat Warna",
        concept: "Tingkat Dasar · Pola A-B-C-D",
        instruction: "Empat warna lampu menyala bergantian. Warna apa yang menyala berikutnya?",
        sequence: ["🔴", "🟡", "🟢", "🔵", "🔴", "🟡", "🟢", "?"],
        options: ["🔵", "🔴", "🟡", "🟢"],
        correctIndex: 0,
        insight: "Semakin panjang unit pola, semakin teliti kita harus mengamati. Hitung dulu berapa elemen dalam satu unit."
    },
    12: {
        id: 12,
        title: "Pola 12: Pola Cermin",
        concept: "Tingkat Dasar · Pola Simetri",
        instruction: "Angka naik lalu turun kembali seperti bayangan di cermin. Angka berapa selanjutnya?",
        sequence: ["1", "2", "3", "4", "3", "2", "?"],
        options: ["0", "4", "1", "2"],
        correctIndex: 2,
        insight: "Pola simetris (cermin) membaca sama dari depan dan belakang. Kata seperti 'KATAK' juga simetris dan disebut palindrom."
    },
    13: {
        id: 13,
        title: "Pola 13: Kelipatan Lima",
        concept: "Tingkat Dasar · Bilangan +5",
        instruction: "Hitung maju dengan lompatan 5. Angka berapa selanjutnya?",
        sequence: ["5", "10", "15", "20", "?"],
        options: ["25", "30", "21", "24"],
        correctIndex: 0,
        insight: "Kelipatan adalah pola dengan beda tetap. Kelipatan 5 selalu berakhir dengan angka 0 atau 5."
    },
    14: {
        id: 14,
        title: "Pola 14: Bilangan Ganjil",
        concept: "Tingkat Dasar · Bilangan +2",
        instruction: "Ini adalah deret bilangan ganjil. Angka berapa selanjutnya?",
        sequence: ["1", "3", "5", "7", "9", "?"],
        options: ["10", "12", "13", "11"],
        correctIndex: 3,
        insight: "Bilangan ganjil dan genap sama-sama memiliki beda 2. Perbedaannya hanya pada angka awal deret."
    },
    15: {
        id: 15,
        title: "Pola 15: Turun Tiga",
        concept: "Tingkat Dasar · Bilangan -3",
        instruction: "Angka berkurang dengan jumlah yang sama. Berapa pengurangnya? Lanjutkan deretnya!",
        sequence: ["20", "17", "14", "11", "?"],
        options: ["8", "9", "7", "5"],
        correctIndex: 0,
        insight: "Untuk menemukan aturan deret, kurangkan dua angka berurutan. Jika hasilnya selalu sama, aturan deretnya adalah beda tetap."
    },
    16: {
        id: 16,
        title: "Pola 16: Huruf Melompat",
        concept: "Tingkat Dasar · Huruf +2",
        instruction: "Ada satu huruf yang dilewati setiap kali. Huruf apa selanjutnya?",
        sequence: ["A", "C", "E", "G", "?"],
        options: ["H", "J", "K", "I"],
        correctIndex: 3,
        insight: "Pola huruf bisa melompat, sama seperti pola angka. A, C, E, G sesuai dengan posisi abjad 1, 3, 5, 7."
    },
    17: {
        id: 17,
        title: "Pola 17: Ekspresi Wajah",
        concept: "Tingkat Dasar · Pola A-B-B-A",
        instruction: "Perhatikan unit polanya baik-baik: senang, sedih, sedih, senang...",
        sequence: ["😀", "😢", "😢", "😀", "😀", "😢", "😢", "?"],
        options: ["😢", "😡", "😀", "😴"],
        correctIndex: 2,
        insight: "Pola A-B-B-A adalah pola cermin yang diulang. Menggabungkan dua jenis pola adalah awal dari pola yang lebih kompleks."
    },
    18: {
        id: 18,
        title: "Pola 18: Fase Bulan",
        concept: "Tingkat Dasar · Pola Urutan Alam",
        instruction: "Bulan berubah bentuk sedikit demi sedikit. Fase bulan apa berikutnya?",
        sequence: ["🌑", "🌒", "🌓", "🌔", "🌕", "?"],
        options: ["🌑", "🌖", "🌔", "🌘"],
        correctIndex: 1,
        insight: "Banyak pola berasal dari alam, misalnya fase bulan, musim, dan pasang surut. Ilmuwan memakai pengenalan pola untuk memprediksinya."
    },
    19: {
        id: 19,
        title: "Pola 19: Turun Sepuluh",
        concept: "Tingkat Dasar · Bilangan -10",
        instruction: "Angka puluhan berkurang secara teratur. Angka berapa selanjutnya?",
        sequence: ["100", "90", "80", "70", "?"],
        options: ["50", "65", "75", "60"],
        correctIndex: 3,
        insight: "Pola dengan beda yang besar tetap mudah ditebak jika kita fokus pada aturannya, bukan pada besar angkanya."
    },
    20: {
        id: 20,
        title: "Pola 20: Bentuk dan Warna",
        concept: "Tingkat Dasar · Pola Dua Atribut",
        instruction: "Perhatikan BENTUK dan WARNA sekaligus! Elemen apa yang melengkapi pola?",
        sequence: ["🔴", "🔵", "🟥", "🟦", "🔴", "🔵", "?"],
        options: ["🟦", "🔴", "🟥", "🔵"],
        correctIndex: 2,
        insight: "Setiap elemen bisa punya beberapa atribut (bentuk dan warna). Algoritma pengenal gambar menganalisis banyak atribut secara bersamaan."
    },
    // --- TINGKAT MENENGAH (Pola 21 - 30) ---
    21: {
        id: 21,
        title: "Pola 21: Berlipat Ganda",
        concept: "Tingkat Menengah · Bilangan ×2",
        instruction: "Setiap angka adalah hasil dari angka sebelumnya dikali sesuatu. Angka berapa selanjutnya?",
        sequence: ["1", "2", "4", "8", "16", "?"],
        options: ["24", "18", "32", "20"],
        correctIndex: 2,
        insight: "Pola perkalian tumbuh jauh lebih cepat daripada pola penjumlahan. Inilah alasan virus atau berita viral bisa menyebar sangat cepat."
    },
    22: {
        id: 22,
        title: "Pola 22: Selisih Bertambah",
        concept: "Tingkat Menengah · Beda Bertingkat",
        instruction: "Perhatikan SELISIH antar angka: +1, +2, +3, ... Angka berapa selanjutnya?",
        sequence: ["1", "2", "4", "7", "11", "?"],
        options: ["15", "14", "16", "22"],
        correctIndex: 2,
        insight: "Terkadang aturannya tersembunyi di dalam selisih. Jika bedanya tidak tetap, cari pola pada deret selisihnya."
    },
    23: {
        id: 23,
        title: "Pola 23: Dua Deret Berselang",
        concept: "Tingkat Menengah · Deret Ganda",
        instruction: "Ada DUA deret yang berselang-seling dalam satu baris. Temukan keduanya!",
        sequence: ["1", "10", "2", "20", "3", "30", "?"],
        options: ["40", "31", "5", "4"],
        correctIndex: 3,
        insight: "Memisahkan satu masalah besar menjadi beberapa bagian kecil disebut dekomposisi. Di sini satu deret ternyata berisi dua deret."
    },
    24: {
        id: 24,
        title: "Pola 24: Bilangan Kuadrat",
        concept: "Tingkat Menengah · Bilangan n×n",
        instruction: "1×1, 2×2, 3×3, ... Angka berapa selanjutnya?",
        sequence: ["1", "4", "9", "16", "25", "?"],
        options: ["36", "30", "35", "49"],
        correctIndex: 0,
        insight: "Bilangan kuadrat membentuk persegi: 9 titik bisa disusun menjadi persegi 3×3. Pola visual seperti ini sering dipakai dalam desain grafis."
    },
    25: {
        id: 25,
        title: "Pola 25: Naik Tiga Turun Satu",
        concept: "Tingkat Menengah · Aturan Bergantian",
        instruction: "Aturannya bergantian: +3, lalu -1, lalu +3, lalu -1... Angka berapa selanjutnya?",
        sequence: ["2", "5", "4", "7", "6", "?"],
        options: ["5", "8", "9", "10"],
        correctIndex: 2,
        insight: "Sebuah pola bisa memiliki lebih dari satu aturan yang dijalankan bergantian, seperti instruksi di dalam perulangan."
    },
    26: {
        id: 26,
        title: "Pola 26: Abjad Mundur Melompat",
        concept: "Tingkat Menengah · Huruf -2",
        instruction: "Huruf berjalan mundur dari Z dan melewati satu huruf setiap kali. Huruf apa selanjutnya?",
        sequence: ["Z", "X", "V", "T", "?"],
        options: ["R", "S", "Q", "U"],
        correctIndex: 0,
        insight: "Pola mundur sama dengan pola maju, hanya arahnya terbalik. Coba tuliskan posisi abjadnya: 26, 24, 22, 20, ..."
    },
    27: {
        id: 27,
        title: "Pola 27: Dibagi Dua",
        concept: "Tingkat Menengah · Bilangan ÷2",
        instruction: "Setiap angka adalah setengah dari angka sebelumnya. Angka berapa selanjutnya?",
        sequence: ["64", "32", "16", "8", "?"],
        options: ["6", "2", "4", "0"],
        correctIndex: 2,
        insight: "Membagi dua berulang kali adalah inti dari algoritma pencarian biner yang sangat cepat."
    },
    28: {
        id: 28,
        title: "Pola 28: Jarum Jam",
        concept: "Tingkat Menengah · Pola Waktu",
        instruction: "Jarum jam melompat dengan jumlah jam yang sama. Pukul berapa selanjutnya?",
        sequence: ["🕐", "🕒", "🕔", "🕖", "?"],
        options: ["🕗", "🕙", "🕘", "🕕"],
        correctIndex: 2,
        insight: "Jam adalah pola berulang (siklus) 12 jam. Setelah pukul 12, jam kembali ke pukul 1. Inilah yang disebut aritmetika modulo."
    },
    29: {
        id: 29,
        title: "Pola 29: Huruf dan Angka",
        concept: "Tingkat Menengah · Pola Berpasangan",
        instruction: "Setiap elemen terdiri dari huruf dan angka yang sama-sama berpola. Elemen apa selanjutnya?",
        sequence: ["A1", "B2", "C3", "D4", "?"],
        options: ["E4", "F5", "D5", "E5"],
        correctIndex: 3,
        insight: "Satu elemen bisa mengikuti dua pola sekaligus. Kode kursi bioskop dan sel pada spreadsheet (A1, B2) memakai pola seperti ini."
    },
    30: {
        id: 30,
        title: "Pola 30: Kali Tiga",
        concept: "Tingkat Menengah · Bilangan ×3",
        instruction: "Pola perkalian dengan pengali yang lebih besar. Angka berapa selanjutnya?",
        sequence: ["1", "3", "9", "27", "?"],
        options: ["54", "81", "36", "30"],
        correctIndex: 1,
        insight: "Dengan pengali 3, deret tumbuh lebih cepat lagi. Pola pertumbuhan seperti ini disebut eksponensial."
    },
    // --- TINGKAT MAHIR (Pola 31 - 40) ---
    31: {
        id: 31,
        title: "Pola 31: Deret Fibonacci",
        concept: "Tingkat Mahir · Jumlah Dua Sebelumnya",
        instruction: "Setiap angka adalah hasil penjumlahan DUA angka sebelumnya. Angka berapa selanjutnya?",
        sequence: ["1", "1", "2", "3", "5", "8", "?"],
        options: ["11", "12", "13", "16"],
        correctIndex: 2,
        insight: "Deret Fibonacci muncul di alam: susunan biji bunga matahari, kulit nanas, dan cangkang siput. Programmer sering memakainya untuk berlatih rekursi."
    },
    32: {
        id: 32,
        title: "Pola 32: Bilangan Segitiga",
        concept: "Tingkat Mahir · Penjumlahan Berurutan",
        instruction: "1, 1+2, 1+2+3, ... Angka berapa selanjutnya?",
        sequence: ["1", "3", "6", "10", "15", "?"],
        options: ["21", "20", "25", "18"],
        correctIndex: 0,
        insight: "Bilangan segitiga adalah jumlah titik yang bisa disusun menjadi segitiga, seperti susunan pin bowling (10 pin)."
    },
    33: {
        id: 33,
        title: "Pola 33: Bilangan Prima",
        concept: "Tingkat Mahir · Hanya Habis Dibagi 1 dan Dirinya",
        instruction: "Ini adalah deret bilangan prima. Bilangan prima apa selanjutnya?",
        sequence: ["2", "3", "5", "7", "11", "?"],
        options: ["12", "15", "13", "17"],
        correctIndex: 2,
        insight: "Bilangan prima tidak memiliki beda yang tetap. Karena itu, keamanan internet (enkripsi) memakai bilangan prima yang sangat besar."
    },
    34: {
        id: 34,
        title: "Pola 34: Kali Dua Tambah Satu",
        concept: "Tingkat Mahir · Dua Operasi Bergantian",
        instruction: "Operasinya bergantian: ×2, lalu +1, lalu ×2, lalu +1... Angka berapa selanjutnya?",
        sequence: ["1", "2", "3", "6", "7", "14", "?"],
        options: ["28", "16", "15", "21"],
        correctIndex: 2,
        insight: "Pola dengan operasi bergantian mirip program yang menjalankan dua instruksi berbeda di dalam satu perulangan."
    },
    35: {
        id: 35,
        title: "Pola 35: Bilangan Biner",
        concept: "Tingkat Mahir · Sistem Bilangan Komputer",
        instruction: "Komputer menghitung hanya dengan angka 0 dan 1: satu, dua, tiga, empat, lima... Berapa angka biner untuk ENAM?",
        sequence: ["1", "10", "11", "100", "101", "?"],
        options: ["102", "111", "1000", "110"],
        correctIndex: 3,
        insight: "Komputer menyimpan semua data dalam biner (0 dan 1). Biner 110 = 4 + 2 + 0 = 6 dalam bilangan desimal."
    },
    36: {
        id: 36,
        title: "Pola 36: Bilangan Kubik",
        concept: "Tingkat Mahir · Bilangan n×n×n",
        instruction: "1×1×1, 2×2×2, 3×3×3, ... Angka berapa selanjutnya?",
        sequence: ["1", "8", "27", "64", "?"],
        options: ["100", "81", "216", "125"],
        correctIndex: 3,
        insight: "Bilangan kubik adalah jumlah kubus kecil yang menyusun kubus besar, misalnya kubus Rubik 3×3×3 terdiri dari 27 kubus kecil."
    },
    37: {
        id: 37,
        title: "Pola 37: Selisih Mengecil",
        concept: "Tingkat Mahir · Beda Berkurang",
        instruction: "Selisihnya semakin kecil: -10, -9, -8, ... Angka berapa selanjutnya?",
        sequence: ["50", "40", "31", "23", "16", "?"],
        options: ["10", "9", "11", "8"],
        correctIndex: 0,
        insight: "Jika beda deret berubah secara teratur, kita perlu dua tingkat pengamatan: deret aslinya dan deret selisihnya."
    },
    38: {
        id: 38,
        title: "Pola 38: Huruf Kuadrat",
        concept: "Tingkat Mahir · Posisi Abjad Berpola",
        instruction: "Posisi huruf dalam abjad mengikuti pola 1, 4, 9, 16, ... Huruf apa selanjutnya?",
        sequence: ["A", "D", "I", "P", "?"],
        options: ["T", "X", "Z", "Y"],
        correctIndex: 3,
        insight: "Mengubah huruf menjadi angka (A=1, B=2, ...) adalah teknik representasi data. Pola tersembunyi menjadi mudah terlihat setelah datanya diubah."
    },
    39: {
        id: 39,
        title: "Pola 39: Kuadrat Kurang Satu",
        concept: "Tingkat Mahir · Rumus n×n - 1",
        instruction: "Bandingkan setiap angka dengan bilangan kuadrat 1, 4, 9, 16, ... Angka berapa selanjutnya?",
        sequence: ["0", "3", "8", "15", "24", "?"],
        options: ["36", "33", "30", "35"],
        correctIndex: 3,
        insight: "Banyak deret merupakan variasi dari deret yang sudah kita kenal. Membandingkannya dengan deret dasar membantu menemukan rumusnya."
    },
    40: {
        id: 40,
        title: "Pola 40: Dua Aturan Berselang",
        concept: "Tingkat Mahir · Deret Ganda Lanjutan",
        instruction: "Posisi ganjil dan posisi genap memiliki aturan yang BERBEDA. Angka berapa di posisi berikutnya?",
        sequence: ["2", "100", "4", "90", "8", "80", "?"],
        options: ["16", "70", "10", "12"],
        correctIndex: 0,
        insight: "Deret ini berisi dua pola sekaligus: posisi ganjil dikali 2, posisi genap dikurangi 10. Fokus pada posisi yang ditanyakan!"
    },
    // --- TINGKAT MASTER (Pola 41 - 50) ---
    41: {
        id: 41,
        title: "Pola 41: Pangkat Dua",
        concept: "Tingkat Master · Bilangan 2ⁿ",
        instruction: "Deret ini sangat penting dalam dunia komputer (ukuran memori). Angka berapa selanjutnya?",
        sequence: ["2", "4", "8", "16", "32", "64", "?"],
        options: ["96", "120", "256", "128"],
        correctIndex: 3,
        insight: "Ukuran memori komputer mengikuti pangkat 2: 64 GB, 128 GB, 256 GB. Itu karena komputer bekerja dengan bilangan biner."
    },
    42: {
        id: 42,
        title: "Pola 42: Deret Lucas",
        concept: "Tingkat Master · Fibonacci Varian",
        instruction: "Aturannya sama dengan Fibonacci (jumlah dua angka sebelumnya), tetapi angka awalnya berbeda!",
        sequence: ["2", "1", "3", "4", "7", "11", "?"],
        options: ["17", "15", "22", "18"],
        correctIndex: 3,
        insight: "Algoritma yang sama dengan data awal berbeda menghasilkan keluaran yang berbeda. Inilah alasan nilai awal (inisialisasi) sangat penting dalam program."
    },
    43: {
        id: 43,
        title: "Pola 43: Kuadrat Tambah Satu",
        concept: "Tingkat Master · Rumus n×n + 1",
        instruction: "Bandingkan dengan bilangan kuadrat 1, 4, 9, 16, 25, ... Angka berapa selanjutnya?",
        sequence: ["2", "5", "10", "17", "26", "?"],
        options: ["35", "36", "38", "37"],
        correctIndex: 3,
        insight: "Menemukan rumus umum sebuah deret memungkinkan kita menghitung suku ke-100 langsung tanpa menulis semua suku sebelumnya."
    },
    44: {
        id: 44,
        title: "Pola 44: Faktorial",
        concept: "Tingkat Master · Perkalian Berurutan",
        instruction: "1, 1×2, 1×2×3, 1×2×3×4, ... Angka berapa selanjutnya?",
        sequence: ["1", "2", "6", "24", "?"],
        options: ["48", "96", "120", "100"],
        correctIndex: 2,
        insight: "Faktorial menghitung banyaknya cara menyusun benda. Ada 120 cara berbeda untuk menyusun 5 buku di rak!"
    },
    45: {
        id: 45,
        title: "Pola 45: Deret Tribonacci",
        concept: "Tingkat Master · Jumlah Tiga Sebelumnya",
        instruction: "Setiap angka adalah jumlah TIGA angka sebelumnya. Angka berapa selanjutnya?",
        sequence: ["1", "1", "2", "4", "7", "13", "?"],
        options: ["20", "21", "26", "24"],
        correctIndex: 3,
        insight: "Tribonacci memperluas aturan Fibonacci. Memodifikasi algoritma yang sudah ada adalah keterampilan penting seorang programmer."
    },
    46: {
        id: 46,
        title: "Pola 46: Huruf Fibonacci",
        concept: "Tingkat Master · Posisi Abjad Fibonacci",
        instruction: "Posisi huruf dalam abjad mengikuti deret Fibonacci: 1, 1, 2, 3, 5, 8, ... Huruf apa selanjutnya?",
        sequence: ["A", "A", "B", "C", "E", "H", "?"],
        options: ["K", "L", "N", "M"],
        correctIndex: 3,
        insight: "Pola tingkat master sering menggabungkan beberapa konsep: representasi huruf sebagai angka dan deret Fibonacci."
    },
    47: {
        id: 47,
        title: "Pola 47: Kali Dua Tambah Satu Lagi",
        concept: "Tingkat Master · Rumus 2×n + 1",
        instruction: "Setiap angka dikali 2 lalu ditambah 1. Angka berapa selanjutnya?",
        sequence: ["1", "3", "7", "15", "31", "?"],
        options: ["63", "62", "47", "64"],
        correctIndex: 0,
        insight: "Deret ini adalah 2ⁿ - 1. Dalam biner, angkanya selalu berisi angka 1 semua: 1, 11, 111, 1111, ..."
    },
    48: {
        id: 48,
        title: "Pola 48: Selisih Berlipat",
        concept: "Tingkat Master · Beda Bertambah ×2",
        instruction: "Selisih antar angka adalah 1, 2, 4, 8, ... Angka berapa selanjutnya?",
        sequence: ["2", "3", "5", "9", "17", "?"],
        options: ["25", "33", "32", "34"],
        correctIndex: 1,
        insight: "Deret ini adalah 2ⁿ + 1. Pola pada selisih mengungkap rumus asli deretnya."
    },
    49: {
        id: 49,
        title: "Pola 49: Pasangan Angka dan Kuadrat",
        concept: "Tingkat Master · Deret Berpasangan",
        instruction: "Angka muncul berpasangan: sebuah angka, lalu hasil kuadratnya. Angka berapa selanjutnya?",
        sequence: ["1", "1", "2", "4", "3", "9", "4", "16", "?"],
        options: ["25", "5", "20", "6"],
        correctIndex: 1,
        insight: "Data sering tersimpan berpasangan (kunci dan nilai). Mengenali struktur data adalah kunci memahami polanya."
    },
    50: {
        id: 50,
        title: "Pola 50: Baca dan Ucapkan",
        concept: "Tingkat Master · Pola Legendaris Look-and-Say",
        instruction: "Tantangan terakhir! Setiap angka 'membaca' angka sebelumnya. 1 dibaca 'satu angka 1' → 11. 11 dibaca 'dua angka 1' → 21. 21 dibaca 'satu 2, satu 1' → 1211. Lanjutkan!",
        sequence: ["1", "11", "21", "1211", "111221", "?"],
        options: ["312211", "1112221", "211221", "13112221"],
        correctIndex: 0,
        insight: "Selamat, kamu telah menaklukkan semua 50 pola! Pola look-and-say menunjukkan bahwa sebuah aturan bisa berupa proses (algoritma), bukan sekadar rumus matematika."
    }
};

// Pattern Game State variables
let currentPatternLevel = 1;
let completedPatternLevels = [];
let selectedPatternOption = null; // index of the option as displayed on screen
let patternOptionOrder = []; // displayed position -> original index in lvl.options

// Puzzle Game State variables
let currentPuzzleLevel = 1;
let completedPuzzleLevels = [];
let puzzleBlocks = []; // holds current scrambled/player-ordered blocks
let mazeQuizCompleted = false; // true when maze quiz is done

// Game State variables
let currentLevel = 1;
let completedLevels = [];

/* ==========================================================================
   PERSISTENCE / LOCAL STORAGE ENGINE
   ========================================================================== */
const STORAGE_KEY = 'algoquest_game_progress_v1';

/* ==========================================================================
   DATA DIRI PEMAIN (nama & kelas) + progres terpisah untuk setiap pemain,
   sehingga satu komputer lab bisa dipakai bergantian oleh banyak siswa.
   ========================================================================== */
const PLAYERS_KEY = 'algoquest_players_v1';           // daftar pemain di perangkat ini
const ACTIVE_PLAYER_KEY = 'algoquest_active_player_v1';
let currentPlayer = null;  // { id, name, kelas, registeredAt }
let lastQuizScore = null;  // nilai kuis terakhir (untuk laporan guru)

function readStoredJSON(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
        return fallback;
    }
}

function writeStoredJSON(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.warn('Gagal menyimpan data:', e);
    }
}

function progressStorageKey() {
    return currentPlayer ? `${STORAGE_KEY}_${currentPlayer.id}` : STORAGE_KEY;
}

function getKnownPlayers() {
    const list = readStoredJSON(PLAYERS_KEY, []);
    return Array.isArray(list) ? list.filter(p => p && p.id && p.name && p.kelas) : [];
}

function cleanPlayerText(text) {
    return String(text || '').replace(/\s+/g, ' ').trim();
}

// "budi santoso" -> "Budi Santoso" so the teacher's list stays tidy
function capitalizeWords(text) {
    return text.split(' ').map(w => w.charAt(0).toLocaleUpperCase('id-ID') + w.slice(1)).join(' ');
}

// Returns an error message, or '' when the name & class are valid
function validatePlayerInput(name, kelas) {
    if (name.length < 3) return 'Nama lengkap minimal 3 huruf.';
    if (!/^[\p{L} .'-]+$/u.test(name)) return 'Nama hanya boleh berisi huruf, spasi, titik, tanda petik, dan tanda hubung.';
    if (!kelas) return 'Kelas wajib diisi, contoh: 7A.';
    if (!/^[\p{L}\p{N} .\/-]+$/u.test(kelas)) return 'Kelas hanya boleh berisi huruf, angka, spasi, titik, garis miring, dan tanda hubung.';
    return '';
}

function makePlayerId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
        return window.crypto.randomUUID();
    }
    return 'p-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}

function registerPlayer(name, kelas) {
    const players = getKnownPlayers();
    let player = players.find(p => p.name.toLowerCase() === name.toLowerCase() && p.kelas.toLowerCase() === kelas.toLowerCase());
    const isNew = !player;

    if (isNew) {
        player = { id: makePlayerId(), name, kelas, registeredAt: new Date().toISOString() };
        // Progres lama (dari sebelum ada halaman data diri) diwariskan ke pemain pertama di perangkat ini
        if (players.length === 0) {
            try {
                const legacy = localStorage.getItem(STORAGE_KEY);
                if (legacy) {
                    localStorage.setItem(`${STORAGE_KEY}_${player.id}`, legacy);
                    localStorage.removeItem(STORAGE_KEY);
                }
            } catch (e) {}
        }
        players.push(player);
        writeStoredJSON(PLAYERS_KEY, players);
    }

    activatePlayer(player);
    reportToTeacher(isNew ? 'Mendaftar & mulai bermain' : 'Masuk kembali');
}

// Switches the game to the given player and loads that player's own progress
function activatePlayer(player) {
    currentPlayer = player;
    try {
        localStorage.setItem(ACTIVE_PLAYER_KEY, player.id);
    } catch (e) {}

    completedLevels = [];
    completedPuzzleLevels = [];
    completedPatternLevels = [];
    currentLevel = 1;
    currentPuzzleLevel = 1;
    currentPatternLevel = 1;
    mazeQuizCompleted = false;
    lastQuizScore = null;
    if (dom.displayCertName) dom.displayCertName.innerText = '';

    loadProgress();
    renderPlayerBadge();
    renderLevelsSelector();
    updateCertificateCard();
    updateProgressDisplays();
    showScreen('landing-page');
}

function restoreActivePlayer() {
    let activeId = null;
    try {
        activeId = localStorage.getItem(ACTIVE_PLAYER_KEY);
    } catch (e) {}
    const player = getKnownPlayers().find(p => p.id === activeId);
    if (player) {
        activatePlayer(player);
        return true;
    }
    return false;
}

function renderPlayerBadge() {
    if (!currentPlayer) return;
    dom.playerBadgeName.innerText = currentPlayer.name;
    dom.playerBadgeClass.innerText = currentPlayer.kelas;
}

function showRegisterPage() {
    dom.regName.value = '';
    dom.regClass.value = '';
    dom.registerError.classList.add('hidden');

    // Quick-pick buttons for students who already played on this device
    const players = getKnownPlayers();
    dom.knownPlayersList.innerHTML = '';
    players.forEach(p => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'known-player-btn';
        btn.innerText = `${p.name} · ${p.kelas}`;
        btn.addEventListener('click', () => {
            synth.playClick();
            dom.regName.value = p.name;
            dom.regClass.value = p.kelas;
            dom.registerError.classList.add('hidden');
        });
        dom.knownPlayersList.appendChild(btn);
    });
    dom.knownPlayers.classList.toggle('hidden', players.length === 0);

    showScreen('register-page');
    dom.regName.focus();
}

/* ==========================================================================
   LAPORAN KE DATABASE GURU (Google Spreadsheet via Google Apps Script)
   Game hanya MENGIRIM ringkasan progres. Data tidak pernah dibaca kembali,
   sehingga daftar siswa hanya bisa dilihat guru di spreadsheet miliknya.
   ========================================================================== */
const PENDING_REPORTS_KEY = 'algoquest_pending_reports_v1';
const MAX_PENDING_REPORTS = 50;

function getTeacherSheetUrl() {
    const config = window.ALGOQUEST_CONFIG || {};
    return typeof config.SHEET_URL === 'string' ? config.SHEET_URL.trim() : '';
}

function buildReport(activity, detail) {
    const totalPuzzles = Object.keys(PUZZLE_LEVELS).length;
    const totalPatterns = Object.keys(PATTERN_LEVELS).length;
    const certName = dom.displayCertName ? dom.displayCertName.innerText.trim() : '';
    return {
        id: currentPlayer.id,
        nama: currentPlayer.name,
        kelas: currentPlayer.kelas,
        maze: countCompleted(completedLevels, 1, TOTAL_MAZE_LEVELS),
        mazeTotal: TOTAL_MAZE_LEVELS,
        puzzle: countCompleted(completedPuzzleLevels, 1, totalPuzzles),
        puzzleTotal: totalPuzzles,
        pola: countCompleted(completedPatternLevels, 1, totalPatterns),
        polaTotal: totalPatterns,
        kuis: lastQuizScore,
        kuisTotal: QUIZ_QUESTIONS.length,
        lulusKuis: mazeQuizCompleted,
        sertifikat: certName && certName !== 'Nama Peserta' ? certName : '',
        aktivitas: activity,
        detail: detail || '',
        waktu: new Date().toISOString()
    };
}

function sendReport(url, report) {
    // text/plain avoids a CORS preflight, which Google Apps Script does not answer
    return fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(report),
        keepalive: true
    });
}

// Reports that failed (e.g. no internet) are kept and sent again later
function queuePendingReport(report) {
    const pending = readStoredJSON(PENDING_REPORTS_KEY, []);
    pending.push(report);
    writeStoredJSON(PENDING_REPORTS_KEY, pending.slice(-MAX_PENDING_REPORTS));
}

function flushPendingReports() {
    const url = getTeacherSheetUrl();
    const pending = readStoredJSON(PENDING_REPORTS_KEY, []);
    if (!url || !Array.isArray(pending) || pending.length === 0) return;
    writeStoredJSON(PENDING_REPORTS_KEY, []);
    pending.forEach(report => {
        sendReport(url, report).catch(() => queuePendingReport(report));
    });
}

function reportToTeacher(activity, detail) {
    const url = getTeacherSheetUrl();
    if (!url || !currentPlayer) return;
    const report = buildReport(activity, detail);
    flushPendingReports();
    try {
        sendReport(url, report).catch(() => queuePendingReport(report));
    } catch (e) {
        queuePendingReport(report);
    }
}

function saveProgress() {
    try {
        const data = {
            completedLevels: completedLevels,
            completedPuzzleLevels: completedPuzzleLevels,
            completedPatternLevels: completedPatternLevels,
            currentPuzzleLevel: currentPuzzleLevel,
            currentPatternLevel: currentPatternLevel,
            mazeQuizCompleted: mazeQuizCompleted,
            lastQuizScore: lastQuizScore,
            playerName: (dom.displayCertName && dom.displayCertName.innerText) ? dom.displayCertName.innerText : ''
        };
        localStorage.setItem(progressStorageKey(), JSON.stringify(data));
    } catch (e) {
        console.warn('Gagal menyimpan progres:', e);
    }
    updateProgressDisplays();
}

/* ==========================================================================
   PROGRESS DISPLAY: jumlah level selesai di menu utama, daftar misi & puzzle
   ========================================================================== */
// Number of distinct completed levels between fromId and toId (inclusive)
function countCompleted(completedArr, fromId, toId) {
    return new Set(completedArr.filter(id => id >= fromId && id <= toId)).size;
}

function progressPercent(done, total) {
    return total > 0 ? Math.round((done / total) * 100) : 0;
}

// Small "X / N level selesai" line + bar on the landing page mode cards
function renderModeCardProgress(el, completedArr, total, unit) {
    if (!el) return;
    const done = countCompleted(completedArr, 1, total);
    const pct = progressPercent(done, total);
    el.classList.toggle('complete', done >= total);
    el.innerHTML = `
        <span class="mode-progress-text">${done >= total ? '✅ ' : ''}<strong>${done}</strong> / ${total} ${unit} selesai</span>
        <span class="progress-track"><span class="progress-track-fill" style="width: ${pct}%"></span></span>
    `;
}

// Full panel: total progress, bar, and one chip per difficulty tier
function renderProgressPanel(el, options) {
    if (!el) return;
    const { title, unit, completedArr, total, currentId } = options;
    const tierSize = options.tierSize || 5;
    const done = countCompleted(completedArr, 1, total);
    const pct = progressPercent(done, total);

    let chips = '';
    for (let start = 1; start <= total; start += tierSize) {
        const end = Math.min(start + tierSize - 1, total);
        const tier = getLevelTier(start, tierSize);
        const tierDone = countCompleted(completedArr, start, end);
        const tierCount = end - start + 1;
        const classes = ['tier-chip'];
        if (tierDone >= tierCount) classes.push('complete');
        if (currentId && currentId >= start && currentId <= end) classes.push('current');
        chips += `<span class="${classes.join(' ')}" title="${unit} ${start} - ${end}">${tier.icon} ${tier.name} <strong>${tierDone}/${tierCount}</strong></span>`;
    }

    el.innerHTML = `
        <div class="progress-panel-header">
            <span class="progress-panel-title">${title}</span>
            <span class="progress-panel-count"><strong>${done}</strong> / ${total} ${unit} selesai · ${pct}%</span>
        </div>
        <div class="progress-track large"><div class="progress-track-fill" style="width: ${pct}%"></div></div>
        <div class="tier-chips">${chips}</div>
    `;
}

function updateProgressDisplays() {
    const totalPuzzles = Object.keys(PUZZLE_LEVELS).length;
    const totalPatterns = Object.keys(PATTERN_LEVELS).length;

    renderModeCardProgress(dom.mazeModeProgress, completedLevels, TOTAL_MAZE_LEVELS, 'level');
    renderModeCardProgress(dom.puzzleModeProgress, completedPuzzleLevels, totalPuzzles, 'level');
    renderModeCardProgress(dom.patternModeProgress, completedPatternLevels, totalPatterns, 'level');

    renderProgressPanel(dom.mazeProgressPanel, {
        title: '🗺️ Progres Mode Labirin', unit: 'misi',
        completedArr: completedLevels, total: TOTAL_MAZE_LEVELS
    });
    renderProgressPanel(dom.puzzleProgressPanel, {
        title: `🧩 Teka-Teki ${currentPuzzleLevel} dari ${totalPuzzles}`, unit: 'teka-teki',
        completedArr: completedPuzzleLevels, total: totalPuzzles, currentId: currentPuzzleLevel
    });

    renderProgressPanel(dom.patternProgressPanel, {
        title: `🎨 Pola ${currentPatternLevel} dari ${totalPatterns}`, unit: 'pola',
        completedArr: completedPatternLevels, total: totalPatterns, currentId: currentPatternLevel,
        tierSize: PATTERN_TIER_SIZE
    });

    if (dom.arenaLevelProgress) {
        const done = countCompleted(completedLevels, 1, TOTAL_MAZE_LEVELS);
        dom.arenaLevelProgress.innerText = `Misi ${currentLevel} dari ${TOTAL_MAZE_LEVELS} · ${done}/${TOTAL_MAZE_LEVELS} misi selesai`;
    }
}

function loadProgress() {
    try {
        const saved = localStorage.getItem(progressStorageKey());
        if (saved) {
            const data = JSON.parse(saved);
            if (Array.isArray(data.completedLevels)) {
                completedLevels = data.completedLevels;
            }
            if (Array.isArray(data.completedPuzzleLevels)) {
                completedPuzzleLevels = data.completedPuzzleLevels;
            }
            if (Array.isArray(data.completedPatternLevels)) {
                completedPatternLevels = data.completedPatternLevels;
            }
            if (typeof data.currentPuzzleLevel === 'number') {
                currentPuzzleLevel = data.currentPuzzleLevel;
            }
            if (typeof data.currentPatternLevel === 'number') {
                currentPatternLevel = data.currentPatternLevel;
            }
            if (typeof data.mazeQuizCompleted === 'boolean') {
                mazeQuizCompleted = data.mazeQuizCompleted;
            }
            if (typeof data.lastQuizScore === 'number') {
                lastQuizScore = data.lastQuizScore;
            }
            if (data.playerName && dom.displayCertName) {
                dom.displayCertName.innerText = data.playerName;
            }
        }
    } catch (e) {
        console.warn('Gagal memuat progres:', e);
    }
}

function isPuzzleLevelUnlocked(levelId) {
    return levelId === 1 || completedPuzzleLevels.includes(levelId - 1);
}

function getHighestUnlockedPuzzleLevel() {
    const totalPuzzles = Object.keys(PUZZLE_LEVELS).length;
    for (let i = totalPuzzles; i >= 1; i--) {
        if (isPuzzleLevelUnlocked(i)) {
            return i;
        }
    }
    return 1;
}

function renderPuzzleLevelSelect() {
    if (!dom.puzzleLevelSelect) return;
    dom.puzzleLevelSelect.innerHTML = '';
    const totalPuzzles = Object.keys(PUZZLE_LEVELS).length;

    let group = null;
    for (let i = 1; i <= totalPuzzles; i++) {
        if ((i - 1) % 5 === 0) {
            const tier = getLevelTier(i);
            group = document.createElement('optgroup');
            group.label = `${tier.icon} ${tier.name}`;
            dom.puzzleLevelSelect.appendChild(group);
        }
        const opt = document.createElement('option');
        opt.value = i;
        const isUnlocked = isPuzzleLevelUnlocked(i);
        const isDone = completedPuzzleLevels.includes(i);

        let prefix = isDone ? '✓ ' : (isUnlocked ? '• ' : '🔒 ');
        opt.innerText = `${prefix}Teka-Teki ${i}`;
        opt.disabled = !isUnlocked;
        if (i === currentPuzzleLevel) {
            opt.selected = true;
        }
        group.appendChild(opt);
    }
}

function isPatternLevelUnlocked(levelId) {
    return levelId === 1 || completedPatternLevels.includes(levelId - 1);
}

function getHighestUnlockedPatternLevel() {
    const totalPatterns = Object.keys(PATTERN_LEVELS).length;
    for (let i = totalPatterns; i >= 1; i--) {
        if (isPatternLevelUnlocked(i)) {
            return i;
        }
    }
    return 1;
}

function renderPatternLevelSelect() {
    if (!dom.patternLevelSelect) return;
    dom.patternLevelSelect.innerHTML = '';
    const totalPatterns = Object.keys(PATTERN_LEVELS).length;

    let group = null;
    for (let i = 1; i <= totalPatterns; i++) {
        if ((i - 1) % PATTERN_TIER_SIZE === 0) {
            const tier = getLevelTier(i, PATTERN_TIER_SIZE);
            group = document.createElement('optgroup');
            group.label = `${tier.icon} ${tier.name}`;
            dom.patternLevelSelect.appendChild(group);
        }
        const opt = document.createElement('option');
        opt.value = i;
        const isUnlocked = isPatternLevelUnlocked(i);
        const isDone = completedPatternLevels.includes(i);

        let prefix = isDone ? '✓ ' : (isUnlocked ? '• ' : '🔒 ');
        opt.innerText = `${prefix}Pola ${i}`;
        opt.disabled = !isUnlocked;
        if (i === currentPatternLevel) {
            opt.selected = true;
        }
        group.appendChild(opt);
    }
}

function resetAllProgress() {
    if (confirm("Apakah kamu yakin ingin menghapus seluruh riwayat dan mengulang game dari awal?")) {
        completedLevels = [];
        completedPuzzleLevels = [];
        completedPatternLevels = [];
        currentLevel = 1;
        currentPuzzleLevel = 1;
        currentPatternLevel = 1;
        mazeQuizCompleted = false;
        lastQuizScore = null;
        try {
            localStorage.removeItem(progressStorageKey());
        } catch (e) {}
        if (dom.displayCertName) dom.displayCertName.innerText = '';
        renderLevelsSelector();
        updateCertificateCard();
        updateProgressDisplays();
        reportToTeacher('Mereset progres game');
        alert("Progres game berhasil direset ke awal.");
    }
}

let workspaceBlocks = []; // format: { id, type, loopCount, children: [] }
let robotPos = { x: 0, y: 0, dir: 'UP' }; // current state in simulation
let executionQueue = [];
let isExecuting = false;
let executionInterval = null;
let activeWorkspaceTarget = null; // null means root workspace, otherwise references loop block ID

// Drag & Drop state
let dragState = {
    source: null,      // 'toolbox' | 'workspace'
    type: null,        // block type string
    loopCount: 2,      // for loop blocks dragged from toolbox
    id: null,          // id of workspace block being reordered
    parentId: null     // parent loop id if reordering from nested
};

let quizIndex = 0;
let quizScore = 0;
const QUIZ_PASS_SCORE = 3; // minimal jawaban benar untuk lulus kuis

// Fisher-Yates shuffle: every ordering is equally likely (returns a new array)
function shuffleArray(arr) {
    const result = arr.slice();
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

// DOM Elements cache
const dom = {
    landingPage: document.getElementById('landing-page'),
    levelSelectorPage: document.getElementById('level-selector-page'),
    gameArenaPage: document.getElementById('game-arena-page'),
    quizPage: document.getElementById('quiz-page'),
    certificatePage: document.getElementById('certificate-page'),

    modeMazeBtn: document.getElementById('mode-maze-btn'),
    modePuzzleBtn: document.getElementById('mode-puzzle-btn'),
    modePatternBtn: document.getElementById('mode-pattern-btn'),
    modeCertBtn: document.getElementById('mode-cert-btn'),
    certLockLabel: document.getElementById('cert-lock-label'),
    puzzleGamePage: document.getElementById('puzzle-game-page'),
    backToModeBtn: document.getElementById('back-to-mode-btn'),
    puzzleLevelTitle: document.getElementById('puzzle-level-title'),
    puzzleLevelTag: document.getElementById('puzzle-level-tag'),
    puzzleIntroText: document.getElementById('puzzle-intro-text'),
    puzzleBlocksList: document.getElementById('puzzle-blocks-list'),
    puzzleLevelCounter: document.getElementById('puzzle-level-counter'),
    puzzleLevelSelect: document.getElementById('puzzle-level-select'),
    verifyPuzzleBtn: document.getElementById('verify-puzzle-btn'),

    patternGamePage: document.getElementById('pattern-game-page'),
    backToModePatternBtn: document.getElementById('back-to-mode-pattern-btn'),
    patternLevelTitle: document.getElementById('pattern-level-title'),
    patternLevelTag: document.getElementById('pattern-level-tag'),
    patternIntroText: document.getElementById('pattern-intro-text'),
    patternDisplayArea: document.getElementById('pattern-display-area'),
    patternOptionsList: document.getElementById('pattern-options-list'),
    patternLevelCounter: document.getElementById('pattern-level-counter'),
    patternLevelSelect: document.getElementById('pattern-level-select'),
    verifyPatternBtn: document.getElementById('verify-pattern-btn'),

    audioToggleBtn: document.getElementById('audio-toggle-btn'),
    audioIconPath: document.getElementById('audio-icon-path'),
    resetProgressBtn: document.getElementById('reset-progress-btn'),

    levelsGrid: document.querySelector('.levels-grid'),
    mazeModeProgress: document.getElementById('maze-mode-progress'),
    registerForm: document.getElementById('register-form'),
    regName: document.getElementById('reg-name'),
    regClass: document.getElementById('reg-class'),
    registerError: document.getElementById('register-error'),
    knownPlayers: document.getElementById('known-players'),
    knownPlayersList: document.getElementById('known-players-list'),
    playerBadgeName: document.getElementById('player-badge-name'),
    playerBadgeClass: document.getElementById('player-badge-class'),
    switchPlayerBtn: document.getElementById('switch-player-btn'),
    puzzleModeProgress: document.getElementById('puzzle-mode-progress'),
    patternModeProgress: document.getElementById('pattern-mode-progress'),
    mazeProgressPanel: document.getElementById('maze-progress-panel'),
    puzzleProgressPanel: document.getElementById('puzzle-progress-panel'),
    patternProgressPanel: document.getElementById('pattern-progress-panel'),
    arenaLevelProgress: document.getElementById('arena-level-progress'),
    quizLockedCard: document.getElementById('quiz-locked-card'),
    quizUnlockedCard: document.getElementById('quiz-unlocked-card'),
    startQuizBtn: document.getElementById('start-quiz-btn'),

    backToHomeBtns: document.querySelectorAll('.back-to-home'),
    backToSelectorBtn: document.getElementById('back-to-selector'),
    clearWorkspaceBtn: document.getElementById('clear-workspace-btn'),
    runProgramBtn: document.getElementById('run-program-btn'),
    stopProgramBtn: document.getElementById('stop-program-btn'),

    currentLevelTitle: document.getElementById('current-level-title'),
    currentLevelTag: document.getElementById('current-level-tag'),
    levelIntroText: document.getElementById('level-intro-text'),
    gridContainer: document.getElementById('grid-container'),
    toolboxBlocksList: document.getElementById('toolbox-blocks-list'),
    workspaceBlocksStack: document.getElementById('workspace-blocks-stack'),
    workspaceCounter: document.getElementById('workspace-counter'),

    quizProgressFill: document.getElementById('quiz-progress-fill'),
    quizCounterText: document.getElementById('quiz-counter-text'),
    quizQuestionText: document.getElementById('quiz-question-text'),
    quizOptionsContainer: document.getElementById('quiz-options-container'),
    nextQuestionBtn: document.getElementById('next-question-btn'),

    playerCertName: document.getElementById('player-cert-name'),
    saveCertNameBtn: document.getElementById('save-cert-name-btn'),
    certNameEditView: document.getElementById('cert-name-edit-view'),
    certNameFinalView: document.getElementById('cert-name-final-view'),
    displayCertName: document.getElementById('display-cert-name'),
    certDateText: document.getElementById('cert-date-text'),
    printCertBtn: document.getElementById('print-cert-btn'),

    // Modals
    successModal: document.getElementById('success-modal'),
    successModalTitle: document.getElementById('success-modal-title'),
    successModalDesc: document.getElementById('success-modal-desc'),
    successLearningInsight: document.getElementById('success-learning-insight'),
    successRetryBtn: document.getElementById('success-retry-btn'),
    successNextBtn: document.getElementById('success-next-btn'),

    failureModal: document.getElementById('failure-modal'),
    failureModalTitle: document.getElementById('failure-modal-title'),
    failureModalDesc: document.getElementById('failure-modal-desc'),
    failureModalHint: document.getElementById('failure-modal-hint'),
    failureCloseBtn: document.getElementById('failure-close-btn')
};

// SVG templates for procedural rendering (Crisp, modern graphics)
const SVGS = {
    robot: (dir) => {
        let rotation = 0;
        if (dir === 'RIGHT') rotation = 90;
        if (dir === 'DOWN') rotation = 180;
        if (dir === 'LEFT') rotation = 270;
        return `
        <svg viewBox="0 0 100 100" class="robot-agent" style="transform: rotate(${rotation}deg)">
            <!-- Head & Antenna -->
            <rect x="35" y="10" width="30" height="25" rx="5" fill="#06b6d4" stroke="#083344" stroke-width="3"/>
            <line x1="50" y1="10" x2="50" y2="3" stroke="#eab308" stroke-width="4" stroke-linecap="round"/>
            <circle cx="50" cy="2" r="3" fill="#f43f5e"/>
            
            <!-- Eyes (Glowing neon) -->
            <rect x="42" y="18" width="6" height="6" rx="1" fill="#fff" filter="drop-shadow(0 0 3px #06b6d4)"/>
            <rect x="52" y="18" width="6" height="6" rx="1" fill="#fff" filter="drop-shadow(0 0 3px #06b6d4)"/>
            
            <!-- Neck -->
            <rect x="46" y="35" width="8" height="6" fill="#64748b"/>
            
            <!-- Body -->
            <rect x="25" y="41" width="50" height="40" rx="8" fill="#0f172a" stroke="#06b6d4" stroke-width="4" filter="drop-shadow(0 0 5px rgba(6,182,212,0.3))"/>
            
            <!-- Details inside body -->
            <rect x="35" y="48" width="30" height="15" rx="3" fill="#1e293b"/>
            <circle cx="42" cy="55" r="3" fill="#10b981"/>
            <circle cx="50" cy="55" r="3" fill="#eab308"/>
            <circle cx="58" cy="55" r="3" fill="#f43f5e"/>
            
            <!-- Arms -->
            <rect x="18" y="46" width="6" height="20" rx="3" fill="#0891b2"/>
            <rect x="76" y="46" width="6" height="20" rx="3" fill="#0891b2"/>
            
            <!-- Tracks/Wheels -->
            <rect x="30" y="81" width="12" height="10" rx="2" fill="#334155"/>
            <rect x="58" y="81" width="12" height="10" rx="2" fill="#334155"/>
        </svg>
        `;
    },
    portal: `
    <svg viewBox="0 0 100 100" class="portal-goal">
        <!-- Outer glowing ring -->
        <circle cx="50" cy="50" r="40" fill="none" stroke="#a855f7" stroke-width="4" stroke-dasharray="10 5" filter="drop-shadow(0 0 8px #a855f7)"/>
        <!-- Inner swirling portal -->
        <circle cx="50" cy="50" r="30" fill="url(#portal-gradient)"/>
        <path d="M50 20 A30 30 0 0 0 20 50 A30 30 0 0 0 50 80" fill="none" stroke="#06b6d4" stroke-width="2" opacity="0.7"/>
        
        <defs>
            <radialGradient id="portal-gradient">
                <stop offset="0%" stop-color="#020617" />
                <stop offset="70%" stop-color="#7c3aed" />
                <stop offset="100%" stop-color="#06b6d4" />
            </radialGradient>
        </defs>
    </svg>
    `
};

/* ==========================================================================
   INITIALIZATION & NAVIGATION
   ========================================================================== */
function initApp() {
    setupEventListeners();
    // Pemain yang sudah mengisi data diri langsung masuk ke menu utama
    if (!restoreActivePlayer()) {
        showRegisterPage();
    }
    flushPendingReports();
    renderLevelsSelector();
    updateAudioIcon();
    updateCertificateCard();

    // Auto date for Certificate
    const now = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    dom.certDateText.innerText = now.toLocaleDateString('id-ID', options);
}

function setupEventListeners() {
    // Halaman data diri
    dom.registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = capitalizeWords(cleanPlayerText(dom.regName.value));
        const kelas = cleanPlayerText(dom.regClass.value).toUpperCase();
        const error = validatePlayerInput(name, kelas);
        if (error) {
            synth.playWrong();
            dom.registerError.innerText = error;
            dom.registerError.classList.remove('hidden');
            return;
        }
        synth.playSuccess();
        registerPlayer(name, kelas);
    });

    dom.switchPlayerBtn.addEventListener('click', () => {
        synth.playClick();
        showRegisterPage();
    });

    // Navigation - Game Mode Selection
    dom.modeMazeBtn.addEventListener('click', () => {
        synth.playClick();
        renderLevelsSelector(); // refresh completed stamps & tier counts
        showScreen('level-selector-page');
    });

    dom.modePuzzleBtn.addEventListener('click', () => {
        synth.playClick();
        let maxLvl = Object.keys(PUZZLE_LEVELS).length;
        let targetLvl = Math.min(Math.max(1, currentPuzzleLevel || 1), maxLvl);
        if (!isPuzzleLevelUnlocked(targetLvl)) {
            targetLvl = getHighestUnlockedPuzzleLevel();
        }
        loadPuzzleLevel(targetLvl);
    });

    if (dom.puzzleLevelSelect) {
        dom.puzzleLevelSelect.addEventListener('change', (e) => {
            const selectedLvl = parseInt(e.target.value, 10);
            if (selectedLvl && isPuzzleLevelUnlocked(selectedLvl)) {
                synth.playClick();
                loadPuzzleLevel(selectedLvl);
            }
        });
    }

    if (dom.modePatternBtn) {
        dom.modePatternBtn.addEventListener('click', () => {
            synth.playClick();
            let maxLvl = Object.keys(PATTERN_LEVELS).length;
            let targetLvl = Math.min(Math.max(1, currentPatternLevel || 1), maxLvl);
            if (!isPatternLevelUnlocked(targetLvl)) {
                targetLvl = getHighestUnlockedPatternLevel();
            }
            loadPatternLevel(targetLvl);
        });
    }

    if (dom.patternLevelSelect) {
        dom.patternLevelSelect.addEventListener('change', (e) => {
            const selectedLvl = parseInt(e.target.value, 10);
            if (selectedLvl && isPatternLevelUnlocked(selectedLvl)) {
                synth.playClick();
                loadPatternLevel(selectedLvl);
            }
        });
    }

    dom.modeCertBtn.addEventListener('click', () => {
        const totalPuzzles = Object.keys(PUZZLE_LEVELS).length;
        const totalPatterns = Object.keys(PATTERN_LEVELS).length;
        const mazeDone = (new Set(completedLevels)).size >= TOTAL_MAZE_LEVELS;
        const puzzleDone = (new Set(completedPuzzleLevels)).size >= totalPuzzles;
        const patternDone = (new Set(completedPatternLevels)).size >= totalPatterns;
        const allDone = mazeDone && puzzleDone && patternDone;

        if (allDone) {
            synth.playClick();
            if (mazeQuizCompleted) {
                dom.certNameFinalView.classList.add('hidden');
                dom.certNameEditView.classList.remove('hidden');
                dom.printCertBtn.classList.add('hidden');
                const savedCertName = (dom.displayCertName && dom.displayCertName.innerText !== 'Nama Peserta') ? dom.displayCertName.innerText : '';
                dom.playerCertName.value = savedCertName || (currentPlayer ? currentPlayer.name : '');
                showScreen('certificate-page');
            } else {
                startQuiz();
            }
        } else {
            synth.playWrong();
            alert(`Sertifikat belum bisa diakses! Kamu harus menyelesaikan seluruh ${TOTAL_MAZE_LEVELS} Level Mode Labirin (Maze), ${totalPuzzles} Level Mode Teka-Teki (Puzzle), dan ${totalPatterns} Level Mode Pengenalan Pola (Pattern) terlebih dahulu.`);
        }
    });

    dom.backToModeBtn.addEventListener('click', () => {
        synth.playClick();
        showScreen('landing-page');
    });

    if (dom.backToModePatternBtn) {
        dom.backToModePatternBtn.addEventListener('click', () => {
            synth.playClick();
            showScreen('landing-page');
        });
    }

    dom.verifyPuzzleBtn.addEventListener('click', () => {
        checkPuzzleSolution();
    });

    if (dom.verifyPatternBtn) {
        dom.verifyPatternBtn.addEventListener('click', () => {
            checkPatternSolution();
        });
    }

    dom.audioToggleBtn.addEventListener('click', () => {
        const isEnabled = synth.toggle();
        updateAudioIcon();
        if (isEnabled) {
            synth.playClick();
        }
    });

    dom.backToHomeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            synth.playClick();
            showScreen('landing-page');
        });
    });

    dom.backToSelectorBtn.addEventListener('click', () => {
        synth.playClick();
        showScreen('level-selector-page');
        renderLevelsSelector(); // refresh completed stamps
    });

    // Workspace Actions
    dom.clearWorkspaceBtn.addEventListener('click', () => {
        synth.playClick();
        workspaceBlocks = [];
        activeWorkspaceTarget = null;
        renderWorkspace();
    });

    dom.runProgramBtn.addEventListener('click', () => {
        runProgram();
    });

    dom.stopProgramBtn.addEventListener('click', () => {
        stopProgram();
    });

    // Quiz Actions
    dom.startQuizBtn.addEventListener('click', () => {
        synth.playClick();
        startQuiz();
    });

    dom.nextQuestionBtn.addEventListener('click', () => {
        synth.playClick();
        nextQuizQuestion();
    });

    // Certificate Actions
    dom.saveCertNameBtn.addEventListener('click', () => {
        const nameVal = dom.playerCertName.value.trim();
        if (nameVal) {
            synth.playCorrect();
            dom.displayCertName.innerText = nameVal;
            dom.certNameEditView.classList.add('hidden');
            dom.certNameFinalView.classList.remove('hidden');
            dom.printCertBtn.classList.remove('hidden');
            saveProgress();
            reportToTeacher('Mengklaim sertifikat', nameVal);
        } else {
            synth.playWrong();
            alert("Harap masukkan nama lengkap Anda!");
        }
    });

    if (dom.resetProgressBtn) {
        dom.resetProgressBtn.addEventListener('click', () => {
            synth.playClick();
            resetAllProgress();
        });
    }

    dom.printCertBtn.addEventListener('click', () => {
        synth.playClick();
        window.print();
    });

    // ---- DRAG & DROP: Workspace area drop target ----
    const ws = dom.workspaceBlocksStack;

    ws.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        ws.classList.add('drag-over-highlight');
        // Show bottom drop indicator when hovering near end
        const allIndicators = ws.querySelectorAll('.drop-zone-indicator');
        allIndicators.forEach(ind => ind.classList.remove('drop-zone-active'));
        const lastInd = ws.querySelector('.drop-zone-indicator:last-child');
        if (lastInd) lastInd.classList.add('drop-zone-active');
    });

    ws.addEventListener('dragleave', (e) => {
        // Only remove highlight if truly leaving workspace (not entering a child)
        if (!ws.contains(e.relatedTarget)) {
            ws.classList.remove('drag-over-highlight');
            ws.querySelectorAll('.drop-zone-indicator').forEach(i => i.classList.remove('drop-zone-active'));
        }
    });

    ws.addEventListener('drop', (e) => {
        e.preventDefault();
        ws.classList.remove('drag-over-highlight');
        ws.querySelectorAll('.drop-zone-indicator').forEach(i => i.classList.remove('drop-zone-active'));
        // Drop at end of root workspace
        handleWorkspaceDrop(null, workspaceBlocks.length);
    });
}

function showScreen(screenId) {
    document.querySelectorAll('.view-screen').forEach(screen => {
        screen.classList.remove('active');
    });
    const activeScreen = document.getElementById(screenId);
    activeScreen.classList.add('active');
}

function updateAudioIcon() {
    if (synth.enabled) {
        // Sound on SVG path
        dom.audioIconPath.setAttribute('d', 'M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.5A2.25 2.25 0 002.25 9.75v4.5c0 1.242 1.008 2.25 2.25 2.25h1.94l4.5 4.5c.944.945 2.56.276 2.56-1.06V4.06zM18.57 17.47a.75.75 0 11-1.06-1.06 5.25 5.25 0 000-7.42.75.75 0 111.06-1.06 6.75 6.75 0 010 9.54z M21.3 20.2a.75.75 0 11-1.06-1.06 9.15 9.15 0 000-12.96.75.75 0 111.06-1.06 10.65 10.65 0 010 15.08z');
        dom.audioToggleBtn.style.borderColor = 'var(--color-cyan)';
        dom.audioToggleBtn.style.color = 'var(--color-cyan)';
    } else {
        // Sound off/muted SVG path
        dom.audioIconPath.setAttribute('d', 'M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.5A2.25 2.25 0 002.25 9.75v4.5c0 1.242 1.008 2.25 2.25 2.25h1.94l4.5 4.5c.944.945 2.56.276 2.56-1.06V4.06zM17.78 9.22a.75.75 0 10-1.06 1.06L18.44 12l-1.72 1.72a.75.75 0 001.06 1.06l1.72-1.72 1.72 1.72a.75.75 0 101.06-1.06L20.56 12l1.72-1.72a.75.75 0 00-1.06-1.06l-1.72 1.72-1.72-1.72z');
        dom.audioToggleBtn.style.borderColor = 'var(--panel-border)';
        dom.audioToggleBtn.style.color = 'var(--text-muted)';
    }
}


/* ==========================================================================
   LEVEL SELECTOR MANAGEMENT
   ========================================================================== */
function renderLevelsSelector() {
    dom.levelsGrid.innerHTML = '';

    // Check if previous levels are completed to unlock the next one
    let allCompleted = true;

    for (let id = 1; id <= TOTAL_MAZE_LEVELS; id++) {
        const lvl = LEVELS[id];

        // Tier heading every 5 levels (Pemula, Dasar, Menengah, Mahir, Master)
        if ((id - 1) % 5 === 0) {
            const tier = getLevelTier(id);
            const heading = document.createElement('div');
            heading.className = 'level-tier-heading';
            const tierEnd = Math.min(id + 4, TOTAL_MAZE_LEVELS);
            const tierDone = countCompleted(completedLevels, id, tierEnd);
            const tierSize = tierEnd - id + 1;
            heading.innerText = `${tier.icon} Tingkat ${tier.name} · Misi ${id} - ${tierEnd} · ${tierDone}/${tierSize} selesai${tierDone >= tierSize ? ' ✅' : ''}`;
            dom.levelsGrid.appendChild(heading);
        }
        const isUnlocked = id === 1 || completedLevels.includes(id - 1);
        const isCompleted = completedLevels.includes(id);

        if (!isCompleted) allCompleted = false;

        const card = document.createElement('div');
        card.className = `level-card glass-panel ${isUnlocked ? 'unlocked' : 'locked'} ${isCompleted ? 'completed' : ''}`;
        card.setAttribute('data-level', id);

        card.innerHTML = `
            <div class="level-num">${id}</div>
            <div class="level-badge ${lvl.badge}">${lvl.concept.split(': ')[1]}</div>
            <h3>${lvl.title}</h3>
            <p>${lvl.instruction}</p>
            <button class="btn btn-level-action" ${isUnlocked ? '' : 'disabled'}>
                ${isCompleted ? 'Main Lagi' : (isUnlocked ? 'Mulai Misi' : 'Terkunci')}
            </button>
        `;

        if (isUnlocked) {
            card.addEventListener('click', () => {
                synth.playClick();
                loadLevel(id);
            });
        }

        dom.levelsGrid.appendChild(card);
    }

    // Quiz Unlock Card Handling
    if (dom.quizLockedCard && dom.quizUnlockedCard) {
        if ((new Set(completedLevels)).size >= TOTAL_MAZE_LEVELS) {
            dom.quizLockedCard.classList.add('hidden');
            dom.quizUnlockedCard.classList.remove('hidden');
        } else {
            dom.quizLockedCard.classList.remove('hidden');
            dom.quizUnlockedCard.classList.add('hidden');
        }
    }
}


/* ==========================================================================
   GAME LEVEL SETUP & GRID RENDERING
   ========================================================================== */
function loadLevel(levelId) {
    currentLevel = levelId;
    const lvl = LEVELS[levelId];

    dom.currentLevelTitle.innerText = lvl.title;
    dom.currentLevelTag.innerText = `${lvl.concept} · Tingkat ${getLevelTier(levelId).name}`;

    // Dynamic styles based on levels
    dom.currentLevelTag.className = `level-concept-tag ${lvl.badge}`;

    dom.levelIntroText.innerText = lvl.instruction;

    // Reset workspace and setup block drawer
    workspaceBlocks = [];
    activeWorkspaceTarget = null;

    // Load pre-configured workspace for Debugging levels
    if (lvl.debuggingSetup) {
        // Deep copy of buggy block array, support nested children for loop blocks
        function buildSetupBlock(b, idx) {
            const block = {
                id: `block-${Date.now()}-${idx}-${Math.random()}`,
                type: b.type,
                loopCount: b.loopCount || 2,
                children: []
            };
            if (b.children && b.children.length > 0) {
                block.children = b.children.map((child, cIdx) => buildSetupBlock(child, `${idx}-${cIdx}`));
            }
            return block;
        }
        workspaceBlocks = lvl.debuggingSetup.map((b, idx) => buildSetupBlock(b, idx));
    }

    updateProgressDisplays();
    renderToolbox(lvl.allowedBlocks);
    renderWorkspace();
    resetSimulation();

    showScreen('game-arena-page');
}

function renderToolbox(allowed) {
    dom.toolboxBlocksList.innerHTML = '';

    // Map of block markup
    const blockTemplates = {
        'move': `
            <div class="block-item block-action cursor-pointer" data-type="move">
                <span class="block-icon">↑</span>
                <span class="block-label">Maju 1 Langkah</span>
            </div>`,
        'turn-left': `
            <div class="block-item block-action cursor-pointer" data-type="turn-left">
                <span class="block-icon">↶</span>
                <span class="block-label">Belok Kiri</span>
            </div>`,
        'turn-right': `
            <div class="block-item block-action cursor-pointer" data-type="turn-right">
                <span class="block-icon">↷</span>
                <span class="block-label">Belok Kanan</span>
            </div>`,
        'loop': `
            <div class="block-item block-loop cursor-pointer" data-type="loop">
                <span class="block-icon">↻</span>
                <span class="block-label">Ulangi...</span>
                <select class="loop-count-select" onclick="event.stopPropagation()">
                    <option value="2">2 Kali</option>
                    <option value="3">3 Kali</option>
                    <option value="4">4 Kali</option>
                    <option value="5">5 Kali</option>
                    <option value="6">6 Kali</option>
                    <option value="7">7 Kali</option>
                    <option value="8">8 Kali</option>
                    <option value="10">10 Kali</option>
                </select>
            </div>`,
        'if-yellow': `
            <div class="block-item block-conditional cursor-pointer" data-type="if-yellow">
                <span class="block-icon">?</span>
                <span class="block-label">Jika Ubin Kuning -> Belok Kanan</span>
            </div>`,
        'if-purple': `
            <div class="block-item block-conditional cursor-pointer" data-type="if-purple">
                <span class="block-icon">?</span>
                <span class="block-label">Jika Ubin Ungu -> Belok Kiri</span>
            </div>`
    };

    allowed.forEach(type => {
        if (blockTemplates[type]) {
            const container = document.createElement('div');
            container.innerHTML = blockTemplates[type].trim();
            const el = container.firstChild;

            // --- Click to add ---
            el.addEventListener('click', (e) => {
                let loopVal = 2;
                if (type === 'loop') {
                    const sel = el.querySelector('select');
                    loopVal = parseInt(sel.value, 10);
                }
                addBlockToWorkspace(type, loopVal);
            });

            // --- Drag to add ---
            el.setAttribute('draggable', 'true');
            el.addEventListener('dragstart', (e) => {
                let loopVal = 2;
                if (type === 'loop') {
                    const sel = el.querySelector('select');
                    if (sel) loopVal = parseInt(sel.value, 10);
                }
                dragState.source = 'toolbox';
                dragState.type = type;
                dragState.loopCount = loopVal;
                dragState.id = null;
                dragState.parentId = null;
                e.dataTransfer.effectAllowed = 'copy';
                e.dataTransfer.setData('text/plain', type);
                el.classList.add('block-dragging');
                // Small ghost image
                setTimeout(() => el.classList.add('block-dragging'), 0);
            });
            el.addEventListener('dragend', () => {
                el.classList.remove('block-dragging');
                dragState.source = null;
            });

            dom.toolboxBlocksList.appendChild(el);
        }
    });
}

function renderGrid() {
    const lvl = LEVELS[currentLevel];
    dom.gridContainer.innerHTML = '';
    dom.gridContainer.style.gridTemplateColumns = `repeat(${lvl.gridSize}, 1fr)`;
    dom.gridContainer.style.gridTemplateRows = `repeat(${lvl.gridSize}, 1fr)`;

    // Draw bottom-up coordinates: row = 0 is top-most, col = 0 is left-most
    for (let r = 0; r < lvl.gridSize; r++) {
        for (let c = 0; c < lvl.gridSize; c++) {
            const tile = document.createElement('div');
            tile.className = 'grid-tile';
            tile.setAttribute('data-x', c);
            tile.setAttribute('data-y', r);

            // Wall check
            const isWall = lvl.walls.some(w => w.x === c && w.y === r);
            if (isWall) {
                tile.classList.add('wall');
            }

            // Yellow sensor check
            const isYellow = lvl.yellowTiles && lvl.yellowTiles.some(t => t.x === c && t.y === r);
            if (isYellow) {
                tile.classList.add('yellow-sensor');
            }

            // Purple sensor check
            const isPurple = lvl.purpleTiles && lvl.purpleTiles.some(t => t.x === c && t.y === r);
            if (isPurple) {
                tile.classList.add('purple-sensor');
            }

            // Portal / Goal
            if (lvl.goal.x === c && lvl.goal.y === r) {
                tile.innerHTML = SVGS.portal;
            }

            dom.gridContainer.appendChild(tile);
        }
    }

    // Place Robot
    placeRobotElement();
}

function placeRobotElement() {
    // Remove existing robot
    const oldRobot = dom.gridContainer.querySelector('.robot-agent');
    if (oldRobot) oldRobot.remove();

    // Get current position tile
    const targetTile = dom.gridContainer.querySelector(`[data-x="${robotPos.x}"][data-y="${robotPos.y}"]`);
    if (targetTile) {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = SVGS.robot(robotPos.dir).trim();
        const robotSvg = wrapper.firstChild;
        targetTile.appendChild(robotSvg);
    }
}

function resetSimulation() {
    const lvl = LEVELS[currentLevel];
    robotPos = { ...lvl.start };

    // Remove any path/step highlights
    const tiles = dom.gridContainer.querySelectorAll('.grid-tile');
    tiles.forEach(t => t.classList.remove('active-step'));

    renderGrid();
    stopProgram();
}


/* ==========================================================================
   WORKSPACE STACK & BLOCK BUILDING
   ========================================================================== */
function addBlockToWorkspace(type, loopCount = 2) {
    synth.playClick();

    const lvl = LEVELS[currentLevel];
    const totalBlocks = countTotalBlocks(workspaceBlocks);

    if (totalBlocks >= lvl.maxBlocks) {
        alert(`Batas maksimal blok untuk misi ini adalah ${lvl.maxBlocks} blok!`);
        return;
    }

    const newBlock = {
        id: `block-${Date.now()}-${Math.random()}`,
        type: type,
        loopCount: loopCount,
        children: [] // for nested loops
    };

    if (activeWorkspaceTarget) {
        // Add to nested container of the active loop block
        const targetLoop = findBlockById(workspaceBlocks, activeWorkspaceTarget);
        if (targetLoop && targetLoop.type === 'loop') {
            targetLoop.children.push(newBlock);
        } else {
            // Target invalid, fallback
            workspaceBlocks.push(newBlock);
            activeWorkspaceTarget = null;
        }
    } else {
        // Standard append to root workspace
        workspaceBlocks.push(newBlock);
    }

    renderWorkspace();
}

function deleteBlock(blockId, e) {
    if (e) e.stopPropagation();
    synth.playClick();

    workspaceBlocks = removeBlockById(workspaceBlocks, blockId);

    if (activeWorkspaceTarget === blockId) {
        activeWorkspaceTarget = null;
    }

    renderWorkspace();
}

function toggleActiveLoopTarget(loopId, e) {
    if (e) e.stopPropagation();
    synth.playClick();

    if (activeWorkspaceTarget === loopId) {
        activeWorkspaceTarget = null; // deselect
    } else {
        activeWorkspaceTarget = loopId; // select this loop container
    }
    renderWorkspace();
}

function changeLoopCount(loopId, newVal, e) {
    if (e) e.stopPropagation();
    const block = findBlockById(workspaceBlocks, loopId);
    if (block) {
        block.loopCount = parseInt(newVal, 10);
    }
}

// Tree Traversal Helpers
function findBlockById(arr, id) {
    for (let item of arr) {
        if (item.id === id) return item;
        if (item.children && item.children.length > 0) {
            const found = findBlockById(item.children, id);
            if (found) return found;
        }
    }
    return null;
}

function removeBlockById(arr, id) {
    return arr.filter(item => {
        if (item.id === id) return false;
        if (item.children && item.children.length > 0) {
            item.children = removeBlockById(item.children, id);
        }
        return true;
    });
}

function countTotalBlocks(arr) {
    let count = 0;
    arr.forEach(item => {
        count++;
        if (item.children && item.children.length > 0) {
            count += countTotalBlocks(item.children);
        }
    });
    return count;
}

// Visual Workspace Renderer
function renderWorkspace() {
    dom.workspaceBlocksStack.innerHTML = '';

    const totalCount = countTotalBlocks(workspaceBlocks);
    const lvl = LEVELS[currentLevel];
    dom.workspaceCounter.innerText = `${totalCount} / ${lvl.maxBlocks} Blok Terpakai`;
    if (totalCount > lvl.maxBlocks) {
        dom.workspaceCounter.style.color = 'var(--color-rose)';
    } else {
        dom.workspaceCounter.style.color = 'var(--text-secondary)';
    }

    if (workspaceBlocks.length === 0) {
        // Empty state — still a valid drop target, show placeholder
        const placeholder = document.createElement('div');
        placeholder.className = 'empty-workspace-placeholder';
        placeholder.innerHTML = `
            <span class="placeholder-icon">🧩</span>
            <p>Workspace Kosong</p>
            <span>Klik atau <strong style="color:var(--color-cyan)">seret blok</strong> ke sini untuk menyusun algoritmamu.</span>
        `;
        dom.workspaceBlocksStack.appendChild(placeholder);
        // Add a single drop zone at the bottom
        dom.workspaceBlocksStack.appendChild(createDropZone(null, 0));
        return;
    }

    // Build visual DOM tree with drop-zone indicators between every block
    workspaceBlocks.forEach((block, index) => {
        // Drop zone BEFORE each block
        dom.workspaceBlocksStack.appendChild(createDropZone(null, index));
        dom.workspaceBlocksStack.appendChild(createVisualBlockElement(block, index, false));
    });
    // Drop zone AFTER last block
    dom.workspaceBlocksStack.appendChild(createDropZone(null, workspaceBlocks.length));
}

function createVisualBlockElement(block, index, isNested = false, parentBlockId = null) {
    const wrapper = document.createElement('div');
    wrapper.className = 'block-nested-wrapper';
    wrapper.setAttribute('data-block-id', block.id);
    wrapper.setAttribute('data-index', index);
    if (parentBlockId) wrapper.setAttribute('data-parent-id', parentBlockId);

    const blockEl = document.createElement('div');
    blockEl.id = block.id;
    blockEl.setAttribute('data-type', block.type);
    // Make every workspace block draggable for reordering
    blockEl.setAttribute('draggable', 'true');
    blockEl.addEventListener('dragstart', (e) => {
        e.stopPropagation();
        dragState.source = 'workspace';
        dragState.type = block.type;
        dragState.loopCount = block.loopCount || 2;
        dragState.id = block.id;
        dragState.parentId = parentBlockId;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', block.id);
        blockEl.classList.add('block-dragging');
    });
    blockEl.addEventListener('dragend', () => {
        blockEl.classList.remove('block-dragging');
        dragState.source = null;
        // Re-render to clean up any stuck states
        renderWorkspace();
    });

    let content = '';

    if (block.type === 'move') {
        blockEl.className = 'block-item block-action';
        content = `
            <span class="block-icon">↑</span>
            <span class="block-label">Maju 1 Langkah</span>
            <button class="delete-block-btn" onclick="deleteBlock('${block.id}', event)">✖</button>
        `;
    } else if (block.type === 'turn-left') {
        blockEl.className = 'block-item block-action';
        content = `
            <span class="block-icon">↶</span>
            <span class="block-label">Belok Kiri</span>
            <button class="delete-block-btn" onclick="deleteBlock('${block.id}', event)">✖</button>
        `;
    } else if (block.type === 'turn-right') {
        blockEl.className = 'block-item block-action';
        content = `
            <span class="block-icon">↷</span>
            <span class="block-label">Belok Kanan</span>
            <button class="delete-block-btn" onclick="deleteBlock('${block.id}', event)">✖</button>
        `;
    } else if (block.type === 'if-yellow') {
        blockEl.className = 'block-item block-conditional';
        content = `
            <span class="block-icon">?</span>
            <span class="block-label">Jika Ubin Kuning -> Belok Kanan</span>
            <button class="delete-block-btn" onclick="deleteBlock('${block.id}', event)">✖</button>
        `;
    } else if (block.type === 'if-purple') {
        blockEl.className = 'block-item block-conditional';
        content = `
            <span class="block-icon">?</span>
            <span class="block-label">Jika Ubin Ungu -> Belok Kiri</span>
            <button class="delete-block-btn" onclick="deleteBlock('${block.id}', event)">✖</button>
        `;
    } else if (block.type === 'loop') {
        const isTarget = activeWorkspaceTarget === block.id;
        blockEl.className = `block-item block-loop ${isTarget ? 'executing-highlight' : ''}`;
        blockEl.style.cursor = 'pointer';

        // Loop block HTML setup
        content = `
            <span class="block-icon">↻</span>
            <span class="block-label">Ulangi</span>
            <select class="loop-count-select" onchange="changeLoopCount('${block.id}', this.value, event)" onclick="event.stopPropagation()">
                <option value="2" ${block.loopCount === 2 ? 'selected' : ''}>2 Kali</option>
                <option value="3" ${block.loopCount === 3 ? 'selected' : ''}>3 Kali</option>
                <option value="4" ${block.loopCount === 4 ? 'selected' : ''}>4 Kali</option>
                <option value="5" ${block.loopCount === 5 ? 'selected' : ''}>5 Kali</option>
                <option value="6" ${block.loopCount === 6 ? 'selected' : ''}>6 Kali</option>
                <option value="7" ${block.loopCount === 7 ? 'selected' : ''}>7 Kali</option>
                <option value="8" ${block.loopCount === 8 ? 'selected' : ''}>8 Kali</option>
                <option value="10" ${block.loopCount === 10 ? 'selected' : ''}>10 Kali</option>
            </select>
            <span class="block-label" style="font-size:0.75rem; margin-left:5px; opacity:0.8;">(${isTarget ? 'Menyusun...' : 'Ketuk untuk Susun'})</span>
            <button class="delete-block-btn" onclick="deleteBlock('${block.id}', event)">✖</button>
        `;

        blockEl.addEventListener('click', (e) => {
            toggleActiveLoopTarget(block.id, e);
        });
    }

    blockEl.innerHTML = content;
    wrapper.appendChild(blockEl);

    // If it's a loop, render its nested child elements with drop support
    if (block.type === 'loop') {
        const nestedContainer = document.createElement('div');
        nestedContainer.className = 'nested-workspace-container';
        nestedContainer.setAttribute('data-loop-id', block.id);

        // Drop into nested container
        nestedContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = dragState.source === 'workspace' ? 'move' : 'copy';
            nestedContainer.classList.add('drag-over-highlight');
        });
        nestedContainer.addEventListener('dragleave', (e) => {
            if (!nestedContainer.contains(e.relatedTarget)) {
                nestedContainer.classList.remove('drag-over-highlight');
            }
        });
        nestedContainer.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            nestedContainer.classList.remove('drag-over-highlight');
            handleWorkspaceDrop(block.id, block.children.length);
        });

        if (block.children && block.children.length > 0) {
            block.children.forEach((child, cIndex) => {
                nestedContainer.appendChild(createDropZone(block.id, cIndex));
                nestedContainer.appendChild(createVisualBlockElement(child, cIndex, true, block.id));
            });
            nestedContainer.appendChild(createDropZone(block.id, block.children.length));
        } else {
            const placeholder = document.createElement('div');
            placeholder.className = 'nested-drop-placeholder';
            placeholder.innerHTML = '<span>⬇ Seret blok ke sini untuk masuk ke loop</span>';
            nestedContainer.appendChild(placeholder);
        }

        wrapper.appendChild(nestedContainer);
    }

    return wrapper;
}

// Creates a thin visible drop zone indicator between blocks
function createDropZone(parentId, insertIndex) {
    const dz = document.createElement('div');
    dz.className = 'drop-zone-indicator';
    dz.setAttribute('data-parent-id', parentId || '');
    dz.setAttribute('data-insert-index', insertIndex);

    dz.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = dragState.source === 'workspace' ? 'move' : 'copy';
        dz.classList.add('drop-zone-active');
    });
    dz.addEventListener('dragleave', () => {
        dz.classList.remove('drop-zone-active');
    });
    dz.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dz.classList.remove('drop-zone-active');
        handleWorkspaceDrop(parentId || null, insertIndex);
    });
    return dz;
}

// Central drop handler: inserts or moves a block into position
function handleWorkspaceDrop(targetParentId, insertIndex) {
    const lvl = LEVELS[currentLevel];

    if (dragState.source === 'toolbox') {
        // Check block limit
        if (countTotalBlocks(workspaceBlocks) >= lvl.maxBlocks) {
            synth.playWrong();
            alert(`Batas maksimal blok untuk misi ini adalah ${lvl.maxBlocks} blok!`);
            return;
        }
        const newBlock = {
            id: `block-${Date.now()}-${Math.random()}`,
            type: dragState.type,
            loopCount: dragState.loopCount,
            children: []
        };
        if (targetParentId) {
            const parentLoop = findBlockById(workspaceBlocks, targetParentId);
            if (parentLoop && parentLoop.type === 'loop') {
                parentLoop.children.splice(insertIndex, 0, newBlock);
            }
        } else {
            workspaceBlocks.splice(insertIndex, 0, newBlock);
        }
        synth.playClick();
        renderWorkspace();

    } else if (dragState.source === 'workspace' && dragState.id) {
        // Reordering: remove from old position, insert at new position
        const movingBlock = findBlockById(workspaceBlocks, dragState.id);
        if (!movingBlock) return;

        // A loop cannot be dropped into itself or into one of its own children,
        // otherwise the block would be removed and never re-inserted (lost).
        if (targetParentId && (targetParentId === movingBlock.id || findBlockById(movingBlock.children || [], targetParentId))) {
            synth.playWrong();
            return;
        }

        // Clone the block to re-insert
        const blockClone = JSON.parse(JSON.stringify(movingBlock));

        // Find old index in original container before removal to adjust insert index
        let adjustedIndex = insertIndex;
        if (targetParentId === (dragState.parentId || null)) {
            const container = targetParentId ? findBlockById(workspaceBlocks, targetParentId).children : workspaceBlocks;
            const oldIndex = container.findIndex(b => b.id === dragState.id);
            if (oldIndex !== -1 && oldIndex < insertIndex) {
                adjustedIndex = insertIndex - 1;
            }
        }

        // Remove from original position
        if (dragState.parentId) {
            const oldParent = findBlockById(workspaceBlocks, dragState.parentId);
            if (oldParent) {
                oldParent.children = removeBlockById(oldParent.children, dragState.id);
            }
        } else {
            workspaceBlocks = removeBlockById(workspaceBlocks, dragState.id);
        }

        // Insert at new position
        if (targetParentId) {
            const newParent = findBlockById(workspaceBlocks, targetParentId);
            if (newParent && newParent.type === 'loop') {
                const clampedIndex = Math.max(0, Math.min(adjustedIndex, newParent.children.length));
                newParent.children.splice(clampedIndex, 0, blockClone);
            }
        } else {
            const clampedIndex = Math.max(0, Math.min(adjustedIndex, workspaceBlocks.length));
            workspaceBlocks.splice(clampedIndex, 0, blockClone);
        }

        synth.playClick();
        renderWorkspace();
    }
}


/* ==========================================================================
   ALGORITHM COMPILER & RUNTIME INTERPRETER
   ========================================================================== */
function runProgram() {
    if (isExecuting) return;
    if (workspaceBlocks.length === 0) {
        alert("Workspace kosong! Tambahkan beberapa blok instruksi dahulu.");
        return;
    }

    synth.playClick();
    isExecuting = true;
    dom.runProgramBtn.classList.add('hidden');
    dom.stopProgramBtn.classList.remove('hidden');

    // Compile high-level blocks into sequential executing instructions
    executionQueue = compileWorkspace(workspaceBlocks);

    // Reset robot start position before simulation runs
    const lvl = LEVELS[currentLevel];
    robotPos = { ...lvl.start };

    // Clear path highlights
    const tiles = dom.gridContainer.querySelectorAll('.grid-tile');
    tiles.forEach(t => t.classList.remove('active-step'));

    let currentQueueIdx = 0;

    // Start Simulation Step Timer
    executionInterval = setInterval(() => {
        if (currentQueueIdx >= executionQueue.length) {
            // Program completed execution but didn't reach portal
            clearInterval(executionInterval);
            verifyMissionOutcome(true); // check if they are standing on goal
            return;
        }

        const cmd = executionQueue[currentQueueIdx];

        // Visual Highlight of active executing code block in workspace
        highlightBlockInWorkspace(cmd.blockId);

        // Execute single instruction
        const stepSucceeded = executeInstructionStep(cmd);

        if (!stepSucceeded) {
            // Robot crashed/failed
            clearInterval(executionInterval);
            showFailureModal("Robot menabrak dinding pembatas laboratorium! Coba analisis dan susun ulang baris kodemu.");
            return;
        }

        // Add highlight trail to tile
        const activeTile = dom.gridContainer.querySelector(`[data-x="${robotPos.x}"][data-y="${robotPos.y}"]`);
        if (activeTile) {
            activeTile.classList.add('active-step');
        }

        // Check immediate Portal Success
        const lvlGoal = LEVELS[currentLevel].goal;
        if (robotPos.x === lvlGoal.x && robotPos.y === lvlGoal.y) {
            clearInterval(executionInterval);
            showSuccessModal();
            return;
        }

        currentQueueIdx++;
    }, 600); // 600ms per step simulation speed
}

function stopProgram() {
    if (executionInterval) {
        clearInterval(executionInterval);
        executionInterval = null;
    }
    isExecuting = false;
    dom.runProgramBtn.classList.remove('hidden');
    dom.stopProgramBtn.classList.add('hidden');

    // Remove executing highlights
    const blocks = dom.workspaceBlocksStack.querySelectorAll('.block-item');
    blocks.forEach(b => b.classList.remove('executing-highlight'));
}

// Visual highlighting
function highlightBlockInWorkspace(blockId) {
    const blocks = dom.workspaceBlocksStack.querySelectorAll('.block-item');
    blocks.forEach(b => {
        if (b.id === blockId) {
            b.classList.add('executing-highlight');
        } else {
            b.classList.remove('executing-highlight');
        }
    });
}

/**
 * Converts nested blocks tree into linear queue of operations for the grid executor
 */
function compileWorkspace(blocksArr) {
    let queue = [];

    blocksArr.forEach(block => {
        if (block.type === 'loop') {
            // Unroll loops recursively so nested loops (loop inside loop) also run
            for (let i = 0; i < block.loopCount; i++) {
                queue = queue.concat(compileWorkspace(block.children || []));
            }
        } else {
            queue.push({
                blockId: block.id,
                type: block.type
            });
        }
    });

    return queue;
}

/**
 * Mutates global robotPos state. Returns false if robot crashes
 */
function executeInstructionStep(cmd) {
    const lvl = LEVELS[currentLevel];

    // Check Conditional blocks trigger
    const onYellowTile = lvl.yellowTiles && lvl.yellowTiles.some(t => t.x === robotPos.x && t.y === robotPos.y);
    const onPurpleTile = lvl.purpleTiles && lvl.purpleTiles.some(t => t.x === robotPos.x && t.y === robotPos.y);

    if (cmd.type === 'if-yellow') {
        if (onYellowTile) {
            // Perform action: turn right
            turnRobot('RIGHT');
            synth.playMove();
            placeRobotElement();
        }
        return true;
    }

    if (cmd.type === 'if-purple') {
        if (onPurpleTile) {
            // Perform action: turn left
            turnRobot('LEFT');
            synth.playMove();
            placeRobotElement();
        }
        return true;
    }

    // Standard motion blocks
    if (cmd.type === 'move') {
        let newX = robotPos.x;
        let newY = robotPos.y;

        if (robotPos.dir === 'UP') newY--;
        if (robotPos.dir === 'RIGHT') newX++;
        if (robotPos.dir === 'DOWN') newY++;
        if (robotPos.dir === 'LEFT') newX--;

        // Collision validations
        if (newX < 0 || newX >= lvl.gridSize || newY < 0 || newY >= lvl.gridSize) {
            return false; // wall/boundary crash
        }

        const hitWall = lvl.walls.some(w => w.x === newX && w.y === newY);
        if (hitWall) {
            return false; // wall crash
        }

        // Apply motion
        robotPos.x = newX;
        robotPos.y = newY;
        synth.playMove();
        placeRobotElement();
        return true;
    }

    if (cmd.type === 'turn-left') {
        turnRobot('LEFT');
        synth.playMove();
        placeRobotElement();
        return true;
    }

    if (cmd.type === 'turn-right') {
        turnRobot('RIGHT');
        synth.playMove();
        placeRobotElement();
        return true;
    }

    return true;
}

function turnRobot(dirChange) {
    const directions = ['UP', 'RIGHT', 'DOWN', 'LEFT'];
    let idx = directions.indexOf(robotPos.dir);

    if (dirChange === 'RIGHT') {
        idx = (idx + 1) % 4;
    } else {
        idx = (idx + 3) % 4; // same as -1
    }

    robotPos.dir = directions[idx];
}

function verifyMissionOutcome(outOfSteps = false) {
    const lvl = LEVELS[currentLevel];
    if (robotPos.x === lvl.goal.x && robotPos.y === lvl.goal.y) {
        showSuccessModal();
    } else {
        if (outOfSteps) {
            showFailureModal("Algoritma selesai dieksekusi, namun Albi si Robot belum sampai di portal tujuan. Coba rancang kembali rute langkahnya!");
        }
    }
}


/* ==========================================================================
   MODAL DIALOGS DISPLAY
   ========================================================================== */
function showSuccessModal() {
    stopProgram();
    synth.playSuccess();

    // Store level completion
    if (!completedLevels.includes(currentLevel)) {
        completedLevels.push(currentLevel);
        saveProgress();
        reportToTeacher('Menyelesaikan Maze', `Misi ${currentLevel}`);
    }

    const lvl = LEVELS[currentLevel];

    dom.successModalTitle.innerText = "Misi Berhasil Terpecahkan! 🎉";
    dom.successModalDesc.innerText = `Luar biasa! Kamu berhasil menuntaskan tantangan ini dalam ${countTotalBlocks(workspaceBlocks)} blok pemrograman.`;
    dom.successLearningInsight.querySelector('span').innerText = lvl.insight;

    dom.successRetryBtn.onclick = () => {
        synth.playClick();
        dom.successModal.classList.remove('active');
        loadLevel(currentLevel);
    };

    if (currentLevel < TOTAL_MAZE_LEVELS) {
        dom.successNextBtn.innerText = "Misi Berikutnya →";
        dom.successNextBtn.onclick = () => {
            synth.playClick();
            dom.successModal.classList.remove('active');
            loadLevel(currentLevel + 1);
        };
    } else {
        dom.successNextBtn.innerText = "Selesai Misi Labirin! 🏆";
        dom.successNextBtn.onclick = () => {
            synth.playClick();
            dom.successModal.classList.remove('active');
            showScreen('level-selector-page');
            renderLevelsSelector();
        };
    }

    dom.successModal.classList.add('active');
}

function showFailureModal(message) {
    stopProgram();
    synth.playFailure();

    dom.failureModalTitle.innerText = "Aduh, Rute Bermasalah! 💥";
    dom.failureModalDesc.innerText = "Albi si Robot gagal mencapai koordinat portal.";
    dom.failureModalHint.innerText = message;

    dom.failureCloseBtn.onclick = () => {
        synth.playClick();
        dom.failureModal.classList.remove('active');
        resetSimulation();
    };

    dom.failureModal.classList.add('active');
}


/* ==========================================================================
   QUIZ ENGINE
   ========================================================================== */
function startQuiz() {
    quizIndex = 0;
    quizScore = 0;
    dom.nextQuestionBtn.classList.add('hidden');
    showScreen('quiz-page');
    loadQuizQuestion();
}

function loadQuizQuestion() {
    dom.nextQuestionBtn.classList.add('hidden');
    const qData = QUIZ_QUESTIONS[quizIndex];

    // Counter & progress bar
    dom.quizCounterText.innerText = `Pertanyaan ${quizIndex + 1} dari ${QUIZ_QUESTIONS.length}`;
    const progressPct = ((quizIndex) / QUIZ_QUESTIONS.length) * 100;
    dom.quizProgressFill.style.width = `${progressPct}%`;

    dom.quizQuestionText.innerText = qData.question;
    dom.quizOptionsContainer.innerHTML = '';

    qData.options.forEach((optText, oIdx) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn glass-panel';
        btn.innerText = optText;

        btn.addEventListener('click', () => {
            selectQuizOption(btn, oIdx);
        });

        dom.quizOptionsContainer.appendChild(btn);
    });
}

function selectQuizOption(selectedBtn, optionIdx) {
    const qData = QUIZ_QUESTIONS[quizIndex];

    // Disable all options once an answer is chosen
    const allButtons = dom.quizOptionsContainer.querySelectorAll('.option-btn');
    allButtons.forEach(b => {
        b.style.pointerEvents = 'none';
    });

    if (optionIdx === qData.correct) {
        // Correct Answer
        selectedBtn.classList.add('correct-reveal');
        synth.playCorrect();
        quizScore++;
    } else {
        // Wrong Answer
        selectedBtn.classList.add('wrong-reveal');
        // Reveal correct answer in green
        allButtons[qData.correct].classList.add('correct-reveal');
        synth.playWrong();
    }

    dom.nextQuestionBtn.classList.remove('hidden');
}

function nextQuizQuestion() {
    quizIndex++;
    if (quizIndex < QUIZ_QUESTIONS.length) {
        loadQuizQuestion();
    } else {
        // Finish Quiz!
        finishQuiz();
    }
}

function finishQuiz() {
    // Update progress bar to 100%
    dom.quizProgressFill.style.width = `100%`;

    const total = QUIZ_QUESTIONS.length;
    const passed = quizScore >= QUIZ_PASS_SCORE;
    lastQuizScore = quizScore;
    if (passed) mazeQuizCompleted = true; // set before reporting so the teacher sees "Lulus"
    saveProgress();
    reportToTeacher('Mengerjakan Kuis', `Nilai ${quizScore}/${total} · ${passed ? 'Lulus' : 'Belum lulus'}`);

    if (!passed) {
        synth.playFailure();
        alert(`Nilai kuismu ${quizScore} dari ${total}. Kamu membutuhkan minimal ${QUIZ_PASS_SCORE} jawaban benar untuk lulus.\n\nPelajari kembali materinya, lalu coba kuis sekali lagi!`);
        showScreen('landing-page');
        updateCertificateCard();
        return;
    }

    synth.playSuccess();
    mazeQuizCompleted = true;
    saveProgress();

    const remaining = [];
    if ((new Set(completedLevels)).size < Object.keys(LEVELS).length) remaining.push('Mode Labirin (Maze)');
    if ((new Set(completedPuzzleLevels)).size < Object.keys(PUZZLE_LEVELS).length) remaining.push('Mode Teka-Teki (Puzzle)');
    if ((new Set(completedPatternLevels)).size < Object.keys(PATTERN_LEVELS).length) remaining.push('Mode Pengenalan Pola');

    let message = `Selamat, kamu LULUS Kuis Algoritma dengan nilai ${quizScore} dari ${total}!`;
    if (remaining.length > 0) {
        message += `\n\nSelesaikan juga ${remaining.join(' dan ')} untuk membuka Sertifikat Kelulusan di Menu Utama.`;
    } else {
        message += `\n\nSertifikat Kelulusan kini bisa diklaim melalui Menu Utama.`;
    }
    alert(message);
    showScreen('landing-page');
    updateCertificateCard();
}

/* ==========================================================================
   PUZZLE GAME MODE ENGINE
   ========================================================================== */
function loadPuzzleLevel(levelId) {
    currentPuzzleLevel = levelId;
    saveProgress();
    renderPuzzleLevelSelect();

    const lvl = PUZZLE_LEVELS[levelId];

    dom.puzzleLevelTitle.innerText = lvl.title;
    dom.puzzleLevelTag.innerText = lvl.concept;
    dom.puzzleLevelTag.className = `level-concept-tag ${lvl.badge || 'seq'}`;
    dom.puzzleIntroText.innerText = lvl.instruction;
    dom.puzzleLevelCounter.innerText = `Teka-Teki ${levelId} dari ${Object.keys(PUZZLE_LEVELS).length} · Tingkat ${getLevelTier(levelId).name}`;

    // Scramble/Shuffle the blocks
    do {
        puzzleBlocks = shuffleArray(JSON.parse(JSON.stringify(lvl.blocks)));
    } while (isPuzzleAlreadyCorrect()); // make sure it's not already correct by accident

    renderPuzzleWorkspace();
    showScreen('puzzle-game-page');
}

// Main order (by correctOrder) plus any alternative orders that are also logical
function getAcceptedPuzzleOrders(lvl) {
    const mainOrder = lvl.blocks.slice()
        .sort((a, b) => a.correctOrder - b.correctOrder)
        .map(b => b.id);
    return [mainOrder].concat(lvl.altOrders || []);
}

function isPuzzleAlreadyCorrect() {
    const currentIds = puzzleBlocks.map(b => b.id);
    return getAcceptedPuzzleOrders(PUZZLE_LEVELS[currentPuzzleLevel]).some(order =>
        order.length === currentIds.length && order.every((id, i) => id === currentIds[i])
    );
}

function renderPuzzleWorkspace() {
    dom.puzzleBlocksList.innerHTML = '';

    puzzleBlocks.forEach((block, idx) => {
        const item = document.createElement('div');
        item.className = 'puzzle-block-item block-item block-action';
        // Indent nested steps: every 2 leading spaces = one level deeper
        const indentLevel = Math.floor((block.text.length - block.text.trimStart().length) / 2);
        if (indentLevel > 0) {
            item.style.marginLeft = `${indentLevel * 20}px`;
        }

        item.innerHTML = `
            <span class="puzzle-block-label">${block.text}</span>
            <div class="puzzle-block-controls" onclick="event.stopPropagation()">
                <button class="btn-puzzle-control up-btn" title="Pindahkan Ke Atas" data-index="${idx}">▲</button>
                <button class="btn-puzzle-control down-btn" title="Pindahkan Ke Bawah" data-index="${idx}">▼</button>
            </div>
        `;

        // Add HTML5 Drag & Drop Support
        item.setAttribute('draggable', 'true');
        item.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', idx);
            item.classList.add('block-dragging');
        });
        item.addEventListener('dragend', () => {
            item.classList.remove('block-dragging');
        });
        item.addEventListener('dragover', (e) => {
            e.preventDefault();
        });
        item.addEventListener('drop', (e) => {
            e.preventDefault();
            const fromIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
            const toIdx = idx;
            if (fromIdx !== toIdx) {
                // Move item
                const moved = puzzleBlocks.splice(fromIdx, 1)[0];
                puzzleBlocks.splice(toIdx, 0, moved);
                synth.playClick();
                renderPuzzleWorkspace();
            }
        });

        // Add Click control handlers for Up/Down buttons
        const upBtn = item.querySelector('.up-btn');
        const downBtn = item.querySelector('.down-btn');

        upBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (idx > 0) {
                // Swap with previous
                const temp = puzzleBlocks[idx];
                puzzleBlocks[idx] = puzzleBlocks[idx - 1];
                puzzleBlocks[idx - 1] = temp;
                synth.playClick();
                renderPuzzleWorkspace();
            }
        });

        downBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (idx < puzzleBlocks.length - 1) {
                // Swap with next
                const temp = puzzleBlocks[idx];
                puzzleBlocks[idx] = puzzleBlocks[idx + 1];
                puzzleBlocks[idx + 1] = temp;
                synth.playClick();
                renderPuzzleWorkspace();
            }
        });

        dom.puzzleBlocksList.appendChild(item);
    });
}

function checkPuzzleSolution() {
    const isCorrect = isPuzzleAlreadyCorrect();

    if (isCorrect) {
        synth.playSuccess();
        // Add to completed
        if (!completedPuzzleLevels.includes(currentPuzzleLevel)) {
            completedPuzzleLevels.push(currentPuzzleLevel);
            saveProgress();
            reportToTeacher('Menyelesaikan Teka-Teki', `Teka-Teki ${currentPuzzleLevel}`);
        }

        // Show Success Modal tailored for puzzle
        dom.successModalTitle.innerText = "Logika Algoritma Benar! 🎉";
        dom.successModalDesc.innerText = `Luar biasa! Kamu berhasil menyusun teka-teki logika ini secara runtut dan tepat.`;
        
        const lvl = PUZZLE_LEVELS[currentPuzzleLevel];
        let insight = lvl.insight || "Algoritma harus runtut agar dapat dipahami dan dijalankan komputer dengan benar.";
        if (!lvl.insight && currentPuzzleLevel === 3) insight = "Percabangan (If-Else) memungkinkan algoritma mengambil jalan berbeda tergantung pada kondisi luar.";
        if (!lvl.insight && currentPuzzleLevel === 4) insight = "Perulangan (Loop) menyederhanakan kode yang berjalan berulang kali agar lebih efisien.";
        dom.successLearningInsight.querySelector('span').innerText = insight;

        // Custom modal controls for Puzzle Mode
        dom.successRetryBtn.onclick = () => {
            dom.successModal.classList.remove('active');
            loadPuzzleLevel(currentPuzzleLevel);
        };
        
        dom.successNextBtn.onclick = () => {
            dom.successModal.classList.remove('active');
            if (currentPuzzleLevel < Object.keys(PUZZLE_LEVELS).length) {
                loadPuzzleLevel(currentPuzzleLevel + 1);
            } else {
                // Done all puzzle levels!
                alert(`Selamat! Kamu menyelesaikan seluruh ${Object.keys(PUZZLE_LEVELS).length} Teka-Teki Logika Mode Puzzle!`);
                showScreen('landing-page');
                updateCertificateCard();
            }
        };

        dom.successModal.classList.add('active');
    } else {
        synth.playWrong();
        dom.failureModalTitle.innerText = "Logikamu Belum Tepat! ❌";
        dom.failureModalDesc.innerText = "Robot Albi tidak bisa menjalankan urutan langkah ini.";
        dom.failureModalHint.innerText = "Periksa kembali logika urutan langkahmu. Apakah ada tindakan yang terbalik atau mendahului tindakan lain?";
        
        dom.failureCloseBtn.onclick = () => {
            dom.failureModal.classList.remove('active');
        };
        dom.failureModal.classList.add('active');
    }
}


/* ==========================================================================
   PATTERN RECOGNITION GAME MODE ENGINE
   ========================================================================== */
function loadPatternLevel(levelId) {
    currentPatternLevel = levelId;
    selectedPatternOption = null;
    saveProgress();
    renderPatternLevelSelect();

    const lvl = PATTERN_LEVELS[levelId];

    // Shuffle answer positions so the correct answer is not always in the same place
    patternOptionOrder = shuffleArray(lvl.options.map((_, i) => i));

    dom.patternLevelTitle.innerText = lvl.title;
    dom.patternLevelTag.innerText = lvl.concept;
    dom.patternLevelTag.className = `level-concept-tag ${['seq', 'loop', 'cond', 'debug', 'cond'][Math.ceil(levelId / PATTERN_TIER_SIZE) - 1] || 'seq'}`;
    dom.patternIntroText.innerText = lvl.instruction;
    dom.patternLevelCounter.innerText = `Pola ${levelId} dari ${Object.keys(PATTERN_LEVELS).length} · Tingkat ${getLevelTier(levelId, PATTERN_TIER_SIZE).name}`;

    renderPatternWorkspace();
    showScreen('pattern-game-page');
}

function renderPatternWorkspace() {
    const lvl = PATTERN_LEVELS[currentPatternLevel];
    
    // Render Pattern Sequence Cards
    dom.patternDisplayArea.innerHTML = '';
    lvl.sequence.forEach(item => {
        const div = document.createElement('div');
        div.className = 'pattern-item';
        if (item === '?') {
            div.classList.add('question-mark');
            div.innerText = selectedPatternOption !== null ? lvl.options[patternOptionOrder[selectedPatternOption]] : '?';
        } else {
            div.innerText = item;
        }
        dom.patternDisplayArea.appendChild(div);
    });

    // Render Answer Options
    dom.patternOptionsList.innerHTML = '';
    patternOptionOrder.forEach((originalIdx, oIdx) => {
        const optText = lvl.options[originalIdx];
        const btn = document.createElement('button');
        btn.className = 'pattern-option-btn';
        if (selectedPatternOption === oIdx) {
            btn.classList.add('selected');
        }
        btn.innerText = optText;

        btn.addEventListener('click', () => {
            synth.playClick();
            selectedPatternOption = oIdx;
            renderPatternWorkspace();
        });

        dom.patternOptionsList.appendChild(btn);
    });
}

function checkPatternSolution() {
    if (selectedPatternOption === null) {
        synth.playWrong();
        alert("Pilih salah satu pilihan jawaban terlebih dahulu!");
        return;
    }

    const lvl = PATTERN_LEVELS[currentPatternLevel];
    const correctDisplayIdx = patternOptionOrder.indexOf(lvl.correctIndex);
    const isCorrect = (selectedPatternOption === correctDisplayIdx);

    const optionBtns = dom.patternOptionsList.querySelectorAll('.pattern-option-btn');

    if (isCorrect) {
        synth.playSuccess();
        if (optionBtns[selectedPatternOption]) {
            optionBtns[selectedPatternOption].classList.add('correct-reveal');
        }

        if (!completedPatternLevels.includes(currentPatternLevel)) {
            completedPatternLevels.push(currentPatternLevel);
            saveProgress();
            reportToTeacher('Menyelesaikan Pola', `Pola ${currentPatternLevel}`);
        }

        dom.successModalTitle.innerText = "Pola Berhasil Ditebak! 🎉";
        dom.successModalDesc.innerText = `Hebat sekali! Kamu berhasil mengenali susunan pola ini dengan tepat.`;
        dom.successLearningInsight.querySelector('span').innerText = lvl.insight;

        dom.successRetryBtn.onclick = () => {
            dom.successModal.classList.remove('active');
            loadPatternLevel(currentPatternLevel);
        };

        dom.successNextBtn.onclick = () => {
            dom.successModal.classList.remove('active');
            const totalPatterns = Object.keys(PATTERN_LEVELS).length;
            if (currentPatternLevel < totalPatterns) {
                loadPatternLevel(currentPatternLevel + 1);
            } else {
                alert(`Selamat! Kamu telah menyelesaikan seluruh ${totalPatterns} Level Mode Pengenalan Pola!`);
                showScreen('landing-page');
                updateCertificateCard();
            }
        };

        dom.successModal.classList.add('active');
    } else {
        synth.playWrong();
        if (optionBtns[selectedPatternOption]) {
            optionBtns[selectedPatternOption].classList.add('wrong-reveal');
        }
        if (optionBtns[correctDisplayIdx]) {
            optionBtns[correctDisplayIdx].classList.add('correct-reveal');
        }

        dom.failureModalTitle.innerText = "Pilihan Pola Belum Tepat! ❌";
        dom.failureModalDesc.innerText = "Elemen yang kamu pilih tidak cocok dengan urutan pola.";
        dom.failureModalHint.innerText = "Perhatikan kembali perulangan atau hubungan antar elemen dalam deret pola tersebut.";

        dom.failureCloseBtn.onclick = () => {
            dom.failureModal.classList.remove('active');
            renderPatternWorkspace();
        };

        dom.failureModal.classList.add('active');
    }
}


function updateCertificateCard() {
    const totalPuzzles = Object.keys(PUZZLE_LEVELS).length;
    const totalPatterns = Object.keys(PATTERN_LEVELS).length;
    const mazeDoneCount = (new Set(completedLevels)).size;
    const puzzleDoneCount = (new Set(completedPuzzleLevels)).size;
    const patternDoneCount = (new Set(completedPatternLevels)).size;

    const mazeDone = mazeDoneCount >= TOTAL_MAZE_LEVELS;
    const puzzleDone = puzzleDoneCount >= totalPuzzles;
    const patternDone = patternDoneCount >= totalPatterns;
    const allDone = mazeDone && puzzleDone && patternDone;

    if (allDone) {
        dom.modeCertBtn.classList.remove('locked');
        dom.modeCertBtn.classList.add('unlocked');
        dom.certLockLabel.innerText = mazeQuizCompleted ? '🏆 Klik untuk Lihat & Cetak Sertifikat!' : '🏆 Klik untuk Uji Kuis & Klaim Sertifikat!';
    } else {
        dom.modeCertBtn.classList.remove('unlocked');
        dom.modeCertBtn.classList.add('locked');

        let parts = [];
        if (!mazeDone) parts.push(`Maze ${mazeDoneCount}/${TOTAL_MAZE_LEVELS}`);
        if (!puzzleDone) parts.push(`Puzzle ${puzzleDoneCount}/${totalPuzzles}`);
        if (!patternDone) parts.push(`Pola ${patternDoneCount}/${totalPatterns}`);

        dom.certLockLabel.innerText = `🔒 Belum Terbuka (${parts.join(' & ')})`;
    }
}


// Initialize application on load
window.addEventListener('DOMContentLoaded', () => {
    initApp();
});
