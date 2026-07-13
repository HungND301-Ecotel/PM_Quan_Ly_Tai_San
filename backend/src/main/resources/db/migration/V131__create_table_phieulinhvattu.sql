CREATE TABLE IF NOT EXISTS `PhieuLinhVatTu` (
  `Id` varchar(50) NOT NULL,
  `IdPhieuGiaoViec` varchar(50) DEFAULT NULL,
  `SoPhieu` varchar(255) DEFAULT NULL,
  `SoQuyetDinh` varchar(255) DEFAULT NULL,
  `DonViDeNghi` varchar(50) DEFAULT NULL,
  `MucDichSuDung` varchar(255) DEFAULT NULL,
  `GhiChu` text DEFAULT NULL,
  
  `IdNguoiLap` varchar(50) DEFAULT NULL,
  `NguoiLapXacNhan` bit(1) DEFAULT b'0',
  `IdGiamDoc` varchar(50) DEFAULT NULL,
  `GiamDocXacNhan` bit(1) DEFAULT b'0',
  `Share` bit(1) DEFAULT b'0',
  `TrangThai` int(11) DEFAULT 0,
  
  `NgayTao` varchar(255) DEFAULT NULL,
  `NgayCapNhat` varchar(255) DEFAULT NULL,
  `NguoiTao` varchar(255) DEFAULT NULL,
  `NguoiCapNhat` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `PhieuLinhVatTu_ChiTietTaiSan` (
  `Id` varchar(50) NOT NULL,
  `IdBienBan` varchar(50) DEFAULT NULL,
  `IdTaiSan` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  KEY `fk_phieulinhvattu_taisan` (`IdBienBan`),
  CONSTRAINT `fk_phieulinhvattu_taisan` FOREIGN KEY (`IdBienBan`) REFERENCES `PhieuLinhVatTu` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `PhieuLinhVatTu_ChiTietVatTu` (
  `Id` varchar(50) NOT NULL,
  `IdBienBan` varchar(50) DEFAULT NULL,
  `IdVatTu` varchar(50) DEFAULT NULL,
  `IdChiTietVatTu` varchar(50) DEFAULT NULL,
  `SoLuongDeNghi` float DEFAULT 0,
  `SoLuongDuyet` float DEFAULT 0,
  `SoLuongThuCu` float DEFAULT 0,
  PRIMARY KEY (`Id`),
  KEY `fk_phieulinhvattu_vattu` (`IdBienBan`),
  CONSTRAINT `fk_phieulinhvattu_vattu` FOREIGN KEY (`IdBienBan`) REFERENCES `PhieuLinhVatTu` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
