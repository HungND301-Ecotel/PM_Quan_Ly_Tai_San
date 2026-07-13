import { useState, useRef, useCallback } from "react";
import {
  Box,
  Typography,
  Chip,
  Button,
  Alert,
  IconButton,
  Tooltip,
} from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { getIn } from "formik";
import { useAllStaffsQuery } from "../../../Staff/Mutation";
import FieldAutoCompleted from "../../../../components/TextField/FieldAutoCompleted";

interface SignerWorkflowSectionProps {
  formik: any;
  fieldName?: string; // defaults to "nguoiKyList"
}

type SimpleUser = {
  id: string;
  hoTen: string;
  phongBanId?: string;
  tenPhongBan?: string;
  chucVuId?: string;
  tenChucVu?: string;
};

export default function SignerWorkflowSection({
  formik,
  fieldName = "nguoiKyList",
}: SignerWorkflowSectionProps) {
  const { data: apiUsers = [] } = useAllStaffsQuery();

  const [addUserId, setAddUserId] = useState("");
  const [editingSignerId, setEditingSignerId] = useState<string | null>(null);
  const [editUserId, setEditUserId] = useState("");
  const [movingIdx, setMovingIdx] = useState<{
    from: number;
    to: number;
  } | null>(null);
  const isAnimating = useRef(false);

  const users: SimpleUser[] = (apiUsers || [])
    .filter((u: any) => u.hasAccount)
    .map((u: any) => ({
      id: String(u?.id ?? ""),
      hoTen: String(u?.hoTen ?? ""),
      phongBanId: String(u?.phongBanId ?? ""),
      tenPhongBan: String(u?.tenPhongBan ?? ""),
      chucVuId: String(u?.chucVuId ?? ""),
      tenChucVu: String(u?.tenChucVu ?? ""),
    }));

  const signers = getIn(formik.values, fieldName) || [];

  const handleAddSigner = () => {
    if (!addUserId) return;
    if (signers.some((s: any) => s.userId === addUserId)) return;
    const user = users.find((u) => u.id === addUserId);
    if (!user) return;

    const updated = [
      ...signers,
      {
        userId: user.id,
        userName: user.hoTen,
        departmentId: user.phongBanId,
        departmentName: user.tenPhongBan,
        position: user.tenChucVu ?? "",
        positionId: user.chucVuId,
        order: signers.length + 1,
        signed: false,
      },
    ];
    formik.setFieldValue(fieldName, updated);
    setAddUserId("");
  };

  const handleRemoveSigner = (userId: string) => {
    const updated = signers
      .filter((s: any) => s.userId !== userId)
      .map((s: any, i: number) => ({ ...s, order: i + 1 }));
    formik.setFieldValue(fieldName, updated);
  };

  const handleEdit = (signer: any) => {
    setEditingSignerId(signer.userId);
    setEditUserId(signer.userId);
  };

  const handleSaveEdit = () => {
    const editUser = users.find((u) => u.id === editUserId);
    const updated = signers.map((s: any) =>
      s.userId === editingSignerId
        ? {
            ...s,
            userId: editUserId,
            userName: editUser?.hoTen || "",
            departmentId: editUser?.phongBanId || "",
            departmentName: editUser?.tenPhongBan || "",
            position: editUser?.tenChucVu || "",
            positionId: editUser?.chucVuId || "",
          }
        : s,
    );
    formik.setFieldValue(fieldName, updated);
    setEditingSignerId(null);
  };

  const doSwap = useCallback(
    (fromIdx: number, toIdx: number) => {
      const updated = [...signers];
      [updated[fromIdx], updated[toIdx]] = [updated[toIdx], updated[fromIdx]];
      formik.setFieldValue(
        fieldName,
        updated.map((s: any, i: number) => ({ ...s, order: i + 1 })),
      );
    },
    [signers, formik, fieldName],
  );

  const handleMoveUp = (idx: number) => {
    if (idx <= 0 || isAnimating.current) return;
    isAnimating.current = true;
    setMovingIdx({ from: idx, to: idx - 1 });
    setTimeout(() => {
      doSwap(idx, idx - 1);
      setMovingIdx(null);
      isAnimating.current = false;
    }, 300);
  };

  const handleMoveDown = (idx: number) => {
    if (idx >= signers.length - 1 || isAnimating.current) return;
    isAnimating.current = true;
    setMovingIdx({ from: idx, to: idx + 1 });
    setTimeout(() => {
      doSwap(idx, idx + 1);
      setMovingIdx(null);
      isAnimating.current = false;
    }, 300);
  };

  const getSlideStyle = (idx: number) => {
    if (!movingIdx) return {};
    // Height of each card including margin (~68px)
    const cardHeight = 68;
    if (idx === movingIdx.from) {
      const dir = movingIdx.to > movingIdx.from ? 1 : -1;
      return {
        transform: `translateY(${dir * cardHeight}px)`,
        transition: "transform 0.3s ease",
        zIndex: 2,
      };
    }
    if (idx === movingIdx.to) {
      const dir = movingIdx.from > movingIdx.to ? 1 : -1;
      return {
        transform: `translateY(${dir * cardHeight}px)`,
        transition: "transform 0.3s ease",
        zIndex: 2,
      };
    }
    return {};
  };

  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 3,
        p: 2.5,
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <Typography
        variant="subtitle1"
        fontWeight={600}
        mb={2}
        sx={{ display: "flex", alignItems: "center", gap: 1 }}
      >
        Quy trình duyệt
        <Chip
          label={`${signers.length} người`}
          size="small"
          color="primary"
          variant="outlined"
          sx={{ fontWeight: 400 }}
        />
      </Typography>

      <Box sx={{ flex: 1, overflowY: "auto", mb: 2 }}>
        {signers.length > 0 ? (
          <Box sx={{ position: "relative", pl: 5 }}>
            <Box
              sx={{
                position: "absolute",
                left: 16,
                top: 8,
                bottom: 8,
                width: "1px",
                bgcolor: "divider",
              }}
            />
            {signers.map((s: any, idx: number) => {
              const user = users.find((u) => u.id === s.userId);
              const isEditingThis = editingSignerId === s.userId;
              return (
                <Box
                  key={s.userId}
                  sx={{
                    position: "relative",
                    mb: 1.5,
                    ...getSlideStyle(idx),
                  }}
                >
                  <Box
                    sx={{
                      position: "absolute",
                      left: -37,
                      top: 14,
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      bgcolor: "primary.main",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 600,
                      zIndex: 1,
                      boxShadow: "0 0 0 3px white",
                    }}
                  >
                    {idx + 1}
                  </Box>

                  <Box
                    sx={{
                      border: "1px solid",
                      borderColor: isEditingThis ? "primary.main" : "divider",
                      borderRadius: 2,
                      p: 1.5,
                      bgcolor: isEditingThis
                        ? "primary.50"
                        : "background.paper",
                      transition: "all 0.2s",
                      "&:hover": !isEditingThis
                        ? { boxShadow: 1, borderColor: "grey.300" }
                        : {},
                    }}
                  >
                    {isEditingThis ? (
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 1.5,
                        }}
                      >
                        <FieldAutoCompleted
                          title="Người duyệt"
                          data={users}
                          labelkey="hoTen"
                          labelOption="phongBanId"
                          value={editUserId}
                          onChange={(e) => {
                            setEditUserId(e ? e.id : "");
                          }}
                        />
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <Button
                            variant="contained"
                            size="small"
                            onClick={handleSaveEdit}
                          >
                            Lưu
                          </Button>
                          <Button
                            size="small"
                            onClick={() => setEditingSignerId(null)}
                          >
                            Hủy
                          </Button>
                        </Box>
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        {/* Avatar + Info */}
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                            flex: 1,
                            minWidth: 0,
                          }}
                        >
                          <Box
                            sx={{
                              width: 36,
                              height: 36,
                              borderRadius: "50%",
                              bgcolor: "primary.main",
                              color: "white",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 600,
                              fontSize: 13,
                              flexShrink: 0,
                            }}
                          >
                            {(user?.hoTen || s.userName)?.charAt(0) ?? "?"}
                          </Box>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography fontWeight={600} fontSize={13} noWrap>
                              {user?.hoTen || s.userName}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              noWrap
                            >
                              {user?.tenChucVu || s.position || "Cán bộ"}
                            </Typography>
                            <Box sx={{ mt: 0.5 }}>
                              <Chip
                                label={
                                  user?.tenPhongBan || s.departmentName || ""
                                }
                                size="small"
                                sx={{
                                  fontSize: 10,
                                  height: 18,
                                  bgcolor: "grey.100",
                                  maxWidth: "100%",
                                }}
                              />
                            </Box>
                          </Box>
                        </Box>

                        {/* Action buttons - vertical */}
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 0.5,
                            flexShrink: 0,
                          }}
                        >
                          <Box sx={{ display: "flex", gap: 0.5 }}>
                            <Button
                              size="small"
                              variant="contained"
                              color="primary"
                              onClick={() => handleEdit(s)}
                              sx={{ minWidth: 32, p: "2px 6px" }}
                            >
                              <EditIcon sx={{ fontSize: 18 }} />
                            </Button>
                            <Button
                              size="small"
                              variant="contained"
                              color="error"
                              onClick={() => handleRemoveSigner(s.userId)}
                              sx={{ minWidth: 32, p: "2px 6px" }}
                            >
                              <DeleteIcon sx={{ fontSize: 18 }} />
                            </Button>
                          </Box>
                          <Box sx={{ display: "flex", gap: 0.5 }}>
                            <Button
                              size="small"
                              variant="contained"
                              disabled={idx === 0}
                              onClick={() => handleMoveUp(idx)}
                              sx={{ minWidth: 32, p: "2px 6px" }}
                            >
                              <ArrowUpwardIcon sx={{ fontSize: 18 }} />
                            </Button>
                            <Button
                              size="small"
                              variant="contained"
                              disabled={idx === signers.length - 1}
                              onClick={() => handleMoveDown(idx)}
                              sx={{ minWidth: 32, p: "2px 6px" }}
                            >
                              <ArrowDownwardIcon sx={{ fontSize: 18 }} />
                            </Button>
                          </Box>
                        </Box>
                      </Box>
                    )}
                  </Box>
                </Box>
              );
            })}
          </Box>
        ) : (
          <Alert severity="info" sx={{ mb: 2 }}>
            Chưa có người duyệt
          </Alert>
        )}
      </Box>

      {/* Form thêm người duyệt */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
          p: 2,
          bgcolor: "grey.50",
          borderRadius: 2,
          border: "1px dashed",
          borderColor: "divider",
        }}
      >
        <FieldAutoCompleted
          title="Người duyệt"
          data={users.filter(
            (u) => !signers.some((s: any) => s.userId === u.id),
          )}
          labelkey="hoTen"
          labelOption="phongBanId"
          value={addUserId}
          onChange={(e) => {
            setAddUserId(e ? e.id : "");
          }}
        />

        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={handleAddSigner}
          disabled={!addUserId}
          fullWidth
        >
          Thêm người duyệt
        </Button>
      </Box>
    </Box>
  );
}
