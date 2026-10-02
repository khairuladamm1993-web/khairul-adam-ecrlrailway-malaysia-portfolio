-- Owner-only Cloudflare D1 console. No public read API or identity data.
-- Daily counters (including all supported metrics and dimensions).
SELECT day, metric, bucket, value FROM anonymous_daily_totals
WHERE day >= date('now','+8 hours','-29 days') ORDER BY day DESC, metric, bucket;

-- Most visited sections, excluding gateway screens.
SELECT bucket AS section, SUM(value) AS views FROM anonymous_daily_totals
WHERE metric = 'view' AND bucket NOT IN ('welcome','modes','ready')
AND day >= date('now','+8 hours','-29 days') GROUP BY bucket ORDER BY views DESC;

-- Duration summaries: seconds per completed document visit / per visit.
SELECT
1.0*SUM(CASE WHEN metric='duration_seconds' THEN value ELSE 0 END)/NULLIF(SUM(CASE WHEN metric='completed_visits' THEN value ELSE 0 END),0) AS average_elapsed_seconds,
1.0*SUM(CASE WHEN metric='active_seconds' THEN value ELSE 0 END)/NULLIF(SUM(CASE WHEN metric='visits' THEN value ELSE 0 END),0) AS average_engagement_seconds
FROM anonymous_daily_totals WHERE day >= date('now','+8 hours','-29 days');
