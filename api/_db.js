import pg from 'pg';
const { Pool } = pg;
let pool;
export function db(){
  if(!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not configured on the API server.');
  if(!pool) pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:false},max:5});
  return pool;
}
export async function withTx(fn){
  const client=await db().connect();
  try{await client.query('BEGIN');const out=await fn(client);await client.query('COMMIT');return out;}
  catch(e){try{await client.query('ROLLBACK')}catch{};throw e}finally{client.release()}
}
export function cors(res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods','GET,POST,PUT,OPTIONS');
}
export function json(res,status,body){cors(res);res.status(status).json(body)}
