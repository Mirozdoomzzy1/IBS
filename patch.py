from pathlib import Path
p=Path('/tmp/v13/js/store.js')
s=p.read_text()
s=s.replace('async function supabaseLogin(email,password){\n  if(!supabaseConfigured()) throw new Error("Supabase is not configured.");\n  const session=await supabaseFetch("/auth/v1/token?grant_type=password",{\n    method:"POST",authenticated:false,body:JSON.stringify({email,password})\n  });', '''function ibsAuthEmail(username){\n  const u=String(username||\"\").trim().toLowerCase();\n  return `${u}@ibs.local`;\n}\nasync function supabaseLogin(username,password){\n  if(!supabaseConfigured()) throw new Error("Supabase is not configured.");\n  const normalized=String(username||\"\").trim().toLowerCase();\n  if(!normalized) throw new Error("Username is required.");\n  let session;\n  try{\n    session=await supabaseFetch("/auth/v1/token?grant_type=password",{\n      method:"POST",authenticated:false,body:JSON.stringify({email:ibsAuthEmail(normalized),password})\n    });\n  }catch(e){\n    // First-run bootstrap: create the requested administrator from the site.\n    if(normalized==='admin' && String(password)==='123'){\n      await supabaseUserAdmin('bootstrap',{username:'admin',displayName:'Administrator',password:'123',role:'Administrator'});\n      session=await supabaseFetch("/auth/v1/token?grant_type=password",{\n        method:"POST",authenticated:false,body:JSON.stringify({email:ibsAuthEmail('admin'),password:'123'})\n      });\n    }else throw e;\n  }''')
s=s.replace('const rows=await supabaseFetch(`/rest/v1/user_access?user_id=eq.${encodeURIComponent(supabaseAuthUser.id)}&select=role,active&limit=1`);\n      if(rows?.length && rows[0].active!==false) supabaseAuthUser.__ibsRole=rows[0].role;', 'const rows=await supabaseFetch(`/rest/v1/user_access?user_id=eq.${encodeURIComponent(supabaseAuthUser.id)}&select=role,active,username,display_name&limit=1`);\n      if(rows?.length){\n        if(rows[0].active===false) throw new Error("This user is disabled.");\n        supabaseAuthUser.__ibsRole=rows[0].role;\n        supabaseAuthUser.__ibsUsername=rows[0].username;\n        supabaseAuthUser.__ibsDisplayName=rows[0].display_name;\n      }')
insert='''\nasync function supabaseUserAdmin(action,payload={}){\n  if(!supabaseSession?.access_token) throw new Error("Authentication required.");\n  const response=await fetch(`${SUPABASE_CONFIG.url}/functions/v1/ibs-user-admin`,{\n    method:'POST',\n    headers:{apikey:SUPABASE_CONFIG.anonKey,Authorization:`Bearer ${supabaseSession.access_token}`,'Content-Type':'application/json'},\n    body:JSON.stringify({action,...payload})\n  });\n  const text=await response.text();\n  let data=null; try{data=text?JSON.parse(text):null}catch(_e){}\n  if(!response.ok) throw new Error(data?.error||data?.message||`User management failed (${response.status})`);\n  return data;\n}\nwindow.supabaseUserAdmin=supabaseUserAdmin;\n'''
pos=s.index('async function supabaseLogout()')
s=s[:pos]+insert+s[pos:]
p.write_text(s)

p=Path('/tmp/v13/js/app.js'); s=p.read_text()
s=s.replace('username:md.username||supabaseAuthUser.email?.split("@")[0]||supabaseAuthUser.email,\n      displayName:md.displayName||md.display_name||supabaseAuthUser.email,', 'username:supabaseAuthUser.__ibsUsername||md.username||supabaseAuthUser.email?.split("@")[0]||"user",\n      displayName:supabaseAuthUser.__ibsDisplayName||md.displayName||md.display_name||"User",')
s=s.replace('<label>Email<input name="email" type="email" autocomplete="username" placeholder="name@ibs-company.com" required></label>', '<label>Username<input name="username" type="text" autocomplete="username" placeholder="admin" required></label>')
s=s.replace('Sign in with your IBS Supabase account. Project data is shared securely through Supabase.', 'Sign in with your IBS account. Your account uses a username and password; email is not required.')
s=s.replace('<div class="demo-credentials"><b>Supabase Authentication</b><span>Your account must be created in Supabase Authentication → Users.</span><span>Role can be set in the user\'s metadata (Administrator, Architect, Designer or Viewer).</span></div>', '<div class="demo-credentials"><b>Initial administrator</b><span>Username: <strong>admin</strong></span><span>Password: <strong>123</strong></span><span>The administrator can create and control all other users from Security Center.</span></div>')
s=s.replace('await supabaseLogin(String(f.get("email")).trim(),String(f.get("password")));', 'await supabaseLogin(String(f.get("username")).trim(),String(f.get("password")));')
s=s.replace('<div class="field"><label>Username</label><input name="username" value="${esc(item.username)}" placeholder="e.g. j.smith"></div>', '<div class="field"><label>Username</label><input name="username" value="${esc(item.username)}" placeholder="e.g. john.smith" ${item.username?"readonly":""}></div>')
old='''  } else if(t==="user"){
    if(!v.username||!v.displayName||(!state.editing.id || !project.security.users.find(x=>x.id===state.editing.id)) && !v.password)return alert("Username, display name and password are required");
    const old=project.security.users.find(x=>x.id===state.editing.id); const obj={id:v.id,username:v.username,displayName:v.displayName,role:v.role,active:v.active!=="false",password:v.password||old?.password||"",comments:v.comments||""};
    if(old)Object.assign(old,obj);else project.security.users.push(obj);
'''
new='''  } else if(t==="user"){
    if(!v.username||!v.displayName)return alert("Username and display name are required");
    if(!state.editing.id && !v.password)return alert("Password is required for a new user");
    if(typeof supabaseUserAdmin!=="function" || !supabaseSession?.access_token) return alert("User management requires the authenticated Supabase workspace.");
    try{
      await supabaseUserAdmin(state.editing.id?"update":"create",{\n        userId:state.editing.id||null,username:v.username,displayName:v.displayName,role:v.role,active:v.active!=="false",password:v.password||null,comments:v.comments||""\n      });
      closeModal();\n      await loadSupabaseAuthUser();\n      await loadSupabaseProject();\n      renderAccess();\n      showToast(state.editing.id?"User updated":"User created");\n      return;\n    }catch(e){ return alert(e.message||e); }
'''
if old not in s: raise SystemExit('user block not found')
s=s.replace(old,new)
old2='''    case "delete-user": if(confirm("Disable/delete this user?")){project.security.users=project.security.users.filter(x=>x.id!==id);saveProject(false);renderAccess();showToast("User removed")}break;'''
new2='''    case "delete-user": if(confirm("Disable this user? They will no longer be able to sign in.")){(async()=>{try{await supabaseUserAdmin("disable",{userId:id});await loadSupabaseProject();renderAccess();showToast("User disabled")}catch(e){alert(e.message||e)}})()}break;'''
s=s.replace(old2,new2)
# show no email in access summary and audit UI labels
s=s.replace('`<small>${esc(u?.role||"")} · @${esc(u?.username||"")}</small>`', '`<small>${esc(u?.role||"")} · ${esc(u?.username||"")}</small>`')
s=s.replace('actor_email text,', 'actor_email text,')
p.write_text(s)
