// Public browser-only configuration. NEVER return a service_role or secret key.
module.exports = function handler(req,res) {
  res.setHeader('Cache-Control','no-store, max-age=0');
  if(req.method!=='GET') return res.status(405).json({error:'method_not_allowed'});
  const url=process.env.CLI_SUPABASE_URL || '';
  const key=process.env.CLI_SUPABASE_PUBLISHABLE_KEY || '';
  if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url)
      || !/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) {
    return res.status(503).json({configured:false});
  }
  return res.status(200).json({url,key});
};
