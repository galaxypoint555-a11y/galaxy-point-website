/* Galaxy Point installed web-app first-open registration.
   Runs only in iPhone Home Screen web apps and Android installed PWAs.
   Uses public Supabase INSERT with existing RLS; never stores API secrets. */
(function(){
'use strict';
const KEY='gp_app_first_open_registered_v1';
const ID='gp-first-open-registration';
const media=typeof window.matchMedia==='function'?window.matchMedia('(display-mode: standalone)'):null;
const isInstalled=()=>Boolean((media&&media.matches)||window.navigator.standalone===true);
const completed=()=>{try{return window.localStorage.getItem(KEY)==='1'}catch(_){return false}};
function lock(){document.documentElement.classList.add('gp-app-first-open-locked')}
function unlock(){document.documentElement.classList.remove('gp-app-first-open-locked')}
function show(){
 if(!isInstalled()||completed()){unlock();document.getElementById(ID)?.remove();return;}
 lock();
 if(document.getElementById(ID))return;
 const overlay=document.createElement('div');
 overlay.id=ID;
 overlay.className='gp-first-open-overlay';
 overlay.innerHTML='<div class="gp-first-open-card" role="dialog" aria-modal="true" aria-labelledby="gp-first-title"><div class="gp-first-logo"><img src="/gp-app-icon.svg" alt="Galaxy Point logo"></div><div class="gp-first-eyebrow">GALAXY POINT · KHARGHAR</div><h1 id="gp-first-title">Welcome to Galaxy Point</h1><p class="gp-first-intro">Register once to get started with the Galaxy Point app.</p><form id="gp-first-form" autocomplete="on"><label for="gp-first-name">Full Name</label><input id="gp-first-name" name="name" type="text" autocomplete="name" minlength="2" maxlength="120" placeholder="Enter your full name" required><label for="gp-first-phone">Mobile Number</label><div class="gp-first-mobile"><span>+91</span><input id="gp-first-phone" name="phone" type="tel" inputmode="numeric" autocomplete="tel-national" maxlength="10" pattern="[0-9]{10}" placeholder="10-digit mobile number" required></div><label for="gp-first-email">Email Address</label><input id="gp-first-email" name="email" type="email" autocomplete="email" maxlength="254" placeholder="you@example.com" required style="margin-bottom:20px"><div id="gp-first-otp-step" hidden><label for="gp-first-code" style="display:block;margin-bottom:9px">EMAIL VERIFICATION CODE</label><input id="gp-first-code" name="otp" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]{6}" placeholder="6-digit OTP"><p class="gp-first-privacy" style="margin:8px 0 12px;text-align:left">Enter the 6-digit code sent to your email. <button type="button" id="gp-first-resend" style="border:0;background:none;color:#194f80;text-decoration:underline;font:inherit;padding:0">Resend code</button></p></div><p id="gp-first-error" class="gp-first-error" role="alert" aria-live="polite"></p><button type="submit" id="gp-first-continue">SEND EMAIL OTP <span aria-hidden="true">→</span></button></form><p class="gp-first-privacy">Your name and number will be saved by Galaxy Point for app registration and customer service. Email verification is required before registration is completed.</p></div>';
 document.body.appendChild(overlay);
 const form=overlay.querySelector('form');
 const nameInput=overlay.querySelector('#gp-first-name');
 const phoneInput=overlay.querySelector('#gp-first-phone');
 const emailInput=overlay.querySelector('#gp-first-email');
 const otpStep=overlay.querySelector('#gp-first-otp-step');
 const otpInput=overlay.querySelector('#gp-first-code');
 const resend=overlay.querySelector('#gp-first-resend');
 let otpSent=false,lastSent=0;
 const error=overlay.querySelector('#gp-first-error');
 const button=overlay.querySelector('#gp-first-continue');
 async function authRequest(path,body){
  const cfg=window.GP_CONFIG||{};
  if(!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(cfg.supabaseUrl||'')||!cfg.supabaseAnonKey)throw Error('Email verification service unavailable.');
  const res=await fetch(cfg.supabaseUrl.replace(/\/$/,'')+'/auth/v1/'+path,{method:'POST',headers:{apikey:cfg.supabaseAnonKey,'Content-Type':'application/json'},body:JSON.stringify(body),cache:'no-store'});
  const data=await res.json().catch(()=>({}));
  if(!res.ok)throw Error(data.msg||data.error_description||data.message||'Email verification failed. Please try again.');
  return data;
 }
 async function sendCode(){
  if(Date.now()-lastSent<60000)throw Error('Please wait 60 seconds before requesting another code.');
  const email=emailInput.value.trim().toLowerCase();
  if(!emailInput.checkValidity())throw Error('Please enter a valid email address.');
  await authRequest('otp',{email,create_user:true,data:{full_name:nameInput.value.trim(),phone:phoneInput.value.trim()}});
  lastSent=Date.now();otpSent=true;otpStep.hidden=false;
  nameInput.readOnly=true;phoneInput.readOnly=true;emailInput.readOnly=true;
  button.innerHTML='VERIFY EMAIL &amp; COMPLETE REGISTRATION <span aria-hidden="true">→</span>';
  otpInput.required=true;otpInput.focus();
 }
 resend.addEventListener('click',async()=>{
  resend.disabled=true;error.textContent='';
  try{await sendCode();error.style.color='#237347';error.textContent='A new verification code has been sent.'}
  catch(e){error.style.color='#bc3441';error.textContent=e.message}
  finally{resend.disabled=false}
 });
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(button.disabled)return;
  const name=nameInput.value.trim().replace(/\s+/g,' ');
  const phone=phoneInput.value.replace(/\s/g,'').trim();
  if(name.length<2||name.length>120){error.textContent='Please enter your full name.';return;}
  if(!/^[0-9]{10}$/.test(phone)){error.textContent='Please enter a valid 10-digit mobile number.';return;}
  button.disabled=true;error.style.color='#bc3441';error.textContent='';
  try{
   if(!otpSent){button.textContent='SENDING EMAIL OTP…';await sendCode();error.style.color='#237347';error.textContent='Verification code sent. Please check your email.';return;}
   const token=otpInput.value.trim();
   if(!/^[0-9]{6}$/.test(token))throw Error('Enter the 6-digit code from your email.');
   button.textContent='VERIFYING EMAIL…';
   const verified=await authRequest('verify',{email:emailInput.value.trim().toLowerCase(),token,type:'email'});
   if(!verified.access_token||!verified.user?.id)throw Error('Email could not be verified. Please try again.');
   try{localStorage.setItem('gp_customer_auth_v1',JSON.stringify({access_token:verified.access_token,refresh_token:verified.refresh_token,expires_at:Math.floor(Date.now()/1000)+(verified.expires_in||3600),user:verified.user}));}catch(_){}
   button.textContent='COMPLETING REGISTRATION…';
   const cfg=window.GP_CONFIG;
   const response=await fetch(cfg.supabaseUrl.replace(/\/$/,'')+'/rest/v1/customer_login_events',{
    method:'POST',headers:{apikey:cfg.supabaseAnonKey,Authorization:'Bearer '+cfg.supabaseAnonKey,'Content-Type':'application/json',Prefer:'return=minimal'},
    body:JSON.stringify({customer_name:name,phone,source:'mobile_login'}),cache:'no-store'
   });
   if(!response.ok)throw Error('Email verified, but registration could not be saved ('+response.status+'). Please try again.');
   window.localStorage.setItem(KEY,'1');
   overlay.remove();unlock();document.dispatchEvent(new CustomEvent('gp-app-registered'));
  }catch(err){console.warn('Galaxy Point registration:',err);error.textContent=err.message||'Registration failed. Please try again.';}
  finally{button.disabled=false;if(otpSent&&document.getElementById(ID))button.innerHTML='VERIFY EMAIL &amp; COMPLETE REGISTRATION <span aria-hidden="true">→</span>';else if(document.getElementById(ID))button.innerHTML='SEND EMAIL OTP <span aria-hidden="true">→</span>';}
 });
 // Keep keyboard users inside the required first-open dialog.
 overlay.addEventListener('keydown',e=>{
  if(e.key!=='Tab')return;
  const focusable=[...overlay.querySelectorAll('input:not([disabled]),button:not([disabled])')];
  if(!focusable.length)return;
  if(e.shiftKey&&document.activeElement===focusable[0]){e.preventDefault();focusable[focusable.length-1].focus();}
  else if(!e.shiftKey&&document.activeElement===focusable[focusable.length-1]){e.preventDefault();focusable[0].focus();}
 });
}
function start(){
 if(document.body)show();
 else document.addEventListener('DOMContentLoaded',show,{once:true});
}
start();
if(media){
 if(media.addEventListener)media.addEventListener('change',start);
 else if(media.addListener)media.addListener(start);
}
window.addEventListener('pageshow',start);
})();