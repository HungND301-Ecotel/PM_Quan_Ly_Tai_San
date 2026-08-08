import {
  TextField,
  Box,
  Button,
  Typography,
  Popover,
  Grid,
  InputAdornment,
} from "@mui/material";
import React, { useState } from "react";
import { useField } from "formik";
import { ChevronLeft, ChevronRight, DateRange } from "@mui/icons-material";

export default function FieldYearMonth({
  title,
  name,
  disabled = false,
}: {
  title: string;
  name?: string;
  disabled?: boolean;
}) {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const isFormikMode = Boolean(name);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [field, , helpers] = isFormikMode
    ? useField(name as string)
    : [undefined, undefined, undefined];

  const value = isFormikMode
    ? field!.value || ""
    : "01/" + new Date().getFullYear();

  const parts = value && value.includes("/") ? value.split("/") : [];

  const currentMonth = parseInt(parts[0]) || new Date().getMonth() + 1;
  const currentYear = parseInt(parts[1]) || new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const setValue = (month: number, year: number) => {
    if (isFormikMode && helpers) {
      const monthStr = String(month).padStart(2, "0");
      helpers.setValue(`${monthStr}/${year}`);
    }
    setAnchorEl(null);
  };

  const handleOpen = (event: React.MouseEvent<HTMLDivElement>) => {
    setAnchorEl(event.currentTarget as unknown as HTMLButtonElement);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  const months = [
    { num: 1, label: "Tháng 1" },
    { num: 2, label: "Tháng 2" },
    { num: 3, label: "Tháng 3" },
    { num: 4, label: "Tháng 4" },
    { num: 5, label: "Tháng 5" },
    { num: 6, label: "Tháng 6" },
    { num: 7, label: "Tháng 7" },
    { num: 8, label: "Tháng 8" },
    { num: 9, label: "Tháng 9" },
    { num: 10, label: "Tháng 10" },
    { num: 11, label: "Tháng 11" },
    { num: 12, label: "Tháng 12" },
  ];

  return (
    <>
      <TextField
        label={title}
        value={value}
        onClick={handleOpen}
        fullWidth
        disabled={disabled}
        size="small"
        InputProps={{
          readOnly: true,
          endAdornment: (
            <InputAdornment position="end">
              <DateRange
                sx={{ cursor: "pointer", color: "#999" }}
                fontSize="small"
              />
            </InputAdornment>
          ),
        }}
      />
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
      >
        <Box sx={{ p: 0.5, minWidth: "200px" }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 0.8,
            }}
          >
            <Button
              size="small"
              onClick={() => setSelectedYear(selectedYear - 1)}
              sx={{ minWidth: "auto", padding: "4px" }}
            >
              <ChevronLeft fontSize="small" />
            </Button>
            <Typography
              sx={{ fontWeight: 600, textAlign: "center", fontSize: "13px" }}
            >
              Năm {selectedYear}
            </Typography>
            <Button
              size="small"
              onClick={() => setSelectedYear(selectedYear + 1)}
              sx={{ minWidth: "auto", padding: "4px" }}
            >
              <ChevronRight fontSize="small" />
            </Button>
          </Box>

          <Grid container spacing={0.3}>
            {months.map((month) => (
              <Grid size={{ xs: 4 }} key={month.num}>
                <Button
                  fullWidth
                  onClick={() => setValue(month.num, selectedYear)}
                  sx={{
                    py: 0.4,
                    px: 0.4,
                    minHeight: "28px",
                    fontSize: "10px",
                    border:
                      currentMonth === month.num && currentYear === selectedYear
                        ? "2px solid #e91e63"
                        : "1px solid #e0e0e0",
                    borderRadius: "4px",
                    bgcolor:
                      currentMonth === month.num && currentYear === selectedYear
                        ? "#fce4ec"
                        : "#fafafa",
                    color:
                      currentMonth === month.num && currentYear === selectedYear
                        ? "#e91e63"
                        : "#333",
                    fontWeight:
                      currentMonth === month.num && currentYear === selectedYear
                        ? 600
                        : 400,
                    "&:hover": {
                      bgcolor:
                        currentMonth === month.num &&
                        currentYear === selectedYear
                          ? "#fce4ec"
                          : "#f0f0f0",
                    },
                  }}
                >
                  {month.label}
                </Button>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Popover>
    </>
  );
}
