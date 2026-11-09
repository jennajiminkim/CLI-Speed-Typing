import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.119.0?bundle';

const byId = id => document.getElementById(id);
const next = new URLSearchParams(location.search).get('next') === 'leaderboard' ? 'leaderboard' : 'lobby';
const tabs = byId('authTabs');
const forms = { login: byId('loginForm'), signup: byId('signupForm') };
let client = null;
if (localStorage.getItem('cli-theme') === 'night') document.body.classList.add('night');

function message(text, error = false) {
  const box = byId('authMessage');
  box.textContent = text;
  box.dataset.error = String(error);
}
function panel(which) {
  tabs.hidden = !['login','signup'].includes(which);
  for (const [name,form] of Object.entries(forms)) form.hidden = name !== which;
  byId('claimSection').hidden = which !== 'claim';
  byId('memberSection').hidden = which !== 'member';
  byId('tabLogin').setAttribute('aria-pressed',String(which === 'login'));
  byId('tabSignup').setAttribute('aria-pressed',String(which === 'signup'));
  message('');
}
function busy(form, value) {
  const button = form.querySelector('button[type=submit]');
  button.disabled = value;
}
function publicError(error, fallback) {
  // Do not show raw authentication responses or leak whether an email exists.
  if (!error) return fallback;
  if (error.message?.includes('Email not confirmed')) return '이메일 인증을 완료한 후 로그인해주세요.';
  return fallback;
}
async function activeMember(user) {
  const {data,error} = await client.from('invite_members')
    .select('display_name,is_active').eq('user_id',user.id).maybeSingle();
  if (error) throw new Error('멤버 권한을 확인하지 못했습니다. 설정과 네트워크 연결을 확인해주세요.');
  return data?.is_active ? data : null;
}
async function refreshMember() {
  const {data,error} = await client.auth.getUser();
  if (error || !data?.user) { panel('login'); return; }
  const member = await activeMember(data.user);
  if (!member) {
    panel('claim');
    message('이메일 인증을 완료했다면 초대 코드를 등록해주세요.');
    return;
  }
  panel('member');
  byId('memberName').textContent = member.display_name;
  if (next === 'leaderboard') location.replace('leaderboard.html');
}
async function logout() {
  if (!client) return;
  const {error} = await client.auth.signOut();
  if (error) { message('로그아웃에 실패했습니다. 다시 시도해주세요.',true); return; }
  panel('login');
}
function checkedInvite(input) {
  return /^[a-f0-9]{32}$/i.test(input.trim());
}
function checkedName(input) {
  return /^[A-Za-z0-9가-힣_-]{2,16}$/.test(input.trim());
}
byId('tabLogin').onclick = () => panel('login');
byId('tabSignup').onclick = () => panel('signup');
byId('claimSignout').onclick = logout;
byId('memberSignout').onclick = logout;

forms.login.addEventListener('submit',async event => {
  event.preventDefault();
  if (!client) return message('인증 서비스가 준비되지 않았습니다.',true);
  busy(forms.login,true);
  const email=byId('loginEmail').value.trim();
  const password=byId('loginPassword').value;
  try {
    const {error} = await client.auth.signInWithPassword({email,password});
    if (error) return message(publicError(error,'로그인할 수 없습니다. 계정 정보와 이메일 인증 상태를 확인해주세요.'),true);
    byId('loginPassword').value='';
    await refreshMember();
  } catch { message('로그인 중 문제가 발생했습니다. 다시 시도해주세요.',true); }
  finally { busy(forms.login,false); }
});
forms.signup.addEventListener('submit',async event => {
  event.preventDefault();
  if (!client) return message('인증 서비스가 준비되지 않았습니다.',true);
  const email=byId('signupEmail').value.trim();
  const password=byId('signupPassword').value;
  const code=byId('signupInvite').value.trim();
  const nickname=byId('signupNickname').value.trim();
  if (!checkedInvite(code) || !checkedName(nickname) || password.length<8) {
    return message('초대 코드는 32자리 영숫자(16진수), 닉네임은 2–16자여야 합니다.',true);
  }
  busy(forms.signup,true);
  try {
    const {error} = await client.auth.signUp({
      email,password,options:{emailRedirectTo:location.origin+'/auth.html'}
    });
    if (error) return message('계정 생성 요청에 실패했습니다. 이메일 형식과 비밀번호를 확인해주세요.',true);
    // Do not persist invite codes or passwords in localStorage or in a URL.
    byId('signupPassword').value='';
    byId('signupInvite').value='';
    message('이메일로 발송된 인증 링크를 확인해주세요. 인증 완료 후 로그인하여 초대 코드를 다시 등록합니다.');
  } catch { message('가입 요청 중 문제가 발생했습니다. 다시 시도해주세요.',true); }
  finally { busy(forms.signup,false); }
});
byId('claimForm').addEventListener('submit',async event => {
  event.preventDefault();
  if (!client) return message('인증 서비스가 준비되지 않았습니다.',true);
  const form=byId('claimForm');
  const code=byId('claimInvite').value.trim();
  const nickname=byId('claimNickname').value.trim();
  if (!checkedInvite(code) || !checkedName(nickname))
    return message('초대 코드는 32자리 16진수, 닉네임은 한글·영문·숫자·_- 2–16자로 입력해주세요.',true);
  busy(form,true);
  try {
    const {data,error} = await client.rpc('claim_invite',{
      p_code:code,p_display_name:nickname
    });
    if (error || data !== true)
      return message('초대 코드를 등록하지 못했습니다. 코드의 유효 기간·사용 여부·이메일 인증을 확인해주세요.',true);
    byId('claimInvite').value='';
    await refreshMember();
  } catch { message('초대 확인 중 문제가 발생했습니다. 다시 시도해주세요.',true); }
  finally { busy(form,false); }
});

(async function init() {
  panel('login');
  try {
    const response=await fetch('/api/public-config',{cache:'no-store'});
    if (!response.ok) throw new Error('missing_config');
    const config=await response.json();
    if (!config.url || !/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(config.url)
        || !config.key?.startsWith('sb_publishable_'))
      throw new Error('invalid_config');
    client=createClient(config.url,config.key,{
      auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:'pkce'}
    });
    await refreshMember();
  } catch {
    message('친구 로그인 개발 환경이 아직 연결되지 않았습니다. 관리자에게 Supabase Preview 설정을 요청해주세요.',true);
  }
})();
