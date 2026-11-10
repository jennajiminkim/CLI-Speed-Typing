'use strict';
// Trusted Vercel server functions only. Never bundle this file into /dist.
const PROJECT_URL='https://zhfkjwduelavepjfacpo.supabase.co';
const PROJECT_ID='zhfkjwduelavepjfacpo';
function send(res,status,payload) {
  res.setHeader('Cache-Control','no-store, max-age=0');
  res.setHeader('X-Content-Type-Options','nosniff');
  return res.status(status).json(payload);
}
function config() {
  const url=process.env.CLI_SUPABASE_URL || '';
  const publish=process.env.CLI_SUPABASE_PUBLISHABLE_KEY || '';
  const secret=process.env.CLI_SUPABASE_SECRET_KEY || '';
  if(url!==PROJECT_URL || !/^sb_publishable_[\w-]+$/.test(publish) || !/^sb_secret_[\w-]+$/.test(secret)) {
    const error=new Error('server_credentials_not_ready'); error.code=503;throw error;
  }
  return {url,publish,secret};
}
async function authUser(req,env) {
  const authorization=req.headers.authorization || '';
  if(!/^Bearer\s+[\w.-]{20,4096}$/.test(authorization)) {
    const error=new Error('authentication_required'); error.code=401;throw error;
  }
  const r=await fetch(env.url+'/auth/v1/user',{
    headers:{apikey:env.publish,Authorization:authorization},
    signal:AbortSignal.timeout(9000)
  });
  if(!r.ok) {const error=new Error('invalid_session');error.code=401;throw error;}
  const body=await r.json();
  if(!/^[0-9a-f-]{36}$/i.test(body.id||'')) {
    const error=new Error('invalid_session');error.code=401;throw error;
  }
  return body.id;
}
async function rpc(env,name,body){
  const r=await fetch(env.url+'/rest/v1/rpc/'+name,{
    method:'POST',
    headers:{apikey:env.secret,'Content-Type':'application/json','Accept':'application/json'},
    body:JSON.stringify(body),signal:AbortSignal.timeout(10000)
  });
  if(!r.ok){
    const result=await r.json().catch(()=>({}));
    // Never return raw database errors or SQL internals to browser.
    const err=new Error(result.message||'database_verification_failed');
    const denial=['42501','22023','P0001'].includes(result.code);
    err.code=denial? (result.code==='42501'?403:422) : 503;
    err.publicMessage=denial ? 'run_rejected' : 'verification_unavailable';
    throw err;
  }
  return r.json();
}
function apiError(res,e) {
  if(e && e.code===401)return send(res,401,{error:'authentication_required'});
  if(e && e.code===403)return send(res,403,{error:'not_invited'});
  if(e && e.code===422)return send(res,422,{error:'run_rejected'});
  return send(res,503,{error:'verification_unavailable'});
}
module.exports={send,config,authUser,rpc,apiError,PROJECT_ID};
