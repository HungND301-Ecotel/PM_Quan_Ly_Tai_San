import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import dayjs from "dayjs";
import {
  BarChart,
  Close,
  Delete,
  Search,
  Edit,
  TableChart,
  Mail,
} from "@mui/icons-material";
import {
  Autocomplete,
  Box,
  Button,
  Grid,
  IconButton,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import {
  DataGrid,
  GridColDef,
  GridToolbar,
  GridFilterPanel,
  GridColumnVisibilityModel,
  GridFeatureMode,
  ColumnsPanelTrigger,
  FilterPanelTrigger,
  ExportPrint,
  ToolbarButton,
  Toolbar,
} from "@mui/x-data-grid";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import Tooltip from "@mui/material/Tooltip";
import { viVN } from "@mui/x-data-grid/locales";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../utils/routes";
import FieldDate from "../TextField/FieldDate";
import { showConfirmAlert } from "../Alert";
import { Dispatch, SetStateAction } from "react";
import { FilterOption, FilterStatusGroup } from "./FilterStatusGroup";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import DecisionButton from "../Button/DecisionButton";
import { usePositionMutation } from "../../pages/Position/Mutation";
import { PrinterIcon } from "lucide-react";
import ViewColumnIcon from "@mui/icons-material/ViewColumn";
import FilterListIcon from "@mui/icons-material/FilterList";
import PrintIcon from "@mui/icons-material/Print";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { useRef } from "react";
import FieldSearch from "../TextField/FieldSearch";
import FieldAutoCompleted from "../TextField/FieldAutoCompleted";
import { currentBrandConfig } from "../../config/brandConfig";
const CustomFilterPanel = (props: any) => {
  return (
    <GridFilterPanel
      {...props}
      filterFormProps={{
        operatorInputProps: { disabled: true, style: { display: "none" } },
      }}
    />
  );
};

const CustomToolbar = ({
  isCompact,
  isFullscreen,
  onToggleFullscreen,
  onImportExcel,
  onExportExcel,
  onExportSelectedExcel,
  hasSelection,
}: {
  isCompact: boolean;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onImportExcel?: (file: File) => void;
  onExportExcel?: () => void;
  onExportSelectedExcel?: () => void;
  hasSelection?: boolean;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (isCompact) return null;
  return (
    <Toolbar>
      <ColumnsPanelTrigger
        render={
          <ToolbarButton
            render={
              <Button
                startIcon={
                  <ViewColumnIcon
                    sx={{ color: currentBrandConfig.primaryColor }}
                  />
                }
                sx={{ color: currentBrandConfig.primaryColor }}
              >
                Columns
              </Button>
            }
          />
        }
      />
      <FilterPanelTrigger
        render={
          <ToolbarButton
            render={
              <Button
                startIcon={
                  <FilterListIcon
                    sx={{ color: currentBrandConfig.primaryColor }}
                  />
                }
                sx={{ color: currentBrandConfig.primaryColor }}
              >
                Filter
              </Button>
            }
          />
        }
      />
      <ExportPrint
        render={
          <ToolbarButton
            render={
              <Button
                startIcon={
                  <PrintIcon sx={{ color: currentBrandConfig.primaryColor }} />
                }
                sx={{ color: currentBrandConfig.primaryColor }}
              >
                Print
              </Button>
            }
          />
        }
      />

      {/* Nút Import Excel */}
      {onImportExcel && (
        <>
          <input
            type="file"
            hidden
            ref={fileInputRef}
            accept=".xlsx,.xls"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                onImportExcel(file);
                e.target.value = "";
              }
            }}
          />
          <ToolbarButton
            render={
              <Button
                startIcon={
                  <UploadFileIcon
                    sx={{ color: currentBrandConfig.primaryColor }}
                  />
                }
                sx={{ color: currentBrandConfig.primaryColor }}
                onClick={() => fileInputRef.current?.click()}
              >
                Import Excel
              </Button>
            }
          />
        </>
      )}

      {/* Nút Xuất Excel */}
      {onExportExcel && (
        <ToolbarButton
          render={
            <Button
              startIcon={
                <FileDownloadIcon
                  sx={{ color: currentBrandConfig.primaryColor }}
                />
              }
              sx={{ color: currentBrandConfig.primaryColor }}
              onClick={onExportExcel}
            >
              Xuất Excel
            </Button>
          }
        />
      )}

      {/* Nút Xuất Excel các hàng đã chọn */}
      {onExportSelectedExcel && hasSelection && (
        <ToolbarButton
          render={
            <Button
              startIcon={
                <FileDownloadIcon
                  sx={{ color: currentBrandConfig.primaryColor }}
                />
              }
              sx={{
                color: currentBrandConfig.primaryColor,
                fontWeight: 700,
                border: `1px solid ${currentBrandConfig.primaryColor}`,
                borderRadius: "6px",
                px: 1.5,
              }}
              onClick={onExportSelectedExcel}
            >
              Xuất đã chọn
            </Button>
          }
        />
      )}

      {/* Đẩy nút fullscreen sang phải */}
      <Box sx={{ flex: 1 }} />

      <Tooltip
        title={isFullscreen ? "Thu nhỏ (Esc)" : "Phóng to toàn màn hình"}
      >
        <ToolbarButton
          render={
            <Button
              aria-label={isFullscreen ? "exit fullscreen" : "fullscreen"}
              onClick={onToggleFullscreen}
              sx={{ color: currentBrandConfig.primaryColor, minWidth: "auto" }}
            >
              {isFullscreen ? (
                <FullscreenExitIcon fontSize="small" />
              ) : (
                <FullscreenIcon fontSize="small" />
              )}
            </Button>
          }
        />
      </Tooltip>
    </Toolbar>
  );
};

interface Props {
  tableId?: string;
  title: string;
  columns: GridColDef[];
  rows: any[];
  total?: number;
  paginationModel?: { page: number; pageSize: number };
  onPaginationModelChange?: (model: any) => void;
  loading?: boolean;
  onRowClick?: (params: any) => void;
  isFilterDate?: boolean;
  isDepreciation?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  onSelectionRowsChange?: (rows: any[]) => void;
  onDelete?: (ids: string[]) => void;
  canSign?: (items: any[], user: any) => boolean;
  onSign?: (fileName: string, item: any) => void;
  searchValue?: string;
  setSearchValue?: Dispatch<SetStateAction<string>>;
  showStatusFilter?: boolean;
  selectedDate?: string;
  setSelectedDate?: Dispatch<SetStateAction<string>>;
  paginationMode?: GridFeatureMode;
  statusOptions?: FilterOption[];
  statusValue?: any;
  onStatusChange?: (val: any) => void;
  checkboxSelection?: boolean;
  showDelete?: boolean;
  handleSendToSigner?: (selectedItem: any[]) => void;
  handleAssetTransfer?: (department: string) => void;
  isCheckShowShare?: (item: any[]) => boolean;
  handleSignDocument?: (item: any, user: any, onSign: () => void) => void;
  handleSignDocuments?: (items: any[]) => void;
  titleSearch?: string;
  extraActions?: React.ReactNode;
  customContent?: React.ReactNode;
  departments?: any[];
  selectedDepartment?: string;
  setSelectedDepartment?: Dispatch<SetStateAction<string>>;
  isFilterDepartment?: boolean;
  showDeleteAll?: boolean;
  onDeleteAll?: () => void;
  isDecision?: (data: any[]) => boolean;
  handleDecision?: (item: any) => void;
  titleSelectedDate?: string;
  isRowSelectable?: (params: any) => boolean;
  isCompact?: boolean;
  highlightedId?: string | number;
  highlightedRowIds?: (string | number)[];
  highlightColor?: string;
  showToolbar?: boolean;
  onImportExcel?: (file: File) => void;
  onExportExcel?: () => void;
  onExportSelectedExcel?: (selectedRows: any[]) => void;
  exportSelectedFileName?: string;
  onBulkEdit?: () => void;
  bulkEditCount?: number;
  sx?: any;
  getRowHeight?: (params: any) => number | "auto" | null;
}

export default function TableCustom({
  tableId,
  title,
  columns,
  rows,
  showToolbar = true,
  total,
  paginationModel,
  onPaginationModelChange,
  loading = false,
  onRowClick,
  isFilterDate = false,
  isDepreciation = false,
  selectedIds = [],
  onSelectionChange,
  onSelectionRowsChange,
  onDelete,
  onSign,
  canSign,
  searchValue,
  setSearchValue,
  showStatusFilter = true,
  paginationMode = "server",
  statusOptions = [],
  statusValue,
  onStatusChange,
  checkboxSelection = true,
  showDelete = true,
  handleSendToSigner,
  handleAssetTransfer,
  isCheckShowShare,
  handleSignDocument,
  handleSignDocuments,
  selectedDate,
  setSelectedDate,
  titleSearch = "Tìm kiếm ...",
  extraActions,
  customContent,
  departments = [],
  selectedDepartment,
  setSelectedDepartment,
  isFilterDepartment = false,
  showDeleteAll = false,
  onDeleteAll,
  isDecision,
  handleDecision,
  isRowSelectable,
  titleSelectedDate = "Chọn thời gian",
  isCompact = false,
  highlightedId,
  highlightedRowIds = [],
  highlightColor = "rgba(31, 164, 99, 0.12)",
  onImportExcel,
  onExportExcel,
  onExportSelectedExcel,
  exportSelectedFileName,
  bulkEditCount,
  onBulkEdit,
  sx,
  getRowHeight,
}: Props) {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.user);
  const [selectedItem, setSelectedItem] = useState<any[]>([]);
  const [columnVisibilityModel, setColumnVisibilityModel] =
    useState<GridColumnVisibilityModel>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const savedPageSizeRef = useRef<number>(paginationModel?.pageSize ?? 10);
  const [allSelectedRows, setAllSelectedRows] = useState<Map<string, any>>(
    new Map(),
  );
  const [isPermissionBanHanh, setIsPermissionBanHanh] = useState(false);
  const { getByIdMutation } = usePositionMutation();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      // Lưu pageSize hiện tại
      savedPageSizeRef.current = paginationModel?.pageSize ?? 10;
      const availableHeight = window.innerHeight - 200;
      const rowHeight = 52;
      const autoRows = Math.max(10, Math.floor(availableHeight / rowHeight));

      onPaginationModelChange?.({ page: 0, pageSize: autoRows });
      setIsFullscreen(true);
    } else {
      // Restore về pageSize cũ
      onPaginationModelChange?.({
        page: 0,
        pageSize: savedPageSizeRef.current,
      });
      setIsFullscreen(false);
    }
  };
  useEffect(() => {
    const checkPermission = async () => {
      if (user?.taiKhoan?.chucVuId) {
        try {
          const chucvu = await getByIdMutation.mutateAsync(
            user.taiKhoan.chucVuId,
          );
          setIsPermissionBanHanh(!!chucvu?.data?.banHanhQuyetDinh);
        } catch (error) {
          console.error("Lỗi lấy quyền:", error);
        }
      }
    };

    checkPermission();
  }, [user?.taiKhoan?.chucVuId]);

  useEffect(() => {
    if (tableId) {
      const savedColumns = localStorage.getItem(`table_columns_${tableId}`);
      if (savedColumns) {
        try {
          setColumnVisibilityModel(JSON.parse(savedColumns));
        } catch (error) {
          console.error("Lỗi khi đọc cấu hình cột:", error);
        }
      }
    }
  }, [tableId]);
  useEffect(() => {
    if (selectedIds.length === 0) {
      setAllSelectedRows(new Map());
    }
  }, [selectedIds.length]);
  // Hàm xử lý khi người dùng thay đổi trạng thái ẩn/hiện cột
  const handleColumnVisibilityChange = (
    newModel: GridColumnVisibilityModel,
  ) => {
    setColumnVisibilityModel(newModel);
    if (tableId) {
      localStorage.setItem(
        `table_columns_${tableId}`,
        JSON.stringify(newModel),
      );
    }
  };
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        onPaginationModelChange?.({
          page: 0,
          pageSize: savedPageSizeRef.current,
        });
        setIsFullscreen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);
  return (
    <Box
      ref={containerRef}
      sx={
        isFullscreen
          ? {
              position: "fixed",
              inset: 0,
              width: "100vw",
              height: "100vh",
              zIndex: 1200,
              bgcolor: "background.paper",
              overflow: "auto",
              display: "flex",
              flexDirection: "column",
            }
          : {
              display: "flex",
              flexDirection: "column",
              ...sx,
            }
      }
    >
      <Paper
        sx={{
          my: isFullscreen || sx?.height ? 0 : 2,
          width: "100%",
          flex: isFullscreen || sx?.height ? 1 : undefined,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box
          display={"flex"}
          alignItems={"center"}
          justifyContent={"space-between"}
          p={1}
          sx={{ background: "#f5efefff" }}
        >
          <Box display="flex" alignItems="center" gap={1} sx={{ width: "40%" }}>
            <TableChart
              sx={{
                fontSize: 20,
                color: "#737373ff",
              }}
            />
            <Typography
              sx={{
                fontWeight: 500,
                color: "#737373ff",
                fontSize: "14px",
              }}
            >
              {title} ({total})
            </Typography>
          </Box>

          {/* Cụm Checkbox trạng thái hiển thị dựa trên biến boolean */}
          {showStatusFilter && !isCompact && (
            <Box display="flex" sx={{ width: "60%" }}>
              <FilterStatusGroup
                options={statusOptions}
                selectedValue={statusValue}
                onChange={(val) => onStatusChange?.(val)}
              />
            </Box>
          )}
        </Box>

        <Grid container spacing={2} p={2}>
          <Grid size={{ xs: 12, sm: isCompact ? 12 : 4 }}>
            <FieldSearch
              searchValue={searchValue}
              setSearchValue={setSearchValue}
              titleSearch={titleSearch}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: isCompact ? 12 : 3 }}>
            {isFilterDepartment && !isCompact && (
              <FieldAutoCompleted
                title="Tìm kiếm theo phòng ban ..."
                data={departments}
                labelkey="tenPhongBan"
                value={selectedDepartment}
                setValue={setSelectedDepartment}
              />
            )}
          </Grid>
          {isFilterDate && !isCompact && (
            <Grid size={{ xs: 12, sm: 2 }}>
              <FieldDate
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                title={titleSelectedDate}
              />
            </Grid>
          )}
          <Grid size={{ xs: 12, sm: isCompact ? 12 : 5 }}>
            <Box
              display={"flex"}
              justifyContent={isCompact ? "flex-start" : "flex-end"}
              gap={1}
              flexWrap="wrap"
            >
              {/* <Button variant="outlined" size="small" startIcon={<Settings />}>
              Cấu hình cột
            </Button> */}
              {selectedItem && canSign?.(selectedItem, user) && (
                <Button
                  size="small"
                  variant="contained"
                  color="primary"
                  startIcon={<Edit />}
                  onClick={async (e) => {
                    e.stopPropagation();
                    const items = [...selectedItem];
                    handleSignDocuments?.(items);
                    handleSignDocument?.(items[0], user, () =>
                      onSign?.(
                        items[0]?.taiLieuCuoi || items[0]?.taiLieuBangKe,
                        items[0],
                      ),
                    );
                    setSelectedItem([]);
                    onSelectionChange?.([]);
                  }}
                >
                  Ký biên bản ({selectedItem.length})
                </Button>
              )}
              {selectedItem.length > 0 &&
                isPermissionBanHanh &&
                isDecision?.(selectedItem) && (
                  <DecisionButton
                    data={selectedItem}
                    handleDecision={handleDecision}
                    onClose={() => {
                      setSelectedItem([]);
                      onSelectionChange?.([]);
                    }}
                  />
                )}
              {selectedItem && isCheckShowShare?.(selectedItem) && (
                <Button
                  size="small"
                  variant="contained"
                  color="warning"
                  startIcon={<Mail fontSize="small" />}
                  sx={{
                    color: "#fff",
                    px: 3,
                    borderRadius: "8px",
                    textTransform: "none",
                    fontWeight: "bold",
                  }}
                  onClick={async (e) => {
                    e.stopPropagation();
                    await handleSendToSigner?.(selectedItem);
                    setSelectedItem([]);
                  }}
                >
                  Trình duyệt người ký ({selectedItem.length})
                </Button>
              )}
              {showDeleteAll && (
                <Button
                  size="small"
                  variant="contained"
                  color="error"
                  startIcon={<Delete />}
                  onClick={async (e) => {
                    e.stopPropagation();
                    const confirm = await showConfirmAlert(
                      `Xác nhận xóa tất cả bản ghi?. bạn không thể hoàn tác!.`,
                    );
                    if (confirm.isConfirmed) {
                      onDeleteAll?.();
                      onSelectionChange?.([]);
                    }
                  }}
                >
                  Xóa tất cả
                </Button>
              )}

              {selectedIds.length > 0 && showDelete && (
                <Button
                  size="small"
                  variant="contained"
                  color="error"
                  startIcon={<Delete />}
                  onClick={async (e) => {
                    e.stopPropagation();
                    const confirm = await showConfirmAlert(
                      `Xác nhận xóa ${selectedIds.length} bản ghi?`,
                    );
                    if (confirm.isConfirmed) {
                      onDelete?.(selectedIds);
                      onSelectionChange?.([]);
                    }
                  }}
                >
                  {selectedIds.length} Xóa đã chọn
                </Button>
              )}
              {onBulkEdit && (
                <Button variant="outlined" size="small" onClick={onBulkEdit}>
                  Sửa hàng loạt
                </Button>
              )}
              {isDepreciation && (
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<BarChart />}
                  onClick={() => navigate(ROUTES.ASSETDEPRECIATION)}
                >
                  Khấu hao tài sản
                </Button>
              )}
              {extraActions}
            </Box>
          </Grid>
        </Grid>
        <Box sx={{ width: "100%", overflow: "hidden", flex: 1, minHeight: 0 }}>
          {customContent ? (
            customContent
          ) : (
            <DataGrid
              getRowId={(row) => row.Id || row.id || row.soThe}
              onRowClick={onRowClick}
              columns={columns}
              keepNonExistentRowsSelected
              rows={rows}
              showCellVerticalBorder={true}
              showToolbar={showToolbar && !isCompact}
              rowCount={total}
              paginationMode={paginationMode}
              paginationModel={paginationModel}
              onPaginationModelChange={onPaginationModelChange}
              pageSizeOptions={[10, 20, 50, 100]}
              loading={loading}
              // autoPageSize={isFullscreen}
              checkboxSelection={checkboxSelection}
              columnVisibilityModel={columnVisibilityModel}
              onColumnVisibilityModelChange={handleColumnVisibilityChange}
              rowSelectionModel={
                selectedIds && selectedIds.length > 0
                  ? { type: "include" as const, ids: new Set(selectedIds) }
                  : { type: "include" as const, ids: new Set() }
              }
              onRowSelectionModelChange={(newSelection: any) => {
                let result: string[] = [];
                if (newSelection?.type === "exclude") {
                  const excludedIds = Array.from(
                    newSelection.ids as Set<string>,
                  );
                  result = rows
                    .map((row) => row.Id || row.id || row.soThe)
                    .filter((id) => !excludedIds.includes(id as string));
                } else if (newSelection?.type === "include") {
                  if (newSelection.ids && newSelection.ids.size > 0) {
                    result = Array.from(newSelection.ids as Set<string>);
                  }
                } else if (Array.isArray(newSelection)) {
                  result = newSelection;
                }
                onSelectionChange?.(result);
                setAllSelectedRows((prev) => {
                  const next = new Map(prev);

                  // Thêm các row mới được chọn từ trang hiện tại
                  rows.forEach((row) => {
                    const rowId = row.Id || row.id || row.soThe;
                    if (result.includes(rowId)) {
                      next.set(rowId, row);
                    } else {
                      next.delete(rowId);
                    }
                  });

                  const nextRows = Array.from(next.values());
                  onSelectionRowsChange?.(nextRows);
                  return next;
                });
                const selectedRows = rows.filter((row) => {
                  const rowId = row.Id || row.id || row.soThe;
                  return result.includes(rowId);
                });
                setSelectedItem(selectedRows);
                handleAssetTransfer?.(selectedRows[0]?.idDonViGiao);
              }}
              disableRowSelectionOnClick
              isRowSelectable={isRowSelectable}
              getRowHeight={getRowHeight}
              getRowClassName={(params) => {
                const rowId =
                  params.row.Id || params.row.id || params.row.soThe;
                if (params.row._isDetailRow) return "detail-row";
                if (rowId === highlightedId) return "highlighted-row";
                if (highlightedRowIds.includes(rowId)) return "highlighted-row";
                return "";
              }}
              slots={{
                toolbar: () => (
                  <CustomToolbar
                    isCompact={isCompact}
                    isFullscreen={isFullscreen}
                    onToggleFullscreen={toggleFullscreen}
                    onImportExcel={onImportExcel}
                    onExportExcel={onExportExcel}
                    hasSelection={selectedItem.length > 0}
                    onExportSelectedExcel={
                      onExportSelectedExcel
                        ? () => {
                            // @ts-ignore
                            onExportSelectedExcel(
                              Array.from(allSelectedRows.values()),
                            );
                          }
                        : allSelectedRows.size > 0
                          ? () => {
                              const wb = XLSX.utils.book_new();
                              // @ts-ignore
                              const ws = XLSX.utils.json_to_sheet(
                                Array.from(allSelectedRows.values()),
                              );
                              XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
                              XLSX.writeFile(
                                wb,
                                `${exportSelectedFileName ?? "Danh_sach_da_chon"}_${dayjs().format("YYYYMMDD")}.xlsx`,
                              );
                            }
                          : undefined
                    }
                  />
                ),
                filterPanel: CustomFilterPanel,
              }}
              localeText={viVN.components.MuiDataGrid.defaultProps.localeText}
              slotProps={{
                loadingOverlay: {
                  variant: "linear-progress",
                  noRowsVariant: "skeleton",
                },
                filterPanel: { disableAddFilterButton: false },
                toolbar: {
                  color: currentBrandConfig.primaryColor,
                  csvOptions: { disableToolbarButton: false },
                  printOptions: { disableToolbarButton: false },
                } as any,
              }}
              sx={{
                ...(isFullscreen && { height: "100%" }),
                fontSize: "14px",
                "& .highlighted-row": {
                  backgroundColor: `${highlightColor} !important`,
                  "&:hover": {
                    backgroundColor: `${highlightColor} !important`,
                  },
                },
                "& .transfer-highlight": {
                  backgroundColor: "rgba(255, 152, 0, 0.08) !important",
                  borderLeft: "4px solid #ff9800 !important",
                  "&:hover": {
                    backgroundColor: "rgba(255, 152, 0, 0.14) !important",
                  },
                },
                "& .child-row": {
                  backgroundColor: "rgba(0, 0, 0, 0.02)",
                  "&:hover": {
                    backgroundColor: "rgba(0, 0, 0, 0.04)",
                  },
                },
                "& .MuiDataGrid-toolbarContainer .MuiButton-root": {
                  color: currentBrandConfig.primaryColor,
                  fontWeight: 600,
                  "&:hover": {
                    backgroundColor: "rgba(31, 164, 99, 0.04)",
                  },
                },
                "& .MuiDataGrid-columnHeader": {
                  backgroundColor: currentBrandConfig.primaryColor,
                },
                "& .MuiDataGrid-columnHeaderTitle": {
                  color: "#fff",
                  fontWeight: 700,
                },
                "& .MuiDataGrid-toolbarContainer .MuiButtonBase-root": {
                  color: "#ff5722 !important",
                },
                "& .MuiDataGrid-columnHeader .MuiDataGrid-sortButton": {
                  background: currentBrandConfig.primaryColor,
                  color: "black",
                },
                "& .MuiTablePagination-root": {
                  zIndex: 10000, // cao hơn zIndex fullscreen (9999)
                },
                "& .MuiDataGrid-iconButtonContainer": {
                  visibility: "visible",
                },
                "& .MuiDataGrid-sortIcon": {
                  opacity: 1,
                  color: "#fff",
                },
                "& .MuiDataGrid-menuIcon": {
                  opacity: 1,
                  color: "#fff",
                },
                "& .MuiDataGrid-columnHeaderCheckbox .MuiCheckbox-root": {
                  color: "#fff",
                },
                "& .detail-row": {
                  backgroundColor: "#fafafa",
                  cursor: "default",
                  "&:hover": {
                    backgroundColor: "#fafafa",
                  },
                },
                "& .detail-row .MuiDataGrid-cellCheckbox": {
                  visibility: "hidden",
                },
                "& .detail-row .MuiDataGrid-columnHeaderCheckbox": {
                  visibility: "hidden",
                },
                /* global CSS */
              }}
            />
          )}
        </Box>
      </Paper>
    </Box>
  );
}
