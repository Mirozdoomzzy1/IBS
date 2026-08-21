import jwt from 'jsonwebtoken';
export function signSession(user){
  const secret=process.env.JWT_SECRET;
  if(!secret) throw new Error('JWT_SECRET is not configured on the API server.');
  return jwt.sign({sub:user.id,username:user.username,displayName:user.displayName,role:user.role},secret,{expiresIn:'12h'});
}
export function requireAuth(req){
  const h=String(req.headers.authorization||'');
  if(!h.startsWith('Bearer ')) throw new Error('Authentication required.');
  const secret=process.env.JWT_SECRET;
  if(!secret) throw new Error('JWT_SECRET is not configured on the API server.');
  return jwt.verify(h.slice(7),secret);
}
