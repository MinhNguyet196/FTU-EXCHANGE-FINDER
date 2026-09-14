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
// The source spreadsheets use English place names, while the interface invites
// students to search in Vietnamese. These aliases make both forms searchable.
const placeAliases = {
  Asia: 'châu á chau a asia', Europe: 'châu âu chau au europe', America: 'châu mỹ chau my america',
  Japan: 'nhật bản nhat ban japan', Korea: 'hàn quốc han quoc korea south korea',
  China: 'trung quốc trung quoc china', USA: 'mỹ hoa kỳ hoa ky united states usa',
  'The Bahamas': 'bahamas ba ha ma', Germany: 'đức duc germany', France: 'pháp phap france',
  Belgium: 'bỉ bi belgium', Finland: 'phần lan phan lan finland', Norway: 'na uy norway',
  Sweden: 'thụy điển thuy dien sweden', Switzerland: 'thụy sĩ thuy si switzerland',
  Spain: 'tây ban nha tay ban nha spain', Italy: 'ý y italy', India: 'ấn độ an do india',
  Indonesia: 'indonesia in đô nê xi a', Taiwan: 'đài loan dai loan taiwan'
};
const placeLabels = { Asia: 'Châu Á', Europe: 'Châu Âu', America: 'Châu Mỹ', Japan: 'Nhật Bản', Korea: 'Hàn Quốc', China: 'Trung Quốc', USA: 'Mỹ', 'The Bahamas': 'Bahamas', Germany: 'Đức', France: 'Pháp', Belgium: 'Bỉ', Finland: 'Phần Lan', Norway: 'Na Uy', Sweden: 'Thụy Điển', Switzerland: 'Thụy Sĩ', Spain: 'Tây Ban Nha', Italy: 'Ý', India: 'Ấn Độ', Indonesia: 'Indonesia', Taiwan: 'Đài Loan' };
// Values match the source dataset; labels are the Vietnamese names shown to users.
const countryChoices = [
  ['Norway','Na Uy'],['Sweden','Thụy Điển'],['Finland','Phần Lan'],['Germany','Đức'],['France','Pháp'],['Belgium','Bỉ'],['Switzerland','Thụy Sĩ'],['Spain','Tây Ban Nha'],['Italy','Ý'],['Canada','Canada'],['USA','Mỹ'],['Australia','Úc'],['Taiwan','Đài Loan'],['Korea','Hàn Quốc'],['Russia','Nga'],['Japan','Nhật Bản'],['China','Trung Quốc']
].map(([value,label]) => ({value,label})).sort((a,b) => a.label.localeCompare(b.label, 'vi'));
const languagePatterns = {
  english: /tieng\s*anh/,
  french: /tieng\s*phap/,
  german: /tieng\s*duc/,
  chinese: /tieng\s*trung/,
  japanese: /tieng\s*nhat/,
  korean: /tieng\s*han/
};
const certificatePatterns = {
  'english-certificate': /ielts|toefl/,
  'french-certificate': /delf|dalf|tcf/,
  'german-certificate': /goethe|telc/,
  'chinese-certificate': /hsk/,
  'japanese-certificate': /jlpt/,
  'korean-certificate': /topik/
};
function normalizedText(value = '') { return normal(value).replace(/[^a-z0-9]/g, ''); }
function teachesLanguage(partner, language) {
  const text = normal(String(partner.language || '').replace(/đ/gi, 'd'));
  return languagePatterns[language]?.test(text) || false;
}
function hasRequirement(partner, requirement) {
  const text = normal(partner.requirements || '');
  if (requirement === 'no-certificate') {
    const explicitNoCertificate = /khongyeucau.*chungchi|khongcan.*chungchi/.test(text);
    const anyCertificate = Object.values(certificatePatterns).some(pattern => pattern.test(text)) || /duolingo|toeic|cambridge|chungchi/.test(text);
    return explicitNoCertificate || !anyCertificate;
  }
  return certificatePatterns[requirement]?.test(text) || false;
}
// The source exchanges classify equivalencies by FTU faculty, not by major.
const majorToFaculty = {
  economics:['KTQT','KT&KDQT'],logistics:['KT&KDQT'],'international-economics':['KTQT','KT&KDQT'],'digital-economics':['KTQT','CN&KHDL','KHDL'],'international-business':['KT&KDQT'],'commercial-business':['KT&KDQT'],
  'business-administration':['QTKD'],'industrial-management':['QTKD'],'human-resources':['QTKD'],ecommerce:['QTKD','TTTM'],marketing:['QTKD'],'hotel-management':['QTKD'],'political-economy':['KHCT','Cơ Bản','Cơ bản'],
  'finance-banking':['TCNH'],fintech:['TCNH','CN&KHDL','KHDL'],accounting:['KTKT'],auditing:['KTKT'],'international-trade-law':['Luật'],law:['Luật'],'economic-law':['Luật'],'civil-law':['Luật'],
  'computer-science':['CN&KHDL','KHDL'],'artificial-intelligence':['CN&KHDL','KHDL'],'data-science':['CN&KHDL','KHDL'],'english-language':['TACN','TATM'],'chinese-language':['Tiếng Trung'],'japanese-language':['Tiếng Nhật'],'french-language':['Tiếng Pháp']
};
const matchMap = new Map();
// Populated only after a student uploads a curriculum. It keeps the exact
// FTU course codes that produced each recommendation.
let uploadMatchCodesByPartner = new Map();
let setReviewSchoolFilter = () => {};
const seedReviews = [
  {id:'mannheim-1',name:'Trần Hà My',meta:'K60 · Kinh tế đối ngoại · Fall 2025',school:'University of Mannheim',country:'Germany',region:'Europe',learning:5,housing:4,living:5,likes:27,dislikes:1,text:'Nhịp học khá nhanh nhưng thư viện tuyệt vời, thành phố an toàn và dễ di chuyển. Nên chuẩn bị chỗ ở thật sớm.'},
  {id:'waseda-1',name:'Lê Hoàng Nam',meta:'K59 · Tài chính quốc tế · Spring 2025',school:'Waseda University',country:'Japan',region:'Asia',learning:5,housing:5,living:5,likes:36,dislikes:0,text:'Đồ ăn quanh trường rất đa dạng. Mình học được nhiều nhất từ các bài thảo luận nhóm với sinh viên quốc tế.'},
  {id:'hasselt-1',name:'Phạm Bảo Ngọc',meta:'K60 · Quản trị kinh doanh · Fall 2024',school:'Hasselt University',country:'Belgium',region:'Europe',learning:4,housing:4,living:5,likes:19,dislikes:2,text:'Môi trường sống yên bình, người dân thân thiện. Ký túc xá hơi xa thư viện nhưng xe đạp giải quyết được tất cả.'},
  {id:'yonsei-1',name:'Đỗ Minh Khang',meta:'K61 · Tài chính quốc tế · Spring 2026',school:'Yonsei University Mirae Campus',country:'Korea',region:'Asia',learning:5,housing:4,living:5,likes:31,dislikes:1,text:'Trường có không khí quốc tế, khuôn viên đẹp và dịch vụ hỗ trợ sinh viên trao đổi khá chu đáo.'},
  {id:'niagara-1',name:'Vũ Khánh Linh',meta:'K60 · Quản trị kinh doanh · Fall 2025',school:'Niagara University',country:'USA',region:'America',learning:4,housing:4,living:5,likes:22,dislikes:3,text:'Giảng viên cởi mở, nhiều hoạt động cộng đồng. Chi phí sinh hoạt cần được lên kế hoạch kỹ từ đầu.'}
];
// Rating-only entries are counted but do not create a text review card.
const seedRatings = [
  // A written review and its rating are deliberately linked: one student is
  // counted once in the summary and rendered once in a school review list.
  ...seedReviews.map(({id,school,learning,housing,living}) => ({id:`rating-${id}`,reviewId:id,school,learning,housing,living})),
  {id:'rating-waseda-2',school:'Waseda University',learning:5,housing:4,living:5},{id:'rating-waseda-3',school:'Waseda University',learning:5,housing:5,living:4},
  {id:'rating-yonsei-2',school:'Yonsei University Mirae Campus',learning:4,housing:4,living:5},{id:'rating-yonsei-3',school:'Yonsei University Mirae Campus',learning:5,housing:3,living:4},
  {id:'rating-mannheim-2',school:'University of Mannheim',learning:5,housing:4,living:4},{id:'rating-hasselt-2',school:'Hasselt University',learning:4,housing:4,living:4},{id:'rating-niagara-2',school:'Niagara University',learning:4,housing:3,living:4}
  ,{id:'rating-waseda-4',school:'Waseda University',learning:5,housing:4,living:5},{id:'rating-waseda-5',school:'Waseda University',learning:4,housing:4,living:5},{id:'rating-waseda-6',school:'Waseda University',learning:5,housing:5,living:5},{id:'rating-waseda-7',school:'Waseda University',learning:4,housing:5,living:4},{id:'rating-waseda-8',school:'Waseda University',learning:5,housing:4,living:4},{id:'rating-waseda-9',school:'Waseda University',learning:4,housing:4,living:4}
  ,{id:'rating-yonsei-4',school:'Yonsei University Mirae Campus',learning:5,housing:4,living:4},{id:'rating-yonsei-5',school:'Yonsei University Mirae Campus',learning:4,housing:4,living:4},{id:'rating-yonsei-6',school:'Yonsei University Mirae Campus',learning:5,housing:5,living:5},{id:'rating-yonsei-7',school:'Yonsei University Mirae Campus',learning:4,housing:3,living:5}
];
const localStore = {
  read(key) { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } },
  write(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }
};
function partnerByName(name) { return DATA.partners.find(partner => normal(partner.name) === normal(name)); }
// Reviews are only valid for confirmed FTU partner schools. This also hides
// legacy sample/browser data that may have been entered for another school.
function allRatings() { return [...seedRatings, ...localStore.read('ftux-ratings')].filter(item => Boolean(partnerByName(item.school))); }
function reviewAverage(item) { return (Number(item.learning) + Number(item.housing) + Number(item.living)) / 3; }
function getRatingSummary(school) {
  const ratings = allRatings().filter(item => normal(item.school) === normal(school) && ['learning','housing','living'].every(key => Number.isFinite(Number(item[key]))));
  if (!ratings.length) return null;
  const averageFor = key => ratings.reduce((sum, item) => sum + Number(item[key]), 0) / ratings.length;
  const learning = averageFor('learning'), housing = averageFor('housing'), living = averageFor('living');
  return { count: ratings.length, learning, housing, living, overall: (learning + housing + living) / 3 };
}
function stars(value) { return value ? '★'.repeat(Math.round(value)) + '☆'.repeat(5 - Math.round(value)) : '☆☆☆☆☆'; }
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
    const signature = `${m.partnerCourse}-${m.partnerCode}-${m.ftuCourse}-${(m.ftuCodes || []).join('|')}`;
    if (seen.has(signature)) return false;
    seen.add(signature); return true;
  });
}
function mappingCodes(mapping) { return mapping.ftuCodes || (mapping.ftuCode ? [mapping.ftuCode] : []); }
function score(partner) { return uniqueMappings(partner).length; }
function photo(partner) { return images[partner.country] || images.default; }
function escapeHtml(value = '') { return value.replace(/[&<>'"]/g, ch => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[ch])); }
function iconRefresh() { if (window.lucide) lucide.createIcons(); }
function toast(message) { const box = $('#toast'); box.textContent = message; box.classList.add('show'); clearTimeout(window.toastTimer); window.toastTimer = setTimeout(() => box.classList.remove('show'), 3300); }
function partnerCard(partner, small = false, matchCount = null) {
  const count = matchCount ?? score(partner);
  return `<article class="university-card"><div class="card-image" style="background-image:url('${photo(partner)}')"><span class="region-tag">${escapeHtml(partner.region || 'Global')}</span></div><div class="card-body"><p class="card-country">${escapeHtml(partner.country || 'Quốc tế')}</p><h3>${escapeHtml(partner.name)}</h3><div class="card-meta"><span>${partner.slots ? `<b>${escapeHtml(partner.slots)}</b> chỉ tiêu` : 'Đang cập nhật'}</span><span>${count ? `${count} môn quy đổi` : 'Xem chi tiết'}</span></div><button class="details-link" data-partner="${escapeHtml(partner.id)}">Khám phá trường →</button></div></article>`;
}
function showPage(id, { updateHistory = true, partnerId = null, reviewSchool = null } = {}) {
  $$('.page').forEach(page => page.classList.toggle('active', page.id === id));
  $$('.nav-link').forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${id}`));
  if (updateHistory) history.pushState({ page: id, partnerId, reviewSchool }, '', `#${id}`);
  window.scrollTo({ top: 0, behavior: 'smooth' }); iconRefresh();
}
function showDetail(id, updateHistory = true) {
  const partner = DATA.partners.find(p => p.id === id); if (!partner) return;
  const uploadedCodes = uploadMatchCodesByPartner.get(partner.id);
  const isUploadMatch = uploadedCodes?.size > 0;
  const allMaps = uniqueMappings(partner);
  const matchedMaps = isUploadMatch
    ? allMaps.filter(mapping => mappingCodes(mapping).some(code => uploadedCodes.has(code.toUpperCase())))
    : [];
  const cost = DATA.costs[partner.country] || { living: 'Đang cập nhật theo khu vực', housing: 'Tùy loại hình lưu trú' };
  const previewCount = isUploadMatch ? 5 : 10;
  const rowFor = (mapping, hidden = false) => `<tr${hidden ? ' class="mapping-extra" hidden' : ''}><td><b>${escapeHtml(mapping.partnerCourse)}</b>${mapping.partnerCode ? `<br><code>${escapeHtml(mapping.partnerCode)}</code>` : ''}</td><td><b>${escapeHtml(mapping.ftuCourse)}</b><br><code>${mappingCodes(mapping).map(escapeHtml).join(' / ')}</code></td></tr>`;
  const previewMaps = isUploadMatch ? matchedMaps.slice(0, previewCount) : allMaps.slice(0, previewCount);
  const extraMaps = isUploadMatch ? [...matchedMaps.slice(previewCount), ...allMaps.filter(mapping => !matchedMaps.includes(mapping))] : allMaps.slice(previewCount);
  const rows = allMaps.length ? [...previewMaps.map(mapping => rowFor(mapping)), ...extraMaps.map(mapping => rowFor(mapping, true))].join('') : '<tr><td colspan="2">Chưa có thông tin về các học phần tương đương của trường này.</td></tr>';
  const mappingIntro = isUploadMatch
    ? `Đây là <b>${matchedMaps.length} học phần trùng khớp</b> với chương trình bạn đã tải lên. Bạn đang xem ${Math.min(previewCount, matchedMaps.length)} môn đầu tiên.`
    : `Đây là danh sách các học phần quy đổi tại ${escapeHtml(partner.name)}. Quy đổi cuối cùng phụ thuộc vào đề cương và phê duyệt ở từng kỳ.`;
  const expandMappings = extraMaps.length ? `<button class="show-all-mappings" type="button" data-expand-mappings data-default-label="Hiển thị tất cả ${allMaps.length} môn">Hiển thị tất cả ${allMaps.length} môn</button>` : '';
  $('#detail-content').innerHTML = `<section class="detail-hero" style="--hero-image:url('${photo(partner)}')"><div class="detail-hero-content"><button class="back-link" data-back-catalog><i data-lucide="arrow-left"></i> Quay lại danh sách</button><p class="eyebrow">${escapeHtml(partner.region || 'GLOBAL')} · ${escapeHtml(partner.country || '')}</p><h1>${escapeHtml(partner.name)}</h1><p>${escapeHtml(partner.language || 'Thông tin ngôn ngữ đang cập nhật')}</p></div></section><div class="detail-shell"><div class="detail-stats"><div><span>Chỉ tiêu</span><b>${escapeHtml(partner.slots || '—')} sinh viên</b></div><div><span>${isUploadMatch ? 'Môn trùng khớp CTĐT' : 'Học phần quy đổi'}</span><b>${isUploadMatch ? matchedMaps.length : score(partner)} môn</b></div><div><span>Sinh hoạt phí</span><b>${escapeHtml(cost.living)}</b></div><button class="detail-stat-link" type="button" data-open-alumni aria-label="Xem đánh giá từ alumni"><span>Đánh giá từ alumni</span><b>4.5 / 5 ★</b><small>Xem review →</small></button></div><div class="detail-grid"><article><h2>Thông tin tổng quan</h2><p>${partner.notes ? escapeHtml(partner.notes) : `Đối tác trao đổi tại ${escapeHtml(partner.country || 'quốc gia sở tại')}, nằm trong danh sách mở đăng ký bổ sung kỳ Fall 2026.`}</p><h2>Danh sách môn học tương đương</h2><p>${mappingIntro}</p><table class="mapping-table"><thead><tr><th>MÔN Ở TRƯỜNG ĐỐI TÁC</th><th>HỌC PHẦN QUY ĐỔI TẠI FTU</th></tr></thead><tbody>${rows}</tbody></table>${expandMappings}</article><aside class="side-panel"><h2>Điều kiện ứng tuyển</h2><dl><dt>Yêu cầu GPA / ngoại ngữ</dt><dd>${escapeHtml(partner.requirements || 'Chưa có yêu cầu cụ thể trong dữ liệu mở đăng ký.')}</dd><dt>Ngôn ngữ giảng dạy</dt><dd>${escapeHtml(partner.language || 'Đang cập nhật')}</dd><dt>Học bổng</dt><dd>${escapeHtml(partner.scholarship || 'Chưa công bố')}</dd><dt>Học phần đối tác</dt><dd>${partner.courseUrl ? `<a target="_blank" rel="noopener" href="${escapeHtml(partner.courseUrl)}">Mở catalogue chính thức ↗</a>` : 'Chưa đính kèm đường dẫn'}</dd></dl><h3>Chi phí & lưu trú</h3><dl><dt>Sinh hoạt cơ bản</dt><dd>${escapeHtml(cost.living)}</dd><dt>Nhà ở ước tính</dt><dd>${escapeHtml(cost.housing)}</dd></dl></aside></div></div>`;
  const rating = getRatingSummary(partner.name);
  const ratingButton = $('.detail-stat-link');
  ratingButton.querySelector('b').textContent = rating ? `${rating.overall.toFixed(1)} / 5 ★` : 'Chưa có đánh giá';
  ratingButton.querySelector('small').textContent = rating ? `${rating.count} lượt đánh giá · Xem review →` : 'Hãy là người đầu tiên đánh giá →';
  showPage('detail', { updateHistory, partnerId: id });
}
function renderFeatured() {
  const top = [...DATA.partners].sort((a, b) => score(b) - score(a)).slice(0, 3);
  $('#featured-grid').innerHTML = top.map(p => partnerCard(p)).join('');
}
function filteredPartners() {
  const query = normal($('#catalog-search').value.trim());
  const country = $('#country-filter').value;
  const language = $('#language-filter').value;
  const requirement = $('#requirement-filter').value;
  const faculty = $('#faculty-filter').value;
  return DATA.partners.filter(p => {
    const searchablePlace = normal(`${p.name} ${p.country} ${p.region} ${placeAliases[p.country] || ''} ${placeAliases[p.region] || ''}`);
    const selectedFacultyGroups = majorToFaculty[faculty] || [];
    const isCountryOrRegion = !country || (country.startsWith('region:') ? p.region === country.slice(7) : p.country === country);
    const meetsLanguageRequirement = !requirement || hasRequirement(p, requirement);
    const matchesMajor = !faculty || uniqueMappings(p).some(m => selectedFacultyGroups.some(group => normal(m.faculty).includes(normal(group))));
    return (!query || searchablePlace.includes(query)) && isCountryOrRegion && (!language || teachesLanguage(p, language)) && meetsLanguageRequirement && matchesMajor;
  });
}
function renderCatalog() {
  const select = $('#sort-select').value;
  const partners = filteredPartners().sort((a,b) => select === 'name' ? a.name.localeCompare(b.name) : select === 'slots' ? Number(b.slots || 0) - Number(a.slots || 0) : score(b) - score(a));
  $('#results-count').textContent = partners.length;
  $('#university-grid').innerHTML = partners.length ? partners.map(p => partnerCard(p, true)).join('') : '<div class="empty-state">Không tìm thấy trường phù hợp với bộ lọc hiện tại.</div>';
  iconRefresh();
}
function initCatalog() {
  const regions = [...new Set(DATA.partners.map(p => p.region).filter(Boolean))].sort();
  $('#language-filter').innerHTML = '<option value="">Tất cả ngôn ngữ</option><option value="english">Tiếng Anh</option><option value="french">Tiếng Pháp</option><option value="german">Tiếng Đức</option><option value="chinese">Tiếng Trung</option><option value="japanese">Tiếng Nhật</option><option value="korean">Tiếng Hàn</option>';
  $('#requirement-filter').innerHTML = '<option value="">Tất cả yêu cầu</option><option value="english-certificate">Chứng chỉ tiếng Anh: IELTS / TOEFL</option><option value="french-certificate">Chứng chỉ tiếng Pháp: DELF / DALF / TCF</option><option value="german-certificate">Chứng chỉ tiếng Đức: Goethe / telc</option><option value="chinese-certificate">Chứng chỉ tiếng Trung: HSK</option><option value="japanese-certificate">Chứng chỉ tiếng Nhật: JLPT</option><option value="korean-certificate">Chứng chỉ tiếng Hàn: TOPIK</option><option value="no-certificate">Không yêu cầu chứng chỉ ngoại ngữ / Chỉ yêu cầu trình độ</option>';
  $('#country-filter').insertAdjacentHTML('beforeend', `<optgroup label="Châu lục">${regions.map(region => `<option value="region:${region}">${escapeHtml(placeLabels[region] || region)}</option>`).join('')}</optgroup><optgroup label="Quốc gia / vùng lãnh thổ">${countryChoices.map(country => `<option value="${escapeHtml(country.value)}">${escapeHtml(country.label)}</option>`).join('')}</optgroup>`);
  const schoolOptions = DATA.partners.map(partner => `<option value="${escapeHtml(partner.name)}"></option>`).join('');
  $('#hero-school-options').innerHTML = schoolOptions;
  $('#catalog-search').setAttribute('list', 'catalog-school-options');
  $('#catalog-search').insertAdjacentHTML('afterend', '<datalist id="catalog-school-options"></datalist>');
  $('#catalog-school-options').innerHTML = schoolOptions;
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
  const results = DATA.partners.map(p => { const convertible = [...new Set(uniqueMappings(p).flatMap(mappingCodes).map(code => code.toUpperCase()))].filter(code => unlearned.includes(code)); return { p, convertible }; }).filter(r => r.convertible.length >= 3).sort((a,b) => b.convertible.length-a.convertible.length);
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
  const regionSelect = $('#review-region'), countrySelect = $('#review-country');
  countrySelect.insertAdjacentHTML('beforeend', countryChoices.map(country => `<option value="${escapeHtml(country.value)}">${escapeHtml(country.label)}</option>`).join(''));
  const schoolOptions = DATA.partners.map(p => `<option value="${escapeHtml(p.name)}"></option>`).join('');
  $('#review-school-options').innerHTML = schoolOptions;
  $('#review-form-school-options').innerHTML = schoolOptions;
  // Pair ratings created by the earlier version of this page with their text
  // review once, so existing browser-only data is retained after the update.
  const legacyRatings = localStore.read('ftux-ratings');
  const legacyReviews = localStore.read('ftux-reviews');
  const pairedReviewIds = new Set(legacyRatings.map(item => item.reviewId).filter(Boolean));
  let migrated = false;
  legacyRatings.forEach(rating => {
    if (rating.reviewId) return;
    const match = legacyReviews.find(review => !pairedReviewIds.has(review.id) && normal(review.school) === normal(rating.school) && ['learning','housing','living'].every(key => Number(review[key]) === Number(rating[key])));
    if (match) { rating.reviewId = match.id; pairedReviewIds.add(match.id); migrated = true; }
  });
  if (migrated) localStore.write('ftux-ratings', legacyRatings);
  let showAll = false;
  const interactionKey = 'ftux-review-interactions';
  const interactions = () => localStore.read(interactionKey);
  let visibleEntries = new Map();
  function selectedVote(id) { return interactions().find(item => item.id === id)?.vote || null; }
  function interactionTotal(item) {
    return Number(item.likes || 0) + Number(item.dislikes || 0) + (selectedVote(item.id) ? 1 : 0);
  }
  function summaryMarkup(school) {
    const summary = getRatingSummary(school);
    if (!summary) return `<section class="school-rating-summary empty-rating"><div class="score-big"><b>—</b><span>trên 5</span><div class="stars">☆☆☆☆☆</div><small>Chưa có lượt đánh giá</small></div><div class="score-bars empty-bars"><div><span>Trải nghiệm học</span><em>Chưa có lượt đánh giá</em></div><div><span>Ký túc xá</span><em>Chưa có lượt đánh giá</em></div><div><span>Môi trường sống</span><em>Chưa có lượt đánh giá</em></div></div></section>`;
    const line = (label, value) => `<div><span>${label}</span><b style="--score:${value * 20}%"></b><em>${value.toFixed(1)}</em></div>`;
    return `<section class="school-rating-summary"><div class="score-big"><b>${summary.overall.toFixed(1)}</b><span>trên 5</span><div class="stars">${stars(summary.overall)}</div><small>Dựa trên ${summary.count} lượt đánh giá</small></div><div class="score-bars">${line('Trải nghiệm học',summary.learning)}${line('Ký túc xá',summary.housing)}${line('Môi trường sống',summary.living)}</div></section>`;
  }
  function reviewCard(review) {
    const choice = selectedVote(review.id);
    const displayedLikes = Number(review.likes || 0) + (choice === 'like' ? 1 : 0);
    const displayedDislikes = Number(review.dislikes || 0) + (choice === 'dislike' ? 1 : 0);
    const average = reviewAverage(review).toFixed(1);
    const initial = review.name.split(' ').slice(-1)[0]?.[0] || 'S';
    const schoolLink = DATA.partners.find(partner => normal(partner.name) === normal(review.school));
    const schoolText = schoolLink ? `<button type="button" class="review-school-link" data-review-school="${escapeHtml(schoolLink.id)}">${escapeHtml(review.school)}</button>` : escapeHtml(review.school);
    return `<article class="review-card"><div class="review-head"><div class="reviewer"><span class="avatar">${initial}</span><div><b>${escapeHtml(review.name)}</b><small>${escapeHtml(review.meta)} · ${schoolText} · ${escapeHtml(review.country)}</small></div></div><button class="review-stars review-score-button" type="button" data-rating-details="${review.id}" aria-label="Xem chi tiết điểm ${average} trên 5">${stars(reviewAverage(review))} <small>${average}</small><span>Chi tiết</span></button></div>${review.text ? `<p>“${escapeHtml(review.text)}”</p>` : ''}<div class="review-actions"><button class="${choice === 'like' ? 'selected' : ''}" aria-pressed="${choice === 'like'}" type="button" data-vote="like" data-review-id="${review.id}">👍 Hữu ích <b>${displayedLikes}</b></button><button class="${choice === 'dislike' ? 'selected' : ''}" aria-pressed="${choice === 'dislike'}" type="button" data-vote="dislike" data-review-id="${review.id}">👎 <b>${displayedDislikes}</b></button></div></article>`;
  }
  function ratingEntry(rating, partner, reviews) {
    const linkedReview = reviews.find(review => review.id === rating.reviewId);
    if (linkedReview) return linkedReview;
    return { id: rating.id, name:'Sinh viên ẩn danh', meta:'Đã chấm điểm · Không để lại chia sẻ', school:rating.school, country:partner?.country || '', region:partner?.region || '', learning:rating.learning, housing:rating.housing, living:rating.living, likes:0, dislikes:0, text:'' };
  }
  function renderReviews() {
    const q = normal($('#review-search').value), region = regionSelect.value, country = countrySelect.value, order = $('#review-rating').value;
    const reviews = [...seedReviews, ...localStore.read('ftux-reviews')].filter(review => Boolean(partnerByName(review.school)));
    const exactSchool = DATA.partners.find(p => normal(p.name) === q)?.name;
    $('.school-rating-summary')?.remove();
    if (exactSchool) $('.review-featured').insertAdjacentHTML('afterbegin', summaryMarkup(exactSchool));
    // Ratings are the source of truth both for the main page and school pages.
    // This makes “Hiện tất cả” useful even for rating-only student feedback.
    let entries = allRatings().filter(item => ['learning','housing','living'].every(key => Number.isFinite(Number(item[key])))).map(item => {
      const partner = partnerByName(item.school);
      return ratingEntry(item, partner, reviews);
    }).filter(item => (!q || normal(`${item.school} ${item.country} ${item.region} ${placeAliases[item.country] || ''} ${placeAliases[item.region] || ''}`).includes(q)) && (!region || item.region === region) && (!country || item.country === country));
    entries = [...entries].sort((a,b) => {
      const interactionDifference = interactionTotal(b) - interactionTotal(a);
      if (interactionDifference) return interactionDifference;
      return order === 'rating-asc' ? reviewAverage(a) - reviewAverage(b) : reviewAverage(b) - reviewAverage(a);
    });
    const hasMore = entries.length > 5;
    const displayed = showAll ? entries : entries.slice(0, 5);
    visibleEntries = new Map(entries.map(item => [item.id, item]));
    $('#review-list').innerHTML = displayed.length ? displayed.map(reviewCard).join('') : '<div class="empty-state">Chưa tìm thấy review phù hợp với bộ lọc này.</div>';
    const expandButton = $('#show-all-reviews');
    expandButton.hidden = !hasMore;
    expandButton.textContent = showAll ? 'Rút gọn' : 'Hiện tất cả đánh giá';
  }
  setReviewSchoolFilter = school => { showAll = false; $('#review-search').value = school || ''; renderReviews(); };
  ['review-search','review-region','review-country','review-rating'].forEach(id => $(`#${id}`).addEventListener('input', () => { showAll = false; renderReviews(); }));
  $('#show-all-reviews').addEventListener('click', () => { showAll = !showAll; renderReviews(); });
  $('#review-list').addEventListener('click', event => {
    const school = event.target.closest('[data-review-school]');
    if (school) { showDetail(school.dataset.reviewSchool); return; }
    const details = event.target.closest('[data-rating-details]');
    if (details) {
      const review = visibleEntries.get(details.dataset.ratingDetails); if (!review) return;
      $('#rating-detail-content').innerHTML = `<p class="rating-person">${escapeHtml(review.name)} · <b>${reviewAverage(review).toFixed(1)} / 5</b></p><div class="rating-detail-lines"><div><span>Trải nghiệm học</span><b>${stars(review.learning)} ${Number(review.learning).toFixed(1)}</b></div><div><span>Ký túc xá</span><b>${stars(review.housing)} ${Number(review.housing).toFixed(1)}</b></div><div><span>Môi trường sống</span><b>${stars(review.living)} ${Number(review.living).toFixed(1)}</b></div></div>`;
      $('#rating-detail-dialog').showModal(); return;
    }
    const button = event.target.closest('[data-vote]'); if (!button) return;
    const saved = interactions(); const id = button.dataset.reviewId; const requested = button.dataset.vote;
    const item = saved.find(entry => entry.id === id);
    if (item) item.vote = item.vote === requested ? null : requested;
    else saved.push({ id, vote: requested });
    localStore.write(interactionKey, saved); renderReviews();
  });
  renderReviews();
  const dialog = $('#review-dialog');
  $$('[data-open-review]').forEach(button => button.addEventListener('click', () => dialog.showModal()));
  $('[data-close-review]').addEventListener('click', () => dialog.close());
  $('#review-form').addEventListener('submit', event => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const school = compact(form.get('school')); const learning = Number(form.get('learning')); const housing = Number(form.get('housing')); const living = Number(form.get('living')); const comment = compact(form.get('comment'));
    const partner = partnerByName(school);
    if (!partner) { toast('Vui lòng chọn một trường trong danh sách đối tác FTU.'); return; }
    const reviewId = comment ? `local-review-${Date.now()}` : null;
    const savedRatings = localStore.read('ftux-ratings'); savedRatings.push({ id:`local-rating-${Date.now()}`, reviewId, school, learning, housing, living }); localStore.write('ftux-ratings', savedRatings);
    if (comment) {
      const savedReviews = localStore.read('ftux-reviews');
      savedReviews.push({ id: reviewId, name: compact(form.get('reviewer')), meta: 'Đánh giá mới', school, country: partner?.country || 'Đang cập nhật', region: partner?.region || 'Global', learning, housing, living, likes:0, dislikes:0, text: comment });
      localStore.write('ftux-reviews', savedReviews);
    }
    dialog.close(); event.currentTarget.reset(); setReviewSchoolFilter(school);
    toast(comment ? 'Đã gửi đánh giá và chia sẻ của bạn!' : 'Đã gửi đánh giá của bạn!');
  });
  $('[data-close-rating-detail]').addEventListener('click', () => $('#rating-detail-dialog').close());
}
document.addEventListener('click', event => {
  const detailButton = event.target.closest('[data-partner]'); if (detailButton) showDetail(detailButton.dataset.partner);
  const expandMappings = event.target.closest('[data-expand-mappings]');
  if (expandMappings) {
    const isExpanded = expandMappings.dataset.expanded === 'true';
    $$('.mapping-extra', $('#detail-content')).forEach(row => { row.hidden = isExpanded; });
    expandMappings.dataset.expanded = String(!isExpanded);
    expandMappings.textContent = isExpanded ? expandMappings.dataset.defaultLabel : 'Rút gọn';
  }
  if (event.target.closest('[data-back-catalog]')) history.back();
  if (event.target.closest('[data-open-alumni]')) {
    const school = $('#detail h1')?.textContent?.trim() || '';
    setReviewSchoolFilter(school);
    showPage('reviews', { reviewSchool: school });
  }
});
$$('.nav-link').forEach(link => link.addEventListener('click', event => { event.preventDefault(); showPage(link.getAttribute('href').slice(1)); }));
$$('.text-link[href="#universities"]').forEach(link => link.addEventListener('click', event => { event.preventDefault(); showPage('universities'); renderCatalog(); }));
$('#hero-search').addEventListener('submit', event => { event.preventDefault(); $('#catalog-search').value = $('#search-input').value; showPage('universities'); renderCatalog(); });
$$('[data-scroll-upload]').forEach(button => button.addEventListener('click', () => { showPage('home'); setTimeout(() => $('#upload-tool').scrollIntoView({behavior:'smooth'}), 120); }));
$('#school-count').textContent = DATA.partners.length; $('#mapping-count').textContent = `${(DATA.mappings.length / 1000).toFixed(1)}k+`;
window.addEventListener('popstate', event => {
  const state = event.state;
  if (state?.page === 'detail' && state.partnerId) showDetail(state.partnerId, false);
  else {
    if (state?.page === 'reviews') setReviewSchoolFilter(state.reviewSchool || '');
    showPage(state?.page || 'home', { updateHistory: false });
  }
});
renderFeatured(); initCatalog(); initUpload(); initReviews();
const initialPage = location.hash.slice(1);
if (initialPage && ['home','universities','reviews'].includes(initialPage)) showPage(initialPage, { updateHistory: false });
history.replaceState({ page: initialPage || 'home', partnerId: null }, '', `#${initialPage || 'home'}`);
iconRefresh();
