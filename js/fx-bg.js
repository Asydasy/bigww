"use strict";

(function () {
  if (document.documentElement.getAttribute("data-fx") === "off") return;

  const cur = document.createElement("div");
  cur.id = "fx-cursor";
  document.body.appendChild(cur);
  window.addEventListener("pointermove", function (e) {
    if (document.documentElement.getAttribute("data-fx") === "off") return;
    cur.style.transform = "translate(" + e.clientX + "px," + e.clientY + "px)";
  }, { passive: true });

  const stage = document.getElementById("fx-stage") || document.body;
  const canvas = document.createElement("canvas");
  canvas.id = "fx-bg";
  canvas.setAttribute("aria-hidden", "true");
  stage.appendChild(canvas);

  const gl = canvas.getContext("webgl", { antialias: false, alpha: true, powerPreference: "low-power" });
  if (!gl) {
    canvas.classList.add("fx-css-only");
    return;
  }

  const vs = `
    attribute vec2 a;
    void main(){ gl_Position = vec4(a,0.0,1.0); }
  `;
  const fs = `
    precision highp float;
    uniform vec2 u_res;
    uniform float u_time;
    void main(){
      vec2 uv = gl_FragCoord.xy / u_res.xy;
      vec2 p = (uv * 2.0 - 1.0);
      p.x *= u_res.x / max(u_res.y, 1.0);
      float t = u_time * 0.18;
      float n = 0.0;
      vec2 q = p;
      for (int i = 1; i <= 5; i++){
        float fi = float(i);
        q = vec2(
          q.x * cos(t * 0.31 + fi * 0.4) - q.y * sin(t * 0.27),
          q.x * sin(t * 0.19) + q.y * cos(t * 0.22 + fi * 0.2)
        );
        n += abs(sin(q.x * (1.4 + fi * 0.35) + t) * cos(q.y * (1.1 + fi * 0.3) - t * 1.2)) / fi;
      }
      float blob = smoothstep(1.15, 0.25, n);
      float vein = smoothstep(0.85, 0.15, n);
      vec3 col = vec3(0.035, 0.032, 0.055);
      col += vec3(0.48, 0.18, 0.95) * blob * 0.42;
      col += vec3(0.95, 0.08, 0.16) * vein * 0.28;
      col += vec3(0.12, 0.55, 0.7) * pow(1.0 - n * 0.55, 3.0) * 0.08;
      vec2 c = uv - 0.5;
      float vig = clamp(1.15 - dot(c, c) * 2.2, 0.15, 1.0);
      float grain = fract(sin(dot(gl_FragCoord.xy + u_time * 12.0, vec2(12.9898,78.233))) * 43758.5453);
      col = col * vig + grain * 0.035;
      gl_FragColor = vec4(col, 0.72);
    }
  `;

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) return null;
    return s;
  }
  const prog = gl.createProgram();
  const vsh = compile(gl.VERTEX_SHADER, vs);
  const fsh = compile(gl.FRAGMENT_SHADER, fs);
  if (!vsh || !fsh) { canvas.classList.add("fx-css-only"); return; }
  gl.attachShader(prog, vsh);
  gl.attachShader(prog, fsh);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { canvas.classList.add("fx-css-only"); return; }
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "a");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const uRes = gl.getUniformLocation(prog, "u_res");
  const uTime = gl.getUniformLocation(prog, "u_time");

  let w = 0, h = 0, raf = 0, start = performance.now();

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    w = Math.max(1, Math.floor(window.innerWidth * dpr * 0.6));
    h = Math.max(1, Math.floor(window.innerHeight * dpr * 0.6));
    canvas.width = w;
    canvas.height = h;
    gl.viewport(0, 0, w, h);
  }
  resize();
  window.addEventListener("resize", resize, { passive: true });

  // Pętla rysowania stoi, kiedy karta jest w tle. Jedna pętla, nie więcej:
  // wcześniej `frame()` samo prosiło o kolejną klatkę mimo `document.hidden`,
  // a `visibilitychange` dokładało drugą — po kilku przełączeniach kart
  // shader liczył się w kilku równoległych pętlach naraz.
  let chodzi = false;

  function frame(now) {
    if (document.hidden || document.documentElement.getAttribute("data-fx") === "off") {
      chodzi = false;
      return;
    }
    gl.uniform2f(uRes, w, h);
    gl.uniform1f(uTime, (now - start) / 1000);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    raf = requestAnimationFrame(frame);
  }
  function startuj() {
    if (chodzi) return;
    chodzi = true;
    raf = requestAnimationFrame(frame);
  }
  // Po włączeniu efektów z powrotem w Ustawieniach trzeba obudzić pętlę.
  window.fxWake = startuj;
  startuj();
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { cancelAnimationFrame(raf); chodzi = false; }
    else startuj();
  });
})();
