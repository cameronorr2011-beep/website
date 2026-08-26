/* ============================================================
   Orr Biologicals — hero-phyto.js
   "The Reactor" WebGL scene (AlgaePhyte / index hero).
   A raymarched glass photobioreactor with a volumetric culture,
   rising bubbles and internal light, plus an additive particle
   layer of drifting cells. Raw WebGL1 + GLSL, self-contained.
   Perf-guarded: DPR clamp, pause when hidden/scrolled away,
   reduced-motion + no-WebGL fallbacks.
   Public API: window.Reactor = { setScroll, setGather, setReveal, pause, resume }
   ============================================================ */
(function () {
  "use strict";
  var canvas = document.getElementById("scene");
  if (!canvas) return;
  if (window.location.hash && window.location.hash !== "#top") {
    document.documentElement.classList.add("fragment-entry");
    canvas.hidden = true;
    return;
  }

  var reduce =
    (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) ||
    (navigator.connection && navigator.connection.saveData);
  var mobile = window.matchMedia && window.matchMedia("(max-width: 720px)").matches;

  var gl = null;
  try {
    var opts = { antialias: false, alpha: true, depth: false, stencil: false, premultipliedAlpha: false, powerPreference: "high-performance", failIfMajorPerformanceCaveat: false };
    gl = canvas.getContext("webgl", opts) || canvas.getContext("experimental-webgl", opts);
  } catch (e) { gl = null; }

  if (!gl) { canvas.classList.add("no-webgl"); return; }
  canvas.classList.add("gl-ready");
  var running = false;
  canvas.addEventListener("webglcontextlost", function (event) {
    event.preventDefault();
    running = false;
    canvas.classList.add("no-webgl");
  }, false);

  var VERT = "attribute vec2 p; void main(){ gl_Position = vec4(p,0.,1.); }";

  var FRAG = [
    "precision highp float;",
    "uniform vec2 uRes; uniform float uTime; uniform vec2 uPtr;",
    "uniform float uReveal; uniform float uScroll; uniform float uReduce;",
    "float hash(vec3 p){ p=fract(p*0.3183099+0.1); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }",
    "float noise(vec3 x){ vec3 p=floor(x),f=fract(x); f=f*f*(3.0-2.0*f);",
    " return mix(mix(mix(hash(p+vec3(0,0,0)),hash(p+vec3(1,0,0)),f.x),mix(hash(p+vec3(0,1,0)),hash(p+vec3(1,1,0)),f.x),f.y),",
    "            mix(mix(hash(p+vec3(0,0,1)),hash(p+vec3(1,0,1)),f.x),mix(hash(p+vec3(0,1,1)),hash(p+vec3(1,1,1)),f.x),f.y),f.z); }",
    "float fbm(vec3 p){ float a=0.5,s=0.0; for(int i=0;i<4;i++){ s+=a*noise(p); p=p*2.03+vec3(1.7); a*=0.5;} return s; }",
    "vec2 iCyl(vec3 ro, vec3 rd, float r){",
    " float a=rd.x*rd.x+rd.z*rd.z; float b=2.0*(ro.x*rd.x+ro.z*rd.z); float c=ro.x*ro.x+ro.z*ro.z-r*r;",
    " float d=b*b-4.0*a*c; if(d<0.0) return vec2(-1.0); d=sqrt(d); return vec2((-b-d)/(2.0*a),(-b+d)/(2.0*a)); }",
    "mat2 rot(float a){ float s=sin(a),c=cos(a); return mat2(c,-s,s,c); }",
    "float sdSeg(vec2 p,vec2 a,vec2 b){ vec2 pa=p-a,ba=b-a; float h=clamp(dot(pa,ba)/dot(ba,ba),0.0,1.0); return length(pa-ba*h); }",
    "void main(){",
    " vec2 uv=(gl_FragCoord.xy*2.0-uRes)/uRes.y;",
    " float t = uReduce>0.5 ? 6.0 : uTime;",
    " float orbit = 0.30*uPtr.x + 0.09*sin(t*0.07);",
    " vec3 ro = vec3(sin(orbit)*4.8, 0.35 - 0.5*uPtr.y, cos(orbit)*4.8);",
    " vec3 ta = vec3(0.0, 0.42, 0.0);",
    " vec3 fw = normalize(ta-ro); vec3 rt = normalize(cross(vec3(0,1,0),fw)); vec3 up=cross(fw,rt);",
    " vec3 rd = normalize(fw*1.5 + uv.x*rt + uv.y*up);",
    " float bgv = smoothstep(1.7,-0.3,length(uv));",
    " vec3 col = mix(vec3(0.008,0.022,0.026), vec3(0.02,0.07,0.075), bgv);",
    " col += vec3(0.02,0.09,0.085)*pow(max(0.0,1.0-length(uv-vec2(0.0,0.15))*0.55),3.0);",
    " float H=1.42, RO=0.80, RI=0.66;",
    " vec2 to=iCyl(ro,rd,RO);",
    " float cover=0.0; vec3 reactor=vec3(0.0);",
    " if(to.x>0.0){",
    "  vec3 pO=ro+rd*to.x;",
    "  if(abs(pO.y)<H){",
    "   cover=1.0;",
    "   vec3 n=normalize(vec3(pO.x,0.0,pO.z));",
    "   float ndv=max(0.0,dot(n,-rd));",
    "   float fres=pow(1.0-ndv,2.2);",
    "   vec2 ti=iCyl(ro,rd,RI);",
    "   float tA=max(ti.x,to.x); float tB=ti.y;",
    "   vec3 cult=vec3(0.0); float dens=0.0;",
    "   if(tB>tA){",
    "    const int N=30; float seg=(tB-tA)/float(N);",
    "    for(int i=0;i<N;i++){ float tt=tA+seg*(float(i)+0.5); vec3 q=ro+rd*tt;",
    "      if(abs(q.y)>H) continue;",
    "      vec3 sw=q; sw.xz=rot(t*0.16 + q.y*0.55)*sw.xz;",
    "      float n1=fbm(sw*2.3 + vec3(0.0,-t*0.28,0.0));",
    "      float vgrad=smoothstep(H,-H,q.y);",
    "      float d=(0.45+0.75*n1)*(0.55+0.6*vgrad);",
    "      float bub=smoothstep(0.05,0.0, abs(fract(q.y*0.55 - t*0.55 + hash(vec3(floor(q.xz*8.0),7.0))*3.14)-0.5)-0.02)*step(0.80,n1);",
    "      vec3 em=mix(vec3(0.06,0.42,0.20), vec3(0.20,1.05,0.52), vgrad);",
    "      em+=vec3(0.8,1.2,0.9)*bub;",
    "      float a=d*seg*1.5*(1.0-dens);",
    "      cult+=em*a; dens+=a; if(dens>0.98) break;",
    "    }",
    "   }",
    "   cult*=1.35;",
    "   float axis=1.0-clamp(length(pO.xz)/RO,0.0,1.0); cult+=vec3(0.2,0.7,0.45)*pow(axis,3.0)*0.3;",
    "   vec3 glass=mix(vec3(0.05,0.16,0.17), vec3(0.45,1.0,0.9), fres);",
    "   float spec=pow(max(0.0,dot(reflect(rd,n),normalize(vec3(-0.5,0.7,0.4)))),50.0);",
    "   glass+=vec3(0.9,1.0,0.98)*spec;",
    "   float ring=smoothstep(0.14,0.0, abs(abs(pO.y)-(H-0.03)));",
    "   vec3 metal=vec3(0.5,0.62,0.62)*(0.4+0.6*fres);",
    "   reactor = cult + glass*(0.5+0.8*fres);",
    "   reactor = mix(reactor, metal, ring*0.85);",
    "   float ang=atan(pO.z,pO.x); float coil=smoothstep(0.11,0.0,abs(sin(ang*2.0+pO.y*8.2)));",
    "   reactor += vec3(0.12,0.72,0.48)*coil*(0.05+0.18*fres);",
    "  }",
    " }",
    " col = mix(col, reactor, cover);",
    " float halo = exp(-abs(length(uv.x)*1.3)) * smoothstep(1.9,0.0,abs(uv.y));",
    " col += vec3(0.05,0.28,0.24)*halo*0.25*(1.0-cover);",
    " float baseGlow = smoothstep(0.8,0.0, length((uv-vec2(0.0,-1.25))*vec2(0.7,1.0)));",
    " col += vec3(0.05,0.26,0.24)*baseGlow*0.6;",
    " float fd=sdSeg(uv,vec2(-0.34,-0.39),vec2(-0.34,0.48));",
    " fd=min(fd,sdSeg(uv,vec2(0.34,-0.39),vec2(0.34,0.48)));",
    " fd=min(fd,sdSeg(uv,vec2(-0.34,0.48),vec2(0.34,0.48)));",
    " fd=min(fd,sdSeg(uv,vec2(-0.42,-0.40),vec2(0.42,-0.40)));",
    " float fm=smoothstep(0.018,0.005,fd); col=mix(col,vec3(0.22,0.36,0.35),fm*0.58*(1.0-cover*0.4));",
    " float nd=abs(length(uv-vec2(-0.34,0.26))-0.025);",
    " nd=min(nd,abs(length(uv-vec2(0.34,0.14))-0.025));",
    " nd=min(nd,abs(length(uv-vec2(-0.34,-0.13))-0.025));",
    " nd=min(nd,abs(length(uv-vec2(0.34,-0.25))-0.025));",
    " float nm=smoothstep(0.012,0.002,nd); col+=vec3(0.18,0.95,0.68)*nm*0.9;",
    " col = (col*(2.51*col+0.03))/(col*(2.43*col+0.59)+0.14);",
    " col = clamp(col,0.0,1.0);",
    " col += (hash(vec3(gl_FragCoord.xy,floor(t*30.0)))-0.5)*0.02;",
    " float vis = 1.0 - smoothstep(0.4,0.95,uScroll);",
    " gl_FragColor = vec4(col, vis);",
    "}"
  ].join("\n");

  var PVERT = [
    "precision mediump float;",
    "attribute vec3 aSeed; attribute float aSide;",
    "uniform float uTime; uniform vec2 uRes; uniform float uGather; uniform float uReveal; uniform vec2 uPtr; uniform float uReduce;",
    "varying float vA; varying float vSeed;",
    "void main(){",
    " float t = uReduce>0.5 ? 3.0 : uTime;",
    " float sd=aSeed.x;",
    " float hx=(aSeed.x-0.5)*2.3; float hy=(aSeed.y-0.5)*2.0; ",
    " hx += 0.15*sin(t*0.4+sd*30.0); hy += 0.12*cos(t*0.33+sd*22.0) + 0.04*sin(t*0.9+sd*10.0);",
    " float startX = aSide*1.5;",
    " float x = mix(startX, hx, clamp(uGather,0.0,1.0));",
    " float y = mix(hy*0.4, hy, clamp(uGather,0.0,1.0));",
    " x += aSide*uReveal*0.75*(0.6+0.4*aSeed.z);",
    " x += uPtr.x*0.06*(aSeed.z+0.3); y += -uPtr.y*0.05*(aSeed.z+0.3);",
    " vSeed=sd;",
    " float depth=0.4+0.6*aSeed.z;",
    " vA = (0.15+0.55*aSeed.z) * clamp(uGather*1.2,0.0,1.0) * (1.0-uReveal*0.5);",
    " gl_PointSize = (1.0 + 8.0*aSeed.z*depth) * (uRes.y/900.0);",
    " gl_Position = vec4(x, y, 0.0, 1.0);",
    "}"
  ].join("\n");

  var PFRAG = [
    "precision mediump float;",
    "varying float vA; varying float vSeed;",
    "void main(){",
    " vec2 d=gl_PointCoord-0.5; float r=dot(d,d);",
    " if(r>0.25) discard;",
    " float core=smoothstep(0.25,0.0,r);",
    " vec3 c=mix(vec3(0.10,0.55,0.30), vec3(0.35,0.95,0.6), vSeed);",
    " gl_FragColor=vec4(c, core*vA);",
    "}"
  ].join("\n");

  function compile(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      if (window.console) console.warn("shader error:", gl.getShaderInfoLog(s), src);
      return null;
    }
    return s;
  }
  function program(vsrc, fsrc) {
    var vs = compile(gl.VERTEX_SHADER, vsrc), fs = compile(gl.FRAGMENT_SHADER, fsrc);
    if (!vs || !fs) return null;
    var p = gl.createProgram(); gl.attachShader(p, vs); gl.attachShader(p, fs); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) { if (window.console) console.warn("link error", gl.getProgramInfoLog(p)); return null; }
    return p;
  }

  var prog = program(VERT, FRAG);
  var pprog = program(PVERT, PFRAG);
  if (!prog) { canvas.classList.add("no-webgl"); return; }

  var quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

  var NP = reduce ? 220 : (mobile ? 720 : 1500);
  var pdata = new Float32Array(NP * 4);
  for (var i = 0; i < NP; i++) {
    var a = Math.sin(i * 12.9898) * 43758.5453; a -= Math.floor(a);
    var b = Math.sin(i * 78.233) * 12543.834; b -= Math.floor(b);
    var c = Math.sin(i * 39.425) * 24634.634; c -= Math.floor(c);
    pdata[i * 4] = a; pdata[i * 4 + 1] = b; pdata[i * 4 + 2] = c; pdata[i * 4 + 3] = i % 2 === 0 ? -1 : 1;
  }
  var pbuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, pbuf);
  gl.bufferData(gl.ARRAY_BUFFER, pdata, gl.STATIC_DRAW);

  var U = {
    res: gl.getUniformLocation(prog, "uRes"), time: gl.getUniformLocation(prog, "uTime"),
    ptr: gl.getUniformLocation(prog, "uPtr"), reveal: gl.getUniformLocation(prog, "uReveal"),
    scroll: gl.getUniformLocation(prog, "uScroll"), reduce: gl.getUniformLocation(prog, "uReduce")
  };
  var aP = gl.getAttribLocation(prog, "p");
  var PU = pprog ? {
    time: gl.getUniformLocation(pprog, "uTime"), res: gl.getUniformLocation(pprog, "uRes"),
    gather: gl.getUniformLocation(pprog, "uGather"), reveal: gl.getUniformLocation(pprog, "uReveal"),
    ptr: gl.getUniformLocation(pprog, "uPtr"), reduce: gl.getUniformLocation(pprog, "uReduce")
  } : null;
  var aSeed = pprog ? gl.getAttribLocation(pprog, "aSeed") : -1;
  var aSide = pprog ? gl.getAttribLocation(pprog, "aSide") : -1;

  var DPR = Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.5);
  var W = 0, Hh = 0;
  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.5);
    W = canvas.clientWidth || window.innerWidth;
    Hh = canvas.clientHeight || window.innerHeight;
    canvas.width = Math.max(1, Math.floor(W * DPR));
    canvas.height = Math.max(1, Math.floor(Hh * DPR));
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  resize();

  var state = { scroll: 0, gather: 0, reveal: 0 };
  var target = { scroll: 0, gather: 0, reveal: 0 };
  var ptr = { x: 0, y: 0 }, ptrT = { x: 0, y: 0 };
  if (!reduce) {
    window.addEventListener("pointermove", function (e) {
      ptrT.x = (e.clientX / window.innerWidth - 0.5) * 2;
      ptrT.y = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });
  }

  var running = false, hidden = document.hidden, inView = true, rafId = 0;
  var startT = performance && performance.now ? performance.now() : 0;

  function schedule() {
    if (!running || hidden || !inView || rafId) return;
    rafId = requestAnimationFrame(frame);
  }

  window.addEventListener("resize", function () { resize(); schedule(); }, { passive: true });
  document.addEventListener("visibilitychange", function () {
    hidden = document.hidden;
    if (hidden && rafId) { cancelAnimationFrame(rafId); rafId = 0; }
    else schedule();
  });
  if ("IntersectionObserver" in window) {
    var sceneObserver = new IntersectionObserver(function (entries) {
      inView = entries[0] ? entries[0].isIntersecting : true;
      if (!inView && rafId) { cancelAnimationFrame(rafId); rafId = 0; }
      else schedule();
    }, { rootMargin: "12%" });
    sceneObserver.observe(canvas);
  }

  function frame(now) {
    rafId = 0;
    if (!running) return;
    if (hidden || !inView) return;
    var time = ((now || 0) - startT) / 1000;

    state.scroll += (target.scroll - state.scroll) * 0.08;
    state.gather += (target.gather - state.gather) * 0.06;
    state.reveal += (target.reveal - state.reveal) * 0.07;
    ptr.x += (ptrT.x - ptr.x) * 0.05; ptr.y += (ptrT.y - ptr.y) * 0.05;

    if (state.scroll > 0.98) { gl.clear(gl.COLOR_BUFFER_BIT); if (!reduce && target.scroll < 0.98) schedule(); return; }

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.enableVertexAttribArray(aP);
    gl.vertexAttribPointer(aP, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(U.res, canvas.width, canvas.height);
    gl.uniform1f(U.time, time);
    gl.uniform2f(U.ptr, ptr.x, ptr.y);
    gl.uniform1f(U.reveal, state.reveal);
    gl.uniform1f(U.scroll, state.scroll);
    gl.uniform1f(U.reduce, reduce ? 1 : 0);
    gl.disable(gl.BLEND);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    if (pprog && state.gather > 0.01) {
      gl.useProgram(pprog);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
      gl.bindBuffer(gl.ARRAY_BUFFER, pbuf);
      gl.enableVertexAttribArray(aSeed);
      gl.vertexAttribPointer(aSeed, 3, gl.FLOAT, false, 16, 0);
      gl.enableVertexAttribArray(aSide);
      gl.vertexAttribPointer(aSide, 1, gl.FLOAT, false, 16, 12);
      gl.uniform1f(PU.time, time);
      gl.uniform2f(PU.res, canvas.width, canvas.height);
      gl.uniform1f(PU.gather, state.gather * (1 - state.scroll));
      gl.uniform1f(PU.reveal, state.reveal);
      gl.uniform2f(PU.ptr, ptr.x, ptr.y);
      gl.uniform1f(PU.reduce, reduce ? 1 : 0);
      gl.drawArrays(gl.POINTS, 0, NP);
      gl.disable(gl.BLEND);
    }
    if (!reduce) schedule();
  }

  window.Reactor = {
    setScroll: function (v) { target.scroll = Math.max(0, Math.min(1, v)); if (reduce) state.scroll = target.scroll; schedule(); },
    setGather: function (v) { target.gather = Math.max(0, Math.min(1, v)); if (reduce) state.gather = target.gather; schedule(); },
    setReveal: function (v) { target.reveal = Math.max(0, Math.min(1, v)); if (reduce) state.reveal = target.reveal; schedule(); },
    pause: function () { running = false; if (rafId) { cancelAnimationFrame(rafId); rafId = 0; } },
    resume: function () { if (!running) running = true; schedule(); }
  };
  running = true;
  if (reduce) { target.gather = 1; state.gather = 1; }
  schedule();
})();
