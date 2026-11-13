(function(){
'use strict';
const KEY='gp_customer_auth_v1',menu=document.getElementById('menuPop');
if(!menu)return;
const home=menu.querySelector('[data-page="home"]');
if(!home)return;
home.removeAttribute('data-page');home.id='gp-account-menu';home.textContent='LOGIN / MY ACCOUNT';
const style=document.createElement('style');
style.textContent='#gp-account-menu{font-weight:700!important}.gp-account-overlay{position:fixed;inset:0;background:#0009;z-index:2147482000;display:flex;align-items:center;justify-content:center;padding:16px}.gp-account-card{background:#fff;color:#17283c;border-radius:18px;padding:28px 22px;width:min(100%,440px);max-height:90vh;overflow:auto;font-family:Arial,sans-serif;box-shadow:0 22px 65px #0004}.gp-account-card h2{font-size:25px;margin:0 0 10px}.gp-account-card p{line-height:1.55;color:#627184;font-size:14px}.gp-account-card label{display:block;font-size:13px;font-weight:700;margin:16px 0 6px}.gp-account-card input{box-sizing:border-box;width:100%;border:1px solid #ccd5e1;border-radius:10px;padding:14px;font-size:16px}.gp-account-card .gp-act{width:100%;padding:15px;background:#163d65;color:#fff;border:0;border-radius:10px;font-weight:700;margin-top:18px}.gp-account-card .gp-secondary{background:#f1f4f8;color:#163d65}.gp-account-card .gp-account-close{float:right;background:none;border:0;font-size:26px;cursor:pointer}.gp-account-card .gp-account-error{color:#b32e37;font-size:13px;min-height:18px}.gp-account-card .gp-account-data{padding:13px 0;border-bottom:1px solid #e6e9ed;overflow-wrap:anywhere}';
document.head.appendChild(style);
const cfg=window.GP_CONFIG||{};
const authUrl=(cfg.supabaseUrl||'').replace(/\/$/,'')+'/auth/v1/';
const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch(_){return null}};
const save=s=>{try{localStorage.setItem(KEY,JSON.stringify(s))}catch(_){}};
async function api(path,body,token){
 const res=await fetch(authUrl+path,{method:'POST',headers:{apikey:cfg.supabaseAnonKey,'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body)});
 const data=await res.json().catch(()=>({}));
 if(!res.ok)throw Error(data.msg||data.error_description||data.message||'Unable to complete request');
 return data;
}
async function session(){
 let s=read();if(!s?.refresh_token||!s.user)return null;
 if(s.expires_at&&s.expires_at>Date.now()/1000+90)return s;
 try{const d=await api('token?grant_type=refresh_token',{refresh_token:s.refresh_token});s={...d,expires_at:Math.floor(Date.now()/1000)+(d.expires_in||3600)};save(s);return s}
 catch(_){localStorage.removeItem(KEY);return null}
}
async function refreshMenu(){
 const s=await session();home.textContent=s?'MY ACCOUNT · '+(s.user.user_metadata?.full_name||s.user.email?.split('@')[0]||'CUSTOMER'):'LOGIN / MY ACCOUNT';
}
function close(){document.getElementById('gp-account-overlay')?.remove()}
function modal(html){
 close();const overlay=document.createElement('div');overlay.className='gp-account-overlay';overlay.id='gp-account-overlay';
 overlay.innerHTML='<div class="gp-account-card" role="dialog" aria-modal="true" aria-label="Galaxy Point account"><button class="gp-account-close" type="button" aria-label="Close">×</button>'+html+'</div>';
 document.body.appendChild(overlay);
 overlay.querySelector('.gp-account-close').onclick=close;
 overlay.addEventListener('click',e=>{if(e.target===overlay)close()});
 return overlay;
}
async function open(){
 const s=await session();if(s){
 const u=s.user,m=u.user_metadata||{};
 const node=modal('<h2>My Account</h2><p>Welcome to Galaxy Point</p><div class="gp-account-data"><b>Name</b><div id="gp-a-name"></div></div><div class="gp-account-data"><b>Mobile Number</b><div id="gp-a-phone"></div></div><button class="gp-act gp-secondary" id="gp-logout">LOG OUT</button>');
 node.querySelector('#gp-a-name').textContent=m.full_name||m.name||'Not provided';
 node.querySelector('#gp-a-phone').textContent=m.phone||u.phone||'Not provided';
 node.querySelector('#gp-logout').onclick=async()=>{try{await api('logout',{},s.access_token)}catch(_){}localStorage.removeItem(KEY);close();refreshMenu()};
 return;
 }
 const node=modal('<h2>Login to Galaxy Point</h2><p>Sign in using your email and password.</p><form id="gp-account-login"><div id="gp-signup-fields" hidden><label for="gp-login-name">Full Name</label><input id="gp-login-name" type="text" autocomplete="name" maxlength="120" placeholder="Your full name"><label for="gp-login-phone">Mobile Number</label><input id="gp-login-phone" type="tel" inputmode="numeric" autocomplete="tel-national" maxlength="10" placeholder="10-digit mobile number"></div><label for="gp-login-email">Email Address</label><input id="gp-login-email" type="email" autocomplete="email" required placeholder="you@example.com"><label for="gp-login-password">Password</label><input id="gp-login-password" type="password" autocomplete="current-password" minlength="6" required placeholder="Enter password"><p class="gp-account-error" role="alert" id="gp-login-error"></p><button class="gp-act" id="gp-login-submit" type="submit">LOGIN</button><button class="gp-act gp-secondary" id="gp-switch-mode" type="button">Create new account</button><button class="gp-act gp-secondary" id="gp-reset-password" type="button">Forgot password?</button></form>');
 const form=node.querySelector('form'),name=node.querySelector('#gp-login-name'),phone=node.querySelector('#gp-login-phone'),email=node.querySelector('#gp-login-email'),password=node.querySelector('#gp-login-password'),fields=node.querySelector('#gp-signup-fields'),err=node.querySelector('#gp-login-error'),btn=node.querySelector('#gp-login-submit'),switcher=node.querySelector('#gp-switch-mode');
 let signup=false;
 switcher.onclick=()=>{signup=!signup;fields.hidden=!signup;name.required=signup;phone.required=signup;password.autocomplete=signup?'new-password':'current-password';btn.textContent=signup?'CREATE ACCOUNT':'LOGIN';switcher.textContent=signup?'Already have an account? Login':'Create new account';err.textContent='';};
 node.querySelector('#gp-reset-password').onclick=async()=>{err.textContent='';if(!email.validity.valid){err.textContent='Enter your email address first.';email.focus();return}try{await api('recover',{email:email.value.trim().toLowerCase()});err.style.color='#236b43';err.textContent='Password reset link sent to your email. Please check your inbox.'}catch(ex){err.style.color='#b32e37';err.textContent=ex.message||'Could not send reset link.'}};
 form.onsubmit=async e=>{
 e.preventDefault();btn.disabled=true;err.style.color='#b32e37';err.textContent='';
 try{
 const address=email.value.trim().toLowerCase();
 let d;
 if(signup){
  if(name.value.trim().length<2)throw Error('Enter your full name.');
  if(!/^[0-9]{10}$/.test(phone.value.trim()))throw Error('Enter a valid 10-digit mobile number.');
  d=await api('signup',{email:address,password:password.value,data:{full_name:name.value.trim(),phone:phone.value.trim()}});
  if(!d.access_token){err.style.color='#236b43';err.textContent='Account created. Check your email if confirmation is required, then log in.';signup=false;fields.hidden=true;name.required=false;phone.required=false;btn.textContent='LOGIN';switcher.textContent='Create new account';return}
 }else{
  d=await api('token?grant_type=password',{email:address,password:password.value});
 }
 if(!d.access_token||!d.user)throw Error('Unable to log in. Please check your details.');
 save({...d,expires_at:Math.floor(Date.now()/1000)+(d.expires_in||3600)});
 close();await refreshMenu();await open();
 }catch(ex){err.textContent=ex.message||'Please try again.'}
 finally{btn.disabled=false}
 };

}
home.addEventListener('click',e=>{e.stopPropagation();document.getElementById('menuPop')?.classList.remove('visible');document.getElementById('gpDrawerBackdrop')?.classList.remove('visible');document.body.classList.remove('gp-menu-open');open()});
document.addEventListener('gp-app-registered',refreshMenu);
window.addEventListener('storage',refreshMenu);
refreshMenu();
})();