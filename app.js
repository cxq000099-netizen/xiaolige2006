const DATA = window.RESTAURANTS || [];
const $ = (id) => document.getElementById(id);
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const config = {
  '川菜': {icon:'🌶', color:'#dc5136', image:'Authentic_Mapo_Tofu.jpg'},
  '火锅': {icon:'🍲', color:'#c63b28', image:'Chengdu_Hotpot.jpg'},
  '串串': {icon:'🍢', color:'#d77a2a', image:'Chengdu_bobo_chicken_skewers.jpg'},
  '烧烤': {icon:'🔥', color:'#a4472e', image:'Chengdu_bobo_chicken_skewers.jpg'},
  '创意菜': {icon:'✨', color:'#9d7147', image:'Authentic_Mapo_Tofu.jpg'},
  '地方菜': {icon:'🥢', color:'#b36e40', image:'Authentic_Mapo_Tofu.jpg'},
  '异国菜': {icon:'🌍', color:'#5b8266', image:'Authentic_Mapo_Tofu.jpg'},
  '面包甜点': {icon:'🥐', color:'#c79857', image:'Freshly_baked_pastries_with_coffee_and_cookies_on_a_table.jpg'},
  '咖啡茶饮': {icon:'☕', color:'#816348', image:'Freshly_baked_pastries_with_coffee_and_cookies_on_a_table.jpg'},
  '面食小吃': {icon:'🍜', color:'#b9863e', image:'Dandannoodles.jpg'},
  '酒吧': {icon:'🍸', color:'#735d82', image:'Freshly_baked_pastries_with_coffee_and_cookies_on_a_table.jpg'},
  '自助餐': {icon:'🍽', color:'#637c7d', image:'Chengdu_Hotpot.jpg'}
};
// Sheet coordinates are district-level only. These central points are intentionally illustrative.
const districts = {
  '锦江区':[30.657,104.083],'青羊区':[30.674,104.057],'金牛区':[30.692,104.052],
  '武侯区':[30.643,104.044],'成华区':[30.668,104.115],'高新区':[30.596,104.066],
  '成都高新区':[30.596,104.066],'天府新区':[30.463,104.073],'双流区':[30.574,103.922],
  '龙泉驿区':[30.565,104.274],'郫都区':[30.808,103.887],'温江区':[30.682,103.856],
  '新都区':[30.824,104.158],'青白江区':[30.884,104.255],'新津区':[30.413,103.812],
  '都江堰市':[30.988,103.647],'彭州市':[30.985,103.94],'崇州市':[30.632,103.673],
  '邛崃市':[30.41,103.464],'简阳市':[30.39,104.547],'金堂县':[30.856,104.436],
  '大邑县':[30.587,103.522],'蒲江县':[30.199,103.507],'成都市':[30.659,104.066]
};
const state = {category:'', shown:18, filtered:DATA};
let map, markerLayer, markerById = new Map();

function areaCenter(area) {
  if (!area) return null;
  const key = Object.keys(districts).find(k => area.includes(k) || k.includes(area));
  return key ? districts[key] : null;
}
function point(item) {
  const center = areaCenter(item.area);
  if (!center) return null;
  // Keep coincident district-level records individually selectable without implying a street address.
  const angle = (item.id * 137.508) * Math.PI / 180;
  const radius = 0.003 + ((item.id * 29) % 13) * 0.0011;
  return [center[0] + Math.sin(angle) * radius, center[1] + Math.cos(angle) * radius];
}
function mapSearch(item) {
  return 'https://uri.amap.com/search?keyword=' + encodeURIComponent(item.name + ' ' + (item.area || '成都')) + '&city=510100&view=map&src=xiaolige-food-map&callnative=0';
}
function imageFor(item) {
  const file = config[item.category]?.image;
  return file ? 'https://commons.wikimedia.org/wiki/Special:FilePath/' + encodeURIComponent(file) + '?width=640' : '';
}
function initializeMap() {
  if (!window.L) { $('map-fallback').hidden = false; return; }
  map = L.map('map', {scrollWheelZoom:false, zoomControl:false}).setView([30.65,104.067], 10);
  L.control.zoom({position:'bottomright'}).addTo(map);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom:18, attribution:'© OpenStreetMap contributors'}).addTo(map);
  markerLayer = L.layerGroup().addTo(map);
  map.on('tileerror', () => { $('map-fallback').hidden = false; });
  renderMarkers();
}
function renderMarkers() {
  if (!map) return;
  markerLayer.clearLayers(); markerById.clear();
  const groups = new Map();
  for (const item of state.filtered) {
    const center=areaCenter(item.area); if(!center)continue;
    const key=item.area.replace(/[（(].*$/,'')+'|'+item.category;
    if(!groups.has(key))groups.set(key,{items:[],center,category:item.category,area:item.area});
    groups.get(key).items.push(item);
  }
  for (const group of groups.values()) {
    const c=config[group.category], n=Object.keys(config).indexOf(group.category);
    const angle=n*2.39996,radius=.008+(n%3)*.004;
    const p=[group.center[0]+Math.sin(angle)*radius,group.center[1]+Math.cos(angle)*radius];
    const icon=L.divIcon({className:'food-marker',html:`<span style="--pin:${c.color}" aria-hidden="true"><b>${c.icon}</b><small>${group.items.length}</small></span>`,iconSize:[43,43],iconAnchor:[21,21]});
    const marker=L.marker(p,{icon,title:group.area+' · '+group.category+' · '+group.items.length+'家'}).addTo(markerLayer);
    const names=group.items.slice(0,12).map(x=>`<li><a href="${mapSearch(x)}" target="_blank" rel="noopener">${escapeHtml(x.name)} ↗</a></li>`).join('');
    marker.bindPopup(`<div class="map-popup"><small>${escapeHtml(group.area)} · 区域示意</small><strong>${c.icon} ${escapeHtml(group.category)} · ${group.items.length} 家</strong><ul>${names}</ul>${group.items.length>12?'<p>更多店铺请在下方列表查看。</p>':''}</div>`,{maxWidth:280});
    for(const item of group.items)markerById.set(item.id,marker);
  }
}
function selectOptions(id, values) {
  const select = $(id);
  [...new Set(values.filter(v => v && v !== '未注明'))].sort((a,b)=>a.localeCompare(b,'zh-CN')).forEach(v => {
    const o=document.createElement('option'); o.value=v;o.textContent=v; select.appendChild(o);
  });
}
function initControls() {
  $('total-count').textContent = DATA.length;
  selectOptions('type-filter', DATA.map(x=>x.type));
  selectOptions('taste-filter', DATA.map(x=>x.taste));
  selectOptions('occasion-filter', DATA.map(x=>x.occasion));
  const categories = Object.keys(config).filter(c => DATA.some(x=>x.category===c));
  $('categories').innerHTML = `<button type="button" class="active" data-category="">全部 <span>${DATA.length}</span></button>` + categories.map(c=>`<button type="button" data-category="${escapeHtml(c)}">${config[c].icon} ${escapeHtml(c)} <span>${DATA.filter(x=>x.category===c).length}</span></button>`).join('');
  $('legend').innerHTML = categories.map(c=>`<span><i style="--pin:${config[c].color}">${config[c].icon}</i>${escapeHtml(c)}</span>`).join('');
  for (const id of ['search','type-filter','taste-filter','occasion-filter']) $(id).addEventListener(id==='search'?'input':'change', filter);
  $('categories').addEventListener('click', e => {const b=e.target.closest('button[data-category]');if(!b)return;state.category=b.dataset.category;state.shown=18;for(const x of $('categories').querySelectorAll('button'))x.classList.toggle('active',x===b);filter();});
  $('reset').addEventListener('click',()=>{for(const id of ['search','type-filter','taste-filter','occasion-filter'])$(id).value='';state.category='';state.shown=18;for(const x of $('categories').querySelectorAll('button'))x.classList.toggle('active',x.dataset.category==='');filter();});
  $('more').addEventListener('click',()=>{state.shown+=18;renderList();});
  $('listing').addEventListener('click',e=>{const b=e.target.closest('button[data-focus]');if(!b)return;const m=markerById.get(Number(b.dataset.focus));if(m&&map){map.flyTo(m.getLatLng(),Math.max(map.getZoom(),12));m.openPopup();document.querySelector('.map-section').scrollIntoView({behavior:'smooth'});}});
}
function filter() {
  const q=$('search').value.trim().toLocaleLowerCase();
  const type=$('type-filter').value,taste=$('taste-filter').value,occasion=$('occasion-filter').value;
  state.filtered=DATA.filter(x=>(!state.category||x.category===state.category)&&(!type||x.type===type)&&(!taste||x.taste===taste)&&(!occasion||x.occasion===occasion)&&(!q||(x.name+x.area).toLocaleLowerCase().includes(q)));
  state.shown=18;$('result-count').textContent=state.filtered.length+' 家结果';renderList();renderMarkers();
}
function card(item) {
  const c=config[item.category], p=point(item);
  return `<article class="card"><div class="card-image" style="--tone:${c.color}"><img src="${imageFor(item)}" alt="${escapeHtml(item.category)}同类美食示意图，非该店实拍" loading="lazy" onerror="this.hidden=true"><span class="image-label">同类美食示意 · 非店铺实拍</span></div><div class="card-body"><div class="card-meta"><span class="cat" style="--pin:${c.color}">${c.icon} ${escapeHtml(item.category)}</span><span>${escapeHtml(item.area||'区域待核实')}</span></div><h3>${escapeHtml(item.name)}</h3><p class="reason">${escapeHtml(item.reason)}</p><div class="tags"><span>饭店类型：${escapeHtml(item.type)}</span><span>口味：${escapeHtml(item.taste)}</span><span>适合的场合：${escapeHtml(item.occasion)}</span></div><div class="card-actions">${p?`<button type="button" data-focus="${item.id}">地图示意点 ↗</button>`:'<span class="no-point">位置待核实</span>'}<a href="${mapSearch(item)}" target="_blank" rel="noopener">查找准确店址 ↗</a></div></div></article>`;
}
function renderList() {
  const items=state.filtered.slice(0,state.shown);
  $('listing').innerHTML=items.length?items.map(card).join(''):'<p class="empty">暂时没有符合条件的店，试试其他筛选。</p>';
  $('more').hidden=state.filtered.length<=state.shown;
}
initControls(); filter(); initializeMap();
