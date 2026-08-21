import fs from 'node:fs';
import pg from 'pg';
import bcrypt from 'bcryptjs';
const {Pool}=pg;
const url=process.env.DATABASE_URL;if(!url)throw new Error('Set DATABASE_URL first.');
const file=process.argv[2]||'docs/data/project.json';const project=JSON.parse(fs.readFileSync(file,'utf8'));
const pool=new Pool({connectionString:url,ssl:{rejectUnauthorized:false}});const c=await pool.connect();
try{
 await c.query('begin');
 const pid=project.project?.id||'ERP-DESIGN-001';
 await c.query(`insert into projects(id,revision,data,updated_by) values($1,0,$2,$3) on conflict(id) do update set data=excluded.data`,[pid,JSON.stringify(project),'migration']);
 const users=project.security?.users||[{id:'USR-001',username:'admin',displayName:'Administrator',role:'Administrator',active:true,password:'123'}];
 for(const u of users){const hash=await bcrypt.hash(String(u.password||'123'),12);await c.query(`insert into app_users(id,username,display_name,role,active,password_hash) values($1,$2,$3,$4,$5,$6) on conflict(username) do update set id=excluded.id,display_name=excluded.display_name,role=excluded.role,active=excluded.active,password_hash=excluded.password_hash`,[String(u.id||u.username),String(u.username).trim(),u.displayName||u.username,u.role||'Viewer',u.active!==false,hash]);}
 await c.query('commit');console.log('Seeded',pid,'and',users.length,'users');
}catch(e){await c.query('rollback');throw e}finally{c.release();await pool.end()}
