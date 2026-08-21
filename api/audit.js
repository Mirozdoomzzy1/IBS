import {db,json,cors} from './_db.js';
import {requireAuth} from './_auth.js';

export default async function handler(req,res){
  cors(res);
  if(req.method==='OPTIONS') return res.status(204).end();
  try{
    const user=requireAuth(req);
    if(req.method!=='GET') return json(res,405,{error:'Method not allowed'});
    const limit=Math.min(Math.max(Number(req.query?.limit||250),1),500);
    const q=await db().query(`
      select id, actor_name, action, object_type, object_id, module_id, changed_at, metadata
      from project_audit
      where project_id=$1
      order by changed_at desc, id desc
      limit $2
    `,[process.env.PROJECT_ID||'ERP-DESIGN-001',limit]);
    return json(res,200,q.rows.map(x=>({
      ...x,
      exact_action:x.metadata?.exactAction || `${x.action==='CREATE'?'Created':x.action==='UPDATE'?'Updated':x.action==='DELETE'?'Deleted':x.action} ${String(x.object_type||'item').toLowerCase()}`,
      user_name:x.actor_name || x.metadata?.displayName || x.metadata?.username || user.username,
      object_name:x.metadata?.objectName || x.object_id || ''
    })));
  }catch(e){return json(res,e.status||401,{error:e.message,code:e.code||null,details:e.detail||null})}
}
