/* Phase 3 — official ranked submissions are optional. Local practice remains available.
 * Only validated, invited accounts obtain a server-issued run_id. */
(() => {
  const PROJECT='https://zhfkjwduelavepjfacpo.supabase.co';
  let connection;
  async function connect(){
    if(connection)return connection;
    connection=(async()=>{
      const configResult=await fetch('/api/public-config',{cache:'no-store'});
      if(!configResult.ok)throw new Error('missing_config');
      const cfg=await configResult.json();
      if(cfg.url!==PROJECT || !/^sb_publishable_[\w-]+$/.test(cfg.key||'')) throw new Error('invalid_config');
      const {createClient}=await import('https://esm.sh/@supabase/supabase-js@2.119.0?bundle');
      return createClient(cfg.url,cfg.key,{auth:{
        persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:'pkce'
      }});
    })().catch(e=>{connection=null;throw e});
    return connection;
  }
  async function token(){
    const client=await connect();
    const {data,error}=await client.auth.getSession();
    if(error || !data?.session?.access_token) return null;
    return data.session.access_token;
  }
  async function call(path,payload){
    const bearer=await token();
    if(!bearer)throw new Error('not_signed_in');
    const response=await fetch(path,{
      method:'POST',cache:'no-store',headers:{
        'Content-Type':'application/json',Authorization:'Bearer '+bearer
      },body:JSON.stringify(payload)
    });
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(data.error || 'verification_failed');
    return data;
  }
  async function start(){
    const bearer=await token();
    if(!bearer)return null;
    const r=await fetch('/api/ranked-start',{
      method:'POST',cache:'no-store',headers:{Authorization:'Bearer '+bearer}
    });
    if(r.status===401 || r.status===403) return null;
    const value=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(value.error||'verification_unavailable');
    if(!/^[0-9a-f-]{36}$/i.test(value.run_id||''))throw new Error('invalid_run_response');
    return value.run_id;
  }
  async function step(runId,number,command){
    return call('/api/ranked-step',{run_id:runId,step:number,command});
  }
  async function rankFor(day){
    const client=await connect();
    const {data:userResult,error:userError}=await client.auth.getUser();
    if(userError || !userResult?.user)return null;
    const {data:runs,error}=await client.from('ranked_runs')
      .select('user_id,elapsed_ms').eq('seoul_day',day)
      .order('elapsed_ms',{ascending:true}).order('user_id',{ascending:true}).limit(100);
    if(error)throw new Error('leaderboard_unavailable');
    const index=(runs||[]).findIndex(x=>x.user_id===userResult.user.id);
    return index<0?null:{rank:index+1,count:runs.length};
  }
  window.CLI_RANKED={start,step,rankFor};
})();
