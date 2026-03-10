# Product Specification: Memory Vocab

**Phiên bản:** 1.0  
**Ngày:** 2025-03-10  
**Trạng thái:** Draft

---

## 1. Tổng quan sản phẩm

### 1.1 Mục đích

Memory Vocab là ứng dụng web ghi chép từ vựng đơn giản, chạy trên trình duyệt, lưu trữ dữ liệu tại client (IndexedDB). Người dùng tự nhập từ, loại từ, nghĩa tiếng Việt, ví dụ, ghi chú và ảnh; sau đó dùng flash card để ôn tập theo nhiều chế độ (theo ngày, khoảng thời gian, chủ đề, hoặc random toàn bộ).

### 1.2 Mục tiêu sản phẩm

- Cho phép ghi chép từ vựng có cấu trúc (từ, nhiều loại từ, nhiều nghĩa, mỗi nghĩa 1–3 ví dụ).
- Hỗ trợ ghi chú và ảnh đính kèm; liên kết từ qua ID (word family, từ đồng nghĩa, từ trái nghĩa).
- Lưu trữ hoàn toàn trên máy người dùng, không bắt buộc đăng nhập hay server (có thể mở rộng API sau).
- Cung cấp chế độ flash card linh hoạt để ôn tập.

### 1.3 Đối tượng người dùng

- Học sinh / sinh viên / người tự học ngoại ngữ.
- Người cần một công cụ gọn, offline-first, không phụ thuộc tài khoản.

### 1.4 Phạm vi (Scope)

**Trong phạm vi v1:**

- CRUD từ vựng (thêm, xem, sửa, xóa).
- Form nhập: từ, nhiều loại từ, nghĩa + ví dụ, note, ảnh, chủ đề; word family / synonyms / antonyms (link bằng ID).
- Lưu trữ client: IndexedDB (Dexie.js).
- Flash card: ôn theo ngày, theo range thời gian, theo chủ đề, random all.

**Ngoài phạm vi v1 (có thể làm sau):**

- Backend API, đồng bộ đa thiết bị, đăng nhập.
- Import/export file (JSON/CSV).
- Thống kê, nhắc ôn (spaced repetition).

---

## 2. Thuật ngữ (Glossary)

| Thuật ngữ | Định nghĩa |
|-----------|------------|
| **Entry / Vocab entry** | Một bản ghi từ vựng trong hệ thống (ứng với một “từ” và toàn bộ thông tin đi kèm). |
| **Word** | Từ vựng (chuỗi) do người dùng nhập, ví dụ: "run", "break". |
| **Word type** | Loại từ: noun, verb, adjective, adverb, phrase, other. Một từ có thể có nhiều loại. |
| **Meaning** | Một nghĩa tiếng Việt kèm tối đa 3 ví dụ. |
| **Word family** | Các từ cùng họ (vd: run → running, runner), lưu bằng ID tham chiếu tới entry khác. |
| **Synonyms / Antonyms** | Từ đồng nghĩa / trái nghĩa, lưu bằng ID tham chiếu. |
| **Topic** | Chủ đề (string) để gom nhóm từ, dùng cho lọc flash card. |
| **Flash card** | Thẻ ôn: mặt trước (từ + loại), mặt sau (nghĩa, ví dụ, note, ảnh, family/synonyms/antonyms). |

---

## 3. Data model & Validation

### 3.1 Kiểu dữ liệu (TypeScript)

```ts
// Loại từ: một từ có thể thuộc nhiều loại
type WordType = "noun" | "verb" | "adjective" | "adverb" | "phrase" | "other";

// Một nghĩa: nghĩa TV + tối đa 3 ví dụ
interface Meaning {
  vietnamese: string;
  examples: string[]; // length 1..3
}

// Bản ghi từ vựng
interface VocabEntry {
  id: string;
  word: string;
  types: WordType[];
  meanings: Meaning[];
  notes?: string;
  imageUrls?: string[]; // base64 data URL hoặc Blob URL
  topic?: string;

  // Optional: tham chiếu tới VocabEntry khác bằng id
  wordFamilyIds?: string[];
  synonymIds?: string[];
  antonymIds?: string[];

  createdAt: string; // ISO 8601
  updatedAt: string;  // ISO 8601
}
```

### 3.2 Quy tắc validation

| Trường | Bắt buộc | Quy tắc |
|--------|----------|--------|
| `id` | Có | Chuỗi duy nhất (UUID hoặc nanoid), tự sinh khi tạo mới. |
| `word` | Có | Non-empty string, trim. Không bắt buộc unique toàn DB (cùng từ có thể nhiều entry nếu khác nghĩa/context). |
| `types` | Có | Mảng ít nhất 1 phần tử; mỗi phần tử thuộc `WordType`. |
| `meanings` | Có | Mảng ít nhất 1 phần tử. |
| `meanings[].vietnamese` | Có | Non-empty string, trim. |
| `meanings[].examples` | Có | Mảng 1–3 chuỗi; mỗi chuỗi non-empty sau trim. |
| `notes` | Không | Chuỗi tùy ý, có thể rỗng. |
| `imageUrls` | Không | Mảng URL (base64 hoặc blob); giới hạn số ảnh tùy quyết định (vd: tối đa 5). |
| `topic` | Không | Chuỗi tùy ý. |
| `wordFamilyIds` | Không | Mảng id; mỗi id phải tồn tại trong store `vocab` (có thể validate khi lưu). |
| `synonymIds` | Không | Giống trên. |
| `antonymIds` | Không | Giống trên. |
| `createdAt` | Có | ISO date string, set lúc tạo. |
| `updatedAt` | Có | ISO date string, set lúc tạo và mỗi lần cập nhật. |

### 3.3 IndexedDB (Dexie) schema

- **Store:** `vocab`
- **Primary key:** `id`
- **Indexes:**
  - `createdAt` — query theo ngày / range ngày.
  - `updatedAt` — sort/cập nhật gần đây.
  - `topic` — filter theo chủ đề.

### 3.4 Ảnh (imageUrls)

- **Định dạng lưu:** Base64 data URL (ví dụ `data:image/jpeg;base64,...`) hoặc Blob lưu trong IndexedDB và lưu reference. Spec chọn **base64 trong entry** cho đơn giản, offline ổn định.
- **Giới hạn:** Ví dụ tối đa 5 ảnh/entry; kích thước tối đa mỗi ảnh (vd: 2MB) để tránh tràn storage (có thể nén/resize trước khi lưu).

### 3.5 Link by ID (wordFamilyIds, synonymIds, antonymIds)

- Chỉ lưu **id** của `VocabEntry` khác.
- Khi hiển thị: gọi `getEntriesByIds(ids)` (hoặc tương đương) để lấy danh sách entry → hiển thị `word`; có thể link sang route `/list` hoặc modal chi tiết với `id` tương ứng.
- Khi xóa entry: quyết định có xóa id đó khỏi các entry khác không (optional: cleanup references khi xóa).

---

## 4. Chức năng chi tiết

### 4.1 Form thêm/sửa từ vựng

**Mục đích:** Cho phép tạo mới hoặc chỉnh sửa một entry.

**Luồng:**

1. Người dùng vào route (vd: `/add` cho mới, `/edit/:id` cho sửa).
2. Nếu sửa: load entry theo `id` từ DB, điền form.
3. Người dùng điền/chỉnh các trường (xem bảng dưới).
4. Submit → validate → lưu DB → redirect hoặc thông báo thành công.

**Các trường form:**

| Trường | UI | Bắt buộc | Ghi chú |
|--------|----|----------|---------|
| Từ (word) | Input text | Có | Placeholder: "Nhập từ vựng". |
| Loại từ (types) | Multi-select hoặc checkbox group | Có, ≥1 | Options: Noun, Verb, Adjective, Adverb, Phrase, Other. |
| Nghĩa (meanings) | Dynamic list | Có, ≥1 block | Mỗi block: 1 ô "Nghĩa tiếng Việt" + 1–3 ô "Ví dụ"; nút "Thêm nghĩa", "Xóa nghĩa"; mỗi nghĩa có nút "Thêm ví dụ" (tối đa 3), "Xóa ví dụ". |
| Ghi chú (notes) | Textarea | Không | Placeholder tùy chọn. |
| Ảnh (imageUrls) | Upload + preview | Không | Chọn file → preview thumbnail; nút xóa từng ảnh; giới hạn số ảnh (vd: 5). |
| Chủ đề (topic) | Input text hoặc Combobox | Không | Có thể gợi ý từ các topic đã có trong DB. |
| Word family | Chọn từ trong DB (combobox/autocomplete) | Không | Tìm theo `word` → chọn entry → thêm id vào `wordFamilyIds`; hiển thị danh sách đã chọn, có thể xóa từng item. |
| Từ đồng nghĩa | Giống word family | Không | Lưu vào `synonymIds`. |
| Từ trái nghĩa | Giống word family | Không | Lưu vào `antonymIds`. |

**Validation khi submit:**

- `word`: không rỗng sau trim.
- `types`: ít nhất 1.
- `meanings`: ít nhất 1; mỗi nghĩa có `vietnamese` không rỗng và 1–3 ví dụ không rỗng.
- Các id trong `wordFamilyIds`, `synonymIds`, `antonymIds`: có thể kiểm tra tồn tại trong DB (optional).

**Hành vi nút:**

- **Lưu:** Validate → create hoặc update → điều hướng (vd: về `/list`) hoặc toast thành công.
- **Hủy / Quay lại:** Điều hướng về list hoặc trang trước, không lưu.

**Edge cases:**

- Sửa entry: không cho phép chọn chính entry hiện tại làm family/synonym/antonym (tránh self-reference).
- Khi chọn từ link: có thể lọc bỏ entry hiện tại khỏi danh sách gợi ý.

---

### 4.2 Danh sách từ vựng (List / Quản lý)

**Mục đích:** Xem toàn bộ hoặc một phần từ đã lưu, mở chi tiết, sửa, xóa.

**Luồng:**

1. Vào route (vd: `/list`).
2. Load tất cả entry từ DB (hoặc phân trang nếu sau này cần).
3. Hiển thị dạng danh sách/thẻ: mỗi item hiển thị ít nhất **word**, **types** (dạng badge), có thể thêm **topic**, **số nghĩa**.
4. Click vào item → xem chi tiết (inline expand hoặc trang/modal chi tiết).
5. Trên từng item hoặc màn chi tiết: nút **Sửa** (→ form edit), nút **Xóa** (confirm trước khi xóa).

**Chi tiết một entry (view-only):**

- Word, types, topic.
- Từng nghĩa: vietnamese + examples.
- Notes, ảnh (preview).
- Word family / synonyms / antonyms: hiển thị dạng danh sách từ (resolve bằng id); mỗi từ có thể là link → click xem entry đó (navigate hoặc mở modal).

**Xóa:**

- Confirm: "Bạn có chắc muốn xóa từ [word]?"
- Sau khi xóa: xóa trong DB, cập nhật list (và tùy chọn: xóa id này khỏi `wordFamilyIds`/`synonymIds`/`antonymIds` của các entry khác).

**Sắp xếp / lọc (optional v1):**

- Sort theo ngày tạo, ngày sửa, alphabet (word).
- Lọc theo topic, theo loại từ (có thể làm đơn giản: dropdown filter).

---

### 4.3 Flash card

**Mục đích:** Ôn tập từ bằng thẻ: mặt trước (từ + loại), mặt sau (nghĩa, ví dụ, note, ảnh, family/synonyms/antonyms).

**Luồng tổng quát:**

1. Vào route (vd: `/flash`).
2. Chọn **chế độ ôn** (xem 4.3.1–4.3.4).
3. Nhập tham số (ngày, range, chủ đề) nếu có.
4. Bấm "Bắt đầu ôn" → query DB theo chế độ → shuffle (nếu cần) → chuyển sang view flash card.
5. View flash card: hiển thị từng thẻ; lật thẻ (click hoặc nút); Next/Prev; có thể hiển thị tiến độ (vd: 3/10).

**4.3.1 Ôn theo ngày**

- **Input:** Một ngày (date picker).
- **Query:** `createdAt` thuộc ngày đó (start of day → end of day, timezone local).
- **Kết quả:** Danh sách entry tạo trong ngày đã chọn; shuffle thứ tự trước khi hiển thị.

**4.3.2 Ôn theo range thời gian**

- **Input:** Ngày bắt đầu, ngày kết thúc (date range).
- **Query:** `createdAt >= startOfDay(start)` và `createdAt <= endOfDay(end)`.
- **Kết quả:** Danh sách entry trong khoảng; shuffle.

**4.3.3 Ôn theo chủ đề**

- **Input:** Chọn một topic (dropdown từ danh sách topic có trong DB, hoặc nhập tay nếu cho phép).
- **Query:** `topic` bằng giá trị đã chọn (exact match; empty topic có thể hiển thị là "(Không chủ đề)").
- **Kết quả:** Danh sách entry cùng topic; shuffle.

**4.3.4 Random all**

- **Input:** Không cần thêm.
- **Query:** Lấy toàn bộ entry.
- **Kết quả:** Shuffle toàn bộ rồi hiển thị.

**UI view flash card:**

- **Mặt trước:** Word (cỡ chữ lớn), types (badge).
- **Mặt sau:** Nghĩa (từng block vietnamese + examples), notes, ảnh (nếu có), word family / synonyms / antonyms (resolve id → word, có thể link).
- **Tương tác:** Click thẻ hoặc nút "Lật" để flip; nút "Tiếp" / "Trước"; có thể hiển thị số thứ tự (vd: 1/12).
- **Khi hết thẻ:** Thông báo "Đã xem hết" + nút "Ôn lại" hoặc "Về trang chủ".

**Edge cases:**

- Chế độ theo ngày/range/chủ đề nhưng không có entry nào: hiển thị "Không có từ nào" + gợi ý thêm từ hoặc chọn chế độ khác.
- Random all khi DB trống: tương tự.

---

## 5. Giao diện & Điều hướng

### 5.1 Layout chung

- **Header hoặc sidebar:** Navigation cố định.
  - **Thêm từ** → `/add`
  - **Danh sách** → `/list`
  - **Flash card** → `/flash`
- Có thể thêm **Trang chủ** `/` (dashboard đơn giản: thống kê nhanh, shortcut 3 chức năng trên).

### 5.2 Route

| Route | Mô tả |
|-------|--------|
| `/` | Trang chủ (optional). |
| `/add` | Form thêm từ mới. |
| `/edit/:id` | Form sửa entry (load theo id). |
| `/list` | Danh sách từ; có thể `/list?topic=...` nếu có filter. |
| `/flash` | Flash card: chọn chế độ + view thẻ. |

### 5.3 Component UI (shadcn + Tailwind)

- **Form:** `Input`, `Label`, `Textarea`, `Button`, `Select` hoặc `Checkbox` (cho types), Combobox cho autocomplete (chọn từ trong DB).
- **List:** `Card`, `Badge`, `ScrollArea`; `Dialog` hoặc sheet cho chi tiết.
- **Flash card:** `Card` với hiệu ứng flip (CSS), `Button` Next/Prev.
- **Chung:** Responsive; theme (light/dark) tùy shadcn config.

### 5.4 Accessibility & UX

- Label rõ ràng cho mọi input.
- Nút hủy/xóa có confirm khi có rủi ro mất dữ liệu.
- Loading state khi đọc/ghi DB (vd: skeleton hoặc spinner).
- Toast hoặc inline message khi lưu thành công / lỗi.

---

## 6. Kiến trúc kỹ thuật

### 6.1 Stack

| Thành phần | Công nghệ |
|------------|-----------|
| Build & dev | Vite |
| UI | React 18+ (TypeScript) |
| Styling | Tailwind CSS |
| Component library | shadcn/ui |
| Client DB | IndexedDB (Dexie.js) |
| Router | React Router v6 |
| Ảnh | Base64 trong entry (hoặc Blob + reference) |

### 6.2 Cấu trúc thư mục (gợi ý)

```
src/
  components/     # Component dùng chung (MeaningBlock, ImageUpload, VocabCard, FlashCardView, ...)
  db/             # Dexie instance, schema
  lib/            # vocab-service (CRUD, getEntriesByIds, query for flash)
  hooks/          # useVocabList, useFlashDeck, ...
  pages/          # AddVocab, VocabList, FlashCard, Home
  types/          # vocab.ts (types, constants WordType)
  App.tsx
  main.tsx
docs/
  PRODUCT_SPEC.md
```

### 6.3 Service layer

- **vocab-service.ts (hoặc tên tương đương):**
  - `getAll()`, `getById(id)`, `getEntriesByIds(ids)`.
  - `create(entry)`, `update(entry)`, `delete(id)`.
  - `getByDate(date)`, `getByDateRange(start, end)`, `getByTopic(topic)` — phục vụ flash card.
- Toàn bộ đọc/ghi DB đi qua service; component không gọi Dexie trực tiếp. Sau này thêm API: tạo `vocab-api.ts` và trong service chọn nguồn (local vs api) theo config.

### 6.4 Mở rộng API (tương lai)

- Giữ interface service không đổi; thêm adapter gọi REST/GraphQL.
- Có thể dùng env (vd: `VITE_USE_API=true`) để bật gọi backend; khi bật có thể vẫn cache bằng IndexedDB hoặc chỉ dùng API.
- Sync đa thiết bị / conflict resolution nằm ngoài spec v1.

---

## 7. Yêu cầu phi chức năng

- **Offline:** Ứng dụng hoạt động hoàn toàn trên client; không cần mạng để dùng đầy đủ tính năng v1.
- **Performance:** Danh sách vài trăm entry vẫn load và filter mượt; ảnh base64 nên giới hạn kích thước/số lượng.
- **Trình duyệt:** Hỗ trợ các trình duyệt hiện đại có IndexedDB (Chrome, Firefox, Safari, Edge).
- **Dữ liệu:** Dữ liệu chỉ nằm trên máy người dùng; xóa cache/IndexedDB sẽ mất dữ liệu (sau này có thể thêm export/backup).

---

## 8. Tóm tắt chấp nhận (Acceptance summary)

- [ ] Người dùng có thể thêm từ mới với: từ, ≥1 loại từ, ≥1 nghĩa (mỗi nghĩa 1–3 ví dụ), note, ảnh, topic; optional: word family, synonyms, antonyms (chọn bằng ID).
- [ ] Người dùng có thể xem danh sách từ, xem chi tiết, sửa, xóa.
- [ ] Word family / synonyms / antonyms hiển thị đúng tên từ (resolve từ id) và có thể link sang entry.
- [ ] Flash card có 4 chế độ: theo ngày, theo range, theo chủ đề, random all; thẻ lật được, có Next/Prev, hiển thị đủ nội dung mặt sau.
- [ ] Dữ liệu lưu trữ bền vững trên client (IndexedDB), không mất khi refresh.

---

*Tài liệu này là đặc tả sản phẩm cho phiên bản 1. Mọi thay đổi phạm vi hoặc quy tắc nên được cập nhật vào spec và version.*
