import React from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../../../config/api.config";
import { CongTy } from "../../../utils/const";

const fetchStatistics = async () => {
  const res = await api.get("/dashboard/statistics");
  return res.data;
};

export const useDashboardStatisticsQuery = () => {
  return useQuery({
    queryKey: ["dashboard-statistics"],
    queryFn: fetchStatistics,
    staleTime: 5 * 60 * 1000,
  });
};

const fetchTaiSanSapHetHan = async () => {
  const res = await api.get("/dashboard/tai-san-sap-het-han-khau-hao");
  return res.data;
};

const fetchTaiSanTheoNhom = async () => {
  const res = await api.get("/dashboard/tai-san-theo-nhom-phan-tram-chi-tiet");
  return res.data;
};

const fetchCCDCTheoNhom = async (nam: number) => {
  const res = await api.get("/dashboard/ccdc-theo-nhom-phan-tram-chi-tiet", {
    params: { idcongty: CongTy.CT001, nam },
  });
  return res.data;
};

const fetchNhomCCDCList = async () => {
  const res = await api.get("/nhomccdc", { params: { idcongty: CongTy.CT001 } });
  return res.data;
};

const fetchNhomTaiSanList = async () => {
  const res = await api.get("/nhomtaisan", { params: { idcongty: CongTy.CT001 } });
  return res.data;
};

const fetchTaiSanTheoLoai = async (nhomId?: string) => {
  const res = await api.get("/dashboard/tai-san-theo-nhom-loai-con-phan-tram", {
    params: {
      idcongty: CongTy.CT001,
      ...(nhomId ? { nhomId } : {}),
    },
  });
  return res.data;
};

const fetchCCDCTheoLoai = async (nhomId?: string) => {
  const res = await api.get("/dashboard/ccdc-theo-nhom-loai-con-phan-tram", {
    params: {
      nhomId,
      idcongty: CongTy.CT001,
    },
  });
  return res.data.data;
};

export const useDashboardMutation = (
  selectedNhomTaiSan?: string,
  selectedNhomCCDC?: string,
  namTaiSan: number = new Date().getFullYear(),
  namCCDC: number = new Date().getFullYear(),
) => {
  const { data: nhomTaiSanData } = useQuery({
    queryKey: ["nhom-tai-san-list"],
    queryFn: fetchNhomTaiSanList,
    staleTime: 5 * 60 * 1000,
  });

  const { data: taiSanSapHet, isLoading: isLoadingTaiSanSapHet } = useQuery({
    queryKey: ["dashboard-tai-san-sap-het"],
    queryFn: fetchTaiSanSapHetHan,
    staleTime: 5 * 60 * 1000,
  });

  const { data: taiSanTheoNhom, isLoading: isLoadingTaiSanTheoNhom } = useQuery({
    queryKey: ["dashboard-tai-san-theo-nhom"],
    queryFn: fetchTaiSanTheoNhom,
    staleTime: 5 * 60 * 1000,
  });

  const { data: ccdcTheoNhom, isLoading: isLoadingCCDCTheoNhom } = useQuery({
    queryKey: ["dashboard-ccdc-theo-nhom", namCCDC],
    queryFn: () => fetchCCDCTheoNhom(namCCDC),
    staleTime: 5 * 60 * 1000,
  });

  const { data: nhomCCDCList, isLoading: isLoadingNhomCCDCList } = useQuery({
    queryKey: ["nhom-ccdc-list"],
    queryFn: fetchNhomCCDCList,
    staleTime: 5 * 60 * 1000,
  });

  const { data: taiSanTheoLoai, isLoading: isLoadingTaiSanTheoLoai } = useQuery({
    queryKey: ["dashboard-tai-san-theo-loai", selectedNhomTaiSan],
    queryFn: () => fetchTaiSanTheoLoai(selectedNhomTaiSan),
    staleTime: 5 * 60 * 1000,
    enabled: !!selectedNhomTaiSan,
  });

  const { data: ccdcTheoLoai = [], isLoading: isLoadingCCDCTheoLoai } = useQuery({
    queryKey: ["dashboard-ccdc-theo-loai", selectedNhomCCDC],
    queryFn: () => fetchCCDCTheoLoai(selectedNhomCCDC),
    staleTime: 5 * 60 * 1000,
    enabled: !!selectedNhomCCDC,
  });

  const nhomCCDCMap = React.useMemo(() => {
    const map = new Map<string, any>();
    const nhomList = Array.isArray(nhomCCDCList)
      ? nhomCCDCList
      : nhomCCDCList?.data || [];
    nhomList.forEach((nhom: any) => {
      const key =
        nhom?.id !== undefined && nhom?.id !== null
          ? String(nhom.id).trim()
          : "";
      map.set(key, nhom.ten || nhom.tenNhom);
    });
    return map;
  }, [nhomCCDCList]);

  const getGroupValue = React.useCallback(
    (item: any) => {
      if (!item) return "Chưa xác định";
      const possibleKeys = [
        "Nhóm CCDC", "Nhom CCDC", "nhom CCDC", "nhomCCDC", "NhomCCDC",
        "tenNhomCCDC", "tenNhom", "nhom", "Nhóm",
      ];
      for (const key of possibleKeys) {
        if (Object.prototype.hasOwnProperty.call(item, key)) {
          const v = item[key];
          if (v !== undefined && v !== null && String(v).trim() !== "")
            return String(v).trim();
        }
      }
      const idNhomRaw =
        item.idNhomCCDC !== undefined && item.idNhomCCDC !== null
          ? String(item.idNhomCCDC).trim()
          : "";
      if (idNhomRaw) {
        if (nhomCCDCMap.has(idNhomRaw)) return nhomCCDCMap.get(idNhomRaw);
        return idNhomRaw;
      }
      const fallback =
        item.tenNhomCCDC || item.nhomCCDC || item.nhom || item.tenNhom;
      const strVal =
        fallback !== undefined && fallback !== null
          ? String(fallback).trim()
          : "";
      if (strVal) {
        const strKey = String(strVal).trim();
        if (nhomCCDCMap.has(strKey)) return nhomCCDCMap.get(strKey);
        return strVal;
      }
      return "Chưa xác định";
    },
    [nhomCCDCMap],
  );

  const nhomCCDCListNormalized = React.useMemo(() => {
    if (!nhomCCDCList) return [];
    return Array.isArray(nhomCCDCList) ? nhomCCDCList : nhomCCDCList.data || [];
  }, [nhomCCDCList]);

  const normalizeGroupItems = React.useCallback((items: any[]): any[] => {
    if (!items || !Array.isArray(items)) return [];
    const mapped = items.map((it: any) => {
      const idRaw =
        it.id !== undefined && it.id !== null
          ? String(it.id).trim()
          : it.Id !== undefined && it.Id !== null
            ? String(it.Id).trim()
            : it.idNhomCCDC !== undefined && it.idNhomCCDC !== null
              ? String(it.idNhomCCDC).trim()
              : it.IdNhomCCDC !== undefined && it.IdNhomCCDC !== null
                ? String(it.IdNhomCCDC).trim()
                : it.idNhom !== undefined && it.idNhom !== null
                  ? String(it.idNhom).trim()
                  : "";
      const ten =
        it.tenNhom || it.TenNhom || it.ten || it.Ten || it.nhom ||
        it.tenGroup || it.name || "";
      const id = idRaw || (ten ? String(ten).trim() : "");
      const soLuongRaw =
        it.soLuong ?? it.SoLuong ?? it.count ?? it.so_luong ?? it.sl ?? it.value ?? 0;
      const soLuong =
        typeof soLuongRaw === "string"
          ? Number(String(soLuongRaw).replace(/[^0-9.-]+/g, ""))
          : Number(soLuongRaw || 0);
      const phanTramRaw =
        it.phanTram ?? it.phan_tram ?? it.percent ?? it.tiLe ??
        it.TiLePhanTram ?? it.TiLe ?? null;
      const phanTram = phanTramRaw != null ? Number(phanTramRaw) : null;
      return { ...it, id, ten, soLuong, phanTram };
    });

    const anyHasPercent = mapped.some(
      (m) => m.phanTram != null && !Number.isNaN(m.phanTram),
    );
    if (!anyHasPercent) {
      const total = mapped.reduce((s, m) => s + (Number(m.soLuong) || 0), 0) || 1;
      mapped.forEach((m) => {
        m.phanTram = total > 0 ? (Number(m.soLuong) / total) * 100 : 0;
      });
    }

    return mapped;
  }, []);

  const ccdcTheoNhomNormalized = React.useMemo(
    () => normalizeGroupItems(ccdcTheoNhom?.data || ccdcTheoNhom || []),
    [ccdcTheoNhom, normalizeGroupItems],
  );
  const taiSanTheoNhomNormalized = React.useMemo(
    () => normalizeGroupItems(taiSanTheoNhom?.data || taiSanTheoNhom || []),
    [taiSanTheoNhom, normalizeGroupItems],
  );

  const uniqueNhomCCDC = React.useMemo(() => {
    if (ccdcTheoNhomNormalized && ccdcTheoNhomNormalized.length > 0) {
      return ccdcTheoNhomNormalized.map((n: any) => ({
        id: n.id || n.ten,
        tenNhom: n.ten,
      }));
    }
    if (nhomCCDCListNormalized.length > 0) {
      return nhomCCDCListNormalized.map((n: any) => ({
        id: n.id,
        tenNhom: n.ten || n.tenNhom,
      }));
    }
    return [];
  }, [ccdcTheoNhomNormalized, nhomCCDCListNormalized]);

  const nhomTaiSanList = React.useMemo(() => {
    if (!nhomTaiSanData) return [];
    const list = Array.isArray(nhomTaiSanData)
      ? nhomTaiSanData
      : nhomTaiSanData.data || [];
    return list.map((n: any) => ({
      id: String(n.id),
      tenNhom: n.tenNhom || n.ten || n.name || "",
    }));
  }, [nhomTaiSanData]);

  const isLoading =
    isLoadingTaiSanSapHet ||
    isLoadingTaiSanTheoNhom ||
    isLoadingCCDCTheoNhom ||
    isLoadingNhomCCDCList ||
    isLoadingTaiSanTheoLoai ||
    isLoadingCCDCTheoLoai;

  const ccdcTheoLoaiNormalized = React.useMemo(() => {
    let rawCcdcLoai: any[] = [];

    if (ccdcTheoLoai && Array.isArray(ccdcTheoLoai)) {
      rawCcdcLoai = ccdcTheoLoai;
    } else if (ccdcTheoLoai && typeof ccdcTheoLoai === "object") {
      let resolvedKey: string | undefined = undefined;
      if (selectedNhomCCDC) {
        const byId = (ccdcTheoNhomNormalized || []).find(
          (g: any) =>
            String(g.id) === String(selectedNhomCCDC) ||
            String(g.ten) === String(selectedNhomCCDC),
        );
        if (byId) resolvedKey = byId.ten;
        if (!resolvedKey) {
          const byList = (nhomCCDCListNormalized || []).find(
            (g: any) =>
              String(g.id) === String(selectedNhomCCDC) ||
              String(g.ten) === String(selectedNhomCCDC) ||
              String(g.tenNhom) === String(selectedNhomCCDC),
          );
          if (byList) resolvedKey = byList.ten || byList.tenNhom;
        }
      }
      const key = resolvedKey || Object.keys(ccdcTheoLoai)[0];
      const arr = (ccdcTheoLoai as any)[key] || (ccdcTheoLoai as any)[String(key)] || [];
      if (Array.isArray(arr)) rawCcdcLoai = arr;
    } else if ((ccdcTheoLoai as any)?.data && typeof (ccdcTheoLoai as any).data === "object") {
      let resolvedKey: string | undefined = undefined;
      if (selectedNhomCCDC) {
        const byId = (ccdcTheoNhomNormalized || []).find(
          (g: any) =>
            String(g.id) === String(selectedNhomCCDC) ||
            String(g.ten) === String(selectedNhomCCDC),
        );
        if (byId) resolvedKey = byId.ten;
        if (!resolvedKey) {
          const byList = (nhomCCDCListNormalized || []).find(
            (g: any) =>
              String(g.id) === String(selectedNhomCCDC) ||
              String(g.ten) === String(selectedNhomCCDC) ||
              String(g.tenNhom) === String(selectedNhomCCDC),
          );
          if (byList) resolvedKey = byList.ten || byList.tenNhom;
        }
      }
      const key = resolvedKey || Object.keys((ccdcTheoLoai as any).data)[0];
      const arr = (ccdcTheoLoai as any).data[key] || [];
      if (Array.isArray(arr)) rawCcdcLoai = arr;
    }

    return (rawCcdcLoai || []).map((it: any) => {
      const label = it.tenLoai || it.TenLoai || it.ten || it.Ten || it.label || "";
      const valueRaw = it.soLuong ?? it.SoLuong ?? it.count ?? it.value ?? it.sl ?? 0;
      const value =
        typeof valueRaw === "string"
          ? Number(String(valueRaw).replace(/[^0-9.-]+/g, ""))
          : Number(valueRaw || 0);
      return { label, value };
    });
  }, [ccdcTheoLoai, selectedNhomCCDC, ccdcTheoNhomNormalized, nhomCCDCListNormalized]);

  const taiSanTheoLoaiMapped = React.useMemo(() => {
    const arr = Array.isArray((taiSanTheoLoai as any)?.data)
      ? (taiSanTheoLoai as any).data
      : Array.isArray(taiSanTheoLoai)
        ? taiSanTheoLoai
        : [];
    return arr.map((it: any) => ({
      label: it.tenLoai || it.ten || it.label || "",
      value: Number(it.soLuong ?? it.count ?? it.value ?? 0),
    }));
  }, [taiSanTheoLoai]);

  return React.useMemo(
    () => ({
      taiSanSapHet: taiSanSapHet?.data || [],
      taiSanTheoNhom: taiSanTheoNhomNormalized,
      ccdcTheoNhom: ccdcTheoNhomNormalized,
      nhomCCDCList: nhomCCDCList || [],
      nhomTaiSanList,
      uniqueNhomCCDC,
      taiSanTheoLoai: taiSanTheoLoaiMapped,
      ccdcTheoLoai: ccdcTheoLoaiNormalized,
      isLoading,
    }),
    [
      taiSanSapHet,
      taiSanTheoNhomNormalized,
      ccdcTheoNhomNormalized,
      nhomCCDCList,
      nhomTaiSanList,
      uniqueNhomCCDC,
      taiSanTheoLoaiMapped,
      ccdcTheoLoaiNormalized,
      isLoading,
    ],
  );
};