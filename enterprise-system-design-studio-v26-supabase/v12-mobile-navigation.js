
(function(){
  function q(s){return document.querySelector(s)}
  function qa(s){return Array.from(document.querySelectorAll(s))}
  function openNav(){
    const d=q('#v12MfDrawer'),o=q('#v12MfOverlay'),b=q('#v12MfMenu');
    if(!d)return;
    d.classList.add('open');o.classList.add('open');b.setAttribute('aria-expanded','true');
    d.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';
  }
  function closeNav(){
    const d=q('#v12MfDrawer'),o=q('#v12MfOverlay'),b=q('#v12MfMenu');
    if(!d)return;
    d.classList.remove('open');o.classList.remove('open');b.setAttribute('aria-expanded','false');
    d.setAttribute('aria-hidden','true');document.body.style.overflow='';
  }
  function go(view){
    closeNav();
    if(typeof window.showView==='function'){window.showView(view);return}
    if(typeof window.navigate==='function'){window.navigate(view);return}
    if(typeof window.setView==='function'){window.setView(view);return}
    const el=document.querySelector('[data-view="'+view+'"],[data-nav="'+view+'"]');
    if(el){el.click();return}
    const candidates={
      'full-erd':['project-erd','fullERD','full-erd','fullErd'],
      'screens':['screens','screen-designer'],
      'backend':['backend','api'],
      'users':['access','users-access','users'],
      'requirements':['requirements'],
      'traceability':['traceability'],
      'validation':['validation'],
      'documentation':['documentation'],
      'architecture':['architecture'],
      'timeline':['timeline'],
      'modules':['modules'],
      'erd':['erd'],
      'settings':['settings'],
      'dashboard':['dashboard']
    };
    for(const v of (candidates[view]||[])){
      const e=document.getElementById(v);
      if(e){e.click();break}
    }
  }
  document.addEventListener('DOMContentLoaded',function(){
    q('#v12MfMenu')?.addEventListener('click',openNav);
    q('#v12MfClose')?.addEventListener('click',closeNav);
    q('#v12MfOverlay')?.addEventListener('click',closeNav);
    q('#v12MfSignout')?.addEventListener('click',function(){
      const e=document.querySelector('[data-action="logout"],#logout,.logout');
      if(e)e.click(); else closeNav();
    });
    qa('[data-v12-view]').forEach(e=>e.addEventListener('click',()=>go(e.dataset.v12View)));
    document.addEventListener('keydown',e=>{if(e.key==='Escape')closeNav()});
    window.addEventListener('resize',()=>{if(innerWidth>900)closeNav()},{passive:true});
  });
  window.v12MobileNav={open:openNav,close:closeNav};
})();
