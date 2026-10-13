export type Product = {
  id: number;
  name: string;
  category: string;
  price?: number;
  image: string;
  badge?: string;
  description?: string;
};

export type Category = {
  id: number;
  name: string;
  image: string;
};

export type Article = {
  id: number;
  title: string;
  image: string;
  excerpt: string;
  content?: string;
};

export type SiteContent = {
  brandName: string;
  tagline: string;
  hotline: string;
  zaloUrl: string;
  facebookUrl: string;
  address: string;
  email: string;
  heroTitle: string;
  heroSubtitle: string;
  heroDescription: string;
  ctaEyebrow: string;
  ctaTitle: string;
  ctaDescription: string;
  footerTitle: string;
  footerDescription: string;
  aboutTitle: string;
  aboutContent: string;
  contactTitle: string;
  contactContent: string;
};

export type SiteAssets = {
  logo: string;
  background: string;
  backgroundImages?: string[];
  zaloIcon: string;
  facebookIcon: string;
  phoneIcon: string;
};

export type SiteData = {
  content: SiteContent;
  assets: SiteAssets;
  categories: Category[];
  products: Product[];
  articles: Article[];
};

export const defaultSiteData: SiteData = {
  assets: {
    logo: "/img/logo.png",
    background: "/img/background.jpg",
    backgroundImages: ["/img/background.jpg"],
    zaloIcon: "/img/icon_zalo.png",
    facebookIcon: "/img/icon_facebook.png",
    phoneIcon: "/img/icon-dien-thoai.png"
  },
  content: {
    brandName: "Happy Flower",
    tagline: "Giao hoa toàn quốc",
    hotline: "0900 365 365",
    zaloUrl: "https://zalo.me/0900365365",
    facebookUrl: "https://facebook.com",
    address: "Hệ thống giao hoa toàn quốc",
    email: "hello@happyflower.vn",
    heroTitle: "",
    heroSubtitle: "",
    heroDescription: "",
    ctaEyebrow: "Thiết kế riêng",
    ctaTitle: "Tạo bó hoa theo ngân sách và thông điệp của bạn",
    ctaDescription:
      "Chọn tỉnh thành, tone màu, dịp tặng và lời nhắn. Đội ngũ sẽ tư vấn mẫu phù hợp trước khi giao.",
    footerTitle: "May Flowers",
    footerDescription:
      "Dịch vụ đặt hoa và quà tặng, nội dung này có thể chỉnh sửa trong trang quản trị.",
    aboutTitle: "Giới thiệu Happy Flower",
    aboutContent:
      "Happy Flower là website mẫu cho dịch vụ điện hoa toàn quốc, tập trung vào trải nghiệm đặt hoa nhanh, xem sản phẩm rõ ràng và quản lý nội dung dễ dàng.",
    contactTitle: "Liên hệ",
    contactContent:
      "Bạn có thể liên hệ qua số điện thoại, Zalo hoặc Facebook để được tư vấn mẫu hoa và khu vực giao phù hợp."
  },
  categories: [],
  products: [],
  articles: []
};

export const navigationItems = [
  { label: "Trang chủ", href: "/" },
  { label: "Giới thiệu", href: "/gioi-thieu" },
  { label: "Bó hoa", href: "/bo-hoa" },
  { label: "Giỏ trái cây", href: "/gio-trai-cay" },
  { label: "Blog", href: "/blog" },
  { label: "Liên hệ", href: "/lien-he" }
];
