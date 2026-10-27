/* Orr Biologicals / living-cell pointer
   Lightweight, desktop-only decoration. Native text and touch interaction
   remain unchanged; reduced-motion users get the system cursor. */
(() => {
  const finePointer = matchMedia?.("(pointer: fine)").matches;
  const reduced = matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (!finePointer || reduced) return;

  const style = document.createElement("style");
  style.textContent = `
    html.ob-cell-cursor-enabled,html.ob-cell-cursor-enabled a,html.ob-cell-cursor-enabled button,html.ob-cell-cursor-enabled canvas{cursor:none!important}
    html.ob-cell-cursor-enabled input,html.ob-cell-cursor-enabled textarea,html.ob-cell-cursor-enabled select{cursor:auto!important}
    .ob-cell-cursor{position:fixed;z-index:10000;left:0;top:0;width:24px;height:24px;pointer-events:none;opacity:0;transform:translate3d(-50%,-50%,0);transition:opacity 160ms ease;filter:drop-shadow(0 0 8px rgba(200,235,156,.32))}
    .ob-cell-cursor.is-visible{opacity:1}
    .ob-cell-cursor::before{content:"";position:absolute;inset:3px;border:1px solid rgba(200,235,156,.86);border-radius:50%;background:radial-gradient(circle at 36% 32%,rgba(236,255,215,.92) 0 8%,rgba(143,207,143,.76) 28%,rgba(16,57,38,.38) 70%,transparent 72%);box-shadow:inset 0 0 0 2px rgba(3,21,13,.32),0 0 8px rgba(143,207,143,.58);transform:scale(1);transition:transform 180ms ease}
    .ob-cell-cursor.is-active::before{transform:scale(1.35)}
    .ob-cell-cursor::after{content:"";position:absolute;left:11px;top:0;width:2px;height:24px;background:linear-gradient(transparent,rgba(200,235,156,.42),transparent);transform:rotate(41deg);transform-origin:center;opacity:.72}
  `;
  document.head.appendChild(style);
  const cursor = document.createElement("span");
  cursor.className = "ob-cell-cursor";
  cursor.setAttribute("aria-hidden", "true");
  document.body.appendChild(cursor);
  document.documentElement.classList.add("ob-cell-cursor-enabled");

  /* Position follows the pointer instantly: no rAF loop, no transform
     transition, so the cursor must never trail. */
  const onMove = (event) => {
    cursor.style.transform = `translate3d(${event.clientX}px,${event.clientY}px,0) translate(-50%,-50%)`;
    cursor.classList.add("is-visible");
    const interactive = event.target.closest?.("a,button,[role=button],canvas");
    cursor.classList.toggle("is-active", Boolean(interactive));
  };
  const onLeave = () => cursor.classList.remove("is-visible", "is-active");
  window.addEventListener("pointermove", onMove, { passive: true });
  document.addEventListener("mouseleave", onLeave);
})();
