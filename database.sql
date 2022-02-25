SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;


CREATE TABLE `attributes` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `bookmarks` (
  `id` int(11) NOT NULL,
  `videoID` int(11) NOT NULL,
  `categoryID` int(11) NOT NULL,
  `start` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `country` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `code` char(2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=COMPACT;

CREATE TABLE `locations` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=COMPACT;

CREATE TABLE `plays` (
  `id` int(11) NOT NULL,
  `videoID` int(11) NOT NULL,
  `time` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `settings` (
  `id` int(11) NOT NULL,
  `thumbnail_res` int(11) NOT NULL DEFAULT 290,
  `thumbnail_start` int(11) NOT NULL DEFAULT 100
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=COMPACT;

CREATE TABLE `sites` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `websiteID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `staralias` (
  `id` int(11) NOT NULL,
  `starID` int(11) NOT NULL,
  `name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `stars` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `image` varchar(255) DEFAULT NULL,
  `haircolor` varchar(255) DEFAULT NULL,
  `eyecolor` varchar(255) DEFAULT NULL,
  `breast` varchar(255) DEFAULT NULL,
  `ethnicity` varchar(255) DEFAULT NULL,
  `country` varchar(255) DEFAULT NULL,
  `birthdate` date DEFAULT NULL,
  `height` int(11) DEFAULT NULL,
  `weight` int(11) DEFAULT NULL,
  `autoTaggerIgnore` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `videoattributes` (
  `id` int(11) NOT NULL,
  `videoID` int(11) NOT NULL,
  `attributeID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `videolocations` (
  `id` int(11) NOT NULL,
  `videoID` int(11) NOT NULL,
  `locationID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `videos` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `path` varchar(255) NOT NULL,
  `date` date DEFAULT NULL,
  `added` datetime NOT NULL DEFAULT current_timestamp(),
  `duration` int(11) NOT NULL DEFAULT 0,
  `height` int(11) NOT NULL DEFAULT 0,
  `starAge` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `videosites` (
  `id` int(11) NOT NULL,
  `videoID` int(11) NOT NULL,
  `siteID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `videostars` (
  `id` int(11) NOT NULL,
  `starID` int(11) NOT NULL,
  `videoID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `videowebsites` (
  `id` int(11) NOT NULL,
  `videoID` int(11) NOT NULL,
  `websiteID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `websites` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


ALTER TABLE `attributes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

ALTER TABLE `bookmarks`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `videoID_start` (`videoID`,`start`);

ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

ALTER TABLE `country`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD UNIQUE KEY `code` (`code`);

ALTER TABLE `locations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

ALTER TABLE `plays`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `videoID_time` (`videoID`,`time`);

ALTER TABLE `settings`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `sites`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

ALTER TABLE `staralias`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`) USING BTREE,
  ADD KEY `starID` (`starID`);

ALTER TABLE `stars`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD UNIQUE KEY `image` (`image`),
  ADD KEY `breast` (`breast`),
  ADD KEY `eyecolor` (`eyecolor`),
  ADD KEY `haircolor` (`haircolor`),
  ADD KEY `ethnicity` (`ethnicity`),
  ADD KEY `country` (`country`),
  ADD KEY `birthdate` (`birthdate`),
  ADD KEY `height` (`height`),
  ADD KEY `weight` (`weight`),
  ADD KEY `autoTaggerIgnore` (`autoTaggerIgnore`);

ALTER TABLE `videoattributes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `videoID_attributeID` (`videoID`,`attributeID`) USING BTREE;

ALTER TABLE `videolocations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `videoID_locationID` (`videoID`,`locationID`);

ALTER TABLE `videos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `path` (`path`),
  ADD KEY `date` (`date`);

ALTER TABLE `videosites`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `videoID` (`videoID`) USING BTREE;

ALTER TABLE `videostars`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `videoID` (`videoID`) USING BTREE,
  ADD KEY `starID` (`starID`);

ALTER TABLE `videowebsites`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `videoID` (`videoID`) USING BTREE;

ALTER TABLE `websites`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);


ALTER TABLE `attributes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `bookmarks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `country`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `locations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `plays`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `sites`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `staralias`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `stars`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `videoattributes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `videolocations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `videos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `videosites`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `videostars`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `videowebsites`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `websites`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;


ALTER TABLE `bookmarks`
  ADD CONSTRAINT `fk_bookmarks_categories_id` FOREIGN KEY (`categoryID`) REFERENCES `categories` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_bookmarks_videos_id` FOREIGN KEY (`videoID`) REFERENCES `videos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `plays`
  ADD CONSTRAINT `fk_plays_videos_id` FOREIGN KEY (`videoID`) REFERENCES `videos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `sites`
  ADD CONSTRAINT `fk_sites_websites_id` FOREIGN KEY (`websiteID`) REFERENCES `websites` (`id`) ON UPDATE CASCADE;

ALTER TABLE `staralias`
  ADD CONSTRAINT `fk_staralias_stars_id` FOREIGN KEY (`starID`) REFERENCES `stars` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `videoattributes`
  ADD CONSTRAINT `fk_videoattributes_attributes_id` FOREIGN KEY (`attributeID`) REFERENCES `attributes` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_videoattributes_videos_id` FOREIGN KEY (`videoID`) REFERENCES `videos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `videolocations`
  ADD CONSTRAINT `fk_videolocations_locations_id` FOREIGN KEY (`locationID`) REFERENCES `locations` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_videolocations_videos_id` FOREIGN KEY (`videoID`) REFERENCES `videos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `videosites`
  ADD CONSTRAINT `fk_videosites_sites_id` FOREIGN KEY (`siteID`) REFERENCES `sites` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_videosites_videos_id` FOREIGN KEY (`videoID`) REFERENCES `videos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `videostars`
  ADD CONSTRAINT `fk_videostars_stars_id` FOREIGN KEY (`starID`) REFERENCES `stars` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_videostars_videos_id` FOREIGN KEY (`videoID`) REFERENCES `videos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `videowebsites`
  ADD CONSTRAINT `fk_videowebsites_videos_id` FOREIGN KEY (`videoID`) REFERENCES `videos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_videowebsites_websites_id` FOREIGN KEY (`websiteID`) REFERENCES `websites` (`id`) ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
