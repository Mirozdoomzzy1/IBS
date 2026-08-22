
const state = {
  view: "dashboard",
  moduleId: null,
  tab: "requirements",
  editing: null,
  selectedComponent: null,
  erdModule: "ALL",
  erdCompact: true,
  erdZoom: 100,
  selectedComponentId: null,
  screenId: null,
  timelineFilter: null,
  referenceFilter: "ALL",
  taskBoardModule: "ALL",
  taskBoardAssignee: "ALL",
  taskBoardStatus: "ALL",
  traceabilityModule: "ALL"
};

const navSections = [
  {title:"PHASES", items:[
    ["requirements","▤","Requirements"],
    ["screens","▣","Screen Designer"],
    ["backend","⚙","Backend Logic"],
    ["erd","◇","Module ERD"],
    ["project-erd","◈","Full Project ERD"],
    ["testing","🧪","Testing"],
    ["validation","✓","Validation"]
  ]},
  {title:"PROJECT MANAGEMENT", items:[
    ["dashboard","⌂","Dashboard"],
    ["modules","▦","System Blueprint"],
    ["timeline","◷","Timeline / Plan"],
    ["tasks","☷","Tasks & Traceability"],
    ["task-board","▥","Task Board"],
    ["traceability","↗","Traceability"],
    ["architecture","◎","Architecture Map"],
    ["technical","⬡","Technical Architecture"]
  ]},
  {title:"PROJECT OWNER", items:[
    ["references","▧","Reference Images"],
    ["documentation","▥","Documentation"],
    ["settings","⚙","Project Settings"]
  ]},
  {title:"ADMINISTRATION", items:[
    ["access","🔐","Users & Access"],
    ["audit","◷","Audit Log"]
  ]}
];

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const uid = p => p+"-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,6);
function metric(label,value,icon=""){ return `<div class="metric card"><div class="metric-icon">${esc(icon)}</div><div class="number">${esc(value)}</div><div class="label">${esc(label)}</div></div>`; }
function isoDate(value){
  const d=value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if(Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0,10);
}
function addDays(value,days){
  const d=value instanceof Date ? new Date(value.getTime()) : new Date(String(value)+'T00:00:00');
  d.setDate(d.getDate()+Number(days||0));
  return d;
}
function fmtDate(value){
  if(!value) return '—';
  const d=new Date(String(value).length===10 ? String(value)+'T00:00:00' : value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'});
}
function businessDays(start,end){
  const s=new Date(String(start)+'T00:00:00'), e=new Date(String(end)+'T00:00:00');
  if(Number.isNaN(s.getTime())||Number.isNaN(e.getTime())||e<s) return 0;
  let n=0;
  for(let d=new Date(s); d<=e; d.setDate(d.getDate()+1)){ const day=d.getDay(); if(day!==0&&day!==6)n++; }
  return n;
}
function timelineWeeks(tasks){
  const valid=(tasks||[]).flatMap(t=>[t.start,t.end]).filter(Boolean).map(v=>new Date(String(v)+'T00:00:00')).filter(d=>!Number.isNaN(d.getTime()));
  if(!valid.length) return [new Date()];
  const min=new Date(Math.min(...valid.map(d=>d.getTime())));
  const max=new Date(Math.max(...valid.map(d=>d.getTime())));
  min.setDate(min.getDate()-((min.getDay()+6)%7));
  max.setDate(max.getDate()+((7-max.getDay())%7));
  const out=[];
  for(let d=new Date(min); d<=max; d.setDate(d.getDate()+7)) out.push(new Date(d));
  return out;
}


function showToast(msg){
  const el=$("#toast"); el.textContent=msg; el.classList.add("show");
  clearTimeout(window.__toast); window.__toast=setTimeout(()=>el.classList.remove("show"),2200);
}

function moduleById(id){ return project.modules.find(m=>m.id===id); }
function counts(moduleId){
  const f=a=>moduleId ? a.filter(x=>x.moduleId===moduleId).length : a.length;
  return {requirements:f(project.requirements),screens:f(project.screens),entities:f(project.entities),apis:f(project.apis),logic:f(project.logic),tests:f(project.tests||[])};
}
function normalizeDesignData(){
  project.screens.forEach(s=>{
    s.components ||= [];
    s.components.forEach(c=>{
      c.id ||= uid("CMP");
      c.entityField ||= (c.entity && c.field) ? `${c.entity}.${c.field}` : "";
      c.apiField ||= ""; c.helperText ||= ""; c.placeholder ||= ""; c.defaultValue ||= "";
      c.visibility ||= "Always"; c.readOnly=!!c.readOnly; c.comments ||= c.comment || ""; c.comment=c.comments;
      c.sourceType ||= "DB"; c.dbSchema ||= ""; c.dbTable ||= ""; c.dbColumn ||= ""; c.calculationRule ||= "";
    });
  });
  project.entities.forEach(e=>{e.fields ||= []; e.x ||= 40; e.y ||= 40; e.comments ||= "";});
  project.relations ||= [];
  project.references ||= [];
  project.screens.forEach(s=>{s.referenceImages ||= [];});
}

function normalizeComments(){
  project.project.comments ||= "";
  ["modules","requirements","screens","entities","relations","apis","logic","tests"].forEach(k=>project[k].forEach(x=>x.comments ||= ""));
}

function bindActions(){
  $$("[data-view]").forEach(el=>el.onclick=()=>setView(el.dataset.view));
  $$("[data-action]").forEach(el=>el.onclick=()=>handleAction(el.dataset.action,el.dataset.id));
  $$('[data-module]').forEach(el=>el.onclick=()=>{
    const target=el.dataset.target||state.view;
    if(target==='module-workspace' && el.dataset.stage){
      state.view='module-workspace'; state.moduleId=el.dataset.module||state.moduleId; state.tab=el.dataset.stage; render(); return;
    }
    setView(target,el.dataset.module);
  });
  $$("[data-entity]").forEach(el=>el.onclick=()=>{state.erdModule=moduleById(project.entities.find(e=>e.id===el.dataset.entity)?.moduleId)?.id||"ALL";setView("erd");});
  $$(`[data-link-object]`).forEach(el=>el.onclick=()=>openLinkedObject(el.dataset.linkObject,el.dataset.linkId));
  $$("[data-tab]").forEach(el=>el.onclick=()=>{state.tab=el.dataset.tab; render();});
}

function openLinkedObject(type,id){
  const map={requirement:"requirements",screen:"screens",entity:"erd",api:"backend",logic:"backend",test:"testing",task:"timeline",module:"modules"};
  const objList=type==='requirement'?project.requirements:type==='screen'?project.screens:type==='entity'?project.entities:type==='api'?project.apis:type==='logic'?project.logic:type==='test'?(project.tests||[]):type==='task'?(project.timeline||[]):project.modules;
  const obj=(objList||[]).find(x=>String(x.id)===String(id));
  const mid=obj?.moduleId || (type==='task'?obj?.moduleId:null) || (type==='entity'?obj?.moduleId:null);
  if(type==='entity') state.erdModule=mid||'ALL';
  setView(map[type]||'modules',mid||null);
}

function addModulePhaseNav(){
  const content = $("#content");
  if(!content || !project?.modules?.length) return;
  const phaseViews = ["requirements","screens","backend","erd","testing","module-workspace"];
  if(!phaseViews.includes(state.view)) return;
  if(content.querySelector(".module-phase-nav")) return;

  const currentId = state.moduleId || "ALL";
  const labels = {
    requirements: "Requirements",
    screens: "Screens",
    backend: "Backend Logic",
    erd: "ERD",
    testing: "Testing",
    "module-workspace": "Module Workspace"
  };
  const phaseLabel = labels[state.view] || "Design Phase";
  const options = `<option value="ALL" ${currentId==="ALL"?'selected':''}>All Modules</option>` + project.modules.map(m =>
    `<option value="${esc(m.id)}" ${m.id===currentId?'selected':''}>${esc(m.name)}</option>`
  ).join("");
  const links = phaseViews.filter(v=>v!=="module-workspace").map(v=>
    `<button class="module-phase-link ${state.view===v?'active':''}" data-module-phase="${v}">${labels[v]}</button>`
  ).join("");

  content.insertAdjacentHTML("afterbegin", `
    <div class="module-phase-nav">
      <div class="module-phase-nav-main">
        <div class="module-phase-nav-icon">▦</div>
        <div class="module-phase-nav-copy">
          <span class="eyebrow">MODULE NAVIGATION</span>
          <strong>${esc(phaseLabel)}</strong>
        </div>
        <label class="module-phase-select-label">
          <span>Module</span>
          <select id="phaseModuleSelector" aria-label="Change module">
            ${options}
          </select>
        </label>
      </div>
      <div class="module-phase-nav-links">${links}</div>
    </div>
  `);

  const selector = $("#phaseModuleSelector");
  if(selector){
    selector.onchange = () => {
      const next = selector.value;
      state.moduleId = next === "ALL" ? null : next;
      state.screenId = null;
      state.selectedComponentId = null;
      state.erdModule = next;
      if(state.view === "module-workspace") state.tab = "requirements";
      render();
    };
  }
  $$('[data-module-phase]').forEach(btn => btn.onclick = () => {
    const nextView = btn.dataset.modulePhase;
    state.view = nextView;
    state.screenId = null;
    state.selectedComponentId = null;
    state.erdModule = state.moduleId || "ALL";
    if(nextView === "module-workspace") state.tab = "requirements";
    render();
  });
}

function addQuickNavCarousel(){
  const content=$("#content");
  if(!content || content.querySelector(".quick-nav-carousel")) return;
  const items=[
    ["dashboard","⌂","Dashboard","Project overview"],
    ["modules","▦","Blueprint","Modules + 4 stages"],
    ["screens","▣","Screens","Oracle → New UI"],
    ["project-erd","◈","Full ERD","All tables"],
    ["timeline","◷","Timeline","Plan & dates"],
    ["tasks","☷","Tasks","Track delivery"],
    ["requirements","▤","Requirements","Business needs"],
    ["erd","◇","Module ERD","Tables & links"],
    ["backend","⚙","Backend","API & logic"],
    ["technical","⬡","Technical","React + TS + Oracle"],
    ["traceability","↗","Traceability","End-to-end links"],
    ["validation","✓","Validation","Quality gates"],
    ["testing","🧪","Testing","Test cases & steps"],
    ["documentation","▥","Documentation","Project docs"],
    ["settings","⚙","Settings","Studio settings"]
  ];
  const html=`<div class="quick-nav-carousel"><button class="carousel-arrow left" data-carousel="prev">‹</button><div class="carousel-track">${items.map(([id,icon,title,sub])=>`<button class="carousel-card ${state.view===id?'active':''}" data-view="${id}"><span class="carousel-icon">${icon}</span><span><b>${title}</b><small>${sub}</small></span></button>`).join("")}</div><button class="carousel-arrow right" data-carousel="next">›</button></div>`;
  content.insertAdjacentHTML("afterbegin",html);
  const track=content.querySelector(".carousel-track");
  content.querySelector('[data-carousel="prev"]').onclick=()=>track.scrollBy({left:-300,behavior:"smooth"});
  content.querySelector('[data-carousel="next"]').onclick=()=>track.scrollBy({left:300,behavior:"smooth"});
}

function renderDashboard(){
  const c=counts();
  const steps=[
    {n:'01',key:'requirements',icon:'▤',title:'Gather Requirements',desc:'Start with the business. Capture what the system must do, who uses it, business rules, approvals, validations, reports and acceptance criteria.',detail:'This is the source of truth for the rest of the design.',action:'Start Gathering Requirements'},
    {n:'02',key:'screens',icon:'▣',title:'Design Screens',desc:'Translate requirements into user journeys and screens. Keep the old Oracle Forms visible as references while designing the new suggested experience.',detail:'You can create screens from scratch or upload screen/reference photos.',action:'Open Screen Designer'},
    {n:'03',key:'erd',icon:'◇',title:'Design the ERD',desc:'Turn the information needed by the screens and processes into tables, fields, keys and relationships. Build the module ERD or the complete project ERD.',detail:'You can create tables and relationships directly in the ERD maker.',action:'Open ERD Maker'},
    {n:'04',key:'backend',icon:'⚙',title:'Define Backend Logic',desc:'Define APIs, validation, permissions, business rules, workflows, automation and the database operations behind the screens.',detail:'Backend logic connects the user experience to the data model securely.',action:'Open Backend Logic'}
  ];
  const totalArtifacts=c.requirements+c.screens+c.entities+c.apis+c.logic;
  $('#content').innerHTML=`
    <div class="home-welcome">
      <div class="home-welcome-copy">
        <span class="eyebrow">WELCOME TO THE ENTERPRISE SYSTEM DESIGN STUDIO</span>
        <h1>Design the system step by step.</h1>
        <p>This workspace helps you modernize the system in a controlled way: first understand the business, then design the screens, model the database, and finally define the backend logic. Every stage stays connected so you can trace a requirement all the way to implementation.</p>
        <div class="home-welcome-actions">
          <button class="btn primary" data-view="requirements">Start with Requirements →</button>
          <button class="btn secondary" data-view="modules">View System Blueprint</button>
        </div>
      </div>
      <div class="home-welcome-stats">
        <div><b>${project.modules.length}</b><span>Modules</span></div>
        <div><b>${totalArtifacts}</b><span>Design artifacts</span></div>
        <div><b>${project.relations.length}</b><span>Relationships</span></div>
      </div>
    </div>

    <div class="home-section-intro">
      <div><span class="eyebrow">THE DESIGN JOURNEY</span><h2>Four stages — one connected system</h2><p>Follow these stages for each of the 14 modules. You can return to any stage at any time as the design evolves.</p></div>
    </div>

    <div class="home-step-grid">
      ${steps.map((x,i)=>`<div class="home-step-card ${i===0?'first-step':''} ">
        <div class="home-step-top"><span class="home-step-number">${x.n}</span><span class="home-step-icon">${x.icon}</span><span class="home-step-status">${x.key==='requirements'?c.requirements:x.key==='screens'?c.screens:x.key==='erd'?c.entities:c.apis+c.logic} items</span></div>
        <h3>${x.title}</h3><p>${x.desc}</p><div class="home-step-detail">${x.detail}</div>
        <button class="btn ${i===0?'primary':'secondary'} home-step-button" data-view="${x.key}">${x.action} <span>→</span></button>
        ${i<steps.length-1?'<div class="home-step-connector">↓</div>':''}
      </div>`).join('')}
    </div>

    <div class="home-tools-grid">
      <div class="card home-tool-card">
        <div class="home-tool-icon">▣</div><div><span class="eyebrow">SCREEN CREATION</span><h3>Create the screens</h3><p>Use the Screen Designer to create a new screen, add components, map fields and attach Oracle Form or reference screenshots.</p><div class="home-tool-actions"><button class="btn primary" data-action="new-screen">＋ Create Screen</button><button class="btn tiny" data-view="screens">Browse Screens</button></div></div>
      </div>
      <div class="card home-tool-card">
        <div class="home-tool-icon">◇</div><div><span class="eyebrow">DATA MODELING</span><h3>Create the ERD</h3><p>Use the ERD Maker to create tables, add fields, position tables on the canvas and connect them with relationships.</p><div class="home-tool-actions"><button class="btn primary" data-action="new-entity">＋ Create Table</button><button class="btn tiny" data-view="erd">Open ERD Maker</button></div></div>
      </div>
      <div class="card home-tool-card">
        <div class="home-tool-icon">▧</div><div><span class="eyebrow">REFERENCE LIBRARY</span><h3>Keep visual references</h3><p>Upload Oracle Forms photos, screen references and other visual material so the design team always has the source beside the proposed solution.</p><div class="home-tool-actions"><button class="btn secondary" data-view="references">Open Reference Images</button></div></div>
      </div>
    </div>

    <div class="home-module-strip card">
      <div class="card-title"><div><span class="eyebrow">YOUR SYSTEM</span><h2>14 modules use the same design process</h2><span class="muted small-text">Open a module to work through Requirements → Screens → Backend → ERD.</span></div><button class="btn secondary" data-view="modules">Open Blueprint</button></div>
      <div class="home-module-pills">${project.modules.map(m=>`<button data-module="${m.id}" data-target="module-workspace"><span>${esc(m.icon||'•')}</span>${esc(m.name)}</button>`).join('')}</div>
    </div>

    <div class="home-footer-note"><strong>Recommended starting point:</strong> begin with <button class="link-button" data-view="requirements">Gather Requirements</button>. Once the business needs are understood, move to Screens, then ERD, and then Backend Logic. The order is a guide — you can move between stages whenever new information is discovered.</div>
  `;
}

function renderTimeline(){
  const tasks=(project.timeline||[]).slice().sort((a,b)=>a.start.localeCompare(b.start));
  const weeks=timelineWeeks(tasks), today=isoDate(new Date());
  const completed=tasks.filter(t=>t.status==="Done").length;
  const active=tasks.filter(t=>t.status==="In Progress").length;
  const totalDays=tasks.length?businessDays(tasks.reduce((a,t)=>a<t.start?a:t.start,tasks[0].start),tasks.reduce((a,t)=>a>t.end?a:t.end,tasks[0].end)):0;
  const rows=tasks.map(t=>{
    const start=new Date(t.start+"T00:00:00"),end=new Date(t.end+"T00:00:00");
    const startIdx=weeks.findIndex(w=>w<=start && addDays(w,6)>=start);
    const endIdx=weeks.findIndex(w=>w<=end && addDays(w,6)>=end);
    const left=Math.max(0,startIdx)*110 + Math.round(((start.getDay()+6)%7)/7*110);
    const width=Math.max(44,((endIdx<0?startIdx:endIdx)-startIdx+1)*110 - 12);
    return `<div class="timeline-row"><div class="timeline-task"><span class="timeline-task-dot ${t.status==='Done'?'done':t.status==='In Progress'?'active':''}"></span><div><strong>${esc(t.name)}</strong><small>${esc(moduleById(t.moduleId)?.name||t.layer||'Foundation')} · ${esc(t.layer||'Project')}</small></div></div><div class="timeline-track"><div class="timeline-bar ${esc((t.status||'Planned').toLowerCase().replace(/ /g,'-'))} ${t.priority==='Critical'?'critical':''}" style="left:${left}px;width:${width}px" data-action="edit-timeline-task" data-id="${t.id}" title="${esc(t.name)} · ${fmtDate(t.start)} → ${fmtDate(t.end)}">${esc(t.short||'')}</div></div></div>`;
  }).join("");
  const monthHeaders=weeks.map((w,i)=>`<div class="timeline-week"><strong>${w.toLocaleDateString(undefined,{month:'short'})}</strong><span>W${i+1}</span><small>${w.getDate()}</small></div>`).join("");
  const navButtons=project.modules.map(m=>`<button class="btn tiny" data-timeline-module="${m.id}">${esc(m.name)}</button>`).join("");
  const phases=[
    ['Foundation & Security','Security, identity, architecture standards and design governance',tasks.filter(t=>t.phase==='Foundation').length],
    ['Layer 1 · Requirements','Business requirements, actors, rules and acceptance criteria',tasks.filter(t=>t.layer==='Requirements').length],
    ['Layer 2 · Screens','React screen blueprints and UX workflows',tasks.filter(t=>t.layer==='Screens').length],
    ['Layer 3 · Oracle ERD','Entities, fields, keys, indexes and relationships',tasks.filter(t=>t.layer==='ERD').length],
    ['Layer 4 · TypeScript API','Endpoints, services, validation, authorization and transactions',tasks.filter(t=>t.layer==='Backend').length],
    ['Integration & UAT','Cross-module testing, security review, migration and go-live',tasks.filter(t=>t.layer==='UAT').length]
  ];
  const filtered=state.timelineFilter?tasks.filter(t=>t.moduleId===state.timelineFilter):tasks;
  const filterRows=filtered.map(t=>`<tr><td><strong>${esc(t.name)}</strong><br><span class="muted">${esc(t.layer||'')}</span></td><td>${esc(moduleById(t.moduleId)?.name||'Foundation')}</td><td>${fmtDate(t.start)}</td><td>${fmtDate(t.end)}</td><td>${businessDays(t.start,t.end)}d</td><td><span class="tag ${t.status==='Done'?'green':t.status==='In Progress'?'blue':'orange'}">${esc(t.status)}</span></td><td><button class="icon-btn" data-action="edit-timeline-task" data-id="${t.id}">✎</button><button class="icon-btn danger" data-action="delete-timeline-task" data-id="${t.id}">×</button></td></tr>`).join('');
  const timelineContent=filtered.length?filtered.map(t=>{
    const s=new Date(t.start+"T00:00:00"),e=new Date(t.end+"T00:00:00");
    const left=Math.max(0,weeks.findIndex(w=>w<=s&&addDays(w,6)>=s))*110+Math.round(((s.getDay()+6)%7)/7*110);
    const wi=Math.max(0,weeks.findIndex(w=>w<=e&&addDays(w,6)>=e)-weeks.findIndex(w=>w<=s&&addDays(w,6)>=s)+1);
    return `<div class="timeline-row"><div class="timeline-task"><span class="timeline-task-dot ${t.status==='Done'?'done':t.status==='In Progress'?'active':''}"></span><div><strong>${esc(t.name)}</strong><small>${esc(moduleById(t.moduleId)?.name||'Foundation')} · ${esc(t.layer||'')}</small></div></div><div class="timeline-track"><div class="timeline-bar ${(t.status||'Planned').toLowerCase().replace(/ /g,'-')} ${t.priority==='Critical'?'critical':''}" style="left:${left}px;width:${Math.max(52,wi*110-12)}px" data-action="edit-timeline-task" data-id="${t.id}"><b>${esc(t.short||'')}</b><span>${fmtDate(t.start)} → ${fmtDate(t.end)}</span></div></div></div>`;
  }).join(''):`<div class="empty">No timeline items for this module.</div>`;
  const weekHead=weeks.map(w=>`<div class="timeline-week"><strong>${w.toLocaleDateString(undefined,{month:'short'})}</strong><small>${w.getDate()}</small></div>`).join('');
  const widths=Math.max(weeks.length*110,760);
  const firstDate=tasks[0]?.start||today,lastDate=tasks[tasks.length-1]?.end||today;
  const overall=Math.max(1,Math.round(tasks.reduce((sum,t)=>sum+businessDays(t.start,t.end),0)));
  const phaseCards=phases.map(p=>`<div class="plan-phase"><span class="phase-index">${p[0].includes('Foundation')?'01':p[0].includes('Requirements')?'02':p[0].includes('Screens')?'03':p[0].includes('ERD')?'04':p[0].includes('Backend')?'05':'06'}</span><div><strong>${p[0]}</strong><p>${p[1]}</p></div><b>${p[2]} tasks</b></div>`).join('');
  $("#content").innerHTML=`
    <div class="timeline-hero"><div><div class="eyebrow">MASTER DELIVERY PLAN</div><h2>Project Timeline & Delivery Roadmap</h2><p>Estimate the complete design and implementation journey from security foundation through module delivery, integration, UAT and go-live.</p></div><div class="timeline-hero-actions"><button class="btn secondary" data-action="new-timeline-task">＋ Add timeline item</button><button class="btn primary" data-action="seed-timeline">↻ Rebuild plan</button></div></div>
    <div class="grid cards timeline-metrics">${metric('Timeline items',tasks.length,'◷')}${metric('In progress',active,'▶')}${metric('Completed',completed,'✓')}${metric('Planned effort',overall+' days','⌛')}</div>
    <div class="card timeline-phases"><div class="card-title"><div><h2>Delivery sequence</h2><span class="muted small-text">Recommended order: security → requirements → screens → ERD → TypeScript API → integration.</span></div></div><div class="phase-grid">${phaseCards}</div></div>
    <div class="card timeline-gantt-card"><div class="card-title"><div><h2>Gantt view</h2><span class="muted small-text">Click any bar to edit its dates, owner, dependencies or comments.</span></div><div class="timeline-filters"><button class="btn tiny ${!state.timelineFilter?'active-filter':''}" data-timeline-module="ALL">All</button>${navButtons}</div></div>
      <div class="timeline-scroll"><div class="timeline-gantt" style="min-width:${widths}px"><div class="timeline-header"><div class="timeline-task-head">WORK ITEM</div><div class="timeline-weeks">${weekHead}</div></div>${timelineContent}</div></div>
    </div>
    <div class="card" style="margin-top:16px"><div class="card-title"><div><h2>Detailed plan</h2><span class="muted small-text">Use this table to manage every design and delivery item.</span></div></div><div class="table-wrap"><table class="table"><thead><tr><th>Work item</th><th>Module</th><th>Start</th><th>End</th><th>Days</th><th>Status</th><th>Actions</th></tr></thead><tbody>${filterRows||'<tr><td colspan="7"><div class="empty">No items.</div></td></tr>'}</tbody></table></div></div>`;
  $$('[data-timeline-module]').forEach(b=>b.onclick=()=>{state.timelineFilter=b.dataset.timelineModule==='ALL'?null:b.dataset.timelineModule;renderTimeline();});
}

function renderArchitecture(){
  const W=1100,H=760,cx=W/2,cy=H/2;
  const modules=project.modules;
  const entities=project.entities;
  const reqByModule=m=>project.requirements.filter(r=>r.moduleId===m.id);
  const screensByModule=m=>project.screens.filter(s=>s.moduleId===m.id);
  const moduleRadius=Math.min(255,120+modules.length*12);
  const entityRadius=Math.min(330,moduleRadius+110);
  const pos=(radius,i,total)=>{
    const a=(-Math.PI/2)+(Math.PI*2*i/total);
    return {x:cx+radius*Math.cos(a),y:cy+radius*Math.sin(a)};
  };
  const modulePos={},entityPos={};
  modules.forEach((m,i)=>modulePos[m.id]=pos(moduleRadius,i,Math.max(modules.length,1)));
  entities.forEach((e,i)=>entityPos[e.id]=pos(entityRadius,i,Math.max(entities.length,1)));

  const moduleLinks=modules.map(m=>{
    const p=modulePos[m.id];
    return `<line class="arch-module-spoke" x1="${cx}" y1="${cy}" x2="${p.x}" y2="${p.y}"/>`;
  }).join("");

  const entityLinks=entities.map(e=>{
    const p=entityPos[e.id], m=moduleById(e.moduleId), mp=m&&modulePos[m.id];
    return mp?`<line class="arch-entity-module" x1="${mp.x}" y1="${mp.y}" x2="${p.x}" y2="${p.y}"/>`:"";
  }).join("");

  const relationLinks=project.relations.map(r=>{
    const a=entityPos[r.from],b=entityPos[r.to];
    if(!a||!b)return "";
    return `<line class="arch-relation" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"/>
      <text class="arch-relation-label" x="${(a.x+b.x)/2}" y="${(a.y+b.y)/2}">${esc(r.cardinality||"1:N")}</text>`;
  }).join("");

  const moduleNodes=modules.map(m=>{
    const p=modulePos[m.id],req=reqByModule(m),scr=screensByModule(m);
    const notes=req.slice(0,1).map(r=>`<div class="arch-note" title="${esc(r.description||r.title)}">▤ ${esc(r.title)}</div>`).join("");
    const screenNames=scr.slice(0,1).map(s=>`<div class="arch-screen">▣ ${esc(s.name)}</div>`).join("");
    return `<g class="arch-module-node" data-module="${m.id}" data-target="requirements" tabindex="0">
      <circle cx="${p.x}" cy="${p.y}" r="74" class="arch-module-circle"/>
      <text x="${p.x}" y="${p.y-42}" text-anchor="middle" class="arch-module-icon">${esc(m.icon)}</text>
      <text x="${p.x}" y="${p.y-20}" text-anchor="middle" class="arch-module-name">${esc(m.name)}</text>
      <text x="${p.x}" y="${p.y+1}" text-anchor="middle" class="arch-module-count">${req.length} req • ${scr.length} screens</text>
      <foreignObject x="${p.x-62}" y="${p.y+10}" width="124" height="56">
        <div xmlns="http://www.w3.org/1999/xhtml" class="arch-foreign">${notes}${screenNames}</div>
      </foreignObject>
    </g>`;
  }).join("");

  const entityNodes=entities.map(e=>{
    const p=entityPos[e.id],fields=e.fields||[],key=fields.find(f=>f.pk);
    return `<g class="arch-entity-node" data-entity="${e.id}" tabindex="0">
      <circle cx="${p.x}" cy="${p.y}" r="52" class="arch-entity-circle"/>
      <text x="${p.x}" y="${p.y-13}" text-anchor="middle" class="arch-entity-label">◇ ${esc(e.name)}</text>
      <text x="${p.x}" y="${p.y+5}" text-anchor="middle" class="arch-entity-meta">${fields.length} columns</text>
      <text x="${p.x}" y="${p.y+20}" text-anchor="middle" class="arch-entity-key">${key?"PK "+esc(key.name):"NO PK"}</text>
    </g>`;
  }).join("");

  const quickLinks=modules.map(m=>{
    const c=counts(m.id);
    return `<div class="arch-module-link-card">
      <div class="arch-module-link-title"><span class="module-icon">${esc(m.icon)}</span><strong>${esc(m.name)}</strong></div>
      <div class="arch-link-counts">${c.requirements} req · ${c.screens} screens · ${c.entities} tables · ${c.apis} APIs</div>
      <div class="arch-link-row">
        <button class="btn tiny" data-module="${m.id}" data-target="requirements">Req</button>
        <button class="btn tiny" data-module="${m.id}" data-target="screens">Screens</button>
        <button class="btn tiny" data-module="${m.id}" data-target="erd">ERD</button>
        <button class="btn tiny" data-module="${m.id}" data-target="backend">Backend</button>
      </div>
    </div>`;
  }).join("");

  const legend=`<div class="arch-legend">
    <span><i class="legend-dot module"></i> Module</span>
    <span><i class="legend-dot entity"></i> ERD Entity</span>
    <span><i class="legend-line module-line"></i> Module layer</span>
    <span><i class="legend-line entity-line"></i> Entity ↔ Module</span>
    <span><i class="legend-line relation-line"></i> ERD relationship</span>
  </div>`;

  $("#content").innerHTML=`
    <div class="toolbar">
      <div class="left"><div><strong>System Architecture Map</strong><div class="muted small-text">Everything is reachable from this page: modules, requirements, screens, ERD, backend, validation and documentation.</div></div></div>
      <div class="right">
        <button class="btn secondary" data-view="technical">Technical Architecture</button>
        <button class="btn secondary" data-view="modules">Module Catalog</button>
      </div>
    </div>

    <div class="architecture-card">
      <div class="architecture-head">
        <div><div class="eyebrow">ONE-PAGE BUSINESS + DATA MAP</div><h2>Employee & Client → Modules → ERD</h2><p>Click module nodes or ERD entities, or use the navigation deck below.</p></div>
        <div class="architecture-stats">
          <span><b>${modules.length}</b> modules</span><span><b>${project.requirements.length}</b> requirements</span>
          <span><b>${project.screens.length}</b> screens</span><span><b>${entities.length}</b> entities</span><span><b>${project.relations.length}</b> relationships</span>
        </div>
      </div>
      <div class="architecture-canvas">
        <svg viewBox="0 0 ${W} ${H}" class="architecture-svg" aria-label="Circular system architecture map">
          <defs><filter id="archShadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="4" stdDeviation="5" flood-opacity=".12"/></filter></defs>
          <circle cx="${cx}" cy="${cy}" r="${moduleRadius+15}" class="arch-ring module-ring"/>
          <circle cx="${cx}" cy="${cy}" r="${entityRadius+8}" class="arch-ring entity-ring"/>
          ${moduleLinks}${entityLinks}${relationLinks}
          <circle cx="${cx}" cy="${cy}" r="96" class="arch-center" data-view="modules"/>
          <text x="${cx}" y="${cy-28}" text-anchor="middle" class="arch-center-title">EMPLOYEE</text>
          <text x="${cx}" y="${cy-8}" text-anchor="middle" class="arch-center-title">&amp; CLIENT</text>
          <text x="${cx}" y="${cy+14}" text-anchor="middle" class="arch-center-sub">CORE BUSINESS</text>
          <text x="${cx}" y="${cy+32}" text-anchor="middle" class="arch-center-sub">OPEN MODULES</text>
          ${moduleNodes}${entityNodes}
        </svg>${legend}
      </div>
    </div>

    <div class="arch-nav-panel">
      <div class="arch-nav-head"><div><div class="eyebrow">NAVIGATION DECK</div><h3>Go anywhere in the project</h3></div>
        <div class="arch-global-links">
          ${[
            ["dashboard","Dashboard"],["modules","Modules"],["requirements","Requirements"],["screens","Screen Designer"],
            ["erd","ERD / Database"],["backend","Backend Logic"],["traceability","Traceability"],["validation","Validation"],
            ["documentation","Documentation"],["technical","Technical Architecture"],["settings","Settings"]
          ].map(([id,label])=>`<button class="btn tiny" data-view="${id}">${label}</button>`).join("")}
        </div>
      </div>
      <div class="arch-module-link-grid">${quickLinks}</div>
    </div>`;
}

function renderTechnicalArchitecture(){
  const layers=[
    ["01","React UI","Pages, reusable components, forms, dashboards, dialogs and responsive navigation.","React + TypeScript","Browser"],
    ["02","Frontend Application Services","Typed API client, routing, query/cache state, client validation and permissions-aware UI.","TypeScript + React Router + TanStack Query","HTTP/JSON"],
    ["03","TypeScript API","REST endpoints, authentication, authorization, validation, business workflows and audit context.","Node.js + TypeScript","Server"],
    ["04","Data Access","Oracle connection pool, parameterized SQL, transactions, repositories/query services and mappings.","OracleDB Node.js Driver + TypeScript","Database boundary"],
    ["05","Oracle Database","Schemas, tables, constraints, indexes, views, sequences/identity and stored database objects where justified.","Oracle Database","System of record"]
  ];
  const nav=["architecture","modules","requirements","screens","erd","backend","traceability","validation","documentation","settings"];
  $("#content").innerHTML=`
    <div class="toolbar"><div class="left"><div><strong>Technical Architecture</strong><div class="muted small-text">Corrected stack: React + TypeScript + TypeScript API + Oracle. No ASP.NET or C#.</div></div></div>
      <div class="right"><button class="btn secondary" data-view="architecture">← Architecture Map</button><button class="btn primary" data-action="add-project-comment">💬 Add Comment</button></div></div>
    <div class="tech-hero"><div><div class="eyebrow">APPROVED TARGET STACK</div><h2>React + TypeScript → TypeScript API → Oracle</h2><p>React never connects directly to Oracle. The TypeScript server is the secure application boundary for authentication, authorization, validation, business rules and database transactions.</p></div><div class="tech-badges"><span>React</span><span>TypeScript</span><span>Node.js</span><span>REST / JSON</span><span>OracleDB Driver</span><span>Oracle</span></div></div>
    <div class="tech-flow"><div class="tech-flow-node"><b>React</b><span>UI</span></div><div class="tech-arrow">→</div><div class="tech-flow-node"><b>TypeScript</b><span>API client</span></div><div class="tech-arrow">→</div><div class="tech-flow-node"><b>HTTPS</b><span>REST / JSON</span></div><div class="tech-arrow">→</div><div class="tech-flow-node"><b>Node.js + TS</b><span>Business/API</span></div><div class="tech-arrow">→</div><div class="tech-flow-node"><b>Oracle Driver</b><span>Connection pool</span></div><div class="tech-arrow">→</div><div class="tech-flow-node"><b>Oracle DB</b><span>System of record</span></div></div>
    <div class="card tech-layers-card"><div class="card-title"><div><h2>Five technical layers</h2><span class="muted small-text">Simple enough for the team to understand and strict enough to protect the database.</span></div></div><div class="tech-layer-list">${layers.map(l=>`<div class="tech-layer"><div class="tech-num">${l[0]}</div><div class="tech-layer-main"><h3>${l[1]}</h3><p>${l[2]}</p></div><div class="tech-layer-stack"><span>${l[3]}</span><small>${l[4]}</small></div></div>`).join("")}</div></div>
    <div class="grid two tech-grid"><div class="card"><h3>Request flow</h3><div class="tech-codeflow"><div>React page</div><span>↓</span><div>Typed TypeScript API client</div><span>↓</span><div>TypeScript route / controller</div><span>↓</span><div>Application service</div><span>↓</span><div>Oracle query / transaction</div><span>↓</span><div>Typed JSON response</div></div></div>
      <div class="card"><h3>Non-negotiable rules</h3><ul class="tech-list"><li><strong>No Oracle credentials in React.</strong></li><li>All database access goes through the TypeScript API.</li><li>Use parameterized SQL and transactions.</li><li>Authorization is enforced server-side.</li><li>Business rules are not implemented only in the UI.</li><li>Oracle constraints remain the final data-integrity layer.</li><li>Audit comments and design notes are preserved with project artifacts.</li></ul></div></div>
    <div class="card" style="margin-top:16px"><div class="card-title"><div><h2>Design Studio → implementation</h2><span class="muted small-text">Every design layer maps directly to the target stack.</span></div></div><div class="tech-mapping">${[["Business Requirements","TypeScript use cases, validations and acceptance tests"],["Screen Designer","React pages + reusable TypeScript components"],["ERD / Database","Oracle DDL + indexes + constraints"],["Backend Logic","TypeScript routes + services + transactions"],["Traceability","Requirement → Screen → Entity → API → Logic"],["Comments","Architect decisions, assumptions, questions and review notes"]].map(x=>`<div><strong>${x[0]}</strong><span>→</span><em>${x[1]}</em></div>`).join("")}</div></div>
    <div class="arch-nav-panel"><div class="arch-nav-head"><div><div class="eyebrow">QUICK NAVIGATION</div><h3>Jump to any part of the studio</h3></div><div class="arch-global-links">${nav.map(id=>`<button class="btn tiny" data-view="${id}">${id[0].toUpperCase()+id.slice(1)}</button>`).join("")}</div></div></div>
    <div class="tech-next"><div><div class="eyebrow">RECOMMENDED NEXT STEP</div><strong>Design Security + Identity first.</strong><p>Define users, roles, permissions, audit and authentication patterns before implementing Personnel, Payroll, Finance or the other business modules.</p></div><button class="btn primary" data-view="requirements">Start Requirements</button></div>`;
}

function moduleStageStatus(m){
  const c=counts(m.id);
  const stage=[
    {key:'requirements',label:'Gather Requirements',count:c.requirements,icon:'1',desc:'Business needs, actors, rules and acceptance criteria.'},
    {key:'screens',label:'Suggested Screens',count:c.screens,icon:'2',desc:'Oracle Forms mapped to the new suggested UI.'},
    {key:'backend',label:'Backend Logic',count:c.apis+c.logic,icon:'3',desc:'APIs, validations, workflows, permissions and automation.'},
    {key:'erd',label:'ERD',count:c.entities,icon:'4',desc:'Tables, fields, keys and relationships.'},
    {key:'testing',label:'Testing',count:c.tests,icon:'5',desc:'Test cases, execution steps, expected results and review comments.'}
  ];
  return stage.map(x=>({...x,status:x.count>0?'started':'not-started'}));
}
function moduleProgress(m){
  const c=counts(m.id);
  const values=[c.requirements>0,c.screens>0,(c.apis+c.logic)>0,c.entities>0,c.tests>0];
  return Math.round(values.filter(Boolean).length/5*100);
}
function renderModules(){
  const stages=project.modules.map(m=>({m,stages:moduleStageStatus(m),progress:moduleProgress(m)}));
  const rail=stages.map(({m,progress})=>{
    const c=counts(m.id);
    return `<button class="module-rail-card ${state.moduleId===m.id?'active':''}" data-module="${m.id}" data-target="module-workspace">
      <div class="module-rail-top"><span class="module-rail-icon">${esc(m.icon)}</span><span class="module-progress">${progress}%</span></div>
      <strong>${esc(m.name)}</strong><small>${c.requirements} req · ${c.screens} screens · ${c.entities} tables</small>
    </button>`;
  }).join('<div class="module-rail-arrow">→</div>');
  const stageCards=stages.map(({m,stages,progress})=>`<article class="module-blueprint-card">
    <div class="module-blueprint-head"><div><span class="eyebrow">MODULE ${esc(m.id)}</span><h3>${esc(m.name)}</h3><p>${esc(m.description)}</p></div><div class="module-blueprint-progress"><b>${progress}%</b><span>design complete</span></div></div>
    <div class="stage-grid">${stages.map(x=>`<button class="stage-card ${x.status}" data-module="${m.id}" data-target="${['backend','erd','testing'].includes(x.key)?x.key:'module-workspace'}" ${['backend','erd','testing'].includes(x.key)?'':'data-stage=\"'+x.key+'\"'}><span class="stage-number">${x.icon}</span><div><strong>${x.label}</strong><small>${x.desc}</small><em>${x.count} artifact${x.count===1?'':'s'} · ${x.status==='started'?'Started':'Not started'}</em></div><span class="stage-arrow">→</span></button>`).join('')}</div>
  </article>`).join('');
  $('#content').innerHTML=`
    <div class="blueprint-hero"><div><span class="eyebrow">SYSTEM BLUEPRINT</span><h1>Modules → Requirements → Screens → Backend → ERD → Testing</h1><p>The module is the spine of the design. Every module moves through the same four stages, while the existing designers remain available as specialist tools.</p></div><div class="blueprint-hero-actions"><button class="btn primary" data-action="new-module">＋ New Module</button><button class="btn secondary" data-view="project-erd">Full ERD</button><button class="btn secondary" data-view="tasks">Tasks</button></div></div>
    <div class="module-rail-wrap"><div class="eyebrow">MODULES</div><div class="module-rail">${rail}</div></div>
    <div class="blueprint-section-head"><div><span class="eyebrow">FIVE-STAGE DESIGN MODEL</span><h2>Design each module the same way</h2></div><span class="muted small-text">Click any stage to open its module workspace.</span></div>
    <div class="module-blueprint-list">${stageCards}</div>`;
}

function renderModuleWorkspace(){
  const m=moduleById(state.moduleId)||project.modules[0];
  if(!m){state.view='modules';renderModules();return;}
  const c=counts(m.id), progress=moduleProgress(m), tab=state.tab||'requirements';
  const req=project.requirements.filter(x=>x.moduleId===m.id), screens=project.screens.filter(x=>x.moduleId===m.id), apis=project.apis.filter(x=>x.moduleId===m.id), logic=project.logic.filter(x=>x.moduleId===m.id), ents=project.entities.filter(x=>x.moduleId===m.id), tasks=(project.timeline||[]).filter(x=>x.moduleId===m.id);
  const tabs=[['requirements','1','Gather Requirements',c.requirements],['screens','2','Suggested Screens',c.screens],['backend','3','Backend Logic',c.apis+c.logic],['erd','4','ERD',c.entities],['testing','5','Testing',c.tests]];
  const tabButtons=tabs.map(t=>`<button class="workspace-tab ${tab===t[0]?'active':''}" data-tab="${t[0]}"><span>${t[1]}</span><div><b>${t[2]}</b><small>${t[3]} artifacts</small></div></button>`).join('');
  let body='';
  if(tab==='requirements') body=`<div class="workspace-stage-head"><div><span class="eyebrow">STAGE 1</span><h2>Gather Requirements</h2><p>Capture what the business needs before deciding how the new system should look or work.</p></div><button class="btn primary" data-action="new-requirement">＋ Requirement</button></div><div class="artifact-list">${req.map(r=>`<div class="artifact-row"><div class="artifact-id">${esc(r.id)}</div><div><strong>${esc(r.title)}</strong><small>${esc(r.actor||'No actor')} · ${esc(r.priority||'Medium')} · ${esc(r.status||'Draft')}</small>${linkedObjects("requirement",r.id)}</div><button class="btn tiny" data-action="edit-requirement" data-id="${r.id}">Open</button></div>`).join('')||`<div class="empty"><strong>No requirements yet</strong><p>Start by capturing the business requirement for ${esc(m.name)}.</p><button class="btn primary" data-action="new-requirement">＋ Add requirement</button></div>`}</div>`;
  if(tab==='screens') {
    const moduleRefs=(project.references||[]).filter(r=>r.moduleId===m.id && (r.type||'').toLowerCase().includes('oracle'));
    body=`<div class="workspace-stage-head"><div><span class="eyebrow">STAGE 2</span><h2>Suggested Screens</h2><p>Keep the legacy Oracle Forms visible as the source while designing the new user experience.</p></div><div><button class="btn secondary" data-view="references" data-module="${m.id}">Reference Library</button> <label class="btn secondary file-btn">＋ Oracle Form Photo<input id="moduleOracleUpload" type="file" accept="image/*" multiple hidden></label> <button class="btn primary" data-action="new-screen">＋ Screen</button></div></div><div class="oracle-reference-strip"><div class="oracle-reference-head"><div><strong>Oracle Forms references</strong><span>Upload screenshots for ${esc(m.name)} and keep them beside the proposed screens.</span></div><span class="tag orange">${moduleRefs.length} photos</span></div><div class="oracle-reference-grid">${moduleRefs.map(r=>`<div class="oracle-ref-thumb"><img src="${r.dataUrl}" alt="${esc(r.title||'Oracle Form')}"><div><strong>${esc(r.title||'Oracle Form')}</strong><button class="icon-btn danger" data-action="delete-reference" data-id="${r.id}">×</button></div></div>`).join('')||'<div class="oracle-ref-empty">No Oracle Form photos uploaded for this module yet.</div>'}</div></div><div class="screen-mapping-grid">${screens.map(s=>`<div class="screen-mapping-card"><div class="screen-mapping-columns"><div><span class="legacy-label">ORACLE / CURRENT</span><strong>${esc(s.oracleForm||'Legacy form not mapped')}</strong><small>${esc(s.oracleDescription||'Capture current Oracle behavior here.')}</small></div><div class="mapping-arrow">→</div><div><span class="new-label">NEW SUGGESTED</span><strong>${esc(s.name)}</strong><small>${esc(s.description||'New screen specification')}</small></div></div><div class="mapping-footer"><span>${(s.components||[]).length} components</span>${linkedObjects("screen",s.id)}<button class="btn tiny" data-open-screen="${s.id}">Design</button></div></div>`).join('')||`<div class="empty"><strong>No screens yet</strong><p>Create the first Oracle-to-new screen mapping.</p></div>`}</div>`;
  }
  if(tab==='backend') body=`<div class="workspace-stage-head"><div><span class="eyebrow">STAGE 3</span><h2>Backend Logic</h2><p>Define the API contracts, permissions, validations, workflows and automations behind the screens.</p></div><div><button class="btn secondary" data-view="backend" data-module="${m.id}">Open Backend Designer</button><button class="btn primary" data-action="new-api">＋ API</button></div></div><div class="grid two"><div class="card"><div class="card-title"><h3>API Contracts</h3></div>${apis.map(a=>`<div class="artifact-row"><div class="artifact-id">${esc(a.method)}</div><div><strong>${esc(a.name)}</strong><small>${esc(a.path)} · ${esc(a.status||'Draft')}</small></div><button class="btn tiny" data-action="edit-api" data-id="${a.id}">Open</button></div>`).join('')||'<div class="empty">No APIs defined.</div>'}</div><div class="card"><div class="card-title"><h3>Workflows</h3><button class="btn tiny" data-action="new-logic">＋</button></div>${logic.map(l=>`<div class="artifact-row"><div class="artifact-id">WF</div><div><strong>${esc(l.name)}</strong><small>${esc(l.trigger)}</small></div><button class="btn tiny" data-action="edit-logic" data-id="${l.id}">Open</button></div>`).join('')||'<div class="empty">No backend workflows defined.</div>'}</div></div>`;
  if(tab==='erd') body=`<div class="workspace-stage-head"><div><span class="eyebrow">STAGE 4</span><h2>ERD</h2><p>Define the Oracle tables, fields and relationships required by this module.</p></div><div><button class="btn secondary" data-view="erd" data-module="${m.id}">Open Module ERD</button><button class="btn primary" data-action="new-entity">＋ Table</button></div></div><div class="erd-mini-summary"><div><b>${ents.length}</b><span>Tables</span></div><div><b>${ents.reduce((n,e)=>n+(e.fields||[]).length,0)}</b><span>Fields</span></div><div><b>${project.relations.filter(r=>ents.some(e=>e.id===r.from)&&ents.some(e=>e.id===r.to)).length}</b><span>Relationships</span></div></div><div class="artifact-list">${ents.map(e=>`<div class="artifact-row"><div class="artifact-id">◇</div><div><strong>${esc(e.name)}</strong><small>${(e.fields||[]).length} fields · ${esc(moduleById(e.moduleId)?.name||'')}</small>${linkedObjects("entity",e.id)}</div><button class="btn tiny" data-action="edit-entity" data-id="${e.id}">Open</button></div>`).join('')||'<div class="empty">No tables defined for this module.</div>'}</div>`;
  if(tab==='testing') {
    const tests=(project.tests||[]).filter(t=>t.moduleId===m.id);
    body=`<div class="workspace-stage-head"><div><span class="eyebrow">STAGE 5</span><h2>Testing</h2><p>Execute functional, integration, UI and acceptance tests for this module. Every test can contain detailed steps with individual status and comments.</p></div><div><button class="btn secondary" data-view="testing" data-module="${m.id}">Open Testing Center</button><button class="btn primary" data-action="new-test">＋ Test Case</button></div></div><div class="testing-mini-summary"><div><b>${tests.length}</b><span>Test cases</span></div><div><b>${tests.filter(t=>t.status==='Passed').length}</b><span>Passed</span></div><div><b>${tests.filter(t=>t.status==='Failed').length}</b><span>Failed</span></div><div><b>${tests.filter(t=>t.status==='Blocked').length}</b><span>Blocked</span></div></div><div class="artifact-list">${tests.map(t=>`<div class="artifact-row"><div class="artifact-id">🧪</div><div><strong>${esc(t.name)}</strong><small>${esc(t.type||'Functional')} · ${esc(t.status||'Not Run')} · ${(t.steps||[]).length} steps</small></div><button class="btn tiny" data-action="edit-test" data-id="${t.id}">Open</button></div>`).join('')||'<div class="empty">No test cases defined for this module yet.</div>'}</div>`;
  }
  $('#content').innerHTML=`<div class="module-workspace-head"><button class="btn secondary" data-view="modules">← Blueprint</button><div class="workspace-module-title"><span class="module-icon">${esc(m.icon)}</span><div><span class="eyebrow">MODULE WORKSPACE</span><h1>${esc(m.name)}</h1><p>${esc(m.description)}</p></div></div><div class="workspace-progress"><b>${progress}%</b><span>5-stage completion</span><div class="progress"><span style="width:${progress}%"></span></div></div></div><div class="workspace-tabs">${tabButtons}</div><div class="workspace-stage-panel">${body}</div>`;
  $$('[data-open-screen]').forEach(b=>b.onclick=()=>{state.moduleId=m.id;state.screenId=b.dataset.openScreen;state.view='screens';render();});
  $('#moduleOracleUpload')?.addEventListener('change',e=>handleReferenceFiles(e.target.files,m.id,null,'Oracle Form'));
}

function renderTasks(){
  const tasks=(project.timeline||[]).slice().sort((a,b)=>a.start.localeCompare(b.start));
  const groups=['Planned','In Progress','Blocked','Done'];
  const cards=groups.map(status=>`<div class="task-column"><div class="task-column-head"><span>${status}</span><b>${tasks.filter(t=>t.status===status).length}</b></div>${tasks.filter(t=>t.status===status).map(t=>`<button class="task-card" data-action="edit-timeline-task" data-id="${t.id}"><span class="task-id">${esc(t.id)}</span><strong>${esc(t.name)}</strong><small>${esc(moduleById(t.moduleId)?.name||'Project')} · ${esc(t.layer||'Work')}</small><em>${fmtDate(t.start)} → ${fmtDate(t.end)}</em></button>`).join('')||'<div class="task-empty">No tasks</div>'}</div>`).join('');
  const linked=tasks.filter(t=>t.moduleId).length;
  $('#content').innerHTML=`<div class="tasks-hero"><div><span class="eyebrow">DELIVERY CONTROL</span><h1>Tasks & Traceability</h1><p>Track every delivery item and connect it back to its module and design stage.</p></div><div><button class="btn secondary" data-view="timeline">Timeline</button><button class="btn secondary" data-view="task-board">Task Board</button><button class="btn primary" data-action="new-timeline-task">＋ Task</button></div></div><div class="task-summary"><div><b>${tasks.length}</b><span>Total tasks</span></div><div><b>${tasks.filter(t=>t.status==='Done').length}</b><span>Done</span></div><div><b>${tasks.filter(t=>t.status==='In Progress').length}</b><span>In progress</span></div><div><b>${tasks.filter(t=>t.status==='Blocked').length}</b><span>Blocked</span></div><div><b>${linked}</b><span>Module-linked</span></div></div><div class="task-board">${cards}</div><div class="card task-trace-table"><div class="card-title"><div><h2>Artifact trace</h2><span class="muted small-text">Use Traceability for clickable requirement-to-delivery links.</span></div><button class="btn secondary" data-view="traceability">Open Traceability Matrix</button></div>${project.modules.map(m=>{const c=counts(m.id),p=moduleProgress(m);return `<div class="task-trace-row"><div><strong>${esc(m.name)}</strong><small>${p}% complete</small></div><span>${c.requirements} req</span><span>${c.screens} screens</span><span>${c.apis+c.logic} backend</span><span>${c.entities} tables</span><button class="btn tiny" data-module="${m.id}" data-target="module-workspace">Open</button></div>`}).join('')}</div>`;
}

function renderTaskBoard(){
  const all=(project.timeline||[]).slice();
  const moduleId=state.taskBoardModule||'ALL';
  const assignee=state.taskBoardAssignee||'ALL';
  const status=state.taskBoardStatus||'ALL';
  const filtered=all.filter(t=>(moduleId==='ALL'||t.moduleId===moduleId)&&(assignee==='ALL'||String(t.assigneeId||'')===assignee)&&(status==='ALL'||t.status===status));
  const users=project.security?.users||[];
  const assigneeName=t=>t.assigneeName || users.find(u=>u.id===t.assigneeId)?.displayName || users.find(u=>u.id===t.assigneeId)?.username || 'Unassigned';
  const byAssignee=[...new Set(filtered.map(assigneeName))].sort((a,b)=>a.localeCompare(b));
  const rows=byAssignee.length?byAssignee.map(name=>{const ts=filtered.filter(t=>assigneeName(t)===name);return `<tr><td><strong>${esc(name)}</strong></td><td>${ts.length}</td><td>${ts.filter(t=>t.status==='Planned').length}</td><td>${ts.filter(t=>t.status==='In Progress').length}</td><td>${ts.filter(t=>t.status==='Blocked').length}</td><td>${ts.filter(t=>t.status==='Done').length}</td><td>${ts.map(t=>`<button class="link-button" data-action="edit-timeline-task" data-id="${esc(t.id)}">${esc(t.name)}</button>`).join('<br>')}</td></tr>`}).join(''):`<tr><td colspan="7"><div class="empty">No tasks match the selected filters.</div></td></tr>`;
  const statusCards=['Planned','In Progress','Blocked','Done'].map(st=>`<div class="metric card"><div class="metric-icon">${st==='Done'?'✓':st==='Blocked'?'!':st==='In Progress'?'▶':'○'}</div><div class="number">${filtered.filter(t=>t.status===st).length}</div><div class="label">${st}</div></div>`).join('');
  $('#content').innerHTML=`<div class="card"><div class="card-title"><div><span class="eyebrow">DELIVERY OWNERSHIP</span><h2>Task Board</h2><span class="muted small-text">All tasks grouped by assignee and status. Click a task to open it.</span></div><button class="btn primary" data-action="new-timeline-task">＋ New Task</button></div><div class="toolbar"><div class="left"><label class="field"><span>Module</span><select id="taskBoardModule"><option value="ALL">All Modules</option>${project.modules.map(m=>`<option value="${esc(m.id)}" ${m.id===moduleId?'selected':''}>${esc(m.name)}</option>`).join('')}</select></label><label class="field"><span>Assignee</span><select id="taskBoardAssignee"><option value="ALL">All Assignees</option>${users.map(u=>`<option value="${esc(u.id)}" ${u.id===assignee?'selected':''}>${esc(u.displayName||u.username)}</option>`).join('')}</select></label><label class="field"><span>Status</span><select id="taskBoardStatus"><option value="ALL">All Statuses</option>${['Planned','In Progress','Blocked','Done'].map(x=>`<option value="${x}" ${x===status?'selected':''}>${x}</option>`).join('')}</select></label></div></div></div><div class="grid cards">${statusCards}</div><div class="card"><div class="card-title"><h2>Tasks by Assignee</h2><span class="muted small-text">${filtered.length} matching task(s)</span></div><div class="table-wrap"><table class="table"><thead><tr><th>Assignee</th><th>Total</th><th>Planned</th><th>In Progress</th><th>Blocked</th><th>Done</th><th>Tasks</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
  $('#taskBoardModule').onchange=e=>{state.taskBoardModule=e.target.value;renderTaskBoard();};
  $('#taskBoardAssignee').onchange=e=>{state.taskBoardAssignee=e.target.value;renderTaskBoard();};
  $('#taskBoardStatus').onchange=e=>{state.taskBoardStatus=e.target.value;renderTaskBoard();};
}

function moduleBanner(m){
  const c=counts(m.id);
  return `<div class="module-banner"><div><span class="eyebrow" style="color:#b9c9e2">${m.icon} MODULE</span><h2>${esc(m.name)}</h2><p>${esc(m.description)}</p></div><div class="module-stat">${c.requirements} Requirements · ${c.screens} Screens · ${c.entities} Tables · ${c.apis} APIs</div></div>`;
}

function moduleSelector(selected=""){
  return `<select name="moduleId">${project.modules.map(m=>`<option value="${m.id}" ${m.id===selected?"selected":""}>${esc(m.name)}</option>`).join("")}</select>`;
}

function renderRequirements(){
  const m=state.moduleId?moduleById(state.moduleId):null;
  const arr=m?project.requirements.filter(x=>x.moduleId===m.id):project.requirements;
  $("#content").innerHTML=`
    ${m?moduleBanner(m):""}
    <div class="toolbar"><div class="left"><input class="search" id="reqSearch" placeholder="Search requirements..."></div><div class="right"><button class="btn primary" data-action="new-requirement">＋ Requirement</button></div></div>
    <div class="table-wrap"><table class="table"><thead><tr><th>ID</th><th>Module</th><th>Title</th><th>Actor</th><th>Priority</th><th>Status</th><th>Linked Objects</th><th>Actions</th></tr></thead><tbody id="reqRows">
      ${arr.length?arr.map(r=>`<tr data-search="${esc((r.id+" "+r.title+" "+r.actor).toLowerCase())}"><td><strong>${esc(r.id)}</strong></td><td>${esc(moduleById(r.moduleId)?.name)}</td><td>${esc(r.title)}${r.comments?`<span class="comment-badge">💬</span>`:""}</td><td>${esc(r.actor)}</td><td><span class="tag ${r.priority==="High"?"orange":""}">${esc(r.priority)}</span></td><td><span class="tag ${r.status==="Approved"?"green":"blue"}">${esc(r.status)}</span></td><td>${linkedObjects("requirement",r.id)}</td><td><div class="actions"><button class="icon-btn" data-action="edit-requirement" data-id="${r.id}">✎</button><button class="icon-btn danger" data-action="delete-requirement" data-id="${r.id}">×</button></div></td></tr>`).join(""):`<tr><td colspan="8"><div class="empty"><strong>No requirements yet</strong>Add the first business requirement for this module.</div></td></tr>`}
    </tbody></table></div>`;
  const s=$("#reqSearch"); if(s)s.oninput=()=>$$("[data-search]").forEach(tr=>tr.style.display=tr.dataset.search.includes(s.value.toLowerCase())?"":"none");
}

function renderReferences(){
  project.references ||= [];
  const refs=project.references;
  const cards=refs.map(r=>`<button class="reference-photo-card" data-reference-open="${r.id}" title="${esc(r.title||'Reference image')}"><img src="${r.dataUrl}" alt="${esc(r.title||'Reference image')}"></button>`).join('');
  $('#content').innerHTML=`<div class="references-simple-head"><div><div class="eyebrow">REFERENCE PHOTOS</div><h1>Reference Images</h1><p>Upload and view the visual references used by the project.</p></div><label class="btn primary file-btn">＋ Upload Photos<input id="referenceUpload" type="file" accept="image/*" multiple hidden></label></div><div class="reference-simple-grid">${cards||`<div class="reference-simple-empty"><div class="empty-icon">▧</div><h2>No photos uploaded</h2><p>Upload Oracle Forms screenshots, UI references or process images.</p><label class="btn primary file-btn">Upload Photos<input id="referenceUploadEmpty" type="file" accept="image/*" multiple hidden></label></div>`}</div>`;
  const upload=e=>handleReferenceFiles(e.target.files,null,null,'Reference');
  $('#referenceUpload')?.addEventListener('change',upload); $('#referenceUploadEmpty')?.addEventListener('change',upload);
  $$('#content [data-reference-open]').forEach(b=>b.onclick=()=>showReferencePreview(refs.find(r=>r.id===b.dataset.referenceOpen)));
}
function showReferencePreview(r){
  if(!r)return;
  const overlay=document.createElement('div');overlay.className='image-preview-overlay';
  overlay.innerHTML=`<div class="image-preview-window"><button class="icon-btn image-preview-close">×</button><img src="${r.dataUrl}" alt="${esc(r.title||'Reference image')}"></div>`;
  document.body.appendChild(overlay);overlay.onclick=e=>{if(e.target===overlay||e.target.closest('.image-preview-close'))overlay.remove()};
}

function renderScreens(){
  if(!state.moduleId && !state.screenId){
    const groups=project.modules.map(m=>{const ss=project.screens.filter(s=>s.moduleId===m.id);return `<div class="screen-module-card"><div class="screen-module-card-head"><div><span class="eyebrow">${esc(m.name)}</span><h3>${ss.length} screens</h3></div><button class="btn tiny" data-module="${m.id}" data-target="screens">Open module</button></div><div class="screen-module-screen-list">${ss.map(s=>`<button data-open-screen="${s.id}"><span>▣</span><div><strong>${esc(s.name)}</strong><small>${esc(s.type||'Screen')} · ${(s.components||[]).length} components</small>${linkedObjects("screen",s.id)}</div></button>`).join('') || '<div class="muted small-text">No screens yet.</div>'}</div><button class="btn secondary" style="width:100%;margin-top:10px" data-action="new-screen-for-module" data-id="${m.id}">＋ Add screen to ${esc(m.name)}</button></div>`}).join('');
    $("#content").innerHTML=`<div class="screen-overview-head"><div><div class="eyebrow">SCREEN DESIGN SYSTEM</div><h2>All Module Screens</h2><p>Every module has its own screen library. Open any screen to design components, data mapping, validation and comments.</p></div><button class="btn primary" data-action="new-screen">＋ New Screen</button></div><div class="screen-module-grid">${groups}</div>`;
    $$('[data-open-screen]').forEach(b=>b.onclick=()=>{const sc=project.screens.find(x=>x.id===b.dataset.openScreen);state.moduleId=sc?.moduleId;state.screenId=sc?.id;state.selectedComponentId=null;renderScreens();});
    $$('[data-action="new-screen-for-module"]').forEach(b=>b.onclick=(e)=>{e.preventDefault();e.stopPropagation();state.moduleId=b.dataset.id;state.screenId=null;state.selectedComponentId=null;state.editing={type:'screen',fromDesigner:true};modal('Create Screen',screenForm({id:uid('SCR'),moduleId:state.moduleId,name:'',type:'Form',status:'Draft',description:'',components:[],comments:''}),`<button class="btn secondary" data-action="close-modal">Cancel</button><button class="btn primary" data-action="submit-modal">Create Screen</button>`,true);});
    return;
  }
  const module = moduleById(state.moduleId) || project.modules[0];
  const screens = project.screens.filter(s=>s.moduleId===module?.id);
  const active = project.screens.find(s=>s.id===state.screenId) || screens[0];
  if(active){ state.screenId=active.id; }

  if(!active){
    $("#content").innerHTML=`
      <div class="empty-state screen-empty">
        <div class="empty-icon">▣</div>
        <h2>No screens yet</h2>
        <p>Create the first screen for <b>${esc(module?.name||"this module")}</b> and start designing the workflow.</p>
        <button class="btn primary" data-action="new-screen">+ Create Screen</button>
      </div>`;
    return;
  }

  const components = active.components || [];
  const selectedId = state.selectedComponentId || components[0]?.id;
  const selected = components.find(c=>c.id===selectedId) || null;

  const componentTypes = [
    ["text","Text Input","Aa","Capture text, codes and identifiers"],
    ["number","Number","123","Numeric value with validation"],
    ["date","Date","▣","Date picker"],
    ["datetime","Date & Time","◷","Date and time"],
    ["select","Select","⌄","Single choice"],
    ["multiselect","Multi Select","☷","Multiple choices"],
    ["checkbox","Checkbox","☑","Boolean value"],
    ["radio","Radio Group","◉","One choice from a small set"],
    ["textarea","Text Area","≡","Long-form text"],
    ["currency","Currency","$","Money value"],
    ["file","File Upload","↑","Upload document/image"],
    ["table","Data Table","▤","List/detail records"],
    ["button","Action Button","→","Submit, save, cancel, approve"],
    ["divider","Divider","—","Visual section divider"],
    ["heading","Section Heading","H","Visual grouping"],
    ["badge","Status Badge","●","Status / state indicator"],
    ["tabs","Tabs","▥","Group related screen areas"],
    ["display","Display Only","◉","Read-only display value"],
    ["hidden","Hidden","H","Hidden page item"],
    ["password","Password","••","Password input"],
    ["email","Email","@","Email address"],
    ["phone","Phone","☎","Telephone number"],
    ["url","URL","↗","Web address"],
    ["search","Search","⌕","Search field"],
    ["autocomplete","Autocomplete","⌄","Autocomplete / LOV"],
    ["popup_lov","Popup LOV","▣","Popup list of values"],
    ["shuttle","Shuttle","↔","Move values between lists"],
    ["switch","Switch","◐","On / off switch"],
    ["richtext","Rich Text","✎","Rich text editor"],
    ["image","Image","▧","Image display"],
    ["icon","Icon","◆","Icon / visual indicator"],
    ["region","Region","□","Container / region"],
    ["report","Interactive Report","▤","Report region"],
    ["grid","Interactive Grid","▦","Editable grid"],
    ["masterdetail","Master Detail","▥","Master-detail region"],
    ["chart","Chart","◒","Chart / visualization"],
    ["list","List","☷","Navigation or value list"],
    ["breadcrumb","Breadcrumb","›","Breadcrumb navigation"]
  ];

  const toolbarAction=(action,label,cls="")=>`<button class="btn ${cls}" data-screen-action="${action}">${label}</button>`;

  const canvasComponents = components.map((c,i)=>{
    const isSel=c.id===selected?.id;
    return `<div class="screen-component ${isSel?"selected":""} width-${String(c.width||"Half").toLowerCase()}" data-component-id="${c.id}" draggable="true">
      <div class="component-drag">⋮⋮</div>
      <div class="component-preview">
        ${renderComponentPreview(c)}
      </div>
      <div class="component-inline-meta">
        <span>${esc(c.label||c.type)}</span>
        ${c.required?'<b class="req-star">*</b>':""}
        ${c.entityField?`<small>↔ ${esc(c.entityField)}</small>`:""}
      </div>
      <div class="component-actions">
        <button data-component-edit="${c.id}" title="Edit">✎</button>
        <button data-component-duplicate="${c.id}" title="Duplicate">⧉</button>
        <button data-component-delete="${c.id}" title="Delete">×</button>
      </div>
    </div>`;
  }).join("");

  const properties = selected ? renderComponentProperties(selected, active, module) : `
    <div class="property-empty">
      <div class="property-empty-icon">✦</div>
      <strong>Select a component</strong>
      <span>Choose an element on the canvas to configure its label, validation, Oracle field mapping and behavior.</span>
    </div>`;

  $("#content").innerHTML=`
    <div class="screen-designer-shell">
      <div class="screen-topbar">
        <div class="screen-breadcrumb">
          <button class="icon-btn" data-screen-nav="list" title="Back to all screens">←</button>
          <div class="screen-breadcrumb-path"><button class="link-button" data-screen-nav="list">All Screens</button><span>›</span><button class="link-button" data-screen-nav="module">${esc(module?.name||"Module")}</button><span>›</span><strong>${esc(active.name||"Untitled Screen")}</strong></div>
          <div><div class="eyebrow">SCREEN DESIGNER</div><h1>${esc(active.name||"Untitled Screen")}</h1><span>${esc(module?.name||"Module")} · ${components.length} components${active.savedAt?` · Saved ${esc(fmtDate(active.savedAt))}`:''}</span></div>
        </div>
        <div class="screen-top-actions">
          <button class="btn secondary" data-screen-nav="previous">← Previous</button>
          <button class="btn secondary" data-screen-nav="next">Next →</button>
          ${toolbarAction("preview","▶ Preview","secondary")}
          <label class="btn secondary file-btn">＋ Screen Photo<input id="screenPhotoUpload" type="file" accept="image/*" multiple hidden></label>
          <label class="btn secondary file-btn">＋ Reference Screen<input id="screenReferenceUpload" type="file" accept="image/*" multiple hidden></label>
          ${toolbarAction("screen-settings","⚙ Screen Settings","secondary")}
          ${toolbarAction("comment","💬 Comment","secondary")}
          ${toolbarAction("save","Save Screen","primary")}
        </div>
      </div>

      <div class="screen-workspace">
        <aside class="screen-sidebar screen-list-sidebar">
          <div class="screen-sidebar-title"><span>SCREENS</span><button class="icon-btn small" data-screen-action="new-screen">+</button></div>
          <div class="screen-module-select">
            <label>MODULE</label>
            <select data-screen-module>${project.modules.map(m=>`<option value="${m.id}" ${m.id===module?.id?"selected":""}>${esc(m.name)}</option>`).join("")}</select>
          </div>
          <div class="screen-list">
            ${screens.map(s=>`<button class="screen-list-item ${s.id===active.id?"active":""}" data-screen-select="${s.id}">
              <span class="screen-list-icon">▣</span><span><strong>${esc(s.name)}</strong><small>${(s.components||[]).length} components</small></span>
            </button>`).join("")}
          </div>
          <div class="screen-sidebar-footer">
            <button class="side-tool" data-screen-action="duplicate-screen">⧉ Duplicate screen</button>
            <button class="side-tool" data-screen-action="delete-screen">⌫ Delete screen</button>
          </div>
        </aside>

        <aside class="screen-sidebar component-palette">
          <div class="screen-sidebar-title"><span>COMPONENTS</span></div>
          <div class="palette-search"><span>⌕</span><input id="componentSearch" placeholder="Search components..."></div>
          <div class="palette-groups">
            <div class="palette-group"><div class="palette-group-title">INPUTS</div>
              ${componentTypes.slice(0,11).map(t=>`<button class="palette-item" draggable="true" data-add-component="${t[0]}" title="${esc(t[3])}"><i>${t[2]}</i><span>${t[1]}</span></button>`).join("")}
            </div>
            <div class="palette-group"><div class="palette-group-title">LOV / APEX ITEMS</div>
              ${componentTypes.slice(11,23).map(t=>`<button class="palette-item" draggable="true" data-add-component="${t[0]}" title="${esc(t[3])}"><i>${t[2]}</i><span>${t[1]}</span></button>`).join("")}
            </div>
            <div class="palette-group"><div class="palette-group-title">LAYOUT & DISPLAY</div>
              ${componentTypes.slice(23).map(t=>`<button class="palette-item" draggable="true" data-add-component="${t[0]}" title="${esc(t[3])}"><i>${t[2]}</i><span>${t[1]}</span></button>`).join("")}
            </div>
          </div>
        </aside>

        <main class="screen-canvas-area">
          <div class="canvas-toolbar">
            <div class="canvas-tool-group">
              <button class="canvas-tool active" data-canvas="desktop">▣ Desktop</button>
              <button class="canvas-tool" data-canvas="tablet">▤ Tablet</button>
              <button class="canvas-tool" data-canvas="mobile">▥ Mobile</button>
            </div>
            <div class="canvas-tool-group">
              <button class="canvas-tool" data-screen-action="undo">↶</button>
              <button class="canvas-tool" data-screen-action="redo">↷</button>
              <span class="canvas-divider"></span>
              <button class="canvas-tool" data-screen-action="zoom-out">−</button>
              <span class="zoom-value">100%</span>
              <button class="canvas-tool" data-screen-action="zoom-in">+</button>
            </div>
          </div>

          <div class="screen-canvas-scroll">
            <div class="screen-artboard desktop" id="screenArtboard">
              <div class="artboard-browserbar"><span></span><span></span><span></span><b>${esc(active.name||"Screen")}</b></div>
              <div class="artboard-appbar"><strong>Enterprise System</strong><span>${esc(module?.name||"Module")}</span><span class="appbar-user">User ▾</span></div>
              <div class="artboard-content">
                <div class="screen-ui-header"><div><small>${esc(module?.name||"Module")}</small><h2>${esc(active.name||"Untitled Screen")}</h2></div><div class="screen-ui-actions"><button>Cancel</button><button class="primary-mini">Save</button></div></div>
                <div class="screen-ui-body">${canvasComponents || `<div class="drop-placeholder">Drag components here or click an item from the Component Library.</div>`}</div>
              </div>
            </div>
          </div>

          <div class="canvas-statusbar"><span>● Design saved locally</span><span>Grid 8px</span><span>${components.length} components</span><span>Oracle mapping ${components.filter(c=>c.entityField).length}/${components.length}</span></div>
          <div class="screen-reference-strip"><div class="screen-reference-strip-head"><strong>Screen photos & references</strong><span>${project.references.filter(r=>r.screenId===active.id).length} images</span></div><div class="screen-reference-strip-grid">${project.references.filter(r=>r.screenId===active.id).map(r=>`<button class="screen-reference-photo" data-reference-open="${r.id}" title="${esc(r.type||'Reference')}"><img src="${r.dataUrl}" alt="${esc(r.title||'Screen reference')}"><small>${esc(r.type||'Reference')}</small></button>`).join('')||'<span class="muted small-text">Upload a screen photo or reference screen above.</span>'}</div></div>
        </main>

        <aside class="screen-properties">
          <div class="properties-header"><div><span>PROPERTIES</span><strong>${selected?esc(selected.label||selected.type):"Screen"}</strong></div><button class="icon-btn small" data-screen-action="comment" title="Add comment">💬</button></div>
          <div class="properties-tabs"><button class="property-tab active" data-prop-tab="design">Design</button><button class="property-tab" data-prop-tab="data">Data</button><button class="property-tab" data-prop-tab="validation">Validation</button><button class="property-tab" data-prop-tab="comments">Comments</button></div>
          <div class="properties-body">${properties}</div>
        </aside>
      </div>
    </div>

    <div class="screen-bottom-strip">
      <div><strong>Screen blueprint</strong><span>Every visual component can map to an Oracle field, API contract, validation rule and business requirement.</span></div>
      <div class="screen-bottom-links">
        <button class="btn tiny" data-view="requirements">Requirements</button>
        <button class="btn tiny" data-view="erd">ERD</button>
        <button class="btn tiny" data-view="backend">API / Logic</button>
        <button class="btn tiny" data-view="traceability">Traceability</button>
      </div>
    </div>`;
  bindScreenDesigner(active);
  $$('[data-screen-nav]').forEach(b=>b.onclick=()=>{
    const action=b.dataset.screenNav;
    if(action==='list'){state.screenId=null;state.selectedComponentId=null;renderScreens();return;}
    if(action==='module'){state.screenId=null;state.selectedComponentId=null;renderScreens();return;}
    const idx=screens.findIndex(x=>x.id===active.id);
    const target=action==='previous'?screens[idx-1]:screens[idx+1];
    if(target){state.screenId=target.id;state.moduleId=target.moduleId;state.selectedComponentId=null;renderScreens();}
  });
  const screenRefs=project.references.filter(r=>r.screenId===active.id);
  $('#screenPhotoUpload')?.addEventListener('change',e=>handleReferenceFiles(e.target.files,active.moduleId,active.id,'Screen Photo'));
  $('#screenReferenceUpload')?.addEventListener('change',e=>handleReferenceFiles(e.target.files,active.moduleId,active.id,'Reference Screen'));
  $$('.screen-reference-strip [data-reference-open]').forEach(b=>b.onclick=()=>showReferencePreview(screenRefs.find(r=>r.id===b.dataset.referenceOpen)));
}

function renderComponentPreview(c){
  const l=esc(c.label||"Field label");
  const ph=esc(c.placeholder||"Enter "+(c.label||"value"));
  switch(c.type){
    case "textarea": return `<label>${l}${c.required?'<em>*</em>':""}</label><textarea placeholder="${ph}"></textarea>`;
    case "select": return `<label>${l}${c.required?'<em>*</em>':""}</label><select><option>${esc(c.options?.[0]||"Select an option")}</option><option>Option 2</option></select>`;
    case "multiselect": return `<label>${l}</label><div class="fake-select">${esc(c.options?.[0]||"Select values")} <span>⌄</span></div>`;
    case "checkbox": return `<label class="fake-check"><input type="checkbox"> <span>${l}</span></label>`;
    case "radio": return `<label>${l}</label><div class="fake-radios"><span>◉ Option A</span><span>○ Option B</span></div>`;
    case "date": return `<label>${l}</label><div class="fake-input">dd/mm/yyyy <span>▣</span></div>`;
    case "datetime": return `<label>${l}</label><div class="fake-input">dd/mm/yyyy --:-- <span>◷</span></div>`;
    case "currency": return `<label>${l}</label><div class="fake-input">0.00 <span>${esc(c.currency||"EGP")}</span></div>`;
    case "file": return `<label>${l}</label><div class="upload-box">↑ Drop file or <b>browse</b></div>`;
    case "table": return `<div class="fake-table-title">${l}</div><div class="fake-table"><span>No.</span><span>Code</span><span>Description</span><span>Status</span><span>1</span><span>EMP-001</span><span>Sample record</span><span>Active</span></div>`;
    case "button": return `<button class="fake-button">${l||"Action"} →</button>`;
    case "divider": return `<div class="fake-divider"></div>`;
    case "heading": return `<h3 class="fake-heading">${l}</h3>`;
    case "badge": return `<label>${l}</label><span class="fake-badge">${esc(c.status||"Active")}</span>`;
    case "tabs": return `<div class="fake-tabs"><span class="active">Overview</span><span>Details</span><span>History</span></div>`;
    case "display": return `<label>${l}</label><div class="fake-display">${esc(c.defaultValue||"Read-only value")}</div>`;
    case "hidden": return `<div class="fake-hidden">Hidden item · ${l}</div>`;
    case "password": return `<label>${l}</label><input type="password" value="••••••••" readonly>`;
    case "email": return `<label>${l}</label><input type="email" placeholder="name@example.com">`;
    case "phone": return `<label>${l}</label><input type="tel" placeholder="+20 10 0000 0000">`;
    case "url": return `<label>${l}</label><input type="url" placeholder="https://example.com">`;
    case "search": return `<label>${l}</label><div class="fake-input">⌕ Search...</div>`;
    case "autocomplete": return `<label>${l}</label><div class="fake-input">Start typing... <span>⌄</span></div>`;
    case "popup_lov": return `<label>${l}</label><div class="fake-input">Select value <span>▣</span></div>`;
    case "shuttle": return `<label>${l}</label><div class="fake-shuttle"><span>Available<br>Item A<br>Item B</span><b>↔</b><span>Selected<br>Item C</span></div>`;
    case "switch": return `<label>${l}</label><div class="fake-switch"><span class="on"></span> On</div>`;
    case "richtext": return `<label>${l}</label><div class="fake-richtext"><b>B</b> <i>I</i> <u>U</u><hr>Rich text content...</div>`;
    case "image": return `<label>${l}</label><div class="fake-image">▧ Image</div>`;
    case "icon": return `<label>${l}</label><div class="fake-icon">◆</div>`;
    case "region": return `<div class="fake-region"><b>${l}</b><span>Region container</span></div>`;
    case "report": return `<div class="fake-table-title">${l}</div><div class="fake-table">ID&nbsp;&nbsp; Name&nbsp;&nbsp; Status<br>001&nbsp;&nbsp; Sample&nbsp;&nbsp; Active</div>`;
    case "grid": return `<div class="fake-grid"><span>A</span><span>B</span><span>C</span><span>1</span><span>2</span><span>3</span></div>`;
    case "masterdetail": return `<div class="fake-masterdetail"><b>${l}</b><span>Master</span><span>Detail</span></div>`;
    case "chart": return `<div class="fake-chart">◒ ${l}</div>`;
    case "list": return `<div class="fake-list"><b>${l}</b><span>Item 1</span><span>Item 2</span><span>Item 3</span></div>`;
    case "breadcrumb": return `<div class="fake-breadcrumb">Home › Module › ${l}</div>`;
    default: return `<label>${l}${c.required?'<em>*</em>':""}</label><input type="${c.type==="number"?"number":"text"}" placeholder="${ph}">`;
  }
}

function renderComponentProperties(c, screen, module){
  const fieldOptions=project.entities.flatMap(e=>(e.fields||[]).map(f=>({label:e.name+"."+f.name,value:e.id+"."+f.name,type:f.type})));
  const mapped=c.entityField||((c.entity&&c.field)?`${c.entity}.${c.field}`:"");
  return `<div class="prop-section"><div class="prop-section-title">BASIC</div>
    <label>Label<input data-prop="label" value="${esc(c.label||"")}"></label>
    <label>Helper text<textarea data-prop="helperText" rows="2">${esc(c.helperText||"")}</textarea></label>
    <label>Placeholder<input data-prop="placeholder" value="${esc(c.placeholder||"")}"></label>
    <div class="prop-two"><label>Width<select data-prop="width"><option value="Full">Full</option><option value="Half" ${c.width==='Half'?'selected':''}>Half</option><option value="Third" ${c.width==='Third'?'selected':''}>Third</option></select></label><label>Required<select data-prop="required"><option value="false" ${!c.required?'selected':''}>No</option><option value="true" ${c.required?'selected':''}>Yes</option></select></label></div></div>
  <div class="prop-section"><div class="prop-section-title">DATA SOURCE / MAPPING</div>
    <div class="prop-source-note">Record exactly where this field comes from. Use DB fields for direct mappings and Calculation / Rule for derived values.</div>
    <label>Database / Schema<input data-prop="dbSchema" value="${esc(c.dbSchema||"")}" placeholder="HR or HR_SCHEMA"></label>
    <label>Table<input data-prop="dbTable" value="${esc(c.dbTable||"")}" placeholder="EMPLOYEE"></label>
    <label>Column<input data-prop="dbColumn" value="${esc(c.dbColumn||"")}" placeholder="EMPLOYEE_NO"></label>
    <label>Source type<select data-prop="sourceType"><option value="DB" ${(!c.sourceType||c.sourceType==='DB')?'selected':''}>DB column</option><option value="CALCULATION" ${c.sourceType==='CALCULATION'?'selected':''}>Calculation</option><option value="RULE" ${c.sourceType==='RULE'?'selected':''}>Rule / derived</option><option value="API" ${c.sourceType==='API'?'selected':''}>API</option><option value="MANUAL" ${c.sourceType==='MANUAL'?'selected':''}>Manual entry</option></select></label>
    <label>Calculation / Rule<textarea data-prop="calculationRule" rows="3" placeholder="e.g. FULL_NAME = FIRST_NAME || ' ' || LAST_NAME; or employee must be active">${esc(c.calculationRule||c.validationRule||"")}</textarea></label>
    <label>Oracle entity / field<select data-prop="entityField"><option value="">Not mapped</option>${fieldOptions.map(f=>`<option value="${esc(f.value)}" ${mapped===f.value?'selected':''}>${esc(f.label)} · ${esc(f.type)}</option>`).join('')}</select></label>
    <label>API field name<input data-prop="apiField" value="${esc(c.apiField||"")}" placeholder="employeeNo"></label>
    <label>Default value<input data-prop="defaultValue" value="${esc(c.defaultValue||"")}"></label></div>
  <div class="prop-section"><div class="prop-section-title">VALIDATION</div>
    <div class="prop-two"><label>Min length<input type="number" data-prop="minLength" value="${esc(c.minLength??"")}"></label><label>Max length<input type="number" data-prop="maxLength" value="${esc(c.maxLength??"")}"></label></div>
    <label>Validation rule<input data-prop="validationRule" value="${esc(c.validationRule||"")}" placeholder="employeeNo must be unique"></label>
    <label>Pattern / Regex<input data-prop="pattern" value="${esc(c.pattern||"")}"></label></div>
  <div class="prop-section"><div class="prop-section-title">BEHAVIOR</div>
    <label>Visibility<select data-prop="visibility"><option ${!c.visibility||c.visibility==='Always'?'selected':''}>Always</option><option ${c.visibility==='Conditional'?'selected':''}>Conditional</option><option ${c.visibility==='Permission'?'selected':''}>Permission</option></select></label>
    <label>Read only<select data-prop="readOnly"><option value="false" ${!c.readOnly?'selected':''}>No</option><option value="true" ${c.readOnly?'selected':''}>Yes</option></select></label>
    <label>On change action<input data-prop="onChange" value="${esc(c.onChange||"")}" placeholder="loadPositions(departmentId)"></label>
    <label>Permission code<input data-prop="permission" value="${esc(c.permission||"")}" placeholder="EMPLOYEE.EDIT"></label></div>
  <div class="prop-section"><div class="prop-section-title">COMMENTS</div><textarea class="property-comment" data-prop="comments" rows="5" placeholder="Business rule, UX decision, open question, review note...">${esc(c.comments||c.comment||"")}</textarea></div>
  <div class="property-footer-actions"><div class="prop-action-row"><button class="btn secondary" data-component-move="up">↑ Move up</button><button class="btn secondary" data-component-move="down">↓ Move down</button></div><button class="btn danger-outline" data-component-delete="${c.id}">Delete component</button></div>`;
}

function bindScreenDesigner(active){
  $$("[data-screen-select]").forEach(b=>b.onclick=()=>{state.screenId=b.dataset.screenSelect;state.selectedComponentId=null;renderScreens();});
  $$("[data-screen-module]").forEach(s=>s.onchange=()=>{state.moduleId=s.value;state.screenId=null;renderScreens();});
  $$("[data-component-id]").forEach(el=>el.onclick=(ev)=>{if(ev.target.closest("button"))return;state.selectedComponentId=el.dataset.componentId;renderScreens();});
  $$("[data-component-edit]").forEach(b=>b.onclick=()=>{state.selectedComponentId=b.dataset.componentEdit;renderScreens();});
  $$("[data-component-delete]").forEach(b=>b.onclick=(ev)=>{ev.stopPropagation();deleteScreenComponent(b.dataset.componentDelete);});
  $$("[data-component-duplicate]").forEach(b=>b.onclick=(ev)=>{ev.stopPropagation();duplicateScreenComponent(b.dataset.componentDuplicate);});
  $$("[data-add-component]").forEach(b=>b.onclick=()=>addScreenComponent(b.dataset.addComponent));
  $$("[data-screen-action]").forEach(b=>b.onclick=()=>screenAction(b.dataset.screenAction));
  $$('[data-prop]').forEach(el=>{
    el.oninput=()=>updateComponentPropertySilent(el.dataset.prop,el.value);
    el.onchange=()=>{updateComponentPropertySilent(el.dataset.prop,el.value);saveProject(false);renderScreens();};
  });
  // Reorder components directly on the canvas.
  $$('.screen-component[draggable="true"]').forEach(el=>{
    el.addEventListener('dragstart',e=>{e.dataTransfer.setData('text/plain',el.dataset.componentId);el.classList.add('dragging')});
    el.addEventListener('dragend',()=>el.classList.remove('dragging'));
    el.addEventListener('dragover',e=>e.preventDefault());
    el.addEventListener('drop',e=>{
      e.preventDefault(); const fromId=e.dataTransfer.getData('text/plain'),toId=el.dataset.componentId;
      if(fromId&&toId&&fromId!==toId){reorderScreenComponents(fromId,toId);}
    });
  });
  $$("[data-canvas]").forEach(b=>b.onclick=()=>{
    $$("[data-canvas]").forEach(x=>x.classList.remove("active")); b.classList.add("active");
    const art=$("#screenArtboard"); if(!art)return;
    art.classList.remove("desktop","tablet","mobile"); art.classList.add(b.dataset.canvas);
    art.style.transform="none";
    const widths={desktop:1100,tablet:768,mobile:390}; art.style.width=(widths[b.dataset.canvas]||1100)+"px";
  });
  const search=$("#componentSearch");
  if(search) search.oninput=()=>$$(".palette-item").forEach(x=>x.style.display=x.textContent.toLowerCase().includes(search.value.toLowerCase())?"":"none");
  bindPropertyTabs();
}

function bindTouchScreenReorder(){
  const items=$$('.screen-component[data-component-id]');
  let drag=null;
  items.forEach(el=>{
    el.addEventListener('pointerdown',e=>{
      if(e.target.closest('button,input,select,textarea')) return;
      drag={el,startX:e.clientX,startY:e.clientY,moved:false};
      el.classList.add('pointer-dragging');
      try{el.setPointerCapture(e.pointerId);}catch(_){}
    });
    el.addEventListener('pointermove',e=>{
      if(!drag||drag.el!==el)return;
      const dx=e.clientX-drag.startX,dy=e.clientY-drag.startY;
      if(Math.hypot(dx,dy)<7)return;
      drag.moved=true;
      const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('.screen-component[data-component-id]');
      if(target && target!==el){
        const r=target.getBoundingClientRect();
        const after=e.clientY>r.top+r.height/2;
        const parent=target.parentElement;
        if(after) parent.insertBefore(el,target.nextSibling); else parent.insertBefore(el,target);
      }
    });
    el.addEventListener('pointerup',e=>{
      if(!drag||drag.el!==el)return;
      el.classList.remove('pointer-dragging');
      const moved=drag.moved; drag=null;
      if(moved){
        const s=project.screens.find(x=>x.id===state.screenId);
        if(s){
          const ids=$$('.screen-component[data-component-id]').map(x=>x.dataset.componentId);
          s.components.sort((a,b)=>ids.indexOf(a.id)-ids.indexOf(b.id));
          saveProject(false);
          showToast('Screen item reordered');
        }
      }
    });
    el.addEventListener('pointercancel',()=>{if(drag?.el===el){el.classList.remove('pointer-dragging');drag=null;renderScreens();}});
  });
}

function bindPaletteDrag(){
  $$('.palette-item[draggable="true"]').forEach(el=>{
    el.addEventListener('dragstart',e=>{e.dataTransfer.setData('text/plain',el.dataset.addComponent);el.classList.add('dragging')});
    el.addEventListener('dragend',()=>el.classList.remove('dragging'));
  });
  const art=$('#screenArtboard');
  if(art){
    art.addEventListener('dragover',e=>e.preventDefault());
    art.addEventListener('drop',e=>{const type=e.dataTransfer.getData('text/plain'); if(type && !e.target.closest('.screen-component')){addScreenComponent(type);}});
  }
}

function bindPropertyTabs(){
  $$('[data-prop-tab]').forEach(btn=>btn.onclick=()=>{
    $$('[data-prop-tab]').forEach(x=>x.classList.remove('active'));btn.classList.add('active');
    const target=btn.dataset.propTab;
    const labels={design:'BASIC',data:'DATA MAPPING',validation:'VALIDATION',comments:'COMMENTS'};
    const sections=$$('.prop-section-title');
    const section=sections.find(x=>x.textContent.trim()===labels[target]);
    if(section)section.parentElement.scrollIntoView({behavior:'smooth',block:'start'});
  });
}

function addScreenComponent(type){
  const s=project.screens.find(x=>x.id===state.screenId);
  if(!s)return;
  const id=uid("cmp");
  const names={text:"Text Field",number:"Number Field",date:"Date",datetime:"Date & Time",select:"Select",multiselect:"Multi Select",checkbox:"Checkbox",radio:"Radio Group",textarea:"Notes",currency:"Amount",file:"Attachment",table:"Records",button:"Save",divider:"Section Divider",heading:"Section",badge:"Status",tabs:"Details",display:"Display Only",hidden:"Hidden",password:"Password",email:"Email",phone:"Phone",url:"URL",search:"Search",autocomplete:"Autocomplete",popup_lov:"Popup LOV",shuttle:"Shuttle",switch:"Switch",richtext:"Rich Text",image:"Image",icon:"Icon",region:"Region",report:"Interactive Report",grid:"Interactive Grid",masterdetail:"Master Detail",chart:"Chart",list:"List",breadcrumb:"Breadcrumb"};
  s.components=s.components||[];
  s.components.push({id,type,label:names[type]||"Component",required:false,entityField:"",apiField:"",comment:"",
    sourceType:"DB",dbSchema:"",dbTable:"",dbColumn:"",calculationRule:"",validationRule:"",createdBy:currentUser()?.id||null,createdAt:new Date().toISOString()});
  state.selectedComponentId=id;
  saveProject();
  renderScreens();
}

function updateComponentPropertySilent(prop,value){
  const s=project.screens.find(x=>x.id===state.screenId),c=s?.components?.find(x=>x.id===state.selectedComponentId); if(!c)return;
  if(["required","readOnly"].includes(prop)) c[prop]=value==="true";
  else if(["minLength","maxLength"].includes(prop)) c[prop]=value===""?"":Number(value);
  else c[prop]=value;
  if(prop==="entityField"){const [entity,field]=String(value||"").split(".");c.entity=entity||"";c.field=field||"";}
  if(prop==="comments")c.comment=value;
  if(prop==="width")c.width=value;
  saveProject(false);
}
function reorderScreenComponents(fromId,toId){
  const s=project.screens.find(x=>x.id===state.screenId); if(!s)return;
  const arr=s.components||[],from=arr.findIndex(c=>c.id===fromId),to=arr.findIndex(c=>c.id===toId);
  if(from<0||to<0)return; const [item]=arr.splice(from,1); arr.splice(to,0,item); state.selectedComponentId=item.id; saveProject(false); renderScreens(); showToast('Screen item reordered');
}
function updateComponentProperty(prop,value){
  const s=project.screens.find(x=>x.id===state.screenId),c=s?.components?.find(x=>x.id===state.selectedComponentId); if(!c)return;
  if(["required","readOnly"].includes(prop)) c[prop]=value==="true";
  else if(["minLength","maxLength"].includes(prop)) c[prop]=value===""?"":Number(value);
  else c[prop]=value;
  if(prop==="entityField"){const [entity,field]=String(value||"").split(".");c.entity=entity||"";c.field=field||"";}
  if(prop==="comments")c.comment=value;
  saveProject(false);renderScreens();
}

function moveSelectedComponent(direction){
  const s=project.screens.find(x=>x.id===state.screenId); if(!s)return;
  const arr=s.components||[],i=arr.findIndex(c=>c.id===state.selectedComponentId); if(i<0)return;
  const j=direction==='up'?i-1:i+1; if(j<0||j>=arr.length)return;
  [arr[i],arr[j]]=[arr[j],arr[i]]; saveProject(false); renderScreens(); showToast('Screen item moved');
}

function moveScreenComponent(id,direction){
  const s=project.screens.find(x=>x.id===state.screenId); if(!s)return;
  const arr=s.components||[], i=arr.findIndex(c=>c.id===id); if(i<0)return;
  const j=direction==='up'?i-1:i+1; if(j<0||j>=arr.length)return;
  [arr[i],arr[j]]=[arr[j],arr[i]]; state.selectedComponentId=id; saveProject(); renderScreens();
}

function deleteScreenComponent(id){
  const s=project.screens.find(x=>x.id===state.screenId);
  if(!s)return;
  s.components=(s.components||[]).filter(c=>c.id!==id);
  state.selectedComponentId=null;
  saveProject();renderScreens();
}

function duplicateScreenComponent(id){
  const s=project.screens.find(x=>x.id===state.screenId),c=s?.components?.find(x=>x.id===id);
  if(!s||!c)return;
  const copy=JSON.parse(JSON.stringify(c));copy.id=uid("cmp");copy.label=(c.label||"Component")+" Copy";
  s.components.splice(s.components.indexOf(c)+1,0,copy);state.selectedComponentId=copy.id;
  saveProject();renderScreens();
}

function saveActiveScreen(show=true){
  const s=project.screens.find(x=>x.id===state.screenId);
  if(!s){ if(show) showToast('No screen selected'); return false; }
  // Normalize and persist the complete screen independently as well as inside the project.
  s.components ||= [];
  s.savedAt = new Date().toISOString();
  const ok=saveProject(false);
  if(show) showToast(ok ? `Screen “${s.name||'Untitled'}” saved` : 'Screen save failed — export a JSON backup');
  return ok;
}
function screenAction(action){
  const s=project.screens.find(x=>x.id===state.screenId);
  if(action==="new-screen"){
    state.editing={type:"screen",fromDesigner:true};
    modal("Create Screen",screenForm({id:uid("SCR"),moduleId:state.moduleId||project.modules[0]?.id,name:"",type:"Form",status:"Draft",description:"",components:[],comments:""}),`<button class="btn secondary" data-action="close-modal">Cancel</button><button class="btn primary" data-action="submit-modal">Create Screen</button>`,true);
  } else if(action==="duplicate-screen" && s){
    const copy=JSON.parse(JSON.stringify(s));copy.id=uid("screen");copy.name=(s.name||"Screen")+" Copy";
    project.screens.push(copy);state.screenId=copy.id;saveProject();renderScreens();
  } else if(action==="delete-screen" && s){
    if(!confirm("Delete this screen?"))return;
    project.screens=project.screens.filter(x=>x.id!==s.id);state.screenId=null;state.selectedComponentId=null;saveProject();renderScreens();
  } else if(action==="comment"){
    const text=prompt("Add screen comment / design note:",s?.comment||"");
    if(text!==null&&s){s.comment=text;saveProject();renderScreens();}
  } else if(action==="save"){saveActiveScreen(true);renderScreens();}
  else if(action==="preview"){showScreenPreview(s);}
  else if(action==="screen-settings"){
    if(!s)return;
    const desc=prompt("Screen description / purpose:",s.description||"");
    if(desc!==null){s.description=desc;saveProject(false);renderScreens();showToast("Screen settings saved");}
  }
  else if(action==="undo"||action==="redo"){showToast(action+" is ready for history integration");}
  else if(action==="zoom-in"||action==="zoom-out"){showToast("Canvas zoom "+(action==="zoom-in"?"+":"-"));}
}

function showScreenPreview(s){
  if(!s)return;
  const overlay=document.createElement("div");overlay.className="screen-preview-overlay";
  overlay.innerHTML=`<div class="screen-preview-window"><div class="preview-top"><strong>${esc(s.name)}</strong><button class="icon-btn" data-close-preview>×</button></div><div class="preview-body">${(s.components||[]).map(renderComponentPreview).join("")}</div></div>`;
  document.body.appendChild(overlay);
  overlay.querySelector("[data-close-preview]").onclick=()=>overlay.remove();
}

function renderERD(){
  const m=state.moduleId?moduleById(state.moduleId):null;
  const entities=m?project.entities.filter(e=>e.moduleId===m.id):project.entities;
  const relationMode=state.erdConnectFrom;
  const relationRows=project.relations.filter(r=>entities.some(e=>e.id===r.from)&&entities.some(e=>e.id===r.to));
  $('#content').innerHTML=`
    <div class="erd-page-head"><div><div class="eyebrow">ORACLE DATA MODEL</div><h2>${m?esc(m.name)+' ERD':'Interactive ERD Designer'}</h2><p>Drag tables, connect them with an explicit source → target workflow, and edit every relationship. All changes persist locally.</p></div>
      <div class="erd-head-actions"><button class="btn secondary" data-view="project-erd">◈ Full Project ERD</button><button class="btn secondary" data-action="new-relation">＋ Relationship</button><button class="btn primary" data-action="new-entity">＋ Table</button></div></div>
    <div class="erd-command-bar"><select id="erdFilter"><option value="ALL">All modules</option>${project.modules.map(x=>`<option value="${x.id}" ${state.erdModule===x.id?'selected':''}>${esc(x.name)}</option>`).join('')}</select>
      <button class="erd-connect-command ${relationMode?'active':''}" id="erdConnectCommand">${relationMode?'✕ Cancel Connection':'⌁ Connect Tables'}</button>
      <button class="erd-view-command ${state.erdCompact?'active':''}" id="erdCompactCommand">▦ Compact</button><button class="erd-view-command" id="erdArrangeCommand">✦ Auto Arrange</button><button class="erd-view-command" id="erdZoomOut">−</button><span class="erd-zoom-label" id="erdZoomLabel">${state.erdZoom}%</span><button class="erd-view-command" id="erdZoomIn">+</button>
      <span class="erd-help">${relationMode?`Source: <b>${esc(project.entities.find(e=>e.id===relationMode)?.name||relationMode)}</b> — now click any target table`:'Tip: click Connect on a table, then click another table.'}</span>
      <span class="erd-counts">${entities.length} tables · ${relationRows.length} relationships</span></div>
    <div class="erd-shell enhanced ${state.erdCompact?'compact':''}" id="erdCanvas"><svg class="erd-svg" id="erdSvg"></svg>
      ${entities.map(e=>erdTable(e)).join('') || '<div class="empty">No entities for this selection.</div>'}</div>
    <div class="erd-relations-panel"><div class="card-title"><div><h2>Relationships</h2><span class="muted small-text">Edit the relationship definition or delete it.</span></div></div>
      ${relationRows.length?`<div class="relation-grid">${relationRows.map(r=>{const a=project.entities.find(e=>e.id===r.from),b=project.entities.find(e=>e.id===r.to);return `<div class="relation-row"><span class="relation-table">${esc(a?.name||r.from)}</span><span class="relation-field">${esc(r.fromField||'PK')}</span><span class="relation-arrow">→ <b>${esc(r.cardinality||'1:N')}</b> →</span><span class="relation-table">${esc(b?.name||r.to)}</span><span class="relation-field">${esc(r.toField||'FK')}</span><button class="icon-btn" data-action="edit-relation" data-id="${r.id}">✎</button><button class="icon-btn danger" data-action="delete-relation" data-id="${r.id}">×</button></div>`}).join('')}</div>`:'<div class="empty">No relationships yet. Use Connect Tables or + Relationship.</div>'}</div>`;
  $('#erdFilter').onchange=e=>{state.erdModule=e.target.value;renderERD()};
  $('#erdConnectCommand').onclick=()=>{ if(state.erdConnectFrom){state.erdConnectFrom=null;renderERD();showToast('Connection cancelled');} else {showToast('Click ⌁ on a table to choose the source, then click the target table.');} };
  $('#erdCompactCommand').onclick=()=>{state.erdCompact=!state.erdCompact;renderERD();showToast(state.erdCompact?'Compact table view enabled':'Standard table view enabled')};
  $('#erdArrangeCommand').onclick=()=>{autoArrangeERD(entities);saveProject(false);renderERD();showToast('Tables arranged into a clean grid')};
  $('#erdZoomOut').onclick=()=>{state.erdZoom=Math.max(70,state.erdZoom-10);$('#erdCanvas').style.zoom=state.erdZoom/100;$('#erdZoomLabel').textContent=state.erdZoom+'%';drawRelations(entities,false)};
  $('#erdZoomIn').onclick=()=>{state.erdZoom=Math.min(130,state.erdZoom+10);$('#erdCanvas').style.zoom=state.erdZoom/100;$('#erdZoomLabel').textContent=state.erdZoom+'%';drawRelations(entities,false)};
  $('#erdCanvas').style.zoom=state.erdZoom/100;
  bindERDInteractions(false,entities);
  drawRelations(entities,false);
}
function erdTable(e,full=false){
  const relCount=project.relations.filter(r=>r.from===e.id||r.to===e.id).length;
  const source=state.erdConnectFrom===e.id;
  return `<div class="erd-table ${full?'full-table':''} ${source?'connect-source':''}" data-entity="${e.id}" style="left:${e.x||20}px;top:${e.y||20}px">
    <div class="erd-title"><span><i>${source?'🔗 ':''}</i>${esc(e.name)}</span><span class="erd-table-actions"><button class="icon-btn tiny-icon" data-action="edit-entity" data-id="${e.id}">✎</button><button class="icon-btn tiny-icon" data-erd-connect="${e.id}" title="Start connection">⌁</button></span></div>
    ${(e.fields||[]).map(f=>`<div class="erd-field"><span class="key">${f.pk?'PK':f.fk?'FK':''}</span><strong>${esc(f.name)}</strong><span class="type">${esc(f.type||'')}</span></div>`).join('')}
    <div class="erd-table-foot"><span>${renderCommentSummary(e)}</span><span>${relCount} relation${relCount===1?'':'s'}</span></div>${linkedObjects("entity",e.id,['entity'])}</div>`;
}
function createERDRelation(from,to){
  if(!from||!to||from===to){showToast('Choose a different target table');return false;}
  const duplicate=project.relations.some(r=>(r.from===from&&r.to===to)||(r.from===to&&r.to===from));
  if(duplicate){showToast('A relationship already exists between these tables');return false;}
  const fe=project.entities.find(x=>x.id===from),te=project.entities.find(x=>x.id===to);
  const fromField=(fe?.fields||[]).find(f=>f.pk)?.name || (fe?.fields||[])[0]?.name || '';
  const toField=(te?.fields||[]).find(f=>f.fk)?.name || (te?.fields||[]).find(f=>f.pk)?.name || (te?.fields||[])[0]?.name || '';
  project.relations.push({id:uid('REL'),from,to,fromField,toField,cardinality:'1:N',comments:''});
  saveProject(false);state.erdConnectFrom=null;showToast(`${fe?.name||from} → ${te?.name||to} relationship created`);return true;
}
function autoArrangeERD(entities){
  const canvas=$('#erdCanvas')||$('#projectErdCanvas'); if(!canvas||!entities.length)return;
  const width=Math.max(canvas.clientWidth||1200,900);
  const gapX=state.erdCompact?230:275, gapY=state.erdCompact?145:185;
  const cols=Math.max(1,Math.floor((width-40)/gapX));
  entities.forEach((e,i)=>{e.x=20+(i%cols)*gapX;e.y=20+Math.floor(i/cols)*gapY});
}
function bindERDInteractions(full,entities){
  const canvas=$(full?'#projectErdCanvas':'#erdCanvas'); if(!canvas)return;
  canvas.onclick=e=>{
    const connectBtn=e.target.closest('[data-erd-connect]');
    if(connectBtn){e.preventDefault();e.stopPropagation();state.erdConnectFrom=connectBtn.dataset.erdConnect;renderERD();showToast('Source selected. Click the target table.');return;}
    const table=e.target.closest('.erd-table');
    if(table && state.erdConnectFrom){e.preventDefault();e.stopPropagation();if(createERDRelation(state.erdConnectFrom,table.dataset.entity))(full?renderProjectERD():renderERD());}
  };
  let drag=null;
  const scale=()=>{const r=canvas.getBoundingClientRect();return canvas.offsetWidth?Math.max(.1,r.width/canvas.offsetWidth):1};
  canvas.addEventListener('pointerdown',e=>{
    const table=e.target.closest('.erd-table');
    if(!table||e.target.closest('button')||state.erdConnectFrom)return;
    const title=e.target.closest('.erd-title');
    if(!title)return;
    e.preventDefault();
    const left=parseFloat(table.style.left)||0, top=parseFloat(table.style.top)||0;
    drag={table,startX:e.clientX,startY:e.clientY,left,top,scale:scale(),moved:false};
    table.classList.add('dragging');
    document.body.classList.add('erd-dragging');
  });
  const move=e=>{
    if(!drag)return;
    const dx=(e.clientX-drag.startX)/drag.scale,dy=(e.clientY-drag.startY)/drag.scale;
    if(Math.abs(dx)+Math.abs(dy)>2)drag.moved=true;
    const maxX=Math.max(20,canvas.scrollWidth-drag.table.offsetWidth-20),maxY=Math.max(20,canvas.scrollHeight-drag.table.offsetHeight-20);
    const x=Math.max(8,Math.min(maxX,drag.left+dx)),y=Math.max(8,Math.min(maxY,drag.top+dy));
    drag.table.style.left=x+'px';drag.table.style.top=y+'px';
    const ent=project.entities.find(a=>a.id===drag.table.dataset.entity);if(ent){ent.x=Math.round(x);ent.y=Math.round(y)}
    drawRelations(entities,full);
  };
  const up=()=>{if(!drag)return;drag.table.classList.remove('dragging');document.body.classList.remove('erd-dragging');if(drag.moved)saveProject(false);drag=null;};
  document.addEventListener('pointermove',move);
  document.addEventListener('pointerup',up);
  $$('[data-erd-connect]').forEach(b=>b.onclick=e=>{e.stopPropagation();state.erdConnectFrom=b.dataset.erdConnect;(full?renderProjectERD():renderERD());showToast('Source selected. Click the target table.');});
}

function drawRelations(entities,full=false){
  const svg=$(full?'#projectErdSvg':'#erdSvg');
  const canvas=$(full?'#projectErdCanvas':'#erdCanvas');
  if(!svg||!canvas)return;
  svg.innerHTML='';
  const width=Math.max(canvas.clientWidth,canvas.scrollWidth,1100),height=Math.max(canvas.clientHeight,canvas.scrollHeight,700);
  svg.setAttribute('width',width);svg.setAttribute('height',height);svg.style.width=width+'px';svg.style.height=height+'px';
  const defs=document.createElementNS('http://www.w3.org/2000/svg','defs');
  defs.innerHTML=`<marker id="arrow${full?'Full':'Module'}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#4f6f9f"/></marker>`;
  svg.appendChild(defs);
  const visible=new Set(entities.map(e=>e.id));
  project.relations.forEach(r=>{
    if(!visible.has(r.from)||!visible.has(r.to))return;
    const a=document.querySelector(`[data-entity="${r.from}"]`),b=document.querySelector(`[data-entity="${r.to}"]`);
    if(!a||!b)return;
    const x1=(parseFloat(a.style.left)||a.offsetLeft||0)+a.offsetWidth/2;
    const y1=(parseFloat(a.style.top)||a.offsetTop||0)+a.offsetHeight/2;
    const x2=(parseFloat(b.style.left)||b.offsetLeft||0)+b.offsetWidth/2;
    const y2=(parseFloat(b.style.top)||b.offsetTop||0)+b.offsetHeight/2;
    const line=document.createElementNS('http://www.w3.org/2000/svg','line');
    line.setAttribute('x1',x1);line.setAttribute('y1',y1);line.setAttribute('x2',x2);line.setAttribute('y2',y2);
    line.setAttribute('stroke','#4f6f9f');line.setAttribute('stroke-width','2.5');line.setAttribute('marker-end',`url(#arrow${full?'Full':'Module'})`);line.setAttribute('opacity','.9');line.style.pointerEvents='none';svg.appendChild(line);
    const text=document.createElementNS('http://www.w3.org/2000/svg','text');
    text.setAttribute('x',(x1+x2)/2);text.setAttribute('y',(y1+y2)/2-7);text.setAttribute('class','erd-relation-label');
    text.textContent=`${r.fromField||''} → ${r.toField||''} · ${r.cardinality||'1:N'}`;svg.appendChild(text);
  });
}
function renderProjectERD(){
  const entities=project.entities, relations=project.relations, relationMode=state.erdConnectFrom;
  const cards=entities.map(e=>erdTable(e,true)).join('');
  const moduleStats=project.modules.map(m=>`<span class="tag blue">${esc(m.name)} ${entities.filter(e=>e.moduleId===m.id).length}</span>`).join(' ');
  $('#content').innerHTML=`<div class="project-erd-head"><div><div class="eyebrow">DATABASE BLUEPRINT</div><h1>Full Project ERD</h1><p>One connected Oracle data model across all modules. Use explicit Connect mode to create relationships.</p></div><div class="erd-head-actions"><button class="btn secondary" data-view="erd">Module ERD</button><button class="btn primary" data-action="new-entity">＋ Table</button><button class="btn secondary" data-action="new-relation">＋ Relationship</button></div></div>
  <div class="erd-summary"><div><strong>${entities.length}</strong><span>Tables</span></div><div><strong>${relations.length}</strong><span>Relationships</span></div><div><strong>${entities.reduce((n,e)=>n+(e.fields||[]).length,0)}</strong><span>Fields</span></div><div class="module-pills">${moduleStats}</div></div>
  <div class="erd-command-bar"><button class="erd-connect-command ${relationMode?'active':''}" id="fullErdConnect">${relationMode?'✕ Cancel Connection':'⌁ Connect Tables'}</button><button class="erd-view-command ${state.erdCompact?'active':''}" id="projectCompact">▦ Compact</button><button class="erd-view-command" id="projectArrange">✦ Auto Arrange</button><button class="erd-view-command" id="projectZoomOut">−</button><span class="erd-zoom-label" id="projectZoomLabel">${state.erdZoom}%</span><button class="erd-view-command" id="projectZoomIn">+</button><span class="erd-help">${relationMode?`Source: <b>${esc(project.entities.find(e=>e.id===relationMode)?.name||relationMode)}</b> — click the target table`:'Use Compact for dense models and Auto Arrange for a clean starting layout.'}</span></div>
  <div class="erd-shell full-erd enhanced ${state.erdCompact?'compact':''}" id="projectErdCanvas"><svg class="erd-svg" id="projectErdSvg"></svg>${cards}</div>
  <div class="erd-relations-panel"><div class="card-title"><div><h2>All Project Relationships</h2><span class="muted small-text">${relations.length} links across the Oracle model.</span></div></div>${relations.length?`<div class="relation-grid">${relations.map(r=>{const a=project.entities.find(e=>e.id===r.from),b=project.entities.find(e=>e.id===r.to);return `<div class="relation-row"><span class="relation-table">${esc(a?.name||r.from)}</span><span class="relation-field">${esc(r.fromField||'')}</span><span class="relation-arrow">→ <b>${esc(r.cardinality||'1:N')}</b> →</span><span class="relation-table">${esc(b?.name||r.to)}</span><span class="relation-field">${esc(r.toField||'')}</span><button class="icon-btn" data-action="edit-relation" data-id="${r.id}">✎</button><button class="icon-btn danger" data-action="delete-relation" data-id="${r.id}">×</button></div>`}).join('')}</div>`:'<div class="empty">No relationships. Start Connect Tables and choose source then target.</div>'}</div>`;
  $('#fullErdConnect').onclick=()=>{if(relationMode){state.erdConnectFrom=null;render();showToast('Connection cancelled');}else{showToast('Click ⌁ on a table to choose the source, then click the target table.');}};
  $('#projectCompact').onclick=()=>{state.erdCompact=!state.erdCompact;renderProjectERD();showToast(state.erdCompact?'Compact table view enabled':'Standard table view enabled')};
  $('#projectArrange').onclick=()=>{autoArrangeERD(entities);saveProject(false);renderProjectERD();showToast('Full ERD arranged into a clean grid')};
  $('#projectZoomOut').onclick=()=>{state.erdZoom=Math.max(70,state.erdZoom-10);$('#projectErdCanvas').style.zoom=state.erdZoom/100;$('#projectZoomLabel').textContent=state.erdZoom+'%';drawRelations(entities,true)};
  $('#projectZoomIn').onclick=()=>{state.erdZoom=Math.min(130,state.erdZoom+10);$('#projectErdCanvas').style.zoom=state.erdZoom/100;$('#projectZoomLabel').textContent=state.erdZoom+'%';drawRelations(entities,true)};
  $('#projectErdCanvas').style.zoom=state.erdZoom/100;
  bindERDInteractions(true,entities);drawRelations(entities,true);
}

function renderBackend(){
  const m=state.moduleId?moduleById(state.moduleId):null;
  const apis=m?project.apis.filter(x=>x.moduleId===m.id):project.apis;
  const arr=m?project.logic.filter(x=>x.moduleId===m.id):project.logic;
  const tests=m?(project.tests||[]).filter(x=>x.moduleId===m.id):(project.tests||[]);
  $("#content").innerHTML=`${m?moduleBanner(m):""}<div class="blueprint-hero"><div><span class="eyebrow">BACKEND DESIGNER</span><h1>Backend Logic${m?' · '+esc(m.name):''}</h1><p>Dedicated backend phase: API contracts, validation, permissions, workflows, transactions and error handling. This page is independent from ERD.</p></div><div class="blueprint-hero-actions"><button class="btn primary" data-action="new-api">＋ API Contract</button><button class="btn secondary" data-action="new-logic">＋ Workflow</button>${m?`<button class="btn secondary" data-view="testing" data-module="${m.id}">Testing →</button>`:''}</div></div><div class="grid two"><div class="card"><div class="card-title"><div><h2>API Contracts</h2><span class="muted small-text">Endpoints, permissions, inputs and validation.</span></div></div>${apis.map(a=>`<div class="artifact-row"><div class="artifact-id">${esc(a.method)}</div><div><strong>${esc(a.name)}</strong><small>${esc(a.path)} · ${esc(a.permission||'No permission')} · ${esc(a.status||'Draft')}</small>${linkedObjects("api",a.id)}</div><button class="btn tiny" data-action="edit-api" data-id="${a.id}">Open</button></div>`).join('')||'<div class="empty">No API contracts defined yet.</div>'}</div><div class="card"><div class="card-title"><div><h2>Business Workflows</h2><span class="muted small-text">Step-by-step logic behind the APIs and screens.</span></div></div>${arr.map(l=>`<div class="backend-workflow-card"><div class="card-title"><div><h3>${esc(l.name)}</h3><small>${esc(l.trigger||'No trigger')}</small>${linkedObjects("logic",l.id)}</div><div class="actions"><button class="icon-btn" data-action="edit-logic" data-id="${l.id}">✎</button><button class="icon-btn danger" data-action="delete-logic" data-id="${l.id}">×</button></div></div><ol class="logic-step-list">${(l.steps||[]).map((x,i)=>`<li><strong>${esc(x)}</strong>${l.stepComments?.[i]?`<span class="muted small-text">💬 ${esc(l.stepComments[i])}</span>`:''}</li>`).join('')||'<li>No workflow steps defined.</li>'}</ol></div>`).join('')||'<div class="empty">No backend workflows defined yet.</div>'}</div></div><div class="card" style="margin-top:16px"><div class="card-title"><div><h2>Backend Design Controls</h2><span class="muted small-text">Backend logic is more than endpoints: define validation, authorization, transactions and failure handling for every operation.</span></div>${m?`<button class="btn secondary" data-view="testing" data-module="${m.id}">Open Testing Center</button>`:''}</div><div class="grid two backend-control-grid">
    <div class="backend-control-card"><span class="eyebrow">VALIDATION</span><h3>Business Rules</h3><p>${apis.length?apis.filter(a=>a.rules).length+' API contracts contain validation/rule definitions.':'No validation rules defined yet.'}</p><small>Capture required fields, uniqueness, references, state rules and acceptance constraints in each API.</small></div>
    <div class="backend-control-card"><span class="eyebrow">AUTHORIZATION</span><h3>Permissions</h3><p>${apis.length?apis.filter(a=>a.permission).length+' API contracts have permission codes.':'No permission codes defined yet.'}</p><small>Every protected endpoint should map to a permission such as EMPLOYEE.CREATE or EMPLOYEE.VIEW.</small></div>
    <div class="backend-control-card"><span class="eyebrow">TRANSACTIONS</span><h3>Database Operations</h3><p>${arr.length?arr.filter(l=>/transaction|insert|update|delete|commit|rollback/i.test((l.steps||[]).join(' '))).length+' workflows mention database operations.':'No database transaction logic defined yet.'}</p><small>Describe the order of validation, writes, audit actions and commit/rollback behavior.</small></div>
    <div class="backend-control-card"><span class="eyebrow">ERROR HANDLING</span><h3>Failure Scenarios</h3><p>${apis.length?apis.filter(a=>/error|fail|reject|exception|invalid|not found|duplicate/i.test((a.logic||'')+' '+(a.rules||'')+' '+(a.description||''))).length+' API contracts mention failure handling.':'No failure handling documented yet.'}</p><small>Document validation failures, authorization failures, duplicate records, missing references and unexpected errors.</small></div>
  </div><div class="backend-metrics">${metric('APIs',apis.length,'API')}${metric('Workflows',arr.length,'WF')}${metric('Linked Tests',tests.length,'🧪')}${metric('Permissions',apis.filter(a=>a.permission).length,'🔐')}</div></div>`;
}

function renderTraceability(){
  const links=project.links||[];
  const moduleId=state.traceabilityModule||'ALL';
  const reqs=project.requirements.filter(r=>moduleId==='ALL'||r.moduleId===moduleId);
  const getTargets=(type,id,targetType)=>links.flatMap(l=>{if(l.sourceType===type&&String(l.sourceId)===String(id)&&l.targetType===targetType)return [l.targetId];if(l.targetType===type&&String(l.targetId)===String(id)&&l.sourceType===targetType)return [l.sourceId];return [];});
  const chip=(type,id,list)=>{const o=(list||[]).find(x=>String(x.id)===String(id));if(!o)return '';const name=o.title||o.name||o.path||o.id;return `<button class="link-button trace-link" data-link-object="${type}" data-link-id="${esc(id)}" title="Open ${esc(name)}"><b>${esc(type.toUpperCase())}</b> ${esc(name)}</button>`;};
  const rows=reqs.map(r=>{const screens=getTargets('requirement',r.id,'screen'),ents=getTargets('requirement',r.id,'entity'),apis=getTargets('requirement',r.id,'api'),logic=getTargets('requirement',r.id,'logic'),tests=getTargets('requirement',r.id,'test');return `<tr><td>${chip('requirement',r.id,project.requirements)}</td><td>${screens.length?screens.map(id=>chip('screen',id,project.screens)).join(''):yesno(false)}</td><td>${ents.length?ents.map(id=>chip('entity',id,project.entities)).join(''):yesno(false)}</td><td>${apis.length?apis.map(id=>chip('api',id,project.apis)).join(''):yesno(false)}</td><td>${logic.length?logic.map(id=>chip('logic',id,project.logic)).join(''):yesno(false)}</td><td>${tests.length?tests.map(id=>chip('test',id,project.tests)).join(''):yesno(false)}</td></tr>`}).join('');
  const modules=project.modules.map(m=>`<option value="${esc(m.id)}" ${m.id===moduleId?'selected':''}>${esc(m.name)}</option>`).join('');
  $('#content').innerHTML=`<div class="card"><div class="card-title"><div><span class="eyebrow">END-TO-END TRACEABILITY</span><h2>Requirement Traceability Matrix</h2><span class="muted small-text">Every linked object is clickable and opens its real phase. Filter the entire matrix by module.</span></div><button class="btn secondary" data-action="export-traceability">Export CSV</button></div><div class="toolbar"><div class="left"><label class="field"><span>Module</span><select id="traceabilityModule"><option value="ALL">All Modules</option>${modules}</select></label></div><div class="right"><span class="tag blue">${reqs.length} requirements</span><span class="tag green">${links.length} links</span></div></div><div class="table-wrap"><table class="table traceability-table"><thead><tr><th>Requirement</th><th>Screen</th><th>ERD</th><th>API</th><th>Logic</th><th>Testing</th></tr></thead><tbody>${rows||`<tr><td colspan="6"><div class="empty">No requirements for this module.</div></td></tr>`}</tbody></table></div></div>`;
  $('#traceabilityModule').onchange=e=>{state.traceabilityModule=e.target.value;renderTraceability();};
}

function yesno(v){return `<span class="coverage-cell ${v?"yes":"no"}">${v?"✓":"—"}</span>`}

function renderTesting(){
  const all=(project.tests||[]).filter(t=>!state.moduleId || t.moduleId===state.moduleId);
  const total=all.length, passed=all.filter(t=>t.status==='Passed').length, failed=all.filter(t=>t.status==='Failed').length, blocked=all.filter(t=>t.status==='Blocked').length, notRun=all.filter(t=>!t.status||t.status==='Not Run').length;
  const rows=all.map(t=>`<div class="testing-case-card" data-module="${esc(t.moduleId||'')}" data-status="${esc(t.status||'Not Run')}" data-type="${esc(t.type||'Functional')}">
    <div class="testing-case-head"><div><span class="eyebrow">${esc(t.type||'Functional')} · ${esc(t.priority||'Medium')}</span><h3>${esc(t.name)}</h3><small>${esc(t.id)} · ${esc(moduleById(t.moduleId)?.name||'Project')} · ${(t.steps||[]).length} steps</small></div><div class="testing-case-actions"><span class="test-status">${esc(t.status||'Not Run')}</span><button class="btn tiny" data-action="edit-test" data-id="${t.id}">Open</button><button class="icon-btn danger" data-action="delete-test" data-id="${t.id}">×</button></div></div>
    <div class="testing-case-meta">${linkedObjects("test",t.id)}<div><b>Requirement</b><span>${esc(t.requirementId||'—')}</span></div><div><b>Screen</b><span>${esc(project.screens.find(s=>s.id===t.screenId)?.name||t.screenId||'—')}</span></div><div><b>Expected result</b><span>${esc(t.expectedResult||'—')}</span></div></div>
    <div class="testing-steps-mini">${(t.steps||[]).map((st,i)=>`<div class="testing-step-mini"><span>${i+1}</span><div><strong>${esc(st.action||'Step')}</strong><small>Expected: ${esc(st.expected||'—')}</small></div><em>${esc(st.status||'Not Run')}</em>${st.comments?`<p>💬 ${esc(st.comments)}</p>`:''}</div>`).join('')||'<div class="muted small-text">No execution steps defined.</div>'}</div>${t.comments?`<div class="testing-case-comment">💬 ${esc(t.comments)}</div>`:''}</div>`).join('');
  $('#content').innerHTML=`<div class="testing-hero"><div><span class="eyebrow">QUALITY & UAT</span><h1>Testing Center</h1><p>Define, execute and review test cases across requirements, screens, backend logic and ERD. Every test step has its own status and comment so defects and decisions stay attached to the evidence.</p></div><div><button class="btn primary" data-action="new-test">＋ New Test Case</button></div></div><div class="testing-filter-bar"><select id="testingModuleFilter"><option value="ALL">All modules</option>${project.modules.map(m=>`<option value="${m.id}" ${state.moduleId===m.id?'selected':''}>${esc(m.name)}</option>`).join('')}</select><select id="testingStatusFilter"><option value="ALL">All statuses</option>${['Not Run','In Progress','Passed','Failed','Blocked','Skipped'].map(x=>`<option>${x}</option>`).join('')}</select><select id="testingTypeFilter"><option value="ALL">All types</option>${['Functional','UI','Integration','API','Security','UAT','Regression','Performance'].map(x=>`<option>${x}</option>`).join('')}</select></div><div class="grid cards testing-summary">${metric('Test Cases',total,'🧪')}${metric('Passed',passed,'✓')}${metric('Failed',failed,'⚠')}${metric('Blocked',blocked,'⛔')}${metric('Not Run',notRun,'○')}</div><div class="testing-case-list">${rows||'<div class="empty"><strong>No test cases yet</strong><p>Create a test case and add detailed execution steps with comments.</p><button class="btn primary" data-action="new-test">＋ Create first test</button></div>'}</div>`;
  const apply=()=>{const mod=$('#testingModuleFilter')?.value||'ALL',st=$('#testingStatusFilter')?.value||'ALL',ty=$('#testingTypeFilter')?.value||'ALL'; $$('.testing-case-card').forEach(card=>{card.style.display=((mod==='ALL'||card.dataset.module===mod)&&(st==='ALL'||card.dataset.status===st)&&(ty==='ALL'||card.dataset.type===ty))?'':'none';});};
  ['testingModuleFilter','testingStatusFilter','testingTypeFilter'].forEach(id=>$('#'+id)?.addEventListener('change',apply)); apply();
}
function testingForm(item){
  item ||= {id:uid('TEST'),moduleId:state.moduleId||project.modules[0]?.id||'',requirementId:'',screenId:'',name:'',type:'Functional',priority:'Medium',status:'Not Run',preconditions:'',expectedResult:'',actualResult:'',comments:'',steps:[{id:uid('STEP'),action:'Open the target screen',expected:'The screen opens without errors',status:'Not Run',comments:''}]};
  const stepRows=(item.steps||[]).map((st,i)=>`<div class="test-step-editor" data-step-row><div class="test-step-number">${i+1}</div><div class="test-step-fields"><input name="step_action" value="${esc(st.action||'')}" placeholder="Action / instruction"><input name="step_expected" value="${esc(st.expected||'')}" placeholder="Expected result"><select name="step_status">${['Not Run','In Progress','Passed','Failed','Blocked','Skipped'].map(x=>`<option ${x===(st.status||'Not Run')?'selected':''}>${x}</option>`).join('')}</select><textarea name="step_comments" placeholder="Comment for this step, defect, evidence or decision...">${esc(st.comments||'')}</textarea></div><button type="button" class="icon-btn danger" data-action="remove-test-step" data-id="${i}">×</button></div>`).join('');
  const reqOpts=project.requirements.map(r=>`<option value="${r.id}" ${r.id===(item.requirementId||'')?'selected':''}>${esc(r.id)} — ${esc(r.title)}</option>`).join('');
  const screenOpts=project.screens.filter(s=>!item.moduleId||s.moduleId===item.moduleId).map(s=>`<option value="${s.id}" ${s.id===(item.screenId||'')?'selected':''}>${esc(s.name)}</option>`).join('');
  return `<div class="form-grid"><div class="field"><label>Test ID</label><input name="id" value="${esc(item.id)}" readonly></div><div class="field"><label>Module</label>${moduleSelector(item.moduleId)}</div><div class="field full"><label>Test name</label><input name="name" value="${esc(item.name)}" placeholder="Example: Create employee with valid data"></div><div class="field"><label>Type</label><select name="type">${['Functional','UI','Integration','API','Security','UAT','Regression','Performance'].map(x=>`<option ${x===item.type?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label>Priority</label><select name="priority">${['Low','Medium','High','Critical'].map(x=>`<option ${x===item.priority?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label>Status</label><select name="status">${['Not Run','In Progress','Passed','Failed','Blocked','Skipped'].map(x=>`<option ${x===item.status?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label>Requirement</label><select name="requirementId"><option value="">— None —</option>${reqOpts}</select></div><div class="field"><label>Screen</label><select name="screenId"><option value="">— None —</option>${screenOpts}</select></div><div class="field full"><div class="card-title"><h3>Traceability Links</h3></div></div>${artifactLinkSelector(item,'logic','Linked Backend Logic','test')}${artifactLinkSelector(item,'api','Linked APIs','test')}<div class="field full"><label>Preconditions</label><textarea name="preconditions">${esc(item.preconditions||'')}</textarea></div><div class="field full"><label>Expected overall result</label><textarea name="expectedResult">${esc(item.expectedResult||'')}</textarea></div><div class="field full"><label>Actual result / execution notes</label><textarea name="actualResult">${esc(item.actualResult||'')}</textarea></div><div class="field full"><div class="card-title"><h3>Execution Steps</h3><button type="button" class="btn secondary" data-action="add-test-step">＋ Step</button></div><div id="testStepsEditor">${stepRows||'<div class="empty">No steps. Add one.</div>'}</div></div>${commentsField(item,"Test case comments")}</div>`;
}
function addTestingStep(){const box=$('#testStepsEditor');if(!box)return;const i=box.querySelectorAll('[data-step-row]').length;box.insertAdjacentHTML('beforeend',`<div class="test-step-editor" data-step-row><div class="test-step-number">${i+1}</div><div class="test-step-fields"><input name="step_action" placeholder="Action / instruction"><input name="step_expected" placeholder="Expected result"><select name="step_status">${['Not Run','In Progress','Passed','Failed','Blocked','Skipped'].map(x=>`<option>${x}</option>`).join('')}</select><textarea name="step_comments" placeholder="Comment for this step, defect, evidence or decision..."></textarea></div><button type="button" class="icon-btn danger" data-action="remove-test-step" data-id="${i}">×</button></div>`); $$('#modalRoot [data-action="remove-test-step"]').forEach(el=>el.onclick=()=>removeTestingStep(el.dataset.index));}
function removeTestingStep(index){const rows=$$('#testStepsEditor [data-step-row]');if(rows[index])rows[index].remove();rows.forEach((r,i)=>{r.querySelector('.test-step-number').textContent=i+1;r.querySelector('[data-action="remove-test-step"]')?.setAttribute('data-id',i);});}
function submitTestingModal(){const v=formValues();const steps=$$('#testStepsEditor [data-step-row]').map(row=>({id:uid('STEP'),action:row.querySelector('[name="step_action"]')?.value.trim()||'',expected:row.querySelector('[name="step_expected"]')?.value.trim()||'',status:row.querySelector('[name="step_status"]')?.value||'Not Run',comments:row.querySelector('[name="step_comments"]')?.value||''})).filter(x=>x.action||x.expected||x.comments);if(!v.name.trim())return alert('Test case name is required');const obj={id:v.id,moduleId:v.moduleId,requirementId:v.requirementId,screenId:v.screenId,name:v.name.trim(),type:v.type,priority:v.priority,status:v.status,preconditions:v.preconditions,expectedResult:v.expectedResult,actualResult:v.actualResult,comments:v.comments,steps};const old=project.tests.find(x=>x.id===state.editing.id);if(old)Object.assign(old,obj);else project.tests.push(obj); syncFormLinks('test',obj.id,v); project.comments ||= []; const u=currentUser()||{}; if(String(v.newComment||'').trim()) project.comments.push({id:uid('COM'),objectType:'test',objectId:obj.id,authorName:u.displayName||u.username||'User',commentText:String(v.newComment).trim(),createdAt:new Date().toISOString()}); steps.forEach(st=>{if(String(st.comments||'').trim()) project.comments.push({id:uid('COM'),objectType:'testing_step',objectId:st.id,authorName:u.displayName||u.username||'User',commentText:String(st.comments).trim(),createdAt:new Date().toISOString()});}); saveProject(false);closeModal();render();showToast(old?'Test case updated':'Test case created');}
function renderValidation(){
  const issues=[];
  project.requirements.forEach(r=>{if(!r.actor)issues.push(["Requirement",r.id,"Missing actor"]);if(!r.acceptance)issues.push(["Requirement",r.id,"Missing acceptance criteria"])});
  project.screens.forEach(s=>{(s.components||[]).forEach(c=>{
    if(["input","text","select","date","number","currency","textarea"].includes(c.type)){
      if(!c.entityField && !(c.entity&&c.field) && c.sourceType!=="CALCULATION" && c.sourceType!=="RULE" && c.sourceType!=="MANUAL" && c.sourceType!=="API")
        issues.push(["Screen",s.id,`${c.label||c.type} has no source mapping`]);
      if((c.sourceType==="DB"||!c.sourceType) && (!c.dbSchema||!c.dbTable||!c.dbColumn) && !c.entityField && !(c.entity&&c.field))
        issues.push(["Screen",s.id,`${c.label||c.type} DB source must specify schema, table and column`]);
      if((c.sourceType==="CALCULATION"||c.sourceType==="RULE")&&!c.calculationRule)
        issues.push(["Screen",s.id,`${c.label||c.type} requires a calculation / rule`]);
    }
  })});
  (project.references||[]).forEach(r=>{if(!r.moduleId)issues.push(["Reference",r.id,"Reference image must be assigned to a module"])});
  (project.project.commentLog||[]).forEach(c=>{if(!c.authorId)issues.push(["Audit",c.id,"Comment has no authenticated author"]) });
  project.entities.forEach(e=>{if(!e.fields.some(f=>f.pk))issues.push(["ERD",e.id,"Entity has no primary key"])});
  project.apis.forEach(a=>{if(!a.permission)issues.push(["API",a.id,"Missing permission code"]);if(!a.logic)issues.push(["API",a.id,"Missing logic description"])});
  $("#content").innerHTML=`<div class="grid cards">${metric("Validation Issues",issues.length,issues.length?"⚠":"✓")}${metric("Unmapped Screens",project.screens.filter(s=>(s.components||[]).some(c=>c.entity&&!c.field)).length,"⌁")}${metric("Entities Without PK",project.entities.filter(e=>!e.fields.some(f=>f.pk)).length,"◇")}${metric("APIs Without Permission",project.apis.filter(a=>!a.permission).length,"🔐")}</div>
  <div class="card" style="margin-top:16px"><div class="card-title"><div><h2>Validation Results</h2><span class="muted small-text">Fix issues before moving into implementation.</span></div><button class="btn secondary" data-action="run-validation">Run again</button></div>
  ${issues.length?`<div class="table-wrap"><table class="table"><thead><tr><th>Layer</th><th>Object</th><th>Issue</th></tr></thead><tbody>${issues.map(i=>`<tr><td>${esc(i[0])}</td><td>${esc(i[1])}</td><td><span class="tag orange">${esc(i[2])}</span></td></tr>`).join("")}</tbody></table></div>`:`<div class="empty"><strong>All basic checks passed ✓</strong>The project is ready for deeper design review.</div>`}</div>`;
}
async function renderAudit(){
  const actionOptions=['ALL','CREATE','UPDATE','DELETE'];
  const escv=v=>esc(v==null?'':String(v));
  window.__auditRows=[];
  window.__auditFilter='ALL';
  const paint=(list)=>{
    const f=window.__auditFilter||'ALL';
    const rows=(list||[]).filter(x=>f==='ALL'||String(x.action||'').toUpperCase()===f);
    const el=$('#auditRows');
    el.innerHTML=rows.length?`<table class="table"><thead><tr><th>When</th><th>User</th><th>Exact Action</th><th>Object</th><th>Module</th><th>Details</th></tr></thead><tbody>${rows.map(x=>{
      const meta=x.metadata||{};
      const details=[];
      if(meta.sourceType&&meta.targetType) details.push(`${meta.sourceType}:${meta.sourceId||''} → ${meta.targetType}:${meta.targetId||''}`);
      if(meta.changes) details.push(typeof meta.changes==='string'?meta.changes:JSON.stringify(meta.changes));
      if(meta.username) details.push(`@${meta.username}`);
      const cls=x.action==='DELETE'?'red':x.action==='CREATE'?'green':x.action==='UPDATE'?'blue':'orange';
      return `<tr><td>${escv(new Date(x.changed_at).toLocaleString())}</td><td><strong>${escv(x.user_name||x.actor_name||'Unknown')}</strong><div class="muted small-text">@${escv(meta.username||'')}</div></td><td><span class="tag ${cls}">${escv(x.exact_action||x.action||'Changed')}</span><div class="muted small-text">${escv(x.action||'')}</div></td><td><strong>${escv(x.object_name||x.object_id||'')}</strong><div class="muted small-text">${escv(x.object_type||'')}</div></td><td>${escv(x.module_id||'Project')}</td><td class="small-text">${escv(details.join(' · '))}</td></tr>`;
    }).join('')}</tbody></table>`:`<div class="empty">No matching audit entries.</div>`;
  };
  $('#content').innerHTML=`<div class="card"><div class="card-title"><div><h2>Audit Log</h2><span class="muted small-text">Every successful change is recorded with the authenticated user and the exact object-level action.</span></div><button class="btn secondary" data-action="refresh-audit">Refresh</button></div><div class="module-meta" style="margin:12px 0;gap:8px"><label class="field" style="min-width:180px"><span>Action</span><select id="auditAction">${actionOptions.map(x=>`<option value="${x}">${x==='ALL'?'All actions':x}</option>`).join('')}</select></label><div class="muted small-text" style="align-self:end">Create, update, delete and link/unlink actions show the real user and object.</div></div><div id="auditRows" class="table-wrap"><div class="empty">Loading audit history…</div></div></div>`;
  $('#auditAction').onchange=e=>{window.__auditFilter=e.target.value;paint(window.__auditRows)};
  try{
    if(typeof cockroachFetch!=='function' || !supabaseSession?.access_token) throw new Error('Sign in is required.');
    window.__auditRows=await cockroachFetch('/audit?limit=500',{method:'GET'}) || [];
    paint(window.__auditRows);
  }catch(e){$('#auditRows').innerHTML=`<div class="empty"><strong>Audit history unavailable</strong><div class="muted small-text">${esc(e.message||e)}</div></div>`;}
}
function renderDocumentation(){
  $("#content").innerHTML=`<div class="grid two"><div class="card"><div class="card-title"><div><h2>Project Documentation</h2><span class="muted small-text">Generate a readable design summary.</span></div><button class="btn primary" data-action="download-doc">Download HTML</button></div>
  <div class="property-list">${prop("Project",project.project.name)}${prop("Modules",project.modules.length)}${prop("Requirements",project.requirements.length)}${prop("Screens",project.screens.length)}${prop("Entities",project.entities.length)}${prop("Relationships",project.relations.length)}${prop("APIs",project.apis.length)}${prop("Logic workflows",project.logic.length)}</div></div>
  <div class="card"><h2>Suggested delivery package</h2><p class="muted small-text">Use the exported JSON as the single design source of truth. Generate requirement documents, UI specifications, ERD/DDL specifications and API contracts from it.</p><div class="module-meta"><span class="tag blue">Requirements</span><span class="tag green">UI specs</span><span class="tag orange">Oracle ERD</span><span class="tag">REST API</span><span class="tag">Business logic</span></div></div></div>`;
}
function renderSettings(){
  $("#content").innerHTML=`<div class="card"><div class="card-title"><div><h2>Project Settings</h2><span class="muted small-text">Local-first settings for the prototype.</span></div></div>
  <div class="settings-list">
    <div class="setting"><div><strong>Autosave</strong><div class="muted small-text">Cloud save happens only when project data changes.</div></div><input id="autosave" type="checkbox" ${project.settings.autosave!==false?"checked":""}></div>
    <div class="setting"><div><strong>Grid size</strong><div class="muted small-text">ERD canvas grid.</div></div><select id="gridSize"><option ${project.settings.gridSize==16?"selected":""}>16</option><option ${project.settings.gridSize==24?"selected":""}>24</option><option ${project.settings.gridSize==32?"selected":""}>32</option></select></div>
    <div class="setting"><div><strong>Cloud database</strong><div class="muted small-text">All project parts are stored in the shared CockroachDB project. modules, requirements, screens, components, ERD entities/fields, relationships, APIs, workflows, timeline/tasks, references, users, roles, permissions and module access.</div><div class="muted small-text">${esc(typeof supabaseStatus==='function'?supabaseStatus():'CockroachDB API is not configured')}</div></div><div class="module-meta"><button class="btn secondary" data-action="test-cloud">Test connection</button><button class="btn primary" data-action="save-cloud">Save to CockroachDB now</button></div></div>
    <div class="setting"><div><strong>Project JSON file</strong><div class="muted small-text">Portable backup of the complete project.</div><div class="muted small-text" id="projectFileStatus">${esc(typeof projectFileStatus==='function'?projectFileStatus():'Browser storage (local)')}</div></div><div class="module-meta"><button class="btn secondary" data-action="connect-project-file">Connect JSON File</button><button class="btn secondary" data-action="export-project">Download JSON</button><button class="btn secondary" data-action="export-text">Download TXT</button><label class="btn secondary file-btn">Load JSON<input id="settingsImportFile" type="file" accept=".json" hidden></label></div></div>
    <div class="setting"><div><strong>Project reset</strong><div class="muted small-text">Restore the demo project and lose local changes.</div></div><button class="btn secondary" data-action="reset-project">Reset demo</button></div>
  </div></div>`;
  $("#autosave").onchange=e=>{project.settings.autosave=e.target.checked;saveProject(false)};
  $("#gridSize").onchange=e=>{project.settings.gridSize=+e.target.value;saveProject(false)};
  $("#settingsImportFile")?.addEventListener("change",e=>{if(e.target.files[0])importProject(e.target.files[0])});
}

function modal(title,body,footer=`<button class="btn secondary" data-action="close-modal">Cancel</button><button class="btn primary" data-action="submit-modal">Save</button>`,wide=false){
  $("#modalRoot").innerHTML=`<div class="modal-backdrop" id="modalBackdrop"><div class="modal ${wide?"wide":""}"><div class="modal-head"><h3>${title}</h3><button class="icon-btn" data-action="close-modal">×</button></div><div class="modal-body">${body}</div><div class="modal-foot">${footer}</div></div></div>`;
  $("#modalBackdrop").onclick=e=>{if(e.target.id==="modalBackdrop")closeModal()};
  $$("#modalRoot [data-action]").forEach(el=>el.onclick=()=>handleAction(el.dataset.action,el.dataset.id));
}
function closeModal(){$("#modalRoot").innerHTML=""}

function commentsField(item,label="Comments / Design Notes"){
  const id=item?.id||''; const entries=(project.comments||[]).filter(c=>c.objectId===id);
  return `<div class="field full comment-field"><label>💬 ${label}</label><textarea name="comments" placeholder="Design notes / summary...">${esc(item?.comments||"")}</textarea><label style="margin-top:8px">Add attributed comment</label><textarea name="newComment" placeholder="Your comment will be saved with your username..."></textarea><div class="field-hint">${entries.length?entries.slice(0,8).map(c=>`<div><b>${esc(c.authorName||'User')}</b> · ${esc(fmtDate(c.createdAt))}: ${esc(c.commentText)}</div>`).join(''):'No attributed comments yet.'}</div></div>`;
}
const LINK_ORDER={requirement:10,screen:20,entity:30,api:40,logic:50,test:60};
function canonicalLink(aType,aId,bType,bId){
  if(!aType||!aId||!bType||!bId||aType===bType&&String(aId)===String(bId)) return null;
  const a={type:String(aType),id:String(aId)}, b={type:String(bType),id:String(bId)};
  const swap=(LINK_ORDER[a.type]||999)>(LINK_ORDER[b.type]||999) || ((LINK_ORDER[a.type]||999)===(LINK_ORDER[b.type]||999)&&a.id>b.id);
  const s=swap?b:a, t=swap?a:b;
  return {sourceType:s.type,sourceId:s.id,targetType:t.type,targetId:t.id};
}
function linkMatches(l,aType,aId,bType,bId){
  return (l.sourceType===aType&&String(l.sourceId)===String(aId)&&l.targetType===bType&&String(l.targetId)===String(bId)) ||
         (l.sourceType===bType&&String(l.sourceId)===String(bId)&&l.targetType===aType&&String(l.targetId)===String(aId));
}
function linkedObjects(itemType,itemId,excludeTypes=[]){
  const links=project.links||[];
  const targets=[];
  const seen=new Set();
  const getList=type=>type==='requirement'?project.requirements:type==='screen'?project.screens:type==='entity'?project.entities:type==='api'?project.apis:type==='logic'?project.logic:type==='test'?(project.tests||[]):[];
  links.forEach(l=>{
    let type=null,id=null;
    if(l.sourceType===itemType && String(l.sourceId)===String(itemId)){type=l.targetType;id=l.targetId;}
    else if(l.targetType===itemType && String(l.targetId)===String(itemId)){type=l.sourceType;id=l.sourceId;}
    if(!type||excludeTypes.includes(type)||seen.has(type+'|'+id)) return;
    const obj=getList(type).find(x=>String(x.id)===String(id));
    if(!obj) return;
    seen.add(type+'|'+id);
    const labels={requirement:'REQ',screen:'SCREEN',entity:'ERD',api:'API',logic:'BACKEND',test:'TEST'};
    const name=obj.title||obj.name||obj.path||obj.id;
    targets.push(`<span class="linked-object-chip" title="${esc(name)}"><b>${labels[type]||type.toUpperCase()}</b> ${esc(name)}</span>`);
  });
  return targets.length?`<div class="linked-objects"><span class="linked-objects-label">↔ Linked:</span>${targets.join('')}</div>`:`<div class="linked-objects linked-none"><span>↔ No linked objects</span></div>`;
}

function artifactLinkSelector(item,type,label,sourceType){
 const existing=new Set();
 (project.links||[]).forEach(l=>{
   if(l.sourceType===sourceType&&String(l.sourceId)===String(item?.id)&&l.targetType===type) existing.add(String(l.targetId));
   if(l.targetType===sourceType&&String(l.targetId)===String(item?.id)&&l.sourceType===type) existing.add(String(l.sourceId));
 });
 const list=type==='screen'?project.screens:type==='logic'?project.logic:type==='test'?project.tests:type==='requirement'?project.requirements:type==='api'?project.apis:project.entities;
 return `<div class="field"><label>${label}</label><select name="link_${type}" multiple size="4">${list.map(x=>`<option value="${esc(x.id)}" ${existing.has(String(x.id))?'selected':''}>${esc(x.id)} — ${esc(x.name||x.title||x.path||'')}</option>`).join('')}</select></div>`;
}
function syncFormLinks(sourceType,sourceId,v){
 project.links ||= [];
 const targets=[['screen',v.link_screen||[]],['logic',v.link_logic||[]],['test',v.link_test||[]],['requirement',v.link_requirement||[]],['api',v.link_api||[]],['entity',v.link_entity||[]]];
 const targetTypes=new Set(targets.map(x=>x[0]));
 project.links=project.links.filter(l=>{
   const touchesSource=(l.sourceType===sourceType&&String(l.sourceId)===String(sourceId)) || (l.targetType===sourceType&&String(l.targetId)===String(sourceId));
   const otherType=l.sourceType===sourceType?l.targetType:l.targetType===sourceType?l.sourceType:null;
   return !(touchesSource && targetTypes.has(otherType));
 });
 const actor=currentUser()?.username||'';
 targets.forEach(([type,ids])=>[].concat(ids||[]).forEach(targetId=>{
   const pair=canonicalLink(sourceType,sourceId,type,targetId);
   if(pair) project.links.push({id:uid('LINK'),...pair,createdBy:actor});
 }));
}

function addProjectComment(){
  modal("Project Comment",`<div class="form-grid"><div class="field full"><label>💬 Comment / Architecture Note</label><textarea name="comment" placeholder="Example: Confirm whether employee transfers need approval from both HR and Operations."></textarea></div></div>`, `<button class="btn secondary" data-action="close-modal">Cancel</button><button class="btn primary" data-action="submit-modal">Add Comment</button>`);
  state.editing={type:"project-comment"};
}
function renderCommentSummary(item){
  return item?.comments ? `<div class="comment-preview">💬 ${esc(item.comments)}</div>` : `<div class="comment-preview empty-comment">💬 Add a note or decision</div>`;
}

function requirementForm(item){
  item ||= {id:"",moduleId:state.moduleId||project.modules[0].id,title:"",actor:"",priority:"Medium",status:"Draft",description:"",rule:"",acceptance:""};
  return `<div class="form-grid"><div class="field"><label>Requirement ID</label><input name="id" value="${esc(item.id)}" ${item.id?"readonly":""}></div><div class="field"><label>Module</label>${moduleSelector(item.moduleId)}</div><div class="field"><label>Title</label><input name="title" value="${esc(item.title)}"></div><div class="field"><label>Actor</label><input name="actor" value="${esc(item.actor)}"></div><div class="field"><label>Priority</label><select name="priority">${["Low","Medium","High","Critical"].map(x=>`<option ${x===item.priority?"selected":""}>${x}</option>`).join("")}</select></div><div class="field"><label>Status</label><select name="status">${["Draft","Review","Approved","Implemented"].map(x=>`<option ${x===item.status?"selected":""}>${x}</option>`).join("")}</select></div><div class="field full"><label>Description</label><textarea name="description">${esc(item.description)}</textarea></div><div class="field full"><label>Business Rule</label><textarea name="rule">${esc(item.rule)}</textarea></div><div class="field full"><label>Acceptance Criteria</label><textarea name="acceptance">${esc(item.acceptance)}</textarea></div><div class="field full"><div class="card-title"><h3>Traceability Links</h3></div></div>${artifactLinkSelector(item,'screen','Linked Screens','requirement')}${artifactLinkSelector(item,'logic','Linked Backend Logic','requirement')}${artifactLinkSelector(item,'test','Linked Testing','requirement')}${commentsField(item)}</div>`;
}
function screenForm(item){
  item ||= {id:"",moduleId:state.moduleId||project.modules[0].id,name:"",type:"Form",status:"Draft",description:"",components:[]};
  return `<div class="form-grid"><div class="field"><label>Screen ID</label><input name="id" value="${esc(item.id)}" ${item.id?"readonly":""}></div><div class="field"><label>Module</label>${moduleSelector(item.moduleId)}</div><div class="field"><label>Screen name</label><input name="name" value="${esc(item.name)}"></div><div class="field"><label>Type</label><select name="type">${["List","Form","Details","Dashboard","Approval","Report"].map(x=>`<option ${x===item.type?"selected":""}>${x}</option>`).join("")}</select></div><div class="field"><label>Status</label><select name="status">${["Draft","Review","Approved","Implemented"].map(x=>`<option ${x===item.status?"selected":""}>${x}</option>`).join("")}</select></div><div class="field full"><label>Description</label><textarea name="description">${esc(item.description)}</textarea></div><div class="field full"><div class="card-title"><h3>Traceability Links</h3></div></div>${artifactLinkSelector(item,'requirement','Linked Requirements','screen')}${artifactLinkSelector(item,'logic','Linked Backend Logic','screen')}${artifactLinkSelector(item,'test','Linked Testing','screen')}${commentsField(item)}</div>`;
}
function entityForm(item){
  item ||= {id:"",name:"",moduleId:state.moduleId||project.modules[0].id,x:80,y:80,fields:[]};
  return `<div class="form-grid"><div class="field"><label>Entity ID</label><input name="id" value="${esc(item.id)}" ${item.id?"readonly":""}></div><div class="field"><label>Module</label>${moduleSelector(item.moduleId)}</div><div class="field full"><label>Table name</label><input name="name" value="${esc(item.name)}"></div></div>
  <div style="margin-top:18px"><div class="card-title"><h3>Columns</h3><button type="button" class="btn secondary" data-action="add-temp-field">＋ Column</button></div><div id="tempFields">${item.fields.map((f,i)=>fieldEditor(f,i)).join("")}</div>${commentsField(item)}</div>`;
}
function fieldEditor(f,i){return `<div class="form-grid three temp-field" style="padding:10px;border:1px solid var(--line);border-radius:9px;margin:7px 0"><div class="field"><label>Name</label><input name="fname" value="${esc(f.name)}"></div><div class="field"><label>Oracle Type</label><input name="ftype" value="${esc(f.type)}"></div><div class="field"><label>Options</label><div style="display:flex;gap:9px;flex-wrap:wrap"><label class="check"><input name="fpk" type="checkbox" ${f.pk?"checked":""}> PK</label><label class="check"><input name="ffk" type="checkbox" ${f.fk?"checked":""}> FK</label><label class="check"><input name="funique" type="checkbox" ${f.unique?"checked":""}> Unique</label></div></div></div>`}
function apiForm(item){
  item ||= {id:"",moduleId:state.moduleId||project.modules[0].id,method:"POST",path:"/api/",name:"",permission:"",status:"Draft",description:"",inputs:"",rules:"",logic:""};
  return `<div class="form-grid"><div class="field"><label>API ID</label><input name="id" value="${esc(item.id)}" ${item.id?"readonly":""}></div><div class="field"><label>Module</label>${moduleSelector(item.moduleId)}</div><div class="field"><label>Name</label><input name="name" value="${esc(item.name)}"></div><div class="field"><label>Method</label><select name="method">${["GET","POST","PUT","PATCH","DELETE"].map(x=>`<option ${x===item.method?"selected":""}>${x}</option>`).join("")}</select></div><div class="field full"><label>Path</label><input name="path" value="${esc(item.path)}"></div><div class="field"><label>Permission code</label><input name="permission" value="${esc(item.permission)}" placeholder="EMPLOYEE.CREATE"></div><div class="field"><label>Status</label><select name="status">${["Draft","Review","Approved","Implemented"].map(x=>`<option ${x===item.status?"selected":""}>${x}</option>`).join("")}</select></div><div class="field full"><label>Description</label><textarea name="description">${esc(item.description)}</textarea></div><div class="field full"><label>Inputs</label><textarea name="inputs">${esc(item.inputs)}</textarea></div><div class="field full"><label>Validation / Rules</label><textarea name="rules">${esc(item.rules)}</textarea></div><div class="field full"><label>Logic</label><textarea name="logic">${esc(item.logic)}</textarea></div><div class="field full"><div class="card-title"><h3>Traceability Links</h3></div></div>${artifactLinkSelector(item,'requirement','Linked Requirements','api')}${artifactLinkSelector(item,'test','Linked Testing','api')}${commentsField(item)}</div>`;
}
function logicForm(item){
  item ||= {id:"",moduleId:state.moduleId||project.modules[0].id,name:"",trigger:"",steps:["Authenticate user","Authorize operation","Validate request","Execute business rules","Persist data","Audit","Respond"]};
  return `<div class="form-grid"><div class="field"><label>Workflow ID</label><input name="id" value="${esc(item.id)}" ${item.id?"readonly":""}></div><div class="field"><label>Module</label>${moduleSelector(item.moduleId)}</div><div class="field full"><label>Name</label><input name="name" value="${esc(item.name)}"></div><div class="field full"><label>Trigger / API</label><input name="trigger" value="${esc(item.trigger)}"></div><div class="field full"><label>Steps (one per line)</label><textarea name="steps" style="min-height:180px">${esc(item.steps.join("\n"))}</textarea></div><div class="field full"><div class="card-title"><h3>Traceability Links</h3></div></div>${artifactLinkSelector(item,'requirement','Linked Requirements','logic')}${artifactLinkSelector(item,'screen','Linked Screens','logic')}${artifactLinkSelector(item,'test','Linked Testing','logic')}${commentsField(item)}</div>`;
}
function moduleForm(item){
  item ||= {id:"",name:"",icon:"▦",color:"blue",description:""};
  return `<div class="form-grid"><div class="field"><label>Module ID</label><input name="id" value="${esc(item.id)}" ${item.id?"readonly":""}></div><div class="field"><label>Module name</label><input name="name" value="${esc(item.name)}"></div><div class="field"><label>Icon</label><input name="icon" value="${esc(item.icon)}"></div><div class="field"><label>Color</label><select name="color">${["blue","green","orange","red","purple","cyan"].map(x=>`<option ${x===item.color?"selected":""}>${x}</option>`).join("")}</select></div><div class="field full"><label>Description</label><textarea name="description">${esc(item.description)}</textarea></div>${commentsField(item)}</div>`;
}

function formValues(){
  const obj={}; $$("#modalRoot [name]").forEach(el=>{if(el.type==="checkbox")obj[el.name]=el.checked;else if(el.multiple)obj[el.name]=[...el.selectedOptions].map(o=>o.value);else obj[el.name]=el.value}); return obj;
}

function compressReferenceImage(file){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>{const img=new Image(); img.onload=()=>{const max=1800; const scale=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight)); const canvas=document.createElement('canvas'); canvas.width=Math.max(1,Math.round(img.naturalWidth*scale)); canvas.height=Math.max(1,Math.round(img.naturalHeight*scale)); const ctx=canvas.getContext('2d'); ctx.fillStyle='#ffffff'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.drawImage(img,0,0,canvas.width,canvas.height); resolve(canvas.toDataURL('image/jpeg',.82));}; img.onerror=reject; img.src=reader.result;}; reader.onerror=reject; reader.readAsDataURL(file);
  });
}
function handleReferenceFiles(fileList,moduleId=null,screenId=null,type='Reference'){
  const files=[...(fileList||[])].filter(f=>f.type.startsWith('image/'));
  if(!files.length)return;
  project.references ||= [];
  Promise.all(files.map(compressReferenceImage)).then(dataUrls=>{
    dataUrls.forEach((dataUrl,i)=>project.references.push({id:uid('REF'),moduleId,screenId,type,title:files[i].name.replace(/\.[^.]+$/,''),notes:type==='Oracle Form'?'Legacy Oracle Forms screenshot / reference image':'',dataUrl,createdAt:new Date().toISOString()}));
    saveProject(false);render();showToast(`${files.length} reference image${files.length===1?'':'s'} added`);
  }).catch(()=>showToast('One or more images could not be processed'));
}
function referenceForm(item){
  item ||= {id:uid('REF'),moduleId:state.moduleId||null,type:'Reference',title:'',notes:''};
  return `<div class="form-grid"><div class="field full"><label>Title</label><input name="title" value="${esc(item.title||'')}" placeholder="Employee Main Form"></div><div class="field"><label>Module <span class="required-mark">*</span></label>${moduleSelector(item.moduleId)}</div><div class="field"><label>Screen (optional)</label><select name="screenId"><option value="">Module-level reference</option>${project.screens.filter(s=>!item.moduleId||s.moduleId===item.moduleId).map(s=>`<option value="${s.id}" ${s.id===item.screenId?'selected':''}>${esc(s.name)}</option>`).join('')}</select></div><div class="field"><label>Type</label><select name="type">${['Reference','Oracle Form','UI Inspiration','Process','Other'].map(x=>`<option ${x===item.type?'selected':''}>${x}</option>`).join('')}</select></div><div class="field full"><label>Notes</label><textarea name="notes" placeholder="What should we learn from this image?">${esc(item.notes||'')}</textarea></div></div>`;
}

function handleAction(action,id){
  const writeActions=['new-module','new-screen-for-module','edit-module','delete-module','new-requirement','edit-requirement','delete-requirement','new-screen','edit-screen','delete-screen','save-component','delete-component','new-entity','edit-entity','delete-entity','new-relation','edit-relation','delete-relation','new-api','edit-api','delete-api','new-logic','edit-logic','delete-logic','new-timeline-task','edit-timeline-task','delete-timeline-task','new-user','edit-user','delete-user','new-role','edit-role','new-reference','edit-reference','delete-reference','reset-project'];
  const securityActions=['new-user','edit-user','delete-user','new-role','edit-role'];
  if(securityActions.includes(action) && !hasAccess('SECURITY.EDIT')){showToast('Security administration requires Administrator access');return;}
  if(writeActions.includes(action) && currentUser()?.role==='Viewer'){showToast('Viewer accounts are read-only');return;}

  switch(action){
    case "add-project-comment": addProjectComment();break;
    case "logout": logout(); break;
    case "refresh-audit": renderAudit(); break;
    case "new-user": state.editing={type:"user"};modal("New User",userForm());break;
    case "edit-user": state.editing={type:"user",id};modal("Edit User",userForm((project.security.users||[]).find(x=>x.id===id)));break;
    case "delete-user":
      if(false){showToast("Built-in users cannot be deleted.");break;}
      if(confirm("Delete this user?")){project.security.users=(project.security.users||[]).filter(x=>x.id!==id);saveProject(false);renderAccess();showToast("User deleted");}
      break;
    case "new-role": state.editing={type:"role"};modal("New Role",roleForm());break;
    case "new-reference": state.editing={type:"reference"};modal("Add Reference Image",referenceForm());break;
    case "edit-reference": state.editing={type:"reference",id};modal("Edit Reference Image",referenceForm((project.references||[]).find(x=>x.id===id)));break;
    case "delete-reference": if(confirm("Delete this reference image?")){project.references=(project.references||[]).filter(x=>x.id!==id);saveProject(false);render();showToast("Reference deleted");}break;
    case "edit-role": state.editing={type:"role",id};modal("Edit Role",roleForm(project.security.roles.find(x=>x.id===id)));break;
    case "edit-project": modal("Edit Project",`<div class="form-grid"><div class="field"><label>Project ID</label><input name="id" value="${esc(project.project.id)}"></div><div class="field"><label>Project name</label><input name="name" value="${esc(project.project.name)}"></div><div class="field"><label>Owner</label><input name="owner" value="${esc(project.project.owner)}"></div><div class="field full"><label>Description</label><textarea name="description">${esc(project.project.description)}</textarea></div>${commentsField(project.project)}</div>`); state.editing={type:"project"};break;
    case "save-project": exportProject();break;
    case "save-cloud": if(typeof saveProjectToSupabase==='function') saveProjectToSupabase(); break;
    case "test-cloud": if(typeof testSupabaseConnection==='function') testSupabaseConnection(); break;
    case "connect-project-file": connectProjectFile();break;
    case "export-text": downloadTextProject();break;
    case "export-project": exportProject();break;
    case "new-item": if(state.view==="timeline")handleAction("new-timeline-task");else if(state.view==="modules")handleAction("new-module");else if(state.view==="requirements")handleAction("new-requirement");else if(state.view==="screens")handleAction("new-screen");else if(state.view==="erd")handleAction("new-entity");else if(state.view==="backend")handleAction("new-logic");else handleAction("new-requirement");break;
    case "new-timeline-task": state.editing={type:"timeline"};modal("New Timeline Work Item",timelineForm());break;
    case "edit-timeline-task": state.editing={type:"timeline",id};modal("Edit Timeline Work Item",timelineForm((project.timeline||[]).find(x=>x.id===id)));break;
    case "delete-timeline-task": if(confirm("Delete this timeline item?")){project.timeline=(project.timeline||[]).filter(x=>x.id!==id);saveProject(false);renderTimeline();showToast("Timeline item deleted")}break;
    case "seed-timeline": if(confirm("Rebuild the default delivery plan? Existing custom timeline items will be replaced.")){seedTimeline(true);saveProject(false);renderTimeline();showToast("Timeline rebuilt")}break;
    case "new-module": state.editing={type:"module"};modal("New Module",moduleForm());break;
    case "edit-module": state.editing={type:"module",id};modal("Edit Module",moduleForm(moduleById(id)));break;
    case "delete-module": if(confirm("Delete this module and its artifacts?")){project.modules=project.modules.filter(m=>m.id!==id);["requirements","screens","entities","apis","logic"].forEach(k=>project[k]=project[k].filter(x=>x.moduleId!==id));saveProject(false);render();showToast("Module deleted")}break;
    case "new-requirement": state.editing={type:"requirement"};modal("New Business Requirement",requirementForm());break;
    case "edit-requirement": state.editing={type:"requirement",id};modal("Edit Business Requirement",requirementForm(project.requirements.find(x=>x.id===id)));break;
    case "delete-requirement": if(confirm("Delete requirement?")){project.requirements=project.requirements.filter(x=>x.id!==id);saveProject(false);render();showToast("Requirement deleted")}break;
    case "new-screen-for-module": state.moduleId=id; state.screenId=null; state.selectedComponentId=null; state.editing={type:"screen",fromDesigner:true}; modal("Create Screen",screenForm({id:uid("SCR"),moduleId:id,name:"",type:"Form",status:"Draft",description:"",components:[],comments:""}),`<button class="btn secondary" data-action="close-modal">Cancel</button><button class="btn primary" data-action="submit-modal">Create Screen</button>`,true); break;
    case "new-screen": state.editing={type:"screen"};modal("New Screen",screenForm({id:uid("SCR"),moduleId:state.moduleId||project.modules[0]?.id,name:"",type:"Form",status:"Draft",description:"",components:[],comments:""}),`<button class="btn secondary" data-action="close-modal">Cancel</button><button class="btn primary" data-action="submit-modal">Create Screen</button>`,true);break;
    case "edit-screen": state.editing={type:"screen",id};modal("Edit Screen",screenForm(project.screens.find(x=>x.id===id)));break;
    case "delete-screen": if(confirm("Delete screen?")){project.screens=project.screens.filter(x=>x.id!==id);saveProject(false);render();showToast("Screen deleted")}break;
    case "design-screen": state.moduleId=project.screens.find(x=>x.id===id)?.moduleId;state.tab="designer";state.selectedComponent=null;render();break;
    case "back-screens":state.tab="list";render();break;
    case "save-component": saveComponent(id);break;
    case "delete-component": {const s=project.screens.find(x=>x.id===state.editing.id);s.components=s.components.filter(c=>c.id!==id);state.selectedComponent=null;saveActiveScreen(false);renderScreens();showToast("Component removed");break}
    case "new-test": state.editing={type:"test"}; modal("New Test Case",testingForm(),`<button class="btn secondary" data-action="close-modal">Cancel</button><button class="btn primary" data-action="submit-testing-modal">Save Test Case</button>`,true); break;
    case "edit-test": state.editing={type:"test",id}; modal("Edit Test Case",testingForm(project.tests.find(x=>x.id===id)),`<button class="btn secondary" data-action="close-modal">Cancel</button><button class="btn primary" data-action="submit-testing-modal">Save Test Case</button>`,true); break;
    case "delete-test": if(confirm("Delete this test case?")){project.tests=project.tests.filter(x=>x.id!==id);saveProject(false);render();showToast("Test case deleted")} break;
    case "add-test-step": addTestingStep(); break;
    case "remove-test-step": removeTestingStep(id); break;
    case "new-entity": state.editing={type:"entity"};modal("New Database Entity",entityForm(),`<button class="btn secondary" data-action="close-modal">Cancel</button><button class="btn primary" data-action="submit-modal">Save</button>`,true);break;
    case "edit-entity": state.editing={type:"entity",id};modal("Edit Database Entity",entityForm(project.entities.find(x=>x.id===id)),`<button class="btn secondary" data-action="close-modal">Cancel</button><button class="btn primary" data-action="submit-modal">Save</button>`,true);break;
    case "new-relation": state.editing={type:"relation"};modal("New Relationship",relationForm());break;
    case "edit-relation": state.editing={type:"relation",id};modal("Edit Relationship",relationForm(project.relations.find(r=>r.id===id)));break;
    case "delete-relation": if(confirm("Delete relationship?")){project.relations=project.relations.filter(r=>r.id!==id);saveProject(false);closeModal();render();showToast("Relationship deleted")}break;
    case "cancel-connect": state.erdConnectFrom=null;render();break;
    case "delete-entity": if(confirm("Delete entity?")){project.entities=project.entities.filter(x=>x.id!==id);project.relations=project.relations.filter(r=>r.from!==id&&r.to!==id);saveProject(false);render()}break;
    case "new-api": state.editing={type:"api"};modal("New API Contract",apiForm());break;
    case "edit-api": state.editing={type:"api",id};modal("Edit API Contract",apiForm(project.apis.find(x=>x.id===id)));break;
    case "delete-api": if(confirm("Delete API?")){project.apis=project.apis.filter(x=>x.id!==id);saveProject(false);render()}break;
    case "new-logic": state.editing={type:"logic"};modal("New Backend Workflow",logicForm());break;
    case "add-temp-field": {const box=$("#tempFields");box.insertAdjacentHTML("beforeend",fieldEditor({name:"NEW_FIELD",type:"VARCHAR2(100)",pk:false,fk:false},$$("#tempFields .temp-field").length));break}
    case "submit-modal": submitModal();break;
    case "close-modal": closeModal();break;
    case "reset-project": if(confirm("Reset the demo project?")){resetProject();location.reload()}break;
    case "run-validation": render();break;
    case "download-doc": downloadDocumentation();break;
    case "export-traceability": exportTraceability();break;
  }
}

function timelineForm(item){
  const d=new Date(); d.setDate(d.getDate()+7); const start=isoDate(d); const end=isoDate(addDays(d,4));
  item ||= {id:uid("PLAN"),moduleId:state.moduleId||project.modules[0]?.id,name:"",layer:"Requirements",phase:"Module Delivery",start,end,status:"Planned",priority:"Medium",owner:"",dependencies:"",short:"",comments:""};
  return `<div class="form-grid"><div class="field"><label>Work item ID</label><input name="id" value="${esc(item.id)}" ${item.id&&item.id.startsWith('PLAN-')?'readonly':''}></div><div class="field"><label>Module</label>${moduleSelector(item.moduleId)}</div><div class="field full"><label>Work item name</label><input name="name" value="${esc(item.name)}" placeholder="Example: Personnel — Employee Form design"></div><div class="field"><label>Layer</label><select name="layer">${['Foundation','Requirements','Screens','ERD','Backend','UAT'].map(x=>`<option ${x===item.layer?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label>Phase</label><select name="phase">${['Foundation','Module Delivery','Integration & UAT','Go-Live'].map(x=>`<option ${x===item.phase?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label>Start</label><input type="date" name="start" value="${esc(item.start)}"></div><div class="field"><label>End</label><input type="date" name="end" value="${esc(item.end)}"></div><div class="field"><label>Status</label><select name="status">${['Planned','In Progress','Done','Blocked'].map(x=>`<option ${x===item.status?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label>Priority</label><select name="priority">${['Low','Medium','High','Critical'].map(x=>`<option ${x===item.priority?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label>Owner / Assignee</label><select name="assigneeId"><option value="">— Unassigned —</option>${(project.security?.users||[]).map(u=>`<option value="${esc(u.id)}" ${u.id===item.assigneeId?'selected':''}>${esc(u.displayName||u.username)}</option>`).join('')}</select></div><div class="field"><label>Dependencies</label><input name="dependencies" value="${esc(item.dependencies||'')}" placeholder="PLAN-001, PLAN-002"></div><div class="field full"><label>Timeline label</label><input name="short" value="${esc(item.short||'')}" placeholder="Short text shown on the Gantt bar"></div><div class="field full"><label>Connected design items</label><select name="taskLinks" multiple size="6">${[...project.requirements.map(x=>['Requirement',x.id,x.title]),...project.screens.map(x=>['Screen',x.id,x.name]),...project.logic.map(x=>['Backend',x.id,x.name]),...project.tests.map(x=>['Testing',x.id,x.name]),...project.entities.map(x=>['ERD',x.id,x.name])].map(([ty,id,n])=>{const on=(project.taskLinks||[]).some(l=>l.taskId===item.id&&l.objectType===ty&&l.objectId===id);return `<option value="${esc(ty+'::'+id)}" ${on?'selected':''}>${esc(ty)} — ${esc(n)}</option>`}).join('')}</select></div>${commentsField(item,"Planning notes / comments")}</div>`;
}

function relationForm(item){
  item ||= {id:uid("REL"),from:project.entities[0]?.id||"",to:project.entities[1]?.id||"",fromField:"",toField:"",cardinality:"1:N",comments:""};
  const opts=id=>project.entities.map(e=>`<option value="${e.id}" ${e.id===id?'selected':''}>${esc(e.name)}</option>`).join("");
  const fields=(entityId,selected)=>{const e=project.entities.find(x=>x.id===entityId);return (e?.fields||[]).map(f=>`<option value="${esc(f.name)}" ${f.name===selected?'selected':''}>${esc(f.name)}</option>`).join("");};
  return `<div class="form-grid"><div class="field"><label>Relationship ID</label><input name="id" value="${esc(item.id)}" readonly></div><div class="field"><label>Cardinality</label><select name="cardinality">${['1:N','1:1','N:M'].map(x=>`<option ${x===item.cardinality?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label>From entity</label><select name="from">${opts(item.from)}</select></div><div class="field"><label>To entity</label><select name="to">${opts(item.to)}</select></div><div class="field"><label>From field</label><select name="fromField">${fields(item.from,item.fromField)}</select></div><div class="field"><label>To field</label><select name="toField">${fields(item.to,item.toField)}</select></div>${commentsField(item)}<div class="field full"><button type="button" class="btn danger-outline" data-action="delete-relation" data-id="${esc(item.id)}">Delete relationship</button></div></div>`;
}

function saveComponent(id){
  const s=project.screens.find(x=>x.id===state.editing.id),c=s.components.find(x=>x.id===id);
  c.label=$("#pcLabel").value;c.dataType=$("#pcType").value;c.required=$("#pcRequired").checked;c.entity=$("#pcEntity").value;c.field=$("#pcField").value;c.comments=$("#pcComments").value;
  saveActiveScreen(false);renderScreens();showToast("Component updated");
}

async function submitModal(){
  const v=formValues(), t=state.editing?.type;
  if(t==="test")return submitTestingModal();
  if(t==="project-comment"){
    const text=String(v.comment||"").trim(); if(!text)return alert("Comment cannot be empty");
    const u=currentUser()||{};
    const commitLocal=()=>{
      project.project.commentLog ||= [];
      project.project.commentLog.push({id:uid("COM"),comment:text,authorId:u.id||null,authorName:u.displayName||u.username||"Authenticated user",createdAt:new Date().toISOString()});
      project.project.comments=project.project.commentLog.map(x=>`[${fmtDate(x.createdAt)} · ${x.authorName}] ${x.comment}`).join("\n\n");
      saveProject(false); closeModal(); render(); showToast("Comment added and attributed to "+(u.displayName||"user"));
    };
    if(typeof supabaseFetch==="function" && supabaseSession?.access_token){
      supabaseFetch("/rest/v1/rpc/add_ibs_comment",{method:"POST",body:JSON.stringify({p_object_type:"project",p_object_id:project.project.id,p_module_id:null,p_comment:text})})
        .then(()=>commitLocal()).catch(e=>showToast("Comment was not saved: "+(e.message||e)));
    } else commitLocal();
    return}
  if(t==="project"){project.project={...project.project,...v};saveProject(false);closeModal();render();showToast("Project updated");return}
  if(t==="module"){
    const obj={id:v.id.trim(),name:v.name.trim(),icon:v.icon||"▦",color:v.color,description:v.description,comments:v.comments||""};
    if(!obj.id||!obj.name)return alert("Module ID and name are required");
    const old=project.modules.find(x=>x.id===state.editing.id);
    if(old)Object.assign(old,obj);else project.modules.push(obj);
  } else if(t==="requirement"){
    const obj={...v}; if(!obj.id||!obj.title)return alert("Requirement ID and title are required");
    const old=project.requirements.find(x=>x.id===state.editing.id);if(old)Object.assign(old,obj);else project.requirements.push(obj);
  } else if(t==="screen"){
    const obj={...v,components:state.editing.id?(project.screens.find(x=>x.id===state.editing.id)?.components||[]):[],savedAt:new Date().toISOString()};
    if(!obj.id||!obj.name)return alert("Screen ID and name are required");
    const old=project.screens.find(x=>x.id===state.editing.id);
    if(old) Object.assign(old,obj); else { project.screens.push(obj); }
    state.moduleId=obj.moduleId||state.moduleId||project.modules[0]?.id; state.screenId=obj.id; state.selectedComponentId=null;
  } else if(t==="entity"){
    const obj={id:v.id.trim(),name:v.name.trim(),moduleId:v.moduleId,x:80,y:80,fields:[],comments:v.comments||""};
    const old=project.entities.find(x=>x.id===state.editing.id);
    if(old){obj.x=old.x;obj.y=old.y;obj.fields=old.fields}
    const rows=$$("#tempFields .temp-field"); if(rows.length)obj.fields=rows.map(row=>({name:row.querySelector('[name="fname"]').value,type:row.querySelector('[name="ftype"]').value,pk:row.querySelector('[name="fpk"]').checked,fk:row.querySelector('[name="ffk"]').checked,unique:row.querySelector('[name="funique"]').checked,nullable:true}));
    if(!obj.id||!obj.name)return alert("Entity ID and table name are required");
    if(old)Object.assign(old,obj);else project.entities.push(obj);
  } else if(t==="relation"){
    const obj={id:v.id,from:v.from,to:v.to,fromField:v.fromField,toField:v.toField,cardinality:v.cardinality,comments:v.comments||""};
    const old=project.relations.find(x=>x.id===state.editing.id); if(old)Object.assign(old,obj); else project.relations.push(obj);
  } else if(t==="api"){
    const obj={...v};if(!obj.id||!obj.name||!obj.path)return alert("API ID, name and path are required");
    const old=project.apis.find(x=>x.id===state.editing.id);if(old)Object.assign(old,obj);else project.apis.push(obj);
  } else if(t==="user"){
    const username=String(v.username||"").trim().toLowerCase();
    const displayName=String(v.displayName||"").trim()||username;
    if(!username)return alert("Username is required");
    
    const duplicate=(project.security.users||[]).some(u=>u.id!==state.editing.id && String(u.username||"").trim().toLowerCase()===username);
    if(duplicate)return alert("Username already exists.");
    const old=(project.security.users||[]).find(x=>x.id===state.editing.id);
    if(!old && !String(v.password||""))return alert("Password is required for a new user.");
    const obj={id:v.id||uid("USR"),username,displayName,role:v.role||"Viewer",active:String(v.active)!=="false",password:old && !v.password ? old.password : String(v.password||""),comments:v.comments||""};
    if(old)Object.assign(old,obj); else (project.security.users ||= []).push(obj);
  } else if(t==="role"){
    if(!v.name)return alert("Role name is required"); const old=project.security.roles.find(x=>x.id===state.editing.id); const obj={id:v.id,name:v.name,description:v.description||""}; if(old)Object.assign(old,obj);else project.security.roles.push(obj);
  } else if(t==="timeline"){
    if(!v.id||!v.name||!v.start||!v.end)return alert("Timeline item, start and end are required");
    if(v.end<v.start)return alert("End date must be on or after start date");
    const uAss=(project.security?.users||[]).find(u=>u.id===v.assigneeId); const obj={id:v.id,moduleId:v.moduleId||null,name:v.name,layer:v.layer,phase:v.phase,start:v.start,end:v.end,status:v.status,priority:v.priority,owner:v.owner||'',assigneeId:v.assigneeId||null,assigneeName:uAss?.displayName||uAss?.username||'',dependencies:v.dependencies,short:v.short,comments:v.comments||""};
    const old=(project.timeline||[]).find(x=>x.id===state.editing.id); if(old)Object.assign(old,obj);else (project.timeline ||= []).push(obj);
  } else if(t==="logic"){
    const obj={id:v.id,moduleId:v.moduleId,name:v.name,trigger:v.trigger,comments:v.comments||"",steps:v.steps.split("\n").map(x=>x.trim()).filter(Boolean)};
    if(!obj.id||!obj.name)return alert("Workflow ID and name are required");
    const old=project.logic.find(x=>x.id===state.editing.id);if(old)Object.assign(old,obj);else project.logic.push(obj);
  }
  if(t!=="project-comment"){
    const sourceType={requirement:'requirement',screen:'screen',api:'api',logic:'logic',test:'test',timeline:'task',entity:'entity',relation:'relation',module:'module'}[t]; const sourceId=state.editing.id||v.id;
    if(sourceType&&sourceId&&sourceType!=='task') syncFormLinks(sourceType,sourceId,v);
    if(t==='timeline'&&sourceId){ project.taskLinks ||= []; project.taskLinks=project.taskLinks.filter(l=>l.taskId!==sourceId); [].concat(v.taskLinks||[]).forEach(token=>{const [objectType,objectId]=String(token).split('::'); if(objectType&&objectId)project.taskLinks.push({taskId:sourceId,objectType,objectId,createdBy:currentUser()?.username||''});}); }
    if(String(v.newComment||'').trim()){ project.comments ||= []; const u=currentUser()||{}; project.comments.push({id:uid('COM'),objectType:sourceType||t,objectId:sourceId||project.project.id,authorName:u.displayName||u.username||'User',commentText:String(v.newComment).trim(),createdAt:new Date().toISOString()}); }
  }
  saveProject(false);closeModal();render();showToast("Saved");
}

function downloadDocumentation(){
  const html=`<!doctype html><html><head><meta charset="utf-8"><title>${esc(project.project.name)}</title><style>body{font-family:Arial;color:#172238;padding:35px}h1{color:#315ee8}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f3f5f8}.module{margin:30px 0}</style></head><body><h1>${esc(project.project.name)}</h1><p>${esc(project.project.description)}</p><h2>Modules</h2><ul>${project.modules.map(m=>`<li>${esc(m.name)} — ${esc(m.description)}</li>`).join("")}</ul><h2>Requirements</h2><table><tr><th>ID</th><th>Module</th><th>Title</th><th>Actor</th><th>Status</th></tr>${project.requirements.map(r=>`<tr><td>${esc(r.id)}</td><td>${esc(moduleById(r.moduleId)?.name)}</td><td>${esc(r.title)}</td><td>${esc(r.actor)}</td><td>${esc(r.status)}</td></tr>`).join("")}</table><h2>Entities</h2><ul>${project.entities.map(e=>`<li><strong>${esc(e.name)}</strong>: ${e.fields.map(f=>esc(f.name)).join(", ")}</li>`).join("")}</ul><h2>APIs</h2><ul>${project.apis.map(a=>`<li><strong>${esc(a.method)} ${esc(a.path)}</strong> — ${esc(a.permission)}</li>`).join("")}</ul></body></html>`;
  const blob=new Blob([html],{type:"text/html"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="system-design-documentation.html";a.click();URL.revokeObjectURL(a.href);showToast("Documentation exported");
}
function exportTraceability(){let csv='Requirement,Module,Screens,ERD,APIs,Logic,Testing\n';const links=project.links||[];project.requirements.forEach(r=>{const ids=t=>links.filter(l=>l.sourceType==='requirement'&&l.sourceId===r.id&&l.targetType===t).map(l=>l.targetId).join(' | ');csv+=`"${r.id}","${moduleById(r.moduleId)?.name||''}","${ids('screen')}","${ids('entity')}","${ids('api')}","${ids('logic')}","${ids('test')}"\n`;});const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='traceability.csv';a.click();URL.revokeObjectURL(a.href);}


/* ================= SECURITY / ACCESS CONTROL ================= */
const AUTH_KEY = "enterpriseDesignStudioAuth";
function securityDefaults(){
  project.security ||= {};
  // Users are managed in CockroachDB. Never inject or require a hard-coded username.
  project.security.users ||= [];
  project.security.roles ||= [
    {id:"ADMIN",name:"Administrator",description:"Full access to all design and security features."},
    {id:"ARCH",name:"Architect",description:"Design, edit and manage technical artifacts."},
    {id:"DESIGNER",name:"Designer",description:"Requirements, screens and ERD design."},
    {id:"VIEWER",name:"Viewer",description:"Read-only project access."}
  ];
  const defaultPermissions = [
    "PROJECT.VIEW","PROJECT.EDIT","MODULE.VIEW","MODULE.EDIT","REQUIREMENT.VIEW","REQUIREMENT.EDIT","SCREEN.VIEW","SCREEN.EDIT","ERD.VIEW","ERD.EDIT","API.VIEW","API.EDIT","TIMELINE.VIEW","TIMELINE.EDIT","DOCUMENTATION.EXPORT","SECURITY.VIEW","SECURITY.EDIT",
    "EMPLOYEE.VIEW","EMPLOYEE.CREATE","EMPLOYEE.EDIT","EMPLOYEE.APPROVE",
    "CLIENT.VIEW","CLIENT.CREATE","CLIENT.EDIT","CLIENT.APPROVE",
    "USER.VIEW","USER.CREATE","USER.EDIT","USER.DISABLE","ROLE.VIEW","ROLE.EDIT","PRIVILEGE.VIEW","PRIVILEGE.EDIT","NAVIGATION.VIEW","NAVIGATION.EDIT",
    "TICKET.VIEW","TICKET.CREATE","TICKET.EDIT","TICKET.ASSIGN","TICKET.RESOLVE",
    "ARCHIVE.VIEW","ARCHIVE.CREATE","ARCHIVE.RETRIEVE","ARCHIVE.RETENTION","ARCHIVE.DELETE"
  ];
  project.security.permissions ||= [];
  defaultPermissions.forEach(p=>{if(!project.security.permissions.includes(p))project.security.permissions.push(p);});
  project.security.moduleAccess ||= {};
  project.modules.forEach(m=>{
    project.security.moduleAccess[m.id] ||= {};
    ["ADMIN","ARCH","DESIGNER","VIEWER"].forEach(r=>{
      if(project.security.moduleAccess[m.id][r]===undefined) project.security.moduleAccess[m.id][r]=r!=="VIEWER";
    });
  });
}
function currentUser(){
  if(typeof localAuthUser!=="undefined" && localAuthUser) return localAuthUser;
  if(typeof useLocalAdminFallback==="function"){
    const u=useLocalAdminFallback();
    if(u)return u;
  }
  return null;
}
async function logout(){
  if(typeof supabaseLogout==="function") await supabaseLogout();
  else location.reload();
}
window.logout=logout;

function setView(view,moduleId=null){
  if(view==='access' && !hasAccess('SECURITY.VIEW')){showToast('You do not have security-center access');return;}
  if(['requirements','screens','erd','project-erd','backend','modules','timeline'].includes(view) && currentUser()?.role==='Viewer' && view==='modules'){/* allowed read-only */}
  if(moduleId && project.security?.moduleAccess){
    const u=currentUser(); const roleKey={Administrator:'ADMIN',Architect:'ARCH',Designer:'DESIGNER',Viewer:'VIEWER'}; const role=roleKey[u?.role]||'VIEWER';
    if(project.security.moduleAccess[moduleId]?.[role]===false){showToast('Your role does not have access to this module');return;}
  }
  state.view=view; if(moduleId!==null) state.moduleId=moduleId;
  if(view!=='screens'){state.screenId=null;state.selectedComponentId=null;}
  if(view!=='timeline')state.timelineFilter=null;
  if(view!=='module-workspace')state.tab='requirements';
  render();
}
function nav(){
  const u=currentUser(); const roleKey={Administrator:'ADMIN',Architect:'ARCH',Designer:'DESIGNER',Viewer:'VIEWER'}; const role=roleKey[u?.role]||'VIEWER';
  const can=(id)=>{
    if(id==='access'||id==='settings') return role==='ADMIN';
    if(['backend','erd','project-erd','screens','requirements','modules','timeline','task-board','architecture','technical','traceability','validation','testing','documentation','references','dashboard'].includes(id)) return true;
    return true;
  };
  const moduleId=state.moduleId;
  $('#sidebarNav').innerHTML=navSections.map(sec=>`<div class="nav-section">${sec.title}</div>${sec.items.filter(([id])=>can(id)).map(([id,icon,label])=>`<button class="nav-item ${state.view===id?'active':''}" data-view="${id}"><span class="nav-icon">${icon}</span><span>${label}</span></button>`).join('')}`).join('');
  $$('.nav-item[data-view]').forEach(b=>b.onclick=()=>setView(b.dataset.view));
  $('#sidebarProjectName').textContent=project.project.name;
}

function renderLogin(){
  document.body.innerHTML=`<div class="login-shell"><div class="login-orb orb-a"></div><div class="login-orb orb-b"></div><div class="login-card">
    <div class="login-brand"><div class="brand-mark">ES</div><div><b>Enterprise System</b><span>Design Studio</span></div></div>
    <div class="login-heading"><span class="eyebrow">SECURE WORKSPACE</span><h1>Sign in to your project</h1><p>Sign in with your IBS account.</p></div>
    <form id="loginForm" class="login-form"><label>Username<input name="username" type="text" autocomplete="username" placeholder="Enter your username" required></label><label>Password<div class="password-wrap"><input id="loginPassword" name="password" type="password" autocomplete="current-password" placeholder="Enter password" required><button type="button" id="togglePassword">Show</button></div></label><div id="loginError" class="login-error"></div><button class="btn primary login-btn">Sign In</button><p class="login-help">Sign in with any active IBS account. The administrator username is configurable by the system owner.</p></form>
    
  </div></div>`;
  $("#loginForm").onsubmit=async e=>{
    e.preventDefault(); const btn=e.currentTarget.querySelector("button.login-btn"); btn.disabled=true;
    $("#loginError").textContent="";
    try{
      const f=new FormData(e.currentTarget);
      await supabaseLogin(String(f.get("username")).trim(),String(f.get("password")));
      location.reload();
    }catch(err){$("#loginError").textContent=String(err.message||err);btn.disabled=false;}
  };
  $("#togglePassword").onclick=()=>{const i=$("#loginPassword");i.type=i.type==="password"?"text":"password";$("#togglePassword").textContent=i.type==="password"?"Show":"Hide";};
}
function hasAccess(permission,moduleId=null){
  const u=currentUser(); if(!u)return false;
  if(u.role==="Administrator")return true;
  const map={Architect:"ARCH",Designer:"DESIGNER",Viewer:"VIEWER"}; const role=map[u.role]||"VIEWER";
  if(moduleId && project.security?.moduleAccess?.[moduleId]?.[role]===false)return false;
  if(u.role==="Viewer")return permission.endsWith(".VIEW") || permission==="PROJECT.VIEW";
  if(u.role==="Architect")return permission!=="SECURITY.EDIT";
  return true;
}
function renderAccess(){
  securityDefaults();
  const u=currentUser();
  const roleKey={Administrator:"ADMIN",Architect:"ARCH",Designer:"DESIGNER",Viewer:"VIEWER"};
  const role=roleKey[u?.role]||"VIEWER";
  const rows=(project.security.users||[]).map(user=>{
    const fixed=user.id==="USR-001";
    return `<tr><td><div class="user-cell"><div class="avatar">${esc((user.displayName||user.username||"?").slice(0,1).toUpperCase())}</div><div><b>${esc(user.displayName||user.username)}</b><small>@${esc(user.username)}</small></div></div></td><td><span class="role-badge">${esc(user.role||"Viewer")}</span></td><td><span class="status-chip ${user.active===false?'warn':'ok'}">${user.active===false?'Disabled':'Active'}</span></td><td>${fixed?'Built-in administrator account.':'Application user; password is managed inside this application.'}</td><td>${fixed?'<span class="muted small-text">Fixed</span>':`<button class="btn secondary btn-sm" data-action="edit-user" data-id="${esc(user.id)}">Edit</button> <button class="btn danger btn-sm" data-action="delete-user" data-id="${esc(user.id)}">Delete</button>`}</td></tr>`;
  }).join('');
  $("#content").innerHTML=`<div class="access-header card"><div><span class="eyebrow">SECURITY CENTER</span><h2>Users & access</h2><p class="muted">Usernames and passwords are managed in the CockroachDB workspace. Create additional users here; no email account is required.</p></div></div><div class="access-tabs"><button class="access-tab active" data-access-tab="users">Users</button><button class="access-tab" data-access-tab="roles">Roles</button><button class="access-tab" data-access-tab="modules">Modules</button><button class="access-tab" data-access-tab="navigation">Navigation</button></div><div id="accessPanel"><div class="card"><div class="card-title"><div><h2>Application users</h2><span class="muted small-text">Usernames and passwords are managed directly in the project.</span></div><button class="btn primary" data-action="new-user" ${role!=="ADMIN"?'disabled':''}>＋ New User</button></div><div class="table-wrap"><table class="data-table"><thead><tr><th>User</th><th>Role</th><th>Status</th><th>Notes</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table></div></div></div>`;
  $$("[data-access-tab]").forEach(b=>b.onclick=()=>switchAccessTab(b.dataset.accessTab));
  bindActions();
}
function switchAccessTab(tab){
  securityDefaults(); const u=currentUser(); const roleKey={Administrator:"ADMIN",Architect:"ARCH",Designer:"DESIGNER",Viewer:"VIEWER"}; const role=roleKey[u?.role]||"VIEWER";
  $$(".access-tab").forEach(x=>x.classList.toggle("active",x.dataset.accessTab===tab)); const p=$("#accessPanel");
  if(tab==='users'){renderAccess();return;}
  if(tab==='roles'){p.innerHTML=`<div class="card-title"><div><h2>Roles & Permissions</h2><span class="muted small-text">Role definitions and permission catalogue.</span></div><button class="btn primary" data-action="new-role">＋ New Role</button></div><div class="role-grid">${project.security.roles.map(r=>`<div class="role-card"><div class="role-icon">${r.id==='ADMIN'?'♛':r.id==='VIEWER'?'◉':'◆'}</div><h3>${esc(r.name)}</h3><p>${esc(r.description)}</p><div class="role-perms">${project.security.permissions.slice(0, r.id==='ADMIN'?project.security.permissions.length:r.id==='VIEWER'?3:10).map(x=>`<span>${esc(x)}</span>`).join('')}</div><button class="btn secondary" data-action="edit-role" data-id="${r.id}">Edit</button></div>`).join('')}</div><div class="permission-catalog"><h3>Permission Catalogue</h3><div class="permission-grid">${permissionCards}</div></div>`;}
  if(tab==='modules'){p.innerHTML=`<div class="card-title"><div><h2>Module Access Matrix</h2><span class="muted small-text">Enable or disable access by role. Administrator can edit this matrix.</span></div></div><div class="table-wrap"><table class="data-table permission-table"><thead><tr><th>Module</th><th>Administrator</th><th>Architect</th><th>Designer</th><th>Viewer</th></tr></thead><tbody>${moduleRows}</tbody></table></div>`; $$("[data-toggle-module]").forEach(b=>b.onclick=()=>{if(role!=="ADMIN")return;const m=b.dataset.toggleModule,r=b.dataset.role;project.security.moduleAccess[m][r]=!project.security.moduleAccess[m][r];saveProject(false);switchAccessTab('modules');});}
  if(tab==='navigation'){p.innerHTML=`<div class="card-title"><div><h2>Navigation Visibility</h2><span class="muted small-text">The menu follows role permissions. Viewers get read-only navigation.</span></div></div><div class="navigation-permission-grid">${navSections.flatMap(s=>s.items).map(([id,icon,label])=>`<div class="nav-perm"><span class="nav-icon">${icon}</span><div><b>${esc(label)}</b><small>${id.toUpperCase()}.VIEW</small></div><span class="status-chip ok">${role==='VIEWER' && ['settings','access'].includes(id)?'Hidden':'Visible'}</span></div>`).join('')}</div>`;}
  bindActions();
}
function userForm(item){item ||= {id:uid("USR"),username:"",displayName:"",role:"Viewer",active:true,password:"",comments:""};return `<div class="form-grid"><div class="field"><label>User ID</label><input name="id" value="${esc(item.id)}" readonly></div><div class="field"><label>Username</label><input name="username" value="${esc(item.username)}" placeholder="e.g. john.smith" ${item.username?"readonly":""}></div><div class="field"><label>Display name</label><input name="displayName" value="${esc(item.displayName)}"></div><div class="field"><label>Role</label><select name="role">${["Administrator","Architect","Designer","Viewer"].map(x=>`<option ${x===item.role?"selected":""}>${x}</option>`).join("")}</select></div><div class="field"><label>${item.username?"New password (optional)":"Password"}</label><input name="password" type="password" value="" autocomplete="new-password" placeholder="Enter password"></div><div class="field"><label>Status</label><select name="active"><option value="true" ${item.active?"selected":""}>Active</option><option value="false" ${!item.active?"selected":""}>Disabled</option></select></div><div class="field full"><label>💬 Comments</label><textarea name="comments">${esc(item.comments||"")}</textarea></div></div>`}
function roleForm(item){item ||= {id:uid('ROLE'),name:'',description:''};return `<div class="form-grid"><div class="field"><label>Role ID</label><input name="id" value="${esc(item.id)}" readonly></div><div class="field"><label>Name</label><input name="name" value="${esc(item.name)}"></div><div class="field full"><label>Description</label><textarea name="description">${esc(item.description||'')}</textarea></div></div>`}

function render(){
  if(!project) return;
  securityDefaults();
  if(!currentUser()){renderLogin();return;}
  normalizeDesignData(); normalizeComments(); nav();
  const titles={dashboard:"Design Studio",timeline:"Timeline / Project Plan",architecture:"Architecture Map",technical:"Technical Architecture",modules:"System Blueprint",requirements:"Business Requirements","module-workspace":"Module Workspace",screens:"Screen Designer",erd:"Module ERD","project-erd":"Full Project ERD",backend:"Backend Logic",tasks:"Tasks & Traceability","task-board":"Task Board",traceability:"Traceability",validation:"Validation",testing:"Testing",documentation:"Documentation",settings:"Settings",access:"Users & Access",audit:"Audit Log",references:"Reference Images"};
  $("#pageTitle").textContent=titles[state.view]||"Design Studio"; $("#breadcrumb").textContent=state.moduleId?`${titles[state.view]} / ${moduleById(state.moduleId)?.name||""}`:titles[state.view];
  const handlers={dashboard:renderDashboard,timeline:renderTimeline,architecture:renderArchitecture,technical:renderTechnicalArchitecture,modules:renderModules,"module-workspace":renderModuleWorkspace,requirements:renderRequirements,screens:renderScreens,erd:renderERD,"project-erd":renderProjectERD,backend:renderBackend,tasks:renderTasks,"task-board":renderTaskBoard,traceability:renderTraceability,validation:renderValidation,testing:renderTesting,documentation:renderDocumentation,settings:renderSettings,access:renderAccess,audit:renderAudit,references:renderReferences};
  (handlers[state.view]||renderDashboard)(); addModulePhaseNav(); addQuickNavCarousel(); bindActions();
  const top=$('.top-actions'); if(top){top.querySelector('.status-pill')?.insertAdjacentHTML('afterend',`<span class="user-pill">👤 ${esc(currentUser().displayName)} · ${esc(currentUser().role)}</span>`);}
}

document.addEventListener("DOMContentLoaded",async()=>{
  try {
    loadProject();
    normalizeProject();
    securityDefaults();
    if(typeof initializeSupabase==="function" && supabaseConfigured()){
      await initializeSupabase();
      if(supabaseSession?.access_token){
        const loaded=await loadSupabaseProject();
      }
    }
    installPersistence(); render();
  } catch(err) { console.error(err); const root=document.getElementById('content'); if(root) root.innerHTML='<div class="card"><h2>Design Studio could not start</h2><p>Please reload the page. If this is hosted on GitHub Pages, make sure the repository Pages source is set to the root of the branch.</p><pre style="white-space:pre-wrap;color:#b42318">'+(err?.stack || err?.message || (typeof err==='string'?err:JSON.stringify(err,null,2)))+'</pre></div>'; }
  const importFile=$("#importFile"); if(importFile) importFile.onchange=e=>{if(e.target.files[0])importProject(e.target.files[0])};
  const menu=$("#mobileMenuBtn"), backdrop=$("#mobileNavBackdrop");
  const closeMobileNav=()=>document.body.classList.remove("mobile-nav-open");
  if(menu) menu.onclick=()=>document.body.classList.toggle("mobile-nav-open");
  if(backdrop) backdrop.onclick=closeMobileNav;
  document.addEventListener("click",e=>{if(e.target.closest(".nav-item")) closeMobileNav();});
});
