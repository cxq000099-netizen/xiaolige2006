const DATA = window.RESTAURANTS || [];
const $ = (id) => document.getElementById(id);
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const config = {
  '川菜': {icon:'🌶', color:'#dc5136'},
  '火锅': {icon:'🍲', color:'#c63b28'},
  '串串': {icon:'🍢', color:'#d77a2a'},
  '烧烤': {icon:'🔥', color:'#a4472e'},
  '创意菜': {icon:'✨', color:'#9d7147'},
  '地方菜': {icon:'🥢', color:'#b36e40'},
  '异国菜': {icon:'🌍', color:'#5b8266'},
  '面包甜点': {icon:'🥐', color:'#c79857'},
  '咖啡茶饮': {icon:'☕', color:'#816348'},
  '面食小吃': {icon:'🍜', color:'#b9863e'},
  '酒吧': {icon:'🍸', color:'#735d82'},
  '自助餐': {icon:'🍽', color:'#637c7d'}
};
const typePins = {
  '老店':{icon:'🏮',color:'#c44a35'},'连锁':{icon:'🏬',color:'#397a75'},
  '独立经营':{icon:'🥢',color:'#955f3e'},'社区店':{icon:'🏠',color:'#658a54'},
  '路边摊':{icon:'🍢',color:'#dc832d'},'新店':{icon:'✨',color:'#8c68a8'},
  '小店':{icon:'🍽',color:'#ba7658'},'老店 / 连锁':{icon:'🏪',color:'#725f94'},
  '其他':{icon:'📍',color:'#657b87'},'未注明':{icon:'●',color:'#85948b'}
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
const ratingWords={3:'普通好',4:'很好',5:'非常好',6:'超级好'};
const pointById=new Map();
const byDistrict=new Map();
for(const item of DATA){if(districts[item.district]){if(!byDistrict.has(item.district))byDistrict.set(item.district,[]);byDistrict.get(item.district).push(item);}}
for(const [district,items] of byDistrict){
  const center=districts[district];
  items.forEach((item,index)=>{
    const angle=index*2.399963229728653;
    const radius=.004+Math.sqrt(index)*.005;
    pointById.set(item.id,[center[0]+Math.sin(angle)*radius,center[1]+Math.cos(angle)*radius]);
  });
}

function point(item) {return pointById.get(item.id)||null;}
function mapSearch(item) {
  return 'https://uri.amap.com/search?keyword=' + encodeURIComponent(item.name + ' ' + (item.area || '成都')) + '&city=510100&view=map&src=xiaolige-food-map&callnative=0';
}
function cartoonFor(item) {
  const c=config[item.category], shift=(item.id*19)%45;
  return `<svg viewBox="0 0 360 180" role="img" aria-label="${escapeHtml(item.category)}卡通图案，非店铺实拍" xmlns="http://www.w3.org/2000/svg"><rect width="360" height="180" fill="#f1e9d8"/><path d="M0 ${28+shift}L360 ${-55+shift}M0 ${95+shift}L360 ${12+shift}M0 ${160+shift}L360 ${78+shift}" stroke="${c.color}" stroke-opacity=".16" stroke-width="19"/><circle cx="180" cy="90" r="73" fill="#fffaf0" stroke="${c.color}" stroke-width="7"/><circle cx="180" cy="90" r="57" fill="${c.color}" fill-opacity=".12"/><text x="180" y="121" text-anchor="middle" font-size="77">${c.icon}</text><circle cx="53" cy="31" r="6" fill="${c.color}" opacity=".45"/><circle cx="318" cy="135" r="10" fill="${c.color}" opacity=".27"/><text x="15" y="168" fill="${c.color}" font-size="11" font-family="sans-serif" font-weight="700" letter-spacing="2">XIAOLIGE · CHENGDU</text></svg>`;
}
function showDetails(item) {
  const panel=$('shop-detail');
  panel.innerHTML=`<button class="detail-close" type="button" aria-label="关闭店铺介绍">×</button><small>${escapeHtml(item.district)} · ${escapeHtml(item.category)} · ${escapeHtml(item.type)} · 区域示意</small><h3>${escapeHtml(item.name)}</h3><div class="popup-rating"><span>${'★'.repeat(item.stars)}</span> ${item.stars}星 · ${ratingWords[item.stars]}</div><p><b>介绍</b><br>${escapeHtml(item.reason)}</p><p><b>评价</b><br>${escapeHtml(item.review)}</p><a href="${mapSearch(item)}" target="_blank" rel="noopener">查找准确店址 ↗</a>`;
  panel.hidden=false;
}
function initializeMap() {
  if (!window.L) { $('map-fallback').hidden = false; return; }
  map = L.map('map', {scrollWheelZoom:false, zoomControl:false}).setView([30.65,104.067], 12);
  L.control.zoom({position:'bottomright'}).addTo(map);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom:18, attribution:'© OpenStreetMap contributors'}).addTo(map);
  markerLayer = L.layerGroup().addTo(map);
  map.on('tileerror', () => { $('map-fallback').hidden = false; });
  renderMarkers();
}
function renderMarkers() {
  if (!map) return;
  markerLayer.clearLayers(); markerById.clear();
  for (const item of state.filtered) {
    const p=point(item);if(!p)continue;
    const c=typePins[item.type]||typePins['未注明'];
    const icon=L.divIcon({className:'food-marker single-marker',html:`<span style="--pin:${c.color}" aria-hidden="true"><b>${c.icon}</b></span>`,iconSize:[24,24],iconAnchor:[12,12]});
    const marker=L.marker(p,{icon,title:item.name,riseOnHover:true}).addTo(markerLayer);
    marker.on('click',()=>showDetails(item));
    marker.on('mouseover',()=>{if(matchMedia('(hover: hover)').matches)showDetails(item);});
    markerById.set(item.id,marker);
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
  selectOptions('area-filter', DATA.map(x=>x.district));
  selectOptions('type-filter', DATA.map(x=>x.type));
  selectOptions('taste-filter', DATA.map(x=>x.taste));
  selectOptions('occasion-filter', DATA.map(x=>x.occasion));
  const categories = Object.keys(config).filter(c => DATA.some(x=>x.category===c));
  $('categories').innerHTML = `<button type="button" class="active" data-category="">全部 <span>${DATA.length}</span></button>` + categories.map(c=>`<button type="button" data-category="${escapeHtml(c)}">${config[c].icon} ${escapeHtml(c)} <span>${DATA.filter(x=>x.category===c).length}</span></button>`).join('');
  $('legend').innerHTML = Object.entries(typePins).filter(([type])=>DATA.some(x=>x.type===type)).map(([type,c])=>`<span><i style="--pin:${c.color}">${c.icon}</i>${escapeHtml(type)}</span>`).join('');
  for (const id of ['area-filter','type-filter','taste-filter','occasion-filter']) $(id).addEventListener('change', filter);
  $('categories').addEventListener('click', e => {const b=e.target.closest('button[data-category]');if(!b)return;state.category=b.dataset.category;state.shown=18;for(const x of $('categories').querySelectorAll('button'))x.classList.toggle('active',x===b);filter();});
  $('reset').addEventListener('click',()=>{for(const id of ['area-filter','type-filter','taste-filter','occasion-filter'])$(id).value='';state.category='';state.shown=18;for(const x of $('categories').querySelectorAll('button'))x.classList.toggle('active',x.dataset.category==='');filter();});
  $('more').addEventListener('click',()=>{state.shown+=18;renderList();});
  $('shop-detail').addEventListener('click',e=>{if(e.target.closest('.detail-close'))$('shop-detail').hidden=true;});
  $('listing').addEventListener('click',e=>{const b=e.target.closest('button[data-focus]');if(!b)return;const id=Number(b.dataset.focus),m=markerById.get(id),item=DATA.find(x=>x.id===id);if(m&&map&&item){map.flyTo(m.getLatLng(),Math.max(map.getZoom(),12));showDetails(item);document.querySelector('.map-section').scrollIntoView({behavior:'smooth'});}});
}
function filter() {
  const area=$('area-filter').value;
  const type=$('type-filter').value,taste=$('taste-filter').value,occasion=$('occasion-filter').value;
  state.filtered=DATA.filter(x=>(!state.category||x.category===state.category)&&(!area||x.district===area)&&(!type||x.type===type)&&(!taste||x.taste===taste)&&(!occasion||x.occasion===occasion));
  state.shown=18;$('result-count').textContent=state.filtered.length+' 家结果';renderList();renderMarkers();
  $('shop-detail').hidden=true;
  if(map){if(area&&districts[area])map.flyTo(districts[area],14);else if(!area)map.setView([30.65,104.067],12);}
}
function card(item) {
  const c=config[item.category], p=point(item);
  return `<article class="card"><div class="card-image" style="--tone:${c.color}">${cartoonFor(item)}<span class="image-label">卡通图案 · 非店铺实拍</span></div><div class="card-body"><div class="card-meta"><span class="cat" style="--pin:${c.color}">${c.icon} ${escapeHtml(item.category)}</span><span>${escapeHtml(item.district)}</span></div><h3>${escapeHtml(item.name)}</h3><div class="card-rating"><span>${'★'.repeat(item.stars)}</span> ${item.stars}星 · ${ratingWords[item.stars]}</div><p class="reason">${escapeHtml(item.reason)}</p><p class="review"><b>评价摘要</b> ${escapeHtml(item.review)}</p><div class="tags"><span>饭店类型：${escapeHtml(item.type)}</span><span>口味：${escapeHtml(item.taste)}</span><span>适合的场合：${escapeHtml(item.occasion)}</span></div><div class="card-actions">${p?`<button type="button" data-focus="${item.id}">查看地图标记 ↗</button>`:'<span class="no-point">区域待核实</span>'}<a href="${mapSearch(item)}" target="_blank" rel="noopener">查找准确店址 ↗</a></div></div></article>`;
}
function renderList() {
  const items=state.filtered.slice(0,state.shown);
  $('listing').innerHTML=items.length?items.map(card).join(''):'<p class="empty">暂时没有符合条件的店，试试其他筛选。</p>';
  $('more').hidden=state.filtered.length<=state.shown;
}
function observeLayout() {
  let frame;
  const refresh=()=>{
    cancelAnimationFrame(frame);
    frame=requestAnimationFrame(()=>{if(map)map.invalidateSize({pan:false,debounceMoveend:true});});
  };
  // Preserve the selected restaurant, filters and map center while the screen changes.
  if(window.ResizeObserver)new ResizeObserver(refresh).observe($('map'));
  window.addEventListener('resize',refresh,{passive:true});
  window.visualViewport?.addEventListener('resize',refresh,{passive:true});
  navigator.devicePosture?.addEventListener('change',refresh);
  for(const query of ['(horizontal-viewport-segments: 2)','(vertical-viewport-segments: 2)'])matchMedia(query).addEventListener('change',refresh);
}
initControls(); filter(); initializeMap(); observeLayout();

async function initializeVisits() {
  const endpoint=document.querySelector('meta[name="analytics-endpoint"]')?.content?.trim().replace(/\/$/,'');
  if(!endpoint)return;
  const status=$('visit-status');
  let base;try{base=new URL(endpoint);if(base.protocol!=='https:')throw new Error();}catch{status.textContent='访问统计暂不可用';return;}
  const provinces={'11':'北京市','12':'天津市','13':'河北省','14':'山西省','15':'内蒙古自治区','21':'辽宁省','22':'吉林省','23':'黑龙江省','31':'上海市','32':'江苏省','33':'浙江省','34':'安徽省','35':'福建省','36':'江西省','37':'山东省','41':'河南省','42':'湖北省','43':'湖南省','44':'广东省','45':'广西壮族自治区','46':'海南省','50':'重庆市','51':'四川省','52':'贵州省','53':'云南省','54':'西藏自治区','61':'陕西省','62':'甘肃省','63':'青海省','64':'宁夏回族自治区','65':'新疆维吾尔自治区','--':'省级地区未知'};
  const count=value=>Number.isSafeInteger(value)&&value>=0?value:0;
  const number=value=>count(value).toLocaleString('zh-CN');
  const regionNames=typeof Intl.DisplayNames==='function'?new Intl.DisplayNames(['zh-CN'],{type:'region'}):null;
  const countryName=code=>code==='XX'?'地区未知':(/^[A-Z]{2}$/.test(code)?regionNames?.of(code)||code:'地区未知');
  const rows=(values,label)=>values.map(x=>`<li><span>${escapeHtml(label(x.code))}</span><strong>${number(x.views)} 次</strong></li>`).join('')||'<li class="stats-empty">暂无访问记录。</li>';
  status.textContent='正在读取访问统计…';
  const request=async(path,options={})=>{
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),8000);
    try{const response=await fetch(endpoint+path,{...options,credentials:'omit',referrerPolicy:'no-referrer',signal:controller.signal});if(!response.ok)throw new Error();return await response.json();}finally{clearTimeout(timer);}
  };
  let counted=false;
  // Exactly one POST per document load. Opening a disclosure or changing filters does not count.
  try{const result=await request('/visit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({page:'home'})});counted=result.counted===true;}catch{}
  try{
    const data=await request('/stats');
    if(!Number.isSafeInteger(data.total)||data.total<0||!Array.isArray(data.countries)||!Array.isArray(data.provinces))throw new Error();
    $('visit-total').textContent=number(data.total);
    $('visit-countries').innerHTML=rows(data.countries,countryName);
    const provinceCounts=new Map(data.provinces.map(x=>[x.code,count(x.views)]));
    const provinceRows=Object.keys(provinces).filter(code=>code!=='--'||provinceCounts.has(code)).map(code=>({code,views:provinceCounts.get(code)||0})).sort((a,b)=>b.views-a.views||a.code.localeCompare(b.code));
    $('visit-provinces').innerHTML=rows(provinceRows,code=>provinces[code]);
    const since=data.since?new Date(data.since):null;
    status.textContent=(since&&!Number.isNaN(since.getTime())?'自 '+since.toLocaleDateString('zh-CN')+' 起累计':'统计已启用')+(counted?' · 本次访问已计入':' · 本次访问暂未计入');
  }catch{status.textContent='访问统计暂不可用，请稍后再看';for(const id of ['visit-countries','visit-provinces'])$(id).innerHTML='<li class="stats-empty">暂时无法读取统计数据。</li>';}
}
initializeVisits();
