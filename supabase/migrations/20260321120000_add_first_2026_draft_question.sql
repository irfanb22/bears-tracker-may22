/*
  # Add first 2026 draft question

  - Creates the first 2026 season question
  - Keeps it in `pending` status so it shows as coming soon
  - Seeds a few placeholder multiple-choice options that can be edited later
*/

INSERT INTO public.questions (
  id,
  text,
  category,
  season,
  question_type,
  deadline,
  featured,
  status
)
VALUES (
  'f6a8dc28-c6d7-4ba2-9492-437292ec0d2f',
  'Which position will the Bears pick with the 25th pick?',
  'draft_predictions',
  2026,
  'multiple_choice',
  '2026-04-23T13:00:00-05:00',
  false,
  'pending'
)
ON CONFLICT (id) DO UPDATE
SET
  text = EXCLUDED.text,
  category = EXCLUDED.category,
  season = EXCLUDED.season,
  question_type = EXCLUDED.question_type,
  deadline = EXCLUDED.deadline,
  featured = EXCLUDED.featured,
  status = EXCLUDED.status;

INSERT INTO public.choices (question_id, text)
SELECT 'f6a8dc28-c6d7-4ba2-9492-437292ec0d2f', choice_text
FROM (
  VALUES
    ('Offensive Line'),
    ('Defensive Line'),
    ('Secondary'),
    ('Linebacker')
) AS seeded_choices(choice_text)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.choices existing
  WHERE existing.question_id = 'f6a8dc28-c6d7-4ba2-9492-437292ec0d2f'
    AND existing.text = seeded_choices.choice_text
);
