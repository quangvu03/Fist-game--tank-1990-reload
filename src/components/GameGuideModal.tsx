import { useState } from 'react';
import {
  X,
  Heart,
  Shield,
  Castle,
  ArrowUpCircle,
  Skull,
  Compass,
  Volume2,
  Pause,
  Sun,
  Zap,
  Bomb,
  Clock,
  Layers,
  Star,
  Gauge,
  Flame,
  Sparkles,
  Music,
  Crown,
  Crosshair,
  ShieldAlert,
} from 'lucide-react';

interface GameGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'HUD' | 'STATS' | 'ITEMS' | 'ENEMIES' | 'TILES' | 'CONTROLS';

export function GameGuideModal({ isOpen, onClose }: GameGuideModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('HUD');

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-3 sm:p-5 select-none animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tiêu đề modal */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-wide text-white">
                SỔ TAY TÁC CHIẾN & TRA CỨU BIỂU TƯỢNG
              </h2>
              <p className="text-[11px] text-slate-400">
                Chi tiết toàn bộ biểu tượng, vật phẩm tiếp tế, chiến xa và công sự trong trận
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Đóng bảng hướng dẫn (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Danh mục menu - 100% TIẾNG VIỆT THUẦN TÚY */}
        <div className="flex items-center gap-1 px-4 py-2 bg-slate-950/50 border-b border-slate-800/80 overflow-x-auto scrollbar-none shrink-0 text-xs">
          <button
            onClick={() => setActiveTab('HUD')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'HUD'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Heart className="w-3.5 h-3.5 fill-current" />
            <span>Trạng Thái</span>
          </button>

          <button
            onClick={() => setActiveTab('STATS')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'STATS'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Gauge className="w-3.5 h-3.5" />
            <span>Tốc Độ & Hỏa Lực</span>
          </button>

          <button
            onClick={() => setActiveTab('ITEMS')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'ITEMS'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Star className="w-3.5 h-3.5" />
            <span>Vật Phẩm Tiếp Tế</span>
          </button>

          <button
            onClick={() => setActiveTab('ENEMIES')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'ENEMIES'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Skull className="w-3.5 h-3.5" />
            <span>Địch</span>
          </button>

          <button
            onClick={() => setActiveTab('TILES')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'TILES'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Địa Hình & Căn Cứ</span>
          </button>

          <button
            onClick={() => setActiveTab('CONTROLS')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'CONTROLS'
                ? 'bg-sky-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Hướng Dẫn Điều Khiển</span>
          </button>
        </div>

        {/* Nội dung chi tiết - Đảm bảo responsive và không tràn lề */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-5 space-y-3.5 text-xs min-w-0">
          {/* MỤC 1: Trạng Thái */}
          {activeTab === 'HUD' && (
            <div className="space-y-3 min-w-0">
              {/* Mạng sống hình trái tim */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 flex items-start gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-500 shrink-0 mt-0.5">
                  <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                </div>
                <div className="min-w-0 flex-1 break-words">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-white">Mạng Sống Dự Phòng (Biểu Tượng Trái Tim Đỏ)</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-950 text-rose-300 border border-rose-800 flex items-center gap-1">
                      <Heart className="w-2.5 h-2.5 fill-rose-400 text-rose-400" /> 3
                    </span>
                  </div>
                  <p className="text-slate-300 mt-1 text-[11px] leading-relaxed">
                    Biểu thị số lượt hồi sinh dự phòng của bạn, hiển thị bằng <b>trái tim màu đỏ</b> trên thanh trạng thái và ngay trên nóc chiến xa. Bắt đầu với 3 mạng. Mỗi lần xe bị bắn hạ sẽ tiêu hao 1 mạng để hồi sinh với khiên bảo hộ. Hết mạng là thua cuộc!
                  </p>
                </div>
              </div>

              {/* Máu chiến xa trên thân xe */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 flex items-start gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shrink-0 mt-0.5">
                  <Flame className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1 break-words">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-white">Thanh Sinh Lực (HP) Trực Tiếp Trên Nóc Xe</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                      3/3 HP
                    </span>
                  </div>
                  <p className="text-slate-300 mt-1 text-[11px] leading-relaxed">
                    Thanh máu được gắn gọn gàng ngay trên thân mỗi xe tăng (xanh lá đầy máu, vàng khi bị thương, đỏ kèm hiệu ứng khói lửa khi còn 1 HP). Xe nâng cấp lên Cấp 4 sẽ có tối đa tới 6 HP!
                  </p>
                </div>
              </div>

              {/* Căn cứ chỉ huy */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 flex items-start gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0 mt-0.5">
                  <Castle className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1 break-words">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-white">Căn Cứ Chỉ Huy (Sở Chỉ Huy Đại Bàng)</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-800">
                      C1 (2/2 HP)
                    </span>
                  </div>
                  <p className="text-slate-300 mt-1 text-[11px] leading-relaxed">
                    Trái tim chiến trường ở trung tâm phía dưới bản đồ. Ký hiệu <b>C1 đến C5</b> biểu thị cấp bậc công sự. Nếu căn cứ bị bắn nổ (về 0 HP), trận đấu sẽ kết thúc ngay lập tức dù xe bạn còn mạng.
                  </p>
                </div>
              </div>

              {/* Màn chắn năng lượng căn cứ */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 flex items-start gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shrink-0 mt-0.5">
                  <Shield className="w-4 h-4 fill-cyan-400/20" />
                </div>
                <div className="min-w-0 flex-1 break-words">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-white">Màn Chắn Lực Trường Căn Cứ</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                      50 - 280 HP
                    </span>
                  </div>
                  <p className="text-slate-300 mt-1 text-[11px] leading-relaxed">
                    Xuất hiện từ Căn cứ Cấp 2 trở lên. Là vòm năng lượng bảo vệ bao bọc toàn bộ căn cứ và các xe đứng xung quanh. Màn chắn tự động hồi phục đầy sau khi không nhận sát thương trong 5 giây.
                  </p>
                </div>
              </div>

              {/* Nâng cấp căn cứ */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 flex items-start gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 shrink-0 mt-0.5">
                  <ArrowUpCircle className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1 break-words">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-white">Nút Nâng Cấp Căn Cứ (Phím U)</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500 text-slate-950 font-bold">
                      NÂNG CẤP 800đ
                    </span>
                  </div>
                  <p className="text-slate-300 mt-1 text-[11px] leading-relaxed">
                    Dùng điểm số tích lũy để thăng cấp sở chỉ huy lên Cấp 2, 3, 4, 5. <b>Đặc biệt:</b> Mỗi lần bấm nâng cấp sẽ lập tức phục hồi và tái tạo lại toàn bộ tường bảo vệ xung quanh căn cứ đã bị bắn vỡ!
                  </p>
                </div>
              </div>

              {/* Quân địch còn lại */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 flex items-start gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 shrink-0 mt-0.5">
                  <Skull className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1 break-words">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-white">Quân Địch Còn Lại & Điểm Số</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-900 text-white font-bold">
                      ĐỊCH: 20
                    </span>
                  </div>
                  <p className="text-slate-300 mt-1 text-[11px] leading-relaxed">
                    Tổng số lượng chiến xa địch còn lại trong màn chơi. Điểm số chiến đấu được hiển thị nổi bật ở góc phải thanh trạng thái, dùng để so sánh thành tích và nâng cấp căn cứ.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* MỤC 2: Tốc Độ & Hỏa Lực */}
          {activeTab === 'STATS' && (
            <div className="space-y-3.5 min-w-0">
              <div className="bg-gradient-to-r from-amber-950/40 via-orange-950/20 to-slate-950 border border-amber-500/40 rounded-xl p-3.5 flex items-start gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
                  <Gauge className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1 break-words">
                  <h3 className="font-black text-sm text-amber-300">
                    BẢNG THÔNG SỐ TÁC CHIẾN THỜI GIAN THỰC
                  </h3>
                  <p className="text-slate-300 mt-1 text-[11px] leading-relaxed">
                    Trò chơi hiển thị chi tiết <b>Tốc độ di chuyển</b>, <b>Tốc độ bắn</b>, <b>Vận tốc đạn</b> và <b>Thời gian hiệu lực vật phẩm</b>. Mỗi khi bạn nhặt <b>⭐ Ngôi Sao</b> hoặc <b>⚡ Tăng Tốc</b>, các con số này sẽ lập tức tăng vọt trong thời gian thực!
                  </p>
                </div>
              </div>

              {/* 4 Cấp Độ Xe Tăng Chi Tiết */}
              <div className="space-y-2 min-w-0">
                <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  CHỈ SỐ THEO 4 CẤP BẬC CHIẾN XA (C1 → C4)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 min-w-0">
                  {/* Tier 1 */}
                  <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-1.5 min-w-0">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded bg-emerald-500/20 text-emerald-400 font-black flex items-center justify-center text-[10px]">C1</span>
                        <span className="font-bold text-white text-xs">Pháo Cơ Bản</span>
                      </div>
                      <span className="font-mono text-[10px] text-emerald-400 font-bold">3 HP</span>
                    </div>
                    <div className="space-y-1 text-[11px] text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Tốc độ chạy:</span>
                        <span className="font-mono font-bold text-amber-300">110 px/s</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Tốc độ bắn:</span>
                        <span className="font-mono font-bold text-orange-300">2.2 phát/s</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Vận tốc đạn:</span>
                        <span className="font-mono font-bold text-cyan-300">260 px/s</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400 pt-0.5">
                        <span>Hỏa lực:</span>
                        <span>Đạn đơn tiêu chuẩn</span>
                      </div>
                    </div>
                  </div>

                  {/* Tier 2 */}
                  <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-1.5 min-w-0">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded bg-sky-500/20 text-sky-400 font-black flex items-center justify-center text-[10px]">C2</span>
                        <span className="font-bold text-white text-xs">Pháo Siêu Tốc</span>
                      </div>
                      <span className="font-mono text-[10px] text-sky-400 font-bold">4 HP (+1)</span>
                    </div>
                    <div className="space-y-1 text-[11px] text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Tốc độ chạy:</span>
                        <span className="font-mono font-bold text-amber-300">120 px/s <span className="text-[9px] text-emerald-400">(+9%)</span></span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Tốc độ bắn:</span>
                        <span className="font-mono font-bold text-orange-300">2.9 phát/s <span className="text-[9px] text-emerald-400">(nhanh)</span></span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Vận tốc đạn:</span>
                        <span className="font-mono font-bold text-cyan-300">330 px/s <span className="text-[9px] text-emerald-400">(+27%)</span></span>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400 pt-0.5">
                        <span>Hỏa lực:</span>
                        <span>Nòng phản lực tăng tốc</span>
                      </div>
                    </div>
                  </div>

                  {/* Tier 3 */}
                  <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-1.5 min-w-0">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded bg-indigo-500/20 text-indigo-400 font-black flex items-center justify-center text-[10px]">C3</span>
                        <span className="font-bold text-white text-xs">Song Nòng Hạng Nặng</span>
                      </div>
                      <span className="font-mono text-[10px] text-indigo-400 font-bold">5 HP (+2)</span>
                    </div>
                    <div className="space-y-1 text-[11px] text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Tốc độ chạy:</span>
                        <span className="font-mono font-bold text-amber-300">125 px/s <span className="text-[9px] text-emerald-400">(+14%)</span></span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Tốc độ bắn:</span>
                        <span className="font-mono font-bold text-orange-300">3.6 phát/s <span className="text-[9px] text-emerald-400">(rất nhanh)</span></span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Vận tốc đạn:</span>
                        <span className="font-mono font-bold text-cyan-300">350 px/s <span className="text-[9px] text-emerald-400">(+35%)</span></span>
                      </div>
                      <div className="flex justify-between text-[10px] text-indigo-300 font-bold pt-0.5">
                        <span>Hỏa lực:</span>
                        <span>⚡ Bắn 2 nòng song song</span>
                      </div>
                    </div>
                  </div>

                  {/* Tier 4 */}
                  <div className="bg-slate-950/70 border border-amber-500/40 rounded-xl p-3 space-y-1.5 bg-gradient-to-br from-amber-950/20 to-slate-950 min-w-0">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded bg-rose-500/20 text-rose-400 font-black flex items-center justify-center text-[10px]">C4</span>
                        <span className="font-bold text-amber-300 text-xs">Chiến Xa Phá Thép</span>
                      </div>
                      <span className="font-mono text-[10px] text-amber-400 font-black">6 HP (TỐI ĐA)</span>
                    </div>
                    <div className="space-y-1 text-[11px] text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Tốc độ chạy:</span>
                        <span className="font-mono font-bold text-amber-300">135 px/s <span className="text-[9px] text-emerald-400">(+23%)</span></span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Tốc độ bắn:</span>
                        <span className="font-mono font-bold text-orange-300">4.5 phát/s <span className="text-[9px] text-emerald-400">(cực nhanh)</span></span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Vận tốc đạn:</span>
                        <span className="font-mono font-bold text-cyan-300">400 px/s <span className="text-[9px] text-emerald-400">(+54%)</span></span>
                      </div>
                      <div className="flex justify-between text-[10px] text-rose-400 font-bold pt-0.5">
                        <span>Hỏa lực:</span>
                        <span>🔥 Bắn phá xuyên thủng tường thép</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tác dụng của Hộp Tiếp Tế Tăng Tốc */}
              <div className="bg-slate-950/80 border border-amber-500/50 rounded-xl p-3.5 space-y-2 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-base">
                    ⚡
                  </div>
                  <div className="min-w-0 flex-1 break-words">
                    <h4 className="font-bold text-amber-300 text-xs">HỘP TIẾP TẾ TĂNG TỐC ĐIỆN TỪ</h4>
                    <p className="text-slate-400 text-[10px]">Kích hoạt tức thì trong 8 giây khi xe chạm vào hộp tiếp tế hình tia sét</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px] min-w-0">
                  <div className="bg-slate-900 border border-slate-800 p-2 rounded-lg min-w-0">
                    <span className="text-slate-400 block text-[10px]">Tốc độ chạy:</span>
                    <span className="font-mono font-bold text-amber-300 text-xs">+35 px/s</span>
                    <p className="text-slate-400 text-[9.5px] mt-0.5">Cơ động luồn lách né tránh đạn pháo địch cực nhanh.</p>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-2 rounded-lg min-w-0">
                    <span className="text-slate-400 block text-[10px]">Tốc độ bắn:</span>
                    <span className="font-mono font-bold text-orange-300 text-xs">+25% Nhanh hơn</span>
                    <p className="text-slate-400 text-[9.5px] mt-0.5">Rút ngắn thời gian nạp đạn, xả đạn dồn dập áp đảo đối phương.</p>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-2 rounded-lg min-w-0">
                    <span className="text-slate-400 block text-[10px]">Vận tốc đạn:</span>
                    <span className="font-mono font-bold text-cyan-300 text-xs">+15% Tốc độ bay</span>
                    <p className="text-slate-400 text-[9.5px] mt-0.5">Đạn bay tới mục tiêu nhanh hơn, đối phương khó né tránh.</p>
                  </div>
                </div>

                <div className="text-[10px] text-amber-200/90 pt-1 border-t border-slate-800/80">
                  ⏱️ <b>Đếm lùi trực tiếp:</b> Khi ăn vật phẩm ⚡, trên thanh thông số sẽ hiển thị thẻ đếm lùi thời gian để bạn kiểm soát nhịp độ chiến thuật!
                </div>
              </div>
            </div>
          )}

          {/* MỤC 3: Vật Phẩm Tiếp Tế */}
          {activeTab === 'ITEMS' && (
            <div className="space-y-3 min-w-0">
              <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-3 text-[11px] text-amber-300">
                💡 <b>Mẹo thu thập:</b> Hộp tiếp tế quân sự ngẫu nhiên sẽ xuất hiện khi bạn bắn hạ các xe địch mang hàng tiếp tế (xe nhấp nháy phát sáng vàng). Bạn chỉ cần lái xe tăng chạm vào hộp để kích hoạt!
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 min-w-0">
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400 text-lg shrink-0">
                    ⭐
                  </div>
                  <div className="min-w-0 flex-1 break-words">
                    <h4 className="font-bold text-white text-xs">NGÔI SAO THĂNG CẤP</h4>
                    <p className="text-slate-300 text-[11px] mt-0.5">
                      Nâng cấp pháo của xe tăng: Tăng tốc độ bắn, tăng tốc độ xe, bắn đạn song nòng và tối đa có thể bắn thủng tường thép!
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-400 text-lg shrink-0">
                    🛡️
                  </div>
                  <div className="min-w-0 flex-1 break-words">
                    <h4 className="font-bold text-white text-xs">KHIÊN BẢO HỘ LỰC TRƯỜNG</h4>
                    <p className="text-slate-300 text-[11px] mt-0.5">
                      Bao bọc xe tăng trong màng chắn từ trường bất khả xâm phạm trong 10 giây, miễn nhiễm với mọi làn đạn của địch.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/40 flex items-center justify-center text-red-400 text-lg shrink-0">
                    💣
                  </div>
                  <div className="min-w-0 flex-1 break-words">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-bold text-white text-xs">BOM TẬP KÍCH (TRỪ 1 HP)</h4>
                      <span className="px-1.5 py-0.2 rounded text-[9.5px] font-mono bg-red-950 text-red-300 border border-red-800 font-bold">
                        -1 HP TẤT CẢ ĐỊCH
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px] mt-0.5">
                      Kích hoạt xung nổ toàn diện: Mọi xe tăng địch trên bản đồ đều <b>bị trừ 1 HP</b> (xe 1 HP sẽ nổ tung ngay lập tức, các xe giáp dày và Boss sẽ bị thương nặng)!
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/40 flex items-center justify-center text-sky-400 text-lg shrink-0">
                    ⏰
                  </div>
                  <div className="min-w-0 flex-1 break-words">
                    <h4 className="font-bold text-white text-xs">ĐỒNG HỒ ĐÓNG BĂNG THỜI GIAN</h4>
                    <p className="text-slate-300 text-[11px] mt-0.5">
                      Đóng băng toàn bộ hoạt động của quân địch trong 10 giây. Địch bị đóng băng không thể di chuyển hay nã đạn.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-stone-500/10 border border-stone-500/40 flex items-center justify-center text-stone-300 text-lg shrink-0">
                    🏰
                  </div>
                  <div className="min-w-0 flex-1 break-words">
                    <h4 className="font-bold text-white text-xs">CÔNG SỰ THÉP CỨU NGUY</h4>
                    <p className="text-slate-300 text-[11px] mt-0.5">
                      Gia cố và hồi sinh ngay lập tức toàn bộ tường bảo vệ quanh căn cứ thành tường thép kiên cố trong 20 giây.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-rose-500/10 border border-rose-500/40 flex items-center justify-center text-rose-400 text-lg shrink-0">
                    ❤️
                  </div>
                  <div className="min-w-0 flex-1 break-words">
                    <h4 className="font-bold text-white text-xs">CỨU THƯƠNG DÃ CHIẾN</h4>
                    <p className="text-slate-300 text-[11px] mt-0.5">
                      Hồi phục toàn bộ thanh HP của xe tăng và cộng thêm 1 mạng dự phòng quý giá giúp bạn trụ vững trên chiến trường.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-start gap-3 sm:col-span-2 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-300 text-lg shrink-0">
                    ⚡
                  </div>
                  <div className="min-w-0 flex-1 break-words">
                    <h4 className="font-bold text-white text-xs">TĂNG TỐC ĐỘNG CƠ ĐIỆN TỪ</h4>
                    <p className="text-slate-300 text-[11px] mt-0.5">
                      Tăng 25% tốc độ di chuyển và thời gian nạp đạn nhanh hơn, giúp bạn cơ động né đạn và bắn dồn ép quân thù.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MỤC 4: Chiến Xa Địch & 3 Siêu Trùm (Boss) */}
          {activeTab === 'ENEMIES' && (
            <div className="space-y-4 min-w-0">
              {/* Tactical Overview Banner */}
              <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-rose-950/40 border border-slate-800 rounded-xl p-3.5 flex items-start gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-rose-500/15 text-rose-400 shrink-0 mt-0.5 border border-rose-500/30">
                  <Skull className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1 break-words">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-black text-sm text-white">
                      HỒ SƠ TÁC CHIẾN CHIẾN XA ĐỊCH
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700 font-bold">
                      5 LOẠI THIẾT GIÁP & 3 SIÊU BOSS
                    </span>
                  </div>
                  <p className="text-slate-300 mt-1 text-[11px] leading-relaxed">
                    Bao gồm <b>4 thiết giáp cơ bản</b>, <b>1 đơn vị xe truy sát đặc nhiệm</b> và <b>3 Siêu Boss khổng lồ</b> (Màn 10, Màn 20, Màn 21). Nhận diện hình ảnh và đặc tính để lập phương án tiêu diệt hiệu quả!
                  </p>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* PHẦN 1: CÁC LOẠI XE TĂNG ĐỊCH NHỎ (ĐƯA LÊN TRƯỚC THEO YÊU CẦU) */}
              {/* ========================================================================= */}
              <div className="space-y-2.5 min-w-0">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <h4 className="font-black text-white text-xs flex items-center gap-1.5">
                    <Crosshair className="w-4 h-4 text-cyan-400" />
                    <span>CÁC LOẠI XE TĂNG ĐỊCH NHỎ & ĐẶC NHIỆM</span>
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">Đồ Họa Minh Họa Tác Chiến</span>
                </div>

                <div className="grid grid-cols-1 gap-2.5 min-w-0">
                  {/* 1. Xe Trinh Sát Tốc Độ */}
                  <div className="bg-slate-950/70 border border-cyan-500/30 hover:border-cyan-500/60 rounded-xl p-3 flex items-start gap-3 min-w-0 transition-colors">
                    {/* SVG Minh Họa Xe Trinh Sát */}
                    <div className="shrink-0 w-12 h-12 bg-slate-900 border border-cyan-500/40 rounded-lg flex items-center justify-center p-1 shadow-sm">
                      <svg viewBox="0 0 48 48" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                        {/* Dải xích trái/phải */}
                        <rect x="6" y="8" width="8" height="32" rx="2" fill="#1e293b" stroke="#334155" strokeWidth="1" />
                        <rect x="34" y="8" width="8" height="32" rx="2" fill="#1e293b" stroke="#334155" strokeWidth="1" />
                        {/* Gân bánh xích */}
                        <line x1="6" y1="14" x2="14" y2="14" stroke="#475569" />
                        <line x1="6" y1="20" x2="14" y2="20" stroke="#475569" />
                        <line x1="6" y1="26" x2="14" y2="26" stroke="#475569" />
                        <line x1="6" y1="32" x2="14" y2="32" stroke="#475569" />
                        <line x1="34" y1="14" x2="42" y2="14" stroke="#475569" />
                        <line x1="34" y1="20" x2="42" y2="20" stroke="#475569" />
                        <line x1="34" y1="26" x2="42" y2="26" stroke="#475569" />
                        <line x1="34" y1="32" x2="42" y2="32" stroke="#475569" />
                        {/* Thân xe (Hull) */}
                        <rect x="15" y="11" width="18" height="26" rx="3" fill="#06b6d4" stroke="#0891b2" strokeWidth="1.5" />
                        <rect x="18" y="14" width="12" height="6" rx="1" fill="#22d3ee" opacity="0.6" />
                        {/* Nòng pháo đơn */}
                        <rect x="22.5" y="4" width="3" height="15" rx="1" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="0.8" />
                        {/* Tháp pháo tròn */}
                        <circle cx="24" cy="24" r="6.5" fill="#0891b2" stroke="#22d3ee" strokeWidth="1.5" />
                        <circle cx="24" cy="24" r="2.5" fill="#06b6d4" />
                      </svg>
                    </div>

                    <div className="min-w-0 flex-1 break-words">
                      <div className="flex items-center justify-between gap-1 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded bg-cyan-500/20 text-cyan-300 font-black flex items-center justify-center text-[10px] border border-cyan-500/40">1</span>
                          <h5 className="font-bold text-cyan-400 text-xs">Xe Trinh Sát Tốc Độ (Scout)</h5>
                        </div>
                        <div className="flex items-center gap-2 font-mono text-[11px]">
                          <span className="text-cyan-400 font-bold">1 HP</span>
                          <span className="text-amber-300 font-bold">+100 điểm</span>
                        </div>
                      </div>
                      <p className="text-slate-300 text-[11px] mt-1 leading-relaxed">
                        • <b>Đặc tính:</b> Tốc độ cực nhanh (130 px/s), nạp đạn nhanh, thường dẫn đầu đội hình thọc sâu vào căn cứ.<br />
                        • <b>Điểm yếu:</b> Lớp giáp mỏng manh, chỉ cần 1 phát đạn chính xác là nổ tung ngay lập tức.
                      </p>
                    </div>
                  </div>

                  {/* 2. Chiến Xa Đột Kích */}
                  <div className="bg-slate-950/70 border border-amber-500/30 hover:border-amber-500/60 rounded-xl p-3 flex items-start gap-3 min-w-0 transition-colors">
                    {/* SVG Minh Họa Xe Đột Kích */}
                    <div className="shrink-0 w-12 h-12 bg-slate-900 border border-amber-500/40 rounded-lg flex items-center justify-center p-1 shadow-sm">
                      <svg viewBox="0 0 48 48" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="6" y="7" width="8" height="34" rx="2" fill="#1e293b" stroke="#334155" strokeWidth="1" />
                        <rect x="34" y="7" width="8" height="34" rx="2" fill="#1e293b" stroke="#334155" strokeWidth="1" />
                        <line x1="6" y1="13" x2="14" y2="13" stroke="#475569" />
                        <line x1="6" y1="19" x2="14" y2="19" stroke="#475569" />
                        <line x1="6" y1="25" x2="14" y2="25" stroke="#475569" />
                        <line x1="6" y1="31" x2="14" y2="31" stroke="#475569" />
                        <line x1="34" y1="13" x2="42" y2="13" stroke="#475569" />
                        <line x1="34" y1="19" x2="42" y2="19" stroke="#475569" />
                        <line x1="34" y1="25" x2="42" y2="25" stroke="#475569" />
                        <line x1="34" y1="31" x2="42" y2="31" stroke="#475569" />
                        {/* Thân xe vát cạnh */}
                        <path d="M15 13 L20 10 L28 10 L33 13 L33 37 L15 37 Z" fill="#f59e0b" stroke="#d97706" strokeWidth="1.5" />
                        {/* Nòng pháo */}
                        <rect x="22" y="3" width="4" height="17" rx="1" fill="#f8fafc" stroke="#94a3b8" strokeWidth="0.8" />
                        {/* Tháp pháo vuông bo tròn */}
                        <rect x="17.5" y="17" width="13" height="13" rx="3" fill="#d97706" stroke="#fbbf24" strokeWidth="1.5" />
                        <circle cx="24" cy="23.5" r="3" fill="#f59e0b" />
                      </svg>
                    </div>

                    <div className="min-w-0 flex-1 break-words">
                      <div className="flex items-center justify-between gap-1 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded bg-amber-500/20 text-amber-300 font-black flex items-center justify-center text-[10px] border border-amber-500/40">2</span>
                          <h5 className="font-bold text-amber-400 text-xs">Chiến Xa Đột Kích (Assault)</h5>
                        </div>
                        <div className="flex items-center gap-2 font-mono text-[11px]">
                          <span className="text-amber-400 font-bold">2 HP</span>
                          <span className="text-amber-300 font-bold">+200 điểm</span>
                        </div>
                      </div>
                      <p className="text-slate-300 text-[11px] mt-1 leading-relaxed">
                        • <b>Đặc tính:</b> Tốc độ cân bằng (105 px/s), hỏa lực nhịp nhàng, có khả năng né tránh cơ động.<br />
                        • <b>Lớp giáp:</b> 2 HP (chịu 2 phát đạn tiêu chuẩn, khi trúng 1 phát sẽ đổi màu cảnh báo bị thương).
                      </p>
                    </div>
                  </div>

                  {/* 3. Thiết Giáp Bọc Thép Hạng Nặng */}
                  <div className="bg-slate-950/70 border border-red-500/30 hover:border-red-500/60 rounded-xl p-3 flex items-start gap-3 min-w-0 transition-colors">
                    {/* SVG Minh Họa Xe Thiết Giáp Hạng Nặng */}
                    <div className="shrink-0 w-12 h-12 bg-slate-900 border border-red-500/40 rounded-lg flex items-center justify-center p-1 shadow-sm">
                      <svg viewBox="0 0 48 48" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                        {/* Dải xích to bản bọc thép */}
                        <rect x="4" y="6" width="10" height="36" rx="2" fill="#1e293b" stroke="#334155" strokeWidth="1" />
                        <rect x="34" y="6" width="10" height="36" rx="2" fill="#1e293b" stroke="#334155" strokeWidth="1" />
                        <line x1="4" y1="12" x2="14" y2="12" stroke="#475569" strokeWidth="1.2" />
                        <line x1="4" y1="18" x2="14" y2="18" stroke="#475569" strokeWidth="1.2" />
                        <line x1="4" y1="24" x2="14" y2="24" stroke="#475569" strokeWidth="1.2" />
                        <line x1="4" y1="30" x2="14" y2="30" stroke="#475569" strokeWidth="1.2" />
                        <line x1="4" y1="36" x2="14" y2="36" stroke="#475569" strokeWidth="1.2" />
                        <line x1="34" y1="12" x2="44" y2="12" stroke="#475569" strokeWidth="1.2" />
                        <line x1="34" y1="18" x2="44" y2="18" stroke="#475569" strokeWidth="1.2" />
                        <line x1="34" y1="24" x2="44" y2="24" stroke="#475569" strokeWidth="1.2" />
                        <line x1="34" y1="31" x2="44" y2="31" stroke="#475569" strokeWidth="1.2" />
                        <line x1="34" y1="37" x2="44" y2="37" stroke="#475569" strokeWidth="1.2" />
                        {/* Thân xe vuông dày */}
                        <rect x="15" y="9" width="18" height="30" rx="3" fill="#ef4444" stroke="#b91c1c" strokeWidth="1.5" />
                        {/* Nòng đại bác to */}
                        <rect x="21" y="2" width="6" height="18" rx="1.5" fill="#cbd5e1" stroke="#64748b" strokeWidth="1" />
                        <rect x="20" y="2" width="8" height="3.5" rx="1" fill="#94a3b8" />
                        {/* Tháp pháo bát giác bọc thép */}
                        <rect x="17" y="16" width="14" height="15" rx="3" fill="#b91c1c" stroke="#f87171" strokeWidth="1.5" />
                        <circle cx="24" cy="23.5" r="3.5" fill="#ef4444" />
                      </svg>
                    </div>

                    <div className="min-w-0 flex-1 break-words">
                      <div className="flex items-center justify-between gap-1 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded bg-red-500/20 text-red-300 font-black flex items-center justify-center text-[10px] border border-red-500/40">4</span>
                          <h5 className="font-bold text-red-400 text-xs">Thiết Giáp Bọc Thép Hạng Nặng (Heavy)</h5>
                        </div>
                        <div className="flex items-center gap-2 font-mono text-[11px]">
                          <span className="text-red-400 font-bold">4 HP</span>
                          <span className="text-amber-300 font-bold">+400 điểm</span>
                        </div>
                      </div>
                      <p className="text-slate-300 text-[11px] mt-1 leading-relaxed">
                        • <b>Đặc tính:</b> Tốc độ 80 px/s, bọc giáp dày cộm <b>4 HP</b> (chịu tới 4 phát đạn tiêu chuẩn).<br />
                        • <b>Chiến thuật:</b> Dễ làm bia đỡ đạn cho xe khác, nên dùng góc bắn sau tường hoặc bắn liên thanh để diệt sớm.
                      </p>
                    </div>
                  </div>

                  {/* 4. Pháo Tự Hành Phóng Tên Lửa */}
                  <div className="bg-slate-950/70 border border-purple-500/30 hover:border-purple-500/60 rounded-xl p-3 flex items-start gap-3 min-w-0 transition-colors">
                    {/* SVG Minh Họa Pháo Tên Lửa */}
                    <div className="shrink-0 w-12 h-12 bg-slate-900 border border-purple-500/40 rounded-lg flex items-center justify-center p-1 shadow-sm">
                      <svg viewBox="0 0 48 48" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="5" y="7" width="9" height="34" rx="2" fill="#1e293b" stroke="#334155" strokeWidth="1" />
                        <rect x="34" y="7" width="9" height="34" rx="2" fill="#1e293b" stroke="#334155" strokeWidth="1" />
                        {/* Tia laser đỏ ngắm bắn phía trước */}
                        <line x1="24" y1="1" x2="24" y2="8" stroke="#ef4444" strokeWidth="1.2" strokeDasharray="2 2" />
                        {/* Thân xe */}
                        <rect x="15" y="10" width="18" height="28" rx="2" fill="#a855f7" stroke="#7e22ce" strokeWidth="1.5" />
                        {/* Bệ phóng tên lửa đôi */}
                        <rect x="18" y="3" width="4" height="18" rx="1" fill="#f8fafc" stroke="#7e22ce" strokeWidth="0.8" />
                        <rect x="26" y="3" width="4" height="18" rx="1" fill="#f8fafc" stroke="#7e22ce" strokeWidth="0.8" />
                        {/* Đầu đạn đỏ */}
                        <path d="M18 3 L20 1 L22 3 Z" fill="#ef4444" />
                        <path d="M26 3 L28 1 L30 3 Z" fill="#ef4444" />
                        {/* Tháp bệ phóng */}
                        <rect x="16" y="17" width="16" height="13" rx="2.5" fill="#7e22ce" stroke="#c084fc" strokeWidth="1.5" />
                      </svg>
                    </div>

                    <div className="min-w-0 flex-1 break-words">
                      <div className="flex items-center justify-between gap-1 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded bg-purple-500/20 text-purple-300 font-black flex items-center justify-center text-[10px] border border-purple-500/40">3</span>
                          <h5 className="font-bold text-purple-400 text-xs">Pháo Tự Hành Tên Lửa (Artillery)</h5>
                        </div>
                        <div className="flex items-center gap-2 font-mono text-[11px]">
                          <span className="text-purple-400 font-bold">3 HP</span>
                          <span className="text-amber-300 font-bold">+500 điểm</span>
                        </div>
                      </div>
                      <p className="text-slate-300 text-[11px] mt-1 leading-relaxed">
                        • <b>Đặc tính:</b> Bắn tên lửa nổ mạnh tầm xa, có <b>tia laser đỏ cảnh báo</b> chiếu thẳng trước họng pháo.<br />
                        • <b>Cảnh báo:</b> Đạn tên lửa sát thương cao, cần chú ý tia laser đỏ để né khỏi đường đạn trước khi pháo nổ!
                      </p>
                    </div>
                  </div>

                  {/* 5. Xe Truy Sát Đặc Nhiệm (Hunter Tank) */}
                  <div className="bg-slate-950/70 border border-rose-500/40 hover:border-rose-500/70 rounded-xl p-3 flex items-start gap-3 min-w-0 transition-colors">
                    {/* SVG Minh Họa Xe Truy Sát */}
                    <div className="shrink-0 w-12 h-12 bg-slate-900 border border-rose-500/50 rounded-lg flex items-center justify-center p-1 shadow-sm">
                      <svg viewBox="0 0 48 48" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="5" y="7" width="9" height="34" rx="2" fill="#1e293b" stroke="#334155" strokeWidth="1" />
                        <rect x="34" y="7" width="9" height="34" rx="2" fill="#1e293b" stroke="#334155" strokeWidth="1" />
                        {/* Thân xe màu đỏ rực */}
                        <rect x="15" y="10" width="18" height="28" rx="2.5" fill="#dc2626" stroke="#991b1b" strokeWidth="1.5" />
                        {/* Phù hiệu tia chớp vàng */}
                        <path d="M25 12 L22 18 L26 18 L23 25" stroke="#facc15" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        {/* Nòng pháo ngắm trực diện */}
                        <rect x="22" y="3" width="4" height="17" rx="1" fill="#f8fafc" stroke="#dc2626" strokeWidth="0.8" />
                        {/* Tháp pháo tròn có tâm ngắm */}
                        <circle cx="24" cy="24" r="7" fill="#991b1b" stroke="#f87171" strokeWidth="1.5" />
                        <line x1="24" y1="20" x2="24" y2="28" stroke="#facc15" strokeWidth="1" />
                        <line x1="20" y1="24" x2="28" y2="24" stroke="#facc15" strokeWidth="1" />
                      </svg>
                    </div>

                    <div className="min-w-0 flex-1 break-words">
                      <div className="flex items-center justify-between gap-1 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded bg-rose-600/30 text-rose-300 font-black flex items-center justify-center text-[10px] border border-rose-500/50">⚡</span>
                          <h5 className="font-bold text-rose-400 text-xs">Xe Truy Sát Đặc Nhiệm (Hunter Tank)</h5>
                        </div>
                        <div className="flex items-center gap-2 font-mono text-[11px]">
                          <span className="text-rose-400 font-bold">2-4 HP</span>
                          <span className="text-amber-300 font-bold">+150 điểm phụ</span>
                        </div>
                      </div>
                      <p className="text-slate-300 text-[11px] mt-1 leading-relaxed">
                        • <b>Cơ chế xuất hiện:</b> Được điều động sau khi xe cũ bị hạ hoặc sau khi bạn tiêu diệt từ 3 xe địch.<br />
                        • <b>Hành vi tác chiến:</b> Nòng pháo luôn tự động quay ngắm 4 hướng về phía xe bạn; di chuyển giữ cự ly an toàn để không bị va chạm hay kẹt đường.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* PHẦN 2: KHU VỰC SIÊU BOSS LÀM 1 Ô RIÊNG BIỆT (DEDICATED BOX THEO YÊU CẦU) */}
              {/* ========================================================================= */}
              <div className="border-2 border-rose-500/60 bg-gradient-to-br from-rose-950/40 via-slate-900 to-amber-950/30 rounded-2xl p-3.5 sm:p-4 shadow-2xl ring-1 ring-rose-500/30 space-y-3 min-w-0">
                {/* Header Riêng Biệt Cho Khu Vực Boss */}
                <div className="flex items-center justify-between border-b border-rose-500/30 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center text-slate-950 font-black shadow-md">
                      <Crown className="w-4 h-4 text-slate-950" />
                    </div>
                    <div>
                      <h4 className="font-black text-rose-300 text-xs sm:text-sm tracking-wide">
                        KHU VỰC ĐẠI BOSS CHIẾN DỊCH (TỔNG CỘNG 3 SIÊU TRÙM)
                      </h4>
                      <p className="text-[10px] text-amber-200/80">Kích Thước Khổng Lồ (Size x1.4) · Bắn Chậm Rãi Uy Lực · Đạn Kép Phá Thép</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[9.5px] font-mono bg-rose-950 text-rose-300 border border-rose-700 font-bold hidden sm:inline">
                    3 BOSS CHÍNH THỨC
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-amber-500/30 text-[10.5px] text-amber-200 leading-relaxed">
                  ⏱️ <b>Điều chỉnh nhịp độ:</b> Toàn bộ Siêu Trùm và Boss 360° được tinh chỉnh <b>tốc độ bắn chậm rãi (khoảng 2.4 giây/lần)</b> để bạn có đủ thời gian quan sát đường đạn, tận dụng vật cản né tránh và luồn lách phản kích thay vì bị xả đạn dồn dập!
                </div>

                {/* 3 BOSS CHI TIẾT KÈM ẢNH MINH HỌA */}
                <div className="space-y-3 min-w-0">
                  {/* BOSS 1: MÀN 10 - Chiến Hạm Titan */}
                  <div className="bg-slate-950/80 border border-rose-500/40 rounded-xl p-3 flex flex-col sm:flex-row items-start gap-3 min-w-0 shadow-md">
                    {/* SVG Minh Họa Boss Màn 10 */}
                    <div className="shrink-0 w-14 h-14 bg-slate-900 border border-rose-500/50 rounded-xl flex items-center justify-center p-1 shadow-md mx-auto sm:mx-0">
                      <svg viewBox="0 0 56 56" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                        {/* 4 Dải xích thép to lớn */}
                        <rect x="3" y="6" width="9" height="19" rx="1.5" fill="#1e293b" stroke="#475569" strokeWidth="1" />
                        <rect x="3" y="31" width="9" height="19" rx="1.5" fill="#1e293b" stroke="#475569" strokeWidth="1" />
                        <rect x="44" y="6" width="9" height="19" rx="1.5" fill="#1e293b" stroke="#475569" strokeWidth="1" />
                        <rect x="44" y="31" width="9" height="19" rx="1.5" fill="#1e293b" stroke="#475569" strokeWidth="1" />
                        {/* Thân xe khổng lồ đỏ titan */}
                        <rect x="13" y="10" width="30" height="36" rx="4" fill="#e11d48" stroke="#be123c" strokeWidth="1.8" />
                        {/* Nẹp giáp vàng kim */}
                        <rect x="16" y="13" width="24" height="4" rx="1" fill="#facc15" opacity="0.8" />
                        {/* Nòng pháo đôi đại bác */}
                        <rect x="22" y="2" width="4" height="20" rx="1" fill="#f1f5f9" stroke="#be123c" strokeWidth="0.8" />
                        <rect x="30" y="2" width="4" height="20" rx="1" fill="#f1f5f9" stroke="#be123c" strokeWidth="0.8" />
                        {/* Tháp pháo khổng lồ */}
                        <rect x="18" y="18" width="20" height="18" rx="3.5" fill="#be123c" stroke="#fb7185" strokeWidth="1.5" />
                        <circle cx="28" cy="27" r="4" fill="#facc15" />
                      </svg>
                    </div>

                    <div className="min-w-0 flex-1 break-words">
                      <div className="flex items-center justify-between gap-1 flex-wrap border-b border-slate-800 pb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded bg-rose-600 text-white font-black flex items-center justify-center text-[10px]">14</span>
                          <h5 className="font-bold text-rose-300 text-xs">BOSS MÀN 10: CHIẾN HẠM TITAN TỐI THƯỢNG</h5>
                        </div>
                        <div className="flex items-center gap-2 font-mono text-[11px]">
                          <span className="text-rose-400 font-bold">14 HP</span>
                          <span className="text-amber-300 font-bold">+1,500 điểm</span>
                        </div>
                      </div>
                      <p className="text-slate-300 text-[11px] mt-1 leading-relaxed">
                        • <b>Vị trí:</b> Cửa ngõ kết thúc Khu Quân Sự. Tốc độ di chuyển 46 px/s, bắn đại bác kép phá hủy tường thép.<br />
                        • <b>Chiến thuật đối đầu:</b> Tận dụng các cột thép kiên cố ở trung tâm; bắn kích nổ <b>Thùng Nhiên Liệu</b> khi Boss đi qua để gây sát thương nổ lớn!
                      </p>
                    </div>
                  </div>

                  {/* BOSS 2: MÀN 20 - Siêu Trùm Pháo Tháp 360° */}
                  <div className="bg-slate-950/80 border border-amber-500/50 rounded-xl p-3 flex flex-col sm:flex-row items-start gap-3 min-w-0 shadow-lg ring-1 ring-amber-500/30">
                    {/* SVG Minh Họa Boss Màn 20 - Tháp Pháo 360° */}
                    <div className="shrink-0 w-14 h-14 bg-slate-900 border border-amber-500/60 rounded-xl flex items-center justify-center p-1 shadow-md mx-auto sm:mx-0">
                      <svg viewBox="0 0 56 56" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                        {/* 4 Dải xích thép */}
                        <rect x="3" y="6" width="9" height="19" rx="1.5" fill="#1e293b" stroke="#475569" strokeWidth="1" />
                        <rect x="3" y="31" width="9" height="19" rx="1.5" fill="#1e293b" stroke="#475569" strokeWidth="1" />
                        <rect x="44" y="6" width="9" height="19" rx="1.5" fill="#1e293b" stroke="#475569" strokeWidth="1" />
                        <rect x="44" y="31" width="9" height="19" rx="1.5" fill="#1e293b" stroke="#475569" strokeWidth="1" />
                        {/* Thân xe bát giác titan */}
                        <polygon points="17,10 39,10 45,16 45,40 39,46 17,46 11,40 11,16" fill="#881337" stroke="#e11d48" strokeWidth="1.8" />
                        {/* Vòng bi xoay 360 độ màu vàng */}
                        <circle cx="28" cy="28" r="13" fill="#9f1239" stroke="#f59e0b" strokeWidth="1.8" strokeDasharray="4 2" />
                        {/* Nòng pháo đôi xoay 360 độ góc chéo 35 độ */}
                        <g transform="rotate(35 28 28)">
                          <line x1="28" y1="2" x2="28" y2="-6" stroke="#ef4444" strokeWidth="1.2" strokeDasharray="2 2" />
                          <rect x="25" y="4" width="3" height="18" rx="1" fill="#f8fafc" stroke="#be123c" strokeWidth="0.8" />
                          <rect x="30" y="4" width="3" height="18" rx="1" fill="#f8fafc" stroke="#be123c" strokeWidth="0.8" />
                          <circle cx="28" cy="28" r="7" fill="#e11d48" stroke="#facc15" strokeWidth="1.5" />
                        </g>
                      </svg>
                    </div>

                    <div className="min-w-0 flex-1 break-words">
                      <div className="flex items-center justify-between gap-1 flex-wrap border-b border-slate-800 pb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded bg-amber-500 text-slate-950 font-black flex items-center justify-center text-[10px]">20</span>
                          <h5 className="font-bold text-amber-300 text-xs">BOSS MÀN 20: SIÊU TRÙM PHÁO THÁP 360°</h5>
                        </div>
                        <div className="flex items-center gap-2 font-mono text-[11px]">
                          <span className="text-amber-400 font-black">20 HP (CỰC TRÂU)</span>
                          <span className="text-amber-300 font-bold">+2,500 điểm</span>
                        </div>
                      </div>
                      <p className="text-slate-300 text-[11px] mt-1 leading-relaxed">
                        • <b>Cơ chế độc quyền 360°:</b> Tháp pháo quay tự do 360 độ liên tục khóa theo bạn kèm tia laser đỏ; bắn đạn đôi phá thép theo mọi góc chéo.<br />
                        • <b>Tốc độ bắn & AI:</b> <b>Bắn chậm rãi 2.4s/lần</b> và luôn duy trì cự ly an toàn 105 - 165 pixel so với bạn (vừa lùi vừa nã pháo, không đâm va).<br />
                        • <b>Chiến thuật đối đầu:</b> Ẩn nấp sau các khối <b>Đá Hoa Cương thảo nguyên</b> (đá tự nhiên không vỡ) để chắn đạn 360°, nâng cấp xe lên Cấp 3/4 hoặc nhặt ⚡ Tăng tốc để luồn lách phản kích!
                      </p>
                    </div>
                  </div>

                  {/* BOSS 3: MÀN 21 - Đại Soái Titan Tối Cao */}
                  <div className="bg-slate-950/80 border border-yellow-500/60 rounded-xl p-3 flex flex-col sm:flex-row items-start gap-3 min-w-0 shadow-xl ring-1 ring-yellow-500/30">
                    {/* SVG Minh Họa Boss Màn 21 - Trùm Cuối Hoàng Gia */}
                    <div className="shrink-0 w-14 h-14 bg-slate-900 border border-yellow-500/70 rounded-xl flex items-center justify-center p-1 shadow-md mx-auto sm:mx-0">
                      <svg viewBox="0 0 56 56" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="2" y="5" width="10" height="20" rx="1.5" fill="#1e293b" stroke="#f59e0b" strokeWidth="1" />
                        <rect x="2" y="31" width="10" height="20" rx="1.5" fill="#1e293b" stroke="#f59e0b" strokeWidth="1" />
                        <rect x="44" y="5" width="10" height="20" rx="1.5" fill="#1e293b" stroke="#f59e0b" strokeWidth="1" />
                        <rect x="44" y="31" width="10" height="20" rx="1.5" fill="#1e293b" stroke="#f59e0b" strokeWidth="1" />
                        {/* Thân xe hoàng kim */}
                        <rect x="13" y="8" width="30" height="40" rx="4" fill="#713f12" stroke="#eab308" strokeWidth="2" />
                        <path d="M18 14 L28 10 L38 14 L38 42 L18 42 Z" fill="#991b1b" opacity="0.7" />
                        {/* Nòng đôi tối thượng */}
                        <rect x="22" y="1" width="4.5" height="22" rx="1" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.8" />
                        <rect x="29.5" y="1" width="4.5" height="22" rx="1" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.8" />
                        {/* Tháp pháo mạ vàng vương miện */}
                        <circle cx="28" cy="28" r="11" fill="#ca8a04" stroke="#fef08a" strokeWidth="2" />
                        <polygon points="24,30 26,24 28,27 30,24 32,30" fill="#fef08a" />
                      </svg>
                    </div>

                    <div className="min-w-0 flex-1 break-words">
                      <div className="flex items-center justify-between gap-1 flex-wrap border-b border-slate-800 pb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded bg-yellow-400 text-slate-950 font-black flex items-center justify-center text-[10px]">24</span>
                          <h5 className="font-bold text-yellow-300 text-xs">BOSS MÀN 21: ĐẠI SOÁI TITAN TỐI CAO 360°</h5>
                        </div>
                        <div className="flex items-center gap-2 font-mono text-[11px]">
                          <span className="text-yellow-400 font-black">24 HP (TRÙM CUỐI)</span>
                          <span className="text-yellow-300 font-bold">+3,000 điểm</span>
                        </div>
                      </div>
                      <p className="text-slate-300 text-[11px] mt-1 leading-relaxed">
                        • <b>Màn chơi cuối cùng:</b> Sở hữu sinh lực cao nhất trò chơi (24 HP vô địch), tháp pháo 360° khóa mục tiêu toàn sân, hộ tống bởi toàn bộ dàn xe hạng nặng.<br />
                        • <b>Chiến lược toàn thắng:</b> Nâng cấp Căn cứ lên Cấp 4-5 (Phím U) để có màn chắn 280 HP và pháo tự động hỗ trợ; dùng 💣 Bom tập kích hoặc Bom nguyên tử dọn quân hộ tống trước khi dồn hỏa lực vào Đại Soái Titan!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MỤC 5: Địa Hình & Căn Cứ - KHÔNG BỊ TRÀN RA NGOÀI */}
          {activeTab === 'TILES' && (
            <div className="space-y-3 min-w-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 min-w-0">
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-start gap-2.5 min-w-0 overflow-hidden">
                  <div className="w-8 h-8 rounded-lg bg-amber-900/40 border border-amber-700/60 flex items-center justify-center text-amber-500 font-bold text-sm shrink-0">
                    📦
                  </div>
                  <div className="min-w-0 flex-1 break-words">
                    <h4 className="font-bold text-amber-400 text-xs">Thùng Gỗ Quân Sự</h4>
                    <p className="text-slate-300 text-[11px] mt-0.5 leading-relaxed">
                      Vật cản cơ bản, có thể bắn phá dọn đường bằng 1 phát đạn hoặc ẩn nấp né tránh hỏa lực địch.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-start gap-2.5 min-w-0 overflow-hidden">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-600 flex items-center justify-center text-slate-300 font-bold text-sm shrink-0">
                    🧱
                  </div>
                  <div className="min-w-0 flex-1 break-words">
                    <h4 className="font-bold text-slate-300 text-xs">Tường Bê Tông Cốt Thép</h4>
                    <p className="text-slate-300 text-[11px] mt-0.5 leading-relaxed">
                      Rất cứng cáp, chịu được 2 phát đạn. Trúng 1 viên sẽ xuất hiện vết nứt rạn cảnh báo.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-start gap-2.5 min-w-0 overflow-hidden">
                  <div className="w-8 h-8 rounded-lg bg-slate-700 border border-slate-500 flex items-center justify-center text-cyan-200 font-bold text-sm shrink-0">
                    ⚙️
                  </div>
                  <div className="min-w-0 flex-1 break-words">
                    <h4 className="font-bold text-cyan-300 text-xs">Tường Thép Hợp Kim</h4>
                    <p className="text-slate-300 text-[11px] mt-0.5 leading-relaxed">
                      Chống đạn thông thường hoàn toàn! Chỉ có thể bị phá hủy bởi xe tăng Người Chơi Cấp 4 hoặc Trùm Titan.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-start gap-2.5 min-w-0 overflow-hidden">
                  <div className="w-8 h-8 rounded-lg bg-sky-950 border border-sky-600 flex items-center justify-center text-sky-400 font-bold text-sm shrink-0">
                    💧
                  </div>
                  <div className="min-w-0 flex-1 break-words">
                    <h4 className="font-bold text-sky-300 text-xs">Vùng Đầm Lầy Nước Sâu</h4>
                    <p className="text-slate-300 text-[11px] mt-0.5 leading-relaxed">
                      Chiến xa không thể vượt qua, nhưng đạn pháo và tên lửa có thể bay qua bắn nhau bình thường.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-start gap-2.5 min-w-0 overflow-hidden">
                  <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-700 flex items-center justify-center text-emerald-400 font-bold text-sm shrink-0">
                    🌿
                  </div>
                  <div className="min-w-0 flex-1 break-words">
                    <h4 className="font-bold text-emerald-300 text-xs">Bụi Cây Dã Chiến (Ẩn Nấp & Che Khuất Tầm Nhìn)</h4>
                    <p className="text-slate-300 text-[11px] mt-0.5 leading-relaxed">
                      Che khuất hoàn toàn tầm nhìn: Khi xe tăng địch ở trong hoặc phía sau bụi cây, bạn không thể nhìn thấy chúng (kể cả tia ngắm laser và chấm đỏ radar). <b>Chỉ khi bạn tiến vào trong bụi cây</b> thì tán lá xung quanh mới trở nên trong suốt, mở khóa tầm nhìn xuyên thấu để phát hiện xe địch bên trong hoặc phía sau bụi rậm!
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/60 border border-red-900/60 rounded-xl p-3 flex items-start gap-2.5 min-w-0 overflow-hidden">
                  <div className="w-8 h-8 rounded-lg bg-red-950 border border-red-500 flex items-center justify-center text-red-400 font-bold text-sm shrink-0">
                    💥
                  </div>
                  <div className="min-w-0 flex-1 break-words">
                    <h4 className="font-bold text-red-400 text-xs">Thùng Nhiên Liệu Nổ Chiến Thuật (Thùng Nổ)</h4>
                    <p className="text-slate-300 text-[11px] mt-0.5 leading-relaxed">
                      Thay thế các mặt băng trong Chế độ Sinh Tồn và Chiến Dịch từ Màn 7 trở đi: Khi bạn bắn trúng thùng nổ, sóng nổ cực mạnh sẽ kích hoạt phá hủy ngay lập tức các xe tăng địch xung quanh. Nếu bạn đứng gần vụ nổ sẽ bị trừ HP! Tuy nhiên, khi xe địch bắn vỡ thùng nổ, các xe địch xung quanh hoàn toàn không bị ảnh hưởng.
                    </p>
                  </div>
                </div>
              </div>

              {/* 5 Cấp độ căn cứ */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 mt-2 min-w-0 overflow-hidden">
                <h4 className="font-bold text-amber-400 text-xs mb-2">HỆ THỐNG NÂNG CẤP CĂN CỨ (CẤP 1 → CẤP 5)</h4>
                <div className="space-y-1.5 text-[11px] leading-relaxed text-slate-300 break-words">
                  <p>• <b>Cấp 1:</b> Tường thùng gỗ tiếp tế cơ bản (2 HP căn cứ, chưa có màn chắn).</p>
                  <p>• <b>Cấp 2:</b> Tường bê tông gia cố chịu 2 đạn + Màn chắn năng lượng 50 HP (Tự động hồi phục).</p>
                  <p>• <b>Cấp 3:</b> Tường thép chống đạn + Màn chắn 100 HP + <b>Pháo tự động phòng thủ</b>.</p>
                  <p>• <b>Cấp 4:</b> Thành trì Titanium + Màn chắn hoàng kim 180 HP + Pháo tự động bắn nhanh.</p>
                  <p>• <b>Cấp 5:</b> Pháo đài lượng tử tối thượng + Màn chắn 280 HP siêu cứng + Pháo kép tự động.</p>
                </div>
              </div>
            </div>
          )}

          {/* MỤC 6: Hướng Dẫn Điều Khiển - ĐÃ XÓA MỤC RETRO/CRT */}
          {activeTab === 'CONTROLS' && (
            <div className="space-y-3 min-w-0">
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-2.5 min-w-0">
                <h4 className="font-bold text-emerald-400 text-xs">BẢNG PHÍM ĐIỀU KHIỂN CHIẾN XA & VŨ KHÍ</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 rounded bg-slate-800 border border-slate-700 font-mono text-white font-bold">W A S D</kbd>
                    <span className="text-slate-300">Lái xe 4 hướng</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 font-mono text-white font-bold">Space</kbd>
                    <span className="text-slate-300">Bắn đại bác</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 rounded bg-slate-800 border border-slate-700 font-mono text-amber-300 font-bold">C</kbd>
                    <span className="text-slate-300">Cửa hàng quân sự & nâng cấp</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 rounded bg-slate-800 border border-slate-700 font-mono text-amber-300 font-bold">U</kbd>
                    <span className="text-slate-300">Nâng cấp căn cứ</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 rounded bg-slate-800 border border-slate-700 font-mono text-rose-300 font-bold">B</kbd>
                    <span className="text-slate-300">Gọi không kích diệt địch (Airstrike)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 rounded bg-slate-800 border border-slate-700 font-mono text-cyan-300 font-bold">F</kbd>
                    <span className="text-slate-300">Bão băng đông cứng địch (Cryo)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 rounded bg-slate-800 border border-slate-700 font-mono text-emerald-300 font-bold">R</kbd>
                    <span className="text-slate-300">Kích hoạt sửa chữa khẩn cấp</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 rounded bg-slate-800 border border-slate-700 font-mono text-purple-300 font-bold">M</kbd>
                    <span className="text-slate-300">Bật/tắt nhạc sảnh (BGM)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 rounded bg-slate-800 border border-slate-700 font-mono text-sky-300 font-bold">H</kbd>
                    <span className="text-slate-300">Mở sổ tay tác chiến</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 rounded bg-slate-800 border border-slate-700 font-mono text-white font-bold">P / Esc</kbd>
                    <span className="text-slate-300">Tạm dừng trận đấu</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-2 min-w-0">
                <h4 className="font-bold text-white text-xs">CÁC NÚT CHỨC NĂNG TRÊN THANH CÔNG CỤ</h4>
                <div className="space-y-2 text-[11px] text-slate-300">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-slate-800 text-amber-400 shrink-0"><Music className="w-3.5 h-3.5" /></div>
                    <span className="break-words"><b>Nút Nhạc Sảnh (BGM):</b> Nằm ngay cạnh nút Tạm dừng (hoặc phím M), bật/tắt nhạc nền sảnh chờ (kiệt tác piano Beethoven êm ái). Trong trận chiến đã tắt toàn bộ nhạc nền để người chơi hoàn toàn tập trung vào âm thanh chiến xa, tiếng pháo bắn và tiếng bom nổ chân thực.</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-slate-800 text-amber-300 shrink-0"><Sun className="w-3.5 h-3.5" /></div>
                    <span className="break-words"><b>Nút Thời Tiết:</b> Chuyển đổi giữa <i>Quang đãng</i> → <i>Mưa nhẹ</i> → <i>Tuyết rơi</i>.</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-slate-800 text-emerald-400 shrink-0"><Compass className="w-3.5 h-3.5" /></div>
                    <span className="break-words"><b>Chế Độ Lái:</b> Lái xe <i>Phím 4 hướng cổ điển</i> (WASD hoặc phím mũi tên) chuẩn xác.</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-slate-800 text-emerald-400 shrink-0"><Volume2 className="w-3.5 h-3.5" /></div>
                    <span className="break-words"><b>Âm Thanh:</b> Bật hoặc tắt toàn bộ tiếng súng, tiếng bom nổ và tiếng động cơ xe.</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-slate-800 text-white shrink-0"><Pause className="w-3.5 h-3.5" /></div>
                    <span className="break-words"><b>Tạm Dừng:</b> Tạm dừng trận đấu để bạn nghỉ tay hoặc điều chỉnh chiến thuật.</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chân trang */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800 bg-slate-950/70 shrink-0 text-xs gap-3">
          <span className="text-slate-400 text-[11px]">
            Bấm phím <b>H</b> hoặc nút <b>Sổ Tay</b> để mở lại hướng dẫn này (Game sẽ tự động tạm dừng khi xem).
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold transition-colors cursor-pointer shrink-0"
          >
            ĐÃ HIỂU & TIẾP TỤC
          </button>
        </div>
      </div>
    </div>
  );
}
