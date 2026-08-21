import {db,json,cors} from './_db.js';
export default async function handler(req,res){
  cors(res); if(req.method==='OPTIONS')return res.status(204).end();
  try{const r=await db().query('select now() as now');return json(res,200,{ok:true,database:'CockroachDB',now:r.rows[0].now})}
  catch(e){return json(res,500,{ok:false,error:e.message})}
}
