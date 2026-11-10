import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.119.0?bundle';

const byId = id => document.getElementById(id);
const next = new URLSearchParams(location.search).get('next') === 'leaderboard' ? 'leaderboard' : 'lobby';
const tabs = byId('authTabs');
const forms = {login:byId('loginForm'),invite:byId('inviteForm'),signup:byId('signupForm')};
let client = null;
let verifiedInvite = null; // Memory only: never persist an invitation in browser storage or in URL.
try {
  if (localStorage.getItem('cli-theme') === 'night') document.body.classList.add('night');
} catch {}

function message(text,error=false) {
  const box=byId('authMessage');
  box.textContent=text;
  box.dataset.error=String(error);
}
function resetInvite() {
  verifiedInvite=null;
  byId('inviteCode').value='';
}
function panel(which) {
  tabs.hidden = !['login','invite','signup'].includes(which);
  for(const [name,form] of Object.entries(forms)) form.hidden = name!==which;
  byId('claimSection').hidden = which!=='claim';
  byId('memberSection').hidden = which!=='member';
  byId('tabLogin').setAttribute('aria-pressed',String(which==='login'));
  byId('tabSignup').setAttribute('aria-pressed',String(which==='invite'||which==='signup'));
  message('');
}
function busy(form,value) {
  const button=form.querySelector('button[type=submit]');
  if(button) button.disabled=value;
}
function validCode(s){return /^[A-HJ-NP-Z2-9]{12}$/.test(s);}
function validName(s){return /^[A-Za-z0-9가-힣_-]{2,16}$/.test(s);}
async function memberOf(user) {
  const {data,error}=await client.from('invite_members')
    .select('display_name,is_active').eq('user_id',user.id).maybeSingle();
  if(error) throw new Error('member_lookup_failed');
  return data?.is_active ? data : null;
}
async function refreshMember(){
  const {data,error}=await client.auth.getUser();
  if(error || !data?.user) {resetInvite();panel('login');return;}
  const member=await memberOf(data.user);
  if(!member) {
    resetInvite();
    panel('claim');
    message('친구 랭킹을 이용하려면 유효한 초대 코드를 등록해주세요.');
    return;
  }
  resetInvite();
  panel('member');
  byId('memberName').textContent=member.display_name;
  if(next==='leaderboard') location.replace('leaderboard.html');
}
async function logout(){
  if(!client) return;
  const {error}=await client.auth.signOut();
  if(error) return message('로그아웃에 실패했습니다. 다시 시도해주세요.',true);
  resetInvite();panel('login');
}
async function checkCode(code){
  const {data,error}=await client.rpc('check_invite',{p_code:code});
  if(error) throw error;
  return data===true;
}
async function claimCode(code,nickname){
  const {data,error}=await client.rpc('claim_invite',{
    p_code:code,p_display_name:nickname
  });
  return !error && data===true;
}
byId('tabLogin').onclick=()=>{resetInvite();panel('login');};
byId('tabSignup').onclick=()=>{resetInvite();panel('invite');};
byId('changeInvite').onclick=()=>{resetInvite();panel('invite');};
byId('claimSignout').onclick=logout;
byId('memberSignout').onclick=logout;
for(const id of ['inviteCode','claimInvite']){
  byId(id).addEventListener('input',ev=>{ ev.target.value=ev.target.value.toUpperCase(); });
}

forms.login.addEventListener('submit',async ev=>{
  ev.preventDefault();
  if(!client) return message('인증 서비스가 준비되지 않았습니다.',true);
  busy(forms.login,true);
  try {
    const {error}=await client.auth.signInWithPassword({
      email:byId('loginEmail').value.trim(),
      password:byId('loginPassword').value
    });
    if(error) return message('로그인에 실패했습니다. 계정·비밀번호와 서버 인증 설정을 확인해주세요.',true);
    byId('loginPassword').value='';
    await refreshMember();
  }catch{message('로그인 요청이 실패했습니다. 다시 시도해주세요.',true);}
  finally{busy(forms.login,false);}
});

forms.invite.addEventListener('submit',async ev=>{
  ev.preventDefault();
  if(!client) return message('인증 서비스가 준비되지 않았습니다.',true);
  const code=byId('inviteCode').value.trim().toUpperCase();
  if(!validCode(code)) return message('초대 코드는 영문·숫자 12자리입니다. I, O, 0, 1은 사용하지 않습니다.',true);
  busy(forms.invite,true);
  try {
    if(!(await checkCode(code))) {
      resetInvite();
      return message('사용할 수 없는 초대 코드입니다. 만료 또는 사용 여부를 확인해주세요.',true);
    }
    verifiedInvite=code;
    byId('inviteCode').value='';
    panel('signup');
    message('초대 코드가 확인되었습니다. 계정 정보를 입력해주세요.');
  }catch{resetInvite();message('초대 검증에 실패했습니다. 관리자에게 서버 설정을 확인해주세요.',true);}
  finally{busy(forms.invite,false);}
});

forms.signup.addEventListener('submit',async ev=>{
  ev.preventDefault();
  if(!client) return message('인증 서비스가 준비되지 않았습니다.',true);
  if(!verifiedInvite){panel('invite');return message('초대 코드를 먼저 확인해주세요.',true);}
  const code=verifiedInvite;
  const email=byId('signupEmail').value.trim();
  const password=byId('signupPassword').value;
  const nickname=byId('signupNickname').value.trim();
  if(!validName(nickname)||password.length<8)
    return message('닉네임은 2–16자, 비밀번호는 8자 이상이어야 합니다.',true);
  busy(forms.signup,true);
  try {
    // A precheck never reserves a code. Check again right before account creation.
    if(!(await checkCode(code))) {
      resetInvite();panel('invite');
      return message('초대 코드가 만료되었거나 이미 사용되었습니다. 새 코드를 확인해주세요.',true);
    }
    const {data,error}=await client.auth.signUp({email,password});
    byId('signupPassword').value='';
    if(error) return message('회원가입에 실패했습니다. 이메일과 비밀번호를 확인해주세요.',true);
    if(!data?.session) {
      resetInvite();panel('login');
      return message('서버에서 이메일 인증이 요구되고 있습니다. 관리자에게 Supabase Confirm Email 설정을 확인해주세요. 가입은 대기 상태일 수 있습니다.',true);
    }
    // Only this authenticated RPC can create membership and consume the code.
    const claimed=await claimCode(code,nickname);
    resetInvite();
    if(!claimed){
      panel('claim');
      return message('계정은 생성되었지만 초대 등록을 완료하지 못했습니다. 유효한 코드를 다시 등록해주세요. 랭킹 접근은 차단된 상태입니다.',true);
    }
    await refreshMember();
  }catch{
    resetInvite();panel('claim');
    message('가입 처리 중 문제가 발생했습니다. 초대 등록 상태를 확인하고 재시도해주세요.',true);
  }finally{busy(forms.signup,false);}
});

byId('claimForm').addEventListener('submit',async ev=>{
  ev.preventDefault();
  if(!client) return message('인증 서비스가 준비되지 않았습니다.',true);
  const code=byId('claimInvite').value.trim().toUpperCase();
  const nickname=byId('claimNickname').value.trim();
  if(!validCode(code)||!validName(nickname))
    return message('초대 코드는 영문·숫자 12자리(I, O, 0, 1 제외), 닉네임은 2–16자로 입력해주세요.',true);
  const form=byId('claimForm');
  busy(form,true);
  try{
    if(!(await claimCode(code,nickname))) return message('초대 등록에 실패했습니다. 코드를 확인해주세요.',true);
    byId('claimInvite').value='';
    await refreshMember();
  }catch{message('초대 등록 요청에 실패했습니다.',true);}
  finally{busy(form,false);}
});

(async function init(){
  panel('login');
  try{
    const response=await fetch('/api/public-config',{cache:'no-store'});
    if(!response.ok) throw new Error('missing_config');
    const config=await response.json();
    if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(config.url||'') ||
       !/^sb_publishable_[A-Za-z0-9_-]+$/.test(config.key||'')) throw new Error('invalid_config');
    client=createClient(config.url,config.key,{
      auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:'pkce'}
    });
    await refreshMember();
  }catch{
    message('친구 로그인 연결이 아직 준비되지 않았습니다. Preview 환경 변수와 데이터베이스 설정을 확인해주세요.',true);
  }
})();
