# TÀI LIỆU CHI TIẾT HỆ THỐNG GAME: XE TĂNG ĐẠI CHIẾN (TANK BATTLE 1990 REBORN)

> **Mục đích tài liệu:** Bản hướng dẫn và tra cứu toàn diện về mọi thành phần trong mã nguồn trò chơi: Chiến xa người chơi, chiến xa địch, hệ thống cấp bậc căn cứ, vật phẩm tiếp tế (Power-ups), cơ chế địa hình, công thức cân bằng độ khó theo Level, cùng các chế độ chơi.

---

## MỤC LỤC
1. [Tổng Quan Kiến Trúc & Kích Thước Chiến Trường](#1-tổng-quan-kiến-trúc--kích-thước-chiến-trường)
2. [Hệ Thống Chiến Xa Người Chơi (4 Cấp Bậc)](#2-hệ-thống-chiến-xa-người-chơi-4-cấp-bậc)
3. [Hệ Thống Xe Tăng Địch & Độ Khó Theo Level](#3-hệ-thống-xe-tăng-địch--độ-khó-theo-level)
4. [Hệ Thống Căn Cứ Chỉ Huy (5 Cấp Độ Công Sự)](#4-hệ-thống-căn-cứ-chỉ-huy-5-cấp-độ-công-sự)
5. [Toàn Bộ Vật Phẩm Tiếp Tế (Power-Ups)](#5-toàn-bộ-vật-phẩm-tiếp-tế-power-ups)
6. [Hệ Thống Địa Hình & Cơ Chế Va Chạm](#6-hệ-thống-địa-hình--cơ-chế-va-chạm)
7. [Các Chế Độ Chơi (Game Modes)](#7-các-chế-độ-chơi-game-modes)
8. [Hệ Thống Điều Khiển & Phím Tắt Tác Chiến](#8-hệ-thống-điều-khiển--phím-tắt-tác-chiến)

---

## 1. TỔNG QUAN KIẾN TRÚC & KÍCH THƯỚC CHIẾN TRƯỜNG
 
- **Kích thước lưới logic (Grid Layout):** `48 cột ngang × 27 hàng dọc`.
- **Kích thước một ô gạch (Tile Size):** `26 × 26 pixels`.
- **Độ phân giải hiển thị chuẩn (Virtual Resolution):** `1248px (ngang) × 702px (dọc)`.
- **Tỉ lệ khung hình (Aspect Ratio):** Chuẩn Widescreen **16:9** (1.778:1) hoàn hảo cho màn hình máy tính chữ nhật (1080p/2K/4K) và điện thoại xoay ngang (Landscape).
- **Tọa độ Sở Chỉ Huy Đại Bàng (Base Footprint):** Cột 23 & 24, Hàng 24 & 25 (ngay chính giữa chân bản đồ, 23 cột cánh trái và 23 cột cánh phải đối xứng hoàn hảo).
- **Điểm xuất kích của phe địch:** 5 hướng tiến công chiến lược trải rộng toàn màn hình:
  - *Cánh Tả Viền:* Cột 2 (x: 52px)
  - *Tiền Tiêu Cánh Trái:* Cột 13 (x: 338px)
  - *Trung Lộ:* Cột 23 (x: 598px)
  - *Tiền Tiêu Cánh Phải:* Cột 34 (x: 884px)
  - *Cánh Hữu Viền:* Cột 45 (x: 1170px)
- **Bản đồ Sinh Tồn Mở Rộng:** `64 cột ngang × 36 hàng dọc` (1664px × 936px - đúng tỷ lệ 16:9).

---

## 2. HỆ THỐNG CHIẾN XA NGƯỜI CHƠI (4 CẤP BẬC)

Người chơi bắt đầu ở **Cấp 1** và có thể nâng cấp tối đa lên **Cấp 4** thông qua việc nhặt vật phẩm **⭐ Ngôi Sao Thăng Cấp (Star)**. Cấp bậc nâng cấp được bảo lưu xuyên suốt các màn chơi chiến dịch cho đến khi hết sạch mạng sống.

| Cấp | Tên Chiến Xa | HP Tối Đa | Tốc Độ Chạy | Vận Tốc Đạn | Hồi Chiêu Bắn | Tốc Độ Bắn | Đặc Điểm Hỏa Lực & Kỹ Năng |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **C1** | **Pháo Cơ Bản** | 3 HP | 110 px/s | 260 px/s | 0.45s | ~2.2 phát/s | Đạn đơn tiêu chuẩn. Sát thương 1 HP/viên. |
| **C2** | **Pháo Siêu Tốc** | 4 HP (+1) | 120 px/s | 330 px/s | 0.35s | ~2.9 phát/s | Đạn nạp phản lực bay nhanh hơn +27%, xả đạn nhanh hơn. |
| **C3** | **Song Nòng Hạng Nặng** | 5 HP (+2) | 125 px/s | 350 px/s | 0.28s | ~3.6 phát/s | **⚡ Nòng kép bắn 2 viên đạn song song** cùng lúc, diện tích sát thương gấp đôi. |
| **C4** | **Chiến Xa Phá Thép** | 6 HP (+3) | 135 px/s | 400 px/s | 0.22s | ~4.5 phát/s | **🔥 Bắn xuyên thủng và phá hủy tường thép hợp kim**. Tốc độ bắn cực nhanh. |

### Cơ chế Sinh Lực & Cứu Hộ:
- **Thanh máu trực tiếp trên nóc xe:** Hiển thị số vạch HP tương ứng. Màu xanh lá khi >50%, màu vàng khi 25–50%, màu đỏ kèm hiệu ứng khói lửa nhấp nháy khi còn 1 HP.
- **Mạng dự phòng (Lives):** Bắt đầu với 3 mạng sống (hiển thị trái tim đỏ). Khi bị tiêu diệt hết máu, xe sẽ mất 1 mạng và hồi sinh ngay lập tức tại vị trí xuất kích cùng **khiên bảo hộ từ trường 3.5 giây**.

---

## 3. HỆ THỐNG XE TĂNG ĐỊCH & ĐỘ KHÓ THEO LEVEL

### 3.1 Bảng Thông Số 5 Chủng Loại Chiến Xa Địch

| Chủng Loại Xe | HP Máu | Tốc Độ Cơ Bản | Vận Tốc Đạn | Thời Gian Nạp Đạn | Điểm Thưởng | Hành Vi & Chiến Thuật |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **SCOUT** *(Trinh Sát Tốc Độ)* | 1 | 130 px/s | 230 px/s | 1.1s | +100 đ | Màu xanh Cyan. Cơ động cực nhanh, chuyên luồn lách qua các hẻm nhỏ để đột kích căn cứ. |
| **ASSAULT** *(Đột Kích Đa Năng)* | 2 | 105 px/s | 250 px/s | 0.9s | +200 đ | Màu vàng Amber. Cân bằng giữa tốc độ và độ bền, hỏa lực đều đặn. |
| **HEAVY** *(Thiết Giáp Bọc Thép)* | 4 | 80 px/s | 210 px/s | 1.3s | +400 đ | Màu đỏ Crimson. Lớp giáp dày chịu 4 phát đại bác. Cực kỳ nguy hiểm khi bảo vệ căn cứ địch. |
| **ARTILLERY** *(Pháo Tự Hành Tên Lửa)* | 3 | 70 px/s | 290 px/s | 2.2s | +500 đ | Màu tím Purple. Bắn tên lửa hạng nặng (2 sát thương), **có tia ngắm laser đỏ cảnh báo** hướng bắn tầm xa. |
| **BOSS** *(Siêu Hạm Titan Tối Thượng)* | 14 | 65 px/s | 270 px/s | 0.8s | +1,500 đ | Kích thước khổng lồ 1.4x, 4 bánh xích, **bắn phá thủng tường thép**, xả đạn liên hồi. |

### 3.2 Cơ Chế Xe Mang Hàng Tiếp Tế (Flashing Tanks)
- Một số xe tăng địch khi xuất hiện sẽ có hiệu ứng **nhấp nháy hào quang vàng rực**.
- Khi bắn hạ thành công xe này, một **Hộp Tiếp Tế Quân Sự ngẫu nhiên** sẽ rơi ra ngay tại vị trí xe nổ để người chơi thu thập.

### 3.3 Công Thức Điều Chỉnh Độ Khó Động Theo Cấp Độ (Level Scaling)
Để đảm bảo trải nghiệm người chơi từ dễ đến khó (màn 1 dễ làm quen, các màn sau gay cấn):

$$\text{Tốc Độ Thực Tế} = \text{Tốc Độ Gốc} \times \min(1.25, 0.68 + (\text{Level} - 1) \times 0.06)$$

$$\text{Hồi Chiêu Nạp Đạn} = \text{Thời Gian Gốc} \times \max(0.80, 1.25 - (\text{Level} - 1) \times 0.05)$$

$$\text{Vận Tốc Đạn Địch} = \text{Vận Tốc Gốc} \times \min(1.20, 0.85 + (\text{Level} - 1) \times 0.04)$$

- **Level 1:** Địch chạy ở **68% tốc độ**, bắn thưa hơn 25%, đạn bay 85% tốc độ.
- **Level 5:** Tốc độ tăng lên 92%, nhịp bắn chuẩn mực.
- **Level 8+:** Địch đạt đỉnh hỏa lực: tốc độ tối đa 110–125%, xả đạn nhanh hơn 20%, đạn bay nhanh 120%.

---

## 4. HỆ THỐNG CĂN CỨ CHỈ HUY (5 CẤP ĐỘ CÔNG SỰ)

Sở chỉ huy là biểu tượng **Đại Bàng Quân Đội** tại trung tâm phòng tuyến. Nếu căn cứ bị bắn nổ hết máu, bạn sẽ thua ngay lập tức! Người chơi có thể dùng điểm số kiếm được trong trận để bấm **phím U** hoặc nhấp nút **NÂNG CẤP CĂN CỨ**.

| Cấp | Tên Công Sự | Máu Trụ | Lực Trường Khiên | Hồi Khiên | Loại Tường Bảo Vệ Bao Quanh | Pháo Tự Động Phòng Thủ | Chi Phí Nâng |
| :---: | :--- | :---: | :---: | :---: | :--- | :---: | :---: |
| **C1** | **Căn Cứ Thùng Tiếp Tế** | 2 HP | 0 HP (Chưa có) | 0 | Thùng gỗ tiếp tế (chịu 1 đạn) | Không | 500 đ |
| **C2** | **Pháo Đài Bê Tông Kiên Cố** | 3 HP | 50 HP (Hào quang xanh) | +6 HP/s | Tường bê tông gia cố (chịu 2 đạn) | Không | 1,200 đ |
| **C3** | **Thành Trì Thép Hợp Kim** | 4 HP | 100 HP (Hào quang lam) | +10 HP/s | Tường thép hợp kim chống đạn | **Có pháo tự động** (2.2s/phát) | 2,200 đ |
| **C4** | **Chiến Lũy Titanium Bọc Thép** | 5 HP | 180 HP (Hào quang vàng) | +15 HP/s | Khung thép siêu cứng chịu 4 đạn | Pháo tự động liên thanh (1.6s/phát) | 3,500 đ |
| **C5** | **Pháo Đài Lượng Tử Tối Thượng** | 6 HP | 280 HP (Hào quang ngọc) | +24 HP/s | Rào chắn năng lượng lượng tử | Pháo kép nã đạn thần tốc (1.0s/phát) | **TỐI ĐA** |

### Đặc Điểm Vượt Trội Khi Nâng Cấp Căn Cứ:
1. **Khôi phục hoàn toàn tường phòng thủ:** Mọi mảng tường quanh căn cứ bị địch phá vỡ trước đó sẽ lập tức được xây mới và gia cố thành tường cấp cao tương ứng.
2. **Đẩy lùi chống kẹt (Ejection):** Nếu có xe tăng đang đứng đè lên vị trí tường mới dựng, hệ thống sẽ tự động dịch chuyển xe ra vị trí trống an toàn gần nhất mà không gây kẹt hình.
3. **Màn chắn tự phục hồi:** Sau 5 giây không trúng sát thương, màn chắn sẽ tự động sạc lại máu liên tục mỗi giây.
4. **Pháo tự động thân thiện (Auto-Turret):** Đạn từ pháo phòng không của căn cứ được lập trình xuyên qua tường nhà không làm hỏng công sự, chỉ tiêu diệt quân địch xâm phạm.

---

## 5. TOÀN BỘ VẬT PHẨM TIẾP TẾ (POWER-UPS)

| Biểu Tượng | Tên Vật Phẩm | Thời Gian Tác Dụng | Chi Tiết Công Dụng Chiến Thuật |
| :---: | :--- | :---: | :--- |
| ⭐ | **Ngôi Sao Thăng Cấp (Star)** | Vĩnh viễn (đến khi nổ) | Nâng cấp xe tăng người chơi lên cấp bậc tiếp theo (C1 → C2 → C3 → C4). Tăng tốc chạy, tăng tốc đạn, mở khóa nòng đôi và bắn phá tường thép. |
| 🛡️ | **Khiên Lực Trường (Shield)** | 10 Giây | Tạo màn chắn hào quang bao quanh thân xe. Người chơi miễn nhiễm 100% với mọi phát đạn và tên lửa của địch trong thời gian hiệu lực. |
| 💣 | **Bom Hủy Diệt (Bomb)** | Tức thì | Kích nổ xung sóng nguyên tử quét sạch toàn bộ xe tăng địch đang hiện diện trên bản đồ, người chơi nhận trọn vẹn điểm thưởng của tất cả xe bị nổ. |
| ⏰ | **Đồng Hồ Đóng Băng (Clock)** | 7 Giây | Làm tê liệt hoàn toàn thời gian của quân địch. Tất cả xe địch chuyển sang màu xanh băng tuyết, không thể di chuyển hay khai hỏa. |
| ⛏️ | **Công Sự Thép Cứu Nguy (Shovel)** | 16 Giây | Thay thế toàn bộ tường gạch quanh căn cứ thành tường thép hợp kim bất hoại, đồng thời **hồi phục ngay +60 HP cho màn chắn căn cứ**. |
| 🏰 | **Cải Tiến Căn Cứ (Fortress)** | Vĩnh viễn | Nâng cấp ngay tức thì căn cứ lên thêm 1 Cấp (C1 → C2...) mà không tốn điểm, sửa chữa toàn bộ tường và nạp +100 HP cho khiên năng lượng. |
| ❤️ | **Cứu Thương Dã Chiến (Heart)** | Tức thì | Hồi phục đầy đủ 100% thanh HP của xe tăng người chơi, đồng thời **cộng thêm +1 Mạng sống dự phòng**. |
| ⚡ | **Tăng Tốc Điện Từ (Speed)** | 8 Giây | Tăng +35 px/s tốc độ di chuyển, tăng +25% tốc độ nạp đạn (xả đạn nhanh hơn) và tăng +15% vận tốc bay của đạn. Có đồng hồ đếm lùi trực quan. |

---

## 6. HỆ THỐNG ĐỊA HÌNH & CƠ CHẾ VA CHẠM

| Biểu Tượng | Loại Địa Hình | Độ Bền / Tương Tác Xe | Tương Tác Đạn Pháo |
| :---: | :--- | :--- | :--- |
| 📦 | **Thùng Gỗ Tiếp Tế (Brick)** | Chặn xe di chuyển. | Bị phá hủy bởi **1 phát đạn** bất kỳ. |
| 🧱 | **Bê Tông Gia Cố (Reinforced)** | Chặn xe di chuyển. | Bị phá hủy sau **2 phát đạn** (có hiệu ứng rạn nứt sau phát thứ 1). |
| ⚙️ | **Tường Thép Hợp Kim (Steel)** | Chặn xe di chuyển. | **Miễn nhiễm đạn thường**. Chỉ bị phá hủy bởi xe người chơi Cấp 4 hoặc Trùm Titan. |
| 💧 | **Vùng Nước Sâu (Water)** | **Chặn xe di chuyển**, xe không thể đi qua. | Đạn pháo, tên lửa và laser **bay xuyên qua bình thường**. |
| 🌿 | **Bụi Cây Dã Chiến (Bush)** | Xe đi xuyên qua được. **Cơ chế che khuất tầm nhìn (Line-of-Sight Occlusion):** Khi xe tăng địch ở trong hoặc phía sau bụi cây, người chơi hoàn toàn không nhìn thấy xe địch, tia laser cảnh báo lẫn chấm đỏ radar. **Chỉ khi người chơi tiến vào trong bụi cây** thì bụi rậm mới trở nên bán trong suốt, mở khóa tầm nhìn xuyên thấu giúp người chơi nhìn rõ mọi mục tiêu ẩn nấp bên trong hoặc phía sau bụi rậm! Đồng thời xe người chơi nhận trạng thái `🌿 ẨN NẤP`. | Đạn pháo bay xuyên qua bình thường. |
| 💥 | **Thùng Nhiên Liệu Nổ (Explosive Barrel)** | Chặn xe di chuyển. **Cơ chế kích nổ chiến thuật:** Xuất hiện trong Chế độ Sinh Tồn và Chiến Dịch từ Màn 7 trở đi (thay thế hoàn toàn mặt băng). Khi Người Chơi bắn trúng thùng nổ, sóng nổ cực mạnh sẽ tiêu diệt ngay lập tức các xe tăng địch xung quanh. Nếu người chơi đứng quá gần vụ nổ sẽ bị trừ HP! Khi xe địch bắn nổ thùng, các xe địch xung quanh hoàn toàn không bị ảnh hưởng. | Kích nổ ngay lập tức khi trúng 1 viên đạn hoặc sóng nổ lân cận. |
| 🛡️ | **Màn Năng Lượng (Energy Barrier)**| Tường lượng tử siêu bền của căn cứ Cấp 5. | Chịu được từ **3 đến 5 phát đạn pháo**. |

---

## 7. CÁC CHẾ ĐỘ CHƠI (GAME MODES)

1. **Chiến Dịch (Campaign Mode):**
   - Gồm 10 Màn chơi (Level 1 đến Level 10) thiết kế thủ công tinh xảo:
     - *Màn 1:* Bình nguyên mở đầu, địch thưa và chậm.
     - *Màn 2:* Giao lộ chiến lược với nhiều vật cản.
     - *Màn 3:* Hầm ngầm kiên cố, căn cứ nâng cấp bê tông.
     - *Màn 4:* Kênh đào huyết mạch chia cắt bởi dòng sông.
     - *Màn 5:* Pháo đài thép trung tâm.
     - *Màn 6:* Băng tuyết Bắc Cực với mặt đường trượt nhanh.
     - *Màn 7:* Trận địa pháo kích tên lửa tầm xa.
     - *Màn 8:* Thung lũng phục kích với thế gọng kìm 2 cánh.
     - *Màn 9:* Bức tường thép phòng thủ kiên cố.
     - *Màn 10:* Trận huyết chiến chống Siêu Hạm Titan Tối Thượng (Trùm).
2. **Sinh Tồn Vô Tận (Survival Mode):**
   - Địch tràn tới không ngừng nghỉ theo từng đợt sóng (Waves).
   - Mỗi đợt sóng số lượng xe và tốc độ tăng dần; Trùm Titan xuất hiện định kỳ ở các wave chẵn.
3. **Đấu Trường Trùm (Boss Rush Mode):**
   - Đối đầu liên tiếp với 3 Siêu Hạm Titan khổng lồ cùng toán lính hộ tống hạng nặng trong đấu trường mở.

---

## 8. HỆ THỐNG ĐIỀU KHIỂN & PHÍM TẮT TÁC CHIẾN

### Điều Khiển Bàn Phím & Chuột:
- `W` / `A` / `S` / `D` hoặc `Phím Mũi Tên`: Lái xe di chuyển 4 hướng (Lên, Xuống, Trái, Phải).
- `Phím Cách (Spacebar)`: Khai hỏa đại bác (chế độ phím cổ điển).
- `Chuột Trái`: Khai hỏa đại bác ngắm bắn 360° tự do (chế độ chuột).
- `Di chuyển Chuột`: Xoay tháp pháo ngắm bắn theo con trỏ chuột.
- `Phím U`: Nâng cấp căn cứ chỉ huy tức thì khi đủ điểm.
- `Phím C`: Mở Cửa Hàng Quân Sự & Trang Bị (Shop).
- `Phím B`: Kích hoạt Không Kích Oanh Tạc (Airstrike Support).
- `Phím F`: Kích hoạt Bão Băng Đông Cứng Địch (Cryo Freeze).
- `Phím R`: Kích hoạt Bộ Sửa Chữa Chiến Xa Nanite (Repair Kit).
- `Phím M`: Bật/tắt nhạc sảnh (BGM).
- `Phím H`: Mở sổ tay tra cứu vũ khí và biểu tượng (trận đấu sẽ tự động tạm dừng).
- `Phím P` hoặc `Phím Esc`: Tạm dừng trận đấu để vào menu cài đặt âm thanh / thời tiết / cửa hàng.

### Điều Khiển Màn Hình Cảm Ứng (Điện Thoại / Máy Tính Bảng):
- Cụm D-Pad ảo bên trái: Điều khiển hướng di chuyển của xe.
- Nút Bắn đỏ tròn bên phải: Nhấn giữ để xả đạn liên tục.
- Các nút hỗ trợ nhanh trên thanh công cụ HUD: Nhấp trực tiếp vào biểu tượng túi tiền (🟡), Không kích, Bão băng, Sửa chữa hoặc Cửa hàng để thao tác ngay lập tức.

---

## 9. HỆ THỐNG CỬA HÀNG QUÂN SỰ, TIỀN TỆ & TRANG BỊ ĐẶC CHỦNG (SHOP SYSTEM)

### 9.1 Cơ Chế Thu Thập Tiền Tác Chiến (Military Coins 🟡)
- **Tiền rơi từ chiến xa địch:** Khi tiêu diệt bất kỳ xe tăng địch nào, đồng tiền xu hoặc thỏi vàng quân sự sẽ bung ra trên mặt đất:
  - *Xe Trinh Sát (Scout):* 15 🟡
  - *Xe Đột Kích (Assault):* 25 🟡
  - *Xe Thiết Giáp (Heavy):* 45 🟡
  - *Pháo Tự Hành (Artillery):* 60 🟡
  - *Siêu Hạm Trùm (Titan Boss):* 250 🟡 (Bung hàng loạt thỏi vàng lớn)
  - *Thùng Nổ Chiến Thuật (Barrel):* 20 🟡
- **Tự động bảo lưu:** Tiền kiếm được lưu trữ vĩnh viễn trên thiết bị (LocalStorage Profile), có thể tích lũy qua các màn chơi và sử dụng mọi lúc.
- **Nam Châm Tác Chiến:** Nâng cấp Nam Châm sẽ tự động hút tiền về xe trong bán kính 60 - 240 pixels.
- **Tiền Thưởng Truy Nã (Bounty Bonus):** Tăng thêm từ +15% đến +100% số tiền nhặt được.

### 9.2 Danh Mục 5 Chiến Xa Mở Khóa (Tank Chassis)
1. **T-34 Tiên Phong (Vanguard):** Khung thân khởi đầu miễn phí, tốc độ cân bằng 115 px/s, 3 HP máu, thời gian nạp đạn 0.45s.
2. **Striker Sấm Sét (Striker):** Xe cơ động cao 135 px/s, nạp đạn cực nhanh 0.35s, 3 HP máu, sơn màu xanh Cyan thể thao (Giá: 450 🟡).
3. **Titan Thiết Giáp (Titan Brawler):** Khung thân bọc thép hạng nặng 5 HP máu, tốc độ 105 px/s, nạp đạn 0.40s, sơn màu đỏ Crimson rực lửa (Giá: 900 🟡).
4. **Siege Thần Công (Siege Breaker):** Pháo kích tầm xa cực đại 6 HP máu, nạp đạn 0.48s, đạn uy lực mạnh mẽ (Giá: 1,600 🟡).
5. **Apex Thống Soái (Apex Dominator):** Chiến xa tối thượng với 7 HP máu, tốc độ 125 px/s, nạp đạn chớp nhoáng 0.30s, phủ lớp sơn mạ vàng Hoàng Kim lộng lẫy (Giá: 3,000 🟡).

### 9.3 Danh Mục 5 Loại Đạn Pháo Đặc Chủng (Special Ammo)
1. **Đạn Thép Tiêu Chuẩn (Standard AP):** Miễn phí mặc định, sát thương 1 HP, vận tốc đạn 260 px/s.
2. **Đạn Động Năng Xuyên Giáp APFSDS:** Tăng vận tốc đạn lên 360 px/s, sát thương 2 HP, bay xé gió (Giá: 400 🟡).
3. **Đạn Nổ Mạnh Diện Rộng (High Explosive - HE):** Tạo vụ nổ sóng chấn bán kính 55px khi trúng đích, gây sát thương lan cho các xe địch đứng gần (Giá: 850 🟡).
4. **Đạn Năng Lượng Plasma:** Đạn phát sáng màu xanh tím bí ẩn, làm chậm và đóng băng xe địch trúng đạn trong 2.5 giây (Giá: 1,400 🟡).
5. **Đạn Tên Lửa Tầm Nhiệt Thông Minh (Homing Missiles):** Tự động bẻ góc quỹ đạo đuổi theo xe tăng địch gần nhất, tỷ lệ trúng mục tiêu 100% (Giá: 2,200 🟡).

### 9.4 Danh Mục 7 Nâng Cấp Công Nghệ Vĩnh Viễn (Permanent Tech Upgrades)
- **Vỏ Giáp Gia Cố (Hull Armor):** Tăng từ +1 đến +5 vạch HP máu tối đa cho xe tăng.
- **Động Cơ Tăng Áp (Turbo Engine):** Tăng thêm từ +8 px/s đến +40 px/s tốc độ di chuyển.
- **Hệ Thống Tiếp Đạn Tự Động (Auto-Loader):** Rút ngắn từ 10% đến 40% thời gian hồi chiêu nạp đạn.
- **Bộ Hút Từ Tính (Coin Magnet):** Tự động hút toàn bộ tiền xu và thỏi vàng trong bán kính rộng về xe.
- **Tiền Thưởng Truy Nã (Bounty Bonus):** Tăng từ +15% đến +100% giá trị mỗi đồng tiền thu thập.
- **Khiên Từ Trường Xuất Kích (Starting Shield):** Cho phép bạn khởi đầu mỗi mạng sống với khiên bất tử từ 4s đến 12s.
- **Nanite Tự Sửa Chữa (Emergency Nanite):** Khi xe chỉ còn 1 HP, vi robot nano sẽ lập tức tự động sửa chữa khôi phục từ +1 đến +3 HP (và kích hoạt khiên 3.5s ở cấp cao).

### 9.5 Vật Phẩm Tiếp Tế Tiêu Hao Tác Chiến (Support Items)
Có thể mua trong Cửa hàng và bấm phím tắt để sử dụng nhanh giữa trận:
- **[Phím B] Oanh Tạc Không Kích (Airstrike Beacon):** Gọi máy bay ném bom dội bão lửa tiêu diệt toàn bộ xe tăng địch đang có mặt trên bản đồ (Giá: 120 🟡 / lần).
- **[Phím F] Lựu Đạn Bão Băng (Cryo Freeze Canister):** Đóng băng toàn bộ lực lượng địch trong 7 giây (Giá: 80 🟡 / lần).
- **[Phím R] Hộp Cứu Thương Khẩn Cấp (Emergency Repair Kit):** Hồi phục đầy đủ 100% thanh HP của chiến xa ngay lập tức (Giá: 60 🟡 / lần).
