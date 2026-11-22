'use strict';

// Contacts live in index.html, so they also work without JavaScript.
const motionButton = document.querySelector('.motion-toggle');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let userPaused = false;
let heroVisible = true;
function updateMotion() {
  const active = !userPaused && !reducedMotion.matches && !document.hidden && heroVisible;
  document.documentElement.classList.toggle('motion-active', active);
  const allowed = !userPaused && !reducedMotion.matches && !document.hidden;
  document.documentElement.classList.toggle('brand-motion', allowed);
  document.querySelectorAll('[data-global-motion]').forEach(button => {
    button.hidden = reducedMotion.matches;
    button.setAttribute('aria-pressed',String(userPaused));
    button.textContent = userPaused ? 'Retomar animações ▷' : 'Pausar animações Ⅱ';
  });
  if (typeof document.dispatchEvent === 'function') document.dispatchEvent(new Event('brand-motion-change'));
  motionButton.hidden = reducedMotion.matches;
  motionButton.setAttribute('aria-pressed', String(userPaused));
  motionButton.textContent = userPaused ? 'Retomar movimento ▷' : 'Pausar movimento Ⅱ';
}
motionButton.addEventListener('click', () => { userPaused = !userPaused; updateMotion(); });
reducedMotion.addEventListener('change', updateMotion);
document.addEventListener('visibilitychange', updateMotion);
if (typeof IntersectionObserver !== 'undefined') {
  const observer = new IntersectionObserver(([entry]) => { heroVisible = entry.isIntersecting; updateMotion(); });
  observer.observe(document.querySelector('.hero'));
}
document.querySelectorAll('[data-global-motion]').forEach(button => button.addEventListener('click',()=>{userPaused=!userPaused;updateMotion();}));
updateMotion();

const lightbox = document.querySelector('.lightbox');
if (lightbox && typeof lightbox.showModal === 'function') {
  const image = lightbox.querySelector('img');
  const caption = lightbox.querySelector('p');
  lightbox.querySelector('.lightbox-close').addEventListener('click', () => lightbox.close());
  lightbox.addEventListener('click', (event) => { if (event.target === lightbox) lightbox.close(); });
  document.querySelectorAll('[data-gallery]').forEach((link) => {
    link.addEventListener('click', (event) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
      event.preventDefault();
      image.src = link.href;
      image.alt = link.querySelector('img').alt;
      caption.textContent = link.dataset.caption;
      lightbox.showModal();
    });
  });
}

// Manual navigation only: the portfolio never rotates on its own.
const wheel = document.querySelector('.portfolio-wheel');
if (wheel) {
  const ring = wheel.querySelector('.work-grid');
  const works = [...ring.querySelectorAll('.work')];
  const desktopWheel = window.matchMedia('(min-width: 1200px)');
  let selected = 0;
  let rotation = 0;
  const title = wheel.querySelector('[data-wheel-title]');
  const category = wheel.querySelector('[data-wheel-category]');
  const count = wheel.querySelector('[data-wheel-count]');
  function updateWheel() {
    wheel.classList.toggle('wheel-enhanced', desktopWheel.matches);
    wheel.querySelector('.wheel-controls').hidden = !desktopWheel.matches;
    wheel.querySelector('.wheel-help').hidden = !desktopWheel.matches;
    ring.style.setProperty('--wheel-angle', rotation * -60 + 'deg');
    works.forEach((work, index) => {
      const distance = Math.min((index-selected+works.length)%works.length,(selected-index+works.length)%works.length);
      work.style.setProperty('--card-angle', index*60 + 'deg');
      work.style.setProperty('--card-opacity', distance === 0 ? '1' : distance === 1 ? '.8' : '.25');
      work.tabIndex = !desktopWheel.matches || index === selected ? 0 : -1;
      if (index === selected) work.setAttribute('aria-current','true');
      else work.removeAttribute('aria-current');
    });
    title.textContent = works[selected].dataset.caption;
    category.textContent = works[selected].dataset.category;
    count.textContent = String(selected+1).padStart(2,'0') + ' / ' + String(works.length).padStart(2,'0');
  }
  function stepWheel(step) {
    rotation += step;
    selected = ((rotation % works.length) + works.length) % works.length;
    updateWheel();
  }
  wheel.querySelector('[data-wheel-prev]').addEventListener('click', () => stepWheel(-1));
  wheel.querySelector('[data-wheel-next]').addEventListener('click', () => stepWheel(1));
  wheel.addEventListener('keydown', (event) => {
    if (!desktopWheel.matches || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return;
    event.preventDefault();
    const wasProject = event.target.matches('[data-gallery]');
    stepWheel(event.key === 'ArrowLeft' ? -1 : 1);
    if (wasProject) works[selected].focus({preventScroll:true});
  });
  desktopWheel.addEventListener('change',updateWheel);
  updateWheel();
}

// One scheduled frame per scroll/resize event; no scroll interception or idle loop.
(function setupScrollExperience() {
  const hero = document.querySelector('.hero');
  const journey = document.querySelector('.brand-trajectory');
  if (!hero || !journey || !window.requestAnimationFrame) return;
  const root = document.documentElement;
  const route = journey.querySelector('[data-process-route]');
  const marker = journey.querySelector('.trajectory-marker');
  const nodes = [...journey.querySelectorAll('.trajectory-node')];
  const steps = [...document.querySelectorAll('.process-grid li')];
  const readout = journey.querySelector('[data-process-readout]');
  const routeLength = route.getTotalLength();
  const clamp = (value) => Math.min(1,Math.max(0,value));
  nodes.forEach((node,index) => {
    const point = route.getPointAtLength(routeLength * index / (nodes.length-1));
    node.setAttribute('transform', 'translate('+point.x+' '+point.y+')');
  });
  let pendingFrame = 0;
  function updateExperience() {
    pendingFrame = 0;
    if (document.hidden) return;
    const still = reducedMotion.matches || userPaused;
    root.classList.toggle('experience-still',still);
    const vh = window.innerHeight;
    document.querySelectorAll('[data-reader]').forEach(reader=>{
      const rect=reader.querySelector('.reader-stage').getBoundingClientRect();
      const open=still?1:clamp((vh*.95-rect.top)/(vh*.65));
      reader.style.setProperty('--fold-open',String(open));
    });
    const heroRect = hero.getBoundingClientRect();
    const heroProgress = clamp(-heroRect.top / Math.max(1,heroRect.height*.65));
    hero.style.setProperty('--dust-opacity',still ? '0' : String(.38*(1-heroProgress)));
    hero.style.setProperty('--dust-shift',still ? '0px' : -heroProgress*70+'px');
    hero.style.setProperty('--ambient-shift',still ? '0px' : -heroProgress*24+'px');
    const rect = journey.getBoundingClientRect();
    const progress = still ? 1 : clamp((vh*.88-rect.top)/(vh*.65+rect.height*.2));
    const current = Math.min(3,Math.floor(progress*3));
    journey.style.setProperty('--route-offset',String(1-progress));
    const point = route.getPointAtLength(routeLength*progress);
    marker.setAttribute('transform','translate('+point.x+' '+point.y+')');
    readout.textContent = String(current+1).padStart(2,'0')+' / 04';
    nodes.forEach((node,index) => {
      node.classList.toggle('is-current',!still && index===current);
      node.classList.toggle('is-reached',still || index<=current);
      steps[index].classList.toggle('is-current',!still && index===current);
    });
    root.style.setProperty('--reading-progress',String(clamp(window.scrollY/Math.max(1,root.scrollHeight-vh))));
  }
  function scheduleExperience() {
    if (!pendingFrame) pendingFrame = window.requestAnimationFrame(updateExperience);
  }
  window.addEventListener('scroll',scheduleExperience,{passive:true});
  window.addEventListener('resize',scheduleExperience);
  document.addEventListener('visibilitychange',scheduleExperience);
  reducedMotion.addEventListener('change',scheduleExperience);
  motionButton.addEventListener('click',scheduleExperience);
  document.addEventListener('brand-motion-change',scheduleExperience);
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.dataset.reveal = 'shown';
        revealObserver.unobserve(entry.target);
      });
    },{rootMargin:'0px 0px -30px 0px'});
    document.querySelectorAll('.section-heading,.service,.intro-copy,.about-grid > div:last-child,.contact .wrap').forEach((element) => {
      element.dataset.reveal = reducedMotion.matches || element.getBoundingClientRect().top < window.innerHeight-30 ? 'shown' : 'pending';
      if (element.dataset.reveal === 'pending') revealObserver.observe(element);
    });
  }
  root.classList.add('experience-ready');
  updateExperience();
})();

// The original PDFs remain available; previews load only the selected full-size page.
const documentsData = document.querySelector('#portfolio-documents');
if (documentsData) {
  const documents = JSON.parse(documentsData.textContent);
  document.querySelectorAll('[data-reader]').forEach(reader => {
    let key = reader.dataset.reader;
    let current = 0;
    const image = reader.querySelector('[data-reader-image]');
    const zoom = reader.querySelector('[data-reader-zoom]');
    const stage = reader.querySelector('.reader-stage');
    const thumbs = reader.querySelector('.reader-thumbs');
    zoom.classList.add('accordion-current');
    // Blurred copy of the current page tints the stage with the project's own colours.
    const ambient = document.createElement('img');
    ambient.className = 'reader-ambient';
    ambient.alt = '';
    ambient.setAttribute('aria-hidden','true');
    stage.prepend(ambient);
    const leaves=[-1,1].map(direction=>{
      const button=document.createElement('button');button.type='button';
      button.className='accordion-leaf '+(direction<0?'leaf-prev':'leaf-next');
      button.setAttribute('aria-label',direction<0?'Ver página anterior':'Ver próxima página');
      const img=document.createElement('img');img.alt='';img.decoding='async';img.loading='lazy';button.append(img);
      button.addEventListener('click',()=>showPage(current+direction));stage.append(button);return button;
    });
    if(typeof IntersectionObserver!=='undefined')new IntersectionObserver(entries=>entries.forEach(entry=>entry.target.classList.toggle('is-visible',entry.isIntersecting))).observe(reader);
    else reader.classList.add('is-visible');
    const previous = reader.querySelector('[data-reader-prev]');
    const next = reader.querySelector('[data-reader-next]');
    const status = reader.querySelector('[data-reader-status]');
    function showPage(index,animate=true) {
      const doc = documents[key];
      const bounded = Math.max(0,Math.min(doc.pages.length-1,index));
      const direction = bounded < current ? 'turn-prev' : 'turn-next';
      current = bounded;
      const page = doc.pages[current];
      stage.classList.remove('turn-prev','turn-next');
      if(animate && !userPaused && !reducedMotion.matches) {void stage.offsetWidth;stage.classList.add(direction);}
      image.src = page.src;
      ambient.src = page.src;
      image.alt = doc.title + ', página original ' + page.sourcePage;
      zoom.href = page.src;
      leaves.forEach((button,i)=>{
        const index=current+(i===0?-1:1);button.hidden=index<0||index>=doc.pages.length;
        if(!button.hidden)button.querySelector('img').src=doc.pages[index].src;
      });
      zoom.setAttribute('aria-label','Ampliar '+image.alt);
      status.textContent = String(current+1).padStart(2,'0')+' / '+String(doc.pages.length).padStart(2,'0');
      previous.disabled = current===0;
      next.disabled = current===doc.pages.length-1;
      reader.querySelector('[data-reader-origin]').textContent = (doc.format==='image'?'Prancha de identidade visual · ':doc.kind==='identity'?'Prévia selecionada · Página original ':'Página original ')+page.sourcePage+' de '+doc.totalPages;
      reader.querySelector('[data-reader-pdf]').href = doc.pdf;
      reader.querySelector('[data-reader-pdf]').textContent = doc.format==='image'?'Ver identidade completa ↗':'Ver PDF completo ↗';
      thumbs.querySelectorAll('button').forEach((button,i)=>button.setAttribute('aria-current',String(i===current)));
    }
    function selectDocument(nextKey) {
      key=nextKey;current=0;reader.dataset.reader=key;
      reader.querySelectorAll('[data-document]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.document===key)));
      thumbs.replaceChildren();
      documents[key].pages.forEach((page,index)=>{
        const button=document.createElement('button');
        button.type='button';button.setAttribute('aria-label','Ver página original '+page.sourcePage);
        const thumb=document.createElement('img');thumb.src=page.thumb;thumb.alt='';thumb.loading='lazy';thumb.width=90;thumb.height=70;
        button.append(thumb);button.addEventListener('click',()=>showPage(index));thumbs.append(button);
      });
      thumbs.scrollLeft=0;showPage(0,false);
    }
    reader.querySelectorAll('[data-document]').forEach(button=>button.addEventListener('click',()=>selectDocument(button.dataset.document)));
    previous.addEventListener('click',()=>showPage(current-1));
    next.addEventListener('click',()=>showPage(current+1));
    reader.addEventListener('keydown',event=>{
      if(event.target.closest('.document-tabs')||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
      event.preventDefault();
      showPage(event.key==='Home'?0:event.key==='End'?documents[key].pages.length-1:current+(event.key==='ArrowRight'?1:-1));
    });
    let touchStart;
    stage.addEventListener('touchstart',event=>{touchStart=event.touches.length===1?{x:event.touches[0].clientX,y:event.touches[0].clientY}:null;},{passive:true});
    stage.addEventListener('touchend',event=>{
      if(!touchStart)return;
      const dx=event.changedTouches[0].clientX-touchStart.x;
      const dy=event.changedTouches[0].clientY-touchStart.y;
      if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.4)showPage(current+(dx<0?1:-1));
      touchStart=null;
    },{passive:true});
    image.addEventListener('error',()=>{status.textContent='Imagem indisponível. Abra o PDF completo.';});
    zoom.addEventListener('click',event=>{
      if(!lightbox||typeof lightbox.showModal!=='function'||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||event.button!==0)return;
      event.preventDefault();const large=lightbox.querySelector('img');large.src=image.src;large.alt=image.alt;
      lightbox.querySelector('p').textContent=image.alt;lightbox.showModal();
    });
    selectDocument(key);
  });
}
const footerCharacter = document.querySelector('.footer-character');
if(footerCharacter) {
  if(typeof IntersectionObserver!=='undefined')new IntersectionObserver(entries=>entries.forEach(entry=>entry.target.classList.toggle('is-visible',entry.isIntersecting))).observe(footerCharacter);
  else footerCharacter.classList.add('is-visible');
}

// Sprite playback is suspended offscreen and by the shared motion preference.
const lionCharacter=document.querySelector('.curl-sprite');
if(lionCharacter){
 if(typeof IntersectionObserver!=='undefined')new IntersectionObserver(entries=>entries.forEach(entry=>entry.target.classList.toggle('is-visible',entry.isIntersecting))).observe(lionCharacter);
 else lionCharacter.classList.add('is-visible');
}

// V6 premium motion: masked line reveals, image wipes, counters, cursor light and magnetic CTAs.
// Hidden start states exist only under .fx-ready, which is set when motion is allowed at load.
(function setupPremiumMotion() {
  const root = document.documentElement;
  const canMove = () => root.classList.contains('brand-motion');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  if (!('IntersectionObserver' in window)) return;

  // Wrap each line (split at direct <br> children) in an overflow mask.
  function splitLines(heading) {
    const lines = [[]];
    [...heading.childNodes].forEach(node => {
      if (node.nodeName === 'BR') lines.push([]);
      else lines[lines.length-1].push(node);
    });
    heading.replaceChildren(...lines.filter(nodes => nodes.some(node => node.textContent.trim())).map((nodes,index) => {
      const mask = document.createElement('span');
      const inner = document.createElement('span');
      mask.className = 'fx-line';
      inner.style.setProperty('--i',index);
      inner.append(...nodes);
      mask.append(inner);
      return mask;
    }));
  }

  const inView = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-in');
    inView.unobserve(entry.target);
  }),{rootMargin:'0px 0px -12% 0px'});

  const motionAtLoad = !reducedMotion.matches && !userPaused;
  const hero = document.querySelector('.hero');
  splitLines(hero.querySelector('h1'));
  document.querySelectorAll('.section-heading h2,.about h2,.intro h2,.digital h2,.mascot-content h2,.faq h2,.contact h2,.footer-statement h2').forEach(heading => {
    splitLines(heading);
    heading.classList.add('fx-split');
    inView.observe(heading);
  });
  document.querySelectorAll('.about-image,.digital-visual,.ebook-grid a>div,.shirt-grid a>div,.b2b-grid a>div').forEach(element => {
    element.dataset.fx = 'wipe';
    inView.observe(element);
  });

  if (motionAtLoad) {
    root.classList.add('fx-ready','fx-intro');
    [...hero.querySelectorAll('.hero-content>:not(h1),.hero-bottom')].forEach((element,index) => element.style.setProperty('--d',index));
    void hero.offsetWidth; // commit the start state; no frame callback needed, so hidden tabs never get stuck
    root.classList.add('fx-intro-play');
  }

  // Numbers count up once, ending on the exact original text.
  document.querySelectorAll('.experience-facts strong').forEach(strong => {
    const original = strong.textContent;
    const target = parseInt(original,10);
    if (!motionAtLoad || !target) return;
    const suffix = original.replace(String(target),'');
    strong.textContent = '0' + suffix;
    new IntersectionObserver((entries,observer) => {
      if (!entries[0].isIntersecting) return;
      observer.disconnect();
      const start = performance.now();
      const step = now => {
        const t = Math.min(1,(now-start)/2000);
        strong.textContent = (t === 1 || !canMove() ? target : Math.round(target*(1-Math.pow(2,-10*t)))) + suffix;
        if (t < 1 && canMove()) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      setTimeout(() => { strong.textContent = original; },2200); // never leave a partial number
    }).observe(strong);
  });

  document.querySelectorAll('.marquee,.shirts-words,.products,.b2b').forEach(band => {
    new IntersectionObserver(entries => band.classList.toggle('is-visible',entries[0].isIntersecting)).observe(band);
  });

  // About: DANTAS rows and portrait drift apart with scroll (--p, -1..1) and lean toward the pointer (--mx/--my).
  const about = document.querySelector('.about.office-about');
  if (about) {
    let aboutFrame = 0;
    const updateAbout = () => {
      aboutFrame = 0;
      if (!canMove()) return;
      const rect = about.getBoundingClientRect();
      const p = (rect.top + rect.height/2 - innerHeight/2) / (innerHeight/2 + rect.height/2);
      about.style.setProperty('--p',Math.max(-1,Math.min(1,p)).toFixed(3));
    };
    window.addEventListener('scroll',() => { if (!aboutFrame) aboutFrame = requestAnimationFrame(updateAbout); },{passive:true});
    updateAbout();
    if (finePointer.matches) {
      about.addEventListener('pointermove',event => {
        if (!canMove()) return;
        const rect = about.getBoundingClientRect();
        about.classList.add('is-tracking');
        about.style.setProperty('--mx',((event.clientX-rect.left)/rect.width*2-1).toFixed(3));
        about.style.setProperty('--my',((event.clientY-rect.top)/rect.height*2-1).toFixed(3));
      });
      about.addEventListener('pointerleave',() => {
        about.style.setProperty('--mx','0');
        about.style.setProperty('--my','0');
      });
    }
  }

  if (!finePointer.matches) return;

  // Amber light that trails the pointer; the loop stops once it settles.
  const glow = document.createElement('div');
  glow.className = 'cursor-glow';
  glow.setAttribute('aria-hidden','true');
  document.body.append(glow);
  let targetX = innerWidth/2, targetY = innerHeight/2, glowX = targetX, glowY = targetY, glowFrame = 0;
  function moveGlow() {
    glowX += (targetX-glowX)*.14;
    glowY += (targetY-glowY)*.14;
    glow.style.transform = 'translate3d('+glowX+'px,'+glowY+'px,0)';
    glowFrame = Math.abs(targetX-glowX)+Math.abs(targetY-glowY) > .5 && canMove() ? requestAnimationFrame(moveGlow) : 0;
  }
  window.addEventListener('pointermove',event => {
    targetX = event.clientX; targetY = event.clientY;
    root.classList.add('cursor-on');
    if (!glowFrame && canMove()) glowFrame = requestAnimationFrame(moveGlow);
  },{passive:true});
  document.addEventListener('pointerleave',() => root.classList.remove('cursor-on'));

  // Magnetic calls to action: a few pixels toward the pointer, released on leave.
  document.querySelectorAll('.button,.header-contact,.service>a,.wheel-controls button,.reader-controls button,.testimonial-controls button').forEach(element => {
    element.addEventListener('pointermove',event => {
      if (!canMove()) return;
      const rect = element.getBoundingClientRect();
      const dx = (event.clientX-rect.left-rect.width/2)/rect.width;
      const dy = (event.clientY-rect.top-rect.height/2)/rect.height;
      element.style.translate = (dx*10).toFixed(1)+'px '+(dy*8).toFixed(1)+'px';
    });
    element.addEventListener('pointerleave',() => { element.style.translate = ''; });
  });

  // Product objects lean toward the pointer inside their card.
  document.querySelectorAll('.product').forEach(card => {
    card.addEventListener('pointermove',event => {
      if (!canMove()) return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mx',((event.clientX-rect.left)/rect.width*2-1).toFixed(3));
      card.style.setProperty('--my',((event.clientY-rect.top)/rect.height*2-1).toFixed(3));
    });
    card.addEventListener('pointerleave',() => { card.style.setProperty('--mx','0'); card.style.setProperty('--my','0'); });
  });
})();

// AI clips loop silently only while visible and motion is allowed; each one can turn its sound on.
(function setupAiClips() {
  const clips = [...document.querySelectorAll('.ia-clip')];
  if (!clips.length) return;
  const canPlay = () => document.documentElement.classList.contains('brand-motion');
  const visible = new Set();
  const sync = () => clips.forEach(clip => {
    const video = clip.querySelector('video');
    if (visible.has(clip) && (canPlay() || !video.muted)) video.play().catch(() => {});
    else video.pause();
  });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => entry.isIntersecting ? visible.add(entry.target) : visible.delete(entry.target));
      sync();
    },{threshold:.35});
    clips.forEach(clip => observer.observe(clip));
  }
  document.addEventListener('brand-motion-change',sync);
  clips.forEach(clip => {
    const video = clip.querySelector('video');
    const sound = clip.querySelector('.ia-sound');
    sound.addEventListener('click',() => {
      const on = video.muted;
      clips.forEach(other => {
        other.querySelector('video').muted = true;
        other.querySelector('.ia-sound').setAttribute('aria-pressed','false');
        other.querySelector('.ia-sound').textContent = 'Ativar som';
      });
      video.muted = !on;
      sound.setAttribute('aria-pressed',String(on));
      sound.textContent = on ? 'Som ligado' : 'Ativar som';
      if (on) { video.play().catch(() => {}); document.querySelectorAll('.testimonial video').forEach(v => v.pause()); }
    });
  });
})();

// Video testimonials: one plays at a time, with sound, and pauses once it leaves the screen.
// Native controls stay in the HTML so the videos work without JavaScript.
(function setupTestimonials() {
  const rail = document.querySelector('.testimonial-rail');
  if (!rail) return;
  const cards = [...rail.querySelectorAll('.testimonial')];
  const stopOthers = current => cards.forEach(card => {
    const video = card.querySelector('video');
    if (video !== current && !video.paused) video.pause();
  });
  cards.forEach(card => {
    const video = card.querySelector('video');
    const name = card.querySelector('figcaption').textContent;
    video.controls = false;
    const play = document.createElement('button');
    play.type = 'button';
    play.className = 'testimonial-play';
    play.setAttribute('aria-label','Assistir depoimento de '+name);
    play.innerHTML = '<span aria-hidden="true">▶</span>';
    play.addEventListener('click',() => { video.controls = true; video.play(); });
    card.append(play);
    video.addEventListener('play',() => {
      stopOthers(video);
      card.classList.add('is-playing');
      document.querySelectorAll('.ia-clip').forEach(clip => {
        clip.querySelector('video').muted = true;
        clip.querySelector('.ia-sound').setAttribute('aria-pressed','false');
        clip.querySelector('.ia-sound').textContent = 'Ativar som';
      });
    });
    video.addEventListener('ended',() => { card.classList.remove('is-playing'); video.controls = false; video.load(); });
  });
  if ('IntersectionObserver' in window) {
    const offscreen = new IntersectionObserver(entries => entries.forEach(entry => {
      const video = entry.target.querySelector('video');
      if (!entry.isIntersecting && !video.paused) video.pause();
    }),{threshold:.25});
    cards.forEach(card => offscreen.observe(card));
  }
  const step = direction => rail.scrollBy({left:direction*(cards[0].offsetWidth+18)*2,behavior:reducedMotion.matches ? 'auto' : 'smooth'});
  document.querySelector('[data-rail-prev]').addEventListener('click',() => step(-1));
  document.querySelector('[data-rail-next]').addEventListener('click',() => step(1));
})();
