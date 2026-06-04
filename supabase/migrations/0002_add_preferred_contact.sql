-- Preferred contact method captured on the quote form (Text / Email / Either).
alter table contacts add column if not exists preferred_contact text;
