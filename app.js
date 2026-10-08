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
// Code-native illustrations: food family, flavour and shop type are independent visual layers.
function illustrationProfile(item) {
  let family = ({'川菜':'wok','火锅':'hotpot','串串':'skewers','烧烤':'grill','创意菜':'platter','地方菜':'regional','异国菜':'western','面包甜点':'pastry','咖啡茶饮':'coffee','面食小吃':'noodles','酒吧':'cocktail','自助餐':'buffet'})[item.category] || 'platter';
  const name=String(item.name || '');
  if(item.category==='面食小吃'){
    if(/饺|抄手|馄饨|包子|包点/.test(name))family='dumplings';
    else if(/蹄|兔|鸡|鸭|卤|肥肠|冒菜/.test(name)&&! /面|粉/.test(name))family='wok';
    else if(/冰|豆花|凉糕|甜/.test(name))family='dessert';
  }
  if(item.category==='面包甜点')family=/蛋糕|甜品|甜点|冰|糖|豆花/.test(name)?'dessert':'pastry';
  if(item.category==='咖啡茶饮'&&/茶|茗/.test(name)&&! /咖啡|coffee/i.test(name))family='tea';
  if(item.category==='异国菜'){
    if(/寿司|日料|刺身|居酒屋/.test(name))family='sushi';
    else if(/披萨|pizza/i.test(name))family='pizza';
    else if(/烤肉|烧肉/.test(name))family='grill';
  }
  if(item.category==='自助餐'&&/烤肉|烧烤|烧肉|烙锅/.test(name))family='grill';
  const flavour=/清淡|清汤/.test(item.taste)?'clear':/牛油/.test(item.taste)?'butter':/香辣|重口/.test(item.taste)?'spicy':/炭烤/.test(item.taste)?'charred':/特色/.test(item.taste)?'special':'balanced';
  return {family,flavour,type:item.type || '未注明',variant:Number(item.id || 0)%3};
}
function cartoonFor(item) {
  const p=illustrationProfile(item);
  const palettes={clear:['#e8eee0','#668e70','#c9db98'],butter:['#f8e2bf','#b9442d','#ea9d32'],spicy:['#f7e3d6','#bf4936','#d8643e'],charred:['#e7dfce','#77573c','#ad7046'],special:['#eee3d9','#796a9a','#ba9765'],balanced:['#eee9d9','#527a67','#d3aa66']};
  const [bg,accent,broth]=palettes[p.flavour];
  const ink='#394c42', cream='#fffaf0', green='#65885b', meat='#b76547';
  const ellipse=(x,y,rx,ry,fill)=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}"/>`;
  const leaf=(x,y)=>`<path d="M${x} ${y}q-13-18-22-10q1 16 22 10q13-19 22-10q-1 16-22 10" fill="${green}"/>`;
  const chilli=(x,y)=>`<path d="M${x} ${y}q14 3 22 17q-17 4-23-8Z" fill="#d54c35"/><path d="M${x} ${y}l-4-6" stroke="${green}" stroke-width="3"/>`;
  const steam=`<g fill="none" stroke="${ink}" stroke-width="2.5" opacity=".35"><path d="M176 49q-9-9 0-17t0-15"/><path d="M201 43q-9-9 0-17"/><path d="M228 49q-9-9 0-17t0-15"/></g>`;
  const garnish=p.flavour==='clear'?leaf(172,94)+leaf(223,87):p.flavour==='spicy'||p.flavour==='butter'?chilli(165,78)+chilli(219,88):leaf(215,85);
  const foodPieces=Array.from({length:7},(_,i)=>{const x=148+(i%4)*28,y=78+Math.floor(i/4)*26;return `<rect x="${x}" y="${y}" width="20" height="13" rx="5" transform="rotate(${(i%3-1)*15} ${x} ${y})" fill="${i%2?meat:'#e9d49f'}"/>`;}).join('');
  let food='';
  if(p.family==='hotpot')food=`${steam}<path d="M116 85h168l-15 60q-69 29-139 0Z" fill="${accent}" stroke="${ink}" stroke-width="3"/><path d="M117 99h-15v27h21M283 99h15v27h-21" fill="none" stroke="${ink}" stroke-width="7"/>${ellipse(200,85,85,33,ink)}${ellipse(200,82,78,28,broth)}${foodPieces}<path d="M200 56q-15 26 0 52" fill="none" stroke="${cream}" stroke-width="5"/>${garnish}<path d="M147 148h107" stroke="${cream}" stroke-width="3" opacity=".6"/>`;
  else if(p.family==='noodles')food=`${steam}<path d="M120 95q12 73 80 73t80-73" fill="${cream}" stroke="${ink}" stroke-width="3"/>${ellipse(200,95,80,30,accent)}${ellipse(200,92,71,23,broth)}<g stroke="#f7dda0" stroke-width="5" fill="none"><path d="M148 89q25-18 55 0t47 0M147 99q25-18 55 0t47 0M160 108q22-16 52 0t30-4"/></g>${leaf(158,91)}${ellipse(232,85,15,10,cream)}${ellipse(232,85,7,6,'#eab74a')}<path d="M228 53l79-32M234 61l78-29" stroke="${ink}" stroke-width="4"/>`;
  else if(p.family==='skewers'||p.family==='grill'){
    food=`${ellipse(200,128,101,39,cream)}<path d="M111 139q90 52 179 0" stroke="${ink}" stroke-width="3" fill="none"/>`;
    if(p.family==='grill')food+=`<rect x="119" y="70" width="158" height="77" rx="15" fill="${ink}"/>${Array.from({length:8},(_,i)=>`<path d="M${128+i*20} 76v64" stroke="#849184" stroke-width="2"/>`).join('')}`;
    food+=Array.from({length:4},(_,i)=>`<g transform="translate(${134+i*35} ${p.family==='grill'?80:67}) rotate(${i%2?12:-9})"><path d="M0 0v85" stroke="#c69a63" stroke-width="4"/>${[0,21,42].map((y,j)=>`<rect x="-11" y="${y}" width="23" height="17" rx="4" fill="${j===1&&i%2?green:meat}" stroke="${ink}" stroke-width="1.5"/>`).join('')}</g>`).join('');
    food+=p.flavour==='charred'?`<g fill="#e8af44"><circle cx="148" cy="166" r="4"/><circle cx="204" cy="165" r="4"/><circle cx="257" cy="166" r="4"/></g>`:chilli(280,127);
  }
  else if(p.family==='wok'||p.family==='regional')food=`${steam}${ellipse(200,124,99,40,cream)}${ellipse(200,111,85,31,accent)}${foodPieces}${garnish}<path d="M115 117q14 44 85 44t85-44" fill="none" stroke="${ink}" stroke-width="3"/><path d="M136 140q64 30 128 0" fill="none" stroke="${broth}" stroke-width="4"/>`;
  else if(p.family==='dumplings')food=`${ellipse(200,123,99,39,'#bd9166')}${ellipse(200,114,91,32,'#f3d5a9')}${Array.from({length:5},(_,i)=>{const x=145+(i%3)*43,y=82+Math.floor(i/3)*35;return `<g transform="translate(${x} ${y})"><path d="M-20 18q0-36 40 0q-20 17-40 0" fill="${cream}" stroke="#c9a675" stroke-width="2"/><path d="M-11 11l3-10m6 8V-4m8 14L3 0m10 14L9 5" stroke="#c9a675" stroke-width="2"/></g>`;}).join('')}${leaf(272,119)}`;
  else if(p.family==='pastry')food=`${ellipse(202,133,97,30,cream)}<path d="M130 120q-13-63 29-43q41-45 79 0q43-16 33 43l-28-18q-38 37-80 0Z" fill="#d4a459" stroke="${ink}" stroke-width="3"/><path d="M161 78q-8 20 1 40m21-54q-12 35-2 61m23-61q-5 35 4 58m25-41q10 21 6 31" stroke="#f6d28d" stroke-width="8"/><path d="M144 137h112" stroke="#ccb994" stroke-width="2"/>`;
  else if(p.family==='dessert')food=`${ellipse(204,141,91,25,cream)}<path d="M147 68h104v72H147Z" fill="#f0b3a5" stroke="${ink}" stroke-width="3"/><path d="M147 88h104v16H147zm0 35h104v15H147Z" fill="#e4c38c"/><path d="M145 69q9-18 20-7q9-18 21-7q9-17 22-7q9-17 22-7q16 0 24 28" fill="${cream}" stroke="${ink}" stroke-width="2"/><path d="M190 49q-15-21 4-22q21-2 10 22Z" fill="#d95b4d"/>${leaf(196,28)}<circle cx="262" cy="134" r="5" fill="#d95b4d"/>`;
  else if(p.family==='coffee'||p.family==='tea')food=`${steam}${ellipse(198,145,88,22,cream)}<path d="M145 70h104v58q-52 36-104 0Z" fill="${p.family==='tea'?'#c8dac6':cream}" stroke="${ink}" stroke-width="3"/><path d="M249 83q52 0 20 39h-21" fill="none" stroke="${ink}" stroke-width="7"/>${ellipse(197,70,52,16,ink)}${ellipse(197,68,46,12,p.family==='tea'?'#b4b86e':'#946345')}${p.family==='coffee'?`<path d="M180 67q17-15 33 0q-16 16-33 0m7-1q10-8 20 0" fill="none" stroke="#f8e6c9" stroke-width="3"/>`:leaf(197,67)}<rect x="263" y="135" width="30" height="22" rx="6" fill="#c69d5f" transform="rotate(15 263 135)"/>`;
  else if(p.family==='cocktail')food=`<path d="M140 57h110l-55 69Z" fill="#cbadc2" stroke="${ink}" stroke-width="3"/><path d="M151 72h88l-44 54Z" fill="#a67591"/><path d="M195 126v33m-27 0h54" fill="none" stroke="${ink}" stroke-width="4"/><circle cx="240" cy="57" r="20" fill="#d4df9a" stroke="${green}" stroke-width="4"/><path d="M195 90l56-66" stroke="${ink}" stroke-width="3"/><circle cx="203" cy="81" r="7" fill="#c84d40"/><path d="M130 115l-10 6m142-25 12 8" stroke="${accent}" stroke-width="3"/>`;
  else if(p.family==='sushi')food=`<rect x="112" y="108" width="175" height="45" rx="11" fill="#b89165"/>${[0,1,2].map(i=>`<g transform="translate(${133+i*48} 80)"><rect width="40" height="41" rx="13" fill="${cream}" stroke="${ink}" stroke-width="2"/><path d="M0 7q20-18 40 0v13H0Z" fill="#db8f72"/><path d="M11 0l-7 15m23-16-8 15" stroke="#f1bea2" stroke-width="3"/></g>`).join('')}${leaf(259,136)}`;
  else if(p.family==='pizza')food=`${ellipse(200,115,93,43,'#ce9960')}${ellipse(200,111,84,35,'#ebc975')}${[0,1,2,3,4,5].map(i=>`<circle cx="${155+i%3*42}" cy="${96+Math.floor(i/3)*28}" r="10" fill="#ba5e42"/>`).join('')}${leaf(191,103)}<path d="M201 78v69m-68-46 139 25m-129 0 120-25" stroke="#b28950" stroke-width="2"/>`;
  else if(p.family==='buffet')food=`${[0,1,2].map(i=>`${ellipse(141+i*61,111+(i%2)*24,37,24,cream)}${ellipse(141+i*61,107+(i%2)*24,29,17,i===1?green:broth)}`).join('')}${foodPieces}<path d="M120 157h162" stroke="${ink}" stroke-width="3"/>`;
  else food=`${ellipse(200,121,100,42,cream)}${ellipse(200,119,84,31,'#dbe1cc')}<rect x="163" y="86" width="61" height="42" rx="13" fill="${meat}" transform="rotate(-12 163 86)"/>${leaf(244,101)}${ellipse(151,129,14,9,broth)}<path d="M145 82q40-26 82 0" stroke="${accent}" stroke-width="4" fill="none"/>`;
  const old=/老店/.test(p.type), street=p.type==='路边摊', community=p.type==='社区店', chain=/连锁/.test(p.type), modern=p.type==='新店';
  const shopColor=chain?'#528181':community?'#789365':modern?'#88769c':old?'#bd624b':'#aa835c';
  let shop=`<rect x="22" y="48" width="70" height="74" rx="${modern?12:3}" fill="${cream}" stroke="${ink}" stroke-width="2"/><rect x="30" y="59" width="54" height="17" rx="2" fill="${shopColor}"/><path d="M38 68h38" stroke="${cream}" stroke-width="3"/><rect x="34" y="85" width="20" height="37" rx="2" fill="#e0d5ba"/><rect x="63" y="85" width="19" height="22" rx="2" fill="#b8cecb"/>`;
  if(old)shop+=`<path d="M18 48l15-13h50l15 13Z" fill="${shopColor}" stroke="${ink}" stroke-width="2"/><path d="M25 59v20m66-20v20" stroke="${ink}" stroke-width="2"/><ellipse cx="25" cy="71" rx="7" ry="10" fill="#d46a45"/><ellipse cx="91" cy="71" rx="7" ry="10" fill="#d46a45"/>`;
  else shop+=`<path d="M20 48h74l-5-14H25Z" fill="${shopColor}"/><path d="M30 34v14m14-14v14m14-14v14m14-14v14m14-14v14" stroke="${cream}" stroke-width="5"/>`;
  if(street)shop=`<path d="M24 47h70l-8-21H32Z" fill="${shopColor}" stroke="${ink}" stroke-width="2"/><path d="M30 48v44m57-44v44" stroke="${ink}" stroke-width="3"/><rect x="22" y="91" width="73" height="28" rx="4" fill="#d4aa71" stroke="${ink}" stroke-width="2"/><circle cx="35" cy="123" r="7" fill="${ink}"/><circle cx="81" cy="123" r="7" fill="${ink}"/>`;
  if(community)shop+=`<path d="M18 130v-24m0 11q-17-13-11-18q14-7 11 18q15-19 21-13q5 13-21 13" stroke="${green}" stroke-width="3" fill="none"/>`;
  if(chain)shop+=`<circle cx="57" cy="40" r="7" fill="${cream}"/><path d="M52 40h10m-5-5v10" stroke="${shopColor}" stroke-width="2"/>`;
  const patterns=p.variant===0?`<path d="M308 28l10 9m-10 0 10-9M317 150l9 9m-9 0 9-9" stroke="${accent}" stroke-width="2" opacity=".4"/>`:p.variant===1?`<circle cx="311" cy="39" r="16" fill="${accent}" opacity=".12"/><circle cx="325" cy="144" r="8" fill="${accent}" opacity=".2"/>`:`<path d="M299 33q12-15 24 0t24 0M302 151q12-15 24 0t24 0" fill="none" stroke="${accent}" stroke-width="3" opacity=".25"/>`;
  return `<svg viewBox="0 0 360 180" role="img" aria-label="${escapeHtml(item.category+' · '+item.taste+' · '+item.type)}主题卡通插画，非店铺实拍" data-art="${p.family}-${p.flavour}-${escapeHtml(p.type)}" xmlns="http://www.w3.org/2000/svg"><rect width="360" height="180" fill="${bg}"/><path d="M0 132q93-23 176 2t184-7v53H0Z" fill="${accent}" opacity=".08"/>${patterns}<g stroke-linejoin="round" stroke-linecap="round">${shop}${food}</g><text x="22" y="150" fill="${ink}" font-size="10" font-family="sans-serif">${escapeHtml(p.type==='未注明'?'成都食记':p.type)}</text><text x="22" y="165" fill="${accent}" font-size="8" font-family="sans-serif" letter-spacing="1.3">CHENGDU FOOD ATLAS</text></svg>`;
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
