"use strict";
/* ---------- nav state ---------- */
(function(){
  var nav=document.getElementById("nav");
  var toggle=document.getElementById("navToggle");
  var menu=document.getElementById("mobileMenu");
  function onScroll(){nav.classList.toggle("solid",window.scrollY>8);}
  onScroll();
  window.addEventListener("scroll",onScroll,{passive:true});
  if(toggle)toggle.addEventListener("click",function(){
    var open=menu.hidden;
    menu.hidden=!open;
    toggle.setAttribute("aria-expanded",open?"true":"false");
    toggle.textContent=open?"Close":"Menu";
  });
  if(menu)menu.addEventListener("click",function(e){
    if(e.target.tagName==="A"){menu.hidden=true;toggle.setAttribute("aria-expanded","false");toggle.textContent="Menu";}
  });
})();

/* ---------- deploy form (Formspree; falls back to validation-only notice) -- */
/* To activate: create a free form at formspree.io for service@orrbiologicals.com
   and paste its ID below. Until then the form validates and shows a mailto link. */
(function(){
  var form=document.getElementById("deployForm");
  if(!form)return;
  var status=document.getElementById("formStatus");
  var ENDPOINT="https://formspree.io/f/YOUR_FORM_ID"; // TODO: real Formspree ID
  function say(msg,err){status.textContent=msg;status.style.color=err?"#e08a8a":"#5ad07a";}
  form.addEventListener("submit",function(e){
    e.preventDefault();
    var hp=document.getElementById("fHp");
    if(hp&&hp.value){return;}
    var fields=["fName","fPlace","fGrow"].map(function(id){return document.getElementById(id);});
    var missing=fields.filter(function(f){return !f.value.trim();});
    if(missing.length){say("Please fill in "+missing.map(function(f){return f.previousElementSibling.textContent.toLowerCase();}).join(", ")+".",true);missing[0].focus();return;}
    var btn=form.querySelector("button[type=submit]");
    btn.disabled=true;say("Sending…");
    if(ENDPOINT.indexOf("YOUR_FORM_ID")!==-1){
      say("Form service not configured yet — please email service@orrbiologicals.com directly.",true);
      btn.disabled=false;return;
    }
    fetch(ENDPOINT,{method:"POST",headers:{Accept:"application/json"},
      body:new FormData(form)})
      .then(function(r){
        if(r.ok){form.reset();say("Thank you — your inquiry is in. We reply from service@orrbiologicals.com.");}
        else{throw new Error("bad status");}
      })
      .catch(function(){say("Sending failed — please email service@orrbiologicals.com directly.",true);})
      .finally(function(){btn.disabled=false;});
  });
})();

