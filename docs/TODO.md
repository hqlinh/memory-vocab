# TODO – Memory Vocab (Implementation)

Danh sách công việc triển khai theo [PRODUCT_SPEC.md](./PRODUCT_SPEC.md). Đánh dấu `[x]` khi hoàn thành.

---

## Phase 1: Setup dự án & nền tảng

- [x] Khởi tạo Vite + React (TypeScript): `npm create vite@latest . -- --template react-ts`
- [x] Cài đặt và cấu hình Tailwind CSS
- [x] Khởi tạo shadcn/ui: `npx shadcn@latest init`, cài các component cần dùng (Button, Input, Label, Textarea, Select, Card, Tabs, Dialog, Badge, ScrollArea, …)
- [x] Cài React Router và cấu hình route cơ bản: `/`, `/add`, `/edit/:id`, `/list`, `/flash`
- [x] Tạo cấu trúc thư mục: `src/components`, `src/lib`, `src/hooks`, `src/pages`, `src/types`, `src/db`
- [x] Layout chung: header hoặc sidebar với nav (Thêm từ, Danh sách, Flash card)

---

## Phase 2: Data layer

- [x] Định nghĩa types trong `src/types/vocab.ts`: `WordType`, `Meaning`, `VocabEntry`
- [x] Cài Dexie.js, tạo `src/db/index.ts`: khai báo store `vocab`, indexes `createdAt`, `updatedAt`, `topic`
- [x] Tạo `src/lib/vocab-service.ts`:
  - [x] `getAll()`, `getById(id)`, `getEntriesByIds(ids)`
  - [x] `create(entry)`, `update(entry)`, `delete(id)`
  - [x] `getByDate(date)`, `getByDateRange(start, end)`, `getByTopic(topic)` (cho flash card)
- [x] Sinh id khi tạo mới (nanoid hoặc crypto.randomUUID), set `createdAt`/`updatedAt`

---

## Phase 3: Form thêm/sửa từ vựng

- [x] Trang `AddVocab` (thêm mới) và `EditVocab` / reuse form với `id` (sửa)
- [x] Trường bắt buộc: **Từ** (input), **Loại từ** (multi-select/checkbox, ≥1), **Nghĩa** (dynamic list)
- [x] Mỗi nghĩa: 1 ô nghĩa tiếng Việt + 1–3 ví dụ (nút Thêm/Xóa ví dụ, max 3)
- [x] Nút "Thêm nghĩa" / "Xóa nghĩa" cho list nghĩa
- [x] Trường optional: **Ghi chú** (textarea), **Chủ đề** (input hoặc combobox gợi ý)
- [x] Phần ảnh: upload file → preview thumbnail, lưu base64 vào `imageUrls`, nút xóa từng ảnh (giới hạn ví dụ 5 ảnh)
- [x] Optional: **Word family**, **Từ đồng nghĩa**, **Từ trái nghĩa** – combobox/autocomplete tìm theo `word` trong DB, chọn entry → lưu id; không cho chọn chính entry hiện tại khi đang sửa
- [x] Validation khi submit: word + ≥1 type + ≥1 meaning (vietnamese + 1–3 examples non-empty)
- [x] Nút Lưu: gọi service create/update → redirect hoặc toast; nút Hủy/Quay lại
- [x] Trang edit: load entry theo `id` từ route, điền form; nếu không tìm thấy → 404 hoặc redirect

---

## Phase 4: Danh sách từ & chi tiết

- [x] Trang `VocabList`: load toàn bộ entry từ service, hiển thị list/card (word, types badge, topic, số nghĩa)
- [x] Click item → xem chi tiết (inline expand hoặc trang/modal): word, types, topic, từng nghĩa (vietnamese + examples), notes, ảnh
- [x] Chi tiết: resolve `wordFamilyIds`, `synonymIds`, `antonymIds` → hiển thị tên từ; link click sang entry tương ứng (navigate hoặc modal)
- [x] Nút **Sửa** → chuyển `/edit/:id`
- [x] Nút **Xóa** → confirm → gọi service delete → cập nhật list (tùy chọn: xóa id khỏi wordFamily/synonym/antonym của entry khác)
- [x] (Optional) Sort: theo ngày tạo, ngày sửa, alphabet
- [x] (Optional) Filter: theo topic, theo loại từ

---

## Phase 5: Flash card

- [x] Trang `FlashCard`: khu vực chọn chế độ ôn (tabs hoặc dropdown)
- [x] Bốn chế độ:
  - [x] **Theo ngày**: date picker → query `getByDate(date)` → shuffle
  - [x] **Theo range**: date range (start, end) → query `getByDateRange(start, end)` → shuffle
  - [x] **Theo chủ đề**: chọn topic (từ DB) → query `getByTopic(topic)` → shuffle
  - [x] **Random all**: `getAll()` → shuffle
- [x] Nút "Bắt đầu ôn" → query → chuyển sang view flash card (hoặc inline)
- [x] View thẻ: mặt trước (word + types), mặt sau (nghĩa + ví dụ + notes + ảnh + family/synonyms/antonyms đã resolve)
- [x] Tương tác: click thẻ hoặc nút "Lật" để flip; nút "Tiếp" / "Trước"; hiển thị tiến độ (vd: 3/12)
- [x] Khi hết thẻ: thông báo "Đã xem hết" + nút "Ôn lại" / "Về trang chủ"
- [x] Xử lý trường hợp không có từ (theo ngày/range/topic hoặc DB trống): hiển thị "Không có từ nào" + gợi ý

---

## Phase 6: Polish & kiểm tra

- [x] Loading state khi đọc/ghi DB (skeleton hoặc spinner)
- [x] Toast hoặc message khi lưu thành công / lỗi
- [x] Responsive layout; kiểm tra trên mobile
- [x] Rà soát accessibility: label, focus, confirm trước khi xóa
- [x] Rà soát checklist Acceptance trong PRODUCT_SPEC.md

---

## Phase 7: Migrate sang Next.js + BE + MongoDB

- [x] **init-next**: Tạo project Next.js Page Router mới và migrate cấu trúc UI cơ bản (Layout, Tailwind, shadcn, Toaster).
- [x] **model-db**: Định nghĩa type vocab và MongoDB layer (client + service functions) dựa trên schema hiện tại.
- [x] **api-routes**: Tạo Next.js API routes cho CRUD vocab dùng MongoDB service.
- [x] **migrate-pages**: Chuyển các route React Router hiện tại thành các page trong Next.js Page Router, giữ lại Layout.
- [x] **wire-ui-api**: Cập nhật các page/form để gọi API mới thay vì Dexie/IndexedDB, thêm loading/error state.
- [ ] **deploy-vercel**: Kết nối với MongoDB Atlas, set env trên Vercel, deploy và smoke test CRUD.

---

## Tham chiếu

- Spec đầy đủ: [docs/PRODUCT_SPEC.md](./PRODUCT_SPEC.md)
- Plan tóm tắt: file plan trong `.cursor/plans/` hoặc `vocabulary_note_app_*.plan.md`
