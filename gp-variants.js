/* Galaxy Point variant editor — restored 2026-11-13 */
(function(){
'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const n=v=>Math.max(0,Math.floor(Number(v)||0));
const storageOptions=['64GB','128GB','256GB','512GB','1TB'];
function mountEditor(form,product){
 const host=form.querySelector('#gp-variant-manager');
 let rows=(Array.isArray(product?.variantOptions)?product.variantOptions:[]).map(r=>({...r}));
 if(!rows.length)rows=[{storage:storageOptions.find(x=>String(product?.storage||'').includes(x))||'128GB',color:product?.color?.split(',')[0]?.trim()||'Black',price:product?.price||0,marketPrice:product?.marketPrice||0,stock:product?.stock??1,batteryHealth:'',cycleCount:''}];
 function draw(){
 host.innerHTML='<p class="field-tip">Set storage, colour, battery health, cycle count, GP price, market price and stock for each available unit.</p><div id="gp-unit-rows">'+rows.map((r,i)=>'<div class="gp-unit-card" data-unit="'+i+'" style="border:1px solid #e5e9f1;border-radius:14px;padding:15px;margin:12px 0;background:#fafbff"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><strong>Unit '+(i+1)+'</strong><button type="button" class="btn" data-remove-unit="'+i+'">Remove</button></div><div class="field-grid">'+
 '<div class="field"><label>Storage</label><select data-k="storage">'+storageOptions.map(x=>'<option value="'+x+'" '+(r.storage===x?'selected':'')+'>'+x+'</option>').join('')+(storageOptions.includes(r.storage)?'':'<option selected value="'+esc(r.storage||'')+'">'+esc(r.storage||'Custom')+'</option>')+'</select></div>'+
 '<div class="field"><label>Colour</label><input data-k="color" data-color-toggle="1" value="'+esc(r.color)+'" placeholder="e.g. Blue"></div>'+
 '<div class="field"><label>Battery Health %</label><input type="number" min="0" max="100" data-k="batteryHealth" value="'+esc(r.batteryHealth??'')+'" placeholder="e.g. 92"></div>'+
 '<div class="field"><label>Cycle Count</label><input type="number" min="0" data-k="cycleCount" value="'+esc(r.cycleCount??'')+'" placeholder="Optional"></div>'+
 '<div class="field"><label>GP Price ₹</label><input type="number" min="0" data-k="price" value="'+esc(r.price??'')+'" required></div>'+
 '<div class="field"><label>Market Price ₹</label><input type="number" min="0" data-k="marketPrice" value="'+esc(r.marketPrice??'')+'"></div>'+
 '<div class="field"><label>Stock</label><input type="number" min="0" data-k="stock" value="'+esc(r.stock??1)+'" required></div>'+
 '<div class="field"><label>Discount</label><strong data-discount style="display:block;padding:10px 0">—</strong></div></div></div>').join('')+'</div><button type="button" class="btn primary" id="gp-add-unit">+ Add another unit / variant</button>';
 host.querySelectorAll('[data-unit]').forEach(card=>discount(card));
 }
 function discount(card){const price=Number(card.querySelector('[data-k="price"]').value),market=Number(card.querySelector('[data-k="marketPrice"]').value);card.querySelector('[data-discount]').textContent=market>price&&price>=0?Math.round((market-price)/market*100)+'% OFF':'—';}
 function snapshot(){rows=[...host.querySelectorAll('[data-unit]')].map(card=>Object.fromEntries([...card.querySelectorAll('[data-k]')].map(el=>[el.dataset.k,el.value])));}
 host.addEventListener('input',e=>{const card=e.target.closest('[data-unit]');if(card)discount(card)});
 host.addEventListener('click',e=>{if(e.target.id==='gp-add-unit'){snapshot();rows.push({...rows[rows.length-1],price:0,marketPrice:0,stock:1,batteryHealth:'',cycleCount:''});draw()}const btn=e.target.closest('[data-remove-unit]');if(btn){snapshot();if(rows.length>1){rows.splice(Number(btn.dataset.removeUnit),1);draw()}}});
 form.gpReadVariantOptions=()=>{snapshot();return rows.map(r=>({storage:String(r.storage||'').trim(),color:String(r.color||'').trim(),price:n(r.price),marketPrice:n(r.marketPrice),stock:n(r.stock),batteryHealth:r.batteryHealth===''?'':String(Math.min(100,n(r.batteryHealth))),cycleCount:r.cycleCount===''?'':String(n(r.cycleCount))})).filter(r=>r.storage&&r.color&&r.price>0)};
 draw();
}
window.GPVariants={mountEditor};
})();
