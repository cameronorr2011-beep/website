"use strict";
/* ---------- living simulation wiring ---------- */
(function(){
  var controls=document.querySelectorAll("#simControls [data-ctl]");
  var inputs={light:0.52,carbon:0.72,air:0.58};
  var caption=document.getElementById("simCaption");
  var meta=document.getElementById("simMeta");
  var photo=document.getElementById("simPhoto");
  var fcPath=document.getElementById("fcPath");
  var oBio=document.getElementById("oBio"),oProt=document.getElementById("oProt"),oCo2=document.getElementById("oCo2");

  function unitText(k,v){
    if(k==="light")return Math.round(v*420)+" μmol";
    if(k==="carbon")return (v*9.5).toFixed(1)+" g/L";
    return Math.round(v*100)+"%";
  }
  function setUnits(){controls.forEach(function(c){c.querySelector("[data-unit]").textContent=unitText(c.dataset.ctl,inputs[c.dataset.ctl]);});}
  function forecastPath(mu){
    var vals=[];
    for(var i=0;i<25;i++){
      var time=i/24;
      var growth=mu>0.14?(Math.exp(mu*time*1.5)-1)/(Math.exp(mu*1.5)-1):time*mu;
      vals.push(Math.min(1,Math.max(0,growth)));
    }
    return vals.map(function(v,i){return (i===0?"M":"L")+(i/24)*320+","+(58-v*50);}).join(" ");
  }
  function update(){
    var h=health(inputs), out=impact(h.mu);
    caption.textContent=h.caption;
    caption.className="tone "+h.tone;
    meta.textContent="Growth response "+(h.mu*100).toFixed(0)+"% · oxygen stress "+(h.oxygenStress*100).toFixed(0)+"%";
    photo.style.filter="saturate("+(0.45+h.mu*1.15)+") brightness("+(0.45+h.mu*0.72)+") hue-rotate("+(h.bleach*32)+"deg)";
    photo.style.opacity=(0.55+h.mu*0.45).toFixed(3);
    fcPath.setAttribute("d",forecastPath(h.mu));
    oBio.textContent=out.biomass.toFixed(2);
    oProt.textContent=out.protein.toFixed(2);
    oCo2.textContent=out.co2.toFixed(1);
  }
  controls.forEach(function(c){
    var input=c.querySelector("input");
    input.addEventListener("input",function(){
      inputs[c.dataset.ctl]=parseFloat(input.value);
      setUnits();update();
    });
  });
  var reset=document.getElementById("simReset");
  if(reset)reset.addEventListener("click",function(){
    inputs={light:0.52,carbon:0.72,air:0.58};
    controls.forEach(function(c){c.querySelector("input").value=inputs[c.dataset.ctl];});
    setUnits();update();
  });
  setUnits();update();
})();

/* ---------- dosing calculator ---------- */
(function(){
  var vol=document.getElementById("dVol"),have=document.getElementById("dHave"),target=document.getElementById("dTarget"),out=document.getElementById("doseOut");
  function calc(){
    var v=parseFloat(vol.value)||0,h=parseFloat(have.value)||0,t=parseFloat(target.value)||0;
    var g=Math.max(0,(t-h)*v);
    var staged=Math.max(1,Math.ceil(g/(0.5*v)));
    out.textContent="Add "+g.toFixed(1)+" g NaHCO₃ total, in "+staged+" stage"+(staged>1?"s":"")+" of "+(g/staged).toFixed(1)+" g, an hour apart.";
  }
  [vol,have,target].forEach(function(i){i.addEventListener("input",calc);});
  calc();
})();

/* ---------- live culture chamber render (ported CultureSim) ---------- */
(function(){
  var canvas=document.getElementById("cultureSim");
  if(!canvas)return;
  var ctx=canvas.getContext("2d",{alpha:false});
  if(!ctx)return;
  if(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches){
    canvas.style.display="none";return;
  }
  var running=true,raf=0,t0=performance.now();
  var filaments=[];
  for(var i=0;i<170;i++){
    filaments.push({
      nx:Math.random(),y:Math.random()*1000,len:36+Math.random()*90,
      amp:3.2+Math.random()*5.5,turns:2.2+Math.random()*3.4,
      phase:Math.random()*Math.PI*2,spin:0.35+Math.random()*0.9,
      thick:0.8+Math.random()*1.6,hue:112+Math.random()*26,
      speed:6+Math.random()*14,depth:Math.random()
    });
  }
  filaments.sort(function(a,b){return a.depth-b.depth;});
  var bubbles=[];
  for(i=0;i<36;i++){
    bubbles.push({nx:Math.random(),y:Math.random()*800,r:0.8+Math.random()*3.2,v:22+Math.random()*50,wobble:Math.random()*Math.PI*2});
  }
  var mouse={x:.62,y:.5};
  window.addEventListener("mousemove",function(e){
    var r=canvas.getBoundingClientRect();
    mouse={x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height};
  },{passive:true});
  function resize(){
    var parent=canvas.parentElement;
    if(!parent)return;
    var dpr=Math.min(window.devicePixelRatio||1,2);
    var w=parent.clientWidth,h=parent.clientHeight;
    canvas.width=Math.floor(w*dpr);canvas.height=Math.floor(h*dpr);
    canvas.style.width=w+"px";canvas.style.height=h+"px";
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  resize();
  var ro=new ResizeObserver(resize);
  if(canvas.parentElement)ro.observe(canvas.parentElement);
  function roundCol(x,y,w,h,r){
    var rr=Math.min(r,w/2,h/4);
    ctx.beginPath();
    ctx.moveTo(x+rr,y);
    ctx.arcTo(x+w,y,x+w,y+h,rr);
    ctx.arcTo(x+w,y+h,x,y+h,rr*0.35);
    ctx.arcTo(x,y+h,x,y,rr*0.35);
    ctx.arcTo(x,y,x+w,y,rr);
    ctx.closePath();
  }
  function draw(now){
    if(!running)return;
    var dt=Math.min(.05,(now-t0)/1000);t0=now;
    var w=canvas.clientWidth,h=canvas.clientHeight;
    var s=simInputs();
    var H=health(s);
    var density=0.18+H.mu*0.82;
    var bleach=H.bleach;
    var nShow=Math.floor(55+density*115);
    var t=now/1000;
    var cx=w<900?w*0.5:w*0.64;
    var colW=Math.min(w*0.38,h*0.34,340);
    var top=h*0.07,colH=h*0.72,bot=top+colH,left=cx-colW/2;

    var bg=ctx.createRadialGradient(cx,h*0.42,20,cx,h*0.5,h*0.85);
    bg.addColorStop(0,"#0d1610");bg.addColorStop(.45,"#070b08");bg.addColorStop(1,"#030403");
    ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);

    ctx.fillStyle="rgba(40,70,45,0.12)";
    ctx.beginPath();ctx.ellipse(cx,bot+36,colW*0.95,16,0,0,Math.PI*2);ctx.fill();

    var wash=ctx.createRadialGradient(left-10,top+colH*0.35,10,left+colW*0.4,top+colH*0.4,colW*1.6);
    wash.addColorStop(0,"rgba(160,255,140,"+(0.04+s.light*0.22)+")");wash.addColorStop(1,"rgba(0,0,0,0)");
    ctx.fillStyle=wash;ctx.fillRect(0,0,w,h);

    ctx.fillStyle="rgba(210,255,170,"+(0.15+s.light*0.55)+")";
    ctx.fillRect(left-18,top+24,5,colH*0.7);
    ctx.shadowColor="rgba(140,255,110,"+s.light+")";ctx.shadowBlur=24;
    ctx.fillRect(left-18,top+24,5,colH*0.7);ctx.shadowBlur=0;

    ctx.save();
    roundCol(left,top,colW,colH,48);
    ctx.clip();
    var water=ctx.createLinearGradient(left,top,left+colW,bot);
    var g=16+H.mu*50,r0=6+bleach*50;
    water.addColorStop(0,"rgb("+(r0+8)+","+(24+g)+","+(18+bleach*16)+")");
    water.addColorStop(.55,"rgb("+r0+","+(14+g*0.75)+",14)");
    water.addColorStop(1,"rgb("+(4+bleach*20)+","+(10+g*0.4)+",10)");
    ctx.fillStyle=water;ctx.fillRect(left,top,colW,colH);

    ctx.globalCompositeOperation="lighter";
    for(var i2=0;i2<4;i2++){
      var yy=top+((t*18+i2*90)%(colH+40))-20;
      var cg=ctx.createLinearGradient(left,yy,left,yy+50);
      cg.addColorStop(0,"rgba(0,0,0,0)");
      cg.addColorStop(.5,"rgba(170,255,150,"+(0.03+s.light*0.05)+")");
      cg.addColorStop(1,"rgba(0,0,0,0)");
      ctx.fillStyle=cg;ctx.fillRect(left,yy,colW,50);
    }
    ctx.globalCompositeOperation="source-over";

    var shaft=ctx.createLinearGradient(left,top,left+colW*0.85,top);
    shaft.addColorStop(0,"rgba(200,255,160,"+(0.06+s.light*0.2)+")");shaft.addColorStop(1,"rgba(0,0,0,0)");
    ctx.fillStyle=shaft;ctx.fillRect(left,top,colW,colH);

    var mx=mouse.x*w,my=mouse.y*h;
    for(var i3=0;i3<nShow;i3++){
      var f=filaments[i3];
      f.y-=f.speed*dt*(0.3+s.air*0.55+H.mu*0.2);
      if(f.y+f.len<top-10)f.y=bot+Math.random()*30;
      var x0=left+14+f.nx*(colW-28);
      var dx=(mx-x0)*0.012*(1-f.depth);
      var dy=(my-(f.y+f.len/2))*0.004;
      var sat=62-bleach*38;
      var lit=18+f.depth*16+H.mu*16-bleach*14;
      ctx.strokeStyle="hsla("+(f.hue-bleach*28)+","+sat+"%,"+lit+"%,"+(0.28+density*0.5+f.depth*0.15)+")";
      ctx.lineWidth=f.thick*(0.7+f.depth*0.8);
      ctx.lineCap="round";
      ctx.beginPath();
      for(var k=0;k<=22;k++){
        var u=k/22,y=f.y+u*f.len+dy;
        var a=u*f.turns*Math.PI*2+f.phase+t*f.spin;
        var x=x0+Math.cos(a)*f.amp+dx;
        if(k===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
      }
      ctx.stroke();
    }
    for(var i4=0;i4<bubbles.length;i4++){
      var b=bubbles[i4];
      b.y-=b.v*dt*(0.35+s.air*1.35);
      b.wobble+=dt*3;
      if(b.y<top+12){b.y=bot-10;b.nx=Math.random();}
      var bx=left+18+b.nx*(colW-36)+Math.sin(b.wobble)*3;
      var gr=ctx.createRadialGradient(bx-b.r*0.3,b.y-b.r*0.35,0,bx,b.y,b.r);
      gr.addColorStop(0,"rgba(255,255,255,"+(0.45+s.air*0.3)+")");
      gr.addColorStop(.45,"rgba(190,255,210,0.12)");
      gr.addColorStop(1,"rgba(190,255,210,0)");
      ctx.fillStyle=gr;ctx.beginPath();ctx.arc(bx,b.y,b.r*(0.7+s.air*0.5),0,Math.PI*2);ctx.fill();
    }
    ctx.fillStyle="rgba(255,255,255,0.07)";
    ctx.beginPath();ctx.ellipse(cx,top+22,colW*0.46,11,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle="rgba(255,255,255,0.18)";ctx.lineWidth=1;
    ctx.beginPath();ctx.ellipse(cx,top+20,colW*0.46,10,0,Math.PI,0);ctx.stroke();
    ctx.restore();

    ctx.strokeStyle="rgba(230,245,230,0.28)";ctx.lineWidth=1.6;
    roundCol(left,top,colW,colH,48);ctx.stroke();

    ctx.strokeStyle="rgba(255,255,255,0.16)";ctx.lineWidth=7;ctx.lineCap="round";
    ctx.beginPath();ctx.moveTo(left+14,top+56);ctx.lineTo(left+14,bot-70);ctx.stroke();
    ctx.strokeStyle="rgba(255,255,255,0.07)";ctx.lineWidth=3;
    ctx.beginPath();ctx.moveTo(left+colW-16,top+80);ctx.lineTo(left+colW-16,bot-90);ctx.stroke();

    var bx2=cx-colW*0.42,bw=colW*0.84;
    ctx.fillStyle="#121612";ctx.fillRect(bx2,bot-2,bw,20);
    ctx.fillStyle="#181d18";ctx.fillRect(cx-colW*0.52,bot+16,colW*1.04,28);
    ctx.fillStyle="#0e120e";ctx.fillRect(cx-22,bot+22,28,10);
    ctx.fillStyle="#c23a2a";ctx.beginPath();ctx.arc(cx+colW*0.32,bot+30,6,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="rgba(120,255,140,"+(0.4+0.4*Math.sin(t*3))+")";
    ctx.beginPath();ctx.arc(cx-colW*0.34,bot+30,3,0,Math.PI*2);ctx.fill();

    raf=requestAnimationFrame(draw);
  }
  var simInputs=function(){return {light:parseFloat(document.querySelector('[data-ctl="light"] input').value)||.52,carbon:parseFloat(document.querySelector('[data-ctl="carbon"] input').value)||.72,air:parseFloat(document.querySelector('[data-ctl="air"] input').value)||.58};};
  raf=requestAnimationFrame(draw);
})();

