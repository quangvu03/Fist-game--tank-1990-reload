/**
 * Authentic Tank Battle 1990 (Battle City) Retro Pixel Music Engine
 *
 * Soundtracks:
 * 1. TITLE / LOBBY: BEETHOVEN PIANO (60 BPM, Rich, Resonant, Classical Grand Piano)
 * 2. CAMPAIGN:      ĐẠI CHIẾN XE TĂNG 1990 (114 BPM, Legendary Battle City Arcade Theme)
 *                   - Giai điệu huyền thoại Tank 1990 kinh điển (G3-C4-E4-G4-C5...).
 *                   - Âm sắc NES Famicom thập niên 90 tròn trịa, vui tươi, hào hùng, cực kỳ hợp game!
 *                   - Âm lượng to, rõ ràng, sống động, không bị nhỏ hay chìm tiếng.
 * 3. SURVIVAL:      ĐUA ĐIỂM SINH TỒN 1990 (118 BPM, High-Score Retro Arcade Rush)
 * 4. BOSS:          CHIẾN HẠM TITAN (122 BPM, Heavy Retro Arcade Showdown)
 * 5. VICTORY:       CHIẾN THẮNG HOÀN TOÀN - STAGE CLEAR 1990
 * 6. GAME OVER:     GAME OVER / CONTINUE?
 *
 * ACOUSTIC POLISH:
 * - Âm lượng tổng Full Power (Volume: 1.0, Lead 0.62, Bass 0.70, Drums 0.58).
 * - Sử dụng Peak Limiter (-2dB) thay vì nén dìm âm, giúp nhạc to rõ, uy lực, không bị méo tiếng.
 * - Bộ lọc 2800Hz giữ nguyên độ sáng và chi tiết của giai điệu, loại bỏ hoàn toàn dải tần chói gắt.
 */

export type MusicTrack = 'TITLE' | 'CAMPAIGN' | 'SURVIVAL' | 'BOSS' | 'VICTORY' | 'GAME_OVER' | 'SILENCE';

// Musical Note Frequency Map (A4 = 440 Hz standard tuning)
const NOTE_FREQS: Record<string, number> = {
  // Octave 1 & 2 (NES Bass Range)
  C2: 65.41, 'C#2': 69.30, Db2: 69.30, D2: 73.42, 'D#2': 77.78, Eb2: 77.78,
  E2: 82.41, F2: 87.31, 'F#2': 92.50, Gb2: 92.50, G2: 98.00, 'G#2': 103.83,
  Ab2: 103.83, A2: 110.00, 'A#2': 116.54, Bb2: 116.54, B2: 123.47,

  // Octave 3 (Warm Harmony / Rhythm)
  C3: 130.81, 'C#3': 138.59, Db3: 138.59, D3: 146.83, 'D#3': 155.56, Eb3: 155.56,
  E3: 164.81, F3: 174.61, 'F#3': 185.00, Gb3: 185.00, G3: 196.00, 'G#3': 207.65,
  Ab3: 207.65, A3: 220.00, 'A#3': 233.08, Bb3: 233.08, B3: 246.94,

  // Octave 4 (Classic 80s/90s Arcade Lead Melody)
  C4: 261.63, 'C#4': 277.18, Db4: 277.18, D4: 293.66, 'D#4': 311.13, Eb4: 311.13,
  E4: 329.63, F4: 349.23, 'F#4': 369.99, Gb4: 369.99, G4: 392.00, 'G#4': 415.30,
  Ab4: 415.30, A4: 440.00, 'A#4': 466.16, Bb4: 466.16, B4: 493.88,

  // Octave 5 (Bright Arcade Chime)
  C5: 523.25, 'C#5': 554.37, Db5: 554.37, D5: 587.33, 'D#5': 622.25, Eb5: 622.25,
  E5: 659.25, F5: 698.46, 'F#5': 739.99, Gb5: 739.99, G5: 783.99, 'G#5': 830.61,
  Ab5: 830.61, A5: 880.00, 'A#5': 932.33, Bb5: 932.33, B5: 987.77,

  // Octave 6
  C6: 1046.50, D6: 1174.66, E6: 1318.51, G6: 1567.98,
};

type DrumType = 'KICK' | 'SNARE' | 'SNARE_ROLL' | 'HIHAT_CLOSED' | 'CRASH' | 'NONE';

interface NoteStep {
  lead?: string;
  leadLength?: number; // In sixteenth note multiples
  harmony?: string;
  bass?: string;
  drum?: DrumType;
}

interface TrackScore {
  bpm: number;
  loopStart: number;
  style: 'BEETHOVEN' | 'TANK_ARCADE';
  filterCutoff: number;
  leadGain: number;
  harmonyGain: number;
  bassGain: number;
  steps: NoteStep[];
}

// ---------------------------------------------------------------------------
// 1. LOBBY / SẢNH CHỜ: BEETHOVEN PIANO (60 BPM, To, Rõ, Êm ái quý phái)
// ---------------------------------------------------------------------------
const TITLE_TRACK: TrackScore = {
  bpm: 60,
  loopStart: 0,
  style: 'BEETHOVEN',
  filterCutoff: 1400,
  leadGain: 0.62,    // Âm lượng to, rõ ràng
  harmonyGain: 0.38,
  bassGain: 0.65,
  steps: [
    { lead: 'E4', leadLength: 2, harmony: 'A2', drum: 'NONE' },
    { drum: 'NONE' },
    { lead: 'D#4', leadLength: 2, drum: 'NONE' },
    { drum: 'NONE' },
    { lead: 'E4', leadLength: 2, harmony: 'E3', drum: 'NONE' },
    { drum: 'NONE' },
    { lead: 'D#4', leadLength: 2, drum: 'NONE' },
    { drum: 'NONE' },

    { lead: 'E4', leadLength: 2, drum: 'NONE' },
    { drum: 'NONE' },
    { lead: 'B3', leadLength: 2, harmony: 'G#2', drum: 'NONE' },
    { drum: 'NONE' },
    { lead: 'D4', leadLength: 2, drum: 'NONE' },
    { drum: 'NONE' },
    { lead: 'C4', leadLength: 2, harmony: 'A2', drum: 'NONE' },
    { drum: 'NONE' },

    { lead: 'A3', leadLength: 4, harmony: 'E3', bass: 'A2', drum: 'NONE' },
    { drum: 'NONE' },
    { harmony: 'C3', drum: 'NONE' },
    { drum: 'NONE' },
    { harmony: 'E3', drum: 'NONE' },
    { drum: 'NONE' },
    { harmony: 'A3', drum: 'NONE' },
    { drum: 'NONE' },

    { lead: 'C3', leadLength: 2, harmony: 'B2', bass: 'E2', drum: 'NONE' },
    { drum: 'NONE' },
    { lead: 'E3', leadLength: 2, drum: 'NONE' },
    { drum: 'NONE' },
    { lead: 'G#3', leadLength: 2, harmony: 'E3', drum: 'NONE' },
    { drum: 'NONE' },
    { lead: 'B3', leadLength: 2, harmony: 'G#3', drum: 'NONE' },
    { drum: 'NONE' },

    { lead: 'C4', leadLength: 4, harmony: 'A3', bass: 'A2', drum: 'NONE' },
    { drum: 'NONE' },
    { harmony: 'E3', drum: 'NONE' },
    { drum: 'NONE' },
    { harmony: 'A3', drum: 'NONE' },
    { drum: 'NONE' },
    { harmony: 'C4', drum: 'NONE' },
    { drum: 'NONE' },

    { lead: 'E4', leadLength: 4, harmony: 'G#3', bass: 'C#2', drum: 'NONE' },
    { drum: 'NONE' },
    { harmony: 'C#3', drum: 'NONE' },
    { drum: 'NONE' },
    { lead: 'G#4', leadLength: 4, harmony: 'C#4', bass: 'C#2', drum: 'NONE' },
    { drum: 'NONE' },
    { harmony: 'E3', drum: 'NONE' },
    { drum: 'NONE' },

    { lead: 'A4', leadLength: 4, harmony: 'E3', bass: 'A1', drum: 'NONE' },
    { drum: 'NONE' },
    { harmony: 'C#3', drum: 'NONE' },
    { drum: 'NONE' },
    { lead: 'G#4', leadLength: 4, harmony: 'D#3', bass: 'B1', drum: 'NONE' },
    { drum: 'NONE' },
    { harmony: 'B2', drum: 'NONE' },
    { drum: 'NONE' },

    { lead: 'E4', leadLength: 6, harmony: 'B3', bass: 'E2', drum: 'NONE' },
    { drum: 'NONE' },
    { harmony: 'G#3', drum: 'NONE' },
    { drum: 'NONE' },
    { harmony: 'B3', drum: 'NONE' },
    { drum: 'NONE' },
    { harmony: 'E3', drum: 'NONE' },
    { drum: 'NONE' },
  ],
};

// ---------------------------------------------------------------------------
// 2. CAMPAIGN / CHIẾN DỊCH: "ĐẠI CHIẾN XE TĂNG 1990" (114 BPM)
// GIAI ĐIỆU BATTLE CITY / TANK 1990 HUYỀN THOẠI TUỔI THƠ
// - Nhịp 114 BPM: Vui tươi, hào hứng, nảy lửa, đúng chất game 4 nút kinh điển!
// - Mở đầu bằng nhạc hiệu xuất trận Tank 1990: G3 -> C4 -> E4 -> G4 -> C5
// - Điệp khúc phiêu lưu thiết giáp cuốn hút, bass đi bộ nhún nhảy
// - Âm lượng to, đầm, không chói, cực kỳ bắt tai!
// ---------------------------------------------------------------------------
const CAMPAIGN_TRACK: TrackScore = {
  bpm: 114, // Tốc độ chuẩn Famicom Tank 1990
  loopStart: 0,
  style: 'TANK_ARCADE',
  filterCutoff: 2800,
  leadGain: 0.60,     // Âm lượng lớn, rõ nét
  harmonyGain: 0.38,
  bassGain: 0.70,
  steps: [
    // Bar 1 - Nhạc hiệu huyền thoại Tank 1990 xuất kích (G3 -> C4 -> E4 -> G4 -> C5)
    { lead: 'G3', leadLength: 1, harmony: 'C3', bass: 'C2', drum: 'KICK' },
    { lead: 'C4', leadLength: 1, harmony: 'E3', bass: 'C3', drum: 'NONE' },
    { lead: 'E4', leadLength: 1, harmony: 'G3', bass: 'G2', drum: 'HIHAT_CLOSED' },
    { lead: 'G4', leadLength: 1, harmony: 'C4', bass: 'C3', drum: 'NONE' },
    { lead: 'C5', leadLength: 2, harmony: 'E4', bass: 'C2', drum: 'SNARE' },
    { bass: 'G2', drum: 'NONE' },
    { lead: 'B4', leadLength: 1, harmony: 'G4', bass: 'C3', drum: 'KICK' },
    { lead: 'A4', leadLength: 1, harmony: 'F4', bass: 'G2', drum: 'HIHAT_CLOSED' },

    // Bar 2 - Giai điệu xe tăng xung trận vui nhộn (C Major -> G Major)
    { lead: 'G4', leadLength: 2, harmony: 'E4', bass: 'C2', drum: 'KICK' },
    { bass: 'E2', drum: 'NONE' },
    { lead: 'C5', leadLength: 2, harmony: 'G4', bass: 'G2', drum: 'HIHAT_CLOSED' },
    { bass: 'C3', drum: 'NONE' },
    { lead: 'E5', leadLength: 2, harmony: 'C5', bass: 'C2', drum: 'SNARE' },
    { bass: 'G2', drum: 'NONE' },
    { lead: 'D5', leadLength: 1, harmony: 'B4', bass: 'G2', drum: 'KICK' },
    { lead: 'C5', leadLength: 1, harmony: 'A4', bass: 'D3', drum: 'HIHAT_CLOSED' },

    // Bar 3 - Khúc vượt chướng ngại vật gạch thép (Am -> F Major)
    { lead: 'B4', leadLength: 2, harmony: 'G4', bass: 'A2', drum: 'KICK' },
    { bass: 'E2', drum: 'NONE' },
    { lead: 'C5', leadLength: 2, harmony: 'A4', bass: 'A2', drum: 'HIHAT_CLOSED' },
    { bass: 'C3', drum: 'NONE' },
    { lead: 'D5', leadLength: 2, harmony: 'B4', bass: 'F2', drum: 'SNARE' },
    { bass: 'A2', drum: 'NONE' },
    { lead: 'E5', leadLength: 2, harmony: 'C5', bass: 'F2', drum: 'KICK' },
    { bass: 'C3', drum: 'HIHAT_CLOSED' },

    // Bar 4 - Bắn phá căn cứ địch & Crash cymbal vang dội
    { lead: 'F5', leadLength: 2, harmony: 'D5', bass: 'G2', drum: 'CRASH' },
    { lead: 'E5', leadLength: 1, harmony: 'C5', bass: 'D3', drum: 'NONE' },
    { lead: 'D5', leadLength: 1, harmony: 'B4', bass: 'G2', drum: 'HIHAT_CLOSED' },
    { lead: 'C5', leadLength: 2, harmony: 'G4', bass: 'C2', drum: 'SNARE' },
    { bass: 'G2', drum: 'NONE' },
    { lead: 'D5', leadLength: 1, harmony: 'B4', bass: 'G2', drum: 'KICK' },
    { lead: 'B4', leadLength: 1, harmony: 'G4', bass: 'D3', drum: 'HIHAT_CLOSED' },

    // Bar 5 - Phân đoạn 2: Điệp khúc tuổi thơ 8-bit hào sảng
    { lead: 'C5', leadLength: 2, harmony: 'G4', bass: 'C2', drum: 'KICK' },
    { bass: 'G2', drum: 'NONE' },
    { lead: 'C5', leadLength: 1, harmony: 'E4', bass: 'C3', drum: 'HIHAT_CLOSED' },
    { lead: 'B4', leadLength: 1, harmony: 'D4', bass: 'G2', drum: 'NONE' },
    { lead: 'A4', leadLength: 2, harmony: 'C4', bass: 'A2', drum: 'SNARE' },
    { bass: 'E2', drum: 'NONE' },
    { lead: 'G4', leadLength: 2, harmony: 'B3', bass: 'E2', drum: 'KICK' },
    { bass: 'B2', drum: 'HIHAT_CLOSED' },

    // Bar 6 - Bước tiến thần tốc bảo vệ Đại Bàng
    { lead: 'F4', leadLength: 1, harmony: 'C4', bass: 'F2', drum: 'KICK' },
    { lead: 'G4', leadLength: 1, harmony: 'D4', bass: 'A2', drum: 'NONE' },
    { lead: 'A4', leadLength: 2, harmony: 'F4', bass: 'C3', drum: 'HIHAT_CLOSED' },
    { bass: 'F2', drum: 'NONE' },
    { lead: 'C5', leadLength: 2, harmony: 'A4', bass: 'G2', drum: 'SNARE' },
    { bass: 'D3', drum: 'NONE' },
    { lead: 'B4', leadLength: 2, harmony: 'G4', bass: 'G2', drum: 'KICK' },
    { bass: 'B2', drum: 'HIHAT_CLOSED' },

    // Bar 7 - Tăng tốc dồn dập chuẩn bị lặp
    { lead: 'C5', leadLength: 2, harmony: 'E4', bass: 'C2', drum: 'KICK' },
    { lead: 'D5', leadLength: 1, harmony: 'F4', bass: 'G2', drum: 'NONE' },
    { lead: 'E5', leadLength: 1, harmony: 'G4', bass: 'C3', drum: 'HIHAT_CLOSED' },
    { lead: 'G5', leadLength: 2, harmony: 'C5', bass: 'C2', drum: 'SNARE' },
    { lead: 'F5', leadLength: 1, harmony: 'D5', bass: 'G2', drum: 'NONE' },
    { lead: 'E5', leadLength: 1, harmony: 'C5', bass: 'E2', drum: 'KICK' },
    { lead: 'D5', leadLength: 2, harmony: 'B4', bass: 'G2', drum: 'HIHAT_CLOSED' },
    { bass: 'B2', drum: 'NONE' },

    // Bar 8 - Kết thúc hào hứng với điểm trống 8-bit Snare Roll
    { lead: 'C5', leadLength: 4, harmony: 'G4', bass: 'C2', drum: 'KICK' },
    { bass: 'G2', drum: 'NONE' },
    { bass: 'C3', drum: 'HIHAT_CLOSED' },
    { lead: 'G4', leadLength: 2, harmony: 'E4', bass: 'G2', drum: 'SNARE' },
    { lead: 'C4', leadLength: 2, harmony: 'C3', bass: 'C2', drum: 'CRASH' },
    { drum: 'SNARE_ROLL' },
    { drum: 'NONE' },
    { drum: 'NONE' },
  ],
};

// ---------------------------------------------------------------------------
// 3. SURVIVAL / SINH TỒN: "ĐUA ĐIỂM SINH TỒN 1990" (118 BPM)
// Nhạc arcade thập niên 90 sôi nổi, kịch tính, tiết tấu dồn dập
// ---------------------------------------------------------------------------
const SURVIVAL_TRACK: TrackScore = {
  bpm: 118,
  loopStart: 0,
  style: 'TANK_ARCADE',
  filterCutoff: 2800,
  leadGain: 0.62,
  harmonyGain: 0.38,
  bassGain: 0.72,
  steps: [
    // Bar 1 - Nhịp rượt đuổi dồn dập (D Minor Arcade)
    { lead: 'D4', leadLength: 1, harmony: 'A3', bass: 'D2', drum: 'KICK' },
    { lead: 'F4', leadLength: 1, harmony: 'D4', bass: 'A2', drum: 'NONE' },
    { lead: 'A4', leadLength: 2, harmony: 'F4', bass: 'D3', drum: 'HIHAT_CLOSED' },
    { lead: 'D5', leadLength: 2, harmony: 'A4', bass: 'D2', drum: 'SNARE' },
    { lead: 'C5', leadLength: 1, harmony: 'G4', bass: 'A2', drum: 'KICK' },
    { lead: 'Bb4', leadLength: 1, harmony: 'F4', bass: 'D2', drum: 'HIHAT_CLOSED' },
    { lead: 'A4', leadLength: 2, harmony: 'E4', bass: 'A2', drum: 'NONE' },
    { bass: 'D2', drum: 'NONE' },

    // Bar 2 - Bb Major -> C Major
    { lead: 'Bb4', leadLength: 2, harmony: 'F4', bass: 'Bb2', drum: 'KICK' },
    { bass: 'F3', drum: 'NONE' },
    { lead: 'D5', leadLength: 2, harmony: 'Bb4', bass: 'Bb2', drum: 'HIHAT_CLOSED' },
    { lead: 'C5', leadLength: 2, harmony: 'G4', bass: 'C3', drum: 'SNARE' },
    { lead: 'E5', leadLength: 2, harmony: 'C5', bass: 'C2', drum: 'KICK' },
    { lead: 'D5', leadLength: 2, harmony: 'A4', bass: 'D2', drum: 'HIHAT_CLOSED' },
    { bass: 'A2', drum: 'NONE' },
    { bass: 'D3', drum: 'NONE' },

    // Bar 3 - Leo nốt kịch tính
    { lead: 'G4', leadLength: 2, harmony: 'D4', bass: 'G2', drum: 'KICK' },
    { bass: 'D3', drum: 'NONE' },
    { lead: 'Bb4', leadLength: 2, harmony: 'G4', bass: 'G2', drum: 'HIHAT_CLOSED' },
    { lead: 'D5', leadLength: 2, harmony: 'Bb4', bass: 'G3', drum: 'SNARE' },
    { lead: 'C5', leadLength: 1, harmony: 'G4', bass: 'C3', drum: 'KICK' },
    { lead: 'Bb4', leadLength: 1, harmony: 'F4', bass: 'C2', drum: 'HIHAT_CLOSED' },
    { lead: 'A4', leadLength: 2, harmony: 'E4', bass: 'A2', drum: 'NONE' },
    { lead: 'G4', leadLength: 2, harmony: 'C#4', bass: 'A1', drum: 'NONE' },

    // Bar 4 - Tấn công dồn dập
    { lead: 'F4', leadLength: 1, harmony: 'D4', bass: 'D2', drum: 'KICK' },
    { lead: 'E4', leadLength: 1, harmony: 'C#4', bass: 'A2', drum: 'NONE' },
    { lead: 'F4', leadLength: 1, harmony: 'D4', bass: 'D3', drum: 'HIHAT_CLOSED' },
    { lead: 'G4', leadLength: 1, harmony: 'E4', bass: 'D2', drum: 'NONE' },
    { lead: 'A4', leadLength: 2, harmony: 'F4', bass: 'A2', drum: 'SNARE' },
    { lead: 'C#5', leadLength: 2, harmony: 'A4', bass: 'A1', drum: 'KICK' },
    { lead: 'D5', leadLength: 4, harmony: 'F4', bass: 'D2', drum: 'CRASH' },
    { drum: 'SNARE_ROLL' },
  ],
};

// ---------------------------------------------------------------------------
// 4. BOSS: "CHIẾN HẠM TITAN" (122 BPM)
// ---------------------------------------------------------------------------
const BOSS_TRACK: TrackScore = {
  bpm: 122,
  loopStart: 0,
  style: 'TANK_ARCADE',
  filterCutoff: 2800,
  leadGain: 0.65,
  harmonyGain: 0.40,
  bassGain: 0.75,
  steps: [
    { lead: 'C4', leadLength: 2, harmony: 'G3', bass: 'C2', drum: 'KICK' },
    { bass: 'C3', drum: 'NONE' },
    { lead: 'Eb4', leadLength: 2, harmony: 'C4', bass: 'C2', drum: 'HIHAT_CLOSED' },
    { lead: 'G4', leadLength: 2, harmony: 'Eb4', bass: 'C3', drum: 'SNARE' },
    { lead: 'F#4', leadLength: 2, harmony: 'C4', bass: 'F#2', drum: 'KICK' },
    { bass: 'C3', drum: 'HIHAT_CLOSED' },
    { lead: 'D#4', leadLength: 2, harmony: 'A#3', bass: 'D#2', drum: 'NONE' },
    { bass: 'D#3', drum: 'NONE' },

    { lead: 'G4', leadLength: 2, harmony: 'D4', bass: 'G2', drum: 'KICK' },
    { bass: 'D3', drum: 'NONE' },
    { lead: 'F4', leadLength: 2, harmony: 'C4', bass: 'F2', drum: 'HIHAT_CLOSED' },
    { lead: 'Eb4', leadLength: 2, harmony: 'C4', bass: 'Eb2', drum: 'SNARE' },
    { lead: 'D4', leadLength: 2, harmony: 'B3', bass: 'G2', drum: 'KICK' },
    { lead: 'C4', leadLength: 4, harmony: 'G3', bass: 'C2', drum: 'CRASH' },
    { drum: 'SNARE_ROLL' },
    { drum: 'NONE' },
  ],
};

// ---------------------------------------------------------------------------
// 5. VICTORY: "STAGE CLEAR 1990" (120 BPM)
// ---------------------------------------------------------------------------
const VICTORY_TRACK: TrackScore = {
  bpm: 120,
  loopStart: 4,
  style: 'TANK_ARCADE',
  filterCutoff: 2900,
  leadGain: 0.65,
  harmonyGain: 0.40,
  bassGain: 0.70,
  steps: [
    { lead: 'C4', leadLength: 1, harmony: 'G3', bass: 'C2', drum: 'CRASH' },
    { lead: 'E4', leadLength: 1, harmony: 'C4', bass: 'G2', drum: 'NONE' },
    { lead: 'G4', leadLength: 1, harmony: 'E4', bass: 'C3', drum: 'HIHAT_CLOSED' },
    { lead: 'C5', leadLength: 2, harmony: 'G4', bass: 'C2', drum: 'SNARE' },
    { lead: 'E5', leadLength: 2, harmony: 'C5', bass: 'E3', drum: 'KICK' },
    { lead: 'G5', leadLength: 4, harmony: 'E5', bass: 'C3', drum: 'CRASH' },
    { drum: 'SNARE_ROLL' },
    { drum: 'NONE' },

    // Loop
    { lead: 'A5', leadLength: 2, harmony: 'F5', bass: 'F2', drum: 'KICK' },
    { lead: 'G5', leadLength: 2, harmony: 'E5', bass: 'C3', drum: 'HIHAT_CLOSED' },
    { lead: 'F5', leadLength: 2, harmony: 'D5', bass: 'D3', drum: 'SNARE' },
    { lead: 'E5', leadLength: 2, harmony: 'C5', bass: 'E3', drum: 'KICK' },
    { lead: 'D5', leadLength: 2, harmony: 'B4', bass: 'G2', drum: 'HIHAT_CLOSED' },
    { lead: 'C5', leadLength: 4, harmony: 'G4', bass: 'C3', drum: 'CRASH' },
    { drum: 'NONE' },
    { drum: 'NONE' },
  ],
};

// ---------------------------------------------------------------------------
// 6. GAME OVER: "CONTINUE? 1990" (80 BPM)
// ---------------------------------------------------------------------------
const GAME_OVER_TRACK: TrackScore = {
  bpm: 80,
  loopStart: 0,
  style: 'TANK_ARCADE',
  filterCutoff: 1800,
  leadGain: 0.55,
  harmonyGain: 0.35,
  bassGain: 0.60,
  steps: [
    { lead: 'A4', leadLength: 3, harmony: 'E4', bass: 'A2', drum: 'KICK' },
    { drum: 'NONE' },
    { lead: 'G4', leadLength: 3, harmony: 'D4', bass: 'G2', drum: 'NONE' },
    { drum: 'NONE' },
    { lead: 'F4', leadLength: 3, harmony: 'C4', bass: 'F2', drum: 'SNARE' },
    { drum: 'NONE' },
    { lead: 'E4', leadLength: 3, harmony: 'B3', bass: 'E2', drum: 'NONE' },
    { drum: 'NONE' },
    { lead: 'D4', leadLength: 3, harmony: 'A3', bass: 'D2', drum: 'KICK' },
    { drum: 'NONE' },
    { lead: 'C4', leadLength: 6, harmony: 'G3', bass: 'C2', drum: 'CRASH' },
    { drum: 'NONE' },
  ],
};

// ---------------------------------------------------------------------------
// ENGINE CLASS: ÂM LƯỢNG MẠNH MẼ, SỐNG ĐỘNG, KHÔNG BỊ GIẢM TIẾNG
// ---------------------------------------------------------------------------

class MusicEngine {
  private ctx: AudioContext | null = null;
  private musicMasterGain: GainNode | null = null;
  private currentTrackGain: GainNode | null = null;
  private masterFilter: BiquadFilterNode | null = null;
  private limiter: DynamicsCompressorNode | null = null;

  private isMuted: boolean = false;
  private isPaused: boolean = false;
  private volume: number = 0.95; // Âm lượng thực tế Full Power, không bị dìm âm!
  private currentTrack: MusicTrack = 'SILENCE';
  private currentStepIndex: number = 0;
  private timerId: number | null = null;
  private nextStepTime: number = 0;
  private initialized: boolean = false;

  constructor() {
    try {
      const savedMute = localStorage.getItem('tank_game_music_muted');
      if (savedMute !== null) {
        this.isMuted = savedMute === 'true';
      }
    } catch {
      // LocalStorage blocked
    }
  }

  private initCtx() {
    if (this.initialized && this.ctx) return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      // Peak Limiter: Chỉ chống vỡ tiếng (chặn đỉnh > -2dB), hoàn toàn KHÔNG ép nhỏ âm lượng!
      this.limiter = this.ctx.createDynamicsCompressor();
      this.limiter.threshold.setValueAtTime(-2, this.ctx.currentTime);
      this.limiter.knee.setValueAtTime(3, this.ctx.currentTime);
      this.limiter.ratio.setValueAtTime(12, this.ctx.currentTime);
      this.limiter.attack.setValueAtTime(0.003, this.ctx.currentTime);
      this.limiter.release.setValueAtTime(0.08, this.ctx.currentTime);

      // Master Filter: Giữ trọn độ sáng, sắc sảo của nhạc 8-bit, cắt bỏ tần số siêu âm > 2800Hz
      this.masterFilter = this.ctx.createBiquadFilter();
      this.masterFilter.type = 'lowpass';
      this.masterFilter.frequency.setValueAtTime(2800, this.ctx.currentTime);
      this.masterFilter.Q.setValueAtTime(0.707, this.ctx.currentTime);

      this.musicMasterGain = this.ctx.createGain();
      const targetGain = this.isMuted ? 0.0001 : Math.max(0.0001, this.volume);
      this.musicMasterGain.gain.setValueAtTime(targetGain, this.ctx.currentTime);

      this.musicMasterGain.connect(this.masterFilter);
      this.masterFilter.connect(this.limiter);
      this.limiter.connect(this.ctx.destination);

      this.initialized = true;
    } catch {
      // AudioContext unavailable
    }
  }

  public resumeAudio() {
    this.initCtx();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean) {
    try {
      this.isMuted = muted;
      localStorage.setItem('tank_game_music_muted', String(muted));
      if (this.musicMasterGain && this.ctx) {
        const t = this.ctx.currentTime;
        const targetGain = muted ? 0.0001 : Math.max(0.0001, this.volume);
        this.musicMasterGain.gain.cancelScheduledValues(t);
        this.musicMasterGain.gain.setValueAtTime(this.musicMasterGain.gain.value, t);
        this.musicMasterGain.gain.exponentialRampToValueAtTime(targetGain, t + 0.05);
      }
    } catch {
      // Ignore
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.musicMasterGain && this.ctx && !this.isMuted) {
      const t = this.ctx.currentTime;
      this.musicMasterGain.gain.cancelScheduledValues(t);
      this.musicMasterGain.gain.linearRampToValueAtTime(Math.max(0.0001, this.volume), t + 0.05);
    }
  }

  public getCurrentTrack(): MusicTrack {
    return this.currentTrack;
  }

  /**
   * Phát bài hát chỉ định. Dừng dứt khoát bài nhạc cũ trước khi chuyển.
   */
  public playTrack(track: MusicTrack) {
    if (this.currentTrack === track && this.timerId !== null && !this.isPaused) {
      return;
    }

    this.stop();

    if (track === 'SILENCE') {
      return;
    }

    this.resumeAudio();
    if (!this.ctx || !this.musicMasterGain) return;

    this.currentTrack = track;
    this.currentStepIndex = 0;
    this.isPaused = false;

    this.currentTrackGain = this.ctx.createGain();
    this.currentTrackGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
    this.currentTrackGain.connect(this.musicMasterGain);

    const score = this.getScoreForTrack(track);
    if (score && this.masterFilter) {
      this.masterFilter.frequency.setValueAtTime(score.filterCutoff, this.ctx.currentTime);
    }

    this.nextStepTime = this.ctx.currentTime + 0.05;
    this.timerId = window.setInterval(() => this.scheduleLoop(), 25);
  }

  public pause() {
    this.isPaused = true;
    if (this.currentTrackGain && this.ctx) {
      const t = this.ctx.currentTime;
      this.currentTrackGain.gain.cancelScheduledValues(t);
      this.currentTrackGain.gain.setValueAtTime(this.currentTrackGain.gain.value, t);
      this.currentTrackGain.gain.linearRampToValueAtTime(0.0001, t + 0.05);
    }
  }

  public resume() {
    if (!this.isPaused) return;
    this.isPaused = false;
    this.resumeAudio();
    if (this.currentTrackGain && this.ctx) {
      const t = this.ctx.currentTime;
      this.currentTrackGain.gain.cancelScheduledValues(t);
      this.currentTrackGain.gain.setValueAtTime(this.currentTrackGain.gain.value, t);
      this.currentTrackGain.gain.linearRampToValueAtTime(1.0, t + 0.08);
    }
    if (this.ctx) {
      this.nextStepTime = this.ctx.currentTime + 0.05;
    }
  }

  public stop() {
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
    if (this.currentTrackGain && this.ctx) {
      const t = this.ctx.currentTime;
      try {
        this.currentTrackGain.gain.cancelScheduledValues(t);
        this.currentTrackGain.gain.setValueAtTime(this.currentTrackGain.gain.value, t);
        this.currentTrackGain.gain.linearRampToValueAtTime(0.0001, t + 0.035);
        const oldGain = this.currentTrackGain;
        setTimeout(() => {
          try {
            oldGain.disconnect();
          } catch {
            // Ignore
          }
        }, 50);
      } catch {
        // Ignore
      }
      this.currentTrackGain = null;
    }
    this.currentTrack = 'SILENCE';
    this.currentStepIndex = 0;
    this.isPaused = false;
  }

  // -------------------------------------------------------------
  // LOOKAHEAD SCHEDULER
  // -------------------------------------------------------------
  private scheduleLoop() {
    if (this.isPaused || !this.ctx || !this.currentTrackGain || this.currentTrack === 'SILENCE') {
      return;
    }

    const score = this.getScoreForTrack(this.currentTrack);
    if (!score || score.steps.length === 0) return;

    // Sixteenth note duration = (60 / bpm) / 4
    const stepDuration = 60 / score.bpm / 4;
    const lookahead = 0.15;

    while (this.nextStepTime < this.ctx.currentTime + lookahead) {
      const step = score.steps[this.currentStepIndex];
      if (step) {
        this.renderStep(score, step, this.nextStepTime, stepDuration);
      }

      this.nextStepTime += stepDuration;
      this.currentStepIndex++;
      if (this.currentStepIndex >= score.steps.length) {
        this.currentStepIndex = score.loopStart;
      }
    }
  }

  private getScoreForTrack(track: MusicTrack): TrackScore | null {
    switch (track) {
      case 'TITLE':
        return TITLE_TRACK;
      case 'CAMPAIGN':
        return CAMPAIGN_TRACK;
      case 'SURVIVAL':
        return SURVIVAL_TRACK;
      case 'BOSS':
        return BOSS_TRACK;
      case 'VICTORY':
        return VICTORY_TRACK;
      case 'GAME_OVER':
        return GAME_OVER_TRACK;
      default:
        return null;
    }
  }

  // -------------------------------------------------------------
  // INSTRUMENTS SYNTHESIS: TRUE 80s/90s FAMICOM TANK CHIPTUNE
  // -------------------------------------------------------------
  private renderStep(score: TrackScore, step: NoteStep, startTime: number, stepDuration: number) {
    if (!this.ctx || !this.currentTrackGain || this.isMuted) return;

    // 1. Giai điệu chính Lead
    if (step.lead && NOTE_FREQS[step.lead]) {
      const dur = (step.leadLength || 2) * stepDuration * 0.90;
      if (score.style === 'BEETHOVEN') {
        this.playBeethovenPiano(NOTE_FREQS[step.lead], startTime, dur, score.leadGain);
      } else {
        // Tiếng kèn Lead 8-bit Famicom kinh điển Tank 1990
        this.playTankArcadeLead(NOTE_FREQS[step.lead], startTime, dur, score.leadGain);
      }
    }

    // 2. Bè hòa âm Harmony
    if (step.harmony && NOTE_FREQS[step.harmony]) {
      const dur = (step.leadLength || 2) * stepDuration * 0.85;
      if (score.style === 'BEETHOVEN') {
        this.playBeethovenPiano(NOTE_FREQS[step.harmony], startTime, dur, score.harmonyGain);
      } else {
        this.playTankArcadeHarmony(NOTE_FREQS[step.harmony], startTime, dur, score.harmonyGain);
      }
    }

    // 3. Âm trầm NES Triangle Bass (Đi bộ nhún nhảy cực đã)
    if (step.bass && NOTE_FREQS[step.bass]) {
      const dur = stepDuration * 1.6;
      if (score.style === 'BEETHOVEN') {
        this.playBeethovenBass(NOTE_FREQS[step.bass], startTime, dur, score.bassGain);
      } else {
        this.playNestriangleBass(NOTE_FREQS[step.bass], startTime, dur, score.bassGain);
      }
    }

    // 4. Trống 8-bit Arcade NES
    if (step.drum && step.drum !== 'NONE') {
      this.playArcadeDrum(step.drum, startTime);
    }
  }

  /**
   * ĐÀN PIANO BEETHOVEN SẢNH CHỜ
   */
  private playBeethovenPiano(
    freq: number,
    startTime: number,
    duration: number,
    gainLevel: number
  ) {
    if (!this.ctx || !this.currentTrackGain) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, startTime);
      filter.frequency.exponentialRampToValueAtTime(700, startTime + duration);

      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.linearRampToValueAtTime(gainLevel, startTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(gainLevel * 0.45, startTime + 0.16);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + Math.max(duration, 0.45));

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.currentTrackGain);

      osc.start(startTime);
      osc.stop(startTime + Math.max(duration, 0.45) + 0.05);
    } catch {
      // Audio safety
    }
  }

  private playBeethovenBass(
    freq: number,
    startTime: number,
    duration: number,
    gainLevel: number
  ) {
    if (!this.ctx || !this.currentTrackGain) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(500, startTime);

      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.linearRampToValueAtTime(gainLevel, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.currentTrackGain);

      osc.start(startTime);
      osc.stop(startTime + duration + 0.05);
    } catch {
      // Audio safety
    }
  }

  /**
   * TANK ARCADE LEAD (FAMICOM 1990 TANK HERO CHIME):
   * Kết hợp sóng tam giác nảy và sóng vuông mềm lọc mượt 2400Hz.
   * Âm sắc vui tươi, hào sảng, kinh điển đúng chất Battle City và Contra!
   * Tuyệt đối không chói, âm thanh rất ngọt ngào và bắt tai.
   */
  private playTankArcadeLead(
    freq: number,
    startTime: number,
    duration: number,
    gainLevel: number
  ) {
    if (!this.ctx || !this.currentTrackGain) return;
    try {
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc1.type = 'square';
      osc2.type = 'triangle';

      osc1.frequency.setValueAtTime(freq, startTime);
      osc2.frequency.setValueAtTime(freq, startTime);

      // Bộ lọc loại bỏ tần số chói, tạo độ nảy ngọt ngào
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(Math.min(2600, freq * 3.2), startTime);
      filter.frequency.exponentialRampToValueAtTime(1200, startTime + duration);
      filter.Q.setValueAtTime(0.9, startTime);

      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.linearRampToValueAtTime(gainLevel * 0.7, startTime + 0.008);
      gain.gain.setValueAtTime(gainLevel * 0.55, startTime + duration * 0.7);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.currentTrackGain);

      osc1.start(startTime);
      osc2.start(startTime);
      osc1.stop(startTime + duration + 0.02);
      osc2.stop(startTime + duration + 0.02);
    } catch {
      // Audio safety
    }
  }

  /**
   * TANK ARCADE HARMONY (BÈ ĐỆM ĐÔI)
   */
  private playTankArcadeHarmony(
    freq: number,
    startTime: number,
    duration: number,
    gainLevel: number
  ) {
    if (!this.ctx || !this.currentTrackGain) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1600, startTime);

      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.linearRampToValueAtTime(gainLevel, startTime + 0.01);
      gain.gain.setValueAtTime(gainLevel * 0.8, startTime + duration * 0.6);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.currentTrackGain);

      osc.start(startTime);
      osc.stop(startTime + duration + 0.02);
    } catch {
      // Audio safety
    }
  }

  /**
   * NES TRIANGLE BASS (ÂM BASS TAM GIÁC FAMICOM ĐẶC TRƯNG)
   * Âm bass nảy tưng bừng, đi bộ nhún nhảy quen thuộc của điện tử 4 nút.
   */
  private playNestriangleBass(
    freq: number,
    startTime: number,
    duration: number,
    gainLevel: number
  ) {
    if (!this.ctx || !this.currentTrackGain) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'triangle';
      // Pitch punch nhanh 12ms tạo độ nảy bass đặc trưng của Battle City
      osc.frequency.setValueAtTime(freq + 8, startTime);
      osc.frequency.exponentialRampToValueAtTime(freq, startTime + 0.015);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, startTime);

      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.linearRampToValueAtTime(gainLevel, startTime + 0.005);
      gain.gain.setValueAtTime(gainLevel * 0.9, startTime + duration * 0.75);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.currentTrackGain);

      osc.start(startTime);
      osc.stop(startTime + duration + 0.02);
    } catch {
      // Audio safety
    }
  }

  /**
   * BỘ TRỐNG ARCADE 8-BIT NĂM 80-90 (NES Chiptune Drums)
   */
  private playArcadeDrum(type: DrumType, startTime: number) {
    if (!this.ctx || !this.currentTrackGain) return;
    try {
      if (type === 'KICK') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(145, startTime);
        osc.frequency.exponentialRampToValueAtTime(45, startTime + 0.08);

        gain.gain.setValueAtTime(0.55, startTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.085);

        osc.connect(gain);
        gain.connect(this.currentTrackGain);
        osc.start(startTime);
        osc.stop(startTime + 0.09);
      } else if (type === 'SNARE') {
        const dur = 0.09;
        const bufSize = Math.floor(this.ctx.sampleRate * dur);
        const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 1.5);
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buf;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1500, startTime);
        filter.Q.setValueAtTime(1.3, startTime);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.48, startTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + dur);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.currentTrackGain);
        noise.start(startTime);
      } else if (type === 'SNARE_ROLL') {
        for (let r = 0; r < 3; r++) {
          const rollTime = startTime + r * 0.04;
          const dur = 0.035;
          const bufSize = Math.floor(this.ctx.sampleRate * dur);
          const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
          const data = buf.getChannelData(0);
          for (let i = 0; i < bufSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 1.3);
          }
          const noise = this.ctx.createBufferSource();
          noise.buffer = buf;

          const filter = this.ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(1600, rollTime);

          const gain = this.ctx.createGain();
          gain.gain.setValueAtTime(0.35 + r * 0.08, rollTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, rollTime + dur);

          noise.connect(filter);
          filter.connect(gain);
          gain.connect(this.currentTrackGain);
          noise.start(rollTime);
        }
      } else if (type === 'HIHAT_CLOSED') {
        const dur = 0.025;
        const bufSize = Math.floor(this.ctx.sampleRate * dur);
        const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 2.2);
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buf;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(5500, startTime);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.20, startTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + dur);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.currentTrackGain);
        noise.start(startTime);
      } else if (type === 'CRASH') {
        const dur = 0.25;
        const bufSize = Math.floor(this.ctx.sampleRate * dur);
        const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 1.4);
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buf;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(3200, startTime);
        filter.Q.setValueAtTime(0.6, startTime);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.42, startTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + dur);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.currentTrackGain);
        noise.start(startTime);
      }
    } catch {
      // Audio safety
    }
  }
}

export const musicEngine = new MusicEngine();
