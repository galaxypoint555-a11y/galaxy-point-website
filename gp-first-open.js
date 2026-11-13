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
 overlay.innerHTML='<div class="gp-first-open-card" role="dialog" aria-modal="true" aria-labelledby="gp-first-title"><div class="gp-first-logo"><img src="/gp-app-icon.svg" alt="Galaxy Point logo"></div><div class="gp-first-eyebrow">GALAXY POINT · KHARGHAR</div><h1 id="gp-first-title">Welcome to Galaxy Point</h1><p class="gp-first-intro">Register once to get started with the Galaxy Point app.</p><form id="gp-first-form" autocomplete="on"><label for="gp-first-name">Full Name</label><input id="gp-first-name" name="name" type="text" autocomplete="name" minlength="2" maxlength="120" placeholder="Enter your full name" required><label for="gp-first-phone">Mobile Number</label><div class="gp-first-mobile"><span>+91</span><input id="gp-first-phone" name="phone" type="tel" inputmode="numeric" autocomplete="tel-national" maxlength="10" pattern="[0-9]{10}" placeholder="10-digit mobile number" required></div><p id="gp-first-error" class="gp-first-error" role="alert" aria-live="polite"></p><button type="submit" id="gp-first-continue">REGISTER &amp; CONTINUE <span aria-hidden="true">→</span></button></form><p class="gp-first-privacy">Your name and number will be saved by Galaxy Point for app registration and customer service. No OTP verification is performed.</p></div>';
 document.body.appendChild(overlay);
 const form=overlay.querySelector('form');
 const nameInput=overlay.querySelector('#gp-first-name');
 const phoneInput=overlay.querySelector('#gp-first-phone');
 const error=overlay.querySelector('#gp-first-error');
 const button=overlay.querySelector('#gp-first-continue');
 form.addEventListener('submit',async event=>{
  event.preventDefault();
  if(button.disabled)return;
  const name=nameInput.value.trim().replace(/\s+/g,' ');
  const phone=phoneInput.value.replace(/\s/g,'').trim();
  if(name.length<2||name.length>120){error.textContent='Please enter your full name (at least 2 characters).';nameInput.focus();return;}
  if(!/^[0-9]{10}$/.test(phone)){error.textContent='Please enter a valid 10-digit mobile number.';phoneInput.focus();return;}
  const cfg=window.GP_CONFIG||{};
  if(!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(cfg.supabaseUrl||'')||!cfg.supabaseAnonKey){
    error.textContent='Registration is temporarily unavailable. Please try again later.';return;
  }
  button.disabled=true;
  button.textContent='SAVING YOUR DETAILS…';
  error.textContent='';
  try{
    const response=await fetch(cfg.supabaseUrl.replace(/\/$/,'')+'/rest/v1/customer_login_events',{
      method:'POST',
      headers:{apikey:cfg.supabaseAnonKey,Authorization:'Bearer '+cfg.supabaseAnonKey,'Content-Type':'application/json',Prefer:'return=minimal'},
      body:JSON.stringify({customer_name:name,phone,source:'mobile_login'}),
      cache:'no-store'
    });
    if(!response.ok)throw Error('Registration failed ('+response.status+')');
    try{window.localStorage.setItem(KEY,'1')}catch(storageError){
      console.warn('Unable to remember app registration on this device',storageError);
      error.textContent='Your registration was received, but this device could not remember it. Enable site storage to avoid registering again.';
      button.disabled=false;button.innerHTML='TRY AGAIN <span aria-hidden="true">→</span>';return;
    }
    overlay.remove();unlock();
    document.dispatchEvent(new CustomEvent('gp-app-registered'));
  }catch(err){
    console.warn('Galaxy Point app registration failed',err);
    error.textContent='Could not save your details. Check your internet connection and try again.';
    button.disabled=false;button.innerHTML='TRY AGAIN <span aria-hidden="true">→</span>';
  }
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