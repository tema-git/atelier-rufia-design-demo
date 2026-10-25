(() => {
  'use strict';
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  function refreshScroll() { if(window.ScrollTrigger) ScrollTrigger.refresh(); }

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
  const hero = document.querySelector('.hero');
  const photo = hero.querySelector('.fabric-frame img');
  const labelMark = hero.querySelector('.hero-label svg');
  reactToPointer(hero, hero, (x, y, enabled) => {
    photo.style.transform = enabled ? `translate(${x * 12}px, ${y * 10}px) scale(1.14) rotate(${x * .6}deg)` : '';
    labelMark.style.transform = enabled ? `rotate(${x * 15}deg) translateY(${y * 8}px)` : '';
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
  const wardrobe = document.querySelector('#sketch');
  reactToPointer(wardrobe, wardrobe, () => {});
  document.querySelectorAll('.look-choice').forEach(card => {
    const illustration = card.querySelector('svg');
    reactToPointer(card, card, (x, y, enabled) => {
      illustration.style.transform = enabled ? `translate(${x * 8}px, ${y * 6}px) rotate(${x * 1.7}deg)` : '';
    });
  });
  const colorStudio = document.querySelector('#line-game');
  reactToPointer(colorStudio, colorStudio, (x, y, enabled) => {
    colorStudio.style.setProperty('--fold-shift', enabled ? `${x * 8}px` : '0px');
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
      gsap.to('.measure-line span', {
        scaleY: .72, transformOrigin: 'center', ease: 'none',
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
