-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 30, 2025 at 08:09 PM
-- Server version: 8.0.43
-- PHP Version: 8.1.33

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `ratambuzza.ar`
--
CREATE DATABASE IF NOT EXISTS `ratambuzza.ar` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE `ratambuzza.ar`;

-- --------------------------------------------------------

--
-- Table structure for table `likes_media`
--

DROP TABLE IF EXISTS `likes_media`;
CREATE TABLE `likes_media` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `media_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `likes_media`
--

INSERT INTO `likes_media` (`id`, `user_id`, `media_id`, `created_at`) VALUES
(59, 4, 57, '2025-08-26 22:54:27'),
(60, 15, 57, '2025-08-26 22:54:45'),
(145, 1, 57, '2025-08-27 23:40:17'),
(149, 15, 43, '2025-08-30 17:08:39'),
(152, 15, 53, '2025-08-30 17:09:15'),
(160, 15, 79, '2025-08-30 19:34:21');

-- --------------------------------------------------------

--
-- Table structure for table `likes_posts`
--

DROP TABLE IF EXISTS `likes_posts`;
CREATE TABLE `likes_posts` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `post_id` int NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `likes_posts`
--

INSERT INTO `likes_posts` (`id`, `user_id`, `post_id`, `created_at`) VALUES
(35, 1, 91, '2025-08-23 15:27:27'),
(36, 1, 93, '2025-08-29 16:16:35');

-- --------------------------------------------------------

--
-- Table structure for table `media`
--

DROP TABLE IF EXISTS `media`;
CREATE TABLE `media` (
  `id` int NOT NULL,
  `post_id` int DEFAULT NULL,
  `trip_id` int NOT NULL,
  `user_id` int NOT NULL,
  `url` varchar(255) NOT NULL,
  `thumbnail_url` varchar(255) NOT NULL,
  `width` int NOT NULL,
  `height` int NOT NULL,
  `type` varchar(20) DEFAULT 'image',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `media`
--

INSERT INTO `media` (`id`, `post_id`, `trip_id`, `user_id`, `url`, `thumbnail_url`, `width`, `height`, `type`, `created_at`) VALUES
(38, NULL, 1, 1, '/uploads/resized-1755990250942-639650.jpeg', '/uploads/thumb-1755990250942-639650.jpeg', 1600, 1600, 'image', '2025-08-23 23:04:11'),
(41, NULL, 1, 1, '/uploads/resized-1755990420883-543328.jpeg', '/uploads/thumb-1755990420883-543328.jpeg', 1600, 1600, 'image', '2025-08-23 23:07:00'),
(42, NULL, 1, 1, '/uploads/resized-1755990762520-150514.jpeg', '/uploads/thumb-1755990762520-150514.jpeg', 1600, 1600, 'image', '2025-08-23 23:12:42'),
(43, NULL, 1, 1, '/uploads/resized-1755990762535-897745.jpeg', '/uploads/thumb-1755990762535-897745.jpeg', 1600, 1600, 'image', '2025-08-23 23:12:43'),
(45, NULL, 1, 1, '/uploads/resized-1755992084808-199063.jpeg', '/uploads/thumb-1755992084808-199063.jpeg', 1600, 1600, 'image', '2025-08-23 23:34:44'),
(46, NULL, 1, 1, '/uploads/resized-1755992426997-195149.png', '/uploads/thumb-1755992426997-195149.png', 1600, 1600, 'image', '2025-08-23 23:40:27'),
(49, NULL, 1, 1, '/uploads/resized-1755994173669-289963.jpeg', '/uploads/thumb-1755994173669-289963.jpeg', 1600, 1600, 'image', '2025-08-24 00:09:33'),
(52, NULL, 1, 1, '/uploads/resized-1755994173741-504940.jpeg', '/uploads/thumb-1755994173741-504940.jpeg', 1600, 1600, 'image', '2025-08-24 00:09:34'),
(53, NULL, 1, 1, '/uploads/resized-1755994173749-773453.jpeg', '/uploads/thumb-1755994173749-773453.jpeg', 1600, 1600, 'image', '2025-08-24 00:09:35'),
(57, NULL, 1, 1, '/uploads/resized-1755994307608-949806.jpeg', '/uploads/thumb-1755994307608-949806.jpeg', 1600, 1600, 'image', '2025-08-24 00:11:48'),
(76, NULL, 1, 1, '/uploads/resized-1756434612307-840605.jpeg', '/uploads/thumb-1756434612307-840605.jpeg', 1600, 1600, 'image', '2025-08-29 02:30:12'),
(78, NULL, 1, 15, '/uploads/resized-1756567568769-582300.jpeg', '/uploads/thumb-1756567568769-582300.jpeg', 1600, 1600, 'image', '2025-08-30 15:26:09'),
(79, NULL, 1, 15, '/uploads/resized-1756567661268-916962.jpeg', '/uploads/thumb-1756567661268-916962.jpeg', 1600, 1600, 'image', '2025-08-30 15:27:41'),
(80, NULL, 1, 15, '/uploads/resized-1756582436310-964049.jpeg', '/uploads/thumb-1756582436310-964049.jpeg', 1600, 1600, 'image', '2025-08-30 19:33:56');

-- --------------------------------------------------------

--
-- Table structure for table `media_tags`
--

DROP TABLE IF EXISTS `media_tags`;
CREATE TABLE `media_tags` (
  `media_id` int NOT NULL,
  `tag_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `media_tags`
--

INSERT INTO `media_tags` (`media_id`, `tag_id`) VALUES
(52, 263),
(57, 270),
(57, 271),
(78, 271),
(79, 271),
(80, 271),
(57, 284),
(52, 301),
(52, 313),
(57, 318),
(57, 434),
(52, 469),
(52, 564),
(52, 571),
(57, 584),
(78, 671),
(79, 671),
(80, 671);

-- --------------------------------------------------------

--
-- Table structure for table `posts`
--

DROP TABLE IF EXISTS `posts`;
CREATE TABLE `posts` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `trip_id` int NOT NULL,
  `content` text,
  `image_filename` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `posts`
--

INSERT INTO `posts` (`id`, `user_id`, `trip_id`, `content`, `image_filename`, `created_at`) VALUES
(68, 1, 1, '1', NULL, '2025-08-18 23:45:16'),
(69, 1, 1, '2', NULL, '2025-08-18 23:45:20'),
(70, 1, 1, '3', NULL, '2025-08-18 23:46:34'),
(71, 1, 1, '4', NULL, '2025-08-18 23:46:34'),
(72, 1, 1, '5', NULL, '2025-08-18 23:46:34'),
(75, 1, 1, '6', NULL, '2025-08-19 15:03:53'),
(76, 1, 1, '7', NULL, '2025-08-19 15:04:47'),
(77, 1, 1, '8', NULL, '2025-08-19 15:04:52'),
(78, 1, 1, '9', NULL, '2025-08-19 15:13:33'),
(79, 1, 1, '10', NULL, '2025-08-19 15:13:37'),
(80, 1, 1, '11', NULL, '2025-08-19 15:14:43'),
(81, 1, 1, '12', NULL, '2025-08-19 15:14:49'),
(82, 1, 1, '13', NULL, '2025-08-19 15:19:34'),
(83, 1, 1, '14', NULL, '2025-08-19 15:19:38'),
(84, 1, 1, '15', NULL, '2025-08-19 15:20:06'),
(85, 1, 1, '16', NULL, '2025-08-19 15:22:03'),
(86, 1, 1, '17', NULL, '2025-08-19 15:24:50'),
(87, 1, 1, '18', NULL, '2025-08-19 15:27:56'),
(91, 1, 1, '', '1755980757233-229851.png', '2025-08-23 20:25:57'),
(92, 4, 1, 'working on it, friend', NULL, '2025-08-26 23:37:49'),
(93, 1, 1, 'No se puede ser más brown.', '1756502011220-791780.jpeg', '2025-08-29 21:13:31');

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
CREATE TABLE `sessions` (
  `session_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `expires` int UNSIGNED NOT NULL,
  `data` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `sessions`
--

INSERT INTO `sessions` (`session_id`, `expires`, `data`) VALUES
('22hMF2MG4u50czC95_zQrQI3zIjKuZpG', 1758833493, '{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2025-09-25T19:06:04.640Z\",\"httpOnly\":true,\"path\":\"/\"},\"user\":{\"id\":1,\"handle\":\"Latigo\",\"email\":\"alejandromleonian@gmail.com\",\"role\":\"admin\"}}'),
('CNoe-DixFMa0_7e7hR80yC3u4TuOAYyP', 1759174466, '{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2025-09-29T15:20:47.592Z\",\"httpOnly\":true,\"path\":\"/\"},\"user\":{\"id\":15,\"handle\":\"Pato\",\"email\":\"pato@gmail.com\",\"role\":\"user\"}}'),
('bq7i_EHzclodU4lj0Z3fdQeyM6suLyUA', 1758998176, '{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2025-09-26T00:43:51.113Z\",\"httpOnly\":true,\"path\":\"/\"},\"user\":{\"id\":1,\"handle\":\"Latigo\",\"email\":\"alejandromleonian@gmail.com\",\"role\":\"admin\"}}'),
('rkmrqzf7vVEOgYfZ1b-Y5KisQT4jBdmI', 1757896140, '{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2025-09-15T00:29:00.036Z\",\"httpOnly\":true,\"path\":\"/\"},\"redirectTo\":\"/feed/1\"}');

-- --------------------------------------------------------

--
-- Table structure for table `tags`
--

DROP TABLE IF EXISTS `tags`;
CREATE TABLE `tags` (
  `id` int NOT NULL,
  `name` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `tags`
--

INSERT INTO `tags` (`id`, `name`) VALUES
(284, 'amigos'),
(564, 'amolsa'),
(469, 'antioquia'),
(571, 'bishori'),
(263, 'couple'),
(318, 'felipe'),
(434, 'fims'),
(271, 'magia'),
(671, 'magic'),
(584, 'maifren'),
(313, 'melbishores'),
(301, 'pareja'),
(270, 'peldus');

-- --------------------------------------------------------

--
-- Table structure for table `trips`
--

DROP TABLE IF EXISTS `trips`;
CREATE TABLE `trips` (
  `id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `landscape_image` varchar(355) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `trips`
--

INSERT INTO `trips` (`id`, `name`, `slug`, `start_date`, `end_date`, `landscape_image`) VALUES
(1, 'RIO 2025', 'rio-2025', '2025-10-08', '2025-10-12', 'copa.jpg');

-- --------------------------------------------------------

--
-- Table structure for table `trip_members`
--

DROP TABLE IF EXISTS `trip_members`;
CREATE TABLE `trip_members` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `trip_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `trip_members`
--

INSERT INTO `trip_members` (`id`, `user_id`, `trip_id`) VALUES
(1, 1, 1),
(2, 8, 1),
(3, 4, 1),
(4, 5, 1),
(5, 6, 1),
(6, 7, 1),
(8, 10, 1),
(9, 11, 1),
(10, 12, 1),
(11, 13, 1),
(12, 9, 1),
(17, 14, 1),
(18, 15, 1);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int NOT NULL,
  `handle` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` text NOT NULL,
  `avatar_file_name` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `avatar_head_file_name` text NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `description` text NOT NULL,
  `role` enum('user','admin') NOT NULL DEFAULT 'user'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `handle`, `email`, `password_hash`, `avatar_file_name`, `avatar_head_file_name`, `created_at`, `description`, `role`) VALUES
(1, 'Latigo', 'alejandromleonian@gmail.com', '$2b$10$zh/sxTRi1xCPK6XHLMGjROtPHwYzvLNV9K9MkxBbuAIvzhrZKkr.O', 'latigo.png', 'latigo.head.png', '2025-08-14 01:48:51', 'Holgazán de nacimiento. Durante años de su vida buscó maneras de no tener que trabajar pero fracasó rotundamente. Hace buenos trucos pero el gran milagro que nadie explica es como una mujer 14 años menor que él le terminó dando bola.', 'admin'),
(4, 'Butis', 'butis@gmail.com', '$2b$10$mcKr9XfmUQPOjqoimGO1hOTvMZ/ncMLLmeezvVqD77Epi0QcXs5Gi', 'butis.png', 'butis.head.png', '2025-08-14 15:42:30', 'La rata más grande del condado, tiene el puño más cerrado que un bebé. Prefiere perder un brazo antes que pagar un sobreprecio. Es capaz de sobrevivir varios días internado en una montaña nevada alimentándose de un sánguche.', 'user'),
(5, 'Afro', 'afro@gmail.com', '$2b$10$mcKr9XfmUQPOjqoimGO1hOTvMZ/ncMLLmeezvVqD77Epi0QcXs5Gi', 'afro.png', 'afro.head.png', '2025-08-14 15:44:10', 'También conocido como \'Gusano\' desde chico anheló el sueño Americano. Su talento más grande es no roncar a pesar del nazo que tiene.', 'user'),
(6, 'Alefa', 'alefa@gmail.com', '$2b$10$mcKr9XfmUQPOjqoimGO1hOTvMZ/ncMLLmeezvVqD77Epi0QcXs5Gi', 'alefa.png', 'alefa.head.png', '2025-08-14 15:45:31', 'También conocido como Oscar, es el público ideal porque te festeja todos los chistes. Vive atormentado por una pesadilla recurrente en donde una pala lo persigue para trabajar en el jardín de la casa de su familia en Pinamar.', 'user'),
(7, 'Boli', 'boli@gmail.com', '$2b$10$mcKr9XfmUQPOjqoimGO1hOTvMZ/ncMLLmeezvVqD77Epi0QcXs5Gi', 'boli.png', 'boli.head.png', '2025-08-14 15:47:13', 'Es dueño de una cadena de locales de depilación definitiva. Lo llaman el J.R.R Tolkien de Villa Sarmiento por su capacidad para bolasear. Posee un conocimiento enciclopédico de chistes de gansosos.', 'user'),
(8, 'Charly', 'charly@gmail.com', '$2b$10$mcKr9XfmUQPOjqoimGO1hOTvMZ/ncMLLmeezvVqD77Epi0QcXs5Gi', 'charly.png', 'charly.head.png', '2025-08-14 15:49:08', 'El dealer de achuras oficial del grupo. Sus mollejas de corazón no tienen rival. Frase que nunca dijo: todas. No pronuncia palabra desde 1993.', 'user'),
(9, 'Depo', 'depo@gmail.com', '$2b$10$mcKr9XfmUQPOjqoimGO1hOTvMZ/ncMLLmeezvVqD77Epi0QcXs5Gi', 'depo.png', 'depo.head.png', '2025-08-14 15:49:55', 'También conocido como: Antreli, Galmácido o Dr.G. Si Steve-O de Jackass y Ozzy Osbourne hubieran tenido un hijo, sería Albertito. Ahora es un padre de familia pero en sus años mozos, supo tranzarse una bolsa de basura.', 'user'),
(10, 'Firulais', 'firulais@gmail.com', '$2b$10$mcKr9XfmUQPOjqoimGO1hOTvMZ/ncMLLmeezvVqD77Epi0QcXs5Gi', 'firulais.png', 'firulais.head.png', '2025-08-14 15:52:23', 'Bom-vivant sin igual. Es el último gourmand. En una picada preparada por él, hay quesos de los 5 continentes y mortadela de unicornio. Frase que nunca dijo: \'No puedo irme de viaje, tengo que trabajar.\'', 'user'),
(11, 'Marian', 'marian@gmail.com', '$2b$10$mcKr9XfmUQPOjqoimGO1hOTvMZ/ncMLLmeezvVqD77Epi0QcXs5Gi', 'marian.png', 'marian.head.png', '2025-08-14 15:53:03', 'Hiperactivo como nadie. En un mismo día el doctor es capaz de: escribir un libro, viajar a China, sacarle un pepino del culo a un paciente. Hace poco rompió el record de mayor cantidad de días consecutivos de permanencia en su casa: 3.', 'user'),
(12, 'Patas', 'patas@gmail.com', '$2b$10$mcKr9XfmUQPOjqoimGO1hOTvMZ/ncMLLmeezvVqD77Epi0QcXs5Gi', 'patas.png', 'patas.head.png', '2025-08-14 15:53:58', 'Titán de las finanzas, empresario sin igual, borracho. Comenzó bien abajo limpiando baños en Constitución. Un buen día tuvo la idea de crear sus propios productos de limpieza y el resto es historia.', 'user'),
(13, 'Sanchez', 'sanchez@gmail.com', '$2b$10$mcKr9XfmUQPOjqoimGO1hOTvMZ/ncMLLmeezvVqD77Epi0QcXs5Gi', 'sanchez.png', 'sanchez.head.png', '2025-08-14 15:54:53', 'Influencer de redes sociales en el mundo de bienes raíces. Lo llaman \'El hacedor\' o \'El Grinch\'. Nunca vendió un departamento y publica un video cada 3 meses pero igual le tenemos fé.', 'user'),
(14, 'Topo', 'topo@gmail.com', '$2b$10$mcKr9XfmUQPOjqoimGO1hOTvMZ/ncMLLmeezvVqD77Epi0QcXs5Gi', 'topo.png', 'topo.head.png', '2025-08-14 15:55:26', 'De jóven era una máquina de hacer deportes, una máquina con varios engranajes menos y sin aceite. El día que correr sin doblar las rodillas sea un deporte olímpico, este pibe va a estar a la altura de Husain Bolt', 'user'),
(15, 'Pato', 'pato@gmail.com', '$2b$10$mcKr9XfmUQPOjqoimGO1hOTvMZ/ncMLLmeezvVqD77Epi0QcXs5Gi', 'pato.png', 'pato.head.png', '2025-08-15 16:14:26', 'Piloto enduro, empresario gastronómico, modelo publicitario. Otro que ya no sabe que hacer para rajarse de la casa. Compite cabeza a cabeza con Butis a ver quién tiene más alma de roedor.', 'user');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `likes_media`
--
ALTER TABLE `likes_media`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`,`media_id`),
  ADD KEY `media_id` (`media_id`);

--
-- Indexes for table `likes_posts`
--
ALTER TABLE `likes_posts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_like` (`user_id`,`post_id`);

--
-- Indexes for table `media`
--
ALTER TABLE `media`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `media_tags`
--
ALTER TABLE `media_tags`
  ADD PRIMARY KEY (`media_id`,`tag_id`),
  ADD KEY `tag_id` (`tag_id`);

--
-- Indexes for table `posts`
--
ALTER TABLE `posts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `trip_id` (`trip_id`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`session_id`);

--
-- Indexes for table `tags`
--
ALTER TABLE `tags`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `trips`
--
ALTER TABLE `trips`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`);

--
-- Indexes for table `trip_members`
--
ALTER TABLE `trip_members`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `handle` (`handle`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `likes_media`
--
ALTER TABLE `likes_media`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=161;

--
-- AUTO_INCREMENT for table `likes_posts`
--
ALTER TABLE `likes_posts`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT for table `media`
--
ALTER TABLE `media`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=81;

--
-- AUTO_INCREMENT for table `posts`
--
ALTER TABLE `posts`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=94;

--
-- AUTO_INCREMENT for table `tags`
--
ALTER TABLE `tags`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=679;

--
-- AUTO_INCREMENT for table `trips`
--
ALTER TABLE `trips`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `trip_members`
--
ALTER TABLE `trip_members`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `likes_media`
--
ALTER TABLE `likes_media`
  ADD CONSTRAINT `likes_media_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `likes_media_ibfk_2` FOREIGN KEY (`media_id`) REFERENCES `media` (`id`);

--
-- Constraints for table `media_tags`
--
ALTER TABLE `media_tags`
  ADD CONSTRAINT `media_tags_ibfk_1` FOREIGN KEY (`media_id`) REFERENCES `media` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `media_tags_ibfk_2` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `posts`
--
ALTER TABLE `posts`
  ADD CONSTRAINT `posts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `posts_ibfk_2` FOREIGN KEY (`trip_id`) REFERENCES `trips` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
