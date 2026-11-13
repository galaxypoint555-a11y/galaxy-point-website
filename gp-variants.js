/* Galaxy Point optional product-wise variant combinations. */
(function(){
  'use strict';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
  const clean=s=>String(s||'').trim().replace(/\s+/g,' ').slice(0,65);
  const sane=r=>Array.isArray(r)?r.filter(x=>x&&typeof x==='object').map(x=>({storage:clean(x.storage),color:clean(x.color),price:Math.max(0,Math.floor(Number(x.price)||0)),marketPrice:Math.max(0,Math.floor(Number(x.marketPrice??x.market_price)||0)),stock:Math.max(0,Math.floor(Number(x.stock)||0)),batteryHealth:(x.batteryHealth===null||x.batteryHealth===undefined||x.batteryHealth==='')?'':String(x.batteryHealth).replace(/[^0-9]/g,'').slice(0,3),cycleCount:(x.cycleCount===null||x.cycleCount===undefined||x.cycleCount==='')?'':String(x.cycleCount).replace(/[^0-9]/g,'').slice(0,6)})).filter(x=>x.storage&&x.color&&x.price>0).slice(0,200):[];
  const rows=p=>sane(p?.variantOptions||p?.variant_options);
  const selected=new Map();
  const selectedCondition=new Map();
  const conditionPrices=p=>({'Best Value':Math.max(0,Math.floor(Number(p?.conditionPrices?.bestValue)||0)),Fair:Math.max(0,Math.floor(Number(p?.conditionPrices?.fair)||0)),Superb:Math.max(0,Math.floor(Number(p?.conditionPrices?.superb)||0))});
  const conditions=p=>Object.entries(conditionPrices(p)).filter(([,v])=>v>0);
  function condition(p){const available=conditions(p);if(!available.length)return null;const saved=selectedCondition.get(String(p.id));return available.find(([name])=>name===saved)?.[0]||available[0][0]}
  function chooseCondition(p,name){if(conditions(p).some(([key])=>key===name))selectedCondition.set(String(p.id),name)}
  function displayPrice(p,variant){const name=condition(p);return name?conditionPrices(p)[name]:variant?variant.price:p.price}
  function conditionPicker(p){const options=conditions(p);if(!options.length)return '';const chosen=condition(p);return '<div class="gp-condition-choice"><div class="gp-vlabel">Condition <button type="button" class="gp-condition-learn" data-condition-learn="1">Learn More</button></div><div class="gp-condition-options">'+options.map(([name,price])=>'<button type="button" class="gp-condition-option '+(chosen===name?'picked':'')+'" data-condition-pick="'+name+'" aria-pressed="'+(chosen===name)+'"><strong>'+name+'</strong><span>₹'+price.toLocaleString('en-IN')+'</span></button>').join('')+'</div><p class="gp-condition-short">'+(chosen==='Best Value'?'Multiple visible scratches and noticeable signs of previous use.':chosen==='Fair'?'Good condition with minor scratches or small dents.':'Excellent cosmetic condition with no visible scratches or dents. Looks like new.')+'</p></div>'}
  function conditionDetails(){return '<div class="gp-condition-guide"><h3>Our condition guide</h3><p><strong>Best Value</strong> — Multiple visible scratches and major signs of usage. A budget-friendly choice for customers who prioritise price over appearance.</p><p><strong>Fair</strong> — Good cosmetic condition with light scratches or small dents.</p><p><strong>Superb</strong> — Excellent cosmetic appearance, no visible scratches or dents; looks like new.</p><p>Condition describes appearance, not a manufacturer warranty. Please check the individual device details.</p></div>'}

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
    if(!list.length)return String(p.id)+(condition(p)?'@@condition@@'+encodeURIComponent(condition(p)):'');
    const picked=defaultForCard?(list.find(x=>x.stock>0)||list[0]):selection(p);
    return String(p.id)+'@@'+encodeURIComponent(picked.storage)+'@@'+encodeURIComponent(picked.color)+(condition(p)?'@@'+encodeURIComponent(condition(p)):'');
  }
  function resolve(items,k){
    const parts=String(k).split('@@'),p=items.find(x=>String(x.id)===parts[0]);if(!p)return null;
    const options=rows(p);
    const hasVariant=parts.length>=3&&parts[1]!=='condition';const variant=hasVariant?options.find(x=>x.storage===decodeURIComponent(parts[1])&&x.color===decodeURIComponent(parts[2])):null;
    if(hasVariant&&!variant)return null;const selectedName=hasVariant&&parts[3]?decodeURIComponent(parts[3]):parts[1]==='condition'&&parts[2]?decodeURIComponent(parts[2]):null;const tierPrice=selectedName?conditionPrices(p)[selectedName]:0;if(selectedName&&!tierPrice)return null;
    return {p,variant,key:k,price:tierPrice|| (variant?variant.price:p.price),stock:variant?variant.stock:p.stock,description:(variant?(variant.storage+' · '+variant.color):p.details)+(selectedName?' · '+selectedName:'')};
  }

  const palette=[['Black','#17191d'],['White','#f5f5f3'],['Silver','#c8cdd1'],['Blue','#274e86'],['Pink','#e8b5c0'],['Gold','#d8c29a'],['Purple','#9584ad'],['Green','#8cae9f'],['Red','#c64c50'],['Grey','#858b92'],['Graphite','#505056'],['Natural Titanium','#b4a99a'],['Desert Titanium','#b28e75'],['Midnight','#242e3c'],['Starlight','#eee8dc'],['Yellow','#f0dc72'],['Orange','#ed864c'],['Teal','#6aa7a6'],['Cream','#f1e6d6'],['Space Black','#303035'],['Sierra Blue','#9eb7c9'],['Pacific Blue','#536e84'],['Rose Gold','#d9b0a4'],['Coral','#ef8f83'],['Mint','#b5d9c7'],['Lavender','#c3b7e5'],['Titanium Black','#3e4041'],['Titanium White','#e7e4de'],['Titanium Blue','#64748b'],['Phantom Black','#23252c'],['Burgundy','#774352'],['Cream White','#f5f0e8'],['Light Blue','#a9cce9'],['Dark Green','#375f50']];
  const colorHex=name=>palette.find(x=>x[0].toLowerCase()===String(name).toLowerCase())?.[1]||'#adb5bd';
  function picker(p){
    const list=rows(p);if(!list.length)return '';
    const here=selection(p),storages=[...new Set(list.map(x=>x.storage))],colors=[...new Set(list.map(x=>x.color))];
    const storageOptions=storages.map(s=>{const inStock=list.some(x=>x.storage===s&&x.stock>0);return '<button type="button" class="gp-vopt '+(here.storage===s?'picked ':'')+(!inStock?'unavailable':'')+'" data-v-storage="'+esc(s)+'" aria-pressed="'+(here.storage===s)+'">'+esc(s)+'</button>'}).join('');
    const colorOptions=colors.map(c=>{const exists=list.some(x=>x.storage===here.storage&&x.color===c),available=list.some(x=>x.storage===here.storage&&x.color===c&&x.stock>0),current=here.color===c;return '<button type="button" class="gp-color-swatch '+(current?'picked ':'')+(!available?'unavailable':'')+'" data-v-color="'+esc(c)+'" aria-label="'+esc(c)+(available?'':' unavailable')+'" title="'+esc(c)+'" aria-pressed="'+current+'" '+(!exists||!available?'disabled':'')+'><span class="gp-swatch-fill" style="background:'+colorHex(c)+'"></span>'+(current?'<span class="gp-swatch-tick">✓</span>':'')+'</button>'}).join('');
    const health=here.batteryHealth!==''&&Number(here.batteryHealth)>=1&&Number(here.batteryHealth)<=100?Number(here.batteryHealth):null;
    const healthCard=health===null?'':'<div class="gp-v-battery-inline"><span>🔋 Battery Health</span><strong>'+health+'%</strong></div>';
    return '<div class="gp-vpick" aria-label="Select phone variant and colour"><div class="gp-vlabel">Storage: <strong>'+esc(here.storage)+'</strong></div><div class="gp-vrow">'+storageOptions+'</div></div>'+healthCard+'</div><div class="gp-vlabel">Colour: <strong>'+esc(here.color)+'</strong></div><div class="gp-vrow gp-color-row">'+colorOptions+'</div></div>';
  }
  function batteryInfo(p){const v=selection(p);if(!v)return '';const health=Number(v.batteryHealth),cycles=Number(v.cycleCount);const hasHealth=v.batteryHealth!==''&&health>=1&&health<=100,hasCycles=v.cycleCount!==''&&cycles>=0;return !hasHealth&&!hasCycles?'':'<div class="gp-v-battery-info">'+(hasHealth?'<span class="gp-v-battery-chip">Battery Health <strong>'+health+'%</strong></span>':'')+(hasCycles?'<span class="gp-v-battery-chip">Cycle Count <strong>'+cycles+'</strong></span>':'')+'</div>'}
  function mountEditor(form,initial){
    const host=form.querySelector('#gp-variant-manager');if(!host)return;
    const old=sane(initial.variantOptions||[]);
    const selectedStorages=new Set(old.map(x=>x.storage)),selectedColors=new Set(old.map(x=>x.color));
    const allStorages=[...new Set(['64GB','128GB','256GB','512GB','1TB','2TB',...selectedStorages])];
    const allColors=[...new Set([...palette.map(x=>x[0]),...selectedColors])];
    const storageData={};for(const s of allStorages){const entries=old.filter(x=>x.storage===s);storageData[s]={price:entries[0]?.price||0,marketPrice:entries[0]?.marketPrice||0,stock:Math.max(0,...entries.map(x=>x.stock)),batteryHealth:entries[0]?.batteryHealth??'',cycleCount:entries[0]?.cycleCount??''}}
    host.innerHTML='<p class="field-tip">Choose the available storage sizes, set each price, then select the phone colours. Only selected colours will appear on the public product page.</p><div class="gp-v-manager-block"><label class="gp-v-editor-label">STORAGE · MARKET PRICE · GP PRICE · DISCOUNT · STOCK</label><div class="gp-v-storage-grid" id="gp-v-storage-grid"></div><div class="gp-v-custom-line"><input type="text" id="gp-v-custom-storage" placeholder="Custom storage, e.g. 8GB / 128GB" maxlength="65"><button type="button" class="btn sm" id="gp-v-add-storage">+ Add Storage</button></div></div><div class="gp-v-manager-block"><label class="gp-v-editor-label">SELECT AVAILABLE PHONE COLOURS</label><div class="gp-v-color-grid" id="gp-v-color-grid"></div><div class="gp-v-custom-line"><input type="text" id="gp-v-custom-color" placeholder="Custom colour name" maxlength="65"><button type="button" class="btn sm" id="gp-v-add-color">+ Add Colour</button></div></div><p class="field-tip" id="gp-v-summary"></p>';
    const price=form.elements.price,stock=form.elements.stock,storageHost=host.querySelector('#gp-v-storage-grid'),colorHost=host.querySelector('#gp-v-color-grid');
    function sync(){
      const active=selectedStorages.size>0&&selectedColors.size>0;
      price.readOnly=active;stock.readOnly=active;const market=form.elements.marketPrice;if(market)market.readOnly=active;
      if(active){const vals=[...selectedStorages].map(s=>storageData[s]).filter(x=>x?.price>0);if(vals.length){price.value=Math.min(...vals.map(x=>x.price));if(market){const first=[...selectedStorages].map(s=>storageData[s]).find(x=>x?.price===Number(price.value));market.value=first?.marketPrice||'';}stock.value=[...selectedStorages].reduce((n,s)=>n+(storageData[s]?.stock||0)*selectedColors.size,0)}}
      host.querySelector('#gp-v-summary').textContent=selectedStorages.size+' storage sizes · '+selectedColors.size+' colours selected · Only selected options appear publicly';
    }
    function discount(s){const d=storageData[s];return d?.marketPrice>d?.price&&d.price>0?'↓ '+Math.round((d.marketPrice-d.price)/d.marketPrice*100)+'% OFF · Save ₹'+(d.marketPrice-d.price).toLocaleString('en-IN'):'No discount';}
    function render(){
      storageHost.innerHTML=allStorages.map(s=>'<label class="gp-v-storage-card '+(selectedStorages.has(s)?'selected':'')+'"><input type="checkbox" data-storage-toggle="'+esc(s)+'" '+(selectedStorages.has(s)?'checked':'')+'><strong>'+esc(s)+'</strong></label>').join('');
      let unitsHost=host.querySelector('#gp-v-units');
      if(!unitsHost){unitsHost=document.createElement('div');unitsHost.id='gp-v-units';storageHost.closest('.gp-v-manager-block').after(unitsHost)}
      unitsHost.innerHTML='<div class="gp-v-manager-block"><label class="gp-v-editor-label">PRE-OWNED UNITS</label><div style="display:grid;gap:7px">'+[...selectedStorages].map(s=>{const d=storageData[s]||(storageData[s]={price:0,marketPrice:0,stock:0,batteryHealth:'',cycleCount:''});return '<div class="gp-v-unit-group" style="display:grid;grid-template-columns:80px minmax(74px,.75fr) minmax(74px,.75fr) minmax(66px,.6fr) minmax(100px,1fr) minmax(100px,1fr);gap:8px;align-items:end;padding:9px 11px;border:1px solid #e6eaf3;border-radius:10px;background:#fff;overflow-x:auto"><strong style="font-size:13px;align-self:center;white-space:nowrap">'+esc(s)+'</strong>'+[['Battery %','storageBattery',d.batteryHealth],['Cycle Count','storageCycles',d.cycleCount],['Stock','storageStock',d.stock],['Market ₹','storageMarket',d.marketPrice],['GP Price ₹','storagePrice',d.price]].map(([label,key,val])=>'<label style="font-size:10px;font-weight:600;color:#68758b;white-space:nowrap">'+label+'<input type="number" min="0" '+(key==='storageBattery'?'max="100" ':'')+'data-'+key.replace(/[A-Z]/g,m=>'-'+m.toLowerCase())+'="'+esc(s)+'" value="'+esc(String(val??''))+'" style="display:block;width:100%;min-width:0;height:33px;padding:5px 7px;margin-top:3px;border:1px solid #dfe5ef;border-radius:7px;font-size:12px"></label>').join('')+'<div data-discount-for="'+esc(s)+'" style="grid-column:1/-1;font-size:10px;color:#17856c;line-height:1.2">'+esc(discount(s))+'</div></div>'}).join('')+'</div></div>';
      colorHost.innerHTML=allColors.map(c=>'<label class="gp-v-color-item '+(selectedColors.has(c)?'selected':'')+'"><input type="checkbox" data-color-toggle="'+esc(c)+'" '+(selectedColors.has(c)?'checked':'')+'><span class="gp-v-color-dot" style="background:'+colorHex(c)+'"></span><span>'+esc(c)+'</span></label>').join('');
      sync();
    }
    host.addEventListener('change',e=>{const t=e.target;if(t.dataset.storageToggle!==undefined){t.checked?selectedStorages.add(t.dataset.storageToggle):selectedStorages.delete(t.dataset.storageToggle);render()}else if(t.dataset.colorToggle!==undefined){t.checked?selectedColors.add(t.dataset.colorToggle):selectedColors.delete(t.dataset.colorToggle);render()}});
    function renderDiscounts(){host.querySelectorAll('[data-discount-for]').forEach(el=>el.textContent=discount(el.dataset.discountFor));}
    host.addEventListener('input',e=>{const t=e.target;if(t.dataset.storagePrice!==undefined){storageData[t.dataset.storagePrice].price=Number(t.value)||0;sync();renderDiscounts()}else if(t.dataset.storageMarket!==undefined){storageData[t.dataset.storageMarket].marketPrice=Math.max(0,Math.floor(Number(t.value)||0));sync();renderDiscounts()}else if(t.dataset.storageStock!==undefined){storageData[t.dataset.storageStock].stock=Math.max(0,Math.floor(Number(t.value)||0));sync()}else if(t.dataset.storageBattery!==undefined){storageData[t.dataset.storageBattery].batteryHealth=t.value}else if(t.dataset.storageCycles!==undefined){storageData[t.dataset.storageCycles].cycleCount=t.value}});
    host.querySelector('#gp-v-add-storage').addEventListener('click',()=>{const t=host.querySelector('#gp-v-custom-storage'),s=clean(t.value);if(!s)return;if(!allStorages.includes(s)){allStorages.push(s);storageData[s]={price:0,marketPrice:0,stock:0,batteryHealth:'',cycleCount:''}}selectedStorages.add(s);t.value='';render()});
    host.querySelector('#gp-v-add-color').addEventListener('click',()=>{const t=host.querySelector('#gp-v-custom-color'),s=clean(t.value);if(!s)return;if(!allColors.includes(s))allColors.push(s);selectedColors.add(s);t.value='';render()});
    form.gpReadVariantOptions=()=>{
      if(!selectedStorages.size&&!selectedColors.size)return [];
      if(!selectedStorages.size||!selectedColors.size)throw Error('Select at least one storage size and one colour.');
      const options=[];for(const s of selectedStorages){const d=storageData[s];if(!Number.isInteger(d.price)||d.price<=0)throw Error('Enter a valid price for '+s);if(!Number.isInteger(d.stock)||d.stock<0)throw Error('Enter valid stock for '+s);if(d.batteryHealth!==''&&(!Number.isInteger(Number(d.batteryHealth))||Number(d.batteryHealth)<1||Number(d.batteryHealth)>100))throw Error('Battery Health must be 1–100% for '+s);if(d.cycleCount!==''&&(!Number.isInteger(Number(d.cycleCount))||Number(d.cycleCount)<0))throw Error('Cycle Count must be zero or higher for '+s);const cs=[...selectedColors];for(let i=0;i<cs.length;i++)options.push({storage:s,color:cs[i],price:d.price,marketPrice:d.marketPrice||0,stock:d.stock,batteryHealth:d.batteryHealth,cycleCount:d.cycleCount})}
      if(options.length>200)throw Error('Maximum 200 combinations.');return sane(options);
    };
    render();
  }
  function styles(){
    if(document.getElementById('gp-variant-styles'))return;
    const st=document.createElement('style');st.id='gp-variant-styles';st.textContent='.gp-vpick{margin:22px 0}.gp-vlabel{font-weight:700;font-size:17px;margin:17px 0 12px}.gp-vrow{display:flex;flex-wrap:wrap;gap:10px}.gp-vopt{border:1px solid #d4d6d9;border-radius:12px;padding:12px 16px;background:#fff;color:#424b55;font-weight:650;min-height:46px}.gp-vopt.picked{background:#e9f7f5;border-color:#6bc8bd;color:#238b80;box-shadow:0 0 0 1px #6bc8bd}.gp-vopt.unavailable{opacity:.45;text-decoration:line-through}.gp-color-row{gap:15px}.gp-color-swatch{width:47px;height:47px;border-radius:50%;border:2px solid transparent;background:transparent;padding:4px;position:relative;display:inline-flex;align-items:center;justify-content:center;cursor:pointer}.gp-color-swatch.picked{border-color:#62bfb5}.gp-color-swatch.unavailable{opacity:.38}.gp-swatch-fill{width:36px;height:36px;border-radius:50%;border:2px solid #aaa;display:block}.gp-swatch-tick{position:absolute;color:#fff;font-size:24px;font-weight:800;text-shadow:0 1px 4px #222}.gp-v-manager-block{margin:17px 0 24px}.gp-v-editor-label{display:block;font-weight:800;letter-spacing:1.1px;font-size:12px;margin-bottom:12px}.gp-v-storage-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:10px}.gp-v-storage-card{padding:12px;border:1px solid #e1e5ed;border-radius:13px;background:#fff}.gp-v-storage-card.selected{border-color:#75c8bf;background:#f3fbf9}.gp-v-storage-head{display:flex;gap:8px;align-items:center}.gp-v-price-stock{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:9px}.gp-v-variant-discount{margin-top:9px;font-size:12px;font-weight:700;color:#23806a}.gp-v-price-stock label{font-size:11px;min-width:0;flex:1}.gp-v-price-stock input{width:100%;padding:8px 5px;border:1px solid #dce2e9;border-radius:7px}.gp-v-color-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(112px,1fr));gap:9px}.gp-v-color-item{border:1px solid #e2e6ec;border-radius:12px;display:flex;align-items:center;gap:7px;padding:9px 7px;cursor:pointer;font-size:12px;background:white}.gp-v-color-item.selected{border-color:#61bfb3;background:#eefaf7}.gp-v-color-dot{width:25px;height:25px;border-radius:50%;border:1px solid #aaa;flex-shrink:0}.gp-v-custom-line{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}.gp-v-custom-line input{min-width:170px;flex:1;padding:10px;border:1px solid #dce2e9;border-radius:8px} .gp-v-battery-fields{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0 3px 27px}.gp-v-battery-fields label{font-size:11px;font-weight:650;max-width:135px;flex:1;min-width:90px}.gp-v-battery-fields input{width:100%;box-sizing:border-box;border:1px solid #dce2e9;border-radius:7px;padding:7px;margin-top:4px;font-size:13px}.gp-v-battery-info{display:flex;flex-wrap:wrap;gap:9px;margin:12px 0 17px}.gp-v-battery-chip{display:inline-flex;align-items:center;gap:7px;border:1px solid #dce6e3;background:#f6faf8;border-radius:9px;padding:9px 12px;font-size:13px;color:#375b50}.gp-v-battery-chip strong{color:#1f6752} .gp-condition-choice{margin:24px 0}.gp-condition-learn{border:0;background:none;color:#50a9a0;font-size:14px;margin-left:8px;cursor:pointer}.gp-condition-options{display:flex;gap:12px;flex-wrap:wrap}.gp-condition-option{background:white;border:1px solid #ddd;border-radius:12px;padding:14px 22px;min-width:140px;display:flex;flex-direction:column;gap:5px;color:#555}.gp-condition-option.picked{border-color:#65c4b7;background:#ecf7f5;color:#247f77}.gp-condition-short{font-size:13px;color:#6b6864;line-height:1.6}.gp-condition-guide{padding:8px 0;line-height:1.7}.gp-condition-guide h3{font-size:19px;margin-bottom:12px}';document.head.appendChild(st);
  }
  styles();
  // Compatibility with the product page's per-unit pricing and stock API.
  // Keep the product detail page functional even when no individual units are defined.
  function unit(p){const units=p?.preOwnedUnits||p?.pre_owned_units||[];if(!Array.isArray(units)||!units.length)return null;const v=selection(p);return units.find(x=>String(x.storage)===String(v?.storage)&&String(x.color||'')===String(v?.color||''))||units.find(x=>String(x.storage)===String(v?.storage))||units[0]}
  function stock(p,v){return Number(v?.stock??p?.stock??0)||0}
  function marketPrice(p,v){return Number(v?.marketPrice??v?.market_price??p?.marketPrice??p?.market_price??0)||0}
  function unitPicker(p){return ''}
  function chooseUnit(p,index){}
  const gpBatteryStyle=document.createElement('style');gpBatteryStyle.textContent='.gp-v-storage-battery{display:grid;grid-template-columns:minmax(0,1fr) 165px;gap:14px;align-items:end}.gp-v-battery-inline{display:flex;flex-direction:column;justify-content:center;gap:7px;min-height:84px;border:1px solid #34435e;border-radius:13px;background:linear-gradient(145deg,#17243d,#293b5c);color:#dbe6f5;padding:12px 14px;box-shadow:0 6px 18px #17243d20;font-size:12px;font-weight:650}.gp-v-battery-inline strong{font-size:24px;line-height:1;color:white}@media(max-width:520px){.gp-v-storage-battery{grid-template-columns:minmax(0,1fr) 125px;gap:8px}.gp-v-battery-inline{padding:10px;min-height:75px;font-size:10px}.gp-v-battery-inline strong{font-size:21px}}';document.head.appendChild(gpBatteryStyle);
  window.GPVariants={rows,active,selection,choose,key,resolve,picker,batteryInfo,mountEditor,condition,chooseCondition,displayPrice,conditionPicker,conditionDetails,unit,stock,marketPrice,unitPicker,chooseUnit};
})();
