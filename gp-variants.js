/* Galaxy Point editor: separate Colour, Storage and Unit Details sections */
(function(){
'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number=v=>Math.max(0,Math.floor(Number(v)||0));
const storageOptions=['64GB','128GB','256GB','512GB','1TB','2TB'];
function mountEditor(form,product){
 const host=form.querySelector('#gp-variant-manager');if(!host)return;
 let rows=(Array.isArray(product?.variantOptions)?product.variantOptions:[]).map(r=>({...r}));
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
  ensureSelectedUnits();
  const allColors=[...new Set([...palette.map(x=>x[0]),...colors])];
  const allStorage=[...new Set([...storageOptions,...storages])];
  const colorHtml=allColors.map(c=>check('color',c,colors.includes(c))).join('')+'<div class="field" style="margin-top:10px"><label>Add custom colour</label><input id="gp-custom-color" placeholder="Colour name"><button type="button" class="btn" id="gp-add-color">+ Add Colour</button></div>';
  const storageHtml=allStorage.map(x=>check('storage',x,storages.includes(x))).join('');
  const units=rows.map((r,i)=>'<div data-unit="'+i+'" style="border:1px solid #e5e9f1;border-radius:12px;padding:12px;margin:9px 0;background:#fafbff;overflow-x:auto"><div style="display:flex;justify-content:space-between;align-items:center"><strong>Unit '+(i+1)+'</strong><button type="button" class="btn" data-remove-unit="'+i+'">Remove</button></div><div style="display:grid;grid-template-columns:105px 115px 105px 95px 115px 115px 85px 85px;gap:8px;align-items:end;min-width:870px;margin-top:8px">'+
  '<div class="field"><label>Storage</label><select data-k="storage">'+[...new Set([...storages,r.storage])].map(x=>'<option value="'+esc(x)+'" '+(r.storage===x?'selected':'')+'>'+esc(x)+'</option>').join('')+'</select></div>'+
  '<div class="field"><label>Colour</label><select data-k="color">'+[...new Set([...colors,r.color])].map(x=>'<option value="'+esc(x)+'" '+(r.color===x?'selected':'')+'>'+esc(x)+'</option>').join('')+'</select></div>'+
  '<div class="field"><label>Battery Health %</label><input type="number" min="0" max="100" data-k="batteryHealth" value="'+esc(r.batteryHealth??'')+'"></div>'+
  '<div class="field"><label>Cycle Count</label><input type="number" min="0" data-k="cycleCount" value="'+esc(r.cycleCount??'')+'"></div>'+
  '<div class="field"><label>GP Price ₹</label><input type="number" min="0" data-k="price" value="'+esc(r.price??'')+'"></div>'+
  '<div class="field"><label>Market Price ₹</label><input type="number" min="0" data-k="marketPrice" value="'+esc(r.marketPrice??'')+'"></div>'+
  '<div class="field"><label>Stock</label><input type="number" min="0" data-k="stock" value="'+esc(r.stock??1)+'"></div>'+
  '<div class="field"><label>Discount</label><strong data-discount>—</strong></div></div></div>').join('');
  host.innerHTML=section('1. All Colours',colorHtml)+section('2. Storage / Variants',storageHtml)+section('3. Battery Health, Cycle Count & Pricing',units+'<button type="button" class="btn primary" id="gp-add-unit">+ Add Another Unit</button>');
  host.querySelectorAll('[data-unit]').forEach(discount);
 }
 function discount(card){const p=Number(card.querySelector('[data-k="price"]').value),m=Number(card.querySelector('[data-k="marketPrice"]').value);card.querySelector('[data-discount]').textContent=m>p&&p>=0?Math.round((m-p)/m*100)+'% OFF':'—';}
 host.addEventListener('input',e=>{const card=e.target.closest('[data-unit]');if(card)discount(card)});
 host.addEventListener('change',e=>{if(e.target.matches('[data-choice]')){capture();draw()}});
 host.addEventListener('click',e=>{
  if(e.target.id==='gp-add-color'){const v=host.querySelector('#gp-custom-color').value.trim();if(v){capture();colors=[...new Set([...colors,v])];draw()}}
  if(e.target.id==='gp-add-unit'){capture();rows.push({storage:storages[0]||rows[0]?.storage||'128GB',color:colors[0]||rows[0]?.color||'Black',price:0,marketPrice:0,stock:1,batteryHealth:'',cycleCount:''});draw()}
  const b=e.target.closest('[data-remove-unit]');if(b){capture();if(rows.length>1){rows.splice(Number(b.dataset.removeUnit),1);draw()}}
 });
 form.gpReadVariantOptions=()=>{capture();return rows.map(r=>({storage:String(r.storage||'').trim(),color:String(r.color||'').trim(),price:number(r.price),marketPrice:number(r.marketPrice),stock:number(r.stock),batteryHealth:r.batteryHealth===''?'':String(Math.min(100,number(r.batteryHealth))),cycleCount:r.cycleCount===''?'':String(number(r.cycleCount))})).filter(r=>r.storage&&r.color&&r.price>0)};
 draw();
}
window.GPVariants={mountEditor};
})();