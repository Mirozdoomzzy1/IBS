
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

// ============================================================
// GITHUB JSON STORAGE
// WARNING: This PAT is intentionally hard-coded because you
// requested client-side GitHub storage. Anyone who can load the
// website can inspect this token and use it. Give the token ONLY
// the minimum Contents permission required for this repository.
// ============================================================
const GITHUB_STORAGE = {
  owner: "Mirozdoomzzy1",
  repo: "IBS",
  branch: "main",
  path: "data/project.json",
  token: "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"
};

let githubFileSha = null;
let githubSaveTimer = null;
let githubSaveInProgress = false;
let githubSaveQueued = false;
let githubLastError = "";
let githubLastPayload = "";

function githubStorageConfigured(){
  return !!(GITHUB_STORAGE.owner &&
    GITHUB_STORAGE.repo &&
    GITHUB_STORAGE.branch &&
    GITHUB_STORAGE.path &&
    GITHUB_STORAGE.token &&
    !GITHUB_STORAGE.owner.startsWith("YOUR_") &&
    !GITHUB_STORAGE.repo.startsWith("YOUR_") &&
    !GITHUB_STORAGE.token.includes("PASTE_YOUR_TOKEN"));
}

function githubApiHeaders(){
  return {
    "Accept":"application/vnd.github+json",
    "Authorization":"Bearer "+GITHUB_STORAGE.token,
    "X-GitHub-Api-Version":"2022-11-28",
    "Content-Type":"application/json"
  };
}

function githubFileUrl(){
  return "https://api.github.com/repos/"+encodeURIComponent(GITHUB_STORAGE.owner)+"/"+encodeURIComponent(GITHUB_STORAGE.repo)+"/contents/"+GITHUB_STORAGE.path.split("/").map(encodeURIComponent).join("/");
}

function decodeGithubContent(base64){
  const binary=atob(String(base64||"").replace(/\n/g,""));
  const bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));
  return new TextDecoder("utf-8").decode(bytes);
}

function encodeGithubContent(text){
  const bytes=new TextEncoder().encode(text);
  let binary="";
  const chunk=0x8000;
  for(let i=0;i<bytes.length;i+=chunk)binary+=String.fromCharCode(...bytes.subarray(i,i+chunk));
  return btoa(binary);
}

async function githubReadProject(showError=false){
  if(!githubStorageConfigured())return false;
  try{
    const response=await fetch(githubFileUrl()+"?ref="+encodeURIComponent(GITHUB_STORAGE.branch)+"&t="+Date.now(),{
      method:"GET",
      headers:githubApiHeaders(),
      cache:"no-store"
    });
    if(!response.ok)throw new Error("GitHub GET "+response.status+": "+await response.text());
    const data=await response.json();
    if(!data.content)throw new Error("GitHub returned no file content");
    githubFileSha=data.sha||null;
    const rawProject=decodeGithubContent(data.content);
    githubLastPayload=rawProject;
    const parsed=JSON.parse(rawProject);
    project=parsed;
    normalizeProject({skipGitHubSave:true});
    localStorage.setItem("enterpriseSystemDesignStudio",JSON.stringify(project,null,2));
    localStorage.setItem("enterpriseSystemDesignStudio.lastSaved",new Date().toISOString());
    lastSavedAt=new Date();
    projectFilePathLabel="GitHub: "+GITHUB_STORAGE.owner+"/"+GITHUB_STORAGE.repo+"/"+GITHUB_STORAGE.path;
    githubLastError="";
    return true;
  }catch(e){
    githubLastError=String(e?.message||e);
    console.warn("GitHub project load failed",e);
    if(showError && window.showToast)showToast("GitHub load failed: "+githubLastError);
    return false;
  }
}

async function githubSaveProject(show=true){
  if(!githubStorageConfigured())return false;
  if(githubSaveInProgress){ githubSaveQueued=true; return false; }
  githubSaveInProgress=true;
  try{
    const payload=JSON.stringify(project,null,2);
    if(payload===githubLastPayload){
      githubLastPayload=payload;
      return true;
    }
    // Always refresh the SHA immediately before writing. This prevents
    // accidentally overwriting a newer commit made from another device.
    const current=await fetch(githubFileUrl()+"?ref="+encodeURIComponent(GITHUB_STORAGE.branch)+"&t="+Date.now(),{
      method:"GET",headers:githubApiHeaders(),cache:"no-store"
    });
    if(!current.ok)throw new Error("GitHub read before save failed: "+current.status+" "+await current.text());
    const currentData=await current.json();
    const latestSha=currentData.sha;
    if(githubFileSha && latestSha && githubFileSha!==latestSha){
      githubFileSha=latestSha;
      throw new Error("CONFLICT: project.json changed on GitHub from another device. Reload the project before saving.");
    }
    const body={
      message:"Update Enterprise System Design Studio project",
      content:encodeGithubContent(payload),
      branch:GITHUB_STORAGE.branch,
      sha:latestSha
    };
    const response=await fetch(githubFileUrl(),{
      method:"PUT",
      headers:githubApiHeaders(),
      body:JSON.stringify(body)
    });
    if(!response.ok)throw new Error("GitHub save "+response.status+": "+await response.text());
    const result=await response.json();
    githubFileSha=result?.content?.sha||result?.commit?.sha||latestSha;
    githubLastPayload=payload;
    githubLastError="";
    projectFilePathLabel="GitHub: "+GITHUB_STORAGE.owner+"/"+GITHUB_STORAGE.repo+"/"+GITHUB_STORAGE.path;
    if(show && window.showToast)showToast("Project saved to GitHub");
    return true;
  }catch(e){
    githubLastError=String(e?.message||e);
    console.error("GitHub project save failed",e);
    if(show && window.showToast)showToast(githubLastError.startsWith("CONFLICT:")?githubLastError:"GitHub save failed");
    return false;
  }finally{
    githubSaveInProgress=false;
    if(githubSaveQueued){
      githubSaveQueued=false;
      scheduleGithubSave();
    }
  }
}

function scheduleGithubSave(show=false){
  if(!githubStorageConfigured() || !project)return;
  clearTimeout(githubSaveTimer);
  githubSaveTimer=setTimeout(()=>githubSaveProject(show),1200);
}


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
  // GitHub is the source of truth. The public JSON is only a fallback
  // for first-time setup or if GitHub storage is not configured.
  if(await githubReadProject(false))return true;
  try {
    const response=await fetch("./data/project.json?ts="+Date.now(),{cache:"no-store"});
    if(!response.ok)return false;
    const data=await response.json();
    project=data; normalizeProject({skipGitHubSave:true});
    saveProject(false);
    return true;
  } catch(e){ console.warn("Website project JSON not loaded",e); return false; }
}
function loadProject(){
  try {
    const raw = localStorage.getItem("enterpriseSystemDesignStudio");
    project = raw ? JSON.parse(raw) : clone(DEFAULT_PROJECT);
  } catch(e) {
    project = clone(DEFAULT_PROJECT);
  }
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

function normalizeProject(options={}){
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
  if(!options.skipGitHubSave) saveProject(false);
}

function saveProject(show=true){
  try {
    const payload = JSON.stringify(project, null, 2);
    // localStorage remains a fast offline cache, but GitHub is the source of truth.
    localStorage.setItem("enterpriseSystemDesignStudio", payload);
    localStorage.setItem("enterpriseSystemDesignStudio.lastSaved", new Date().toISOString());
    lastSavedAt = new Date();
    if(projectFileHandle) writeProjectFile(payload, false);
    if(githubStorageConfigured()) scheduleGithubSave(show);
    if(show && window.showToast) {
      if(githubStorageConfigured()) showToast("Saving project to GitHub…");
      else showToast(projectFileHandle ? "Project saved to JSON file" : "Project saved locally");
    }
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
