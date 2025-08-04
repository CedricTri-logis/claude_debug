SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."audit_log_entries" ("instance_id", "id", "payload", "created_at", "ip_address") VALUES
	('00000000-0000-0000-0000-000000000000', '7262efa6-cb69-408a-9729-46ceb6a68634', '{"action":"user_confirmation_requested","actor_id":"a35ec57d-ca9c-46c9-bfe9-b03c1bb1ddf2","actor_username":"cedric@tri-logis.ca","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}', '2025-07-22 20:41:12.329808+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a490f62d-6ff4-4aa7-b298-6eedf54adb5c', '{"action":"user_signedup","actor_id":"a35ec57d-ca9c-46c9-bfe9-b03c1bb1ddf2","actor_username":"cedric@tri-logis.ca","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2025-07-22 20:41:55.820917+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd48e10f5-634e-4a99-badb-c98dab201979', '{"action":"login","actor_id":"a35ec57d-ca9c-46c9-bfe9-b03c1bb1ddf2","actor_username":"cedric@tri-logis.ca","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-07-22 20:42:02.814554+00', ''),
	('00000000-0000-0000-0000-000000000000', '981de1b5-d418-4605-8e9e-af2b3f4e901d', '{"action":"login","actor_id":"a35ec57d-ca9c-46c9-bfe9-b03c1bb1ddf2","actor_username":"cedric@tri-logis.ca","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-07-22 20:42:05.201963+00', ''),
	('00000000-0000-0000-0000-000000000000', '564191a3-cdeb-4afa-bf91-31ad4dcd26c4', '{"action":"login","actor_id":"a35ec57d-ca9c-46c9-bfe9-b03c1bb1ddf2","actor_username":"cedric@tri-logis.ca","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-07-22 20:44:23.267668+00', ''),
	('00000000-0000-0000-0000-000000000000', '90a98894-98b1-4baf-b13a-be205997bdb0', '{"action":"login","actor_id":"a35ec57d-ca9c-46c9-bfe9-b03c1bb1ddf2","actor_username":"cedric@tri-logis.ca","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-07-22 20:50:18.368523+00', ''),
	('00000000-0000-0000-0000-000000000000', '2078b082-ba59-4260-8bb1-b53d7e53954d', '{"action":"logout","actor_id":"a35ec57d-ca9c-46c9-bfe9-b03c1bb1ddf2","actor_username":"cedric@tri-logis.ca","actor_via_sso":false,"log_type":"account"}', '2025-07-22 20:50:26.707601+00', ''),
	('00000000-0000-0000-0000-000000000000', '777be78f-40c6-42ad-b463-f3e59395850a', '{"action":"login","actor_id":"a35ec57d-ca9c-46c9-bfe9-b03c1bb1ddf2","actor_username":"cedric@tri-logis.ca","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-07-22 20:58:11.987708+00', ''),
	('00000000-0000-0000-0000-000000000000', 'bcd07a58-d47e-4cc6-9492-ac87c61042df', '{"action":"logout","actor_id":"a35ec57d-ca9c-46c9-bfe9-b03c1bb1ddf2","actor_username":"cedric@tri-logis.ca","actor_via_sso":false,"log_type":"account"}', '2025-07-22 20:58:20.280024+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b68532b1-e4be-4509-b503-969ecdf716eb', '{"action":"login","actor_id":"a35ec57d-ca9c-46c9-bfe9-b03c1bb1ddf2","actor_username":"cedric@tri-logis.ca","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-07-22 21:00:08.991762+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e1936237-0519-4187-9dca-dc8a8ce9d671', '{"action":"login","actor_id":"a35ec57d-ca9c-46c9-bfe9-b03c1bb1ddf2","actor_username":"cedric@tri-logis.ca","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-07-22 22:42:06.590796+00', '');


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."flow_state" ("id", "user_id", "auth_code", "code_challenge_method", "code_challenge", "provider_type", "provider_access_token", "provider_refresh_token", "created_at", "updated_at", "authentication_method", "auth_code_issued_at") VALUES
	('5df40d07-cc8a-498b-b0a9-567ea807b10c', 'a35ec57d-ca9c-46c9-bfe9-b03c1bb1ddf2', '8cc80c6d-3624-456f-bf55-5ec40174fa04', 's256', 'kQ9BOT7SR4vOI9_s_RZoFXdjbD2WOBsX-9Coox-oah0', 'email', '', '', '2025-07-22 20:41:12.332284+00', '2025-07-22 20:41:55.82644+00', 'email/signup', '2025-07-22 20:41:55.826399+00');


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
	('00000000-0000-0000-0000-000000000000', 'a35ec57d-ca9c-46c9-bfe9-b03c1bb1ddf2', 'authenticated', 'authenticated', 'cedric@tri-logis.ca', '$2a$10$hzk994tr/hk71zeiE7jDueG04D3g35/mjKxU5A7EzyXnSc4ROOM0W', '2025-07-22 20:41:55.82161+00', NULL, '', '2025-07-22 20:41:12.335687+00', '', NULL, '', '', NULL, '2025-07-22 22:42:06.591759+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "a35ec57d-ca9c-46c9-bfe9-b03c1bb1ddf2", "email": "cedric@tri-logis.ca", "email_verified": true, "phone_verified": false}', NULL, '2025-07-22 20:41:12.311369+00', '2025-07-22 22:42:06.594349+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
	('a35ec57d-ca9c-46c9-bfe9-b03c1bb1ddf2', 'a35ec57d-ca9c-46c9-bfe9-b03c1bb1ddf2', '{"sub": "a35ec57d-ca9c-46c9-bfe9-b03c1bb1ddf2", "email": "cedric@tri-logis.ca", "email_verified": true, "phone_verified": false}', 'email', '2025-07-22 20:41:12.325299+00', '2025-07-22 20:41:12.32535+00', '2025-07-22 20:41:12.32535+00', '90dd76b1-35ba-4d6d-a452-3a3598a97469');


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."sessions" ("id", "user_id", "created_at", "updated_at", "factor_id", "aal", "not_after", "refreshed_at", "user_agent", "ip", "tag") VALUES
	('6f7fde07-37b7-48da-95f5-2f26066d3965', 'a35ec57d-ca9c-46c9-bfe9-b03c1bb1ddf2', '2025-07-22 21:00:08.992924+00', '2025-07-22 21:00:08.992924+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '58.161.117.161', NULL),
	('a6f3b579-c205-402c-9943-1514b0c32255', 'a35ec57d-ca9c-46c9-bfe9-b03c1bb1ddf2', '2025-07-22 22:42:06.591829+00', '2025-07-22 22:42:06.591829+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '58.161.117.161', NULL);


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") VALUES
	('6f7fde07-37b7-48da-95f5-2f26066d3965', '2025-07-22 21:00:08.996253+00', '2025-07-22 21:00:08.996253+00', 'password', 'fad5cf9c-fcde-46e0-97de-576bf5d309b9'),
	('a6f3b579-c205-402c-9943-1514b0c32255', '2025-07-22 22:42:06.594935+00', '2025-07-22 22:42:06.594935+00', 'password', '370102a4-be7b-4479-95e5-cd269c91797d');


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."refresh_tokens" ("instance_id", "id", "token", "user_id", "revoked", "created_at", "updated_at", "parent", "session_id") VALUES
	('00000000-0000-0000-0000-000000000000', 6, 'pyf4jj55yrnu', 'a35ec57d-ca9c-46c9-bfe9-b03c1bb1ddf2', false, '2025-07-22 21:00:08.994058+00', '2025-07-22 21:00:08.994058+00', NULL, '6f7fde07-37b7-48da-95f5-2f26066d3965'),
	('00000000-0000-0000-0000-000000000000', 7, '2sjmr6kboaub', 'a35ec57d-ca9c-46c9-bfe9-b03c1bb1ddf2', false, '2025-07-22 22:42:06.593013+00', '2025-07-22 22:42:06.593013+00', NULL, 'a6f3b579-c205-402c-9943-1514b0c32255');


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 7, true);


--
-- PostgreSQL database dump complete
--

RESET ALL;
