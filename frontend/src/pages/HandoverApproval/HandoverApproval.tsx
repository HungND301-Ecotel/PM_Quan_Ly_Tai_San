import { useState, SyntheticEvent } from "react";
import { Box, Tab, Tabs, Badge } from "@mui/material";
import PageAction from "../../components/common/PageAction";
import AssetApprovalTab from "./AssetApprovalTab";
import ToolApprovalTab from "./ToolApprovalTab";
import { Inventory, Construction } from "@mui/icons-material";
import { useSelector } from "react-redux";
import { useMenuData } from "../../hooks/useMenuData";
import { currentBrandConfig } from "../../config/brandConfig";

export default function HandoverApproval() {
  const [mainTab, setMainTab] = useState(0);
  const { user } = useSelector((state: any) => state.user);

  const handleMainTabChange = (_event: SyntheticEvent, newValue: number) => {
    setMainTab(newValue);
  };
  const { counts } = useMenuData();

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        bgcolor: "#f8f9fa",
      }}
    >
      <PageAction title="Quản lý biên bản bàn giao" hideActionRow={true} />
      <Box
        sx={{
          px: 3,
          pt: 1.5,
          pb: 0,
          display: "flex",
          flexDirection: "column",
          bgcolor: "white",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          zIndex: 1,
        }}
      >
        <Box
          sx={{
            fontWeight: "bold",
            fontSize: "1.25rem",
            color: "#344767",
            mb: 1,
          }}
        >
          Phê duyệt bàn giao
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
          <Tabs
            value={mainTab}
            onChange={handleMainTabChange}
            sx={{
              "& .MuiTabs-indicator": {
                backgroundColor: currentBrandConfig.primaryColor,
                height: 3,
                borderRadius: "3px 3px 0 0",
              },
              "& .MuiTab-root": {
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.95rem",
                minHeight: "40px",
                color: "#67748e",
                px: 0,
                mr: 4,
                minWidth: "auto",
                "&.Mui-selected": {
                  color: currentBrandConfig.primaryColor,
                },
              },
            }}
          >
            <Tab
              icon={
                <Badge
                  badgeContent={counts.signCounts.totalAssetHandover || 0}
                  color="error"
                >
                  <Inventory sx={{ fontSize: 20 }} />
                </Badge>
              }
              iconPosition="start"
              label="Bàn giao tài sản"
            />
            <Tab
              icon={
                <Badge
                  badgeContent={counts.signCounts.totalToolHandover || 0}
                  color="error"
                >
                  <Construction sx={{ fontSize: 20 }} />
                </Badge>
              }
              iconPosition="start"
              label="Bàn giao ccdc"
            />
          </Tabs>
          <Box sx={{ flexGrow: 1 }} />
        </Box>
      </Box>

      <Box sx={{ flexGrow: 1, overflow: "auto" }}>
        {mainTab === 0 && <AssetApprovalTab />}
        {mainTab === 1 && <ToolApprovalTab />}
      </Box>
    </Box>
  );
}
