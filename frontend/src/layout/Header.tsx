import { AppBar, Avatar, Box, Typography } from "@mui/material";
import { Email, Fax, Phone } from "@mui/icons-material";
import { currentBrandConfig } from "../config/brandConfig";

export default function Header() {
  return (
    <Box id="app-header" sx={{ width: "100%", height: "auto" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: 120,
          borderBottom: "1px solid white",
          textShadow: "1px 1px 2px rgba(0,0,0,0.5)",
          background: `repeating-linear-gradient(
                    20deg, 
                    rgba(255, 255, 255, 0.15) 0px, 
                    rgba(255, 255, 255, 0.15) 1px, 
                    transparent 2px, 
                    transparent 40px
                ),linear-gradient(to right,${currentBrandConfig.primaryColor} 0%,${currentBrandConfig.primaryColor} 100%)`,
        }}
      >
        <Box display={"flex"} alignItems={"center"} gap={3}>
          <Avatar
            src={currentBrandConfig.logo}
            alt="logo"
            sx={{ width: 80, height: 80 }}
          />
          <Box sx={{ color: "white" }}>
            <Typography align="center" fontSize={26} fontWeight={700}>
              PHẦN MỀM QUẢN LÝ TÀI SẢN
            </Typography>
            <Typography align="center" fontWeight={700} fontSize={18}>
              {currentBrandConfig.company}
            </Typography>
            <Box sx={{ display: "flex", justifyContent: "center", gap: 3 }}>
              {currentBrandConfig.phone && (
                <Typography
                  fontWeight={700}
                  fontSize={12}
                  display={"flex"}
                  alignItems={"center"}
                  gap={1}
                >
                  <Phone sx={{ fontSize: 16 }} />
                  Hotline: {currentBrandConfig.phone}
                </Typography>
              )}
              {currentBrandConfig.email && (
                <Typography
                  fontWeight={700}
                  fontSize={12}
                  display={"flex"}
                  alignItems={"center"}
                  gap={1}
                >
                  <Email sx={{ fontSize: 16 }} />
                  Email: {currentBrandConfig.email}
                </Typography>
              )}
              {currentBrandConfig.fax && (
                <Typography
                  fontWeight={700}
                  fontSize={12}
                  display={"flex"}
                  alignItems={"center"}
                  gap={1}
                >
                  <Fax sx={{ fontSize: 16 }} />
                  Fax: {currentBrandConfig.fax}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
