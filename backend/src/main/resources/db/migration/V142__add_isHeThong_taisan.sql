-- Them cot IsHeThong vao bang TaiSan
ALTER TABLE TaiSan
  ADD COLUMN IsHeThong TINYINT(1) DEFAULT 0 AFTER IsTaiSanCon;