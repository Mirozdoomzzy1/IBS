import {db,json,cors} from './_db.js';
import {requireAuth} from './_auth.js';
export default async function handler(req,res){
  cors(res); if(req.method==='OPTIONS')return res.status(204).end();
  try{requireAuth(req);if(req.method!=='GET')return json(res,405,{error:'Method not allowed'});const q=await db().query('select id,actor_name,action,object_type,object_id,module_id,changed_at,metadata from project_audit order by changed_at desc limit 250');return json(res,200,q.rows)}catch(e){return json(res,401,{error:e.message})}
}
