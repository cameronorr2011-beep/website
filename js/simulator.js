/* ============================================================
   Algaephyte — merged single-file build
   ============================================================ */
"use strict";

/* ---------- sim model (ported from the build) ---------- */
function health(s){
  var iOpt=0.5, fI=(s.light/iOpt)*Math.exp(1-s.light/iOpt);
  var fC=s.carbon/(s.carbon+0.18);
  var doStress=Math.max(0,s.light*1.2-s.air*0.95);
  var fO=1/(1+doStress*doStress*2.8);
  var photoinhibit=s.light>0.72?(s.light-0.72)/0.28:0;
  var carbonStarved=1-fC;
  var bleach=Math.min(1,photoinhibit*0.85+carbonStarved*0.25);
  var mu=Math.max(0,fI*fC*fO*(1-bleach*0.55));
  var caption="Productive regime. Cells are dividing. The twin would hold.";
  var tone="good";
  if(s.light<0.16){caption="Below compensation. The column is waiting for photons.";tone="idle";}
  else if(photoinhibit>0.45&&doStress>0.4){caption="Photoinhibition and oxygen stress together. Repair is outrunning growth. Dim, or give it air.";tone="bad";}
  else if(photoinhibit>0.45){caption="The outer shell is bleaching. Steele's curve has gone over the top. Dim the jacket.";tone="bad";}
  else if(doStress>0.55){caption="Dissolved oxygen is supersaturating. Photosynthesis is starting to poison itself.";tone="warn";}
  else if(carbonStarved>0.55){caption="The carbon pool is thin. pH will climb. This is how unsupervised cultures die at 3 a.m.";tone="warn";}
  else if(mu<0.25){caption="Alive, not working. One of the three handles is wrong.";tone="warn";}
  return {mu:mu,bleach:bleach,photoinhibit:photoinhibit,carbonStarved:carbonStarved,oxygenStress:doStress,fI:fI,caption:caption,tone:tone};
}
function impact(mu,volL){
  volL=volL||18;
  var gLday=0.155*mu, gDay=gLday*volL;
  return {gLday:gLday,biomass:gDay,protein:gDay*0.6,co2:gDay*1.83,daysPerEgg:gDay*0.6>0.05?6.3/(gDay*0.6):Infinity,meshProteinKg:(gDay*0.6*10000*365)/1000};
}

/* ---------- build DOM ---------- */
function el(html){var t=document.createElement("template");t.innerHTML=html.trim();return t.content.firstChild;}

