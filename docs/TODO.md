# TODO – Memory Vocab (Implementation)

Danh sách công việc triển khai theo [PRODUCT_SPEC.md](./PRODUCT_SPEC.md). Đánh dấu `[x]` khi hoàn thành.

---

## Phase 1: Setup dự án & nền tảng

- [ ] Khởi tạo Vite + React (TypeScript): `npm create vite@latest . -- --template react-ts`
- [ ] Cài đặt và cấu hình Tailwind CSS
- [ ] Khởi tạo shadcn/ui: `npx shadcn@latest init`, cài các component cần dùng (Button, Input, Label, Textarea, Select, Card, Tabs, Dialog, Badge, ScrollArea, …)
- [ ] Cài React Router và cấu hình route cơ bản: `/`, `/add`, `/edit/:id`, `/list`, `/flash`
- [ ] Tạo cấu trúc thư mục: `src/components`, `src/lib`, `src/hooks`, `src/pages`, `src/types`, `src/db`
- [ ] Layout chung: header hoặc sidebar với nav (Thêm từ, Danh sách, Flash card)

---

## Phase 2: Data layer

- [ ] Định nghĩa types trong `src/types/vocab.ts`: `WordType`, `Meaning`, `VocabEntry`
- [ ] Cài Dexie.js, tạo `src/db/index.ts`: khai báo store `vocab`, indexes `createdAt`, `updatedAt`, `topic`
- [ ] Tạo `src/lib/vocab-service.ts`:
  - [ ] `getAll()`, `getById(id)`, `getEntriesByIds(ids)`
  - [ ] `create(entry)`, `update(entry)`, `delete(id)`
  - [ ] `getByDate(date)`, `getByDateRange(start, end)`, `getByTopic(topic)` (cho flash card)
- [ ] Sinh id khi tạo mới (nanoid hoặc crypto.randomUUID), set `createdAt`/`updatedAt`

---

## Phase 3: Form thêm/sửa từ vựng

- [ ] Trang `AddVocab` (thêm mới) và `EditVocab` / reuse form với `id` (sửa)
- [ ] Trường bắt buộc: **Từ** (input), **Loại từ** (multi-select/checkbox, ≥1), **Nghĩa** (dynamic list)
- [ ] Mỗi nghĩa: 1 ô nghĩa tiếng Việt + 1–3 ví dụ (nút Thêm/Xóa ví dụ, max 3)
- [ ] Nút "Thêm nghĩa" / "Xóa nghĩa" cho list nghĩa
- [ ] Trường optional: **Ghi chú** (textarea), **Chủ đề** (input hoặc combobox gợi ý)
- [ ] Phần ảnh: upload file → preview thumbnail, lưu base64 vào `imageUrls`, nút xóa từng ảnh (giới hạn ví dụ 5 ảnh)
- [ ] Optional: **Word family**, **Từ đồng nghĩa**, **Từ trái nghĩa** – combobox/autocomplete tìm theo `word` trong DB, chọn entry → lưu id; không cho chọn chính entry hiện tại khi đang sửa
- [ ] Validation khi submit: word + ≥1 type + ≥1 meaning (vietnamese + 1–3 examples non-empty)
- [ ] Nút Lưu: gọi service create/update → redirect hoặc toast; nút Hủy/Quay lại
- [ ] Trang edit: load entry theo `id` từ route, điền form; nếu không tìm thấy → 404 hoặc redirect

---

## Phase 4: Danh sách từ & chi tiết

- [ ] Trang `VocabList`: load toàn bộ entry từ service, hiển thị list/card (word, types badge, topic, số nghĩa)
- [ ] Click item → xem chi tiết (inline expand hoặc trang/modal): word, types, topic, từng nghĩa (vietnamese + examples), notes, ảnh
- [ ] Chi tiết: resolve `wordFamilyIds`, `synonymIds`, `antonymIds` → hiển thị tên từ; link click sang entry tương ứng (navigate hoặc modal)
- [ ] Nút **Sửa** → chuyển `/edit/:id`
- [ ] Nút **Xóa** → confirm → gọi service delete → cập nhật list (tùy chọn: xóa id khỏi wordFamily/synonym/antonym của entry khác)
- [ ] (Optional) Sort: theo ngày tạo, ngày sửa, alphabet
- [ ] (Optional) Filter: theo topic, theo loại từ

---

## Phase 5: Flash card

- [ ] Trang `FlashCard`: khu vực chọn chế độ ôn (tabs hoặc dropdown)
- [ ] Bốn chế độ:
  - [ ] **Theo ngày**: date picker → query `getByDate(date)` → shuffle
  - [ ] **Theo range**: date range (start, end) → query `getByDateRange(start, end)` → shuffle
  - [ ] **Theo chủ đề**: chọn topic (từ DB) → query `getByTopic(topic)` → shuffle
  - [ ] **Random all**: `getAll()` → shuffle
- [ ] Nút "Bắt đầu ôn" → query → chuyển sang view flash card (hoặc inline)
- [ ] View thẻ: mặt trước (word + types), mặt sau (nghĩa + ví dụ + notes + ảnh + family/synonyms/antonyms đã resolve)
- [ ] Tương tác: click thẻ hoặc nút "Lật" để flip; nút "Tiếp" / "Trước"; hiển thị tiến độ (vd: 3/12)
- [ ] Khi hết thẻ: thông báo "Đã xem hết" + nút "Ôn lại" / "Về trang chủ"
- [ ] Xử lý trường hợp không có từ (theo ngày/range/topic hoặc DB trống): hiển thị "Không có từ nào" + gợi ý

---

## Phase 6: Polish & kiểm tra

- [ ] Loading state khi đọc/ghi DB (skeleton hoặc spinner)
- [ ] Toast hoặc message khi lưu thành công / lỗi
- [ ] Responsive layout; kiểm tra trên mobile
- [ ] Rà soát accessibility: label, focus, confirm trước khi xóa
- [ ] Rà soát checklist Acceptance trong PRODUCT_SPEC.md

---

## Tham chiếu

- Spec đầy đủ: [docs/PRODUCT_SPEC.md](./PRODUCT_SPEC.md)
- Plan tóm tắt: file plan trong `.cursor/plans/` hoặc `vocabulary_note_app_*.plan.md`
