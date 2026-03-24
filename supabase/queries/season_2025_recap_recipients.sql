select
  lower(trim(au.email)) as email,
  coalesce(nullif(trim(pu.display_name), ''), split_part(au.email, '@', 1)) as display_name,
  count(distinct p.question_id) as prediction_count
from public.predictions p
join public.questions q
  on q.id = p.question_id
join auth.users au
  on au.id = p.user_id
left join public.users pu
  on pu.id = p.user_id
where q.season = 2025
  and au.email is not null
  and trim(au.email) <> ''
group by au.email, pu.display_name
order by prediction_count desc, email;
