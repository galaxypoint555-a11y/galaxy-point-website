/* Galaxy Point editor: separate Colour, Storage and Unit Details sections */
(function(){
'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number=v=>Math.max(0,Math.floor(Number(v)||0));
const storageOptions=['64GB','128GB','256GB','512GB','1TB','2TB'];
const publicSwatches={Black:'#17191e',White:'#f4f4f2',Silver:'#c6c9cc',Blue:'#36588b',Pink:'#d9b0bc',Gold:'#d5c5a2',Purple:'#9382aa',Green:'#94ab9e',Red:'#b95555',Grey:'#85868d',Graphite:'#55535a','Natural Titanium':'#aaa49a','Desert Titanium':'#ab8e74',Midnight:'#29313f',Starlight:'#ece8dd',Yellow:'#eee184',Orange:'#df935e',Teal:'#7da5a3',Cream:'#ece5d8','Space Black':'#333136','Sierra Blue':'#9fb6c7','Pacific Blue':'#5d748b','Rose Gold':'#cdb1a7',Coral:'#d9988d',Mint:'#bbd7c9',Lavender:'#c3b6dd','Titanium Black':'#414143','Titanium White':'#dededb','Titanium Blue':'#6a778e','Phantom Black':'#242428',Burgundy:'#724954','Cream White':'#f1ede6','Light Blue':'#b4cee8','Dark Green':'#3f6353',Gray:'#85868d','Space Gray':'#72757c','Jet Black':'#151517',Ultramarine:'#5266b7','Alpine Green':'#576e62','Deep Purple':'#5d536c','Deep Blue':'#30476e','Cosmic Orange':'#e58b4b','Cloud White':'#f3f3f1','Midnight Green':'#4e6864','Space Grey':'#72757c','Titanium Gray':'#81858c'};
function mountEditor(form,product){
 const host=form.querySelector('#gp-variant-manager');if(!host)return;
 let rows=(Array.isArray(product?.variantOptions)?product.variantOptions:[]).map(r=>({...r}));
 let lastEditedUnit=-1;
 if(!rows.length)rows=[{storage:product?.storage||'128GB',color:String(product?.color||'Black').split(',')[0].trim(),price:product?.price||0,marketPrice:product?.marketPrice||0,stock:product?.stock??1,batteryHealth:'',cycleCount:''}];
 let colors=[...new Set([...String(product?.color||'').split(',').map(x=>x.trim()).filter(Boolean),...rows.map(r=>r.color).filter(Boolean)])];
 let storages=[...new Set(rows.map(r=>r.storage).filter(Boolean))];
 const section=(title,body)=>'<section style="background:#fff;border:1px solid #e3e8f1;border-radius:16px;padding:18px;margin:14px 0;box-shadow:0 3px 14px rgba(20,40,80,.04)"><h3 style="margin:0 0 12px;font-size:16px">'+title+'</h3>'+body+'</section>';
 const palette=[["Black","#17191e"],["White","#f4f4f2"],["Silver","#c6c9cc"],["Blue","#36588b"],["Pink","#d9b0bc"],["Gold","#d5c5a2"],["Purple","#9382aa"],["Green","#94ab9e"],["Red","#b95555"],["Grey","#85868d"],["Graphite","#55535a"],["Natural Titanium","#aaa49a"],["Desert Titanium","#ab8e74"],["Midnight","#29313f"],["Starlight","#ece8dd"],["Yellow","#eee184"],["Orange","#df935e"],["Teal","#7da5a3"],["Cream","#ece5d8"],["Space Black","#333136"],["Sierra Blue","#9fb6c7"],["Pacific Blue","#5d748b"],["Rose Gold","#cdb1a7"],["Coral","#d9988d"],["Mint","#bbd7c9"],["Lavender","#c3b6dd"],["Titanium Black","#414143"],["Titanium White","#dededb"],["Titanium Blue","#6a778e"],["Phantom Black","#242428"],["Burgundy","#724954"],["Cream White","#f1ede6"],["Light Blue","#b4cee8"],["Dark Green","#3f6353"],["Gray","#85868d"],["Space Gray","#72757c"],["Jet Black","#151517"],["Ultramarine","#5266b7"],["Alpine Green","#576e62"],["Deep Purple","#5d536c"],["Deep Blue","#30476e"],["Cosmic Orange","#e58b4b"],["Cloud White","#f3f3f1"],["Midnight Green","#4e6864"],["Space Grey","#72757c"],["Titanium Gray","#81858c"]];
 const swatches=Object.fromEntries(palette);
 const check=(type,val,selected)=>'<label style="display:inline-flex;align-items:center;gap:7px;border:1px solid '+(selected?'#83bfb1':'#dce3ef')+';border-radius:16px;padding:12px 16px;margin:5px;min-width:155px;min-height:62px;cursor:pointer;background:'+(selected?'#edf8f5':'#fff')+'"><input type="checkbox" data-choice="'+type+'" value="'+esc(val)+'" '+(selected?'checked':'')+'>'+(type==='color'?'<span style="display:inline-block;width:34px;height:34px;flex:none;border-radius:50%;border:1px solid #aab4c2;background:'+esc(swatches[val]||'#d7dce5')+'"></span>':'')+esc(val)+'</label>';
 function capture(){
  rows=[...host.querySelectorAll('[data-unit]')].map(card=>Object.fromEntries([...card.querySelectorAll('[data-k]')].map(el=>[el.dataset.k,el.value])));
  colors=[...host.querySelectorAll('[data-choice="color"]:checked')].map(x=>x.value);
  storages=[...host.querySelectorAll('[data-choice="storage"]:checked')].map(x=>x.value);
 }
 function ensureSelectedUnits(){
  if(!colors.length||!storages.length)return;
  const existing=new Set(rows.map(r=>String(r.storage)+'|'+String(r.color)));
  for(const storage of storages)for(const color of colors){
   const key=storage+'|'+color;
   if(!existing.has(key)){rows.push({storage,color,price:0,marketPrice:0,stock:0,batteryHealth:'',cycleCount:''});existing.add(key)}
  }
 }
 function draw(){
  const allColors=[...new Set([...palette.map(x=>x[0]),...colors])];
  const allStorage=[...new Set([...storageOptions,...storages])];
  const colorHtml=allColors.map(c=>check('color',c,colors.includes(c))).join('')+'<div class="field" style="margin-top:10px"><label>Add custom colour</label><input id="gp-custom-color" placeholder="Colour name"><button type="button" class="btn" id="gp-add-color">+ Add Colour</button></div>';
  const storageHtml=allStorage.map(x=>check('storage',x,storages.includes(x))).join('');
  const units=rows.map((r,i)=>'<div data-unit="'+i+'" style="border:1px solid #e5e9f1;border-radius:12px;padding:12px;margin:9px 0;background:#fafbff;overflow-x:auto"><div style="display:flex;justify-content:space-between;align-items:center"><strong>Unit '+(i+1)+'</strong><button type="button" class="btn" data-remove-unit="'+i+'">Remove</button></div><div style="display:grid;grid-template-columns:105px 115px 105px 95px 115px 115px 85px 110px 85px;gap:8px;align-items:end;min-width:1000px;margin-top:8px">'+
  '<div class="field"><label>Storage</label><select data-k="storage">'+[...new Set([...storages,r.storage])].map(x=>'<option value="'+esc(x)+'" '+(r.storage===x?'selected':'')+'>'+esc(x)+'</option>').join('')+'</select></div>'+
  '<div class="field"><label>Colour</label><select data-k="color">'+[...new Set([...colors,r.color])].map(x=>'<option value="'+esc(x)+'" '+(r.color===x?'selected':'')+'>'+esc(x)+'</option>').join('')+'</select></div>'+
  '<div class="field"><label>Battery Health %</label><input type="number" min="0" max="100" data-k="batteryHealth" value="'+esc(r.batteryHealth??'')+'"></div>'+
  '<div class="field"><label>Cycle Count</label><input type="number" min="0" data-k="cycleCount" value="'+esc(r.cycleCount??'')+'"></div>'+
  '<div class="field"><label>GP Price ₹</label><input type="number" min="0" data-k="price" value="'+esc(r.price??'')+'"></div>'+
  '<div class="field"><label>Market Price ₹</label><input type="number" min="0" data-k="marketPrice" value="'+esc(r.marketPrice??'')+'"></div>'+
  '<div class="field"><label>Stock</label><input type="number" min="0" data-k="stock" value="'+esc(r.stock??1)+'"></div>'+
  '<div class="field"><label>Variant Region</label><select data-k="region"><option value="">Select</option><option value="Indian" '+(r.region==='Indian'?'selected':'')+'>🇮🇳 Indian</option><option value="Global" '+(r.region==='Global'?'selected':'')+'>🌍 Global</option></select></div>'+
  '<div class="field"><label>Discount</label><strong data-discount>—</strong></div></div></div>').join('');
  host.innerHTML=section('1. All Colours',colorHtml)+section('2. Storage / Variants',storageHtml)+section('3. Battery Health, Cycle Count & Pricing',units+'<button type="button" class="btn primary" id="gp-add-unit">+ Add Another Unit</button>');
  host.querySelectorAll('[data-unit]').forEach(discount);
 }
 function discount(card){const p=Number(card.querySelector('[data-k="price"]').value),m=Number(card.querySelector('[data-k="marketPrice"]').value);card.querySelector('[data-discount]').textContent=m>p&&p>=0?Math.round((m-p)/m*100)+'% OFF':'—';}
 host.addEventListener('input',e=>{const card=e.target.closest('[data-unit]');if(card){if(e.target.matches('[data-k="price"]'))lastEditedUnit=Number(card.dataset.unit);discount(card)}});
 host.addEventListener('change',e=>{if(e.target.matches('[data-choice]')){capture();draw()}});
 host.addEventListener('click',e=>{
  if(e.target.id==='gp-add-color'){const v=host.querySelector('#gp-custom-color').value.trim();if(v){capture();colors=[...new Set([...colors,v])];draw()}}
  if(e.target.id==='gp-add-unit'){capture();rows.push({storage:storages[0]||rows[0]?.storage||'128GB',color:colors[0]||rows[0]?.color||'Black',price:0,marketPrice:0,stock:1,batteryHealth:'',cycleCount:''});draw()}
  const b=e.target.closest('[data-remove-unit]');if(b){capture();if(rows.length>1){rows.splice(Number(b.dataset.removeUnit),1);draw()}}
 });
 form.gpReadVariantOptions=()=>{capture();const valid=rows.map(r=>({storage:String(r.storage||'').trim(),color:String(r.color||'').trim(),price:number(r.price),marketPrice:number(r.marketPrice),stock:number(r.stock),batteryHealth:r.batteryHealth===''?'':String(Math.min(100,number(r.batteryHealth))),cycleCount:r.cycleCount===''?'':String(number(r.cycleCount)),region:['Indian','Global'].includes(r.region)?r.region:''})).filter(r=>r.storage&&r.color&&r.price>0);if(lastEditedUnit>=0){const edited=rows[lastEditedUnit];const matched=valid.find(r=>r.storage===String(edited?.storage||'').trim()&&r.color===String(edited?.color||'').trim()&&r.price===number(edited?.price));if(matched)return [matched,...valid.filter(r=>r!==matched)]}return valid};
 draw();
}
const selected=new Map(),selectedUnit=new Map(),selectedCondition=new Map();
const variants=p=>Array.isArray(p?.variantOptions)?p.variantOptions.filter(r=>r&&r.storage&&r.color&&Number(r.price)>0):[];
const choice=p=>{const a=variants(p),v=selected.get(String(p.id))||{};return a.find(r=>(!v.storage||r.storage===v.storage)&&(!v.color||r.color===v.color))||a[0]||null};
const unit=p=>variants(p)[0]||null;
const selection=p=>unit(p);
const stock=(p,v)=>Math.min(1,Math.max(0,Number(unit(p)?.stock??p.stock??0)));
const marketPrice=(p,v)=>Number((v||unit(p))?.marketPrice??p.marketPrice??0);
const condition=p=>Number(p?.conditionPrices?.bestValue)>0?'Best Value':null;
const chooseCondition=(p,name)=>{if(name==='Best Value')selectedCondition.set(String(p.id),name)};
const displayPrice=(p,v)=>{const selectedRow=v||unit(p);return selectedRow&&Number(selectedRow.price)>0?Number(selectedRow.price):Number(p?.conditionPrices?.bestValue)>0?Number(p.conditionPrices.bestValue):Number(p.price||0)};
const picker=p=>{const v=unit(p);const storage=v?.storage||p?.storage||'';const color=v?.color||String(p?.color||'').split(',')[0].trim();return '<div class="gp-variant-picker">'+(storage?'<div class="gp-vlabel">Storage</div><div class="gp-variant-option" style="cursor:default">'+esc(storage)+'</div>':'')+(color?'<div class="gp-vlabel">Colour</div><div class="gp-variant-option" style="cursor:default"><span aria-hidden="true" style="display:inline-block;width:17px;height:17px;border-radius:50%;border:1px solid #aeb7c4;flex:none;background:'+esc(publicSwatches[color]||'#d7dce5')+';margin-right:7px"></span>'+esc(color)+'</div>':'')+'</div>'};
const unitPicker=p=>'';
const batteryInfo=p=>{const r=unit(p);if(!r)return '';const health=String(r.batteryHealth??'').trim();const hasHealth=/^(?:100|\d{1,2})(?:\.\d+)?$/.test(health);const hasCycle=r.cycleCount!==''&&r.cycleCount!=null;const region=['Indian','Global'].includes(r.region)?r.region:'';if(!hasHealth&&!hasCycle&&!region)return '';return '<div class="gp-variant-picker gp-battery-picker">'+(hasHealth?'<div class="gp-vlabel">Battery Health</div><div class="gp-variant-option" style="cursor:default">'+esc(health)+'%</div>':'')+(hasCycle?'<div class="gp-vlabel" style="margin-top:10px">Cycle Count</div><div class="gp-variant-option" style="cursor:default">'+esc(r.cycleCount)+'</div>':'')+(region?'<div class="gp-vlabel" style="margin-top:10px">Variant</div><div class="gp-variant-option" style="cursor:default">'+(region==='Indian'?'🇮🇳 Indian':'🌍 Global')+'</div>':'')+'</div>'};
const choose=(p,type,value)=>{};
const chooseUnit=(p,i)=>{};
const key=(p)=>String(p.id);
const resolve=(items,k)=>{const [id,idx]=String(k).split('::'),p=items.find(x=>String(x.id)===id);if(!p)return null;const r=unit(p);return {p,price:displayPrice(p,r),stock:stock(p,r),name:p.name||p.title,variant:r}};
const conditionPicker=p=>condition(p)?'<div class="gp-condition-choice"><div class="gp-vlabel">Condition</div><div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:9px 0"><span style="display:inline-flex;align-items:center;gap:7px;background:#eaf5ee;color:#246347;border:1px solid #c7e4d1;border-radius:999px;padding:8px 14px;font-weight:750;font-size:13px">✓ Best Value</span><span style="font-size:12px;font-weight:700;color:#50627a">Quality-Checked Pre-Owned</span></div><p style="margin:8px 0 0;line-height:1.65;color:#52647b">A smart choice for everyday performance and great value. Pre-owned device with visible signs of use; cosmetic wear may vary by unit.</p></div>':'';
const conditionDetails=()=>'';
window.GPVariants={mountEditor,selection,unit,stock,marketPrice,condition,chooseCondition,displayPrice,picker,unitPicker,batteryInfo,choose,chooseUnit,key,resolve,conditionPicker,conditionDetails};
})();