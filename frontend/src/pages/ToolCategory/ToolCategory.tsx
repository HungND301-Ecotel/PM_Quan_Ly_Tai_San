import { Box, Dialog, DialogContent, Tab, Tabs } from "@mui/material";
import { useEffect, useState } from "react";
import PageAction from "../../components/common/PageAction";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";

import ToolForm from "../ToolManager/components/ToolForm";
import ToolTableCustom from "../ToolManager/components/ToolTableCustom";
import ToolDetailSidebar from "../ToolManager/components/ToolDetailSidebar";
import { useToolManagerMutation, useToolPageQuery, fetchToolDetails } from "../ToolManager/Mutation";
import { createColumns } from "./columnConfig";
import { useAllDepartmentsQuery } from "../Department/Mutation";
import { useAllToolTypeQuery } from "../ToolType/Mutation";
import { useAllUnitsQuery } from "../Unit/Mutation";
import ImportErrorDialog from "../../components/common/ImportErrorDialog";
import { useDebounce } from "../../hooks/useDebounce";
import AssetHistoryModal from "../ToolManager/components/ToolHistoryModal";
import SyncLoadingModal from "../../components/common/SyncLoadingModal";
import SelectDbDialog from "../../components/common/SelectDbDialog";
import ToolOwnershipModal from "../ToolManager/components/ToolOwnershipModal";
import { useTabForm } from "../../redux/useTabForm";
import { hasDraftData } from "../../utils/draftUtils";
import DraftIndicator from "../../components/common/DraftIndicator";

interface ToolCategoryTabState {
  showForm: boolean;
  showSidebar: boolean;
  selectedTool: any | null;
  readOnly: boolean;
  isCopy: boolean;
  draftForm?: Record<string, any>;
}

export default function ToolCategory() {
  const { formData, setField } = useTabForm<ToolCategoryTabState>("/danh_muc_ccdc_vat_tu");
  const showForm = formData.showForm ?? false;
  const selectedTool = formData.selectedTool ?? null;
  const readOnly = formData.readOnly ?? false;
  const isCopy = formData.isCopy ?? false;
  const showSidebar = formData.showSidebar ?? false;

  const setShowForm = (v: boolean) => setField({ showForm: v });
  const setSelectedTool = (v: any) => setField({ selectedTool: v });
  const setReadOnly = (v: boolean) => setField({ readOnly: v });
  const setIsCopy = (v: boolean) => setField({ isCopy: v });
  const setShowSidebar = (v: boolean) => setField({ showSidebar: v });

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
  const loai = undefined; // Không lọc theo loại để lấy cả CCDC và Vật tư
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
      setShowSidebar(false);
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
    createColumns(handleOpenHistory, handleCopy, handleRowEdit),
  );

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
        title="Danh mục CCDC - Vật tư"
        onNewClick={() => {
          if (isMinimized) {
            setShowForm(true);
            return;
          }
          setField({ draftForm: undefined });
          setShowForm(true);
          setSelectedTool(null);
          setReadOnly(false);
          setIsCopy(false);
        }}
        loading={exportExcelMutation.isPending || importExcelMutation.isPending}
        onExport={() => exportExcelMutation.mutate()}
        onImport={(file) => importExcelMutation.mutate(file)}
        onSyncDb={
          user?.taiKhoan?.tenDangNhap === "admin"
            ? () => setOpenSelectDb(true)
            : undefined
        }
        onRefresh={() => refetch()}
        showExcel={true}
      />
      
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
              key={`${selectedTool?.id}-${readOnly}`}
              onCancel={() => {
                setField({ draftForm: undefined });
                setShowForm(false);
                setReadOnly(true);
                setIsCopy(false);
              }}
              onMinimize={handleMinimize}
              selectedTool={selectedTool}
              readOnly={readOnly}
              onEdit={handleEdit}
              onSave={handleSave}
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
              tableId="toolCategory"
              title="Danh mục CCDC - Vật tư"
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
              onDelete={(ids) => {
                deleteManyMutation.mutate(ids);
              }}
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
              onDeleteAll={deleteAllMutation.mutate}
              showDeleteAll={user?.taiKhoan?.tenDangNhap === "admin"}
              onViewOwnership={() => setOpenOwnership(true)}
              onExportExcel={() => exportExcelMutation.mutate()}
              isVatTu={false}
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
