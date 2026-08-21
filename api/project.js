import {db,json,cors,withTx} from './_db.js';
import {requireAuth} from './_auth.js';
import bcrypt from 'bcryptjs';

const PROJECT_ID=process.env.PROJECT_ID||'ERP-DESIGN-001';
const actor=req=>requireAuth(req);
const arr=x=>Array.isArray(x)?x:[];
const cleanDate=v=>v?String(v).slice(0,10):null;

async function loadProject(c){
  const q=async(sql,p=[])=>{const r=await c.query(sql,p);return r.rows};
  const p=(await q('select id,name,description,owner,updated_at,updated_by from projects where id=$1',[PROJECT_ID]))[0];
  if(!p) return null;
  const [modules,requirements,screens,components,entities,fields,relations,apis,logic,logicSteps,timeline,references,tests,testSteps,comments,settingsRows,rolesRows,permissionsRows,rolePermissionRows,moduleAccessRows,usersRows]=await Promise.all([
    q('select id,name,icon,color,description,comments from modules where project_id=$1 order by id',[PROJECT_ID]),
    q('select id,module_id as "moduleId",title,actor,priority,status,description,rule,acceptance,comments from requirements where project_id=$1 order by id',[PROJECT_ID]),
    q('select id,module_id as "moduleId",name,type,status,description,oracle_form as "oracleForm",oracle_description as "oracleDescription",comments,saved_at as "savedAt" from screens where project_id=$1 order by id',[PROJECT_ID]),
    q('select id,screen_id,component_order,type,label,data_type as "dataType",required,read_only as "readOnly",entity,field,entity_field as "entityField",api_field as "apiField",source_type as "sourceType",db_schema as "dbSchema",db_table as "dbTable",db_column as "dbColumn",calculation_rule as "calculationRule",validation_rule as "validationRule",helper_text as "helperText",placeholder,default_value as "defaultValue",visibility,width,min_length as "minLength",max_length as "maxLength",comments,metadata from screen_components where screen_id in (select id from screens where project_id=$1) order by screen_id,component_order',[PROJECT_ID]),
    q('select id,module_id as "moduleId",name,x,y,comments from entities where project_id=$1 order by id',[PROJECT_ID]),
    q('select id,entity_id,field_order,name,type,pk,fk,unique_flag as "unique",nullable,comments from entity_fields where entity_id in (select id from entities where project_id=$1) order by entity_id,field_order',[PROJECT_ID]),
    q('select id,from_entity as "from",to_entity as "to",from_field as "fromField",to_field as "toField",cardinality,comments from relations where project_id=$1 order by id',[PROJECT_ID]),
    q('select id,module_id as "moduleId",method,path,name,permission,status,description,inputs,rules,logic,comments from apis where project_id=$1 order by id',[PROJECT_ID]),
    q('select id,module_id as "moduleId",name,trigger,comments from logic_workflows where project_id=$1 order by id',[PROJECT_ID]),
    q('select id,workflow_id,step_order,step_text as "stepText",comments from logic_steps where workflow_id in (select id from logic_workflows where project_id=$1) order by workflow_id,step_order',[PROJECT_ID]),
    q('select id,module_id as "moduleId",name,layer,phase,start_date as start,end_date as "end",status,priority,owner,dependencies,short_text as short,comments from timeline_tasks where project_id=$1 order by id',[PROJECT_ID]),
    q('select id,module_id as "moduleId",screen_id as "screenId",type,title,notes,data_url as "dataUrl",created_at as "createdAt" from reference_images where project_id=$1 order by created_at',[PROJECT_ID]),
    q('select id,module_id as "moduleId",requirement_id as "requirementId",screen_id as "screenId",entity_id as "entityId",api_id as "apiId",name,test_type as "type",priority,status,preconditions,expected_result as "expectedResult",actual_result as "actualResult",execution_notes as "executionNotes",comments from testing_cases where project_id=$1 order by id',[PROJECT_ID]),
    q('select id,test_case_id,step_order,action,expected_result as "expected",actual_result as "actual",status,comments from testing_steps where test_case_id in (select id from testing_cases where project_id=$1) order by test_case_id,step_order',[PROJECT_ID]),
    q('select id,object_type as "objectType",object_id as "objectId",author_name as "authorName",comment_text as "commentText",created_at as "createdAt" from project_comments where project_id=$1 order by created_at desc',[PROJECT_ID]),
    q('select autosave,grid_size as "gridSize",show_hints as "showHints" from project_settings where project_id=$1',[PROJECT_ID]),
    q('select id,name,description from security_roles where project_id=$1 order by id',[PROJECT_ID]),
    q('select id,code from security_permissions where project_id=$1 order by id',[PROJECT_ID]),
    q('select role_id as "roleId",permission_id as "permissionId" from security_role_permissions where role_id in (select id from security_roles where project_id=$1)',[PROJECT_ID]),
    q('select module_id as "moduleId",role_id as "roleId",allowed from security_module_access where project_id=$1',[PROJECT_ID]),
    q('select id,username,display_name as "displayName",role,active from app_users order by username')
  ]);
  // Normalized-only storage: never read or migrate a project JSON document.
  const byScreen=new Map(screens.map(s=>[s.id,s]));
  components.forEach(c=>{const s=byScreen.get(c.screen_id);if(s){const {screen_id,component_order,...x}=c;s.components ||= [];s.components.push(x)}});
  const byEntity=new Map(entities.map(e=>[e.id,e]));
  fields.forEach(f=>{const e=byEntity.get(f.entity_id);if(e){const {entity_id,field_order,...x}=f;e.fields ||= [];e.fields.push(x)}});
  const byLogic=new Map(logic.map(l=>[l.id,l]));
  logicSteps.forEach(s=>{const l=byLogic.get(s.workflow_id);if(l){l.steps ||= [];l.steps.push(s.stepText);l.stepComments ||= [];l.stepComments.push(s.comments||'')}});
  const byTest=new Map(tests.map(t=>[t.id,t]));
  testSteps.forEach(s=>{const t=byTest.get(s.test_case_id);if(t){t.steps ||= [];t.steps.push({id:s.id,action:s.action,expected:s.expected||'',status:s.status||'Not Run',comments:s.comments||''})}});
  const settings=settingsRows[0]||null; const roles=rolesRows||[], permissions=permissionsRows||[], rolePermissions=rolePermissionRows||[], users=usersRows||[];
  const securityRoles=roles.map(r=>({id:r.id,name:r.name,description:r.description||''}));
  const securityPermissions=permissions.map(x=>x.code);
  const securityModuleAccess={}; moduleAccessRows.forEach(x=>{securityModuleAccess[x.moduleId] ||= {}; securityModuleAccess[x.moduleId][x.roleId]=x.allowed!==false;});
  const rolePermMap={}; rolePermissions.forEach(x=>{rolePermMap[x.roleId] ||= []; rolePermMap[x.roleId].push(x.permissionId);});
  securityRoles.forEach(r=>r.permissions=(rolePermMap[r.id]||[]).map(id=>permissions.find(x=>x.id===id)?.code).filter(Boolean));
  const data={version:3,project:{id:p.id,name:p.name,description:p.description||'',owner:p.owner||'',comments:comments.filter(x=>x.objectType==='project'&&x.objectId===p.id)},modules,requirements,screens,entities,relations,apis,logic,timeline,references,tests,comments,settings:settings||{autosave:true,gridSize:24,showHints:true}};
  data.security={users:users.map(u=>({id:u.id,username:u.username,displayName:u.displayName||u.username,role:u.role||'Viewer',active:u.active!==false,comments:''})),roles:securityRoles,permissions:securityPermissions,moduleAccess:securityModuleAccess};
  return {project:data,updated_at:p.updated_at};
}

async function syncModules(c,p){
  const rows=arr(p.modules); for(const x of rows) await c.query(`insert into modules(id,project_id,name,icon,color,description,comments) values($1,$2,$3,$4,$5,$6,$7) on conflict(id) do update set name=excluded.name,icon=excluded.icon,color=excluded.color,description=excluded.description,comments=excluded.comments`,[x.id,PROJECT_ID,x.name,x.icon||null,x.color||null,x.description||null,x.comments||'']);
  await c.query(`delete from modules where project_id=$1 and id <> all($2::string[])`,[PROJECT_ID,rows.map(x=>String(x.id))]);
}
async function syncRequirements(c,p){
  const rows=arr(p.requirements); for(const x of rows) await c.query(`insert into requirements(id,project_id,module_id,title,actor,priority,status,description,rule,acceptance,comments) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) on conflict(id) do update set module_id=excluded.module_id,title=excluded.title,actor=excluded.actor,priority=excluded.priority,status=excluded.status,description=excluded.description,rule=excluded.rule,acceptance=excluded.acceptance,comments=excluded.comments`,[x.id,PROJECT_ID,x.moduleId||null,x.title||'',x.actor||'',x.priority||'',x.status||'',x.description||'',x.rule||'',x.acceptance||'',x.comments||'']);
  await c.query(`delete from requirements where project_id=$1 and id <> all($2::string[])`,[PROJECT_ID,rows.map(x=>String(x.id))]);
}
async function syncScreens(c,p){
  const rows=arr(p.screens); for(const x of rows){await c.query(`insert into screens(id,project_id,module_id,name,type,status,description,oracle_form,oracle_description,comments,saved_at) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) on conflict(id) do update set module_id=excluded.module_id,name=excluded.name,type=excluded.type,status=excluded.status,description=excluded.description,oracle_form=excluded.oracle_form,oracle_description=excluded.oracle_description,comments=excluded.comments,saved_at=excluded.saved_at`,[x.id,PROJECT_ID,x.moduleId||null,x.name||'',x.type||'',x.status||'',x.description||'',x.oracleForm||'',x.oracleDescription||'',x.comments||'',x.savedAt||null]);await c.query('delete from screen_components where screen_id=$1',[x.id]); for(const [i,z] of arr(x.components).entries()) await c.query(`insert into screen_components(id,screen_id,component_order,type,label,data_type,required,read_only,entity,field,entity_field,api_field,source_type,db_schema,db_table,db_column,calculation_rule,validation_rule,helper_text,placeholder,default_value,visibility,width,min_length,max_length,comments,metadata) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27)`,[z.id,x.id,i,z.type||'',z.label||'',z.dataType||'',!!z.required,!!z.readOnly,z.entity||'',z.field||'',z.entityField||'',z.apiField||'',z.sourceType||'',z.dbSchema||'',z.dbTable||'',z.dbColumn||'',z.calculationRule||'',z.validationRule||'',z.helperText||'',z.placeholder||'',z.defaultValue||'',z.visibility||'Always',z.width||'',z.minLength===''?null:z.minLength??null,z.maxLength===''?null:z.maxLength??null,z.comments||z.comment||'',JSON.stringify(z.metadata||{})]);}
  await c.query(`delete from screens where project_id=$1 and id <> all($2::string[])`,[PROJECT_ID,rows.map(x=>String(x.id))]);
}
async function syncEntities(c,p){
  const rows=arr(p.entities); for(const x of rows){await c.query(`insert into entities(id,project_id,module_id,name,x,y,comments) values($1,$2,$3,$4,$5,$6,$7) on conflict(id) do update set module_id=excluded.module_id,name=excluded.name,x=excluded.x,y=excluded.y,comments=excluded.comments`,[x.id,PROJECT_ID,x.moduleId||null,x.name||'',Number(x.x||0),Number(x.y||0),x.comments||'']);await c.query('delete from entity_fields where entity_id=$1',[x.id]);for(const [i,f] of arr(x.fields).entries())await c.query(`insert into entity_fields(id,entity_id,field_order,name,type,pk,fk,unique_flag,nullable,comments) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,[`${x.id}-${i}-${f.name}`,x.id,i,f.name||'',f.type||'',!!f.pk,!!f.fk,!!f.unique, f.nullable!==false,f.comments||'']);}
  await c.query(`delete from entities where project_id=$1 and id <> all($2::string[])`,[PROJECT_ID,rows.map(x=>String(x.id))]);
}
async function syncRelations(c,p){const rows=arr(p.relations);for(const x of rows)await c.query(`insert into relations(id,project_id,from_entity,to_entity,from_field,to_field,cardinality,comments) values($1,$2,$3,$4,$5,$6,$7,$8) on conflict(id) do update set from_entity=excluded.from_entity,to_entity=excluded.to_entity,from_field=excluded.from_field,to_field=excluded.to_field,cardinality=excluded.cardinality,comments=excluded.comments`,[x.id,PROJECT_ID,x.from,x.to,x.fromField||'',x.toField||'',x.cardinality||'1:N',x.comments||'']);await c.query(`delete from relations where project_id=$1 and id <> all($2::string[])`,[PROJECT_ID,rows.map(x=>String(x.id))]);}
async function syncApis(c,p){const rows=arr(p.apis);for(const x of rows)await c.query(`insert into apis(id,project_id,module_id,method,path,name,permission,status,description,inputs,rules,logic,comments) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) on conflict(id) do update set module_id=excluded.module_id,method=excluded.method,path=excluded.path,name=excluded.name,permission=excluded.permission,status=excluded.status,description=excluded.description,inputs=excluded.inputs,rules=excluded.rules,logic=excluded.logic,comments=excluded.comments`,[x.id,PROJECT_ID,x.moduleId||null,x.method||'',x.path||'',x.name||'',x.permission||'',x.status||'',x.description||'',x.inputs||'',x.rules||'',x.logic||'',x.comments||'']);await c.query(`delete from apis where project_id=$1 and id <> all($2::string[])`,[PROJECT_ID,rows.map(x=>String(x.id))]);}
async function syncLogic(c,p){const rows=arr(p.logic);for(const x of rows){await c.query(`insert into logic_workflows(id,project_id,module_id,name,trigger,comments) values($1,$2,$3,$4,$5,$6) on conflict(id) do update set module_id=excluded.module_id,name=excluded.name,trigger=excluded.trigger,comments=excluded.comments`,[x.id,PROJECT_ID,x.moduleId||null,x.name||'',x.trigger||'',x.comments||'']);await c.query('delete from logic_steps where workflow_id=$1',[x.id]);for(const [i,s] of arr(x.steps).entries())await c.query(`insert into logic_steps(id,workflow_id,step_order,step_text,comments) values($1,$2,$3,$4,$5)`,[`${x.id}-step-${i}`,x.id,i,String(s),arr(x.stepComments)[i]||'']);}await c.query(`delete from logic_workflows where project_id=$1 and id <> all($2::string[])`,[PROJECT_ID,rows.map(x=>String(x.id))]);}
async function syncTimeline(c,p){const rows=arr(p.timeline);for(const x of rows)await c.query(`insert into timeline_tasks(id,project_id,module_id,name,layer,phase,start_date,end_date,status,priority,owner,dependencies,short_text,comments) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) on conflict(id) do update set module_id=excluded.module_id,name=excluded.name,layer=excluded.layer,phase=excluded.phase,start_date=excluded.start_date,end_date=excluded.end_date,status=excluded.status,priority=excluded.priority,owner=excluded.owner,dependencies=excluded.dependencies,short_text=excluded.short_text,comments=excluded.comments`,[x.id,PROJECT_ID,x.moduleId||null,x.name||'',x.layer||'',x.phase||'',cleanDate(x.start),cleanDate(x.end),x.status||'',x.priority||'',x.owner||'',x.dependencies||'',x.short||'',x.comments||'']);await c.query(`delete from timeline_tasks where project_id=$1 and id <> all($2::string[])`,[PROJECT_ID,rows.map(x=>String(x.id))]);}
async function syncReferences(c,p){const rows=arr(p.references);for(const x of rows)await c.query(`insert into reference_images(id,project_id,module_id,screen_id,type,title,notes,data_url) values($1,$2,$3,$4,$5,$6,$7,$8) on conflict(id) do update set module_id=excluded.module_id,screen_id=excluded.screen_id,type=excluded.type,title=excluded.title,notes=excluded.notes,data_url=excluded.data_url`,[x.id,PROJECT_ID,x.moduleId||null,x.screenId||null,x.type||'',x.title||'',x.notes||'',x.dataUrl||'']);await c.query(`delete from reference_images where project_id=$1 and id <> all($2::string[])`,[PROJECT_ID,rows.map(x=>String(x.id))]);}
async function syncTesting(c,p){const rows=arr(p.tests);for(const x of rows){await c.query(`insert into testing_cases(id,project_id,module_id,requirement_id,screen_id,entity_id,api_id,name,test_type,priority,status,preconditions,expected_result,actual_result,execution_notes,comments) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) on conflict(id) do update set module_id=excluded.module_id,requirement_id=excluded.requirement_id,screen_id=excluded.screen_id,entity_id=excluded.entity_id,api_id=excluded.api_id,name=excluded.name,test_type=excluded.test_type,priority=excluded.priority,status=excluded.status,preconditions=excluded.preconditions,expected_result=excluded.expected_result,actual_result=excluded.actual_result,execution_notes=excluded.execution_notes,comments=excluded.comments`,[x.id,PROJECT_ID,x.moduleId||null,x.requirementId||null,x.screenId||null,x.entityId||null,x.apiId||null,x.name||'',x.type||x.testType||'Functional',x.priority||'Medium',x.status||'Not Run',x.preconditions||'',x.expectedResult||'',x.actualResult||'',x.executionNotes||'',x.comments||'']);await c.query('delete from testing_steps where test_case_id=$1',[x.id]);for(const [i,s] of arr(x.steps).entries())await c.query(`insert into testing_steps(id,test_case_id,step_order,action,expected_result,actual_result,status,comments) values($1,$2,$3,$4,$5,$6,$7,$8)`,[s.id||`${x.id}-step-${i}`,x.id,i,s.action||'',s.expected||s.expectedResult||'',s.actual||s.actualResult||'',s.status||'Not Run',s.comments||'']);}await c.query(`delete from testing_cases where project_id=$1 and id <> all($2::string[])`,[PROJECT_ID,rows.map(x=>String(x.id))]);}
async function syncSecurity(c,p){
  const sec=p.security||{}; const users=arr(sec.users);
  for(const u of users){ if(!u?.username) continue; const existing=(await c.query('select password_hash from app_users where lower(username)=lower($1) limit 1',[String(u.username).trim()])).rows[0]; let hash=existing?.password_hash; if(u.password) hash=await bcrypt.hash(String(u.password),12); if(!hash) hash=await bcrypt.hash('change-me',12); await c.query(`insert into app_users(id,username,display_name,role,active,password_hash) values($1,$2,$3,$4,$5,$6) on conflict(username) do update set display_name=excluded.display_name,role=excluded.role,active=excluded.active,password_hash=excluded.password_hash`,[String(u.id||u.username),String(u.username).trim(),u.displayName||u.username,u.role||'Viewer',u.active!==false,hash]); }
  const roles=arr(sec.roles), perms=arr(sec.permissions).map(code=>({id:'PERM-'+String(code).replace(/[^A-Za-z0-9]+/g,'_'),code}));
  await c.query('delete from security_roles where project_id=$1 and id <> all($2::string[])',[PROJECT_ID,roles.map(x=>String(x.id))]);
  await c.query('delete from security_permissions where project_id=$1 and id <> all($2::string[])',[PROJECT_ID,perms.map(x=>String(x.id))]);
  for(const r of roles) await c.query(`insert into security_roles(id,project_id,name,description) values($1,$2,$3,$4) on conflict(id) do update set name=excluded.name,description=excluded.description`,[r.id,PROJECT_ID,r.name||r.id,r.description||'']);
  for(const q of perms) await c.query(`insert into security_permissions(id,project_id,code) values($1,$2,$3) on conflict(id) do update set code=excluded.code`,[q.id,PROJECT_ID,q.code]);
  await c.query('delete from security_role_permissions where role_id in (select id from security_roles where project_id=$1)',[PROJECT_ID]);
  for(const r of roles){ for(const code of arr(r.permissions)){ const q=perms.find(x=>x.code===code); if(q) await c.query('insert into security_role_permissions(role_id,permission_id) values($1,$2) on conflict do nothing',[r.id,q.id]); } }
  const access=sec.moduleAccess||{}; for(const [moduleId,map] of Object.entries(access)){ for(const [roleId,allowed] of Object.entries(map||{})){ await c.query(`insert into security_module_access(project_id,module_id,role_id,allowed) values($1,$2,$3,$4) on conflict(project_id,module_id,role_id) do update set allowed=excluded.allowed`,[PROJECT_ID,moduleId,roleId,allowed!==false]); } }
}
async function syncSettings(c,p){const s=p.settings||{};await c.query(`insert into project_settings(project_id,autosave,grid_size,show_hints) values($1,$2,$3,$4) on conflict(project_id) do update set autosave=excluded.autosave,grid_size=excluded.grid_size,show_hints=excluded.show_hints`,[PROJECT_ID,s.autosave!==false,Number(s.gridSize||24),s.showHints!==false]);}

export default async function handler(req,res){
  cors(res); if(req.method==='OPTIONS')return res.status(204).end();
  try{
    const user=actor(req);
    if(req.method==='GET'){
      const out=await loadProject(db());
      if(!out)return json(res,404,{error:'Project not found.'});
      return json(res,200,out);
    }
    if(req.method==='PUT'){
      const body=req.body||{};const p=body.project;if(!p||typeof p!=='object')return json(res,400,{error:'project object is required.'});
      const changes=arr(body.changes);
      const out=await withTx(async c=>{
        const exists=(await c.query('select id from projects where id=$1',[PROJECT_ID])).rows[0];
        if(!exists) await c.query(`insert into projects(id,name,description,owner,updated_at,updated_by) values($1,$2,$3,$4,now(),$5)`,[PROJECT_ID,p.project?.name||'Design Studio',p.project?.description||'',p.project?.owner||'',user.username]);
        else if(changes.includes('project')) await c.query(`update projects set name=$2,description=$3,owner=$4,updated_at=now(),updated_by=$5 where id=$1`,[PROJECT_ID,p.project?.name||'Design Studio',p.project?.description||'',p.project?.owner||'',user.username]);
        const set=new Set(changes.length?changes:['modules','requirements','screens','entities','relations','apis','logic','timeline','references','tests','security','settings']);
        if(set.has('modules'))await syncModules(c,p); if(set.has('requirements'))await syncRequirements(c,p); if(set.has('screens'))await syncScreens(c,p); if(set.has('entities'))await syncEntities(c,p); if(set.has('relations'))await syncRelations(c,p); if(set.has('apis'))await syncApis(c,p); if(set.has('logic'))await syncLogic(c,p); if(set.has('timeline'))await syncTimeline(c,p); if(set.has('references'))await syncReferences(c,p); if(set.has('tests'))await syncTesting(c,p); if(set.has('security'))await syncSecurity(c,p); if(set.has('settings'))await syncSettings(c,p);
        return (await c.query('select updated_at from projects where id=$1',[PROJECT_ID])).rows[0]?.updated_at;
      });
      return json(res,200,{ok:true,updated_at:out,changedTables:changes});
    }
    return json(res,405,{error:'Method not allowed'});
  }catch(e){return json(res,e.status||500,{error:e.message,code:e.code||null,details:e.detail||null})}
}
