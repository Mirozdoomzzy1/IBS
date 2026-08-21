/* BUILD: SUPABASE-SDK-GITHUB-20260821-3 */


/* ============================================================
   SUPABASE VISIBLE DIAGNOSTICS
   ============================================================ */
window.SUPABASE_DIAGNOSTIC = {
  state: "starting",
  message: "Ready — project saving is enabled.",
  revision: null,
  lastSaved: null,
  lastError: null
};

function setSupabaseDiagnostic(state,message,extra={}){
  window.SUPABASE_DIAGNOSTIC = {
    ...window.SUPABASE_DIAGNOSTIC,
    state,
    message,
    ...extra
  };
  document.dispatchEvent(new CustomEvent("supabase-diagnostic",{detail:window.SUPABASE_DIAGNOSTIC}));
  console.log("[SUPABASE]",state,message,extra);
}

async function diagnosticSupabaseTest(){
  setSupabaseDiagnostic("testing","Checking optional cloud sync…");
  try{
    if(typeof supabaseConfigured!=="function" || !supabaseConfigured()){
      throw new Error("Supabase configuration is missing.");
    }
    if(!supabaseSession?.access_token){
      setSupabaseDiagnostic("saved","Supabase is mandatory — project data is never saved to browser storage.",{lastError:null,lastSaved:new Date().toISOString()});
      return true;
    }
    const url = `${SUPABASE_CONFIG.url}/rest/v1/projects?id=eq.${encodeURIComponent(SUPABASE_PROJECT_ID)}&select=id,revision`;
    const response = await fetch(url,{
      method:"GET",
      headers:{
        apikey:SUPABASE_CONFIG.anonKey,
        Accept:"application/json"
      }
    });
    const text=await response.text();
    if(!response.ok) throw new Error(`HTTP ${response.status}: ${text}`);
    let data=[];
    try{data=JSON.parse(text)}catch{}
    setSupabaseDiagnostic("connected",data.length
      ? `Connected ✓ — revision ${data[0].revision}`
      : "Connected ✓ — project row does not exist yet",{
        revision:data[0]?.revision ?? null,
        lastError:null
      });
    return true;
  }catch(e){
    setSupabaseDiagnostic("error","Supabase connection failed",{
      lastError:String(e?.message||e)
    });
    return false;
  }
}
window.diagnosticSupabaseTest=diagnosticSupabaseTest;

function installSupabaseDiagnosticPanel(){
  if(document.getElementById("supabaseDiagnosticPanel")) return;
  const panel=document.createElement("div");
  panel.id="supabaseDiagnosticPanel";
  panel.style.cssText=[
    "position:fixed","right:18px","bottom:18px","z-index:999999",
    "width:330px","padding:14px","border-radius:12px",
    "background:#111827","color:#fff","font:13px Arial",
    "box-shadow:0 8px 30px rgba(0,0,0,.3)"
  ].join(";");
  panel.innerHTML=`
    <div style="font-weight:700;font-size:14px;margin-bottom:8px">💾 Project Save Status</div>
    <div id="supabaseDiagState">Starting…</div>
    <div id="supabaseDiagMessage" style="margin-top:5px;opacity:.85"></div>
    <div id="supabaseDiagRevision" style="margin-top:5px;opacity:.85"></div>
    <div id="supabaseDiagError" style="margin-top:7px;color:#fca5a5;white-space:pre-wrap"></div>
    <div style="display:flex;gap:7px;margin-top:10px">
      <button id="supabaseDiagTest" style="padding:7px 10px;border:0;border-radius:7px;cursor:pointer">Test Supabase</button>
      <button id="supabaseDiagSave" style="padding:7px 10px;border:0;border-radius:7px;cursor:pointer">Force Save</button>
    </div>
  `;
  (document.body || document.documentElement).appendChild(panel);

  panel.querySelector("#supabaseDiagTest").onclick=()=>diagnosticSupabaseTest();
  panel.querySelector("#supabaseDiagSave").onclick=async()=>{
    setSupabaseDiagnostic("saving","Force saving…");
    try{
      if(typeof saveProjectToSupabase!=="function") throw new Error("saveProjectToSupabase() is not available.");
      const ok=await saveProjectToSupabase();
      if(ok) setSupabaseDiagnostic("saved","Saved to Supabase ✓",{
        revision:window.SUPABASE_DIAGNOSTIC.revision,
        lastSaved:new Date().toISOString(),
        lastError:null
      });
    }catch(e){
      setSupabaseDiagnostic("error","Save failed",{
        lastError:String(e?.message||e)
      });
    }
  };

  document.addEventListener("supabase-diagnostic",e=>{
    const d=e.detail||{};
    panel.querySelector("#supabaseDiagState").textContent=
      d.state==="saved"?"✅ SAVED":d.state==="connected"?"🟢 CONNECTED":
      d.state==="saving"?"🟡 SAVING":d.state==="error"?"🔴 ERROR":"🔵 "+String(d.state||"");
    panel.querySelector("#supabaseDiagMessage").textContent=d.message||"";
    panel.querySelector("#supabaseDiagRevision").textContent=
      d.revision!=null?`Revision: ${d.revision}`:"Revision: —";
    panel.querySelector("#supabaseDiagError").textContent=
      d.lastError?`Error: ${d.lastError}`:"";
  });

  const renderCurrent=()=>{
    const d=window.SUPABASE_DIAGNOSTIC||{};
    panel.querySelector("#supabaseDiagState").textContent=d.state==="saved"?"✅ SAVED":d.state==="connected"?"🟢 CONNECTED":d.state==="saving"?"🟡 SAVING":d.state==="error"?"🔴 ERROR":"🔵 "+String(d.state||"");
    panel.querySelector("#supabaseDiagMessage").textContent=d.message||"";
    panel.querySelector("#supabaseDiagRevision").textContent=d.revision!=null?`Revision: ${d.revision}`:"Revision: —";
    panel.querySelector("#supabaseDiagError").textContent=d.lastError?`Error: ${d.lastError}`:"";
  };
  renderCurrent();
  const keepAlive=new MutationObserver(()=>{
    if(!document.getElementById("supabaseDiagnosticPanel")){
      (document.body || document.documentElement).appendChild(panel);
      renderCurrent();
    }
  });
  keepAlive.observe(document.documentElement,{childList:true,subtree:true});
}
if(document.readyState==="loading"){
  document.addEventListener("DOMContentLoaded",installSupabaseDiagnosticPanel);
}else{
  installSupabaseDiagnosticPanel();
}

const DEFAULT_PROJECT = {
  version: 2,
  project: {
    id: "ERP-DESIGN-001",
    name: "Enterprise Management System",
    description: "Business-to-technical design studio for the ERP program",
    owner: "Architecture Team"
  },
  modules: [
    {id:"PERSONNEL", name:"Personnel", icon:"👥", color:"blue", description:"Personnel policies, qualifications, employment history and HR operations."},
    {id:"EMPLOYEE", name:"Employee", icon:"🧑", color:"blue", description:"Employee master profile, employment data, documents, status and lifecycle."},
    {id:"CLIENT", name:"Client", icon:"🏢", color:"green", description:"Client master data, contracts, contacts, services and client lifecycle."},
    {id:"MEDICAL", name:"Medical", icon:"♥", color:"green", description:"Medical records, examinations, leaves, insurance and health workflows."},
    {id:"OPERATION", name:"Operation", icon:"⚙", color:"orange", description:"Operations, assignments, tasks, schedules and service delivery."},
    {id:"PAYROLL", name:"Payroll", icon:"$", color:"green", description:"Payroll periods, salaries, allowances, deductions and payslips."},
    {id:"FINANCE", name:"Finance", icon:"$", color:"orange", description:"Accounts, transactions, payments, invoices and expenses."},
    {id:"LEGAL", name:"Legal", icon:"⚖", color:"red", description:"Contracts, legal cases, documents and compliance."},
    {id:"TRANSFER", name:"Transfer", icon:"⇄", color:"blue", description:"Transfer requests, approvals, movement and history."},
    {id:"COST", name:"Cost", icon:"▣", color:"purple", description:"Cost centers, cost items, allocation and reporting."},
    {id:"GENERAL", name:"General", icon:"▤", color:"cyan", description:"Company settings, master data, holidays and announcements."},
    {id:"USER", name:"User & Access", icon:"🔐", color:"purple", description:"Users, roles, privileges, permissions, navigation, authentication and access control."},
    {id:"TICKETING", name:"Ticketing", icon:"🎫", color:"orange", description:"Tickets, assignments, priorities, comments, SLAs, escalation and resolution."},
    {id:"ARCHIVE", name:"Archive", icon:"🗄", color:"cyan", description:"Archived documents, records, retention, retrieval and audit history."}
  ],
  requirements: [
    {id:"PER-EMP-001", moduleId:"PERSONNEL", title:"Create employee", actor:"HR Officer", priority:"High", status:"Approved", description:"Authorized HR users can create an employee record.", rule:"Employee number must be unique.", acceptance:"Employee is created only when required fields and references are valid."},
    {id:"PER-EMP-002", moduleId:"PERSONNEL", title:"Update employee", actor:"HR Officer", priority:"High", status:"Draft", description:"Authorized HR users can update employee master information.", rule:"Only active employees may be updated.", acceptance:"Changes are audited."}
  ],
  screens: [
    {id:"SCR-PER-001", moduleId:"PERSONNEL", name:"Employee List", type:"List", status:"Draft", description:"Search, filter and open employee records.", components:[
      {id:"c1",type:"search",label:"Search Employee",dataType:"string",required:false},
      {id:"c2",type:"table",label:"Employees",dataType:"table",required:false},
      {id:"c3",type:"button",label:"New Employee",dataType:"action",required:false}
    ]},
    {id:"SCR-PER-002", moduleId:"PERSONNEL", name:"Employee Form", type:"Form", status:"Draft", description:"Create and edit employee master data.", components:[
      {id:"c4",type:"input",label:"Employee Number",dataType:"string",required:true,entity:"EMPLOYEE",field:"EMPLOYEE_NO"},
      {id:"c5",type:"input",label:"First Name",dataType:"string",required:true,entity:"EMPLOYEE",field:"FIRST_NAME"},
      {id:"c6",type:"input",label:"Last Name",dataType:"string",required:true,entity:"EMPLOYEE",field:"LAST_NAME"},
      {id:"c7",type:"select",label:"Department",dataType:"number",required:true,entity:"EMPLOYEE",field:"DEPARTMENT_ID"}
    ]}
  ],
  entities: [
    {id:"EMPLOYEE", name:"EMPLOYEE", moduleId:"PERSONNEL", x:380, y:170, fields:[
      {name:"EMPLOYEE_ID",type:"NUMBER(19)",pk:true,fk:false,nullable:false},
      {name:"EMPLOYEE_NO",type:"VARCHAR2(20)",pk:false,fk:false,nullable:false,unique:true},
      {name:"FIRST_NAME",type:"VARCHAR2(100)",pk:false,fk:false,nullable:false},
      {name:"LAST_NAME",type:"VARCHAR2(100)",pk:false,fk:false,nullable:false},
      {name:"EMAIL",type:"VARCHAR2(150)",pk:false,fk:false,nullable:true},
      {name:"DEPARTMENT_ID",type:"NUMBER(19)",pk:false,fk:true,nullable:false},
      {name:"POSITION_ID",type:"NUMBER(19)",pk:false,fk:true,nullable:false}
    ]},
    {id:"DEPARTMENT", name:"DEPARTMENT", moduleId:"GENERAL", x:60, y:70, fields:[
      {name:"DEPARTMENT_ID",type:"NUMBER(19)",pk:true,fk:false,nullable:false},
      {name:"DEPARTMENT_NAME",type:"VARCHAR2(120)",pk:false,fk:false,nullable:false}
    ]},
    {id:"POSITION", name:"POSITION", moduleId:"GENERAL", x:60, y:360, fields:[
      {name:"POSITION_ID",type:"NUMBER(19)",pk:true,fk:false,nullable:false},
      {name:"DEPARTMENT_ID",type:"NUMBER(19)",pk:false,fk:true,nullable:false},
      {name:"POSITION_NAME",type:"VARCHAR2(120)",pk:false,fk:false,nullable:false}
    ]},
    {id:"CLIENT", name:"CLIENT", moduleId:"GENERAL", x:690, y:170, fields:[
      {name:"CLIENT_ID",type:"NUMBER(19)",pk:true,fk:false,nullable:false},
      {name:"CLIENT_CODE",type:"VARCHAR2(30)",pk:false,fk:false,nullable:false,unique:true},
      {name:"CLIENT_NAME",type:"VARCHAR2(200)",pk:false,fk:false,nullable:false},
      {name:"EMAIL",type:"VARCHAR2(150)",pk:false,fk:false,nullable:true}
    ]}
  ],
  relations: [
    {id:"REL-001",from:"DEPARTMENT",to:"EMPLOYEE",fromField:"DEPARTMENT_ID",toField:"DEPARTMENT_ID",cardinality:"1:N"},
    {id:"REL-002",from:"POSITION",to:"EMPLOYEE",fromField:"POSITION_ID",toField:"POSITION_ID",cardinality:"1:N"}
  ],
  apis: [
    {id:"API-PER-001",moduleId:"PERSONNEL",method:"POST",path:"/api/personnel/employees",name:"Create Employee",permission:"EMPLOYEE.CREATE",status:"Draft",description:"Create an employee after validation and authorization.",inputs:"employeeNo, firstName, lastName, email, departmentId, positionId",rules:"EmployeeNo required and unique; Department active; Position active",logic:"Authenticate → authorize → validate → verify references → insert → audit → return 201."},
    {id:"API-PER-002",moduleId:"PERSONNEL",method:"GET",path:"/api/personnel/employees",name:"List Employees",permission:"EMPLOYEE.VIEW",status:"Draft",description:"Search and paginate employees.",inputs:"q, departmentId, page, pageSize",rules:"User can only access permitted employee scope.",logic:"Authenticate → authorize → query filters → paginate → return 200."}
  ],
  timeline: [],
  logic: [
    {id:"LOGIC-PER-001",moduleId:"PERSONNEL",name:"Create Employee Workflow",trigger:"POST /api/personnel/employees",steps:["Authenticate user","Check EMPLOYEE.CREATE permission","Validate request","Check employee number uniqueness","Check department and position","Insert EMPLOYEE","Write audit log","Return 201 Created"]}
  ],
  settings: {autosave:true, gridSize:24, showHints:true}
};

let project = null;
let saveTimer = null;
let lastSavedAt = null;
let projectFileHandle = null;
let projectFilePathLabel = "Browser storage (local)";

// ===== Supabase cloud database =====
// Paste your Supabase Project URL and the public anon/publishable key here.
// Never put the Supabase service_role/secret key in this file.
const SUPABASE_CONFIG = {
  url: "https://bqrzjbcrekhuzwxjlrjs.supabase.co",
  anonKey: "sb_publishable_WrH75xXW4RIfPBp8X6wriw_TPvCee4J"
};

const SUPABASE_PROJECT_ID = "ERP-DESIGN-001";
const SUPABASE_SESSION_KEY = "ibs_supabase_session";
let supabaseSaveTimer = null;
let supabaseSaveInProgress = false;
let supabaseSavePending = false;
let supabaseLastSavedAt = null;
let supabaseRevision = null;
let supabaseAuthUser = null;
let supabaseSession = null;

function supabaseConfigured(){
  return /^https:\/\/[^\s]+\.supabase\.co$/.test(SUPABASE_CONFIG.url||"") &&
    !!SUPABASE_CONFIG.anonKey &&
    !SUPABASE_CONFIG.anonKey.includes("YOUR_SUPABASE");
}
function supabaseHeaders(extra={}, authenticated=true){
  const headers={
    apikey:SUPABASE_CONFIG.anonKey,
    "Content-Type":"application/json",
    Accept:"application/json",
    ...extra
  };
  // A publishable key is NOT a JWT. Supabase's Data API identifies
  // the anonymous role from the apikey header. Only add Authorization
  // when we actually have a Supabase Auth user JWT.
  if(authenticated && supabaseSession?.access_token){
    headers.Authorization="Bearer "+supabaseSession.access_token;
  }
  return headers;
}
function supabaseApi(path){ return `${SUPABASE_CONFIG.url}${path}`; }
function supabaseErrorMessage(status,body){
  let detail=body;
  try { const j=JSON.parse(body); detail=j.msg||j.message||j.error_description||j.details||j.hint||JSON.stringify(j); } catch(_e){}
  return `Supabase ${status}: ${detail}`;
}
async function supabaseFetch(path, options={}){
  const response=await fetch(supabaseApi(path),{
    ...options,
    headers:supabaseHeaders(options.headers||{}, options.authenticated!==false),
    cache:"no-store"
  });
  const body=await response.text();
  if(!response.ok) throw new Error(supabaseErrorMessage(response.status,body));
  if(!body) return null;
  try{return JSON.parse(body);}catch(_e){return body;}
}
function restoreSupabaseSession(){
  try{
    const raw=localStorage.getItem(SUPABASE_SESSION_KEY);
    if(!raw)return null;
    const session=JSON.parse(raw);
    if(session?.access_token){supabaseSession=session;return session;}
  }catch(_e){}
  return null;
}
function ibsAuthEmail(username){
  const u=String(username||"").trim().toLowerCase();
  return `${u}@ibs.local`;
}
async function supabaseLogin(username,password){
  const normalized=String(username||"").trim().toLowerCase();
  const plainPassword=String(password||"");
  const users=project?.security?.users||[];
  const user=users.find(u=>String(u.username||"").trim().toLowerCase()===normalized);
  if(normalized==="admin") {
    if(plainPassword!=="123") throw new Error("Incorrect password.");
  } else {
    if(!user || user.active===false || String(user.password||"")!==plainPassword) throw new Error("Incorrect username or password.");
  }
  // Deliberately simple application authentication. Supabase Auth is NOT used.
  localAuthUser={id:user?.id||"LOCAL-ADMIN",username:normalized,displayName:user?.displayName||"System Administrator",role:user?.role||"Administrator",active:true};
  localStorage.setItem("ibs_local_admin_session",JSON.stringify(localAuthUser));
  supabaseAuthUser=null;
  supabaseSession=null;
  return localAuthUser;
}
function restoreLocalAuth(){
  try{
    const raw=localStorage.getItem("ibs_local_admin_session");
    if(raw){ localAuthUser=raw==="1"?{id:"LOCAL-ADMIN",username:"admin",displayName:"System Administrator",role:"Administrator",active:true}:JSON.parse(raw); return localAuthUser; }
  }catch(_e){}
  return null;
}
function useLocalAdminFallback(){ return restoreLocalAuth(); }
async function loadSupabaseAuthUser(){ return null; }
async function supabaseUserAdmin(action,payload={}){
  throw new Error("User management uses the project Users & Access data and does not require Supabase Auth.");
}
window.supabaseUserAdmin=supabaseUserAdmin;

async function supabaseLogout(){
  try{
    if(supabaseSession?.access_token){
      await supabaseFetch("/auth/v1/logout",{method:"POST",body:"{}"});
    }
  }catch(_e){}
  supabaseSession=null; supabaseAuthUser=null; supabaseRevision=null;
  localStorage.removeItem(SUPABASE_SESSION_KEY);
  localStorage.removeItem('ibs_local_admin_session');
  location.reload();
}
window.supabaseLogout=supabaseLogout;

async function loadSupabaseProject(){
  if(!supabaseConfigured()) throw new Error("Supabase is required and is not configured.");
  try{
    if(!window.supabase?.createClient) throw new Error("Official Supabase JS client failed to load.");
    if(!window.ibsSupabaseClient){
      window.ibsSupabaseClient=window.supabase.createClient(SUPABASE_CONFIG.url,SUPABASE_CONFIG.anonKey,{
        auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
      });
    }
    const {data:rows,error}=await window.ibsSupabaseClient.from("projects")
      .select("id,revision,updated_at")
      .eq("id",SUPABASE_PROJECT_ID).limit(1);
    if(error) throw error;
    const loaded=await loadRelationalProjectSdk();
    if(!loaded){
      if(rows?.length) throw new Error("Supabase project exists but its relational data could not be loaded.");
      return false;
    }
    normalizeProject();
    supabaseRevision=Number(rows?.[0]?.revision||0);
    projectFilePathLabel="Supabase relational tables";
    supabaseLastSavedAt=rows?.[0]?.updated_at?new Date(rows[0].updated_at):null;
    return true;
  }catch(e){
    console.error("Supabase relational load failed",e);
    if(window.showToast)showToast("☁ Required cloud load failed: "+(e.message||e));
    throw e;
  }
}
const RELATIONAL_TABLES={
  modules:"modules", requirements:"requirements", screens:"screens",
  entities:"entities", relations:"relations", apis:"apis", logic:"logic",
  timeline:"timeline", references:"references"
};
function relQ(v){return encodeURIComponent(String(v??""));}
async function relGet(table,select="*"){return await supabaseFetch(`/rest/v1/${table}?project_id=eq.${relQ(SUPABASE_PROJECT_ID)}&select=${select}`,{method:"GET"});}
async function relReplace(table,rows){
  const existing=await relGet(table,"id");
  const wanted=new Set((rows||[]).map(r=>String(r.id)));
  for(const old of (existing||[])) if(!wanted.has(String(old.id))) await supabaseFetch(`/rest/v1/${table}?project_id=eq.${relQ(SUPABASE_PROJECT_ID)}&id=eq.${relQ(old.id)}`,{method:"DELETE"});
  if(rows?.length) await supabaseFetch(`/rest/v1/${table}?on_conflict=project_id,id`,{method:"POST",headers:{Prefer:"resolution=merge-duplicates,return=minimal"},body:JSON.stringify(rows)});
}
function relRow(base,data,extra={}){return Object.assign({project_id:SUPABASE_PROJECT_ID,id:String(data.id),data:data,updated_at:new Date().toISOString()},extra);}
async function syncRelationalProject(){
  if(!supabaseConfigured()||!project) return;
  const now=new Date().toISOString();
  await relReplace("modules",(project.modules||[]).map(x=>relRow({},x,{name:x.name||null,icon:x.icon||null,color:x.color||null,description:x.description||null,updated_at:now})));
  await relReplace("requirements",(project.requirements||[]).map(x=>relRow({},x,{module_id:x.moduleId||null,title:x.title||null,actor:x.actor||null,priority:x.priority||null,status:x.status||null,updated_at:now})));
  await relReplace("screens",(project.screens||[]).map(x=>relRow({},x,{module_id:x.moduleId||null,name:x.name||null,type:x.type||null,status:x.status||null,description:x.description||null,updated_at:now})));
  const componentRows=(project.screens||[]).flatMap(s=>(s.components||[]).map(c=>({project_id:SUPABASE_PROJECT_ID,screen_id:String(s.id),id:String(c.id),type:c.type||null,label:c.label||null,data:c,updated_at:now})));
  const existingComponents=await supabaseFetch(`/rest/v1/screen_components?project_id=eq.${relQ(SUPABASE_PROJECT_ID)}&select=screen_id,id`,{method:"GET"});
  const wantedComponents=new Set(componentRows.map(x=>x.screen_id+"::"+x.id));
  for(const old of existingComponents||[]) if(!wantedComponents.has(old.screen_id+"::"+old.id)) await supabaseFetch(`/rest/v1/screen_components?project_id=eq.${relQ(SUPABASE_PROJECT_ID)}&screen_id=eq.${relQ(old.screen_id)}&id=eq.${relQ(old.id)}`,{method:"DELETE"});
  if(componentRows.length) await supabaseFetch(`/rest/v1/screen_components?on_conflict=project_id,screen_id,id`,{method:"POST",headers:{Prefer:"resolution=merge-duplicates,return=minimal"},body:JSON.stringify(componentRows)});
  await relReplace("entities",(project.entities||[]).map(x=>relRow({},x,{name:x.name||null,module_id:x.moduleId||null,x:x.x??null,y:x.y??null,updated_at:now})));
  const fieldRows=(project.entities||[]).flatMap(e=>(e.fields||[]).map(f=>({project_id:SUPABASE_PROJECT_ID,entity_id:String(e.id),name:String(f.name),data:f,updated_at:now})));
  const existingFields=await supabaseFetch(`/rest/v1/entity_fields?project_id=eq.${relQ(SUPABASE_PROJECT_ID)}&select=entity_id,name`,{method:"GET"});
  const wantedFields=new Set(fieldRows.map(x=>x.entity_id+"::"+x.name));
  for(const old of existingFields||[]) if(!wantedFields.has(old.entity_id+"::"+old.name)) await supabaseFetch(`/rest/v1/entity_fields?project_id=eq.${relQ(SUPABASE_PROJECT_ID)}&entity_id=eq.${relQ(old.entity_id)}&name=eq.${relQ(old.name)}`,{method:"DELETE"});
  if(fieldRows.length) await supabaseFetch(`/rest/v1/entity_fields?on_conflict=project_id,entity_id,name`,{method:"POST",headers:{Prefer:"resolution=merge-duplicates,return=minimal"},body:JSON.stringify(fieldRows)});
  await relReplace("relations",(project.relations||[]).map(x=>relRow({},x,{from_entity:x.from||null,to_entity:x.to||null,from_field:x.fromField||null,to_field:x.toField||null,cardinality:x.cardinality||null,updated_at:now})));
  await relReplace("apis",(project.apis||[]).map(x=>relRow({},x,{module_id:x.moduleId||null,method:x.method||null,path:x.path||null,name:x.name||null,status:x.status||null,updated_at:now})));
  await relReplace("logic",(project.logic||[]).map(x=>relRow({},x,{module_id:x.moduleId||null,name:x.name||null,trigger:x.trigger||null,updated_at:now})));
  await relReplace("timeline",(project.timeline||[]).map(x=>relRow({},x,{module_id:x.moduleId||null,name:x.name||null,status:x.status||null,start_date:x.start||null,end_date:x.end||null,updated_at:now})));
  await relReplace("references",(project.references||[]).map(x=>relRow({},x,{module_id:x.moduleId||null,screen_id:x.screenId||null,type:x.type||null,title:x.title||null,updated_at:now})));
  await syncSecurityTables(now);
  await supabaseFetch(`/rest/v1/settings?on_conflict=project_id`,{method:"POST",headers:{Prefer:"resolution=merge-duplicates,return=minimal"},body:JSON.stringify({project_id:SUPABASE_PROJECT_ID,data:project.settings||{},updated_at:now})});
}
async function syncSecurityTables(now){
  const sec=project.security||{};
  const simple=async(table,rows,key="id")=>{
    const existing=await supabaseFetch(`/rest/v1/${table}?project_id=eq.${relQ(SUPABASE_PROJECT_ID)}&select=${key}`,{method:"GET"});
    const wanted=new Set((rows||[]).map(x=>String(x[key])));
    for(const old of existing||[]) if(!wanted.has(String(old[key]))) await supabaseFetch(`/rest/v1/${table}?project_id=eq.${relQ(SUPABASE_PROJECT_ID)}&${key}=eq.${relQ(old[key])}`,{method:"DELETE"});
    if(rows?.length) await supabaseFetch(`/rest/v1/${table}?on_conflict=project_id,${key}`,{method:"POST",headers:{Prefer:"resolution=merge-duplicates,return=minimal"},body:JSON.stringify(rows)});
  };
  await simple("users",(sec.users||[]).map(x=>({project_id:SUPABASE_PROJECT_ID,id:String(x.id),username:x.username||null,display_name:x.displayName||null,role:x.role||null,active:x.active!==false,data:x,updated_at:now})));
  await simple("roles",(sec.roles||[]).map(x=>({project_id:SUPABASE_PROJECT_ID,id:String(x.id),name:x.name||null,description:x.description||null,data:x,updated_at:now})));
  await simple("permissions",(sec.permissions||[]).map(x=>({project_id:SUPABASE_PROJECT_ID,permission:String(x),data:{permission:x},updated_at:now})),"permission");
  const access=[]; Object.entries(sec.moduleAccess||{}).forEach(([moduleId,roles])=>Object.entries(roles||{}).forEach(([role,allowed])=>access.push({project_id:SUPABASE_PROJECT_ID,module_id:String(moduleId),role:String(role),allowed:allowed!==false,data:{moduleId,role,allowed},updated_at:now})));
  const oldAccess=await relGet("module_access","module_id,role");
  const accessKeys=new Set(access.map(x=>x.module_id+"::"+x.role));
  for(const old of oldAccess||[]) if(!accessKeys.has(old.module_id+"::"+old.role)) await supabaseFetch(`/rest/v1/module_access?project_id=eq.${relQ(SUPABASE_PROJECT_ID)}&module_id=eq.${relQ(old.module_id)}&role=eq.${relQ(old.role)}`,{method:"DELETE"});
  if(access.length) await supabaseFetch(`/rest/v1/module_access?on_conflict=project_id,module_id,role`,{method:"POST",headers:{Prefer:"resolution=merge-duplicates,return=minimal"},body:JSON.stringify(access)});
}
async function loadRelationalProjectIntoState(){
  const mods=await relGet("modules");
  if(!mods?.length)return false;
  project.modules=mods.map(r=>r.data||{id:r.id,name:r.name,icon:r.icon,color:r.color,description:r.description});
  const req=await relGet("requirements"); project.requirements=(req||[]).map(r=>r.data||{id:r.id,moduleId:r.module_id,title:r.title,actor:r.actor,priority:r.priority,status:r.status});
  const screens=await relGet("screens"); const comps=await relGet("screen_components");
  project.screens=(screens||[]).map(r=>Object.assign({},r.data||{id:r.id,moduleId:r.module_id,name:r.name,type:r.type,status:r.status,description:r.description},{components:(comps||[]).filter(c=>c.screen_id===r.id).map(c=>c.data||{id:c.id,type:c.type,label:c.label})}));
  const ents=await relGet("entities"); const fields=await relGet("entity_fields"); project.entities=(ents||[]).map(r=>Object.assign({},r.data||{id:r.id,name:r.name,moduleId:r.module_id,x:r.x,y:r.y},{fields:(fields||[]).filter(f=>f.entity_id===r.id).map(f=>f.data||{name:f.name})}));
  const map=["relations","apis","logic","timeline","references"]; for(const k of map){const rows=await relGet(RELATIONAL_TABLES[k]); project[k]=(rows||[]).map(r=>r.data||{});}
  const settings=await supabaseFetch(`/rest/v1/settings?project_id=eq.${relQ(SUPABASE_PROJECT_ID)}&select=data&limit=1`,{method:"GET"}); if(settings?.[0]?.data)project.settings=settings[0].data;
  try{
    const users=await relGet("users"), roles=await relGet("roles"), perms=await relGet("permissions"), access=await relGet("module_access");
    if(users.length||roles.length||perms.length||access.length){
      project.security=project.security||{};
      project.security.users=users.map(r=>r.data||{id:r.id,username:r.username,displayName:r.display_name,role:r.role,active:r.active});
      project.security.roles=roles.map(r=>r.data||{id:r.id,name:r.name,description:r.description});
      project.security.permissions=perms.map(r=>r.permission);
      project.security.moduleAccess={};
      access.forEach(r=>{project.security.moduleAccess[r.module_id]??={};project.security.moduleAccess[r.module_id][r.role]=r.allowed;});
    }
  }catch(e){console.warn("Security relational load skipped",e);}
  return true;
}


async function sdkDeleteMissing(table, keyColumns, wantedRows){
  const client=window.ibsSupabaseClient;
  const wanted=new Set((wantedRows||[]).map(row=>keyColumns.map(k=>String(row[k]??"")).join("::")));
  const select=keyColumns.join(",");
  const {data:existing,error:getError}=await client
    .from(table).select(select).eq("project_id",SUPABASE_PROJECT_ID);
  if(getError) throw getError;
  for(const old of (existing||[])){
    const key=keyColumns.map(k=>String(old[k]??"")).join("::");
    if(wanted.has(key)) continue;
    let q=client.from(table).delete().eq("project_id",SUPABASE_PROJECT_ID);
    for(const k of keyColumns){
      if(k==="project_id") continue;
      q=q.eq(k,old[k]);
    }
    const {error}=await q;
    if(error) throw error;
  }
}

async function sdkUpsertTable(table, rows, conflict){
  if(!rows?.length) return;
  const {error}=await window.ibsSupabaseClient
    .from(table)
    .upsert(rows,{onConflict:conflict});
  if(error) throw error;
}

function buildRelationalRows(){
  const now=new Date().toISOString();
  const rows={};
  rows.modules=(project.modules||[]).map(x=>({
    project_id:SUPABASE_PROJECT_ID,id:String(x.id),name:x.name||null,icon:x.icon||null,
    color:x.color||null,description:x.description||null,data:x,updated_at:now
  }));
  rows.requirements=(project.requirements||[]).map(x=>({
    project_id:SUPABASE_PROJECT_ID,id:String(x.id),module_id:x.moduleId||null,
    title:x.title||null,actor:x.actor||null,priority:x.priority||null,status:x.status||null,
    data:x,updated_at:now
  }));
  rows.screens=(project.screens||[]).map(x=>({
    project_id:SUPABASE_PROJECT_ID,id:String(x.id),module_id:x.moduleId||null,
    name:x.name||null,type:x.type||null,status:x.status||null,description:x.description||null,
    data:x,updated_at:now
  }));
  rows.screen_components=(project.screens||[]).flatMap(s=>(s.components||[]).map(c=>({
    project_id:SUPABASE_PROJECT_ID,screen_id:String(s.id),id:String(c.id),
    type:c.type||null,label:c.label||null,data:c,updated_at:now
  })));
  rows.entities=(project.entities||[]).map(x=>({
    project_id:SUPABASE_PROJECT_ID,id:String(x.id),name:x.name||null,module_id:x.moduleId||null,
    x:x.x??null,y:x.y??null,data:x,updated_at:now
  }));
  rows.entity_fields=(project.entities||[]).flatMap(e=>(e.fields||[]).map(f=>({
    project_id:SUPABASE_PROJECT_ID,entity_id:String(e.id),name:String(f.name),
    data:f,updated_at:now
  })));
  rows.relations=(project.relations||[]).map(x=>({
    project_id:SUPABASE_PROJECT_ID,id:String(x.id),from_entity:x.from||null,to_entity:x.to||null,
    from_field:x.fromField||null,to_field:x.toField||null,cardinality:x.cardinality||null,
    data:x,updated_at:now
  }));
  rows.apis=(project.apis||[]).map(x=>({
    project_id:SUPABASE_PROJECT_ID,id:String(x.id),module_id:x.moduleId||null,
    method:x.method||null,path:x.path||null,name:x.name||null,status:x.status||null,data:x,updated_at:now
  }));
  rows.logic=(project.logic||[]).map(x=>({
    project_id:SUPABASE_PROJECT_ID,id:String(x.id),module_id:x.moduleId||null,
    name:x.name||null,trigger:x.trigger||null,data:x,updated_at:now
  }));
  rows.timeline=(project.timeline||[]).map(x=>({
    project_id:SUPABASE_PROJECT_ID,id:String(x.id),module_id:x.moduleId||null,name:x.name||null,
    status:x.status||null,start_date:x.start||null,end_date:x.end||null,data:x,updated_at:now
  }));
  rows.references=(project.references||[]).map(x=>({
    project_id:SUPABASE_PROJECT_ID,id:String(x.id),module_id:x.moduleId||null,screen_id:x.screenId||null,
    type:x.type||null,title:x.title||null,data:x,updated_at:now
  }));
  rows.settings=[{project_id:SUPABASE_PROJECT_ID,data:project.settings||{},updated_at:now}];
  rows.users=(project.security?.users||[]).map(x=>({
    project_id:SUPABASE_PROJECT_ID,id:String(x.id),username:x.username||null,display_name:x.displayName||null,
    role:x.role||null,active:x.active!==false,data:x,updated_at:now
  }));
  rows.roles=(project.security?.roles||[]).map(x=>({
    project_id:SUPABASE_PROJECT_ID,id:String(x.id),name:x.name||null,description:x.description||null,data:x,updated_at:now
  }));
  rows.permissions=(project.security?.permissions||[]).map(p=>({
    project_id:SUPABASE_PROJECT_ID,permission:String(p),data:{permission:String(p)},updated_at:now
  }));
  rows.module_access=[];
  const access=project.security?.moduleAccess||{};
  Object.keys(access).forEach(moduleId=>{
    Object.keys(access[moduleId]||{}).forEach(role=>{
      rows.module_access.push({
        project_id:SUPABASE_PROJECT_ID,module_id:String(moduleId),role:String(role),
        allowed:access[moduleId][role]!==false,
        data:{moduleId,role,allowed:access[moduleId][role]!==false},updated_at:now
      });
    });
  });
  return rows;
}

async function syncRelationalProjectSdk(){
  const client=window.ibsSupabaseClient;
  if(!client) throw new Error("Supabase JS client is not initialized.");
  const rows=buildRelationalRows();

  // Parent first. Keep revision only after every relational table succeeds.
  const nextRevision=Number(supabaseRevision||0)+1;
  const {error:parentError}=await client.from("projects").upsert({
    id:SUPABASE_PROJECT_ID,revision:nextRevision,updated_at:new Date().toISOString()
  },{onConflict:"id"});
  if(parentError) throw new Error("projects table: "+parentError.message);

  const tables=[
    ["screen_components",["screen_id","id"]],
    ["entity_fields",["entity_id","name"]],
    ["modules",["id"]],
    ["requirements",["id"]],
    ["screens",["id"]],
    ["entities",["id"]],
    ["relations",["id"]],
    ["apis",["id"]],
    ["logic",["id"]],
    ["timeline",["id"]],
    ["references",["id"]],
    ["settings",[]],
    ["users",["id"]],
    ["roles",["id"]],
    ["permissions",["permission"]],
    ["module_access",["module_id","role"]]
  ];

  for(const [table,keys] of tables){
    if(keys.length) await sdkDeleteMissing(table,keys,rows[table]||[]);
    else {
      const {error}=await client.from(table).delete().eq("project_id",SUPABASE_PROJECT_ID);
      if(error) throw error;
    }
    const conflict=["project_id",...keys].join(",");
    await sdkUpsertTable(table,rows[table]||[],conflict);
  }
  return nextRevision;
}

async function loadRelationalProjectSdk(){
  const client=window.ibsSupabaseClient;
  if(!client) throw new Error("Supabase JS client is not initialized.");
  const get=async(table,select="*")=>{
    const {data,error}=await client.from(table).select(select).eq("project_id",SUPABASE_PROJECT_ID);
    if(error) throw new Error(table+": "+error.message);
    return data||[];
  };

  const mods=await get("modules");
  if(!mods.length) return false;
  const req=await get("requirements");
  const screens=await get("screens");
  const comps=await get("screen_components");
  const ents=await get("entities");
  const fields=await get("entity_fields");
  const rels=await get("relations");
  const apis=await get("apis");
  const logic=await get("logic");
  const timeline=await get("timeline");
  const refs=await get("references");
  const settings=await get("settings");
  const users=await get("users");
  const roles=await get("roles");
  const perms=await get("permissions");
  const access=await get("module_access");

  project.modules=mods.map(r=>r.data||{id:r.id,name:r.name,icon:r.icon,color:r.color,description:r.description});
  project.requirements=req.map(r=>r.data||{id:r.id,moduleId:r.module_id,title:r.title,actor:r.actor,priority:r.priority,status:r.status});
  project.screens=screens.map(r=>({...r.data||{id:r.id,name:r.name},components:[]}));
  screens.forEach(r=>{const s=project.screens.find(x=>x.id===r.id);if(s)s.components=comps.filter(c=>c.screen_id===r.id).map(c=>c.data||{id:c.id,type:c.type,label:c.label});});
  project.entities=ents.map(r=>({...r.data||{id:r.id,name:r.name},fields:[]}));
  ents.forEach(r=>{const e=project.entities.find(x=>x.id===r.id);if(e)e.fields=fields.filter(f=>f.entity_id===r.id).map(f=>f.data||{name:f.name});});
  project.relations=rels.map(r=>r.data||{id:r.id,from:r.from_entity,to:r.to_entity,fromField:r.from_field,toField:r.to_field,cardinality:r.cardinality});
  project.apis=apis.map(r=>r.data||{id:r.id,moduleId:r.module_id,method:r.method,path:r.path,name:r.name,status:r.status});
  project.logic=logic.map(r=>r.data||{id:r.id,moduleId:r.module_id,name:r.name,trigger:r.trigger});
  project.timeline=timeline.map(r=>r.data||{id:r.id,moduleId:r.module_id,name:r.name,start:r.start_date,end:r.end_date,status:r.status});
  project.references=refs.map(r=>r.data||{id:r.id,moduleId:r.module_id,screenId:r.screen_id,type:r.type,title:r.title});
  if(settings[0]?.data) project.settings=settings[0].data;
  project.security ||= {};
  project.security.users=users.map(r=>r.data||{id:r.id,username:r.username,displayName:r.display_name,role:r.role,active:r.active});
  project.security.roles=roles.map(r=>r.data||{id:r.id,name:r.name,description:r.description});
  project.security.permissions=perms.map(r=>r.data?.permission||r.permission);
  project.security.moduleAccess={};
  access.forEach(r=>{
    project.security.moduleAccess[r.module_id] ||= {};
    project.security.moduleAccess[r.module_id][r.role]=r.allowed!==false;
  });
  return true;
}

async function saveProjectToSupabase(){
  if(!supabaseConfigured()){
    if(window.showToast)showToast("☁ Supabase is not configured.");
    return false;
  }
  if(!project)return false;
  if(supabaseSaveInProgress){supabaseSavePending=true;return false;}

  supabaseSaveInProgress=true;
  supabaseSavePending=false;
  setSupabaseDiagnostic("saving","Saving all project data to Supabase…");

  try{
    if(!window.supabase?.createClient) throw new Error("Official Supabase JS client failed to load.");
    if(!window.ibsSupabaseClient){
      window.ibsSupabaseClient=window.supabase.createClient(SUPABASE_CONFIG.url,SUPABASE_CONFIG.anonKey,{
        auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
      });
    }

    let revision;
    try{
      revision=await syncRelationalProjectSdk();
      supabaseRevision=revision;
      setSupabaseDiagnostic("saved","Saved all relational tables ✓",{
        revision, lastSaved:new Date().toISOString(), lastError:null,
        relationalSaved:true,saveMethod:"supabase-js direct relational tables"
      });
    }catch(directError){
      console.warn("Direct relational SDK save failed; trying transactional RPC.",directError);
      const {data,error}=await window.ibsSupabaseClient.rpc("save_ibs_project_relational",{p_project:project});
      if(error) throw new Error("Direct relational save failed: "+directError.message+" | RPC save failed: "+error.message);
      const row=Array.isArray(data)?data[0]:data;
      if(!row?.ok) throw new Error("Supabase RPC returned an invalid result.");
      revision=Number(row.revision||0);
      supabaseRevision=revision;
      setSupabaseDiagnostic("saved","Saved with Supabase transaction ✓",{
        revision,lastSaved:new Date().toISOString(),lastError:null,
        relationalSaved:true,saveMethod:"supabase-js rpc"
      });
    }

    supabaseLastSavedAt=new Date();
    projectFilePathLabel="Supabase relational tables";
    if(window.showToast)showToast(`☁ Saved to Supabase ✓ (revision ${supabaseRevision})`);
    return true;
  }catch(e){
    setSupabaseDiagnostic("error","SUPABASE SAVE ERROR — data was NOT confirmed saved",{
      lastError:String(e?.message||e),saveMethod:"supabase-js"
    });
    console.error("SUPABASE SAVE ERROR",e);
    if(window.showToast)showToast("☁ SAVE FAILED: "+(e?.message||e));
    return false;
  }finally{
    supabaseSaveInProgress=false;
    if(supabaseSavePending){supabaseSavePending=false;scheduleSupabaseSave();}
  }
}
function scheduleSupabaseSave(){
  if(!supabaseConfigured()||!project)return;
  supabaseSavePending=true;
  clearTimeout(supabaseSaveTimer);
  supabaseSaveTimer=setTimeout(()=>{supabaseSavePending=false;saveProjectToSupabase();},500);
}
function supabaseStatus(){
  if(supabaseSaveInProgress)return "Saving…";
  return supabaseLastSavedAt ? `Everything saved to Supabase · ${supabaseLastSavedAt.toLocaleTimeString()}` : "Not saved yet";
}
async function testSupabaseConnection(){
  if(!supabaseConfigured()){if(window.showToast)showToast("Configure Supabase URL and key first.");return false;}
  try{
    const rows=await supabaseFetch(`/rest/v1/projects?id=eq.${encodeURIComponent(SUPABASE_PROJECT_ID)}&select=id,revision,updated_at`,{method:"GET"});
    if(window.showToast)showToast(rows?.length?`Supabase OK ✓ · revision ${rows[0].revision}`:"Supabase OK ✓ · project row not created yet");
    return true;
  }catch(e){console.error(e);if(window.showToast)showToast("Supabase test failed: "+(e.message||e));return false;}
}
async function initializeSupabase(){
  if(!supabaseConfigured())return false;
  restoreLocalAuth();
  return true;
}

window.testSupabaseConnection=testSupabaseConnection;
window.getSupabaseStatus=()=>({
  configured:supabaseConfigured(),
  revision:supabaseRevision,
  lastSaved:supabaseLastSavedAt?.toISOString()||null,
  projectId:SUPABASE_PROJECT_ID
});

function clone(v){ return JSON.parse(JSON.stringify(v)); }
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


async function loadWebsiteProject(){
  try {
    const response=await fetch("./data/project.json",{cache:"no-store"});
    if(!response.ok)return false;
    const data=await response.json();
    project=data; normalizeProject(); saveProject(false); return true;
  } catch(e){ console.warn("Website project JSON not loaded",e); return false; }
}
function loadProject(){
  // Project data is cloud-only. Defaults exist only in memory until the Supabase project is loaded/created.
  project = clone(DEFAULT_PROJECT);
  normalizeProject();
}

function seedDefaultScreens(){
  const screenTemplates={
    PERSONNEL:[['Employee List','List','Search, filter and open employee records.'],['Employee Form','Form','Create and edit employee master data.'],['Employee Details','Details','View employee profile, history and linked records.'],['Employee Documents','Details','Manage employee documents and attachments.']],
    MEDICAL:[['Medical Dashboard','Dashboard','Overview of medical workload and alerts.'],['Medical Record','Form','Create and update medical record information.'],['Medical Examination','Form','Record examination results and recommendations.'],['Medical Leave','Approval','Create and approve medical leave requests.']],
    OPERATION:[['Operations Dashboard','Dashboard','Operational KPIs, tasks and assignments.'],['Assignment List','List','Search and manage operational assignments.'],['Assignment Form','Form','Create or update an operational assignment.'],['Task Details','Details','Track task status, owner and history.']],
    PAYROLL:[['Payroll Dashboard','Dashboard','Payroll period status, totals and exceptions.'],['Payroll Period','Form','Open and manage a payroll period.'],['Employee Payroll','Form','Review employee earnings and deductions.'],['Payslip','Report','View and print employee payslip details.']],
    FINANCE:[['Finance Dashboard','Dashboard','Financial overview, balances and pending work.'],['Invoice List','List','Search and manage invoices.'],['Payment Form','Form','Create and authorize a payment.'],['Expense Details','Details','Review expense allocation and approval history.']],
    LEGAL:[['Legal Dashboard','Dashboard','Cases, contracts and compliance alerts.'],['Contract List','List','Search and manage legal contracts.'],['Contract Form','Form','Create and update contract information.'],['Legal Case','Details','Track legal case details and activities.']],
    TRANSFER:[['Transfer Dashboard','Dashboard','Pending, approved and completed transfers.'],['Transfer Request','Form','Create an employee/client transfer request.'],['Transfer Approval','Approval','Review and approve transfer requests.'],['Transfer History','List','Search historical transfers and movements.']],
    COST:[['Cost Dashboard','Dashboard','Cost center and allocation overview.'],['Cost Center List','List','Manage cost centers and owners.'],['Cost Allocation','Form','Allocate costs to entities and activities.'],['Cost Report','Report','Analyze costs by module, center and period.']],
    GENERAL:[['General Dashboard','Dashboard','Global master data and configuration overview.'],['Master Data','List','Manage shared reference and configuration data.'],['Holiday Calendar','List','Manage holidays and shared calendar rules.'],['Announcements','List','Manage organization-wide announcements.']],
    EMPLOYEE:[['Employee Dashboard','Dashboard','Employee lifecycle overview, alerts and pending actions.'],['Employee Profile','Form','Create and maintain the employee master profile.'],['Employee Documents','Details','Manage employee documents, contracts and attachments.'],['Employee Status','Approval','Track employee status and lifecycle transitions.']],
    CLIENT:[['Client Dashboard','Dashboard','Client portfolio, contracts, services and alerts.'],['Client List','List','Search and manage client master records.'],['Client Profile','Form','Create and maintain client information and contacts.'],['Client Contracts','Details','Manage client contracts, SLAs and service terms.']],
    USER:[['User Directory','List','Search and manage application users.'],['User Profile','Form','Create users and assign roles and account settings.'],['Roles & Privileges','Details','Define roles, privileges and permission bundles.'],['Navigation Access','Details','Configure navigation visibility and page access by role.']],
    TICKETING:[['Ticket Dashboard','Dashboard','Ticket workload, SLA status, escalations and trends.'],['Ticket List','List','Search, filter and manage tickets.'],['Ticket Details','Details','Work a ticket, assign ownership and record comments.'],['Ticket Queue','List','Manage queues, priorities, assignments and SLA exceptions.']],
    ARCHIVE:[['Archive Dashboard','Dashboard','Archived records, retention status and retrieval activity.'],['Archive Search','List','Search archived documents and records.'],['Archive Document','Details','View metadata, versions, retention and audit history.'],['Archive Rules','Form','Define retention, archival and retrieval policies.']]
  };
  const existing=new Set(project.screens.map(s=>s.moduleId+'|'+s.name));
  Object.entries(screenTemplates).forEach(([moduleId,list])=>list.forEach((x,i)=>{
    const key=moduleId+'|'+x[0]; if(existing.has(key))return;
    project.screens.push({id:'SCR-'+moduleId.slice(0,4)+'-'+String(i+1).padStart(3,'0'),moduleId,name:x[0],type:x[1],status:'Draft',description:x[2],comments:'',components:defaultComponentsForScreen(x[1],moduleId,i)});
  }));
}
function defaultComponentsForScreen(type,moduleId,i){
  if(type==='List')return [
    {id:uid('CMP'),type:'text',label:'Search',dataType:'string',required:false,placeholder:'Search...',entityField:'',apiField:'q',comments:''},
    {id:uid('CMP'),type:'select',label:'Status',dataType:'string',required:false,entityField:'',apiField:'status',comments:''},
    {id:uid('CMP'),type:'table',label:'Records',dataType:'table',required:false,entityField:'',apiField:'',comments:'List data should support pagination and filtering.'},
    {id:uid('CMP'),type:'button',label:'New',dataType:'action',required:false,entityField:'',apiField:'',comments:''}
  ];
  if(type==='Dashboard')return [
    {id:uid('CMP'),type:'heading',label:'Overview',comments:''},{id:uid('CMP'),type:'badge',label:'Status',comments:''},{id:uid('CMP'),type:'table',label:'Recent Activity',dataType:'table',comments:''},{id:uid('CMP'),type:'tabs',label:'Details',comments:''}
  ];
  if(type==='Approval')return [
    {id:uid('CMP'),type:'badge',label:'Request Status',comments:''},{id:uid('CMP'),type:'textarea',label:'Review Notes',required:true,comments:''},{id:uid('CMP'),type:'button',label:'Approve',dataType:'action',comments:''},{id:uid('CMP'),type:'button',label:'Reject',dataType:'action',comments:''}
  ];
  if(type==='Report')return [
    {id:uid('CMP'),type:'date',label:'From Date',comments:''},{id:uid('CMP'),type:'date',label:'To Date',comments:''},{id:uid('CMP'),type:'button',label:'Run Report',dataType:'action',comments:''},{id:uid('CMP'),type:'table',label:'Results',dataType:'table',comments:''}
  ];
  if(type==='Details')return [
    {id:uid('CMP'),type:'heading',label:'Information',comments:''},{id:uid('CMP'),type:'text',label:'Reference Number',required:true,comments:''},{id:uid('CMP'),type:'badge',label:'Status',comments:''},{id:uid('CMP'),type:'textarea',label:'Notes',comments:''},{id:uid('CMP'),type:'tabs',label:'History',comments:''}
  ];
  return [
    {id:uid('CMP'),type:'text',label:'Reference Number',required:true,comments:''},{id:uid('CMP'),type:'text',label:'Name',required:true,comments:''},{id:uid('CMP'),type:'select',label:'Status',required:true,comments:''},{id:uid('CMP'),type:'date',label:'Effective Date',required:true,comments:''},{id:uid('CMP'),type:'textarea',label:'Notes',comments:''},{id:uid('CMP'),type:'button',label:'Save',dataType:'action',comments:''}
  ];
}
function seedTimeline(force=false){
  if(project.timeline?.length && !force)return;
  const start=new Date(); start.setDate(start.getDate()+7); const base=new Date(start); base.setDate(base.getDate()-((base.getDay()+6)%7));
  const tasks=[]; let n=1;
  const add=(name,moduleId,layer,phase,offset,duration,status='Planned',priority='Medium',short='')=>{
    const st=addDays(base,offset),en=addDays(st,duration-1);tasks.push({id:'PLAN-'+String(n++).padStart(3,'0'),name,moduleId,layer,phase,start:isoDate(st),end:isoDate(en),status,priority,owner:'',dependencies:'',short,comments:''});
  };
  add('Architecture standards + security foundation',null,'Foundation','Foundation',0,10,'Planned','Critical','Security');
  add('Identity, roles, permissions & audit model',null,'Foundation','Foundation',10,10,'Planned','Critical','Security');
  const mods=project.modules.map(m=>m.id);
  // Two-week sprint starts allow module teams to work in parallel while keeping the plan readable.
  mods.forEach((m,i)=>{const off=20+i*10; const name=moduleById(m)?.name||m;
    add(name+' — Business requirements',m,'Requirements','Module Delivery',off,5,'Planned','High','Requirements');
    add(name+' — Screen design',m,'Screens','Module Delivery',off+5,7,'Planned','High','Screens');
    add(name+' — Oracle ERD',m,'ERD','Module Delivery',off+12,5,'Planned','High','ERD');
    add(name+' — TypeScript API & logic',m,'Backend','Module Delivery',off+17,10,'Planned','High','API');
    add(name+' — Integration / UAT',m,'UAT','Integration & UAT',off+27,5,'Planned','Medium','UAT');
  });
  const endOffset=20+mods.length*10+32;
  add('Cross-module integration testing',null,'UAT','Integration & UAT',endOffset,10,'Planned','Critical','Integration');
  add('Security review + performance testing',null,'UAT','Integration & UAT',endOffset+10,5,'Planned','Critical','Security');
  add('Oracle migration rehearsal + deployment',null,'UAT','Go-Live',endOffset+15,5,'Planned','Critical','Deploy');
  add('Production go-live + hypercare',null,'UAT','Go-Live',endOffset+20,10,'Planned','Critical','Go-Live');
  project.timeline=tasks;
}

function ensureRequiredModules(){
  const required = [
    {id:"PERSONNEL", name:"Personnel", icon:"👥", color:"blue", description:"Personnel policies, qualifications, employment history and HR operations."},
    {id:"EMPLOYEE", name:"Employee", icon:"🧑", color:"blue", description:"Employee master profile, employment data, documents, status and lifecycle."},
    {id:"CLIENT", name:"Client", icon:"🏢", color:"green", description:"Client master data, contracts, contacts, services and client lifecycle."},
    {id:"MEDICAL", name:"Medical", icon:"♥", color:"green", description:"Medical records, examinations, leaves, insurance and health workflows."},
    {id:"OPERATION", name:"Operation", icon:"⚙", color:"orange", description:"Operations, assignments, tasks, schedules and service delivery."},
    {id:"PAYROLL", name:"Payroll", icon:"$", color:"green", description:"Payroll periods, salaries, allowances, deductions and payslips."},
    {id:"FINANCE", name:"Finance", icon:"$", color:"orange", description:"Accounts, transactions, payments, invoices and expenses."},
    {id:"LEGAL", name:"Legal", icon:"⚖", color:"red", description:"Contracts, legal cases, documents and compliance."},
    {id:"TRANSFER", name:"Transfer", icon:"⇄", color:"blue", description:"Transfer requests, approvals, movement and history."},
    {id:"COST", name:"Cost", icon:"▣", color:"purple", description:"Cost centers, cost items, allocation and reporting."},
    {id:"GENERAL", name:"General", icon:"▤", color:"cyan", description:"Company settings, master data, holidays and announcements."},
    {id:"USER", name:"User & Access", icon:"🔐", color:"purple", description:"Users, roles, privileges, permissions, navigation, authentication and access control."},
    {id:"TICKETING", name:"Ticketing", icon:"🎫", color:"orange", description:"Tickets, assignments, priorities, comments, SLAs, escalation and resolution."},
    {id:"ARCHIVE", name:"Archive", icon:"🗄", color:"cyan", description:"Archived documents, records, retention, retrieval and audit history."}
  ];
  const byId = new Map((project.modules||[]).map(m=>[m.id,m]));
  required.forEach(m=>{ if(!byId.has(m.id)) project.modules.push(m); else Object.assign(byId.get(m.id),m); });
  // Keep the canonical 14-module order even for projects migrated from older versions.
  const order = required.map(m=>m.id);
  project.modules.sort((a,b)=>order.indexOf(a.id)-order.indexOf(b.id));
}

function seedNewModuleArtifacts(){
  const addReq=(id,moduleId,title,actor,description,rule,acceptance)=>{
    if(project.requirements.some(x=>x.id===id))return;
    project.requirements.push({id,moduleId,title,actor,priority:"High",status:"Draft",description,rule,acceptance,comments:""});
  };
  addReq("EMP-001","EMPLOYEE","Maintain employee master profile","HR Officer","Create and maintain the employee record and employment information.","Employee number must be unique.","Authorized HR user can save a valid employee profile and every change is audited.");
  addReq("CLI-001","CLIENT","Maintain client master record","Client Manager","Create and maintain client details, contacts and service information.","Client code must be unique.","Authorized user can create and update a client with required contact information.");
  addReq("USR-001","USER","Manage users and privileges","System Administrator","Create users and assign roles, privileges and permissions.","Only authorized administrators can change access assignments.","User access changes are audited and effective immediately after save.");
  addReq("TKT-001","TICKETING","Create and assign tickets","Support Agent","Create tickets, assign ownership and track status through resolution.","Every open ticket must have a queue and priority.","Ticket creation produces an audit entry and an assignment event.");
  addReq("ARC-001","ARCHIVE","Archive and retrieve records","Records Officer","Archive documents and records according to retention policies.","Archived records cannot be physically deleted without elevated authorization.","Authorized users can search and retrieve retained records with a complete audit trail.");

  const addEntity=(entity)=>{ if(!project.entities.some(x=>x.id===entity.id)) project.entities.push(entity); };
  addEntity({id:"EMPLOYEE_PROFILE",name:"EMPLOYEE_PROFILE",moduleId:"EMPLOYEE",x:80,y:120,fields:[{name:"EMPLOYEE_ID",type:"NUMBER(19)",pk:true,fk:false,nullable:false},{name:"EMPLOYEE_NO",type:"VARCHAR2(30)",pk:false,fk:false,nullable:false,unique:true},{name:"FULL_NAME",type:"VARCHAR2(200)",pk:false,fk:false,nullable:false},{name:"CLIENT_ID",type:"NUMBER(19)",pk:false,fk:true,nullable:true},{name:"STATUS",type:"VARCHAR2(30)",pk:false,fk:false,nullable:false},{name:"HIRE_DATE",type:"DATE",pk:false,fk:false,nullable:true}]});
  addEntity({id:"CLIENT_MASTER",name:"CLIENT_MASTER",moduleId:"CLIENT",x:420,y:120,fields:[{name:"CLIENT_ID",type:"NUMBER(19)",pk:true,fk:false,nullable:false},{name:"CLIENT_CODE",type:"VARCHAR2(30)",pk:false,fk:false,nullable:false,unique:true},{name:"CLIENT_NAME",type:"VARCHAR2(200)",pk:false,fk:false,nullable:false},{name:"INDUSTRY",type:"VARCHAR2(100)",pk:false,fk:false,nullable:true},{name:"STATUS",type:"VARCHAR2(30)",pk:false,fk:false,nullable:false}]});
  addEntity({id:"APP_USER",name:"APP_USER",moduleId:"USER",x:760,y:120,fields:[{name:"USER_ID",type:"NUMBER(19)",pk:true,fk:false,nullable:false},{name:"USERNAME",type:"VARCHAR2(100)",pk:false,fk:false,nullable:false,unique:true},{name:"EMAIL",type:"VARCHAR2(150)",pk:false,fk:false,nullable:false},{name:"ACTIVE_YN",type:"CHAR(1)",pk:false,fk:false,nullable:false}]});
  addEntity({id:"APP_ROLE",name:"APP_ROLE",moduleId:"USER",x:760,y:360,fields:[{name:"ROLE_ID",type:"NUMBER(19)",pk:true,fk:false,nullable:false},{name:"ROLE_NAME",type:"VARCHAR2(100)",pk:false,fk:false,nullable:false,unique:true}]});
  addEntity({id:"APP_PERMISSION",name:"APP_PERMISSION",moduleId:"USER",x:1020,y:360,fields:[{name:"PERMISSION_ID",type:"NUMBER(19)",pk:true,fk:false,nullable:false},{name:"PERMISSION_CODE",type:"VARCHAR2(150)",pk:false,fk:false,nullable:false,unique:true},{name:"DESCRIPTION",type:"VARCHAR2(300)",pk:false,fk:false,nullable:true}]});
  addEntity({id:"TICKET",name:"TICKET",moduleId:"TICKETING",x:420,y:430,fields:[{name:"TICKET_ID",type:"NUMBER(19)",pk:true,fk:false,nullable:false},{name:"CLIENT_ID",type:"NUMBER(19)",pk:false,fk:true,nullable:true},{name:"ASSIGNED_TO",type:"NUMBER(19)",pk:false,fk:true,nullable:true},{name:"TITLE",type:"VARCHAR2(250)",pk:false,fk:false,nullable:false},{name:"STATUS",type:"VARCHAR2(30)",pk:false,fk:false,nullable:false},{name:"PRIORITY",type:"VARCHAR2(20)",pk:false,fk:false,nullable:false}]});
  addEntity({id:"TICKET_COMMENT",name:"TICKET_COMMENT",moduleId:"TICKETING",x:760,y:590,fields:[{name:"COMMENT_ID",type:"NUMBER(19)",pk:true,fk:false,nullable:false},{name:"TICKET_ID",type:"NUMBER(19)",pk:false,fk:true,nullable:false},{name:"USER_ID",type:"NUMBER(19)",pk:false,fk:true,nullable:false},{name:"COMMENT_TEXT",type:"CLOB",pk:false,fk:false,nullable:false}]});
  addEntity({id:"ARCHIVE_DOCUMENT",name:"ARCHIVE_DOCUMENT",moduleId:"ARCHIVE",x:1060,y:590,fields:[{name:"ARCHIVE_ID",type:"NUMBER(19)",pk:true,fk:false,nullable:false},{name:"SOURCE_TYPE",type:"VARCHAR2(50)",pk:false,fk:false,nullable:false},{name:"SOURCE_ID",type:"VARCHAR2(100)",pk:false,fk:false,nullable:false},{name:"FILE_NAME",type:"VARCHAR2(255)",pk:false,fk:false,nullable:false},{name:"FILE_PATH",type:"VARCHAR2(500)",pk:false,fk:false,nullable:false},{name:"RETAIN_UNTIL",type:"DATE",pk:false,fk:false,nullable:true}]});
  const addRel=(id,from,to,fromField,toField)=>{if(!project.relations.some(x=>x.id===id))project.relations.push({id,from,to,fromField,toField,cardinality:"1:N"});};
  addRel("REL-EMP-CLIENT","CLIENT_MASTER","EMPLOYEE_PROFILE","CLIENT_ID","CLIENT_ID");
  addRel("REL-USER-ROLE","APP_ROLE","APP_USER","ROLE_ID","USER_ID");
  addRel("REL-TICKET-CLIENT","CLIENT_MASTER","TICKET","CLIENT_ID","CLIENT_ID");
  addRel("REL-TICKET-USER","APP_USER","TICKET","USER_ID","ASSIGNED_TO");
  addRel("REL-COMMENT-TICKET","TICKET","TICKET_COMMENT","TICKET_ID","TICKET_ID");
  addRel("REL-COMMENT-USER","APP_USER","TICKET_COMMENT","USER_ID","USER_ID");

  const addApi=(x)=>{if(!project.apis.some(a=>a.id===x.id))project.apis.push(x);};
  addApi({id:"API-EMP-001",moduleId:"EMPLOYEE",method:"POST",path:"/api/employees",name:"Create Employee",permission:"EMPLOYEE.CREATE",status:"Draft",description:"Create an employee after authorization and validation.",inputs:"employeeNo, fullName, clientId, status, hireDate",rules:"Unique employee number; permitted client scope.",logic:"Authenticate → authorize → validate → persist → audit."});
  addApi({id:"API-CLI-001",moduleId:"CLIENT",method:"POST",path:"/api/clients",name:"Create Client",permission:"CLIENT.CREATE",status:"Draft",description:"Create a client master record.",inputs:"clientCode, clientName, industry, status",rules:"Unique client code.",logic:"Authenticate → authorize → validate → persist → audit."});
  addApi({id:"API-USR-001",moduleId:"USER",method:"PATCH",path:"/api/users/{id}/access",name:"Update User Access",permission:"SECURITY.EDIT",status:"Draft",description:"Assign roles and permissions to a user.",inputs:"userId, roles, permissions, navigation",rules:"Administrator privilege required.",logic:"Authenticate → authorize → validate access bundle → persist → audit."});
  addApi({id:"API-TKT-001",moduleId:"TICKETING",method:"POST",path:"/api/tickets",name:"Create Ticket",permission:"TICKET.CREATE",status:"Draft",description:"Create and route a ticket.",inputs:"title, description, clientId, priority, assignedTo",rules:"Queue and priority are required.",logic:"Validate → create ticket → assign → notify → audit."});
  addApi({id:"API-ARC-001",moduleId:"ARCHIVE",method:"POST",path:"/api/archive",name:"Archive Document",permission:"ARCHIVE.CREATE",status:"Draft",description:"Archive a document with retention metadata.",inputs:"sourceType, sourceId, fileName, filePath, retainUntil",rules:"Retention policy must be satisfied.",logic:"Validate → archive → index → audit."});
}

function normalizeProject(){
  project.modules ||= [];
  ensureRequiredModules();
  project.requirements ||= [];
  seedNewModuleArtifacts();
  project.screens ||= [];
  project.entities ||= [];
  project.relations ||= [];
  project.apis ||= [];
  project.logic ||= [];
  project.timeline ||= [];
  project.settings ||= {};
  project.project.comments ||= "";
  ["modules","requirements","screens","entities","relations","apis","logic","timeline"].forEach(k=>(project[k]||[]).forEach(x=>x.comments ||= ""));
  seedDefaultScreens();
  seedTimeline(false);
}

function saveProject(show=true){
  try {
    // Persist the COMPLETE project atomically. Screens, components, ERD tables/fields/relations,
    // APIs, business logic, requirements, timeline, references and security all live in this object.
    normalizeProject();
    const payload = JSON.stringify(project, null, 2);
    lastSavedAt = new Date();
    if(projectFileHandle) writeProjectFile(payload, false);
    if(!supabaseConfigured()) throw new Error("Supabase is mandatory. Configure Supabase before editing project data.");
    saveProjectToSupabase().catch(e=>console.error("Required Supabase save failed",e));
    if(show && window.showToast) showToast("☁ Saving directly to Supabase…");
    return true;
  } catch(e) {
    console.error("Project save failed", e);
    if(show && window.showToast) showToast("Save failed: browser storage is full. Export a JSON backup.");
    return false;
  }
}
async function writeProjectFile(payload, notify=true){
  if(!projectFileHandle) return false;
  try {
    const writable=await projectFileHandle.createWritable();
    await writable.write(payload);
    await writable.close();
    projectFilePathLabel=projectFileHandle.name || "Project JSON file";
    if(notify && window.showToast) showToast("Project JSON file updated");
    return true;
  } catch(e) {
    console.warn("Could not write project file",e);
    projectFileHandle=null;
    projectFilePathLabel="Browser storage (local)";
    if(notify && window.showToast) showToast("Could not update the JSON file; use Download JSON");
    return false;
  }
}
async function connectProjectFile(){
  if(!window.showOpenFilePicker){
    if(window.showToast)showToast("Direct file saving is not supported by this browser; use Download JSON");
    return false;
  }
  try {
    const [handle]=await window.showOpenFilePicker({multiple:false,types:[{description:"Project JSON",accept:{"application/json":[".json"]}}]});
    projectFileHandle=handle;
    const file=await handle.getFile();
    const text=await file.text();
    if(text.trim()){ project=JSON.parse(text); normalizeProject(); }
    projectFilePathLabel=handle.name || "Project JSON file";
    saveProject(false);
    if(window.showToast)showToast("Connected to "+projectFilePathLabel);
    if(window.render)window.render();
    return true;
  } catch(e) {
    if(e?.name!=="AbortError") { console.error(e); if(window.showToast)showToast("Could not connect the JSON file"); }
    return false;
  }
}
function projectFileStatus(){ return projectFilePathLabel; }
function scheduleSave(){
  if(project?.settings?.autosave===false) return;
  clearTimeout(saveTimer);
  saveTimer=setTimeout(()=>saveProject(false), 300);
}
function installPersistence(){
  window.addEventListener('beforeunload',()=>saveProject(false));
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')saveProject(false);});
  setInterval(()=>{if(project?.settings?.autosave!==false)saveProject(false);}, 5000);
}
function projectFileName(ext){
  return (project?.project?.name || "system-design").replace(/[^a-z0-9]+/gi,"-").replace(/^-|-$/g,"").toLowerCase()+ext;
}
function downloadTextProject(){
  const lines=[];
  lines.push(project.project.name, "=".repeat(project.project.name.length), "");
  lines.push("Project: "+(project.project.description||""), "Owner: "+(project.project.owner||""), "");
  lines.push("MODULES"); project.modules.forEach(m=>lines.push(`- ${m.id}: ${m.name} — ${m.description||""}`)); lines.push("");
  lines.push("REQUIREMENTS"); project.requirements.forEach(r=>lines.push(`[${r.id}] ${r.title} | ${moduleById(r.moduleId)?.name||r.moduleId} | ${r.status} | ${r.actor||""}\n  ${r.description||""}\n  Rule: ${r.rule||""}\n  Acceptance: ${r.acceptance||""}`)); lines.push("");
  lines.push("SCREENS"); project.screens.forEach(s=>lines.push(`[${s.id}] ${s.name} | ${moduleById(s.moduleId)?.name||s.moduleId} | ${s.status}\n  ${s.description||""}\n  Components: ${(s.components||[]).map(c=>c.label||c.type).join(", ")}`)); lines.push("");
  lines.push("ERD TABLES"); project.entities.forEach(e=>lines.push(`[${e.id}] ${e.name} | ${moduleById(e.moduleId)?.name||e.moduleId} | position ${e.x},${e.y}\n  ${(e.fields||[]).map(f=>`${f.name} ${f.type}${f.pk?" PK":""}${f.fk?" FK":""}${f.nullable===false?" NOT NULL":""}`).join("\n  ")}`)); lines.push("");
  lines.push("RELATIONSHIPS"); project.relations.forEach(r=>lines.push(`[${r.id}] ${r.from}.${r.fromField} -> ${r.to}.${r.toField} (${r.cardinality||""})`)); lines.push("");
  lines.push("BACKEND APIS"); project.apis.forEach(a=>lines.push(`[${a.id}] ${a.method} ${a.path} | ${a.name} | ${a.permission||""}\n  ${a.description||""}\n  Logic: ${a.logic||""}`)); lines.push("");
  lines.push("BACKEND LOGIC"); project.logic.forEach(l=>lines.push(`[${l.id}] ${l.name} | ${l.trigger||""}\n  ${(l.steps||[]).map((x,i)=>`${i+1}. ${x}`).join("\n  ")}`)); lines.push("");
  lines.push("TIMELINE / TASKS"); (project.timeline||[]).forEach(t=>lines.push(`[${t.id}] ${t.name} | ${moduleById(t.moduleId)?.name||t.moduleId} | ${t.start||""} -> ${t.end||""} | ${t.status||""}`)); lines.push("");
  lines.push("REFERENCE IMAGES"); (project.references||[]).forEach(r=>lines.push(`[${r.id}] ${r.title||"Untitled"} | ${r.type||"Reference"} | ${moduleById(r.moduleId)?.name||r.moduleId||"Project"} | ${r.screenId||""}`));
  const blob=new Blob([lines.join("\n")],{type:"text/plain;charset=utf-8"}); const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=projectFileName(".txt"); a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
function exportProject(){
  saveProject(false);
  const blob = new Blob([JSON.stringify(project,null,2)], {type:"application/json;charset=utf-8"});
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = projectFileName(".json"); a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  if(window.showToast)showToast("Complete project JSON backup downloaded");
}

function resetProject(){
  project = clone(DEFAULT_PROJECT);
  saveProject(false);
}

function exportProject(){
  saveProject(false);
  const blob=new Blob([JSON.stringify(project,null,2)],{type:"application/json;charset=utf-8"});
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=projectFileName(".json"); a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  if(window.showToast)showToast("Complete project JSON downloaded");
}

function importProject(file){
  const reader = new FileReader();
  reader.onload = () => {
    try {
      project = JSON.parse(reader.result);
      normalizeProject();
      projectFileHandle=null;
      projectFilePathLabel="Browser storage (local)";
      saveProject(false);
      location.reload();
    } catch(e) { alert("Invalid project JSON"); }
  };
  reader.readAsText(file);
}
