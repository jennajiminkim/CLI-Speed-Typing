'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const url='https://zhfkjwduelavepjfacpo.supabase.co';
const source=(p)=>fs.readFileSync(p,'utf8');
const sql=source('supabase/migrations/20261110_ranked_runs_phase3.sql');
const app=source('dist/app.js');
const html=source('dist/index.html');
const client=source('dist/ranked-client.js');
const server=source('api/_ranked-common.js');
const startHandler=require('./api/ranked-start.js');
const stepHandler=require('./api/ranked-step.js');
const runTests=async()=>{
  let count=0;
  async function test(name,fn){await fn();count++;console.log('PASS',name)}
  await test('server canonical commands and atomic daily fastest upsert',()=>{
    assert.match(sql,/create or replace function public\.start_ranked_run/);
    assert.match(sql,/create or replace function public\.submit_ranked_step/);
    assert.match(sql,/v_run\.step_index \+ 1 <> p_step/);
    assert.match(sql,/p_command is distinct from v_commands\[p_step\]/);
    assert.match(sql,/FOR UPDATE/i);
    assert.match(sql,/clock_timestamp\(\)/);
    assert.match(sql,/on conflict\(user_id,seoul_day\) do update/);
    assert.match(sql,/where excluded\.elapsed_ms < current_best\.elapsed_ms/);
    assert.match(sql,/m\.is_active/);
    assert.match(sql,/where s\.user_id=p_user/);
    assert.match(sql,/raise exception 'implausibly_fast_step'/);
  });
  await test('only service_role invokes trusted RPC',()=>{
    assert.match(sql,/grant execute on function public\.start_ranked_run\(uuid\) to service_role/);
    assert.match(sql,/grant execute on function public\.submit_ranked_step\(uuid,uuid,integer,text\) to service_role/);
    assert.match(sql,/revoke all on function public\.start_ranked_run\(uuid\) from public, anon, authenticated/);
    assert.match(sql,/revoke all on function public\.submit_ranked_step\(uuid,uuid,integer,text\)\s+from public, anon, authenticated/);
    assert.match(sql,/private\.ranked_sessions enable row level security/);
    assert.match(sql,/revoke all on private\.ranked_sessions from public, anon, authenticated/);
    assert.doesNotMatch(source('dist/ranked-client.js'),/CLI_SUPABASE_SECRET_KEY|sb_secret_/);
    assert.match(server,/process\.env\.CLI_SUPABASE_SECRET_KEY/);
  });
  await test('original local engine, practice, UI, and leaderboard remain',()=>{
    assert.match(app,/cli-speedrun-best-v1/);
    assert.match(app,/e\.started=anchor\+3000/);
    assert.match(app,/e\.practice/);
    assert.match(app,/officialQueue/);
    assert.match(html,/id="resultRank"/);
    assert.match(html,/id="resultBest"/);
    assert.match(html,/id="resultDisclaimer"/);
    assert.match(html,/src="ranked-client\.js"/);
    assert.match(client,/auth\.getSession\(\)/);
    assert.match(client,/\/api\/ranked-start/);
    assert.match(client,/\/api\/ranked-step/);
    assert.doesNotMatch(client,/\.from\('ranked_runs'\)\.insert/);
  });
  const originalFetch=global.fetch;
  const originalEnv={
    CLI_SUPABASE_URL:process.env.CLI_SUPABASE_URL,
    CLI_SUPABASE_PUBLISHABLE_KEY:process.env.CLI_SUPABASE_PUBLISHABLE_KEY,
    CLI_SUPABASE_SECRET_KEY:process.env.CLI_SUPABASE_SECRET_KEY
  };
  const uid='11111111-1111-4111-8111-111111111111';
  const runId='22222222-2222-4222-8222-222222222222';
  const token='a'.repeat(80);
  const calls=[];
  function mockResponse(code,data){
    return {ok:code>=200&&code<300,status:code,async json(){return data}};
  }
  function responseObj(){
    return {code:null,body:null,headers:{},setHeader(key,value){this.headers[key]=value;return this},
      status(code){this.code=code;return this},json(body){this.body=body;return this}};
  }
  process.env.CLI_SUPABASE_URL=url;
  process.env.CLI_SUPABASE_PUBLISHABLE_KEY='sb_publishable_abc123';
  process.env.CLI_SUPABASE_SECRET_KEY='sb_secret_exampleREDACTED';
  try{
    global.fetch=async (target,options)=>{
      calls.push({url:target,headers:options.headers,body:options.body});
      if(target.endsWith('/auth/v1/user'))return mockResponse(200,{id:uid});
      if(target.endsWith('/rpc/start_ranked_run'))return mockResponse(200,runId);
      if(target.endsWith('/rpc/submit_ranked_step')){
        const data=JSON.parse(options.body);
        return mockResponse(200,{complete:data.p_step===10,verified_step:data.p_step});
      }
      throw new Error('unexpected fetch');
    };
    await test('missing token cannot invoke trusted database RPC',async()=>{
      const res=responseObj();
      await startHandler({method:'POST',headers:{}},res);
      assert.equal(res.code,401);
      assert.equal(calls.length,0);
    });
    await test('server verifies Auth user and uses admin key only internally',async()=>{
      const res=responseObj();
      await startHandler({method:'POST',headers:{authorization:'Bearer '+token}},res);
      assert.equal(res.code,200);
      assert.equal(res.body.run_id,runId);
      assert.equal(calls.length,2);
      assert.equal(calls[0].headers.apikey,process.env.CLI_SUPABASE_PUBLISHABLE_KEY);
      assert.equal(calls[1].headers.apikey,process.env.CLI_SUPABASE_SECRET_KEY);
      assert.equal(JSON.parse(calls[1].body).p_user,uid);
      assert.ok(!JSON.stringify(res.body).includes('secret'));
    });
    await test('malformed request blocked before Auth or SQL',async()=>{
      const before=calls.length;
      const res=responseObj();
      await stepHandler({method:'POST',headers:{authorization:'Bearer '+token},body:{run_id:runId,step:0,command:'x'}},res);
      assert.equal(res.code,400);
      assert.equal(calls.length,before);
    });
    await test('server step uses verified uid, run ID and exactly one command',async()=>{
      const res=responseObj();
      await stepHandler({method:'POST',headers:{authorization:'Bearer '+token},body:{run_id:runId,step:1,command:'node alpha'}},res);
      assert.equal(res.code,200);
      assert.equal(res.body.verified_step,1);
      const body=JSON.parse(calls.at(-1).body);
      assert.equal(body.p_user,uid);
      assert.equal(body.p_run,runId);
      assert.equal(body.p_step,1);
      assert.equal(body.p_command,'node alpha');
    });
    await test('server refuses client-supplied identity or completion time',async()=>{
      const res=responseObj();
      await stepHandler({method:'POST',headers:{authorization:'Bearer '+token},
        body:{run_id:runId,step:10,command:'node alpha',user_id:'spoof',elapsed_ms:1}},res);
      assert.equal(res.code,200);
      const body=JSON.parse(calls.at(-1).body);
      assert.equal(body.p_user,uid);
      assert.ok(!('elapsed_ms' in body));
      assert.ok(!('user_id' in body));
    });
  }finally{
    global.fetch=originalFetch;
    for(const [key,value] of Object.entries(originalEnv)){
      if(value===undefined)delete process.env[key];else process.env[key]=value;
    }
  }
  console.log(count+' Phase 3 static and mocked API checks passed; LIVE Browser/Auth/SQL integration NOT YET verified.');
};
runTests().catch(e=>{console.error(e);process.exitCode=1});
