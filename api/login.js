import bcrypt from 'bcryptjs';
import {db,json,cors} from './_db.js';
import {signSession} from './_auth.js';
export default async function handler(req,res){
  cors(res); if(req.method==='OPTIONS')return res.status(204).end();
  if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});
  try{
    const {username,password}=req.body||{};
    if(!username||!password)return json(res,400,{error:'Username and password are required.'});
    const uname=String(username).trim();
    let q=await db().query('select id,username,display_name,role,active,password_hash from app_users where lower(username)=lower($1) limit 1',[uname]);
    let u=q.rows[0];
    // First-login bootstrap: if the database has no users yet, create the initial administrator.
    if(!u){
      const count=await db().query('select count(*)::int as n from app_users');
      const bootstrapPassword=process.env.DEFAULT_ADMIN_PASSWORD;
      if(Number(count.rows[0]?.n||0)===0 && bootstrapPassword && uname.toLowerCase()==='admin' && String(password)===String(bootstrapPassword)){
        const hash=await bcrypt.hash(String(bootstrapPassword),12);
        await db().query("insert into app_users(id,username,display_name,role,active,password_hash) values($1,$2,$3,$4,true,$5)",['USR-ADMIN','admin','Administrator','Administrator',hash]);
        q=await db().query('select id,username,display_name,role,active,password_hash from app_users where lower(username)=lower($1) limit 1',[uname]);
        u=q.rows[0];
      }
    }
    if(!u||!u.active||!(await bcrypt.compare(String(password),u.password_hash)))return json(res,401,{error:'Invalid username or password.'});
    const user={id:u.id,username:u.username,displayName:u.display_name||u.username,role:u.role||'Viewer',active:true};
    return json(res,200,{token:signSession(user),user});
  }catch(e){return json(res,500,{error:e.message})}
}
