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

/* ---------- deploy form (pilot access) ----------
   Always visible; submitting opens a pre-filled deployment inquiry to
   service@orrbiologicals.com via the visitor's mail client. No backend
   needed and nothing can silently swallow an inquiry. */
(function(){
  var form=document.getElementById("deployForm");
  if(!form)return;
  var status=document.getElementById("formStatus");
  function say(msg,err){if(status){status.textContent=msg;status.style.color=err?"var(--warn)":"var(--leaf-deep)";}}
  form.addEventListener("submit",function(e){
    e.preventDefault();
    var hp=document.getElementById("fHp");
    if(hp&&hp.value){return;}
    var fields=["fName","fPlace","fGrow"].map(function(id){return document.getElementById(id);});
    var missing=fields.filter(function(f){return !f.value.trim();});
    if(missing.length){say("Please fill in "+missing.map(function(f){return f.previousElementSibling.textContent.toLowerCase();}).join(", ")+".",true);missing[0].focus();return;}
    var subject="Algaephyte deployment inquiry — " + fields[0].value.trim();
    var body="Name / organization: "+fields[0].value.trim()+
             "\nLocation: "+fields[1].value.trim()+
             "\nCultivation objective: "+fields[2].value.trim()+
             "\n\n(Sent from the pilot access form at orrbiologicals.com)";
    say("Opening your email client…");
    window.location.href="mailto:service@orrbiologicals.com?subject="+encodeURIComponent(subject)+"&body="+encodeURIComponent(body);
    say("If your email client did not open, write to service@orrbiologicals.com.",true);
  });
})();

