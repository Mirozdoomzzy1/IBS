/* GitHub Pages-safe Supabase diagnostic bootstrap */
(function(){
  "use strict";
  var state={state:"starting",message:"Diagnostic panel loaded.",revision:null,lastSaved:null,lastError:null};
  window.SUPABASE_DIAGNOSTIC=state;

  function update(s,m,extra){
    state=Object.assign({},state,{state:s,message:m},extra||{});
    window.SUPABASE_DIAGNOSTIC=state;
    try{document.dispatchEvent(new CustomEvent("supabase-diagnostic",{detail:state}));}catch(e){}
    render();
  }
  window.setSupabaseDiagnostic=window.setSupabaseDiagnostic||update;

  function panel(){
    var p=document.getElementById("supabaseDiagnosticPanel");
    if(p) return p;
    p=document.createElement("div");
    p.id="supabaseDiagnosticPanel";
    p.setAttribute("style","position:fixed!important;right:18px!important;bottom:18px!important;z-index:2147483647!important;width:340px!important;max-width:calc(100vw - 36px)!important;padding:14px!important;border-radius:12px!important;background:#111827!important;color:#fff!important;font:13px Arial,sans-serif!important;box-shadow:0 8px 30px rgba(0,0,0,.35)!important;display:block!important;visibility:visible!important;opacity:1!important");
    p.innerHTML='<div style="font-weight:700;font-size:14px;margin-bottom:8px">☁ Supabase Save Status</div>'+
      '<div id="supabaseDiagState">🔵 STARTING</div>'+
      '<div id="supabaseDiagMessage" style="margin-top:5px;opacity:.85"></div>'+
      '<div id="supabaseDiagRevision" style="margin-top:5px;opacity:.85"></div>'+
      '<div id="supabaseDiagError" style="margin-top:7px;color:#fca5a5;white-space:pre-wrap"></div>'+
      '<div style="display:flex;gap:7px;margin-top:10px">'+
      '<button id="supabaseDiagTest" style="padding:7px 10px;border:0;border-radius:7px;cursor:pointer">Test Supabase</button>'+
      '<button id="supabaseDiagSave" style="padding:7px 10px;border:0;border-radius:7px;cursor:pointer">Force Save</button></div>';
    (document.body||document.documentElement).appendChild(p);
    p.querySelector("#supabaseDiagTest").onclick=function(){
      if(typeof window.diagnosticSupabaseTest==="function") window.diagnosticSupabaseTest();
      else update("error","store.js did not load yet.",{lastError:"diagnosticSupabaseTest is undefined"});
    };
    p.querySelector("#supabaseDiagSave").onclick=async function(){
      try{
        if(typeof window.saveProjectToSupabase!=="function") throw new Error("saveProjectToSupabase() is unavailable. Check whether js/store.js loaded.");
        update("saving","Force saving…");
        var ok=await window.saveProjectToSupabase();
        if(ok) update("saved","Saved to Supabase ✓",{lastSaved:new Date().toISOString(),lastError:null});
      }catch(e){update("error","Save failed",{lastError:String(e&&e.message||e)});}
    };
    return p;
  }
  function render(){
    var p=panel(), d=state;
    var s=p.querySelector("#supabaseDiagState");
    s.textContent=d.state==="saved"?"✅ SAVED":d.state==="connected"?"🟢 CONNECTED":d.state==="saving"?"🟡 SAVING":d.state==="error"?"🔴 ERROR":"🔵 "+String(d.state||"");
    p.querySelector("#supabaseDiagMessage").textContent=d.message||"";
    p.querySelector("#supabaseDiagRevision").textContent=d.revision!=null?"Revision: "+d.revision:"Revision: —";
    p.querySelector("#supabaseDiagError").textContent=d.lastError?"Error: "+d.lastError:"";
  }
  function install(){try{panel();render();}catch(e){console.error("Diagnostic panel failed",e);}}
  window.addEventListener("error",function(e){
    if(e && e.message) update("error","JavaScript error detected",{lastError:e.message});
  });
  window.addEventListener("unhandledrejection",function(e){
    var r=e&&e.reason; update("error","Unhandled JavaScript rejection",{lastError:String(r&&r.message||r)});
  });
  document.addEventListener("supabase-diagnostic",function(e){state=e.detail||state;render();});
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",install); else install();
  var observer=new MutationObserver(function(){ if(!document.getElementById("supabaseDiagnosticPanel")) install(); });
  function observe(){ if(document.documentElement) observer.observe(document.documentElement,{childList:true,subtree:true}); }
  if(document.documentElement) observe(); else document.addEventListener("DOMContentLoaded",observe);
})();
