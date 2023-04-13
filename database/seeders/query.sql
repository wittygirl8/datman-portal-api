CREATE TABLE `batch` (
  `batch_id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_id` int(11) DEFAULT NULL,
  `total` varchar(20) COLLATE latin1_general_ci DEFAULT NULL,
  `status` enum('PENDING','SENT','COMPLETE','FINALISED','DELETED') COLLATE latin1_general_ci DEFAULT 'PENDING',
  `date_pending` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `date_sent` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `date_complete` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `week_no` int(11) DEFAULT NULL,
  `not_received` int(11) DEFAULT '0',
  `not_received_date` timestamp NULL DEFAULT NULL,
  `account_number` varchar(20) COLLATE latin1_general_ci DEFAULT NULL,
  `sort_code` varchar(20) COLLATE latin1_general_ci DEFAULT NULL,
  `bank_name` varchar(255) COLLATE latin1_general_ci DEFAULT NULL,
  `account_holder` varchar(255) COLLATE latin1_general_ci DEFAULT NULL,
  PRIMARY KEY (`batch_id`),
  KEY `customer_id` (`customer_id`)
) ENGINE=InnoDB AUTO_INCREMENT=338867 DEFAULT CHARSET=latin1 COLLATE=latin1_general_ci;