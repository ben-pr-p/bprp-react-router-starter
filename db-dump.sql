--
-- PostgreSQL database dump
--

-- Dumped from database version 16.3 (PGlite 0.2.0)
-- Dumped by pg_dump version 16.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'SQL_ASCII';
SET standard_conforming_strings = off;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET escape_string_warning = off;
SET row_security = off;

--
-- Name: graphile_migrate; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA graphile_migrate;


ALTER SCHEMA graphile_migrate OWNER TO postgres;

--
-- Name: widgets; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA widgets;


ALTER SCHEMA widgets OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: current; Type: TABLE; Schema: graphile_migrate; Owner: postgres
--

CREATE TABLE graphile_migrate.current (
    filename text DEFAULT 'current.sql'::text NOT NULL,
    content text NOT NULL,
    date timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE ONLY graphile_migrate.current ALTER COLUMN filename SET STATISTICS 0;
ALTER TABLE ONLY graphile_migrate.current ALTER COLUMN content SET STATISTICS 0;
ALTER TABLE ONLY graphile_migrate.current ALTER COLUMN date SET STATISTICS 0;


ALTER TABLE graphile_migrate.current OWNER TO postgres;

--
-- Name: migrations; Type: TABLE; Schema: graphile_migrate; Owner: postgres
--

CREATE TABLE graphile_migrate.migrations (
    hash text NOT NULL,
    previous_hash text,
    filename text NOT NULL,
    date timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE ONLY graphile_migrate.migrations ALTER COLUMN hash SET STATISTICS 0;
ALTER TABLE ONLY graphile_migrate.migrations ALTER COLUMN previous_hash SET STATISTICS 0;
ALTER TABLE ONLY graphile_migrate.migrations ALTER COLUMN filename SET STATISTICS 0;
ALTER TABLE ONLY graphile_migrate.migrations ALTER COLUMN date SET STATISTICS 0;


ALTER TABLE graphile_migrate.migrations OWNER TO postgres;

--
-- Name: widget; Type: TABLE; Schema: widgets; Owner: postgres
--

CREATE TABLE widgets.widget (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL
);
ALTER TABLE ONLY widgets.widget ALTER COLUMN id SET STATISTICS 0;
ALTER TABLE ONLY widgets.widget ALTER COLUMN name SET STATISTICS 0;


ALTER TABLE widgets.widget OWNER TO postgres;

--
-- Data for Name: current; Type: TABLE DATA; Schema: graphile_migrate; Owner: postgres
--

INSERT INTO graphile_migrate.current VALUES ('current.sql', '-- Enter migration here
create schema widgets;

create table widgets.widget (
  id uuid primary key default gen_random_uuid(),
  name text not null
);
', '2025-07-07 15:48:11.102+00');


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: graphile_migrate; Owner: postgres
--



--
-- Data for Name: widget; Type: TABLE DATA; Schema: widgets; Owner: postgres
--



--
-- Name: current current_pkey; Type: CONSTRAINT; Schema: graphile_migrate; Owner: postgres
--

ALTER TABLE ONLY graphile_migrate.current
    ADD CONSTRAINT current_pkey PRIMARY KEY (filename);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: graphile_migrate; Owner: postgres
--

ALTER TABLE ONLY graphile_migrate.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (hash);


--
-- Name: widget widget_pkey; Type: CONSTRAINT; Schema: widgets; Owner: postgres
--

ALTER TABLE ONLY widgets.widget
    ADD CONSTRAINT widget_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_previous_hash_fkey; Type: FK CONSTRAINT; Schema: graphile_migrate; Owner: postgres
--

ALTER TABLE ONLY graphile_migrate.migrations
    ADD CONSTRAINT migrations_previous_hash_fkey FOREIGN KEY (previous_hash) REFERENCES graphile_migrate.migrations(hash);


--
-- PostgreSQL database dump complete
--

