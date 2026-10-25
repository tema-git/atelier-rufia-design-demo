(() => {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const refresh = () => window.ScrollTrigger?.refresh();
  const colors = {blue:{name:'ультрамарин',hex:'#304bc4'},graphite:{name:'графит',hex:'#353534'},rose:{name:'пыльная роза',hex:'#a36367'},sage:{name:'шалфей',hex:'#b4bdac'}};
  const shapes = {dress:'Платье',jacket:'Жакет',skirt:'Юбка'};
  const lookForm = document.querySelector('#look-form');
  function lookSummary() {
    const selected = new FormData(lookForm);
    return `${shapes[selected.get('shape')]} · ${colors[selected.get('color')].name} · ${selected.get('occasion').toLowerCase()}`;
  }
  function updateLook() {
    const selected = new FormData(lookForm), color = colors[selected.get('color')];
    document.querySelector('.look-selector').style.setProperty('--fabric-color', color.hex);
    document.querySelector('#look-color-name').value = color.name[0].toUpperCase() + color.name.slice(1);
    document.querySelector('#look-summary').textContent = lookSummary();
  }
  lookForm.addEventListener('change', updateLook);
  lookForm.addEventListener('submit', event => {
    event.preventDefault();
    const idea = document.querySelector('#appointment-idea');
    idea.textContent = `Ваша идея: ${lookSummary()}.`;
    idea.hidden = false;
    // Reopen the demo form if an earlier demonstration was completed.
    document.querySelector('#appointment-success').hidden = true;
    document.querySelector('#appointment-form').hidden = false;
    refresh();
    document.querySelector('#appointment').scrollIntoView({block:'start', behavior:reduce.matches?'instant':'smooth'});
    document.querySelector('#appointment-name').focus({preventScroll:true});
  });
  updateLook();

  const rounds = [
    {name:'Ультрамарин', h:227,s:58,l:48, initial:[206,32,64]},
    {name:'Пыльная роза', h:351,s:28,l:61, initial:[22,48,52]},
    {name:'Шалфей', h:105,s:12,l:65, initial:[157,31,52]}
  ];
  const form = document.querySelector('#color-form');
  const target = document.querySelector('#color-target');
  const own = document.querySelector('#color-own');
  const feedback = document.querySelector('#color-feedback');
  const next = document.querySelector('#color-next');
  const hint = document.querySelector('#color-hint');
  const finish = document.querySelector('#color-finish');
  const check = form.querySelector('button');
  let round = 0, completed = false;
  const scores = [];
  const hsl = (h,s,l) => `hsl(${h} ${s}% ${l}%)`;
  function values() { return {h:Number(form.elements.hue.value),s:Number(form.elements.saturation.value),l:Number(form.elements.lightness.value)}; }
  function hueDelta(a,b) { return ((a-b+540)%360)-180; }
  function difference() {
    const selected=values(), desired=rounds[round];
    return {h:hueDelta(selected.h,desired.h),s:selected.s-desired.s,l:selected.l-desired.l};
  }
  function score() {
    const diff=difference();
    return Math.max(0, Math.round(100-Math.abs(diff.h)*.55-Math.abs(diff.s)*.7-Math.abs(diff.l)*1.25));
  }
  function paintOwn() {
    const v=values(); own.style.setProperty('--sample', hsl(v.h,v.s,v.l));
    document.querySelector('#color-hue-value').value=`${v.h}°`;
    document.querySelector('#color-saturation-value').value=`${v.s}%`;
    document.querySelector('#color-lightness-value').value=`${v.l}%`;
    own.setAttribute('aria-label',`Ваш оттенок: тон ${v.h} градусов, насыщенность ${v.s} процентов, светлота ${v.l} процентов.`);
    document.querySelector('#color-hue').style.setProperty('--range-color', hsl(v.h,70,50));
    document.querySelector('#color-saturation').style.setProperty('--range-color', hsl(v.h,Math.max(35,v.s),v.l));
    document.querySelector('#color-lightness').style.setProperty('--range-color',hsl(v.h,v.s,Math.max(25,Math.min(65,v.l))));
  }
  function feedbackText() {
    const diff=difference();
    const hints=[];
    if(Math.abs(diff.h)>7) hints.push(values().h > rounds[round].h?'Уменьшите значение тона.':'Увеличьте значение тона.');
    if(Math.abs(diff.s)>5) hints.push(diff.s>0?'Цвет слишком насыщенный.':'Добавьте насыщенности.');
    if(Math.abs(diff.l)>4) hints.push(diff.l>0?'Сделайте цвет темнее.':'Сделайте цвет светлее.');
    return hints.join(' ') || 'Очень близко. Немного уточните ползунки.';
  }
  function setRound() {
    const data=rounds[round]; completed=false;
    form.elements.hue.value=data.initial[0]; form.elements.saturation.value=data.initial[1]; form.elements.lightness.value=data.initial[2];
    form.querySelectorAll('input').forEach(input=>input.disabled=false);
    target.style.setProperty('--sample',hsl(data.h,data.s,data.l));
    target.setAttribute('aria-label',`Образец: ${data.name}. Используйте подсказку, если трудно различить оттенки.`);
    document.querySelector('#color-name').textContent=data.name;
    document.querySelector('#color-round').textContent=`Оттенок ${round+1} из 3`;
    document.querySelector('#color-match').textContent='Попробуйте попасть в цвет';
    feedback.textContent='Двигайте ползунки. После сравнения появится точность и направление следующего шага.';
    feedback.classList.remove('is-success');
    document.querySelectorAll('#color-progress span').forEach((item,index)=>{item.classList.toggle('is-done',index<round);item.classList.toggle('is-current',index===round);item.setAttribute('aria-label',`Оттенок ${index+1}${index<round?', готов':index===round?', сейчас':''}`);if(index===round)item.setAttribute('aria-current','step');else item.removeAttribute('aria-current');});
    next.hidden=finish.hidden=true;hint.hidden=check.hidden=false;
    paintOwn(); refresh();
  }
  form.addEventListener('input',()=>{if(!completed)paintOwn();});
  form.addEventListener('submit',event=>{
    event.preventDefault();if(completed)return;
    const accuracy=score();
    document.querySelector('#color-match').textContent=`${accuracy}% совпадения`;
    if(accuracy<90){feedback.textContent=`Совпадение ${accuracy}%. ${feedbackText()}`;return;}
    completed=true;scores.push(accuracy);
    form.querySelectorAll('input').forEach(input=>input.disabled=true);
    check.hidden=hint.hidden=true;feedback.classList.add('is-success');
    feedback.textContent=`Оттенок пойман — ${accuracy}%! ${round<2?'Можно перейти к следующему образцу.':'Все три цвета найдены.'}`;
    document.querySelectorAll('#color-progress span').forEach((item,index)=>{const done=index<=round;item.classList.toggle('is-done',done);item.classList.remove('is-current');item.removeAttribute('aria-current');item.setAttribute('aria-label',`Оттенок ${index+1}${done?', готов':''}`);});
    if(round<2){next.hidden=false;next.focus({preventScroll:true});}else{finish.hidden=false;finish.querySelector('a').focus({preventScroll:true});}
    refresh();
  });
  hint.addEventListener('click',()=>{
    if(completed)return;
    const diff=difference(), data=rounds[round];
    const weights={h:.55,s:.7,l:1.25};
    const key=['h','s','l'].sort((a,b)=>Math.abs(diff[b])*weights[b]-Math.abs(diff[a])*weights[a])[0];
    const fields={h:'hue',s:'saturation',l:'lightness'}, names={h:'Тон',s:'Насыщенность',l:'Светлота'};
    form.elements[fields[key]].value=data[key];paintOwn();
    feedback.textContent=`${names[key]} настроен точно. ${score()>=90?'Теперь нажмите «Сравнить оттенки».':feedbackText()}`;
  });
  next.addEventListener('click',()=>{
    if(!completed||round>=rounds.length-1)return;
    round++;setRound();form.elements.hue.focus({preventScroll:true});
  });
  document.querySelector('#color-restart').addEventListener('click',()=>{round=0;scores.length=0;setRound();form.elements.hue.focus({preventScroll:true});});
  setRound();
})();
