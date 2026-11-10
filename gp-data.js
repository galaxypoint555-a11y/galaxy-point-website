/* Galaxy Point shared Supabase data access. Public key only; RLS enforces permissions. */
(function(){
  'use strict';
  const cfg=window.GP_CONFIG||{};
  const base=String(cfg.supabaseUrl||'').replace(/\/$/,'');
  const key=cfg.supabaseAnonKey;
  if(!base||!key){console.error('Galaxy Point: Supabase configuration missing');return;}
  const sessionKey='gp_staff_session';
  const session=()=>{try{return JSON.parse(sessionStorage.getItem(sessionKey)||'null')}catch{return null}};
  async function request(table,{method='GET',query='',body,staff=false}={}){
    const token=staff?session()?.access_token:null;
    if(staff&&!token)throw Error('Staff login required');
    const response=await fetch(base+'/rest/v1/'+table+(query?'?'+query:''),{
      method,headers:{apikey:key,Authorization:'Bearer '+(token||key),'Content-Type':'application/json',Prefer:method==='GET'?'':'return=representation'},
      ...(body===undefined?{}:{body:JSON.stringify(body)})
    });
    if(!response.ok){let err=await response.text();throw Error('Database request failed ('+response.status+'): '+err.slice(0,250))}
    return response.status===204?[]:response.json();
  }
  const products=()=>request('products',{query:'select=*&is_published=eq.true&order=created_at.desc'});
  const banners=()=>request('banners',{query:'select=*&is_active=eq.true&order=position.asc'});
  const settings=()=>request('website_settings',{query:'select=key,value'});
  const staffProducts=()=>request('products',{query:'select=*&order=created_at.desc',staff:true});
  const orders=()=>request('orders',{query:'select=*&order=created_at.desc',staff:true});
  const customers=()=>request('customers',{query:'select=*',staff:true});
  const orderItems=()=>request('order_items',{query:'select=*',staff:true});
  const saveProduct=(product)=>{const {id,...fields}=product;return request('products',{method:id?'PATCH':'POST',query:id?'id=eq.'+encodeURIComponent(id):'',body:fields,staff:true})};
  const saveBanner=(banner)=>{const {id,...fields}=banner;return request('banners',{method:id?'PATCH':'POST',query:id?'id=eq.'+encodeURIComponent(id):'',body:fields,staff:true})};
  const saveSetting=(key,value)=>request('website_settings',{method:'POST',query:'on_conflict=key',body:{key,value},staff:true});
  async function login(email,password){
    const response=await fetch(base+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:JSON.stringify({email,password})});
    const data=await response.json();if(!response.ok)throw Error(data.error_description||data.msg||data.error||'Login failed');
    sessionStorage.setItem(sessionKey,JSON.stringify(data));return data;
  }
  function logout(){sessionStorage.removeItem(sessionKey)}
  window.GP_DATA={products,banners,settings,staffProducts,orders,customers,orderItems,saveProduct,saveBanner,saveSetting,login,logout,session};
})();