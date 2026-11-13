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
 const swatches={'Black':'#17191e','White':'#fff','Blue':'#3579d1','Gold':'#d8bd7d','Silver':'#c6cbd2','Grey':'#777e89','Gray':'#777e89','Green':'#559b77','Pink':'#efb6c7','Purple':'#9d85c6','Red':'#d94b51','Yellow':'#f4d55a','Natural Titanium':'#b8b2a5','Desert Titanium':'#bca78c'};
 const check=(type,val,selected)=>'<label style="display:inline-flex;align-items:center;gap:7px;border:1px solid #dce3ef;border-radius:10px;padding:9px 12px;margin:4px;cursor:pointer;background:'+(selected?'#edf4ff':'#fff')+'"><input type="checkbox" data-choice="'+type+'" value="'+esc(val)+'" '+(selected?'checked':'')+'>'+(type==='color'?'<span style="display:inline-block;width:20px;height:20px;flex:none;border-radius:50%;border:1px solid #aab4c2;background:'+esc(swatches[val]||'#d7dce5')+'"></span>':'')+esc(val)+'</label>';
 function capture(){
  rows=[...host.querySelectorAll('[data-unit]')].map(card=>Object.fromEntries([...card.querySelectorAll('[data-k]')].map(el=>[el.dataset.k,el.value])));
  colors=[...host.querySelectorAll('[data-choice="color"]:checked')].map(x=>x.value);
  storages=[...host.querySelectorAll('[data-choice="storage"]:checked')].map(x=>x.value);
 }
 function draw(){
  const allColors=[...new Set(['Black','White','Blue','Gold','Silver','Grey','Gray','Green','Pink','Purple','Red','Yellow','Natural Titanium','Desert Titanium',...colors])];
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