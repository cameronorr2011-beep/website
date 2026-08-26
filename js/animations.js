"use strict";
/* ---------- count up ---------- */
(function(){
  var node=document.getElementById("countUp");
  if(!node)return;
  var target=2.34;
  var obs=new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(!e.isIntersecting)return;
      obs.disconnect();
      var start=performance.now(),dur=1400;
      function tick(now){
        var p=Math.min(1,(now-start)/dur);
        var eased=1-Math.pow(1-p,3);
        node.textContent=(target*eased).toFixed(2);
        if(p<1)requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  },{threshold:.6});
  obs.observe(node);
})();

/* ---------- reveal on scroll ---------- */
(function(){
  var els=document.querySelectorAll(".section-reveal");
  if(!("IntersectionObserver" in window)){els.forEach(function(e){e.classList.add("in");});return;}
  var obs=new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){e.target.classList.add("in");obs.unobserve(e.target);}
    });
  },{threshold:.12,rootMargin:"0px 0px -40px 0px"});
  els.forEach(function(e){obs.observe(e);});
})();

/* ---------- atmosphere particles (bubbles / helices / specks) ---------- */
(function(){
  var skip=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(skip)return;
  var canvases=[].slice.call(document.querySelectorAll("canvas.hero-atmo"));
  canvases.forEach(function(canvas){
    var ctx=canvas.getContext("2d");
    if(!ctx)return;
    var running=true,raf=0,t0=performance.now(),parts=[];
    function seed(w,h){
      parts=[];
      for(var i=0;i<70;i++){
        var kind=i%7===0?"helix":i%3===0?"bubble":"speck";
        parts.push({
          x:Math.random()*w,y:Math.random()*h,
          r:kind==="bubble"?1.2+Math.random()*3.4:0.5+Math.random()*1.4,
          v:kind==="bubble"?14+Math.random()*28:6+Math.random()*16,
          drift:(Math.random()-0.5)*12,phase:Math.random()*Math.PI*2,
          kind:kind,hue:110+Math.random()*30,len:18+Math.random()*42
        });
      }
    }
    function resize(){
      var parent=canvas.parentElement;
      if(!parent)return;
      var dpr=Math.min(window.devicePixelRatio||1,2);
      var w=parent.clientWidth,h=parent.clientHeight;
      canvas.width=Math.floor(w*dpr);canvas.height=Math.floor(h*dpr);
      canvas.style.width=w+"px";canvas.style.height=h+"px";
      ctx.setTransform(dpr,0,0,dpr,0,0);
      seed(w,h);
    }
    resize();
    var ro=new ResizeObserver(resize);
    if(canvas.parentElement)ro.observe(canvas.parentElement);
    function draw(now){
      if(!running)return;
      var dt=Math.min(.05,(now-t0)/1000);t0=now;
      var w=canvas.clientWidth,h=canvas.clientHeight,t=now/1000;
      ctx.clearRect(0,0,w,h);
      for(var i=0;i<parts.length;i++){
        var p=parts[i];
        p.y-=p.v*dt;
        p.x+=Math.sin(t*0.6+p.phase)*p.drift*dt;
        p.phase+=dt*0.8;
        if(p.y<-20){p.y=h+20;p.x=Math.random()*w;}
        if(p.kind==="bubble"){
          var g=ctx.createRadialGradient(p.x-p.r*0.3,p.y-p.r*0.3,0,p.x,p.y,p.r);
          g.addColorStop(0,"rgba(220,255,230,0.55)");
          g.addColorStop(.55,"rgba(159,224,164,0.12)");
          g.addColorStop(1,"rgba(159,224,164,0)");
          ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();
        }else if(p.kind==="helix"){
          ctx.strokeStyle="hsla("+p.hue+",55%,62%,0.22)";ctx.lineWidth=1.1;ctx.beginPath();
          for(var k=0;k<=14;k++){
            var u=k/14,yy=p.y+u*p.len,xx=p.x+Math.sin(u*8+p.phase)*4.2;
            if(k===0)ctx.moveTo(xx,yy);else ctx.lineTo(xx,yy);
          }
          ctx.stroke();
        }else{
          ctx.fillStyle="rgba(159,224,164,"+(0.08+(Math.sin(p.phase)+1)*0.08)+")";
          ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();
        }
      }
      raf=requestAnimationFrame(draw);
    }
    raf=requestAnimationFrame(draw);
    /* no cleanup needed for single-page lifetime */
  });
})();

/* ---------- hero / instrument parallax ---------- */
(function(){
  if(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  var heroImg=document.getElementById("heroImg");
  var instImg=document.getElementById("instImg");
  var heroIn=document.getElementById("heroIn");
  var hero=document.querySelector(".hero");
  function move(e){
    if(heroImg){
      var r=hero.getBoundingClientRect();
      var x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
      heroImg.style.transform="translate("+(x*-22)+"px,"+(y*-14)+"px) scale(1.04)";
      if(heroIn)heroIn.style.transform="translate("+(x*12)+"px,"+(y*9)+"px)";
    }
    if(instImg){
      var r2=instImg.parentElement.getBoundingClientRect();
      var x2=(e.clientX-r2.left)/r2.width-.5,y2=(e.clientY-r2.top)/r2.height-.5;
      instImg.style.transform="translate("+(x2*-20)+"px,"+(y2*-12)+"px) scale(1.03)";
    }
  }
  var inst=document.querySelector(".instrument");
  if(hero)hero.addEventListener("mousemove",move,{passive:true});
  if(inst)inst.addEventListener("mousemove",move,{passive:true});
})();