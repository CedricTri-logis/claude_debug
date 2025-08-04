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
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."products" ("id", "name", "description", "price", "stock_quantity", "created_at", "updated_at") VALUES
	('c2396487-aee4-4423-8e32-7337c149b8b1', 'Laptop Computer', 'High-performance laptop with 16GB RAM and 512GB SSD', 1299.99, 25, '2025-08-04 07:48:52.378856+00', '2025-08-04 07:48:52.378856+00'),
	('1207a9b5-1f4d-4880-a212-e2280f70c02b', 'Wireless Mouse', 'Ergonomic wireless mouse with long battery life', 29.99, 150, '2025-08-04 07:48:52.378856+00', '2025-08-04 07:48:52.378856+00'),
	('8528367d-0b16-449e-ae67-3f6312473233', 'USB-C Hub', 'Multi-port USB-C hub with HDMI, USB-A, and power delivery', 79.99, 75, '2025-08-04 07:48:52.378856+00', '2025-08-04 07:48:52.378856+00'),
	('0095c951-b8b1-458a-8b62-c8408c73d069', 'Mechanical Keyboard', 'RGB backlit mechanical keyboard with tactile switches', 149.99, 40, '2025-08-04 07:48:52.378856+00', '2025-08-04 07:48:52.378856+00'),
	('008149ed-69f1-4d56-8e04-c38d933619e0', 'External Monitor', '27-inch 4K external monitor with USB-C connectivity', 399.99, 20, '2025-08-04 07:48:52.378856+00', '2025-08-04 07:48:52.378856+00'),
	('0c0f578a-368f-4bfd-9b61-714f88adbc73', 'Webcam HD', '1080p HD webcam with built-in microphone', 89.99, 60, '2025-08-04 07:48:52.378856+00', '2025-08-04 07:48:52.378856+00'),
	('7e32768c-69d7-45dc-a732-2b66b83e5e0f', 'Bluetooth Headphones', 'Noise-cancelling bluetooth headphones with 30hr battery', 199.99, 35, '2025-08-04 07:48:52.378856+00', '2025-08-04 07:48:52.378856+00'),
	('34584ed4-86e4-4747-872d-6e73edf9d521', 'Smartphone Case', 'Protective smartphone case with drop protection', 24.99, 200, '2025-08-04 07:48:52.378856+00', '2025-08-04 07:48:52.378856+00'),
	('36d23f2d-8e94-4348-b505-fa3d51959566', 'Portable Charger', '10000mAh portable battery pack with fast charging', 49.99, 85, '2025-08-04 07:48:52.378856+00', '2025-08-04 07:48:52.378856+00'),
	('d9cb9dc7-cad1-4230-bec9-d83a4e4e7533', 'Cable Organizer', 'Desk cable management system with multiple slots', 19.99, 120, '2025-08-04 07:48:52.378856+00', '2025-08-04 07:48:52.378856+00'),
	('f07f81ec-7ac4-48f1-a317-b2023b0451fa', 'Laptop Computer', 'High-performance laptop with 16GB RAM and 512GB SSD', 1299.99, 25, '2025-08-04 08:38:36.231052+00', '2025-08-04 08:38:36.231052+00'),
	('d429bfa3-18a4-4553-9ab2-ca3bc047bb1b', 'Wireless Mouse', 'Ergonomic wireless mouse with long battery life', 29.99, 150, '2025-08-04 08:38:36.231052+00', '2025-08-04 08:38:36.231052+00'),
	('392f48e3-5261-47a1-9119-06fa47b953e7', 'USB-C Hub', 'Multi-port USB-C hub with HDMI, USB-A, and power delivery', 79.99, 75, '2025-08-04 08:38:36.231052+00', '2025-08-04 08:38:36.231052+00'),
	('0399c7fc-659b-4fb1-b2cd-36b69831d847', 'Mechanical Keyboard', 'RGB backlit mechanical keyboard with tactile switches', 149.99, 40, '2025-08-04 08:38:36.231052+00', '2025-08-04 08:38:36.231052+00'),
	('9ab4fe1c-68cd-4be9-a7b1-9b9dcb5faaca', 'External Monitor', '27-inch 4K external monitor with USB-C connectivity', 399.99, 20, '2025-08-04 08:38:36.231052+00', '2025-08-04 08:38:36.231052+00'),
	('dd5e0ed5-aa28-4d1a-877f-e15338fba09a', 'Webcam HD', '1080p HD webcam with built-in microphone', 89.99, 60, '2025-08-04 08:38:36.231052+00', '2025-08-04 08:38:36.231052+00'),
	('3299f8b0-69ae-4a92-ad6a-0b8ddd217a47', 'Bluetooth Headphones', 'Noise-cancelling bluetooth headphones with 30hr battery', 199.99, 35, '2025-08-04 08:38:36.231052+00', '2025-08-04 08:38:36.231052+00'),
	('e5644e89-5ece-4a4f-80c3-00e51a906f9e', 'Smartphone Case', 'Protective smartphone case with drop protection', 24.99, 200, '2025-08-04 08:38:36.231052+00', '2025-08-04 08:38:36.231052+00'),
	('7840d60d-2d71-44ce-ab7b-b1e973be541f', 'Portable Charger', '10000mAh portable battery pack with fast charging', 49.99, 85, '2025-08-04 08:38:36.231052+00', '2025-08-04 08:38:36.231052+00'),
	('faeb9ac1-bf41-431e-893e-612089ddb69c', 'Cable Organizer', 'Desk cable management system with multiple slots', 19.99, 120, '2025-08-04 08:38:36.231052+00', '2025-08-04 08:38:36.231052+00');


--
-- PostgreSQL database dump complete
--

RESET ALL;
