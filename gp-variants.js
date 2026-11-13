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
  const conditions=p=>Object.entries(conditionPrices(p)).filter(([name,v])=>name==='Best Value'&&v>0);
  function condition(p){const available=conditions(p);if(!available.length)return null;const saved=selectedCondition.get(String(p.id));return available.find(([name])=>name===saved)?.[0]||available[0][0]}
  function chooseCondition(p,name){if(conditions(p).some(([key])=>key===name))selectedCondition.set(String(p.id),name)}
  function displayPrice(p,variant){const name=condition(p);return name?conditionPrices(p)[name]:variant?variant.price:p.price}
  function conditionPicker(p){const options=conditions(p);if(!options.length)return '';const chosen=condition(p);return '<div class="gp-condition-choice"><div class="gp-vlabel">Condition <button type="button" class="gp-condition-learn" data-condition-learn="1">Learn More</button></div><div class="gp-condition-options">'+options.map(([name,price])=>'<button type="button" class="gp-condition-option '+(chosen===name?'picked':'')+'" data-condition-pick="'+name+'" aria-pressed="'+(chosen===name)+'"><strong>'+name+'</strong><span>₹'+price.toLocaleString('en-IN')+'</span></button>').join('')+'</div><p class="gp-condition-short">'+('Good Condition · Condition: Just Like New')+'</p></div>'}
  function conditionDetails(){return '<div class="gp-condition-guide"><h3>Best Value — Condition Guide</h3><p><strong>Good Condition</strong></p><p><strong>Condition: Just Like New</strong></p><p>Check the actual product photos and individual device details before purchase.</p></div>'}
