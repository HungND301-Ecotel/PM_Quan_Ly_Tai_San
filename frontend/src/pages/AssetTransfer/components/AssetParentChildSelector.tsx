import {
  Box,
  Button,
  CircularProgress,
  Collapse,
  Grid,
  IconButton,
  Typography,
} from "@mui/material";
import { Add, ExpandMore, ChevronRight, DoneAll } from "@mui/icons-material";
import { useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import api from "../../../config/api.config";
import FieldAutoCompleted from "../../../components/TextField/FieldAutoCompleted";

interface AssetParentChildSelectorProps {
  parentAssets: any[];
  readOnly?: boolean;
  selectedChildIds: string[];
  fullySelectedParentIds: string[];
  onAddChild: (childAsset: any) => void;
  onSelectFullParent: (parentAsset: any, childIds: string[]) => void;
}

export default function AssetParentChildSelector({
  parentAssets,
  readOnly = false,
  selectedChildIds,
  fullySelectedParentIds,
  onAddChild,
  onSelectFullParent,
}: AssetParentChildSelectorProps) {
  const [selectedParentAssetIds, setSelectedParentAssetIds] = useState<
    string[]
  >([]);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  const selectedParents = useMemo(
    () =>
      parentAssets.filter((asset) => selectedParentAssetIds.includes(asset.id)),
    [parentAssets, selectedParentAssetIds],
  );

  const queries = useQueries({
    queries: selectedParentAssetIds.map((parentId) => ({
      queryKey: ["assetParentChildren", parentId],
      queryFn: async () => {
        const res = await api.get(`/taisan/children/${parentId}`);
        return res.data.data || res.data || [];
      },
      enabled: !!parentId,
    })),
  });

  const parentGroups = useMemo(
    () =>
      selectedParents.map((parent, index) => ({
        parent,
        children: queries[index]?.data || [],
        isLoading: queries[index]?.isLoading || false,
      })),
    [selectedParents, queries],
  );

  const toggleExpand = (parentId: string) => {
    setExpandedIds((prev) =>
      prev.includes(parentId)
        ? prev.filter((id) => id !== parentId)
        : [...prev, parentId],
    );
  };

  return (
    <Box
      sx={{
        mb: 3,
        p: 2,
        border: "1px solid #e0e0e0",
        borderRadius: 2,
        bgcolor: "#fafafa",
      }}
    >
      <Typography variant="subtitle2" fontWeight={600} mb={1}>
        Chọn tài sản cha
      </Typography>

      <FieldAutoCompleted
        title="Tài sản cha"
        labelkey="tenTaiSan"
        labelOption="id"
        data={parentAssets}
        value={selectedParentAssetIds}
        setValue={(value) => setSelectedParentAssetIds(value || [])}
        disabled={readOnly}
        multiple
      />

      {selectedParents.length > 0 ? (
        <Box mt={2} display="flex" flexDirection="column" gap={1}>
          {parentGroups.map(({ parent, children, isLoading }) => {
            const expanded = expandedIds.includes(parent.id);
            const isParentFullySelected = fullySelectedParentIds.includes(
              parent.id,
            );
            const childIds = children.map(
              (c: any) => c?.idTaiSanCon || c?.id || "",
            );

            return (
              <Box
                key={parent.id}
                sx={{
                  border: "1px solid #dbeafe",
                  borderRadius: 2,
                  bgcolor: "#f8fbff",
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    px: 2,
                    py: 1.5,
                    bgcolor: "#e8f0ff",
                    gap: 1,
                  }}
                >
                  <Box
                    onClick={() => toggleExpand(parent.id)}
                    sx={{
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <IconButton size="small" sx={{ p: 0, color: "#1d4ed8" }}>
                      {expanded ? (
                        <ExpandMore fontSize="small" />
                      ) : (
                        <ChevronRight fontSize="small" />
                      )}
                    </IconButton>
                    <Typography
                      fontWeight={700}
                      noWrap
                      title={parent.tenTaiSan || parent.id}
                    >
                      {parent.id} - {parent.tenTaiSan}
                    </Typography>
                  </Box>

                  <Button
                    size="small"
                    variant={isParentFullySelected ? "contained" : "outlined"}
                    color={isParentFullySelected ? "success" : "primary"}
                    disabled={readOnly || isParentFullySelected}
                    startIcon={<DoneAll fontSize="small" />}
                    onClick={() => onSelectFullParent(parent, childIds)}
                    sx={{ textTransform: "none", whiteSpace: "nowrap" }}
                  >
                    {isParentFullySelected
                      ? "Đã chọn tài sản cha"
                      : "Chọn tài sản cha"}
                  </Button>
                </Box>

                <Collapse in={expanded} timeout="auto" unmountOnExit>
                  <Box
                    sx={{
                      p: 2,
                      display: "flex",
                      flexDirection: "column",
                      gap: 1,
                    }}
                  >
                    {isLoading ? (
                      <Box display="flex" alignItems="center" gap={1}>
                        <CircularProgress size={18} />
                        <Typography variant="body2" color="text.secondary">
                          Đang tải tài sản con...
                        </Typography>
                      </Box>
                    ) : children.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        Không có tài sản con cho tài sản cha này.
                      </Typography>
                    ) : (
                      children.map((child: any) => {
                        const childId = child?.idTaiSanCon || child?.id || "";
                        const added = selectedChildIds.includes(childId);
                        const disabled =
                          readOnly || added || isParentFullySelected;
                        return (
                          <Button
                            key={childId}
                            variant="outlined"
                            fullWidth
                            disabled={disabled}
                            onClick={() => onAddChild(child)}
                            sx={{
                              justifyContent: "space-between",
                              textTransform: "none",
                              borderColor: disabled ? "#cbd5e1" : "#dbeafe",
                              color: disabled
                                ? "text.disabled"
                                : "text.primary",
                              bgcolor: disabled ? "#f8fafc" : "#fff",
                              px: 2,
                              py: 1,
                            }}
                            startIcon={<Add fontSize="small" />}
                          >
                            <Box
                              textAlign="left"
                              width="100%"
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                              }}
                            >
                              <Typography noWrap>
                                {childId} -{child?.tenTaiSan || child?.ten}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {isParentFullySelected
                                  ? "Theo cha"
                                  : added
                                    ? "Đã thêm"
                                    : child?.donViTinh || ""}
                              </Typography>
                            </Box>
                          </Button>
                        );
                      })
                    )}
                  </Box>
                </Collapse>
              </Box>
            );
          })}
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary" mt={2}>
          Chọn tài sản cha để hiển thị danh sách tài sản con.
        </Typography>
      )}
    </Box>
  );
}
