(() => {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const svgNS = 'http://www.w3.org/2000/svg';
  const clamp = (n, low, high) => Math.max(low, Math.min(high, n));
  const refresh = () => window.ScrollTrigger?.refresh();

  // The photograph never translates, scales or captures a native image drag.
  // Pointer position changes light; activation reveals a woven overlay.
  const material = document.querySelector('#fabric-material');
  let lightX = 50, lightY = 50, materialFrame = 0, materialVisible = true;
  function paintLight() {
    materialFrame = 0;
    material.style.setProperty('--fabric-x', `${lightX}%`);
    material.style.setProperty('--fabric-y', `${lightY}%`);
  }
  function queueLight() {
    if (!materialFrame && materialVisible && !document.hidden) materialFrame = requestAnimationFrame(paintLight);
  }
  function centerLight() {
    cancelAnimationFrame(materialFrame); materialFrame = 0;
    lightX = lightY = 50; paintLight();
  }
  material.addEventListener('pointermove', event => {
    if (!fine.matches || reduce.matches || event.pointerType === 'touch' || !materialVisible) return;
    const bounds = material.getBoundingClientRect();
    lightX = clamp((event.clientX - bounds.left) / bounds.width * 100, 0, 100);
    lightY = clamp((event.clientY - bounds.top) / bounds.height * 100, 0, 100);
    queueLight();
  }, {passive: true});
  material.addEventListener('pointerleave', centerLight);
  material.addEventListener('dragstart', event => event.preventDefault());
  material.addEventListener('click', () => {
    const active = material.getAttribute('aria-pressed') !== 'true';
    material.setAttribute('aria-pressed', String(active));
    material.setAttribute('aria-label', active ? 'Вернуть мягкий свет на ткани' : 'Раскрыть переплетение ткани');
    document.querySelector('#fabric-state').textContent = active ? 'Переплетение нитей' : 'Свет на ткани';
    material.querySelector('.fabric-label > span:last-child').textContent = active ? 'Нажмите: вернуть мягкий свет' : 'Нажмите: рассмотреть переплетение';
  });
  material.addEventListener('keydown', event => {
    const steps = {ArrowLeft: [-10,0], ArrowRight: [10,0], ArrowUp: [0,-10], ArrowDown: [0,10]};
    if (!steps[event.key]) return;
    event.preventDefault();
    lightX = clamp(lightX + steps[event.key][0], 0, 100);
    lightY = clamp(lightY + steps[event.key][1], 0, 100);
    // Keyboard positions are discrete even when reduced motion is requested.
    paintLight();
  });
  if (window.IntersectionObserver) new IntersectionObserver(entries => {
    materialVisible = entries[0].isIntersecting;
    if (!materialVisible) centerLight();
  }).observe(material);
  document.addEventListener('visibilitychange', centerLight);
  window.addEventListener('blur', centerLight);
  window.addEventListener('pagehide', centerLight);
  reduce.addEventListener('change', centerLight);

  // A real seam editor. Draw with a mouse/finger, or place a polyline with keys.
  const sketchForm = document.querySelector('#sketch-form');
  const canvas = document.querySelector('#garment-svg');
  const strokesLayer = document.querySelector('#custom-seams');
  const pen = document.querySelector('#seam-pen');
  const modeButton = document.querySelector('#seam-mode');
  const undoButton = document.querySelector('#seam-undo');
  const clearButton = document.querySelector('#seam-clear');
  const styleSelect = document.querySelector('#seam-style');
  const status = document.querySelector('#seam-status');
  const drawings = {dress: [], jacket: [], skirt: []};
  let shape = sketchForm.elements.shape.value;
  let drawingEnabled = false, activeStroke = null, pointerId = null;
  let penX = 200, penY = 240;
  function currentLines() { return drawings[shape]; }
  function updatePen() { pen.setAttribute('transform', `translate(${penX} ${penY})`); }
  function strokeData(line) {
    return line.points.map((point, i) => `${i ? 'L' : 'M'}${point[0].toFixed(1)} ${point[1].toFixed(1)}`).join(' ') + (line.points.length === 1 ? ' l.1 .1' : '');
  }
  function paintLines() {
    strokesLayer.replaceChildren();
    for (const line of currentLines()) {
      const d = strokeData(line);
      for (const edge of [true, false]) {
        const path = document.createElementNS(svgNS, 'path');
        path.setAttribute('d', d); path.setAttribute('fill', 'none');
        path.setAttribute('stroke', edge ? '#202221' : '#fffaf0');
        path.setAttribute('stroke-width', edge ? '6' : '3.2');
        path.setAttribute('stroke-linecap', 'round'); path.setAttribute('stroke-linejoin', 'round');
        if (line.style === 'stitch') path.setAttribute('stroke-dasharray', '7 7');
        strokesLayer.append(path);
      }
    }
    canvas.dataset.seams = String(currentLines().length);
    undoButton.disabled = clearButton.disabled = currentLines().length === 0;
  }
  function finishLine(announce = true) {
    if (!activeStroke) return;
    activeStroke = null;
    if (pointerId !== null && canvas.hasPointerCapture(pointerId)) canvas.releasePointerCapture(pointerId);
    pointerId = null;
    if (announce) status.textContent = `Авторских линий: ${currentLines().length}. Можно добавить следующую, отменить или скачать эскиз.`;
  }
  function beginLine(x, y) {
    if (currentLines().length >= 24) {
      status.textContent = 'На одном силуэте можно добавить 24 линии. Отмените лишнюю или очистите рисунок.';
      return false;
    }
    activeStroke = {style: styleSelect.value, points: [[x, y]]};
    currentLines().push(activeStroke); paintLines();
    return true;
  }
  function appendPoint(x, y, force = false) {
    if (!activeStroke || activeStroke.points.length >= 600) return;
    const last = activeStroke.points[activeStroke.points.length - 1];
    if (!force && Math.hypot(x - last[0], y - last[1]) < 2.5) return;
    activeStroke.points.push([x, y]);
    const lastPath = strokesLayer.lastElementChild, d = strokeData(activeStroke);
    lastPath.setAttribute('d', d); lastPath.previousElementSibling.setAttribute('d', d);
  }
  function coordinates(event) {
    const point = canvas.createSVGPoint(); point.x = event.clientX; point.y = event.clientY;
    const local = point.matrixTransform(canvas.getScreenCTM().inverse());
    return [clamp(local.x, 8, 392), clamp(local.y, 8, 512)];
  }
  modeButton.addEventListener('click', () => {
    finishLine(false);
    drawingEnabled = !drawingEnabled;
    modeButton.setAttribute('aria-pressed', String(drawingEnabled));
    modeButton.textContent = drawingEnabled ? 'Завершить рисование' : 'Рисовать шов';
    canvas.classList.toggle('is-drawing', drawingEnabled);
    status.textContent = drawingEnabled ? 'Перо включено. Ведите по эскизу или используйте стрелки и Enter. Esc завершает текущую линию.' : 'Рисунок сохранён на этом эскизе до закрытия страницы. Можно менять цвет или скачать SVG.';
    if (drawingEnabled) canvas.focus({preventScroll: true});
  });
  canvas.addEventListener('pointerdown', event => {
    if (!drawingEnabled || event.button !== 0 || !event.isPrimary) return;
    event.preventDefault(); canvas.focus({preventScroll: true}); finishLine(false);
    [penX, penY] = coordinates(event); updatePen();
    if (beginLine(penX, penY)) { pointerId = event.pointerId; canvas.setPointerCapture(pointerId); }
  });
  canvas.addEventListener('pointermove', event => {
    if (!drawingEnabled) return;
    [penX, penY] = coordinates(event); updatePen();
    if (event.pointerId === pointerId) appendPoint(penX, penY);
  });
  canvas.addEventListener('pointerup', event => { if (event.pointerId === pointerId) finishLine(); });
  canvas.addEventListener('pointercancel', () => finishLine());
  canvas.addEventListener('lostpointercapture', () => finishLine());
  canvas.addEventListener('keydown', event => {
    if (!drawingEnabled) return;
    const steps = {ArrowLeft: [-1,0], ArrowRight: [1,0], ArrowUp: [0,-1], ArrowDown: [0,1]};
    if (steps[event.key]) {
      event.preventDefault();
      const distance = event.shiftKey ? 20 : 8;
      penX = clamp(penX + steps[event.key][0] * distance, 8, 392);
      penY = clamp(penY + steps[event.key][1] * distance, 8, 512);
      updatePen();
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (event.repeat) return;
      if (activeStroke) appendPoint(penX, penY, true); else beginLine(penX, penY);
      status.textContent = 'Точка поставлена. Стрелки — следующее место, Enter — продолжить, Esc — завершить линию.';
    } else if (event.key === 'Escape') { event.preventDefault(); finishLine(); }
  });
  undoButton.addEventListener('click', () => { finishLine(false); currentLines().pop(); paintLines(); status.textContent = `Последняя линия отменена. Осталось: ${currentLines().length}.`; });
  clearButton.addEventListener('click', () => { finishLine(false); drawings[shape] = []; paintLines(); status.textContent = 'На этом силуэте снова чистое полотно.'; });
  sketchForm.addEventListener('change', event => {
    if (event.target.name !== 'shape') return;
    finishLine(false); shape = sketchForm.elements.shape.value; paintLines();
    status.textContent = `Выбран новый силуэт. Авторских линий на нём: ${currentLines().length}. Рисунки остальных силуэтов сохранены до закрытия страницы.`;
  });
  updatePen(); paintLines();
  let silhouetteSource = null;
  document.querySelector('#seam-download').addEventListener('click', async () => {
    finishLine(false);
    const copy = canvas.cloneNode(true);
    const exportShape = shape;
    const exportColor = getComputedStyle(canvas).getPropertyValue('--fabric-color');
    try {
      if (!silhouetteSource) {
        const response = await fetch('assets/silhouettes.svg');
        if (!response.ok) throw new Error('silhouette asset unavailable');
        silhouetteSource = new DOMParser().parseFromString(await response.text(), 'image/svg+xml');
      }
      const symbol = silhouetteSource.querySelector(`#${exportShape}`);
      if (!symbol) throw new Error('silhouette not found');
      const garment = document.createElementNS(svgNS, 'g');
      for (const child of symbol.children) garment.append(child.cloneNode(true));
      copy.querySelector('use').replaceWith(garment); copy.querySelector('#seam-pen').remove();
      copy.removeAttribute('class'); copy.removeAttribute('tabindex'); copy.removeAttribute('aria-describedby');
      copy.setAttribute('xmlns', svgNS); copy.setAttribute('width', '800'); copy.setAttribute('height', '1040');
      copy.style.setProperty('--fabric-color', exportColor);
      copy.style.color = '#202221'; copy.style.background = '#f4f5ef';
      const blob = new Blob([new XMLSerializer().serializeToString(copy)], {type: 'image/svg+xml;charset=utf-8'});
      const url = URL.createObjectURL(blob), link = document.createElement('a');
      link.href = url; link.download = `rufia-${exportShape}-my-sketch.svg`; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      status.textContent = 'SVG-эскиз подготовлен для скачивания. Его можно приложить к разговору с ателье.';
    } catch (_) { status.textContent = 'Не удалось подготовить файл. Рисунок остался на странице; попробуйте скачать ещё раз.'; }
  });

  // A constrained design challenge: the brief explains why each choice matters.
  const orders = [
    {name: 'Аня', title: 'Весь день по городу.', piece: 'Платье для прогулки', shape: 'dress', task: 'Летняя прогулка до вечера: ткань должна пропускать воздух, крой — оставлять пространство, а телефон хочется положить в карман.', answer: {material:'linen', cut:'loose', detail:'pockets'}, why: {material:'Лён выбран ради воздуха в жаркий день.', cut:'Свободный крой оставляет место для движения.', detail:'Карманы освобождают руки.'}},
    {name: 'Мира', title: 'Двигаться в своём ритме.', piece: 'Юбка для танцев', shape: 'skirt', task: 'Вечер с танцами: нужна эластичная ткань, силуэт по фигуре и заметный акцент на талии. Свобода здесь — в растяжении материала.', answer: {material:'knit', cut:'fitted', detail:'belt'}, why: {material:'Трикотаж тянется вместе с движением.', cut:'Приталенный крой сохраняет выбранный силуэт.', detail:'Пояс подчёркивает талию.'}},
    {name: 'Даша', title: 'Выйти и быть собой.', piece: 'Жакет для выступления', shape: 'jacket', task: 'Важное выступление: материал должен держать форму, плечи — выглядеть чётко, а воротник с лацканами — завершать собранный образ.', answer: {material:'jacquard', cut:'structured', detail:'lapels'}, why: {material:'Жаккард сохраняет заданную форму.', cut:'Структурный крой поддерживает чёткую линию плеч.', detail:'Лацканы завершают характер жакета.'}}
  ];
  const outfitForm = document.querySelector('#workshop-form');
  const outfit = document.querySelector('#workshop-figure');
  const garment = document.querySelector('#workshop-garment');
  const outfitUse = document.querySelector('#workshop-use');
  const detail = document.querySelector('#workshop-detail');
  const feedback = document.querySelector('#workshop-feedback');
  const next = document.querySelector('#workshop-next');
  const check = document.querySelector('#workshop-check');
  const finish = document.querySelector('#workshop-finish');
  const collection = document.querySelector('#workshop-collection');
  const materialNames = {linen:'лён', knit:'трикотаж', jacquard:'жаккард'};
  const cutNames = {loose:'свободный крой', fitted:'приталенный крой', structured:'структурный крой'};
  const detailNames = {pockets:'карманы', belt:'пояс', lapels:'лацканы'};
  const clothColors = {linen:'#d1cfb0', knit:'#ba8084', jacquard:'#b7c6ee'};
  const outlines = {
    dress:'M171 59C177 78 187 91 200 95C213 91 223 78 229 59L251 66C266 71 277 87 282 108L299 151L270 165L248 128L239 205L242 225C251 281 271 351 299 452C277 463 243 470 200 471C157 470 123 463 101 452C129 351 149 281 158 225L161 205L152 128L130 165L101 151L118 108C123 87 134 71 149 66Z',
    skirt:'M140 89C174 96 226 96 260 89L266 119C275 180 291 286 320 429C287 449 246 460 200 460C154 460 113 449 80 429C109 286 125 180 134 119Z',
    jacket:'M169 65C179 72 190 76 200 76C210 76 221 72 231 65L257 79L282 88C298 94 304 107 308 130L342 349L309 360L278 246L277 393C258 411 233 420 214 421L200 404L186 421C167 420 142 411 123 393L122 246L91 360L58 349L92 130C96 107 102 94 118 88L143 79Z'
  };
  let orderIndex = 0, solved = false;
  const made = [];
  function choice() { return Object.fromEntries(new FormData(outfitForm)); }
  function renderOutfit() {
    const order = orders[orderIndex], selected = choice();
    outfitUse.setAttribute('href', `assets/silhouettes.svg#${order.shape}`);
    document.querySelector('#workshop-outline').setAttribute('d', outlines[order.shape]);
    outfit.style.setProperty('--fabric-color', clothColors[selected.material] || '#d9dded');
    const pattern = {linen:'weave', knit:'knit', jacquard:'jacquard'}[selected.material];
    document.querySelector('#workshop-texture').setAttribute('fill', pattern ? `url(#workshop-${pattern})` : 'none');
    const width = {loose:1.12, fitted:.88, structured:1.02}[selected.cut] || 1;
    garment.setAttribute('transform', `translate(${200 - 200 * width} 0) scale(${width} 1)`);
    detail.replaceChildren();
    if (selected.detail) {
      const path = document.createElementNS(svgNS, 'path');
      const waist = order.shape === 'skirt' ? 111 : order.shape === 'jacket' ? 255 : 215;
      const features = {pockets:`M144 ${waist+42}h30v42q-15 17-30 0Z M226 ${waist+42}h30v42q-15 17-30 0Z`, belt:`M140 ${waist-6}Q200 ${waist+12}260 ${waist-6}v15Q200 ${waist+27}140 ${waist+9}Z M195 ${waist+3}l23 32`, lapels:order.shape === 'jacket' ? 'M162 99L195 235L144 179L156 149L137 136Z M238 99L205 235L256 179L244 149L263 136Z' : 'M169 80L196 170L149 126Z M231 80L204 170L251 126Z'};
      path.setAttribute('d', features[selected.detail]); path.setAttribute('fill', '#eff3ff88');
      path.setAttribute('stroke', '#304bc4'); path.setAttribute('stroke-width', '2.5');
      path.setAttribute('stroke-linejoin', 'round'); detail.append(path);
    }
    const description = [materialNames[selected.material], cutNames[selected.cut], detailNames[selected.detail]].filter(Boolean).join(' · ');
    document.querySelector('#workshop-caption').textContent = description || 'Выберите материал, крой и деталь — эскиз сразу изменится.';
    outfit.setAttribute('aria-label', `${order.piece}. ${description || 'Выбор пока не сделан.'}`);
  }
  function showOrder() {
    const order = orders[orderIndex]; solved = false;
    outfitForm.reset(); outfitForm.querySelectorAll('fieldset').forEach(field => field.disabled = false);
    check.hidden = false; next.hidden = true; finish.hidden = true;
    document.querySelector('#workshop-piece').textContent = order.piece;
    document.querySelector('#workshop-count').textContent = `0${orderIndex+1} / 03`;
    document.querySelector('#workshop-client').textContent = `Заказ ${orderIndex+1} · ${order.name}`;
    document.querySelector('#workshop-title').textContent = order.title;
    document.querySelector('#workshop-task').textContent = order.task;
    feedback.className = 'workshop-feedback'; feedback.textContent = 'Найдите три решения, которые отвечают пожеланиям.';
    renderOutfit(); refresh();
  }
  outfitForm.addEventListener('change', () => { if (!solved) renderOutfit(); });
  outfitForm.addEventListener('submit', event => {
    event.preventDefault(); if (solved) return;
    const selected = choice(), order = orders[orderIndex];
    const fields = ['material','cut','detail'];
    const missing = fields.filter(key => !selected[key]);
    if (missing.length) {
      feedback.textContent = 'Сначала выберите материал, крой и главную деталь.';
      outfitForm.querySelector(`input[name="${missing[0]}"]`).focus(); return;
    }
    const correct = fields.filter(key => selected[key] === order.answer[key]);
    if (correct.length < 3) {
      feedback.className = 'workshop-feedback needs-work';
      const hints = {material:'Сравните свойства ткани с пожеланием.', cut:'Сравните свободу и форму силуэта с пожеланием.', detail:'Найдите деталь, которую человек назвал в брифе.'};
      feedback.textContent = `Подошло ${correct.length} из 3. ` + fields.filter(key => !correct.includes(key)).map(key => hints[key]).join(' ');
      return;
    }
    solved = true;
    made.push({...selected, shape:order.shape, piece:order.piece});
    outfitForm.querySelectorAll('fieldset').forEach(field => field.disabled = true);
    check.hidden = true; feedback.className = 'workshop-feedback is-success';
    feedback.textContent = 'Попадание в характер. ' + fields.map(key => order.why[key]).join(' ');
    collection.replaceChildren();
    made.forEach(item => {
      const card = document.createElement('figure');
      const art = document.createElementNS(svgNS, 'svg'); art.setAttribute('viewBox','0 0 400 520'); art.setAttribute('aria-hidden','true');
      art.style.setProperty('--fabric-color', clothColors[item.material]);
      const use = document.createElementNS(svgNS,'use'); use.setAttribute('href',`assets/silhouettes.svg#${item.shape}`); art.append(use);
      const caption = document.createElement('figcaption'); caption.textContent = item.piece;
      card.append(art, caption); collection.append(card);
    });
    if (orderIndex < orders.length - 1) next.hidden = false; else finish.hidden = false;
    refresh();
    const following = next.hidden ? finish.querySelector('a') : next;
    following.focus({preventScroll: true});
    following.scrollIntoView({block:'nearest', behavior:reduce.matches?'instant':'smooth'});
  });
  next.addEventListener('click', () => { if (!solved || orderIndex >= orders.length-1) return; orderIndex++; showOrder(); document.querySelector('#workshop-task').scrollIntoView({block:'center',behavior:reduce.matches?'instant':'smooth'}); outfitForm.querySelector('input').focus({preventScroll:true}); });
  document.querySelector('#workshop-restart').addEventListener('click', () => {
    orderIndex = 0; made.length = 0; collection.textContent = 'Ваша капсула появится здесь'; showOrder();
    outfitForm.querySelector('input').focus({preventScroll:true});
  });
  showOrder();
})();
