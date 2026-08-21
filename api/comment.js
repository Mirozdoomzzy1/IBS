import {db,json,cors,withTx} from './_db.js';
import {requireAuth} from './_auth.js';
const PROJECT_ID=process.env.PROJECT_ID||'ERP-DESIGN-001';
export default async function handler(req,res){
  cors(res); if(req.method==='OPTIONS')return res.status(204).end();
  try{const user=requireAuth(req);if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});const text=String(req.body?.p_comment||req.body?.comment||'').trim();if(!text)return json(res,400,{error:'Comment is empty.'});await db().query('insert into project_comments(id,project_id,object_type,object_id,author_name,comment_text) values($1,$2,$3,$4,$5,$6)',[`COM-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,PROJECT_ID,String(req.body?.p_object_type||'project'),req.body?.p_object_id||PROJECT_ID,user.displayName||user.username,text]);return json(res,200,{ok:true})}catch(e){return json(res,e.status||401,{error:e.message})}
}
