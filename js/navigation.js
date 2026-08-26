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

/* ---------- deploy form (mailto, honeypot) ---------- */
(function(){
  var form=document.getElementById("deployForm");
  if(!form)return;
  form.addEventListener("submit",function(e){
    e.preventDefault();
    var hp=document.getElementById("fHp");
    if(hp&&hp.value){return;}
    var name=document.getElementById("fName").value.trim();
    var place=document.getElementById("fPlace").value.trim();
    var grow=document.getElementById("fGrow").value.trim();
    var subject=encodeURIComponent("Algaephyte deployment inquiry");
    var body=encodeURIComponent("Hi Orr Biologicals,\n\nI'd like to discuss an Algaephyte pilot deployment.\n\nName / organization: "+name+"\nLocation: "+place+"\nCultivation objective: "+grow+"\n");
    window.location.href="mailto:service@orrbiologicals.com?subject="+subject+"&body="+body;
  });
})();

