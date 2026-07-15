import { useState, SyntheticEvent } from "react";
import { Badge, Box, Tab, Tabs } from "@mui/material";
import PageAction from "../../components/common/PageAction";
import { LocalShipping, Construction } from "@mui/icons-material";
import AssetTransferRecordTab from "./AssetTransferRecordTab";
import ToolTransferRecordTab from "./ToolTransferRecordTab";
import { useMenuData } from "../../hooks/useMenuData";
import { currentBrandConfig } from "../../config/brandConfig";

export default function TransferRecord() {
  const [mainTab, setMainTab] = useState(0);
  const { counts } = useMenuData();

  const handleMainTabChange = (_event: SyntheticEvent, newValue: number) => {
    setMainTab(newValue);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        bgcolor: "#f8f9fa",
      }}
    >
      <PageAction title="Biên bản điều chuyển" hideActionRow={true} />
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
          Quản lý biên bản
        </Box>
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
                badgeContent={
                  (counts.shareCounts?.totalAssetTransfer || 0) +
                  (counts.assetTransfer?.banHanhTotal || 0)
                }
                color="error"
              >
                <LocalShipping sx={{ fontSize: 20 }} />
              </Badge>
            }
            iconPosition="start"
            label="Điều chuyển tài sản"
          />
          <Tab
            icon={
              <Badge
                badgeContent={
                  (counts.shareCounts?.totalToolTransfer || 0) +
                  (counts.toolTransfer?.banHanhTotal || 0)
                }
                color="error"
              >
                <Construction sx={{ fontSize: 20 }} />
              </Badge>
            }
            iconPosition="start"
            label="Điều chuyển ccdc"
          />
        </Tabs>
      </Box>

      <Box sx={{ flexGrow: 1, overflow: "auto" }}>
        {mainTab === 0 && <AssetTransferRecordTab counts={counts} />}
        {mainTab === 1 && <ToolTransferRecordTab counts={counts} />}
      </Box>
    </Box>
  );
}
