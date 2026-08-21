from pathlib import Path
p=Path('/tmp/auditpkg/api/project.js')
s=p.read_text()
insert=r'''

// Capture stable fingerprints before/after a save so the audit log records
// only real changes, with a human-readable action and the authenticated user.
const AUDIT_SECTIONS = {
  modules: {table:'modules', label:'Module', name:'name', module:'id'},
  requirements: {table:'requirements', label:'Requirement', name:'title', module:'module_id'},
  screens: {table:'screens', label:'Screen', name:'name', module:'module_id'},
  entities: {table:'entities', label:'ERD Entity', name:'name', module:'module_id'},
  relations: {table:'relations', label:'ERD Relationship', name:'id', module:null},
  apis: {table:'apis', label:'API', name:'name', module:'module_id'},
  logic: {table:'logic_workflows', label:'Backend Workflow', name:'name', module:'module_id'},
  timeline: {table:'timeline_tasks', label:'Task', name:'name', module:'module_id'},
  references: {table:'reference_images', label:'Reference Image', name:'title', module:'module_id'},
  tests: {table:'testing_cases', label:'Test Case', name:'name', module:'module_id'},
  comments: {table:'project_comments', label:'Comment', name:'comment_text', module:null}
};

async function auditSnapshot(c, section){
  const cfg=AUDIT_SECTIONS[section];
  if(!cfg) return new Map();
  const cols = [`id`, `${cfg.name} AS display_name`, cfg.module ? `${cfg.module} AS module_id` : `NULL AS module_id`, `md5(to_jsonb(t)::text) AS fingerprint`].join(',');
  const where = cfg.table === 'project_comments' ? 'project_id=$1' : 'project_id=$1';
  const r=await c.query(`select ${cols} from ${cfg.table} t where ${where}`,[PROJECT_ID]);
  return new Map(r.rows.map(x=>[String(x.id),x]));
}

async function writeAudit(c,user,action,objectType,objectId,moduleId,metadata={}){
  await c.query(`insert into project_audit(project_id,actor_name,action,object_type,object_id,module_id,changed_at,metadata) values($1,$2,$3,$4,$5,$6,now(),$7)`,[
    PROJECT_ID,
    user.displayName||user.username,
    action,
    objectType,
    objectId||null,
    moduleId||null,
    JSON.stringify({username:user.username,displayName:user.displayName||user.username,...metadata})
  ]);
}

async function auditSectionDiff(c,user,section,before){
  const cfg=AUDIT_SECTIONS[section];
  if(!cfg) return;
  const after=await auditSnapshot(c,section);
  for(const [id,row] of after){
    const old=before.get(id);
    const display=String(row.display_name||id);
    if(!old){
      await writeAudit(c,user,'CREATE',cfg.label,id,row.module_id,{exactAction:`Created ${cfg.label.toLowerCase()}`,objectName:display});
    }else if(old.fingerprint!==row.fingerprint){
      await writeAudit(c,user,'UPDATE',cfg.label,id,row.module_id,{exactAction:`Updated ${cfg.label.toLowerCase()}`,objectName:display});
    }
  }
  for(const [id,row] of before){
    if(!after.has(id)){
      await writeAudit(c,user,'DELETE',cfg.label,id,row.module_id,{exactAction:`Deleted ${cfg.label.toLowerCase()}`,objectName:String(row.display_name||id)});
    }
  }
}
'''
marker='const cleanDate=v=>v?String(v).slice(0,10):null;'
s=s.replace(marker, marker+insert)
old='''        const set=new Set(changes.length?changes:['modules','requirements','screens','entities','relations','apis','logic','timeline','references','tests','links','comments','security','settings']);
        const jobs=[['modules',syncModules],['requirements',syncRequirements],['screens',syncScreens],['entities',syncEntities],['relations',syncRelations],['apis',syncApis],['logic',syncLogic],['timeline',syncTimeline],['references',syncReferences],['tests',syncTesting],['links',syncLinks],['comments',syncComments],['security',syncSecurity],['settings',syncSettings]];
        for(const [name,fn] of jobs){
          if(!set.has(name)) continue;
          try{ await fn(c,p); }
          catch(e){ const err=new Error(`Save failed in ${name}: ${e?.message||e}`); err.code=e?.code; err.detail=e?.detail; throw err; }
        }
'''
new='''        const set=new Set(changes.length?changes:['modules','requirements','screens','entities','relations','apis','logic','timeline','references','tests','links','comments','security','settings']);
        const auditBefore=new Map();
        for(const name of set){ if(AUDIT_SECTIONS[name]) auditBefore.set(name,await auditSnapshot(c,name)); }
        const jobs=[['modules',syncModules],['requirements',syncRequirements],['screens',syncScreens],['entities',syncEntities],['relations',syncRelations],['apis',syncApis],['logic',syncLogic],['timeline',syncTimeline],['references',syncReferences],['tests',syncTesting],['links',syncLinks],['comments',syncComments],['security',syncSecurity],['settings',syncSettings]];
        for(const [name,fn] of jobs){
          if(!set.has(name)) continue;
          try{ await fn(c,p); }
          catch(e){ const err=new Error(`Save failed in ${name}: ${e?.message||e}`); err.code=e?.code; err.detail=e?.detail; throw err; }
        }
        for(const name of set){ if(AUDIT_SECTIONS[name]) await auditSectionDiff(c,user,name,auditBefore.get(name)||new Map()); }
        if(set.has('project')) await writeAudit(c,user,'UPDATE','Project',PROJECT_ID,null,{exactAction:'Updated project settings',objectName:p.project?.name||'Design Studio'});
'''
if old not in s: raise SystemExit('old block not found')
s=s.replace(old,new)
p.write_text(s)
