'use strict';
const {send,config,authUser,rpc,apiError}=require('./_ranked-common');
module.exports=async function handler(req,res){
  if(req.method!=='POST')return send(res,405,{error:'method_not_allowed'});
  if(Number(req.headers['content-length']||0)>2048)return send(res,413,{error:'request_too_large'});
  const {run_id,step,command}=req.body||{};
  if(!/^[0-9a-f-]{36}$/i.test(run_id||'') ||
    !Number.isInteger(step)||step<1||step>10||
    typeof command!=='string'||command.length>120) {
    return send(res,400,{error:'invalid_request'});
  }
  try {
    const env=config();
    const uid=await authUser(req,env);
    const result=await rpc(env,'submit_ranked_step',{
      p_user:uid,p_run:run_id,p_step:step,p_command:command
    });
    if(!result || result.verified_step!==step || typeof result.complete!=='boolean') {
      return send(res,503,{error:'verification_unavailable'});
    }
    return send(res,200,result);
  }catch(e){return apiError(res,e);}
};
