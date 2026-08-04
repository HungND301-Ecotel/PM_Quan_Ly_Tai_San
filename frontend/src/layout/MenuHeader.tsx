import {
  ArrowRight,
  KeyboardArrowDown,
  Logout,
  Person,
  Settings,
  ChevronRight,
  ChevronLeft,
  Dashboard,
  Category,
  Inventory,
  SwapHoriz,
  LocalShipping,
  Handshake,
  Engineering,
  Assessment,
  Storage,
  Description,
} from "@mui/icons-material";
import {
  Avatar,
  Box,
  Button,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Snackbar,
  Typography,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { logout } from "../redux/userSlice";
import { ROUTES } from "../utils/routes";
import ExpirationSettingDialog from "../components/common/ExpirationSettingDialog";
import MssqlConfigDialog from "../components/common/MssqlConfigDialog";
import { useMenuData } from "../hooks/useMenuData";
import { ShowCount } from "../components/common/ShowCount";
import { ShowCountInSubMenu } from "../components/common/ShowCountInSubMenu";
import React from "react";
import { clearTabs } from "../redux/tabsSlice";
import { currentBrandConfig } from "../config/brandConfig";

const isMenuActive = (item: any, pathname: string): boolean => {
  if (item.path === pathname) {
    return true;
  }
  if (item.subMenu) {
    return item.subMenu.some((subItem: any) => isMenuActive(subItem, pathname));
  }
  return false;
};

const NestedMenuItem = ({
  item,
  handleCloseMenu,
}: {
  item: any;
  handleCloseMenu: () => void;
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const isActive = isMenuActive(item, location.pathname);

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleClick = (path: string) => {
    if (path !== "#") {
      navigate(path);
      handleClose();
      handleCloseMenu();
    }
  };

  const menuItemStyle = (active: boolean) => ({
    fontSize: "14px",
    display: "flex",
    gap: 2,
    justifyContent: "space-between",
    borderRadius: "6px",
    mx: 1,
    my: 0.5,
    backgroundColor: active ? "action.hover" : "transparent",
    "&:hover": {
      backgroundColor: "action.hover",
    },
  });

  if (item.subMenu && item.subMenu.length > 0) {
    return (
      <Box onMouseLeave={handleClose}>
        <MenuItem onClick={handleOpen} sx={menuItemStyle(isActive)}>
          {item.text}
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            {item.count > 0 && <ShowCountInSubMenu count={item.count} />}
            <ArrowRight fontSize="small" />
          </Box>
        </MenuItem>
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          anchorOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "left",
          }}
          MenuListProps={{ onMouseLeave: handleClose }}
          slotProps={{
            paper: {
              sx: {
                padding: "8px",
                borderRadius: "12px",
                boxShadow: "0px 5px 15px rgba(0,0,0,0.1)",
              },
            },
          }}
        >
          {item.subMenu.map((subItem: any, index: number) => {
            const isSubActive = isMenuActive(subItem, location.pathname);
            return (
              <MenuItem
                key={index}
                onClick={() => handleClick(subItem.path)}
                sx={menuItemStyle(isSubActive)}
              >
                {subItem.text}
                {subItem.count > 0 && (
                  <ShowCountInSubMenu count={subItem.count} />
                )}
              </MenuItem>
            );
          })}
        </Menu>
      </Box>
    );
  }

  return (
    <MenuItem
      onClick={() => handleClick(item.path)}
      sx={menuItemStyle(isActive)}
    >
      {item.text}
      {item.count > 0 && <ShowCountInSubMenu count={item.count} />}
    </MenuItem>
  );
};

const NavMenuItem = ({ item }: { item: any }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const isActive = isMenuActive(item, location.pathname);

  const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const buttonStyle = {
    color: "white",
    textTransform: "none",
    fontSize: "14px",
    fontWeight: 500,
    whiteSpace: "nowrap",
    minWidth: "auto",
    px: 2,
    position: "relative",
    borderRadius: "8px",
    backgroundColor: isActive ? "rgba(255, 255, 255, 0.15)" : "transparent",
    "&:hover": {
      backgroundColor: "rgba(255, 255, 255, 0.1)",
    },
  };

  // Trường hợp 1: Có menu con (subMenu)
  if (item.subMenu && item.subMenu.length > 0) {
    return (
      <>
        <Button
          color="inherit"
          onClick={handleOpen}
          startIcon={item.icon}
          endIcon={<KeyboardArrowDown />}
          sx={buttonStyle}
        >
          {item.text}
          {item.count > 0 && <ShowCount count={item.count} />}
        </Button>
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          MenuListProps={{
            "aria-labelledby": "basic-button",
          }}
          slotProps={{
            paper: {
              sx: {
                padding: "8px",
                borderRadius: "10px",
                boxShadow: "0px 5px 15px rgba(0,0,0,0.1)",
                maxHeight: 300,
                "&::-webkit-scrollbar": {
                  width: "6px", // Thanh cuộn nhỏ lại
                  borderRadius: "10px", // Bo góc thanh cuộn
                },

                "&::-webkit-scrollbar-track": {
                  background: "#f1f1f1", // Màu nền track
                  borderRadius: "10px",
                },

                "&::-webkit-scrollbar-thumb": {
                  background: "#c1c1c1", // Màu thanh cuộn
                  borderRadius: "10px",

                  "&:hover": {
                    background: "#a8a8a8", // Màu khi hover
                  },
                },
              },
            },
          }}
        >
          {item.subMenu.map((subItem: any, index: number) => (
            <NestedMenuItem
              key={index}
              item={subItem}
              handleCloseMenu={handleClose}
            />
          ))}
        </Menu>
      </>
    );
  }

  // Trường hợp 2: Menu đơn (không có con)
  return (
    <Button
      onClick={() => navigate(item.path)}
      startIcon={item.icon}
      sx={buttonStyle}
    >
      {item.text}
      {item.count > 0 && <ShowCount count={item.count} />}
    </Button>
  );
};

export default function Menuheader() {
  const { user } = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const permissions =
    user?.role
      ?.filter((r: any) => r.canRead)
      .map((r: any) => r.permissionCode) || [];
  const hasPermission = (code?: string) => {
    if (!code) return true; // menu không yêu cầu quyền
    return permissions.includes(code);
  };
  const [anchorElSetting, setAnchorElSetting] = useState<null | HTMLElement>(
    null,
  );
  const [openExpirationDialog, setOpenExpirationDialog] = useState(false);
  const [openMssqlDialog, setOpenMssqlDialog] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const menuScrollRef = React.useRef<HTMLDivElement>(null);

  const handleOpenSettingMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElSetting(event.currentTarget);
  };
  const handleCloseSettingMenu = () => {
    setAnchorElSetting(null);
  };

  const handleOpenExpirationDialog = () => {
    handleCloseSettingMenu();
    setOpenExpirationDialog(true);
  };

  const handleCloseExpirationDialog = () => {
    setOpenExpirationDialog(false);
  };

  const handleOpenMssqlDialog = () => {
    handleCloseSettingMenu();
    setOpenMssqlDialog(true);
  };

  const handleCloseMssqlDialog = () => {
    setOpenMssqlDialog(false);
  };

  const handleSaveMssqlConfig = (config: any) => {
    setOpenSnackbar(true);
  };

  const { config, updateConfig, isUpdatingConfig, counts } = useMenuData();

  const {
    assetTransfer: assetTransferCounts,
    toolTransfer: toolTransferCounts,
    transferAssetPageItems,
    transferToolPageItems,
    shareCounts,
    signCounts,
  } = counts;

  const handleConfirmExpiration = async (
    expirationDays: number,
    warningDays: number,
    registrationWarningDays: number,
    maxTabs: number,
  ) => {
    if (
      config?.thoiHanTaiLieu !== expirationDays ||
      config?.ngayBaoHetHan !== warningDays ||
      config?.ngayBaoDangKiem !== registrationWarningDays ||
      config?.soTabToiDa !== maxTabs
    ) {
      updateConfig({
        thoiHanTaiLieu: expirationDays,
        ngayBaoHetHan: warningDays,
        ngayBaoDangKiem: registrationWarningDays,
        soTabToiDa: maxTabs,
      });
      setOpenSnackbar(true);
      handleCloseExpirationDialog();
    } else {
      handleCloseExpirationDialog();
    }
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  const filterMenuItemsRecursive = (items: any[]): any[] => {
    return items
      .filter((item) => hasPermission(item.code))
      .map((item) => {
        if (item.subMenu) {
          const filteredSubMenu = filterMenuItemsRecursive(item.subMenu);
          return { ...item, subMenu: filteredSubMenu };
        }
        return item;
      })
      .filter((item) => (item.subMenu ? item.subMenu.length > 0 : true));
  };

  const menuItemsRaw = [
    {
      text: "Tổng quan",
      icon: <Dashboard fontSize="small" />,
      path: ROUTES.MAIN,
    },
    {
      text: "Danh mục",
      icon: <Category fontSize="small" />,
      path: "#",
      subMenu: [
        {
          text: "Danh mục hệ thống",
          path: "#",
          subMenu: [
            { text: "Quản lý nhân viên", path: ROUTES.STAFF, code: "NHANVIEN" },
            {
              text: "Quản lý phòng ban",
              path: ROUTES.DEPARTMENT,
              code: "PHONGBAN",
            },
            { text: "Quản lý chức vụ", path: ROUTES.POSITION },
          ],
        },
        {
          text: "Danh mục thiết bị",
          path: "#",
          subMenu: [
            {
              text: "Nhóm tài sản",
              path: ROUTES.ASSETGROUP,
            },
            {
              text: "Mô hình tài sản",
              path: ROUTES.MODELASSET,
            },
            { text: "Lý lịch tài sản", path: ROUTES.ASSETPROFILE },
            { text: "Loại tài sản", path: ROUTES.TYPEASSET },
            { text: "Nhóm ccdc-vật tư", path: ROUTES.TOOLGROUP },
            { text: "Loại ccdc-vật tư", path: ROUTES.TOOLTYPE },
            { text: "CCDC-Vật tư", path: ROUTES.TOOLCATEGORY, code: "CCDCVT" },
          ],
        },
        {
          text: "Danh mục khác",
          path: "#",
          subMenu: [
            { text: "Quản lý dự án", path: ROUTES.PROJECT, code: "DUAN" },
            {
              text: "Quản lý nguồn vốn",
              path: ROUTES.CAPITALSOURCE,
              code: "NGUONVON",
            },
            { text: "Lý do tăng", path: ROUTES.REASONINCREASE },
            { text: "Loại sửa chữa", path: ROUTES.MAINTENANCEREPAIRTYPE },
            { text: "Đơn vị tính", path: ROUTES.UNIT },
            { text: "Hiện trạng", path: ROUTES.CURRENTSTATUS },
            { text: "Biên bản sửa chữa", path: ROUTES.REPAIRREPORTTEMPLATE },
          ],
        },
      ],
    },
    {
      text: "Quản lý tài sản",
      icon: <Inventory fontSize="small" />,
      path: "#",
      subMenu: [
        { text: "Quản lý tài sản", path: ROUTES.ASSETMANAGER, code: "TAISAN" },
        {
          text: "Quản lý CCDC-Vật tư",
          path: ROUTES.TOOLMANAGER,
          code: "CCDCVT",
        },
      ],
    },
    {
      text: "Điều chuyển thiết bị",
      icon: <LocalShipping fontSize="small" />,
      path: "#",
      count:
        assetTransferCounts.total +
        toolTransferCounts.total +
        assetTransferCounts.banHanhTotal +
        toolTransferCounts.banHanhTotal +
        shareCounts.totalTransfer,
      subMenu: [
        {
          text: "Điều chuyển tài sản",
          path: "#",
          code: "DIEUDONG_TAISAN",
          subMenu: [
            {
              text: "Cấp phát tài sản",
              path: `${ROUTES.ASSETTRANSFER}?type=1`,
            },
            {
              text: "Điều chuyển tài sản",
              path: `${ROUTES.ASSETTRANSFER}?type=2`,
            },
            {
              text: "Thu hồi tài sản",
              path: `${ROUTES.ASSETTRANSFER}?type=3`,
            },
          ],
        },
        {
          text: "Điều chuyển CCDC",
          path: "#",
          code: "DIEUDONG_CCDC",
          subMenu: [
            {
              text: "Cấp phát CCDC",
              path: `${ROUTES.TOOLTRANSFER}?type=1`,
            },
            {
              text: "Điều chuyển CCDC",
              path: `${ROUTES.TOOLTRANSFER}?type=2`,
            },
            {
              text: "Thu hồi CCDC",
              path: `${ROUTES.TOOLTRANSFER}?type=3`,
            },
          ],
        },
        {
          text: "Phê duyệt",
          path: ROUTES.TRANSFER_APPROVAL,
          count: assetTransferCounts.total + toolTransferCounts.total,
        },
        {
          text: "Quản lý biên bản",
          path: ROUTES.TRANSFER_RECORD,
          count:
            shareCounts.totalTransfer +
            assetTransferCounts.banHanhTotal +
            toolTransferCounts.banHanhTotal,
        },
      ],
    },
    {
      text: "Bàn giao thiết bị",
      icon: <Handshake fontSize="small" />,
      path: "#",
      count:
        signCounts.totalAssetHandover +
        signCounts.totalToolHandover +
        transferAssetPageItems +
        transferToolPageItems +
        shareCounts.totalHandover,
      subMenu: [
        {
          text: "Bàn giao tài sản",
          path: "/ban_giao_tai_san",
          code: "BANGIAO_TAISAN",
          count: transferAssetPageItems,
        },
        {
          text: "Bàn giao CCDC",
          path: ROUTES.TOOLHANDOVER,
          code: "BANGIAO_CCDC",
          count: transferToolPageItems,
        },
        {
          text: "Phê duyệt",
          path: ROUTES.HANDOVER_APPROVAL,
          count: signCounts.totalAssetHandover + signCounts.totalToolHandover,
        },
        {
          text: "Quản lý biên bản",
          path: ROUTES.HANDOVER_RECORD,
          count: shareCounts.totalHandover,
        },
      ],
    },
    {
      text: "Sửa chữa bảo dưỡng",
      icon: <Engineering fontSize="small" />,
      path: "#",
      count: signCounts.totalMaintance + shareCounts.totalMaintance,
      subMenu: [
        {
          text: "Quản lý sửa chữa",
          path: ROUTES.MAINTENANCE_MANAGER,
        },
        {
          text: "Chu kỳ bảo dưỡng",
          path: ROUTES.MAINTENANCE_CYCLE,
        },
        {
          text: "Định mức",
          path: ROUTES.REPAIRNORM,
        },
        {
          text: "Kế hoạch sửa chữa",
          path: ROUTES.MAINTENANCEPLANREPAIR,
        },
        {
          text: "Phê duyệt",
          path: ROUTES.MAINTENANCE_APPROVAL,
          count: signCounts.totalMaintance,
        },
        {
          text: "Quản lý biên bản",
          path: ROUTES.MAINTENANCE_RECORD,
          count: shareCounts.totalMaintance,
        },
      ],
    },
    {
      text: "Báo cáo",
      icon: <Assessment fontSize="small" />,
      path: ROUTES.REPORT,
      code: "BAOCAO",
    },
    {
      text: "HDSD",
      icon: <Description fontSize="small" />,
      path: ROUTES.HUONGDAN,
    },
  ];

  const menuItems = filterMenuItemsRecursive(menuItemsRaw);

  const checkScroll = () => {
    if (menuScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = menuScrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const handleScrollRight = () => {
    if (menuScrollRef.current) {
      menuScrollRef.current.scrollBy({
        left: 200,
        behavior: "smooth",
      });
      setTimeout(checkScroll, 300);
    }
  };

  const handleScrollLeft = () => {
    if (menuScrollRef.current) {
      menuScrollRef.current.scrollBy({
        left: -200,
        behavior: "smooth",
      });
      setTimeout(checkScroll, 300);
    }
  };

  React.useEffect(() => {
    checkScroll();
    const ref = menuScrollRef.current;
    if (ref) {
      ref.addEventListener("scroll", checkScroll);
      window.addEventListener("resize", checkScroll);

      return () => {
        ref.removeEventListener("scroll", checkScroll);
        window.removeEventListener("resize", checkScroll);
      };
    }
  }, [menuItems]);

  return (
    <Box
      sx={{
        height: "60px",
        display: "flex",
        gap: 3,
        px: 3,
        background: `linear-gradient(to right,${currentBrandConfig.primaryColor} 0%,${currentBrandConfig.primaryColor} 100%)`,
      }}
    >
      {canScrollLeft && (
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <IconButton
            onClick={handleScrollLeft}
            sx={{
              color: "white",
              p: 0.5,
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              },
            }}
          >
            <ChevronLeft />
          </IconButton>
        </Box>
      )}

      <Box
        ref={menuScrollRef}
        sx={{
          flexGrow: 1,
          display: "flex",
          gap: 0.5,
          overflowX: "auto",
          whiteSpace: "nowrap",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          "&::-webkit-scrollbar": {
            display: "none",
          },
        }}
      >
        {menuItems.map((item, index) => (
          <NavMenuItem key={index} item={item} />
        ))}
      </Box>

      {canScrollRight && (
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <IconButton
            onClick={handleScrollRight}
            sx={{
              color: "white",
              p: 0.5,
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              },
            }}
          >
            <ChevronRight />
          </IconButton>
        </Box>
      )}
      <Box sx={{ flexGrow: 0 }}>
        <IconButton
          sx={{ display: "flex", gap: 2 }}
          onClick={handleOpenSettingMenu}
        >
          <Typography
            noWrap
            sx={{
              color: "white",
              fontSize: 12,
              maxWidth: "150px",
              display: "block",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {user?.taiKhoan?.hoTen}
          </Typography>
          <Avatar src={currentBrandConfig.logo} />
        </IconButton>
        <Menu
          id="menu-appbar"
          anchorEl={anchorElSetting}
          open={Boolean(anchorElSetting)}
          onClose={handleCloseSettingMenu}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "center",
          }}
          slotProps={{
            paper: {
              sx: {
                padding: "8px",
                borderRadius: "12px",
                boxShadow: "0px 5px 15px rgba(0,0,0,0.1)",
              },
            },
          }}
        >
          <MenuItem
            sx={{ borderBottom: "1px solid black", display: "flex", gap: 2 }}
          >
            <ListItemIcon>
              <Avatar src={currentBrandConfig.logo} alt="avatar" />
            </ListItemIcon>
            <Typography>{user?.taiKhoan?.hoTen}</Typography>
          </MenuItem>
          <MenuItem sx={{ py: 2 }} onClick={handleCloseSettingMenu}>
            <ListItemIcon>
              <Person
                fontSize="small"
                sx={{ color: currentBrandConfig.primaryColor }}
              />
            </ListItemIcon>
            <Typography
              component={Link}
              to="/tai_khoan"
              sx={{
                textDecoration: "none",
                color: "black",
                cursor: "pointer",
              }}
            >
              Quản lý tài khoản
            </Typography>
          </MenuItem>
          <MenuItem sx={{ py: 2 }} onClick={handleOpenExpirationDialog}>
            <ListItemIcon>
              <Settings
                fontSize="small"
                sx={{ color: currentBrandConfig.primaryColor }}
              />
            </ListItemIcon>
            <Typography>Thiết lập cấu hình</Typography>
          </MenuItem>
          <MenuItem sx={{ py: 2 }} onClick={handleOpenMssqlDialog}>
            <ListItemIcon>
              <Storage
                fontSize="small"
                sx={{ color: currentBrandConfig.primaryColor }}
              />
            </ListItemIcon>
            <Typography>Cấu hình server</Typography>
          </MenuItem>
          <MenuItem
            sx={{ py: 2 }}
            onClick={() => {
              handleCloseSettingMenu();
              dispatch(clearTabs());
              dispatch(logout());
              navigate(ROUTES.LOGIN);
            }}
          >
            <ListItemIcon>
              <Logout
                fontSize="small"
                sx={{ color: currentBrandConfig.primaryColor }}
              />
            </ListItemIcon>
            <Typography>Đăng xuất</Typography>
          </MenuItem>
        </Menu>
      </Box>

      <ExpirationSettingDialog
        open={openExpirationDialog}
        onClose={handleCloseExpirationDialog}
        onConfirm={handleConfirmExpiration}
        initialConfig={config || undefined}
        loading={isUpdatingConfig}
      />

      <MssqlConfigDialog
        open={openMssqlDialog}
        onClose={handleCloseMssqlDialog}
        onSave={handleSaveMssqlConfig}
      />

      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        message="Thiết lập thời gian hết hạn thành công"
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        ContentProps={{
          sx: {
            backgroundColor: "#1b8a4a",
            color: "white",
            fontWeight: 500,
          },
        }}
      />
    </Box>
  );
}
