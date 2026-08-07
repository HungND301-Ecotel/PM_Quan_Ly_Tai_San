import { Box, Dialog, DialogContent, Tab, Tabs } from "@mui/material";
import { useEffect, useState } from "react";
import PageAction from "../../components/common/PageAction";
import { GridRowParams } from "@mui/x-data-grid";
import ToolForm from "./components/ToolForm";
import ToolTableCustom from "./components/ToolTableCustom";
import ToolDetailSidebar from "./components/ToolDetailSidebar";
import { useToolManagerMutation, useToolPageQuery, fetchToolDetails } from "./Mutation";
import { createColumns } from "./columnConfig";
import { useAllDepartmentsQuery } from "../Department/Mutation";
import { useAllToolTypeQuery } from "../ToolType/Mutation";
import { useAllUnitsQuery } from "../Unit/Mutation";
import ImportErrorDialog from "../../components/common/ImportErrorDialog";
import { useDebounce } from "../../hooks/useDebounce";
import AssetHistoryModal from "./components/ToolHistoryModal";
import { useLocation, useNavigate } from "react-router-dom";
import SyncLoadingModal from "../../components/common/SyncLoadingModal";
import { RootState } from "../../redux/store";
import { useSelector } from "react-redux";
import SelectDbDialog from "../../components/common/SelectDbDialog";
import ToolOwnershipModal from "./components/ToolOwnershipModal";
import { useTabForm } from "../../redux/useTabForm";
import { hasDraftData } from "../../utils/draftUtils";
import DraftIndicator from "../../components/common/DraftIndicator";
import { currentBrandConfig } from "../../config/brandConfig";

interface ToolManagerTabState {
  showForm: boolean;
  showSidebar: boolean;
  selectedTool: any | null;
  readOnly: boolean;
  isCopy: boolean;
  draftForm?: Record<string, any>;
  activeTab?: number;
}

export default function ToolManager() {
  const { formData, setField } =
    useTabForm<ToolManagerTabState>("/quan_ly_ccdc");
  const showForm = formData.showForm ?? false;
  const selectedTool = formData.selectedTool ?? null;
  const readOnly = formData.readOnly ?? false;
  const isCopy = formData.isCopy ?? false;
  const showSidebar = formData.showSidebar ?? false;
  const activeTab = formData.activeTab ?? 0;
  const setShowForm = (v: boolean) => setField({ showForm: v });
  const setSelectedTool = (v: any) => setField({ selectedTool: v });
  const setReadOnly = (v: boolean) => setField({ readOnly: v });
  const setIsCopy = (v: boolean) => setField({ isCopy: v });
  const setShowSidebar = (v: boolean) => setField({ showSidebar: v });
  const setActiveTab = (v: number) => setField({ activeTab: v });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [openHistory, setOpenHistory] = useState(false);
  const [selectedHistoryTool, setSelectedHistoryTool] = useState<any>(null);
  const [openSelectDb, setOpenSelectDb] = useState(false);
  const [openOwnership, setOpenOwnership] = useState(false);
  const { user } = useSelector((state: RootState) => state.user);

  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [openErrorModal, setOpenErrorModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedToolGroup, setSelectedToolGroup] = useState("");

  const [paginationModel, setPaginationModel] = useState({
    pageSize: 10,
    page: 0,
  });

  const handleMinimize = () => setShowForm(false);
  const isMinimized = !showForm && hasDraftData(formData.draftForm);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state?.autoCreate) {
      setField({ draftForm: undefined });
      setShowForm(true);
      setSelectedTool(null);
      setReadOnly(false);
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  const {
    toolGroups,
    createMutation,
    updateMutation,
    deleteManyMutation,
    exportExcelMutation,
    importExcelMutation,
    syncBakMutation,
    deleteAllMutation,
  } = useToolManagerMutation((messages) => {
    setImportErrors(messages);
    setOpenErrorModal(true);
  });

  const searchDebounce = useDebounce(searchValue, 600);
  const loai = activeTab === 1 ? "vattu" : "ccdc";
  const { data: toolsPage, isLoading, refetch } = useToolPageQuery(
    paginationModel.page,
    paginationModel.pageSize,
    searchDebounce,
    selectedDepartment,
    selectedToolGroup,
    loai,
  );
  const { data: allDepartments = [] } = useAllDepartmentsQuery();

  const handleOpenHistory = (tool: any) => {
    setSelectedHistoryTool(tool);
    setOpenHistory(true);
  };

  const handleCopy = async (row: any) => {
    try {
      const fullTool = await fetchToolDetails(row.id);
      const { id, ...copyData } = fullTool;
      setSelectedTool({ ...copyData, id: "" });
      setIsCopy(true);
      setReadOnly(false);
      setShowForm(true);
      setShowSidebar(false); // Ẩn sidebar nếu nó đang mở
    } catch (e) {
      console.error(e);
    }
  };

  const handleRowEdit = async (row: any) => {
    try {
      const fullTool = await fetchToolDetails(row.id);
      setSelectedTool(fullTool);
      setReadOnly(true);
      setShowForm(true);
      setShowSidebar(false);
    } catch (e) {
      console.error(e);
    }
  };

  const [columns, setColumns] = useState(() =>
    createColumns(
      handleOpenHistory,
      activeTab === 1,
    ),
  );

  useEffect(() => {
    setColumns((prevColumns) => {
      return prevColumns.map((col) => {
        if (col.key === "id") {
          return { ...col, label: activeTab === 1 ? "Mã vật tư" : "Mã CCDC" };
        }
        if (col.key === "ten") {
          return { ...col, label: activeTab === 1 ? "Tên vật tư" : "Tên CCDC" };
        }
        if (col.key === "tenNhomCCDC") {
          return {
            ...col,
            label: activeTab === 1 ? "Nhóm vật tư" : "Nhóm CCDC",
          };
        }
        if (col.key === "donViTinh2" || col.key === "soLuong2") {
          return { ...col, isShow: activeTab === 1 };
        }
        return col;
      });
    });
  }, [activeTab]);

  // const handleRowClick = (params: GridRowParams) => {
  //   setSelectedTool(params.row);
  //   setReadOnly(true);
  //   setShowForm(false);
  // };

  const handleEdit = () => {
    setReadOnly(false);
  };

  const handleSave = (values: any) => {
    if (selectedTool && !isCopy) {
      updateMutation.mutate(values, {
        onSuccess: () => {
          setShowForm(false);
          setSelectedTool(null);
          setIsCopy(false);
          setField({ draftForm: undefined });
        },
      });
    } else {
      createMutation.mutate(values, {
        onSuccess: () => {
          setShowForm(false);
          setSelectedTool(null);
          setIsCopy(false);
          setField({ draftForm: undefined });
        },
      });
    }
  };

  return (
    <Box sx={{ width: "100%" }}>
      <AssetHistoryModal
        open={openHistory}
        onClose={() => setOpenHistory(false)}
        selectedTool={selectedHistoryTool}
      />
      <ToolOwnershipModal
        open={openOwnership}
        onClose={() => setOpenOwnership(false)}
        departments={allDepartments}
      />
      <ImportErrorDialog
        open={openErrorModal}
        onClose={() => setOpenErrorModal(false)}
        errors={importErrors}
      />
      <SelectDbDialog
        open={openSelectDb}
        onClose={() => setOpenSelectDb(false)}
        onConfirm={(dbId) => syncBakMutation.mutate(dbId)}
      />
      <SyncLoadingModal
        open={importExcelMutation.isPending || syncBakMutation.isPending}
        title={
          syncBakMutation.isPending
            ? "Đang đồng bộ SQL Server..."
            : "Đang xử lý file Excel..."
        }
      />
      <PageAction
        title="Quản lý CCDC - Vật tư"
        loading={exportExcelMutation.isPending || importExcelMutation.isPending}
        showExcel={false}
        onRefresh={() => refetch()}
      />
      <Box
        sx={{
          px: 3,
          bgcolor: "white",
          borderBottom: "1px solid",
          borderColor: "divider",
          display: "flex",
          alignItems: "center",
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => {
            setActiveTab(newValue);
            setSelectedIds([]);
          }}
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
              minHeight: "48px",
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
          <Tab label="CCDC" />
          <Tab label="Vật tư" />
        </Tabs>
      </Box>
      <Box p={2}>
        <Dialog
          open={showForm}
          onClose={handleMinimize}
          maxWidth="lg"
          fullWidth
          PaperProps={{ sx: { height: "90vh" } }}
        >
          <DialogContent
            sx={{
              p: 0,
              overflow: "auto",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <ToolForm
              key={`${selectedTool?.id}-true`}
              onCancel={() => {
                setField({ draftForm: undefined });
                setShowForm(false);
                setReadOnly(true);
                setIsCopy(false);
              }}
              onMinimize={handleMinimize}
              selectedTool={selectedTool}
              readOnly={true}
              onEdit={() => {}}
              onSave={() => {}}
              departments={allDepartments}
              toolGroups={toolGroups}
              onFormChange={(values) => setField({ draftForm: values })}
              initialFormData={formData.draftForm}
            />
          </DialogContent>
        </Dialog>

        {isMinimized && <DraftIndicator onClick={() => setShowForm(true)} />}

        <Box
          sx={{
            display: "flex",
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            overflow: "hidden",
            minHeight: 0,
            minWidth: 0,
          }}
        >
          {/* Table */}
          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              overflowX: "auto",
              overflowY: "hidden",
              borderRight: selectedTool && showSidebar ? "1px solid" : "none",
              borderColor: "divider",
              transition: "border 0.3s ease",
            }}
          >
            <ToolTableCustom
              tableId="toolManager"
              title={activeTab === 1 ? "Quản lý Vật tư" : "Quản lý CCDC"}
              rows={toolsPage?.items || []}
              total={toolsPage?.totalItems || 0}
              columns={columns}
              onColumnsChange={setColumns}
              onRowClick={async (row) => {
                try {
                  const fullTool = await fetchToolDetails(row.id);
                  setSelectedTool(fullTool);
                  setShowSidebar(true);
                } catch (e) {
                  console.error(e);
                }
              }}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              setSearchValue={setSearchValue}
              searchValue={searchValue}
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              loading={isLoading}
              allDepartments={allDepartments}
              selectedDepartment={selectedDepartment}
              onSelectedDepartmentChange={setSelectedDepartment}
              toolGroups={toolGroups}
              selectedToolGroup={selectedToolGroup}
              onSelectedToolGroupChange={setSelectedToolGroup}
              onViewOwnership={() => setOpenOwnership(true)}
              isVatTu={activeTab === 1}
              hideSelection={true}
            />
          </Box>

          {/* Sidebar */}
          {selectedTool && showSidebar && (
            <Box
              sx={{
                width: 380,
                flexShrink: 0,
                borderLeft: "1px solid",
                borderColor: "divider",
                transition: "all 0.3s ease",
              }}
            >
              <ToolDetailSidebar
                selectedTool={selectedTool}
                departments={allDepartments}
                onClose={() => {
                  setShowSidebar(false);
                }}
              />
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
