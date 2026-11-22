-- MR-S10 P01 ECRL integrity probe · READ ONLY
-- Run only as SELECT. This is an evidence diagnostic, NOT a GIS geometry generator.
with corridor as (
  select id,body::jsonb as body
  from public.member_content
  where kind='corridor' and approved=true
), parsed as (
  select id,body,
    body->>'chainage' as ch,
    case when body->>'chainage' ~ '^CH[0-9]{3}[+][0-9]{3}$'
      then substring(body->>'chainage' from 3 for 3)::integer*1000
        + right(body->>'chainage',3)::integer
    end as chainage_metres
  from corridor
)
select count(*) as approved_assets,
  count(chainage_metres) as parseable_chainages,
  count(distinct chainage_metres) as unique_chainages,
  count(*) filter(where ch is null) as missing_chainages,
  count(*) filter(where ch is not null and chainage_metres is null) as invalid_chainages,
  min(chainage_metres) as first_chainage_metres,
  max(chainage_metres) as last_chainage_metres,
  count(*) filter(where body ? 'geometry' or body ? 'geojson'
    or body ? 'alignment' or body ? 'routeGeometry') as route_geometry_records,
  count(*) filter(where body ? 'surveySource' or body ? 'geospatialSource') as survey_source_records,
  count(*) filter(where body ? 'sourceReferences') as source_reference_records
from parsed;
