import { TextField } from "@mui/material";
import { useField } from "formik";
import { useEffect, useState } from "react";
import { useDebounce } from "../../hooks/useDebounce";

interface Props {
  title?: string;
  type?: string;
  name: string;
  disabled?: boolean;
  InputProps?: any;
  InputLabelProps?: any;
  onChange?: (newValue: any) => void;
  onClick?: (e: any) => void;
  multiline?: boolean;
  rows?: number;
  noBorder?: boolean;
  sx?: any;
  placeholder?: string;
  debounce?: boolean;
  slotProps?:any;
}

export default function FieldInput({
  title,
  type = "text",
  name,
  disabled = false,
  InputProps,
  InputLabelProps,
  onChange,
  onClick,
  multiline = false,
  rows = 1,
  noBorder = false,
  sx,
  placeholder,
  debounce = true,
  slotProps,
}: Props) {
  const [field, meta, helpers] = useField(name);

  // Local state để input mượt, debounce để set vào formik
  const [localValue, setLocalValue] = useState(field.value ?? "");
  const debouncedValue = useDebounce(localValue, 300);

  // Khi debouncedValue thay đổi mới set vào formik
  useEffect(() => {
    if (debouncedValue !== field.value) {
      helpers.setValue(debouncedValue);
    }
  }, [debouncedValue]);

  // Đồng bộ localValue khi giá trị trong formik thay đổi từ bên ngoài
  useEffect(() => {
    setLocalValue(field.value ?? "");
  }, [field.value]);

  return (
    <TextField
      onClick={(e) => {
        if (onClick) {
          onClick(e);
        }
      }}
      disabled={disabled}
      fullWidth
      type={type}
      size="small"
      label={title}
      value={localValue}
      multiline={multiline}
      rows={rows}
      placeholder={placeholder}
      onChange={(e) => {
        if (debounce) {
          setLocalValue(e.target.value);
        } else {
          setLocalValue(e.target.value);
          helpers.setValue(e.target.value);
        }
        if (onChange) {
          onChange(e.target.value);
        }
      }}
      error={Boolean(meta.touched && meta.error)}
      helperText={meta.touched && meta.error}
      InputProps={InputProps}
      InputLabelProps={InputLabelProps}
      slotProps={slotProps}
      sx={{
        ...sx,
        "& .MuiOutlinedInput-root": {
          "& fieldset": {
            border: noBorder ? "none" : undefined,
            borderBottom: noBorder
              ? "1px solid rgba(0, 0, 0, 0.23)"
              : undefined,
            borderRadius: noBorder ? 0 : undefined,
          },
          "&:hover fieldset": {
            borderBottom: noBorder
              ? "1px solid rgba(0, 0, 0, 0.87)"
              : undefined,
          },
          "&.Mui-focused fieldset": {
            borderBottom: noBorder ? "2px solid #1976d2" : undefined,
          },
        },
      }}
    />
  );
}
