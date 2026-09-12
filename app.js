/* FTU Exchange Finder: client-side catalog, matching and interface behavior. */
const DATA = window.FTU_DATA;
const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const normal = (text = '') => text.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
const compact = (text = '') => text.replace(/\s+/g, ' ').trim();
const images = {
  Japan: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=900&q=80',
  China: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=900&q=80',
  Korea: 'https://images.unsplash.com/photo-1517154421773-0529f29ea451?auto=format&fit=crop&w=900&q=80',
  USA: 'https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?auto=format&fit=crop&w=900&q=80',
  Germany: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=900&q=80',
  France: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=900&q=80',
  Spain: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=900&q=80',
  default: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=900&q=80'
};
const matchMap = new Map();
// Populated only after a student uploads a curriculum. It keeps the exact
// FTU course codes that produced each recommendation.
let uploadMatchCodesByPartner = new Map();
DATA.mappings.forEach(item => {
  if (!matchMap.has(item.schoolId)) matchMap.set(item.schoolId, []);
  matchMap.get(item.schoolId).push(item);
});

function mappingsFor(partner) {
  const exact = matchMap.get(partner.id) || [];
  if (exact.length) return exact;
  const partnerKey = normal(partner.name);
  return DATA.mappings.filter(m => partnerKey.includes(m.schoolId) || m.schoolId.includes(partnerKey));
}
function uniqueMappings(partner) {
  const seen = new Set();
  return mappingsFor(partner).filter(m => {
    const signature = `${m.partnerCourse}-${m.ftuCode}`;
    if (seen.has(signature)) return false;
    seen.add(signature); return true;
  });
}
function oneMappingPerFtuCourse(records) {
  const seen = new Set();
  return records.filter(record => {
    const code = record.ftuCode.toUpperCase();
    if (seen.has(code)) return false;
    seen.add(code); return true;
  });
}
function score(partner) { return new Set(uniqueMappings(partner).map(m => m.ftuCode)).size; }
function photo(partner) { return images[partner.country] || images.default; }
function escapeHtml(value = '') { return value.replace(/[&<>'"]/g, ch => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[ch])); }
function iconRefresh() { if (window.lucide) lucide.createIcons(); }
function toast(message) { const box = $('#toast'); box.textContent = message; box.classList.add('show'); clearTimeout(window.toastTimer); window.toastTimer = setTimeout(() => box.classList.remove('show'), 3300); }
function partnerCard(partner, small = false, matchCount = null) {
  const count = matchCount ?? score(partner);
  return `<article class="university-card"><div class="card-image" style="background-image:url('${photo(partner)}')"><span class="region-tag">${escapeHtml(partner.region || 'Global')}</span></div><div class="card-body"><p class="card-country">${escapeHtml(partner.country || 'Quốc tế')}</p><h3>${escapeHtml(partner.name)}</h3><div class="card-meta"><span>${partner.slots ? `<b>${escapeHtml(partner.slots)}</b> chỉ tiêu` : 'Đang cập nhật'}</span><span>${count ? `${count} môn quy đổi` : 'Xem chi tiết'}</span></div><button class="details-link" data-partner="${escapeHtml(partner.id)}">Khám phá trường →</button></div></article>`;
}
function showPage(id) {
  $$('.page').forEach(page => page.classList.toggle('active', page.id === id));
  $$('.nav-link').forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${id}`));
  window.scrollTo({ top: 0, behavior: 'smooth' }); iconRefresh();
}
function showDetail(id) {
  const partner = DATA.partners.find(p => p.id === id); if (!partner) return;
  const uploadedCodes = uploadMatchCodesByPartner.get(partner.id);
  const isUploadMatch = uploadedCodes?.size > 0;
  // A recommendation counts unique FTU course codes, so the detail view uses
  // the same definition and shows one partner-course mapping for each code.
  const maps = isUploadMatch
    ? oneMappingPerFtuCourse(uniqueMappings(partner).filter(m => uploadedCodes.has(m.ftuCode.toUpperCase())))
    : uniqueMappings(partner);
  const cost = DATA.costs[partner.country] || { living: 'Đang cập nhật theo khu vực', housing: 'Tùy loại hình lưu trú' };
  const displayedMaps = isUploadMatch ? maps : maps.slice(0, 12);
  const rows = displayedMaps.map(m => `<tr><td><b>${escapeHtml(m.partnerCourse)}</b>${m.partnerCode ? `<br><code>${escapeHtml(m.partnerCode)}</code>` : ''}</td><td><b>${escapeHtml(m.ftuCourse)}</b><br><code>${escapeHtml(m.ftuCode)}</code></td></tr>`).join('') || '<tr><td colspan="2">Không có học phần nào trong chương trình bạn tải lên khớp với dữ liệu quy đổi của trường này.</td></tr>';
  const mappingIntro = isUploadMatch
    ? `Chỉ hiển thị <b>${maps.length} học phần trùng khớp</b> với chương trình bạn đã tải lên. Mỗi mã môn FTU chỉ xuất hiện một lần.`
    : 'Đây là các học phần đã có dữ liệu quy đổi trong bảng nguồn. Quy đổi cuối cùng phụ thuộc vào đề cương và phê duyệt ở từng kỳ.';
  const mappingNote = !isUploadMatch && maps.length > 12 ? `<p class="disclaimer">Hiển thị 12 trong tổng số ${maps.length} cặp học phần đã có dữ liệu cho trường này.</p>` : '';
  $('#detail-content').innerHTML = `<section class="detail-hero" style="--hero-image:url('${photo(partner)}')"><div class="detail-hero-content"><button class="back-link" data-back-catalog><i data-lucide="arrow-left"></i> Quay lại danh sách</button><p class="eyebrow">${escapeHtml(partner.region || 'GLOBAL')} · ${escapeHtml(partner.country || '')}</p><h1>${escapeHtml(partner.name)}</h1><p>${escapeHtml(partner.language || 'Thông tin ngôn ngữ đang cập nhật')}</p></div></section><div class="detail-shell"><div class="detail-stats"><div><span>Chỉ tiêu</span><b>${escapeHtml(partner.slots || '—')} sinh viên</b></div><div><span>${isUploadMatch ? 'Môn trùng khớp CTĐT' : 'Học phần đã đối chiếu'}</span><b>${isUploadMatch ? maps.length : score(partner)} môn</b></div><div><span>Sinh hoạt phí</span><b>${escapeHtml(cost.living)}</b></div><div><span>Đánh giá từ alumni</span><b>4.5 / 5 ★</b></div></div><div class="detail-grid"><article><h2>Thông tin tổng quan</h2><p>${partner.notes ? escapeHtml(partner.notes) : `Đối tác trao đổi tại ${escapeHtml(partner.country || 'quốc gia sở tại')}, nằm trong danh sách mở đăng ký bổ sung kỳ Fall 2026.`}</p><h2>Danh sách môn học tương đương</h2><p>${mappingIntro}</p><table class="mapping-table"><thead><tr><th>MÔN Ở TRƯỜNG ĐỐI TÁC</th><th>HỌC PHẦN QUY ĐỔI TẠI FTU</th></tr></thead><tbody>${rows}</tbody></table>${mappingNote}</article><aside class="side-panel"><h2>Điều kiện ứng tuyển</h2><dl><dt>Yêu cầu GPA / ngoại ngữ</dt><dd>${escapeHtml(partner.requirements || 'Chưa có yêu cầu cụ thể trong dữ liệu mở đăng ký.')}</dd><dt>Ngôn ngữ giảng dạy</dt><dd>${escapeHtml(partner.language || 'Đang cập nhật')}</dd><dt>Học bổng</dt><dd>${escapeHtml(partner.scholarship || 'Chưa công bố')}</dd><dt>Học phần đối tác</dt><dd>${partner.courseUrl ? `<a target="_blank" rel="noopener" href="${escapeHtml(partner.courseUrl)}">Mở catalogue chính thức ↗</a>` : 'Chưa đính kèm đường dẫn'}</dd></dl><h3>Chi phí & lưu trú</h3><dl><dt>Sinh hoạt cơ bản</dt><dd>${escapeHtml(cost.living)}</dd><dt>Nhà ở ước tính</dt><dd>${escapeHtml(cost.housing)}</dd></dl></aside></div></div>`;
  showPage('detail');
}
function renderFeatured() {
  const top = [...DATA.partners].sort((a, b) => score(b) - score(a)).slice(0, 3);
  $('#featured-grid').innerHTML = top.map(p => partnerCard(p)).join('');
}
function filteredPartners() {
  const query = $('#catalog-search').value.trim().toLowerCase();
  const country = $('#country-filter').value;
  const language = $('#language-filter').value;
  const requirement = $('#requirement-filter').value;
  const faculty = $('#faculty-filter').value;
  return DATA.partners.filter(p => (!query || `${p.name} ${p.country} ${p.region}`.toLowerCase().includes(query)) && (!country || p.country === country) && (!language || p.language.includes(language)) && (!requirement || p.requirements.toUpperCase().includes(requirement)) && (!faculty || uniqueMappings(p).some(m => m.faculty.includes(faculty))));
}
function renderCatalog() {
  const select = $('#sort-select').value;
  const partners = filteredPartners().sort((a,b) => select === 'name' ? a.name.localeCompare(b.name) : select === 'slots' ? Number(b.slots || 0) - Number(a.slots || 0) : score(b) - score(a));
  $('#results-count').textContent = partners.length;
  $('#university-grid').innerHTML = partners.length ? partners.map(p => partnerCard(p, true)).join('') : '<div class="empty-state">Không tìm thấy trường phù hợp với bộ lọc hiện tại.</div>';
  iconRefresh();
}
function initCatalog() {
  const countries = [...new Set(DATA.partners.map(p => p.country).filter(Boolean))].sort();
  $('#country-filter').insertAdjacentHTML('beforeend', countries.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join(''));
  ['catalog-search','country-filter','language-filter','requirement-filter','faculty-filter','sort-select'].forEach(id => $(`#${id}`).addEventListener('input', renderCatalog));
  $('#reset-filters').addEventListener('click', () => { ['catalog-search','country-filter','language-filter','requirement-filter','faculty-filter'].forEach(id => $(`#${id}`).value = ''); renderCatalog(); }); renderCatalog();
}
// FTUGate exports the course-code column as “Mã MH”; other exports use Mã môn/Mã HP.
const courseCodeHeader = /mã\s*(môn|học|hp|mh|học\s*phần)|course\s*(code|id)/i;
const completedHeader = /đã\s*học|hoàn\s*thành|điểm|grade|kết\s*quả|trạng\s*thái|xếp\s*loại|ghi\s*chú/i;
function findHeader(rows) {
  return rows.findIndex(row => row.some(cell => courseCodeHeader.test(compact(String(cell ?? '')))));
}
function parseCurriculum(file) {
  if (!window.XLSX) { toast('Chưa tải được bộ đọc Excel. Hãy kiểm tra kết nối Internet.'); return; }
  const reader = new FileReader();
  reader.onload = event => {
    try {
      const workbook = XLSX.read(event.target.result, { type: 'array' });
      let courseRows = [];
      workbook.SheetNames.forEach(name => {
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[name], { header: 1, defval: '' });
        const headerAt = findHeader(rows.slice(0, 30)); if (headerAt < 0) return;
        const headers = rows[headerAt].map(h => compact(String(h)).toLowerCase());
        const codeCol = headers.findIndex(h => courseCodeHeader.test(h));
        const gradeCols = headers.map((h,i) => completedHeader.test(h) ? i : -1).filter(i => i >= 0);
        rows.slice(headerAt + 1).forEach(row => { const code = compact(String(row[codeCol] || '')).toUpperCase(); if (/^[A-Z]{2,7}\s?\d{3,4}[A-Z]?$/i.test(code)) courseRows.push({ code: code.replace(/\s/g,''), state: gradeCols.map(i => String(row[i] || '')).join(' ') }); });
      });
      const distinct = [...new Map(courseRows.map(r => [r.code, r])).values()];
      // In the FTUGate programme export, an “x” in “Đã học” is the completion flag.
      const passed = new Set(distinct.filter(r => /\bx\b|đạt|pass|hoàn thành|[5-9](\.\d+)?|10/i.test(r.state) && !/chưa|fail|không đạt|nợ/i.test(r.state)).map(r => r.code));
      const unlearned = distinct.filter(r => !passed.has(r.code)).map(r => r.code);
      if (!distinct.length) throw new Error('Không nhận diện được cột mã học phần.');
      const results = DATA.partners.map(p => { const convertible = [...new Set(uniqueMappings(p).map(m => m.ftuCode.toUpperCase()))].filter(code => unlearned.includes(code)); return { p, convertible }; }).filter(r => r.convertible.length >= 3).sort((a,b) => b.convertible.length-a.convertible.length);
      uploadMatchCodesByPartner = new Map(results.map(result => [result.p.id, new Set(result.convertible)]));
      const resultBox = $('#upload-result'); resultBox.hidden = false;
      resultBox.innerHTML = `<h3>Đã phân tích <b>${distinct.length}</b> học phần trong “${escapeHtml(file.name)}”</h3><p>Nhận diện ${passed.size} môn đã hoàn thành và ${unlearned.length} môn cần kiểm tra. Có ${results.length} trường có từ 3 môn quy đổi trở lên.</p><div class="match-pills">${results.slice(0,6).map(r => `<button data-partner="${escapeHtml(r.p.id)}">${escapeHtml(r.p.name)} · ${r.convertible.length} môn</button>`).join('') || '<span>Chưa có kết quả đủ điều kiện. Hãy kiểm tra định dạng cột điểm/trạng thái trong file tải lên.</span>'}</div>`;
      toast('Đã hoàn tất đối chiếu học phần.'); iconRefresh();
    } catch (error) { toast(`${error.message} Vui lòng thử file Excel xuất trực tiếp từ FTUGate.`); }
  };
  reader.readAsArrayBuffer(file);
}
function initUpload() {
  const input = $('#curriculum-file'), zone = $('#dropzone');
  input.addEventListener('change', () => input.files[0] && parseCurriculum(input.files[0]));
  ['dragenter','dragover'].forEach(type => zone.addEventListener(type, e => { e.preventDefault(); zone.classList.add('dragging'); }));
  ['dragleave','drop'].forEach(type => zone.addEventListener(type, e => { e.preventDefault(); zone.classList.remove('dragging'); }));
  zone.addEventListener('drop', e => e.dataTransfer.files[0] && parseCurriculum(e.dataTransfer.files[0]));
}
function initReviews() {
  const reviews = [{name:'Trần Hà My',meta:'K60 · Kinh tế đối ngoại · Fall 2025',school:'University of Mannheim',text:'Nhịp học khá nhanh nhưng thư viện tuyệt vời, thành phố an toàn và dễ di chuyển. Nên chuẩn bị chỗ ở thật sớm.'},{name:'Lê Hoàng Nam',meta:'K59 · Tài chính quốc tế · Spring 2025',school:'Waseda University',text:'Đồ ăn quanh trường rất đa dạng. Mình học được nhiều nhất từ các bài thảo luận nhóm với sinh viên quốc tế.'},{name:'Phạm Bảo Ngọc',meta:'K60 · Quản trị kinh doanh · Fall 2024',school:'Hasselt University',text:'Môi trường sống yên bình, người dân thân thiện. Ký túc xá hơi xa thư viện nhưng xe đạp giải quyết được tất cả.'}];
  $('#review-list').innerHTML = reviews.map(r => `<article class="review-card"><div class="review-head"><div class="reviewer"><span class="avatar">${r.name.split(' ').slice(-1)[0][0]}</span><div><b>${r.name}</b><small>${r.meta} · ${r.school}</small></div></div><span class="review-stars">★★★★★</span></div><p>“${r.text}”</p></article>`).join('');
  const dialog = $('#review-dialog'); $$('[data-open-review]').forEach(b => b.addEventListener('click', () => dialog.showModal())); $('[data-close-review]').addEventListener('click', () => dialog.close()); $('#review-form').addEventListener('submit', e => { e.preventDefault(); dialog.close(); e.target.reset(); toast('Gửi review thành công. Cảm ơn bạn đã chia sẻ!'); });
}
document.addEventListener('click', event => { const detailButton = event.target.closest('[data-partner]'); if (detailButton) showDetail(detailButton.dataset.partner); if (event.target.closest('[data-back-catalog]')) showPage('universities'); });
$$('.nav-link').forEach(link => link.addEventListener('click', event => { event.preventDefault(); showPage(link.getAttribute('href').slice(1)); }));
$('#hero-search').addEventListener('submit', event => { event.preventDefault(); $('#catalog-search').value = $('#search-input').value; showPage('universities'); renderCatalog(); });
$$('[data-scroll-upload]').forEach(button => button.addEventListener('click', () => { showPage('home'); setTimeout(() => $('#upload-tool').scrollIntoView({behavior:'smooth'}), 120); }));
$('#school-count').textContent = DATA.partners.length; $('#mapping-count').textContent = `${(DATA.mappings.length / 1000).toFixed(1)}k+`;
renderFeatured(); initCatalog(); initUpload(); initReviews(); iconRefresh();
