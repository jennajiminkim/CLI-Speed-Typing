const fs=require('node:fs'),assert=require('node:assert/strict');
const read=f=>fs.readFileSync(f,'utf8');
const migration=read('supabase/migrations/20261110_invite_auth.sql');
const rank=read('dist/leaderboard.js');
const auth=read('dist/invite-auth.js');
const config=read('api/public-config.js');
const app=read('dist/app.js');
const html=read('dist/index.html');
let passes=0;
function check(name,fn){fn();passes++;console.log('PASS '+name)}
check('invites and claims are restricted to verified users',()=>{
  assert.match(migration,/email_confirmed_at is not null/);
  assert.match(migration,/auth\.uid\(\)/);
  assert.match(migration,/sha256\(/);
  assert.match(migration,/used_count\s*<\s*c\.max_uses/);
  assert.match(migration,/on conflict \(user_id,window_start\)/);
  assert.match(migration,/grant execute on function public\.claim_invite\(text,text\) to authenticated/);
});
check('ranking is RLS protected and never browser writable',()=>{
  assert.match(migration,/alter table public\.ranked_runs enable row level security/);
  assert.match(migration,/ranked_runs_read_members_only/);
  assert.match(migration,/m\.is_active=true/);
  assert.match(migration,/grant select on public\.ranked_runs to authenticated/);
  assert.doesNotMatch(migration,/grant (?:insert|update|delete|all) on public\.ranked_runs to authenticated/i);
});
check('public config excludes secret server credentials',()=>{
  assert.match(config,/CLI_SUPABASE_PUBLISHABLE_KEY/);
  assert.match(config,/sb_publishable_/);
  assert.doesNotMatch(config,/process\.env\.(?:SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SECRET_KEY|CLI_SUPABASE_SECRET)/);
});
check('auth and leaderboard use real validated sessions',()=>{
  assert.match(auth,/signUp\(/);assert.match(auth,/signInWithPassword\(/);
  assert.match(auth,/auth\.getUser\(/);assert.match(auth,/claim_invite/);
  assert.match(rank,/auth\.getUser\(/);assert.match(rank,/invite_members/);
  assert.match(rank,/ranked_runs/);assert.match(rank,/td\.textContent=value/);
});
check('existing local Speedrun stays intact and leaderboard is gated',()=>{
  assert.match(html,/id="start"/);
  assert.match(app,/cli-speedrun-best-v1/);
  assert.match(app,/e\.index===bank\.length/);
  assert.match(app,/location\.assign\('leaderboard\.html'\)/);
});
console.log(passes+' static phase-2 contract checks passed; live RLS/email QA still required.');
