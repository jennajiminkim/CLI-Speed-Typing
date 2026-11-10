'use strict';
const {send,config,authUser,rpc,apiError}=require('./_ranked-common');
module.exports=async function handler(req,res){
  if(req.method!=='POST')return send(res,405,{error:'method_not_allowed'});
  if(Number(req.headers['content-length']||0)>1024)return send(res,413,{error:'request_too_large'});
  try {
    const env=config();
    const uid=await authUser(req,env);
    const runId=await rpc(env,'start_ranked_run',{p_user:uid});
    if(!/^[0-9a-f-]{36}$/i.test(runId||''))throw new Error('invalid_run_id');
    return send(res,200,{run_id:runId,verification:'server-events-v1'});
  }catch(e){return apiError(res,e);}
};
