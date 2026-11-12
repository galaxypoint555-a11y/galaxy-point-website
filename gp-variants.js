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
    return {p,variant,key:k,price:variant?variant.price:p.price,stock:variant?variant.stock:p.stock,description:variant?(variant.storage+' · '+variant.color):p.details};
  }
  function picker(p){
    const list=rows(p);if(!list.length)return '';
    const here=selection(p),storages=[...new Set(list.map(x=>x.storage))],colors=[...new Set(list.map(x=>x.color))];
    const storageOptions=storages.map(s=>{const inStock=list.some(x=>x.storage===s&&x.stock>0);return '<button type="button" class="gp-vopt '+(here.storage===s?'picked ':'')+(!inStock?'unavailable':'')+'" data-v-storage="'+esc(s)+'" aria-pressed="'+(here.storage===s)+'">'+esc(s)+'</button>'}).join('');
    const colorOptions=colors.map(c=>{const available=list.some(x=>x.storage===here.storage&&x.color===c&&x.stock>0);const exists=list.some(x=>x.storage===here.storage&&x.color===c);const current=here.color===c;return '<button type="button" class="gp-vopt gp-copt '+(current?'picked ':'')+(!exists||!available?'unavailable':'')+'" data-v-color="'+esc(c)+'" aria-pressed="'+current+'" '+(!exists?'disabled':'')+'>'+esc(c)+'</button>'}).join('');
    return '<div class="gp-vpick" aria-label="Select phone variant and colour"><div class="gp-vlabel">Storage: <strong>'+esc(here.storage)+'</strong></div><div class="gp-vrow">'+storageOptions+'</div><div class="gp-vlabel">Colour: <strong>'+esc(here.color)+'</strong></div><div class="gp-vrow">'+colorOptions+'</div></div>';
  }
  function mountEditor(form,initial){
    const host=form.querySelector('#gp-variant-manager');if(!host)return;
    let list=sane(initial.variantOptions||[]);
    host.innerHTML='<label class="toggle"><input type="checkbox" id="gp-v-enabled" '+(list.length?'checked':'')+'> Enable storage & colour combinations for this product</label><p class="field-tip">Enter storage and colours separated by commas, then generate the available combinations. Set an individual selling price and stock for each row. Nothing is generated automatically for other products.</p><div id="gp-v-panel" '+(list.length?'':'hidden')+'><div class="field-grid"><div class="field"><label>Storage values (comma-separated)</label><input type="text" id="gp-v-storages" placeholder="128GB, 256GB"></div><div class="field"><label>Colours (comma-separated)</label><input type="text" id="gp-v-colors" placeholder="Blue, Black, White"></div></div><div style="margin:12px 0"><button class="btn sm" type="button" id="gp-v-generate">+ Generate / Add Combinations</button></div><div style="overflow-x:auto"><table class="gp-vtable"><thead><tr><th>Storage</th><th>Colour</th><th>Our Price ₹</th><th>Stock</th><th></th></tr></thead><tbody id="gp-v-list"></tbody></table></div><p class="field-tip" id="gp-v-summary"></p></div>';
    const enabled=host.querySelector('#gp-v-enabled'),panel=host.querySelector('#gp-v-panel'),body=host.querySelector('#gp-v-list');
    const price=form.elements.price,stock=form.elements.stock;
    const stor=host.querySelector('#gp-v-storages'),cols=host.querySelector('#gp-v-colors');
    stor.value=[...new Set(list.map(x=>x.storage))].join(', ');cols.value=[...new Set(list.map(x=>x.color))].join(', ');
    function syncBase(){
      const on=enabled.checked;
      price.readOnly=on;stock.readOnly=on;price.title=on?'Calculated automatically from variants':'';stock.title=on?'Total stock calculated from variants':'';
      if(!on)return;
      const good=list.filter(x=>x.storage&&x.color&&Number(x.price)>0);
      if(good.length){price.value=Math.min(...good.map(x=>Number(x.price)));stock.value=good.reduce((s,x)=>s+(Number(x.stock)||0),0)}
      host.querySelector('#gp-v-summary').textContent=good.length+' combinations · Total stock: '+good.reduce((s,x)=>s+(Number(x.stock)||0),0)+' · Starting price: ₹'+(good.length?Math.min(...good.map(x=>Number(x.price))).toLocaleString('en-IN'):'0');
    }
    function render(){
      panel.hidden=!enabled.checked;
      body.innerHTML=list.map((x,i)=>'<tr><td>'+esc(x.storage)+'</td><td>'+esc(x.color)+'</td><td><input type="number" min="1" step="1" data-v-price="'+i+'" value="'+esc(x.price||'')+'" required></td><td><input type="number" min="0" step="1" data-v-stock="'+i+'" value="'+esc(x.stock)+'" required></td><td><button type="button" class="btn sm danger" data-v-remove="'+i+'" aria-label="Remove combination">×</button></td></tr>').join('')||'<tr><td colspan="5">No combinations yet. Enter storage and colours and click Generate.</td></tr>';
      syncBase();
    }
    enabled.addEventListener('change',render);
    host.querySelector('#gp-v-generate').addEventListener('click',()=>{
      const storage=stor.value.split(',').map(clean).filter(Boolean);
      const colors=cols.value.split(',').map(clean).filter(Boolean);
      if(!storage.length||!colors.length){alert('Enter at least one storage and one colour.');return}
      if(new Set(storage).size*new Set(colors).size>200){alert('Maximum 200 combinations per product.');return}
      for(const s of [...new Set(storage)])for(const c of [...new Set(colors)]){
        if(!list.some(x=>x.storage===s&&x.color===c))list.push({storage:s,color:c,price:Number(price.value)||0,stock:0});
      }
      render();
    });
    body.addEventListener('input',e=>{const input=e.target;if(input.dataset.vPrice!=null){list[Number(input.dataset.vPrice)].price=Number(input.value)||0;syncBase()}if(input.dataset.vStock!=null){list[Number(input.dataset.vStock)].stock=Number(input.value)||0;syncBase()}});
    body.addEventListener('click',e=>{const b=e.target.closest('[data-v-remove]');if(!b)return;list.splice(Number(b.dataset.vRemove),1);render()});
    form.gpReadVariantOptions=()=>{
      if(!enabled.checked)return [];
      if(!list.length)throw Error('Generate at least one storage and colour combination.');
      if(list.some(x=>!x.storage||!x.color||!Number.isInteger(x.price)||x.price<=0||!Number.isInteger(x.stock)||x.stock<0))throw Error('Every variant requires a valid price above ₹0 and stock of 0 or more.');
      if(new Set(list.map(x=>x.storage.toLowerCase()+'|'+x.color.toLowerCase())).size!==list.length)throw Error('Duplicate storage and colour combination.');
      return sane(list);
    };
    render();
  }
  function styles(){
    if(document.getElementById('gp-variant-styles'))return;
    const st=document.createElement('style');st.id='gp-variant-styles';st.textContent='.gp-vpick{margin:18px 0 16px}.gp-vlabel{font-weight:650;font-size:14px;margin:13px 0 9px}.gp-vrow{display:flex;flex-wrap:wrap;gap:9px}.gp-vopt{border:1px solid #d5d5d5;border-radius:9px;padding:11px 15px;background:#fff;color:#2d3540;font-weight:600;min-height:43px}.gp-vopt.picked{background:#effaf6;border-color:#4bbbad;color:#147969;box-shadow:0 0 0 1px #4bbbad}.gp-vopt.unavailable{color:#999;background:#f8f8f8;text-decoration:line-through}.gp-vopt:disabled{opacity:.5;cursor:not-allowed}.gp-vtable{width:100%;border-collapse:collapse;font-size:12px;min-width:460px}.gp-vtable th,.gp-vtable td{padding:9px;border-bottom:1px solid #e7e9ee;text-align:left}.gp-vtable input{width:100%;min-width:85px;padding:9px;border:1px solid #dde2eb;border-radius:7px}.gp-vtable th{font-weight:750}#gp-v-panel[hidden]{display:none!important}';document.head.appendChild(st);
  }
  styles();
  window.GPVariants={rows,active,selection,choose,key,resolve,picker,mountEditor};
})();
