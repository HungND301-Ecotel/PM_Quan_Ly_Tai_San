import logoUB from "../assets/images/logo_ub.png";
import logoCP from "../assets/images/logo_cp.png";
import logoCS from "../assets/images/logo_cs.png";

import backgroundImageUB from "../assets/images/background_ub.jpg";
import backgroundImageCP from "../assets/images/background_cp.jpg";
import backgroundImageCS from "../assets/images/background_cs.jpg";

export interface BrandConfig {
  brandCode: string;
  title: string;
  company: string;
  primaryColor: string;
  primaryHoverColor: string;
  primaryColor100: string;
  phone?: string;
  email?: string;
  fax?: string;
  logo: string;
  backgroundImage: string;
}

export const brandConfigs: Record<string, BrandConfig> = {
  UB: {
    brandCode: "UB",
    title: "Quản lý tài sản - Uông Bí",
    company: "CÔNG TY THAN UÔNG BÍ - TKV",
    primaryColor: "#04b46eff",
    primaryHoverColor: "#05c578ff", // slightly lighter/darker
    primaryColor100: "#f0fdf4",
    phone: "02033.854491", // Placeholder, user can change
    email: "ctythanub@gmail.com", // Placeholder, user can change
    logo: logoUB,
    backgroundImage: backgroundImageUB,
  },
  CP: {
    brandCode: "CP",
    title: "Quản lý tài sản - Cẩm Phả",
    company: "CÔNG TY KHO VẬN VÀ CẢNG CẨM PHẢ - VINACOMIN",
    primaryColor: "#0273a3",
    primaryHoverColor: "#3b8aa7ff", // standard MUI primary dark
    primaryColor100: "#e1f1f8ff",
    phone: "+84 203 3865045", // Placeholder, user can change
    email: "Vanphongkvcp@gmail.com", // Placeholder, user can change
    logo: logoCP,
    backgroundImage: backgroundImageCP,
  },
  CS: {
    brandCode: "CS",
    title: "Quản lý tài sản - Than Cao Sơn",
    company: "CÔNG TY CỔ PHẦN THAN CAO SƠN-TKV",
    primaryColor: "#1976d2",
    primaryHoverColor: "#1665c1ff", // standard MUI primary dark
    primaryColor100: "#e3f2fdff",
    phone: "024.35180141", // Placeholder, user can change
    fax: "024.38510724", // Placeholder, user can change
    logo: logoCS,
    backgroundImage: backgroundImageCS,
  },
};

const currentBrand = import.meta.env.VITE_BRAND || "UB"; // Default to UB
export const currentBrandConfig =
  brandConfigs[currentBrand] || brandConfigs["UB"];
