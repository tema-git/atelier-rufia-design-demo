(() => {
  'use strict';
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const form = document.querySelector('#sketch-form');
  const shapes = {dress:{name:'Платье',number:'01'},jacket:{name:'Жакет',number:'02'},skirt:{name:'Юбка',number:'03'}};
  const colors = {blue:{name:'Ультрамарин',hex:'#304bc4'},graphite:{name:'Графит',hex:'#353534'},rose:{name:'Пыльная роза',hex:'#a36367'},sage:{name:'Шалфей',hex:'#b4bdac'}};
  const figure = document.querySelector('#garment-svg');
  let brief = '';
  function update(animate = false) {
    const shape = shapes[form.elements.shape.value];
    const color = colors[form.elements.color.value];
    document.querySelector('#garment-use').setAttribute('href',`assets/silhouettes.svg#${form.elements.shape.value}`);
    figure.style.setProperty('--fabric-color',color.hex);
    figure.setAttribute('aria-label',`Концептуальный эскиз: ${shape.name.toLowerCase()}, цвет ${color.name.toLowerCase()}`);
    document.querySelector('#sketch-number').textContent = shape.number;
    document.querySelector('#color-name').value = color.name;
    document.querySelector('#sketch-caption').textContent = `${shape.name} / ${color.name.toLowerCase()}`;
    if(animate && !reducedMotion.matches && figure.animate) figure.animate([{opacity:.55,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:210,easing:'ease-out'});
  }
  form.elements.note.addEventListener('input', () => { form.elements.note.value = form.elements.note.value.slice(0,160); });
  update();
  form.addEventListener('change', event => {if(['shape','color'].includes(event.target.name))update(true);});
  form.addEventListener('submit', event => {
    event.preventDefault();
    const shape = shapes[form.elements.shape.value], color = colors[form.elements.color.value];
    const note = form.elements.note.value.trim();
    brief = `Здравствуйте! Хочу обсудить индивидуальный пошив.\nСилуэт: ${shape.name.toLowerCase()}.\nЦветовое настроение: ${color.name.toLowerCase()}.\nНазначение: ${form.elements.occasion.value.toLowerCase()}.`+(note?`\nПожелания: ${note}`:'')+'\nПодскажите, пожалуйста, возможность пошива, ориентир по стоимости и удобное время для встречи.';
    document.querySelector('#brief-summary').textContent = brief;
    document.querySelector('#copy-status').textContent = '';
    document.querySelector('#brief-dialog').showModal();
  });
  document.querySelector('#copy-brief').addEventListener('click',async () => {
    let success = false;
    try { await navigator.clipboard.writeText(brief); success = true; } catch (_) {
      const el = document.createElement('textarea');el.value=brief;el.style.position='fixed';el.style.opacity='0';
      document.querySelector('#brief-dialog').append(el);el.select();try{success=document.execCommand('copy');}catch(_){}el.remove();document.querySelector('#copy-brief').focus();
    }
    document.querySelector('#copy-status').textContent = success?'Запрос скопирован. Передайте его ателье удобным способом.':'Автоматическое копирование недоступно. Выделите и скопируйте текст запроса выше.';
  });
  const stitchTable = document.querySelector('.stitch-table');
  const stitchPoints = [...document.querySelectorAll('.stitch-point')];
  const stitchRoute = document.querySelector('.stitch-route');
  const stitchProgress = document.querySelector('.stitch-progress');
  const stitchStatus = document.querySelector('#stitch-status');
  const stitchResult = document.querySelector('#stitch-result');
  const stitchInstruction = document.querySelector('#stitch-instruction');
  const stitchStart = document.querySelector('#stitch-start');
  const stitchNext = document.querySelector('#stitch-next');
  const stitchRestart = document.querySelector('#stitch-restart');
  const stitchSegments = [
    'M216 104', ' Q300 174 384 104', ' Q389 181 420 227.5', ' L360 312',
    ' Q389 417 456 533', ' Q300 576 144 533', ' Q211 417 240 312',
    ' L180 227.5 Q211 181 216 104 Z'
  ];
  let stitched = 0;
  function refreshScroll() { if(window.ScrollTrigger) ScrollTrigger.refresh(); }
  function paintStitches() {
    stitchRoute.setAttribute('d', stitchSegments.slice(0, stitched).join(''));
    stitchPoints.forEach((point, index) => {
      const done = index < stitched, current = stitched > 0 && index === stitched;
      point.classList.toggle('is-done', done);
      point.classList.toggle('is-next', current);
      point.tabIndex = current ? 0 : -1;
      point.setAttribute('aria-label', `Точка ${index + 1}${done ? ', соединена' : current ? ', следующий стежок' : ''}`);
      if(current) point.setAttribute('aria-current','step'); else point.removeAttribute('aria-current');
    });
    document.querySelector('#stitch-count').textContent = stitched;
    stitchProgress.setAttribute('aria-valuenow', stitched);
    stitchProgress.setAttribute('aria-valuetext', `${stitched} из 8 точек`);
    stitchProgress.firstElementChild.style.transform = `scaleX(${stitched / 8})`;
    const complete = stitched === 8;
    stitchTable.classList.toggle('is-complete', complete);
    stitchTable.classList.toggle('has-started', stitched > 0);
    stitchResult.hidden = !complete;
    stitchStart.hidden = stitched > 0;
    stitchNext.hidden = stitched === 0 || complete;
    stitchRestart.hidden = stitched === 0;
    stitchInstruction.textContent = complete ? 'Готово! Вы создали силуэт платья.' : stitched ? `Нажмите светлую точку ${stitched + 1}.` : 'Начните игру — появится первый стежок.';
    stitchNext.setAttribute('aria-label', `Сделать следующий стежок, к точке ${Math.min(8, stitched + 1)}`);
    refreshScroll();
  }
  function focusStitchTarget(target) {
    target.focus({preventScroll: true});
    target.scrollIntoView({block: 'nearest', behavior: 'instant'});
  }
  function startStitches(event, fromPoint = false) {
    if(stitched > 0) return;
    stitched = 2;
    paintStitches();
    stitchStatus.textContent = 'Первый стежок готов: точки 1 и 2 соединены. Продолжите с точки 3 или кнопкой.';
    if(event.detail === 0) focusStitchTarget(fromPoint ? stitchPoints[2] : stitchNext);
  }
  function advanceStitch(event, fromPoint = false) {
    if(stitched === 0 || stitched === 8) return;
    stitched += 1;
    paintStitches();
    stitchStatus.textContent = stitched === 8 ? 'Все 8 точек соединены. Ваше платье готово! Можно начать заново или выбрать цвет в эскизе.' : `Стежок сделан. Соединено ${stitched} из 8 точек. Следующая — ${stitched + 1}.`;
    if(event.detail === 0) focusStitchTarget(stitched === 8 ? stitchRestart : fromPoint ? stitchPoints[stitched] : stitchNext);
  }
  stitchStart.addEventListener('click', event => startStitches(event));
  stitchNext.addEventListener('click', event => advanceStitch(event));
  stitchPoints.forEach((point, index) => point.addEventListener('click', event => {
    if(stitched === 0) {
      if(index === 0) startStitches(event, true);
      else stitchStatus.textContent = 'Сначала нажмите «Начать игру» — мы покажем первый стежок.';
      return;
    }
    if(stitched === 8) return;
    if(index !== stitched) {
      stitchStatus.textContent = `Сейчас нужна светлая точка ${stitched + 1}. Или нажмите «Сделать следующий стежок».`;
      stitchPoints[stitched].classList.remove('is-prompted');
      requestAnimationFrame(() => stitchPoints[stitched]?.classList.add('is-prompted'));
      return;
    }
    advanceStitch(event, true);
  }));
  stitchRestart.addEventListener('click', event => {
    stitched = 0;
    stitchPoints.forEach(point => point.classList.remove('is-prompted'));
    paintStitches();
    stitchStatus.textContent = 'Чистое лекало. Нажмите «Начать игру», чтобы сделать первый стежок.';
    if(event.detail === 0) focusStitchTarget(stitchStart);
  });

  const appointmentForm = document.querySelector('#appointment-form');
  const appointmentName = appointmentForm.elements.name;
  const appointmentPhone = appointmentForm.elements.phone;
  const appointmentSuccess = document.querySelector('#appointment-success');
  function validateAppointmentName() {
    appointmentName.setCustomValidity(appointmentName.value.trim().length < 2 ? 'Введите имя: не менее двух символов.' : '');
  }
  function validateAppointmentPhone() {
    const value = appointmentPhone.value.trim();
    const digits = value.replace(/\D/g, '');
    const valid = /^\+?[\d\s()\-]+$/.test(value) && digits.length >= 10 && digits.length <= 15 && !/^(\d)\1+$/.test(digits);
    appointmentPhone.setCustomValidity(valid ? '' : 'Введите корректный телефон: от 10 до 15 цифр, можно с +, пробелами и скобками.');
  }
  appointmentName.addEventListener('input', validateAppointmentName);
  appointmentPhone.addEventListener('input', validateAppointmentPhone);
  appointmentForm.addEventListener('submit', event => {
    event.preventDefault();
    validateAppointmentName(); validateAppointmentPhone();
    if(!appointmentForm.reportValidity()) return;
    const callback = appointmentForm.elements.request.value === 'callback';
    document.querySelector('#appointment-success-copy').textContent = callback ? 'Вы выбрали обратный звонок. Демозаявка никуда не отправлена.' : 'Вы выбрали запись в ателье. Демозаявка никуда не отправлена.';
    appointmentForm.reset(); appointmentName.setCustomValidity(''); appointmentPhone.setCustomValidity('');
    appointmentForm.hidden = true;
    appointmentSuccess.hidden = false;
    appointmentSuccess.focus({preventScroll: true});
    appointmentSuccess.scrollIntoView({block:'nearest',behavior:'instant'});
    refreshScroll();
  });
  appointmentForm.querySelector('[type="submit"]').disabled = false;
  document.querySelector('#appointment-reset').addEventListener('click', () => {
    appointmentSuccess.hidden = true;
    appointmentForm.hidden = false;
    appointmentForm.reset();
    appointmentName.setCustomValidity(''); appointmentPhone.setCustomValidity('');
    appointmentName.focus();
    refreshScroll();
  });

  const menuButton=document.querySelector('.menu-toggle'),nav=document.querySelector('#navigation');
  function closeMenu(){nav.classList.remove('is-open');menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','Открыть меню');}
  menuButton.addEventListener('click',()=>{const open=menuButton.getAttribute('aria-expanded')!=='true';nav.classList.toggle('is-open',open);menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'Закрыть меню':'Открыть меню');if(open)nav.querySelector('a').focus();});
  nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
  document.querySelector('.header-contact').addEventListener('click',closeMenu);
  document.addEventListener('keydown',event=>{if(event.key==='Escape' && nav.classList.contains('is-open')){closeMenu();menuButton.focus();}});
  document.querySelectorAll('[data-demo]').forEach(button=>button.addEventListener('click',()=>document.querySelector('#demo-dialog').showModal()));
  document.querySelectorAll('dialog').forEach(dialog=>{dialog.querySelector('[data-close]').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',event=>{if(event.target===dialog){const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();}});});
  function setupPointerMotion() {
  const pointerMedia = matchMedia('(hover: hover) and (pointer: fine)');
  function reactToPointer(surface, decoration, render) {
    let x = 0, y = 0, targetX = 0, targetY = 0, frame = 0, lastTime = 0;
    let bounds = null, visible = false;
    function allowed() { return pointerMedia.matches && !reducedMotion.matches && !document.hidden; }
    function settleImmediately() {
      if(frame) cancelAnimationFrame(frame);
      frame = 0; lastTime = 0; x = y = targetX = targetY = 0;
      decoration.classList.remove('is-moving');
      surface.classList.remove('has-pointer');
      surface.style.setProperty('--pointer-x', '50%');
      surface.style.setProperty('--pointer-y', '50%');
      decoration.classList.toggle('is-reactive', allowed());
      render(0, 0, allowed());
    }
    function tick(time) {
      frame = 0;
      if(!allowed() || !visible) { settleImmediately(); return; }
      const step = lastTime ? Math.min((time - lastTime) / 16.67, 3) : 1;
      lastTime = time;
      const blend = 1 - Math.pow(.82, step);
      x += (targetX - x) * blend; y += (targetY - y) * blend;
      surface.style.setProperty('--pointer-x', `${(x + 1) * 50}%`);
      surface.style.setProperty('--pointer-y', `${(y + 1) * 50}%`);
      render(x, y, true);
      if(Math.abs(targetX - x) + Math.abs(targetY - y) > .002) {
        frame = requestAnimationFrame(tick);
      } else {
        x = targetX; y = targetY; render(x, y, true);
        decoration.classList.remove('is-moving'); lastTime = 0;
      }
    }
    function schedule() {
      if(!frame && allowed() && visible) {
        decoration.classList.add('is-moving');
        frame = requestAnimationFrame(tick);
      }
    }
    function move(event) {
      if(!allowed() || !visible || event.pointerType === 'touch') return;
      if(!bounds) bounds = surface.getBoundingClientRect();
      targetX = Math.max(-1, Math.min(1, (event.clientX - bounds.left) / bounds.width * 2 - 1));
      targetY = Math.max(-1, Math.min(1, (event.clientY - bounds.top) / bounds.height * 2 - 1));
      schedule();
    }
    surface.addEventListener('pointerenter', event => { surface.classList.toggle('has-pointer', allowed()); bounds = surface.getBoundingClientRect(); move(event); });
    surface.addEventListener('pointermove', move, {passive:true});
    surface.addEventListener('pointerleave', () => { surface.classList.remove('has-pointer'); targetX = targetY = 0; schedule(); });
    surface.addEventListener('pointercancel', settleImmediately);
    window.addEventListener('scroll', () => { bounds = null; }, {passive:true});
    window.addEventListener('resize', () => { bounds = null; settleImmediately(); }, {passive:true});
    window.addEventListener('blur', settleImmediately);
    window.addEventListener('pagehide', settleImmediately);
    document.addEventListener('visibilitychange', settleImmediately);
    reducedMotion.addEventListener('change', settleImmediately);
    pointerMedia.addEventListener('change', settleImmediately);
    const observer = new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      if(!visible) settleImmediately();
    });
    observer.observe(surface);
    settleImmediately();
  }
  const fabricFrame = document.querySelector('.fabric-frame');
  const fabricPhoto = fabricFrame.querySelector('img');
  const fabricThread = fabricFrame.querySelector('.fabric-thread path');
  const fabricNeedle = fabricFrame.querySelector('.fabric-needle');
  reactToPointer(document.querySelector('.hero'), fabricFrame, (x, y, enabled) => {
    fabricPhoto.style.transform = enabled ? `translate3d(${x * 23}px, ${y * 18}px, 0) scale(1.1) rotate(${x * 1.2}deg)` : '';
    fabricNeedle.style.transform = `translate(calc(-50% + ${x * 100}px), calc(-50% + ${y * 140}px)) rotate(${x * 9}deg)`;
    const centerX = 300 + x * 125, centerY = 375 + y * 150;
    fabricThread.setAttribute('d',`M75 0 Q${480 + x * 80} ${260 + y * 90} ${centerX} ${centerY} T525 750`);
  });
  const approach = document.querySelector('#approach');
  const approachThread = approach.querySelector('.approach-thread path');
  reactToPointer(approach, approach, (x, y) => {
    approachThread.setAttribute('d', `M0 130 C${180 + x * 75} ${130 + y * 45} ${195 + x * 90} ${25 - y * 36} ${350 + x * 70} ${38 + y * 36} S${550 - x * 70} ${168 - y * 32} ${680 + x * 35} ${80 + y * 20} S820 38 900 60`);
  });
  document.querySelectorAll('.principle-grid article').forEach(article => {
    const art = article.querySelector('.principle-art');
    reactToPointer(article, article, (x, y, enabled) => {
      art.style.translate = enabled ? `${x * 17}px ${y * 13}px` : '';
      art.style.rotate = enabled ? `${x * 12}deg` : '';
    });
  });
  const sketch = document.querySelector('#sketch');
  const sketchBoard = sketch.querySelector('.sketch-board');
  const pencil = sketch.querySelector('.sketch-pencil');
  reactToPointer(sketch, sketch, (x, y, enabled) => {
    figure.style.translate = enabled ? `${x * 15}px ${y * 10}px` : '';
    figure.style.rotate = enabled ? `${x * 2.5}deg` : '';
    sketchBoard.style.backgroundPosition = enabled ? `${x * 9}px ${y * 9}px` : '';
    pencil.style.transform = `translate(${x * 28}px, ${y * 75}px) rotate(${16 + x * 13}deg)`;
  });
  const stitchStage = document.querySelector('.stitch-stage');
  const stitchRuler = document.querySelector('.stitch-ruler');
  const companionThread = document.querySelector('.companion-thread path');
  reactToPointer(document.querySelector('#line-game'), stitchStage, (x, y) => {
    stitchRuler.style.transform = `translateY(${y * 150}px) rotate(${x * 7}deg)`;
    companionThread.setAttribute('d', `M0 90 C${90 + x * 35} ${90 + y * 25} ${60 - x * 20} ${15 + y * 20} ${150 + x * 25} ${40 + y * 25} S${220 - x * 25} ${130 - y * 30} 320 35`);
  });
  const contact = document.querySelector('#contact');
  const contactThread = contact.querySelector('.contact-thread path');
  const contactNeedle = contact.querySelector('.contact-thread circle');
  reactToPointer(contact, contact, (x, y) => {
    const cx = 230 + x * 85, cy = 65 + y * 40;
    contactThread.setAttribute('d', `M0 120 C${100 + x * 30} 120 ${125 + x * 70} ${15 - y * 25} ${cx} ${cy} S${360 - x * 70} ${160 - y * 30} 500 35`);
    contactNeedle.setAttribute('cx', cx);
    contactNeedle.setAttribute('cy', cy);
  });
  const footer = document.querySelector('.footer');
  const footerThread = footer.querySelector('.footer-thread');
  reactToPointer(footer, footer, (x, y, enabled) => {
    footerThread.style.transform = enabled ? `translateX(${x * 60}px) rotate(${x * 3}deg) scaleX(${1 + Math.abs(y) * .2})` : '';
  });

  }
  if (window.IntersectionObserver) setupPointerMotion();
  if(window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    const scrollMotion = gsap.matchMedia();
    scrollMotion.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.to('.fabric-frame', {
        y: -32, ease: 'none',
        scrollTrigger: {trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true}
      });
      const thread = document.querySelector('.approach-thread path');
      if(thread) {
        const length = thread.getTotalLength();
        gsap.fromTo(thread, {strokeDasharray: length, strokeDashoffset: length}, {
          strokeDashoffset: 0, ease: 'none',
          scrollTrigger: {trigger: '#approach', start: 'top 80%', end: 'center 35%', scrub: true}
        });
      }
    });
    if(document.fonts) document.fonts.ready.then(refreshScroll);
    window.addEventListener('load', refreshScroll, {once:true});
  }
})();
