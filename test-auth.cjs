const fs=require('node:fs'),assert=require('node:assert/strict');
const read=f=>fs.readFileSync(f,'utf8');
const migration=read('supabase/migrations/20261110_invite_auth.sql');
const precheck=read('supabase/migrations/20261110_invite_precheck.sql');
const shortened=read('supabase/migrations/20261110_invite_short_codes.sql');
const styles=read('dist/auth.css');
const {generateInviteCode,insertSqlFor,ALPHABET,CODE_LENGTH}=require('./scripts/generate-invite-code.cjs');
const rank=read('dist/leaderboard.js');
const auth=read('dist/invite-auth.js');
const authHtml=read('dist/auth.html');
const config=read('api/public-config.js');
const app=read('dist/app.js');
const html=read('dist/index.html');
let passes=0;
function check(name,fn){fn();passes++;console.log('PASS '+name)}
check('invite-first signup screens use a separate code check',()=>{
  assert.match(authHtml,/id="inviteForm"/);
  assert.match(authHtml,/id="signupForm"/);
  assert.match(authHtml,/id="loginForm"/);
  assert.match(auth,/client\.rpc\('check_invite'/);
  assert.match(auth,/panel\('signup'\)/);
  assert.match(auth,/let verifiedInvite = null/);
  assert.match(auth,/verifiedInvite=null/);
  assert.doesNotMatch(auth,/localStorage\.setItem\(.+invite/i);
});
check('precheck tests private code validity, but cannot grant membership',()=>{
  assert.match(precheck,/create or replace function public\.check_invite/);
  assert.match(precheck,/grant execute on function public\.check_invite\(text\) to anon, authenticated/);
  assert.match(precheck,/private\.invite_codes/);
  assert.match(precheck,/c\.revoked_at is null/);
  assert.match(precheck,/c\.used_count < c\.max_uses/);
  assert.doesNotMatch(precheck,/insert into public\.invite_members/i);
});
check('signup requires a live session before claiming membership',()=>{
  assert.match(auth,/client\.auth\.signUp\(\{email,password\}\)/);
  assert.match(auth,/if\(!data\?\.session\)/);
  assert.match(auth,/const claimed=await claimCode\(code,nickname\)/);
  assert.match(auth,/if\(!claimed\)/);
  assert.match(auth,/client\.auth\.getUser\(\)/);
  assert.match(auth,/client\.auth\.signInWithPassword\(/);
  assert.match(migration,/auth\.uid\(\)/);
  assert.match(migration,/email_confirmed_at is not null/);
  assert.match(migration,/used_count=used_count\+1/);
});
check('private invite and membership access remains server-enforced',()=>{
  assert.match(migration,/alter table public\.ranked_runs enable row level security/);
  assert.match(migration,/ranked_runs_read_members_only/);
  assert.match(migration,/m\.is_active=true/);
  assert.match(migration,/grant select on public\.ranked_runs to authenticated/);
  assert.doesNotMatch(migration,/grant (?:insert|update|delete|all) on public\.ranked_runs to authenticated/i);
});
check('API config exposes only publishable credentials',()=>{
  assert.match(config,/CLI_SUPABASE_PUBLISHABLE_KEY/);
  assert.match(config,/sb_publishable_/);
  assert.doesNotMatch(config,/process\.env\.(?:SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SECRET_KEY|CLI_SUPABASE_SECRET)/);
});
check('ranking reads server-protected records with member identity',()=>{
  assert.match(rank,/auth\.getUser\(\)/);
  assert.match(rank,/invite_members/);
  assert.match(rank,/ranked_runs/);
  assert.match(rank,/td\.textContent=value/);
});
check('Speedrun remains local and lobby links to separate leaderboard',()=>{
  assert.match(html,/id="start"/);
  assert.match(app,/cli-speedrun-best-v1/);
  assert.match(app,/e\.index===bank\.length/);
  assert.match(app,/location\.assign\('leaderboard\.html'\)/);
});
check('new 12-char code input matches server validation and compact UI',()=>{
  assert.match(authHtml,/maxlength="12" pattern="\[A-HJ-NP-Za-hj-np-z2-9\]\{12\}"/);
  assert.equal((authHtml.match(/class="authCodeInput"/g)||[]).length,2);
  assert.match(styles,/#inviteForm \.authCodeInput,#claimForm \.authCodeInput/);
  assert.match(styles,/width:min\(100%,312px\)/);
  assert.match(auth,/function validCode\(s\)\{return \/\^\[A-HJ-NP-Z2-9\]\{12\}\$\//);
  assert.match(shortened,/create or replace function public\.check_invite/);
  assert.match(shortened,/create or replace function public\.claim_invite/);
  assert.equal((shortened.match(/\^\[A-HJ-NP-Z2-9\]\{12\}\$/g)||[]).length,2);
  assert.doesNotMatch(authHtml,/maxlength="32"|32자리/);
  assert.doesNotMatch(auth,/32자리/);
});
check('cryptographic 12-char generator matches server alphabet and hashes secrets',()=>{
  assert.equal(CODE_LENGTH,12);
  assert.equal(ALPHABET.length,32);
  assert.equal(new Set(ALPHABET).size,32);
  const codes=new Set();
  for(let i=0;i<100;i++){
    const code=generateInviteCode();
    assert.match(code,/^[A-HJ-NP-Z2-9]{12}$/);
    assert.match(insertSqlFor(code),/^[\s\S]*[a-f0-9]{64}[\s\S]*$/);
    assert.doesNotMatch(insertSqlFor(code),new RegExp(code));
    codes.add(code);
  }
  assert.equal(codes.size,100);
});
console.log(passes+' phase-2 static contract checks passed. Live Auth and RLS tests remain required.');
