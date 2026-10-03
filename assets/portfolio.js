(()=>{
 const menu=document.querySelector('.menu-button'),nav=document.querySelector('#navigation');
 function close(){menu.setAttribute('aria-expanded','false');nav.classList.remove('open');}
 menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));nav.classList.toggle('open',open);});
 nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',close));
 function route(){const section=document.getElementById(location.hash.slice(1)||'home');if(section&&section.matches('main>section'))requestAnimationFrame(()=>{section.scrollIntoView({block:'start'});section.tabIndex=-1;section.focus({preventScroll:true});});}
 window.addEventListener('hashchange',route);route();
 const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)nav.querySelectorAll('a').forEach(a=>a.classList.toggle('active',a.hash==='#'+e.target.id));}),{rootMargin:'-15% 0px -55% 0px'});document.querySelectorAll('main>section').forEach(s=>observer.observe(s));
})();
