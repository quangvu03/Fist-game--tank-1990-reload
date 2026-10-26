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
            <span>Chiến Xa Địch</span>
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
                    <h4 className="font-bold text-white text-xs">BOM HẠT NHÂN HỦY DIỆT</h4>
                    <p className="text-slate-300 text-[11px] mt-0.5">
                      Kích hoạt xung nổ toàn diện phá hủy tức thì tất cả xe tăng địch đang có mặt trên bản đồ và nhận trọn điểm thưởng!
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

          {/* MỤC 4: Chiến Xa Địch */}
          {activeTab === 'ENEMIES' && (
            <div className="space-y-2.5 min-w-0">
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-center justify-between min-w-0">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 h-6 rounded-md bg-cyan-500 flex items-center justify-center text-slate-950 font-black text-[10px] shrink-0">
                    1
                  </span>
                  <div className="min-w-0 flex-1 break-words">
                    <h4 className="font-bold text-cyan-400 text-xs">Xe Trinh Sát Siêu Tốc</h4>
                    <p className="text-slate-400 text-[11px]">Chạy rất nhanh, bắn liên tục, máu yếu (1 HP).</p>
                  </div>
                </div>
                <div className="text-right font-mono shrink-0 pl-2">
                  <span className="text-amber-300 font-bold">+100 điểm</span>
                </div>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-center justify-between min-w-0">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 h-6 rounded-md bg-amber-500 flex items-center justify-center text-slate-950 font-black text-[10px] shrink-0">
                    2
                  </span>
                  <div className="min-w-0 flex-1 break-words">
                    <h4 className="font-bold text-amber-400 text-xs">Chiến Xa Đột Kích Cơ Động</h4>
                    <p className="text-slate-400 text-[11px]">Hỏa lực đều đặn, cơ động và bền bỉ (2 HP).</p>
                  </div>
                </div>
                <div className="text-right font-mono shrink-0 pl-2">
                  <span className="text-amber-300 font-bold">+200 điểm</span>
                </div>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-center justify-between min-w-0">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 h-6 rounded-md bg-red-500 flex items-center justify-center text-white font-black text-[10px] shrink-0">
                    4
                  </span>
                  <div className="min-w-0 flex-1 break-words">
                    <h4 className="font-bold text-red-400 text-xs">Thiết Giáp Bọc Thép Hạng Nặng</h4>
                    <p className="text-slate-400 text-[11px]">Bọc giáp dày cộm, chịu tới 4 phát đạn pháo (4 HP).</p>
                  </div>
                </div>
                <div className="text-right font-mono shrink-0 pl-2">
                  <span className="text-amber-300 font-bold">+400 điểm</span>
                </div>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-center justify-between min-w-0">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 h-6 rounded-md bg-purple-500 flex items-center justify-center text-white font-black text-[10px] shrink-0">
                    3
                  </span>
                  <div className="min-w-0 flex-1 break-words">
                    <h4 className="font-bold text-purple-400 text-xs">Pháo Tự Hành Tên Lửa Tầm Xa</h4>
                    <p className="text-slate-400 text-[11px]">Bắn tên lửa nổ mạnh, có tia laser đỏ cảnh báo hướng ngắm (3 HP).</p>
                  </div>
                </div>
                <div className="text-right font-mono shrink-0 pl-2">
                  <span className="text-amber-300 font-bold">+500 điểm</span>
                </div>
              </div>

              <div className="bg-rose-950/20 border border-rose-500/40 rounded-xl p-3 flex items-center justify-between min-w-0">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 h-6 rounded-md bg-rose-600 flex items-center justify-center text-white font-black text-[10px] shrink-0">
                    14
                  </span>
                  <div className="min-w-0 flex-1 break-words">
                    <h4 className="font-bold text-rose-400 text-xs">Siêu Chiến Hạm Titan Tối Thượng (Trùm)</h4>
                    <p className="text-slate-300 text-[11px]">Siêu pháo đài khổng lồ 4 xích, nòng đôi phá thủng thép, cực kỳ nguy hiểm (14 HP).</p>
                  </div>
                </div>
                <div className="text-right font-mono shrink-0 pl-2">
                  <span className="text-amber-300 font-bold">+1,500 điểm</span>
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
                    <h4 className="font-bold text-emerald-300 text-xs">Bụi Cây Dã Chiến</h4>
                    <p className="text-slate-300 text-[11px] mt-0.5 leading-relaxed">
                      Cung cấp khả năng ngụy trang tác chiến. Tán cây bán trong suốt giúp người chơi vẫn nhìn rõ xe bên dưới.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-start gap-2.5 min-w-0 overflow-hidden">
                  <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-400 flex items-center justify-center text-cyan-300 font-bold text-sm shrink-0">
                    ❄️
                  </div>
                  <div className="min-w-0 flex-1 break-words">
                    <h4 className="font-bold text-cyan-200 text-xs">Mặt Đường Băng Trơn Trượt</h4>
                    <p className="text-slate-300 text-[11px] mt-0.5 leading-relaxed">
                      Mặt đường băng tuyết trơn trượt, làm xe bị trượt nhẹ theo đà quán tính khi rẽ ngoặt.
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
                <h4 className="font-bold text-emerald-400 text-xs">BẢNG PHÍM ĐIỀU KHIỂN CHIẾN XA</h4>
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
                    <kbd className="px-2 py-1 rounded bg-slate-800 border border-slate-700 font-mono text-amber-300 font-bold">U</kbd>
                    <span className="text-slate-300">Nâng cấp căn cứ</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 rounded bg-slate-800 border border-slate-700 font-mono text-emerald-300 font-bold">H</kbd>
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
