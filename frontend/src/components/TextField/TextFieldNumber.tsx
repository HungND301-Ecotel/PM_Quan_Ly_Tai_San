import { TextField } from "@mui/material";
import { getIn } from "formik";
import { useEffect, useState, useRef } from "react";
import { NumericFormat } from "react-number-format";
import { useDebounce } from "../../hooks/useDebounce";

interface Props {
  title?: string;
  formik?: any;
  field?: string;
  disabled?: boolean;
  onChange?: (value: any) => void;
  noBorder?: boolean;
  sx?: any;
}
export default function TextFieldNumber({
  title,
  formik,
  field,
  disabled = false,
  onChange,
  noBorder = false,
  sx,
}: Props) {
  const currentValue = formik && field ? getIn(formik.values, field) : "";
  const touched = formik && field ? getIn(formik.touched, field) : false;
  const error = formik && field ? getIn(formik.errors, field) : "";

  // Local state để input mượt, debounce để set vào formik
  const [localValue, setLocalValue] = useState(currentValue);
  const debouncedValue = useDebounce(localValue, 300);
  const isFirstRender = useRef(true);

  // Khi debouncedValue thay đổi mới set vào formik và gọi onChange
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    if (formik && field && debouncedValue !== getIn(formik.values, field)) {
      formik.setFieldValue(field, debouncedValue);
    }
    
    if (onChange) {
      onChange(debouncedValue);
    }
  }, [debouncedValue]);

  // Đồng bộ localValue khi giá trị trong formik thay đổi từ bên ngoài
  useEffect(() => {
    if (currentValue !== localValue && currentValue !== debouncedValue) {
      setLocalValue(currentValue);
    }
  }, [currentValue]);

  return (
    <NumericFormat
      size="small"
      customInput={TextField}
      label={title}
      fullWidth
      disabled={disabled}
      value={localValue}
      thousandSeparator="."
      decimalSeparator=","
      fixedDecimalScale={false}
      min={0}
      onValueChange={(values: any) => {
        setLocalValue(values.floatValue === undefined ? 0 : values.floatValue);
      }}
      // Giữ nguyên style của bạn
      error={Boolean(touched && error)}
      helperText={touched && error}
      variant="outlined"
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
