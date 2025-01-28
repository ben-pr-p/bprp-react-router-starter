-- Enter migration here
create schema widgets;

create table widgets.widget (
  id uuid primary key default gen_random_uuid(),
  name text not null
);
