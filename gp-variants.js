/* Galaxy Point optional product-wise variant combinations. */
(function(){
  'use strict';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
  const clean=s=>String(s||'').trim().replace(/\s+/g,' ').slice(0,65);
  const sane=r=>Array.isArray(r)?r.filter(x=>x&&typeof x==='object').map(x=>({storage:clean(x.storage),color:clean(x.color),price:Math.max(0,Math.floor(Number(x.price)||0)),stock:Math.max(0,Math.floor(Number(x.stock)||0))})).filter(x=>x.storage&&x.color&&x.price>0).slice(0,200):[];
  const rows=p=>sane(p?.variantOptions||p?.variant_options);
  const selected=new Map();
  const active=p=>rows(p).length>0;
  function selection(p){
    const list=rows(p),id=String(p.id);
    if(!list.length)return null;
    const key=selected.get(id);
    const preferred=list.find(x=>x.storage+'|'+x.color===key);
    if(preferred)return preferred;
    const first=list.find(x=>x.stock>0)||list[0];
    selected.set(id,first.storage+'|'+first.color);return first;
  }
  function choose(p,field,value){
    const list=rows(p),current=selection(p);if(!list.length)return;
    const eligible=list.filter(x=>x[field]===value);
    if(!eligible.length)return;
    const matching=eligible.find(x=>x.storage===current?.storage&&x.color===current?.color);
    const preferred=matching||eligible.find(x=>x.stock>0)||eligible[0];
    selected.set(String(p.id),preferred.storage+'|'+preferred.color);
  }
  function key(p,defaultForCard=false){
    const list=rows(p);
    if(!list.length)return String(p.id);
    const picked=defaultForCard?(list.find(x=>x.stock>0)||list[0]):selection(p);
    return String(p.id)+'@@'+encodeURIComponent(picked.storage)+'@@'+encodeURIComponent(picked.color);
  }
  function resolve(items,k){
    const parts=String(k).split('@@'),p=items.find(x=>String(x.id)===parts[0]);if(!p)return null;
    const options=rows(p);
    const variant=parts.length===3?options.find(x=>x.storage===decodeURIComponent(parts[1])&&x.color===decodeURIComponent(parts[2])):null;
    if(parts.length===3&&!variant)return null;
    return {p,variant,key:k,price:variant?variant.price:p.price,stock:variant?variant.stock:p.stock,description:variant?(variant.storage+' · '+variant.color):p.details};
  }

  const palette=[['Black','#17191d'],['White','#f5f5f3'],['Silver','#c8cdd1'],['Blue','#274e86'],['Pink','#e8b5c0'],['Gold','#d8c29a'],['Purple','#9584ad'],['Green','#8cae9f'],['Red','#c64c50'],['Grey','#858b92'],['Graphite','#505056'],['Natural Titanium','#b4a99a'],['Desert Titanium','#b28e75'],['Midnight','#242e3c'],['Starlight','#eee8dc'],['Yellow','#f0dc72'],['Orange','#ed864c'],['Teal','#6aa7a6'],['Cream','#f1e6d6'],['Space Black','#303035'],['Sierra Blue','#9eb7c9'],['Pacific Blue','#536e84'],['Rose Gold','#d9b0a4'],['Coral','#ef8f83'],['Mint','#b5d9c7'],['Lavender','#c3b7e5'],['Titanium Black','#3e4041'],['Titanium White','#e7e4de'],['Titanium Blue','#64748b'],['Phantom Black','#23252c'],['Burgundy','#774352'],['Cream White','#f5f0e8'],['Light Blue','#a9cce9'],['Dark Green','#375f50']];
  const colorHex=name=>palette.find(x=>x[0].toLowerCase()===String(name).toLowerCase())?.[1]||'#adb5bd';
  function picker(p){
    const list=rows(p);if(!list.length)return '';
    const here=selection(p),storages=[...new Set(list.map(x=>x.storage))],colors=[...new Set(list.map(x=>x.color))];
    const storageOptions=storages.map(s=>{const inStock=list.some(x=>x.storage===s&&x.stock>0);return '<button type="button" class="gp-vopt '+(here.storage===s?'picked ':'')+(!inStock?'unavailable':'')+'" data-v-storage="'+esc(s)+'" aria-pressed="'+(here.storage===s)+'">'+esc(s)+'</button>'}).join('');
    const colorOptions=colors.map(c=>{const exists=list.some(x=>x.storage===here.storage&&x.color===c),available=list.some(x=>x.storage===here.storage&&x.color===c&&x.stock>0),current=here.color===c;return '<button type="button" class="gp-color-swatch '+(current?'picked ':'')+(!available?'unavailable':'')+'" data-v-color="'+esc(c)+'" aria-label="'+esc(c)+(available?'':' unavailable')+'" title="'+esc(c)+'" aria-pressed="'+current+'" '+(!exists||!available?'disabled':'')+'><span class="gp-swatch-fill" style="background:'+colorHex(c)+'"></span>'+(current?'<span class="gp-swatch-tick">✓</span>':'')+'</button>'}).join('');
    return '<div class="gp-vpick" aria-label="Select phone variant and colour"><div class="gp-vlabel">Storage: <strong>'+esc(here.storage)+'</strong></div><div class="gp-vrow">'+storageOptions+'</div><div class="gp-vlabel">Colour: <strong>'+esc(here.color)+'</strong></div><div class="gp-vrow gp-color-row">'+colorOptions+'</div></div>';
  }
  function mountEditor(form,initial){
    const host=form.querySelector('#gp-variant-manager');if(!host)return;
    const old=sane(initial.variantOptions||[]);
    const selectedStorages=new Set(old.map(x=>x.storage)),selectedColors=new Set(old.map(x=>x.color));
    const allStorages=[...new Set(['64GB','128GB','256GB','512GB','1TB','2TB',...selectedStorages])];
    const allColors=[...new Set([...palette.map(x=>x[0]),...selectedColors])];
    const storageData={};for(const s of allStorages){const entries=old.filter(x=>x.storage===s);storageData[s]={price:entries[0]?.price||0,stock:entries.reduce((n,x)=>n+x.stock,0)}}
    host.innerHTML='<p class="field-tip">Choose the available storage sizes, set each price, then select the phone colours. Only selected colours will appear on the public product page.</p><div class="gp-v-manager-block"><label class="gp-v-editor-label">STORAGE · PRICE · STOCK</label><div class="gp-v-storage-grid" id="gp-v-storage-grid"></div><div class="gp-v-custom-line"><input type="text" id="gp-v-custom-storage" placeholder="Custom storage, e.g. 8GB / 128GB" maxlength="65"><button type="button" class="btn sm" id="gp-v-add-storage">+ Add Storage</button></div></div><div class="gp-v-manager-block"><label class="gp-v-editor-label">SELECT AVAILABLE PHONE COLOURS</label><div class="gp-v-color-grid" id="gp-v-color-grid"></div><div class="gp-v-custom-line"><input type="text" id="gp-v-custom-color" placeholder="Custom colour name" maxlength="65"><button type="button" class="btn sm" id="gp-v-add-color">+ Add Colour</button></div></div><p class="field-tip" id="gp-v-summary"></p>';
    const price=form.elements.price,stock=form.elements.stock,storageHost=host.querySelector('#gp-v-storage-grid'),colorHost=host.querySelector('#gp-v-color-grid');
    function sync(){
      const active=selectedStorages.size>0&&selectedColors.size>0;
      price.readOnly=active;stock.readOnly=active;
      if(active){const vals=[...selectedStorages].map(s=>storageData[s]).filter(x=>x?.price>0);if(vals.length){price.value=Math.min(...vals.map(x=>x.price));stock.value=[...selectedStorages].reduce((n,s)=>n+(storageData[s]?.stock||0)*selectedColors.size,0)}}
      host.querySelector('#gp-v-summary').textContent=selectedStorages.size+' storage sizes · '+selectedColors.size+' colours selected · Only selected options appear publicly';
    }
    function render(){
      storageHost.innerHTML=allStorages.map(s=>'<div class="gp-v-storage-card '+(selectedStorages.has(s)?'selected':'')+'"><label class="gp-v-storage-head"><input type="checkbox" data-storage-toggle="'+esc(s)+'" '+(selectedStorages.has(s)?'checked':'')+'><strong>'+esc(s)+'</strong></label><div class="gp-v-price-stock"><label>Price ₹<input type="number" min="1" step="1" data-storage-price="'+esc(s)+'" placeholder="31999" value="'+(storageData[s]?.price||'')+'" '+(!selectedStorages.has(s)?'disabled':'')+'></label><label>Stock / colour<input type="number" min="0" step="1" data-storage-stock="'+esc(s)+'" value="'+(storageData[s]?.stock||0)+'" '+(!selectedStorages.has(s)?'disabled':'')+'></label></div></div>').join('');
      colorHost.innerHTML=allColors.map(c=>'<label class="gp-v-color-item '+(selectedColors.has(c)?'selected':'')+'"><input type="checkbox" data-color-toggle="'+esc(c)+'" '+(selectedColors.has(c)?'checked':'')+'><span class="gp-v-color-dot" style="background:'+colorHex(c)+'"></span><span>'+esc(c)+'</span></label>').join('');
      sync();
    }
    host.addEventListener('change',e=>{const t=e.target;if(t.dataset.storageToggle!==undefined){t.checked?selectedStorages.add(t.dataset.storageToggle):selectedStorages.delete(t.dataset.storageToggle);render()}else if(t.dataset.colorToggle!==undefined){t.checked?selectedColors.add(t.dataset.colorToggle):selectedColors.delete(t.dataset.colorToggle);render()}});
    host.addEventListener('input',e=>{const t=e.target;if(t.dataset.storagePrice!==undefined){storageData[t.dataset.storagePrice].price=Number(t.value)||0;sync()}else if(t.dataset.storageStock!==undefined){storageData[t.dataset.storageStock].stock=Math.max(0,Math.floor(Number(t.value)||0));sync()}});
    host.querySelector('#gp-v-add-storage').addEventListener('click',()=>{const t=host.querySelector('#gp-v-custom-storage'),s=clean(t.value);if(!s)return;if(!allStorages.includes(s)){allStorages.push(s);storageData[s]={price:0,stock:0}}selectedStorages.add(s);t.value='';render()});
    host.querySelector('#gp-v-add-color').addEventListener('click',()=>{const t=host.querySelector('#gp-v-custom-color'),s=clean(t.value);if(!s)return;if(!allColors.includes(s))allColors.push(s);selectedColors.add(s);t.value='';render()});
    form.gpReadVariantOptions=()=>{
      if(!selectedStorages.size&&!selectedColors.size)return [];
      if(!selectedStorages.size||!selectedColors.size)throw Error('Select at least one storage size and one colour.');
      const options=[];for(const s of selectedStorages){const d=storageData[s];if(!Number.isInteger(d.price)||d.price<=0)throw Error('Enter a valid price for '+s);if(!Number.isInteger(d.stock)||d.stock<0)throw Error('Enter valid stock for '+s);const cs=[...selectedColors];for(let i=0;i<cs.length;i++)options.push({storage:s,color:cs[i],price:d.price,stock:d.stock})}
      if(options.length>200)throw Error('Maximum 200 combinations.');return sane(options);
    };
    render();
  }
  function styles(){
    if(document.getElementById('gp-variant-styles'))return;
    const st=document.createElement('style');st.id='gp-variant-styles';st.textContent='.gp-vpick{margin:22px 0}.gp-vlabel{font-weight:700;font-size:17px;margin:17px 0 12px}.gp-vrow{display:flex;flex-wrap:wrap;gap:10px}.gp-vopt{border:1px solid #d4d6d9;border-radius:12px;padding:12px 16px;background:#fff;color:#424b55;font-weight:650;min-height:46px}.gp-vopt.picked{background:#e9f7f5;border-color:#6bc8bd;color:#238b80;box-shadow:0 0 0 1px #6bc8bd}.gp-vopt.unavailable{opacity:.45;text-decoration:line-through}.gp-color-row{gap:15px}.gp-color-swatch{width:47px;height:47px;border-radius:50%;border:2px solid transparent;background:transparent;padding:4px;position:relative;display:inline-flex;align-items:center;justify-content:center;cursor:pointer}.gp-color-swatch.picked{border-color:#62bfb5}.gp-color-swatch.unavailable{opacity:.38}.gp-swatch-fill{width:36px;height:36px;border-radius:50%;border:2px solid #aaa;display:block}.gp-swatch-tick{position:absolute;color:#fff;font-size:24px;font-weight:800;text-shadow:0 1px 4px #222}.gp-v-manager-block{margin:17px 0 24px}.gp-v-editor-label{display:block;font-weight:800;letter-spacing:1.1px;font-size:12px;margin-bottom:12px}.gp-v-storage-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px}.gp-v-storage-card{padding:12px;border:1px solid #e1e5ed;border-radius:13px;background:#fff}.gp-v-storage-card.selected{border-color:#75c8bf;background:#f3fbf9}.gp-v-storage-head{display:flex;gap:8px;align-items:center}.gp-v-price-stock{display:flex;gap:8px;margin-top:9px}.gp-v-price-stock label{font-size:11px;min-width:0;flex:1}.gp-v-price-stock input{width:100%;padding:8px 5px;border:1px solid #dce2e9;border-radius:7px}.gp-v-color-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(112px,1fr));gap:9px}.gp-v-color-item{border:1px solid #e2e6ec;border-radius:12px;display:flex;align-items:center;gap:7px;padding:9px 7px;cursor:pointer;font-size:12px;background:white}.gp-v-color-item.selected{border-color:#61bfb3;background:#eefaf7}.gp-v-color-dot{width:25px;height:25px;border-radius:50%;border:1px solid #aaa;flex-shrink:0}.gp-v-custom-line{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}.gp-v-custom-line input{min-width:170px;flex:1;padding:10px;border:1px solid #dce2e9;border-radius:8px}';document.head.appendChild(st);
  }
  styles();
  window.GPVariants={rows,active,selection,choose,key,resolve,picker,mountEditor};
})();
