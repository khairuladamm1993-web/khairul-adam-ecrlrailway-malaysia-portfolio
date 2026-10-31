from pathlib import Path
import re
p=Path('supabase/config.toml');s=p.read_text()
def setting(section,key,value):
 global s
 pattern=r'(?ms)(^\['+re.escape(section)+r'\]\n)(.*?)(?=^\[|\Z)'
 def change(m):
  body=m[2];line=key+' = '+value+'\n'
  body=re.sub(r'(?m)^'+re.escape(key)+r'\s*=.*\n',line,body) if re.search(r'(?m)^'+re.escape(key)+r'\s*=',body) else body+line
  return m[1]+body
 if re.search(pattern,s):s=re.sub(pattern,change,s)
 else:s+='\n['+section+']\n'+key+' = '+value+'\n'
setting('auth','site_url','"https://127.0.0.1:8767"')
setting('auth.email','otp_length','6');setting('auth.email','otp_expiry','5');setting('auth.email','max_frequency','"1s"')
setting('auth.email.template.magic_link','content_path','"./supabase/otp.html"')
setting('auth.mfa.totp','enroll_enabled','true');setting('auth.mfa.totp','verify_enabled','true')
setting('auth.rate_limit','email_sent','1000');setting('auth.rate_limit','token_verifications','1000')
p.write_text(s);Path('supabase/otp.html').write_text('<p>MR-S10-OTP: {{ .Token }}</p>')
