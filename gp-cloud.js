/* Shared Galaxy Point Supabase client for Website Editor and Boss Dashboard.
   Public configuration is loaded from gp-config.js. Never place server-side keys here. */
window.GPCloud=(()=>{
  const cfg=window.GP_CONFIG||{}, storageKey='gp_secure_staff_session_v1';
  let session=null,user=null,role=null;
  const configured=()=>Boolean(/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(cfg.supabaseUrl||'')&&cfg.supabaseAnonKey);
  function requireConfig(){if(!configured())throw Error('Cloud database is not configured. Set the Supabase Project URL and publishable key in gp-config.js.');}
  const base=()=>{requireConfig();return cfg.supabaseUrl.replace(/\/$/,'');};
  function headers(auth=true,extra={}){const h={apikey:cfg.supabaseAnonKey,'Content-Type':'application/json',...extra};h.Authorization='Bearer '+(auth&&session?.access_token?session.access_token:cfg.supabaseAnonKey);return h;}
  async function request(path,{method='GET',body,auth=true,extra={},raw=false}={}){
    const res=await fetch(base()+path,{method,headers:headers(auth,extra),body:body===undefined?undefined:(raw?body:JSON.stringify(body))});
    const txt=await res.text();let data=null;try{data=txt?JSON.parse(txt):null;}catch{data=txt;}
    if(!res.ok)throw Error(data?.message||data?.error_description||data?.msg||data?.error||'Request failed ('+res.status+')');
    return data;
  }
  function q(s){return encodeURIComponent(String(s));}
  function saveSession(s){session=s;if(s)sessionStorage.setItem(storageKey,JSON.stringify(s));else sessionStorage.removeItem(storageKey);}
  async function ensureSession(){
    if(!session){try{session=JSON.parse(sessionStorage.getItem(storageKey)||'null');}catch{}}
    if(!session?.access_token)return null;
    if(session.expires_at&&session.expires_at<=Math.floor(Date.now()/1000)+90){
      try{const renew=await request('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:session.refresh_token},auth:false});
        saveSession({...renew,expires_at:Math.floor(Date.now()/1000)+renew.expires_in});}
      catch{saveSession(null);user=null;role=null;return null;}
    }
    try{
      user=await request('/auth/v1/user');
      const rows=await request('/rest/v1/staff_profiles?select=user_id,role&user_id=eq.'+q(user.id));
      if(!Array.isArray(rows)||!rows.length)throw Error('Your account does not have Galaxy Point staff access.');
      role=rows[0].role;return {user,role};
    }catch(e){saveSession(null);user=null;role=null;throw e;}
  }
  async function signIn(email,password){
    requireConfig();
    const a=await request('/auth/v1/token?grant_type=password',{method:'POST',auth:false,body:{email,password}});
    saveSession({...a,expires_at:Math.floor(Date.now()/1000)+a.expires_in});
    return ensureSession();
  }
  async function signOut(){
    if(session)try{await request('/auth/v1/logout',{method:'POST'});}catch{}
    saveSession(null);role=null;user=null;
  }
  function active(){return Boolean(session?.access_token&&user&&role);}
  function guard(){if(!active())throw Error('Sign in with an authorized staff account first.');}
  async function products(){guard();const rows=await request('/rest/v1/products?select=*&order=created_at.desc&limit=500');return rows.map(p=>({...p,name:p.title,price:p.price_inr,condition:p.condition||'Pre-owned',is_published:p.is_published??p.active??false}));}
  async function settings(){guard();const rows=await request('/rest/v1/website_settings?select=key,value');return Object.fromEntries(rows.map(x=>[x.key,x.value]));}
  async function saveSettings(fields){guard();return request('/rest/v1/website_settings?on_conflict=key',{method:'POST',body:Object.entries(fields).map(([key,value])=>({key,value})),extra:{Prefer:'resolution=merge-duplicates,return=minimal'}});}
  async function upsertProduct(fields,id){
    guard();
    const category=String(fields.category||'').toLowerCase(); const title=String(fields.title||'').toLowerCase(); const brand=fields.brand||(/iphone|ipad|macbook|apple watch/.test(category+' '+title)?'Apple':/samsung|galaxy/.test(category+' '+title)?'Samsung':/oneplus/.test(category+' '+title)?'OnePlus':/pixel|google/.test(category+' '+title)?'Google':/nothing/.test(category+' '+title)?'Nothing':/motorola|moto/.test(category+' '+title)?'Motorola':/vivo/.test(category+' '+title)?'Vivo':/oppo/.test(category+' '+title)?'Oppo':null); if(!brand)throw new Error('Brand is required. Please include a recognised brand in the product name.'); const data={title:fields.title,brand,category:fields.category,variant:fields.variant,description:fields.description,price_inr:fields.price_inr,stock:fields.stock,image_url:fields.image_url,is_published:fields.active,active:fields.active};
    if(id)return request('/rest/v1/products?id=eq.'+q(id),{method:'PATCH',body:data,extra:{Prefer:'return=minimal'}});
    const slug=(String(fields.title||'product').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,65)||'product')+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);
    return request('/rest/v1/products',{method:'POST',body:{...data,slug,condition:fields.condition||'Pre-owned'},extra:{Prefer:'return=minimal'}});
  }
  async function removeProduct(id){guard();return request('/rest/v1/products?id=eq.'+q(id),{method:'DELETE',extra:{Prefer:'return=minimal'}});}
  async function orders(){guard();return request('/rest/v1/orders?select=*,order_items(*)&payment_status=eq.Paid&order=created_at.desc&limit=500');}
  async function updateOrderStatus(id,status){guard();return request('/rest/v1/orders?id=eq.'+q(id),{method:'PATCH',body:{fulfillment_status:status},extra:{Prefer:'return=minimal'}});}
  async function upload(file,folder='catalog'){
    guard();if(!file||!file.size)throw Error('Choose an image or video first.');
    if(!['image/jpeg','image/png','image/webp','video/mp4','video/webm'].includes(file.type))throw Error('Upload JPG, PNG, WebP, MP4 or WebM only.');
    if(file.size>30*1024*1024)throw Error('File is larger than 30 MB. Please compress it before uploading.');
    if(!['catalog','banners','videos'].includes(folder))throw Error('Invalid media folder');
    const ext={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','video/mp4':'mp4','video/webm':'webm'}[file.type];
    const id=(crypto.randomUUID?crypto.randomUUID():Date.now()+'-'+Math.random().toString(36).slice(2));
    const path=folder+'/'+id+'.'+ext;
    const res=await fetch(base()+'/storage/v1/object/gp-site-media/'+path,{method:'POST',headers:{apikey:cfg.supabaseAnonKey,Authorization:'Bearer '+session.access_token,'Content-Type':file.type,'x-upsert':'false'},body:file});
    if(!res.ok){const d=await res.json().catch(()=>({}));throw Error(d.message||d.error||'Media upload failed. Check gp-site-media Storage bucket policies.');}
    return base()+'/storage/v1/object/public/gp-site-media/'+path;
  }
  function money(n){return '₹'+Number(n||0).toLocaleString('en-IN',{maximumFractionDigits:0});}
  function clean(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  return{cfg,configured,request,ensureSession,signIn,signOut,active,products,settings,saveSettings,upsertProduct,removeProduct,orders,updateOrderStatus,upload,money,clean,get user(){return user;},get role(){return role;}};
})();