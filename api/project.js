import {db,json,cors,withTx} from './_db.js';
import bcrypt from 'bcryptjs';
import {requireAuth} from './_auth.js';
const PROJECT_ID=process.env.PROJECT_ID||'ERP-DESIGN-001';
function actor(req){try{return requireAuth(req)}catch(e){throw Object.assign(e,{status:401})}}
export default async function handler(req,res){
  cors(res); if(req.method==='OPTIONS')return res.status(204).end();
  try{
    const user=actor(req);
    if(req.method==='GET'){
      const q=await db().query('select id,revision,data,updated_at from projects where id=$1',[PROJECT_ID]);
      if(!q.rows[0])return json(res,404,{error:'Project not found.'});
      return json(res,200,{project:q.rows[0].data,revision:Number(q.rows[0].revision),updated_at:q.rows[0].updated_at});
    }
    if(req.method==='PUT'){
      const incoming=req.body||{}; const project=incoming.project; const expected=Number(incoming.revision||0);
      if(!project||typeof project!=='object')return json(res,400,{error:'project object is required.'});
      const out=await withTx(async c=>{
        const current=(await c.query('select revision from projects where id=$1 for update',[PROJECT_ID])).rows[0];
        if(!current)throw Object.assign(new Error('Project not found. Run the seed/migration first.'),{status:404});
        const currentRev=Number(current.revision);
        if(expected!==currentRev)throw Object.assign(new Error(`Revision conflict. Server is at revision ${currentRev}; your copy is ${expected}. Reload before saving.`),{status:409});
        const next=currentRev+1;
        await c.query('update projects set revision=$2,data=$3,updated_at=now(),updated_by=$4 where id=$1',[PROJECT_ID,next,JSON.stringify(project),user.username]);
        const users=Array.isArray(project.security?.users)?project.security.users:[];
        for(const u of users){
          if(!u?.username) continue;
          const existing=(await c.query('select password_hash from app_users where lower(username)=lower($1) limit 1',[String(u.username).trim()])).rows[0];
          let hash=existing?.password_hash;
          if(u.password) hash=await bcrypt.hash(String(u.password),12);
          if(!hash) hash=await bcrypt.hash('change-me',12);
          await c.query(`insert into app_users(id,username,display_name,role,active,password_hash) values($1,$2,$3,$4,$5,$6) on conflict(username) do update set id=excluded.id,display_name=excluded.display_name,role=excluded.role,active=excluded.active,password_hash=excluded.password_hash`,[String(u.id||u.username),String(u.username).trim(),u.displayName||u.username,u.role||'Viewer',u.active!==false,hash]);
        }
        await c.query('insert into project_revisions(project_id,revision,data,saved_by) values($1,$2,$3,$4)',[PROJECT_ID,next,JSON.stringify(project),user.username]);
        await c.query('insert into project_audit(project_id,actor_name,action,object_type,object_id,metadata) values($1,$2,$3,$4,$5,$6)',[PROJECT_ID,user.displayName||user.username,'SAVE','project',PROJECT_ID,JSON.stringify({revision:next})]);
        return next;
      });
      return json(res,200,{ok:true,revision:out});
    }
    return json(res,405,{error:'Method not allowed'});
  }catch(e){return json(res,e.status||500,{error:e.message,code:e.code||null,details:e.detail||null})}
}
