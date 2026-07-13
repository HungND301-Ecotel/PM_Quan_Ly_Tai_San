CREATE TABLE IF NOT EXISTS `PhieuGiaoViec` (
  `Id` varchar(50) NOT NULL,
  `IdSuaChua` varchar(50) DEFAULT NULL,
  `SoPhieu` varchar(255) DEFAULT NULL,
  `DonViQuanLy` varchar(50) DEFAULT NULL,
  `CaBatDau` int(11) DEFAULT NULL,
  `NgayBatDau` varchar(255) DEFAULT NULL,
  `CaDuKien` int(11) DEFAULT NULL,
  `NgayDuKien` varchar(255) DEFAULT NULL,
  
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

CREATE TABLE IF NOT EXISTS `PhieuGiaoViec_ChiTietTaiSan` (
  `Id` varchar(50) NOT NULL,
  `IdPhieuGiaoViec` varchar(50) DEFAULT NULL,
  `IdSuaChuaChiTiet` varchar(50) DEFAULT NULL,
  `IdTaiSan` varchar(50) DEFAULT NULL,
  `TenTaiSan` varchar(255) DEFAULT NULL,
  `MaCongViec` varchar(255) DEFAULT NULL,
  `NoiDung` text DEFAULT NULL,
  `NguoiThucHien` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  KEY `fk_phieugiaoviec_taisan` (`IdPhieuGiaoViec`),
  CONSTRAINT `fk_phieugiaoviec_taisan` FOREIGN KEY (`IdPhieuGiaoViec`) REFERENCES `PhieuGiaoViec` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `PhieuGiaoViec_ChiTietVatTu` (
  `Id` varchar(50) NOT NULL,
  `IdPhieuGiaoViec` varchar(50) DEFAULT NULL,
  `IdVatTu` varchar(50) DEFAULT NULL,
  `IdChiTietVatTu` varchar(50) DEFAULT NULL,
  `SoLuong` float DEFAULT 0.0,
  `GhiChu` text DEFAULT NULL,
  PRIMARY KEY (`Id`),
  KEY `fk_phieugiaoviec_vattu` (`IdPhieuGiaoViec`),
  CONSTRAINT `fk_phieugiaoviec_vattu` FOREIGN KEY (`IdPhieuGiaoViec`) REFERENCES `PhieuGiaoViec` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
