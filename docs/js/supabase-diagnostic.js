console.info("[Enterprise Studio] CockroachDB cloud persistence loaded");
(function(){
  "use strict";
  var state={state:"starting",message:"CockroachDB footer loaded.",revision:null,lastSaved:null,lastError:null};
  window.SUPABASE_DIAGNOSTIC=state;
  function footer(){
    var f=document.getElementById("supabaseStatusFooter");
    if(!f){
      f=document.createElement("footer");f.id="supabaseStatusFooter";f.setAttribute("aria-label","CockroachDB save status");
      f.innerHTML='<div class="supabase-footer-title">☁ CockroachDB</div><div id="supabaseDiagState">🔵 STARTING</div><div id="supabaseDiagMessage">Checking…</div><div id="supabaseDiagRevision"></div><div id="supabaseDiagError"></div><button id="supabaseDiagTest" type="button">Test</button><button id="supabaseDiagSave" type="button">Force Save</button>';
      (document.body||document.documentElement).appendChild(f);
    } return f;
  }
  function update(s,m,extra){state=Object.assign({},state,{state:s,message:m},extra||{});window.SUPABASE_DIAGNOSTIC=state;try{document.dispatchEvent(new CustomEvent("supabase-diagnostic",{detail:state}));}catch(e){}render();}
  window.setSupabaseDiagnostic=window.setSupabaseDiagnostic||update;
  document.addEventListener("supabase-diagnostic",function(e){state=e.detail||state;window.SUPABASE_DIAGNOSTIC=state;render();});
  function render(){var f=footer(),d=state,labels={saved:"✅ SAVED",connected:"🟢 CONNECTED",saving:"🟡 SAVING",error:"🔴 ERROR",starting:"🔵 STARTING"};f.querySelector("#supabaseDiagState").textContent=labels[d.state]||String(d.state).toUpperCase();f.querySelector("#supabaseDiagMessage").textContent=d.message||"";f.querySelector("#supabaseDiagRevision").textContent=d.revision!=null?"Rev "+d.revision:"";f.querySelector("#supabaseDiagError").textContent=d.lastError?"Error: "+d.lastError:"";var test=f.querySelector("#supabaseDiagTest"),save=f.querySelector("#supabaseDiagSave");if(!test.dataset.bound){test.dataset.bound="1";test.onclick=function(){if(typeof window.diagnosticSupabaseTest==="function")window.diagnosticSupabaseTest();else update("error","store.js did not load yet.",{lastError:"diagnosticSupabaseTest is undefined"})};save.onclick=async function(){try{if(typeof window.saveProjectToSupabase!=="function")throw new Error("saveProjectToSupabase() is unavailable.");update("saving","Force saving to CockroachDB…");var ok=await window.saveProjectToSupabase();if(ok)update("saved","Saved to CockroachDB ✓",{lastSaved:new Date().toISOString(),lastError:null})}catch(e){update("error","Save failed",{lastError:String(e&&e.message||e)})}}}}
  window.addEventListener("error",function(e){update("error","JavaScript error",{lastError:String(e.message||e.error||e)})});window.addEventListener("unhandledrejection",function(e){update("error","Unhandled promise error",{lastError:String(e.reason&&e.reason.message||e.reason||e)})});
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",render);else render();
})();
