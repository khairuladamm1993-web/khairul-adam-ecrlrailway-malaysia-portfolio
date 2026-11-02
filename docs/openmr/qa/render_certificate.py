"""Render the internal MR-S10 QA receipt; never infer PASS from READY."""
from pathlib import Path
import json,html
from reportlab.platypus import SimpleDocTemplate,Paragraph,Spacer,Table,TableStyle,KeepTogether
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet,ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
R=Path(__file__).resolve().parents[1]
x=json.loads((R/'certificate-data.json').read_text())
assert x['ci']['conclusion']=='success' and x['hosted']['passed']==4 and x['orientation']['passed']==2
assert x['security']['activeTemporaryGrants']==0 and x['security']['unauthenticatedHTTP']==302
assert x['ownerUAT']=='PENDING'
name='OPENMR-S10-INTEGRATED-RAILWAY-MAP-QA-CERTIFICATE-V1.0'
md=f'''# OPENMR-S10 — INTEGRATED RAILWAY MAP QA CERTIFICATE V1.0

**Internal QA record · MR-S10 Railway Systems**

- Product: OpenMR-S10Map — Official Protected Preview
- Owner: MR-S10 Railway Systems
- Scope: Malaysia, Singapore, Thailand; China source references remain a separate expansion phase.
- Build: {x['version']} on the accepted V8.1 catalogue
- Branch: `{x['branch']}`
- Deployed runtime SHA: `{x['runtimeSha']}`
- QA revision: `{x['qaSha']}` (later changes are QA-only; served runtime assets match current candidate bytes)
- Deployment: `{x['deploymentId']}`
- Issued: {x['issuedAt']}
- Tested URL: {x['url']}

**Decision: GO for Owner protected Preview UAT, with explicit source gaps. Owner UAT: PENDING.**

## Actual coverage

| Scope | Routes | Listed / mapped route–station associations |
|---|---:|---:|
| Malaysia | 21 | 395 / 371 |
| Singapore | 17 | 288 / 288 |
| Thailand | 6 | 59 / 17 |
| Total | 44 | 742 / 676 |

Counts are route–station associations, not unique physical stations. ECRL remains a separate default-on reference overlay. Its 37 assets and 25 reference points are not approved surveyed station/PL/depot GPS.

## QA verdicts

| Evidence | Result and scope |
|---|---|
| Source/regression/build | VERIFIED: 155/155 assertions PASS; final CI 11/11 jobs SUCCESS |
| Route-level matrix | VERIFIED within source/UI scope: 44 routes × 6 desktop/portrait cases; 7 affected routes × 4 landscape cases |
| Final delta browsers | VERIFIED: Chromium/WebKit desktop, iPhone/iPad portrait/landscape; 7 affected routes × 10 cases, plus global checks |
| Protected hosted browsers | VERIFIED: 4/4 functional cases on the official alias; Chromium/WebKit iPad portrait and iPhone landscape |
| GPS | VERIFIED WITH SIMULATED INPUT: granted-location API, blue marker, accuracy ring, low accuracy, error callbacks and style/filter/fullscreen persistence. Physical device GPS and real Safari permission prompts: NOT VERIFIED |
| Orientation | VERIFIED: 2/2 hosted engines; deliberate 15° keyboard rotation preserved on focus/close; Reset returns north-up/MRS10/ECRL |
| Camera/filter restoration | VERIFIED on settled pre-focus state, captured snapshot and restored state; stale fixed-delay expectations were corrected without changing deployed runtime |
| Preview protection | VERIFIED: HTTPS, exact served SHA/asset bytes, Vercel Authentication; unauthenticated HTTP 302; temporary test grant revoked |
| Auth/RLS/private coordinates | PRESERVED, not newly certified: R2.6 bytes and canonical navigation unchanged; zero Supabase calls in map tests; no private calibration export |
| Physical Owner Safari UAT | PENDING — no Owner PASS asserted |

## Geometry and operational status

154 retained OSM-source segments; **zero official/survey-verified physical segments**. RTS, Sentosa and Changi APM have directly associated partial source geometry. Fifty-five OSM segments lack accepted service association. Thirteen optional secondary approximate segments remain explicitly unverified. Most route alignments remain DATA GAP; lineups are not substituted with artificial station-to-station tracks.

Operational, under-construction, planned and MR-S10 proposal classes are separate from geometry evidence. RTS is under construction in the pinned source, with a cited February 2027 service target, not certified operational. Padang Besar transfers do not establish regular through KTMB–SRT service. Tebrau service adjacency is not an invented physical LineString. China references are excluded from MRS10.

## Performance observation and limits

CI Chromium sample: RAF callback p95 {x['performance']['callbackP95MS']:.1f} ms; maximum {x['performance']['callbackMaxMS']:.1f} ms. A long callback gap was observed; this is not a rendered-FPS or freeze-free certification. Across 72 filter transitions, DOM counts stayed {x['performance']['domCounts']}; post-GC heap samples were {[round(v/1e6,2) for v in x['performance']['heapBytes']]} MB. These short-run samples do not prove absence of long-duration leaks. WebKit heap metrics were unavailable.

Managed local WebKit screenshot capture was unsupported/crashed after functional checks; hosted WebKit functional runs deliberately omit that artifact step. CI WebKit capture steps passed; hosted Chromium screenshots are supplied. These distinctions are retained in evidence.

## Evidence

- [Release report](REPORT.md)
- [Route-by-route coverage](MY-SG-TH-COVERAGE.md)
- [Final CI](https://github.com/khairuladamm1993-web/khairul-adam-ecrlrailway-malaysia-portfolio/actions/runs/{x['ci']['run']})
- [Full route assertions, including the earlier global failure](evidence/full-route-assertions.json)
- [Final CI receipt](evidence/final-ci.json)
- [Hosted assets and exact build receipt](evidence/hosted-http-assets.json)
- [Hosted browser reports](evidence/)
- [PDF copy]({name}.pdf)

This is an internal MR-S10 QA record. It is **not government approval, official geospatial validation, an engineering survey, feasibility approval, or operational railway safety certification**. No private Owner coordinates, Production deployment or P02/P03 changes form part of this certificate.
'''
(R/(name+'.md')).write_text(md)
font='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
pdfmetrics.registerFont(TTFont('QA',font));pdfmetrics.registerFont(TTFont('QABold','/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'))
styles=getSampleStyleSheet();styles.add(ParagraphStyle(name='QA',fontName='QA',fontSize=9,leading=13,textColor=colors.HexColor('#183140'),spaceAfter=7));styles.add(ParagraphStyle(name='QATitle',fontName='QABold',fontSize=20,leading=25,textColor=colors.HexColor('#10314B'),spaceAfter=12));styles.add(ParagraphStyle(name='QAHeading',fontName='QABold',fontSize=11,leading=15,keepWithNext=True,textColor=colors.HexColor('#0D6269'),spaceBefore=10,spaceAfter=7));styles.add(ParagraphStyle(name='QASmall',parent=styles['QA'],fontSize=7.5,leading=11));
def p(t,style='QA'):return Paragraph(html.escape(str(t)).replace('\n','<br/>'),styles[style])
story=[p('MR-S10 RAILWAY SYSTEMS','QAHeading'),p('OPENMR-S10\nINTEGRATED RAILWAY MAP\nQA CERTIFICATE V1.0','QATitle'),p('INTERNAL QA RECORD  •  '+x['issuedAt'],'QASmall')]
badge=Table([[p('GO — PROTECTED PREVIEW OWNER UAT','QAHeading'),p('OWNER UAT: PENDING','QAHeading')]],colWidths=[310,190]);badge.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),colors.HexColor('#E4F3EE')),('BOX',(0,0),(-1,-1),1,colors.HexColor('#0D6269')),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),10)]));story+=[badge,Spacer(1,12)]
for label,value in [('Product / owner','OpenMR-S10Map / MR-S10 Railway Systems'),('Scope / build','Malaysia • Singapore • Thailand / '+x['version']),('Branch',x['branch']),('Deployed SHA',x['runtimeSha']),('QA revision',x['qaSha']),('Deployment',x['deploymentId']),('Official protected URL',x['url'])]:story.append(p(label+': '+value,'QASmall'))
story.append(p('Coverage and verified scope','QAHeading'))
coverage=[['Country','Routes','Listed / source points'],['Malaysia','21','395 / 371'],['Singapore','17','288 / 288'],['Thailand','6','59 / 17'],['TOTAL','44','742 / 676']]
t=Table([[p(c,'QASmall') for c in row] for row in coverage],colWidths=[190,90,220]);t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#E8EFF5')),('GRID',(0,0),(-1,-1),.3,colors.HexColor('#C3D1DC')),('VALIGN',(0,0),(-1,-1),'TOP'),('TOPPADDING',(0,0),(-1,-1),5)]));story+=[t,Spacer(1,8),p('Counts are route–station associations, not unique physical stations. ECRL is a default-on reference overlay; China source records remain a separate phase.','QASmall')]
for heading,text in [
('QA results','155 source/regression assertions PASS. Final CI: 11/11 jobs SUCCESS. Route-level checks: 44 × 6 desktop/portrait cases and 7 × 4 landscape cases. Final affected-route/global checks: 7 × 10 browser cases. Official protected hosted functional checks: 4/4 PASS. Hosted deliberate-rotation/reset checks: 2/2 PASS.'),
('GPS — simulation verified, physical UAT pending','Blue location marker, received accuracy circle, low accuracy, error callback states and style/filter/fullscreen persistence were tested with simulated coordinates. Foreground opt-in only; no location storage, background watch or calibration write. Physical iPhone/iPad GPS and real Safari permission prompts are NOT VERIFIED.'),
('Geometry and cross-border limits','154 OSM-source segments, zero official/survey-verified segments. Only RTS, Sentosa and Changi APM have directly assigned partial OSM geometry. 55 OSM segments have no service association; 13 optional approximate segments are not verified physical tracks. Most alignments remain DATA GAP. RTS remains under construction in the pinned source. Transfer, service adjacency, physical connection, planned works and proposals are distinct; no regular through-train is implied.'),
('Security and preservation','HTTPS and exact served runtime SHA/assets verified. Vercel Authentication retained; unauthenticated entry returns 302. Temporary test grant revoked. Canonical Auth R2.6 preserved; RLS/role behavior was not newly certified by these public-map checks. No Production, P02/P03, private Owner coordinate or paid-service changes.'),
('Performance observations',f"CI RAF callback p95 {x['performance']['callbackP95MS']:.1f} ms, max {x['performance']['callbackMaxMS']:.1f} ms; a long gap was observed. DOM stayed {x['performance']['domCounts']}; heap {[round(v/1e6,2) for v in x['performance']['heapBytes']]} MB over 72 transitions. These are short-run observations, not rendered-FPS, freeze-free or long-duration leak certification. WebKit heap was unavailable."),
('Evidence and remaining acceptance','Release report, route matrix, exact asset hashes, browser JSON and screenshots are stored beside this certificate in docs/openmr/. Final CI: https://github.com/khairuladamm1993-web/khairul-adam-ecrlrailway-malaysia-portfolio/actions/runs/'+str(x['ci']['run'])+'. Owner physical Safari acceptance remains PENDING. Managed WebKit native screenshot capture was unavailable; functional checks passed, CI captures passed and hosted Chromium images are supplied.')]:story+=[p(heading,'QAHeading'),p(text)]
repo='https://github.com/khairuladamm1993-web/khairul-adam-ecrlrailway-malaysia-portfolio'
links=[('Official protected Preview',x['url']),('Release report',repo+'/blob/'+x['branch']+'/docs/openmr/REPORT.md'),('Route coverage',repo+'/blob/'+x['branch']+'/docs/openmr/MY-SG-TH-COVERAGE.md'),('Evidence',repo+'/tree/'+x['branch']+'/docs/openmr/evidence'),('Final CI',repo+'/actions/runs/'+str(x['ci']['run']))]
for label,url in links:story.append(Paragraph('<link color="#0D6269" href="'+html.escape(url,quote=True)+'">'+html.escape(label)+'</link>',styles['QASmall']))
story+=[Spacer(1,12),p('NOT GOVERNMENT APPROVAL • NOT AN OFFICIAL GEOSPATIAL VALIDATION • NOT AN ENGINEERING SURVEY, FEASIBILITY APPROVAL OR OPERATIONAL RAILWAY SAFETY CERTIFICATION','QASmall')]
def footer(canvas,doc):
 canvas.setStrokeColor(colors.HexColor('#C3D1DC'));canvas.line(42,35,553,35);canvas.setFont('QA',7);canvas.setFillColor(colors.HexColor('#536C7D'));canvas.drawString(42,23,'MR-S10 internal QA · '+x['runtimeSha'][:12]+' · Owner UAT pending');canvas.drawRightString(553,23,str(doc.page))
SimpleDocTemplate(str(R/(name+'.pdf')),pagesize=(595.28,841.89),rightMargin=47,leftMargin=47,topMargin=40,bottomMargin=48,title='OPENMR-S10 — Integrated Railway Map QA Certificate V1.0',author='MR-S10 Railway Systems').build(story,onFirstPage=footer,onLaterPages=footer)
print(R/(name+'.pdf'))
