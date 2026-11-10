// Run only on a trusted local machine; the invite code is a bearer secret.
// node scripts/generate-invite-code.cjs
const { randomInt, createHash } = require('node:crypto');
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 12;
function generateInviteCode() {
  return Array.from({length: CODE_LENGTH}, () => ALPHABET[randomInt(ALPHABET.length)]).join('');
}
function insertSqlFor(code) {
  if (!new RegExp('^[A-HJ-NP-Z2-9]{12}$').test(code)) throw new TypeError('Invalid invite code');
  const digest=createHash('sha256').update(code,'utf8').digest('hex');
  // Only the SHA-256 digest, not the invite code, is inserted into the database.
  return "insert into private.invite_codes(code_sha256, max_uses, expires_at) values ('" + digest + "', 1, now() + interval '14 days');";
}
if (require.main === module) {
  const code=generateInviteCode();
  process.stdout.write('PRIVATE INVITE CODE (share once, never commit): '+code+'\n\n');
  process.stdout.write('SQL for the dedicated Supabase project (digest only):\n'+insertSqlFor(code)+'\n');
}
module.exports={generateInviteCode,insertSqlFor,ALPHABET,CODE_LENGTH};
