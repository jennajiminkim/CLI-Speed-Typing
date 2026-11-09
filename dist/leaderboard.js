import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.119.0?bundle';

const $=id=>document.getElementById(id);
if(localStorage.getItem('cli-theme')==='night') document.body.classList.add('night');
function seoulDate() {
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
  return ['year','month','day'].map(type=>parts.find(p=>p.type===type).value).join('-');
}
function denied(text) {
  $('rankContent').hidden=true;
  $('rankLocked').hidden=false;
  $('rankStatus').textContent=text;
}
function formatTime(ms) {
  const total=Math.floor(ms/10);
  const minutes=Math.floor(total/6000),seconds=Math.floor(total/100)%60,centis=total%100;
  return String(minutes).padStart(2,'0')+':'+String(seconds).padStart(2,'0')+'.'+String(centis).padStart(2,'0');
}
(async () => {
  const day=seoulDate();
  $('rankDate').textContent=day+' · ASIA/SEOUL';
  try {
    const response=await fetch('/api/public-config',{cache:'no-store'});
    if(!response.ok) return denied('랭킹 인증 서비스가 아직 설정되지 않았습니다.');
    const config=await response.json();
    if(!config.url || !config.key) return denied('랭킹 인증 서비스가 연결되지 않았습니다.');
    const client=createClient(config.url,config.key,{
      auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:'pkce'}
    });
    const {data:auth,error:authError}=await client.auth.getUser();
    if(authError || !auth?.user) return denied('로그인 후 초대 등록을 완료해주세요.');
    const {data:member,error:memberError}=await client.from('invite_members')
      .select('display_name,is_active').eq('user_id',auth.user.id).maybeSingle();
    if(memberError || !member?.is_active) return denied('유효한 초대 권한이 없습니다.');
    // The database RLS checks membership AGAIN. This client UI is not a security boundary.
    const {data:runs,error:runsError}=await client.from('ranked_runs')
      .select('user_id,display_name,elapsed_ms')
      .eq('seoul_day',day).order('elapsed_ms',{ascending:true})
      .order('user_id',{ascending:true}).limit(100);
    if(runsError) return denied('서버 랭킹 조회에 실패했습니다. RLS 및 데이터 API 설정을 확인해주세요.');
    $('rankLocked').hidden=true;
    $('rankContent').hidden=false;
    $('rankGreeting').textContent=member.display_name+' · 초대 인증 완료';
    $('rankRows').replaceChildren();
    for(const [i,run] of runs.entries()) {
      const tr=document.createElement('tr');
      for(const value of [String(i+1),run.display_name,formatTime(run.elapsed_ms)]) {
        const td=document.createElement('td');
        td.textContent=value; // Never render untrusted nicknames via innerHTML.
        tr.appendChild(td);
      }
      $('rankRows').appendChild(tr);
    }
    $('rankEmpty').hidden=runs.length>0;
    $('rankStatus').textContent=runs.length?'오늘의 서버 검증 기록 '+runs.length+'건':'랭킹 조회 권한이 확인되었습니다.';
  } catch {
    denied('서버에 연결하지 못했습니다. 네트워크 및 설정을 확인해주세요.');
  }
})();
