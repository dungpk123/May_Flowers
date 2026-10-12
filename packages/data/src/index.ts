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

const img = (path: string) => `https://365happyflower.vn/wp-content/uploads/${path}`;

export const defaultSiteData: SiteData = {
  assets: {
    logo: "/img/logo.png",
    background: "/img/background.jpg",
    zaloIcon: "/img/icon_zalo.png",
    facebookIcon: "/img/icon_facebook.png",
    phoneIcon: "/img/icon-dien-thoai.png"
  },
  content: {
    brandName: "Happy Flower",
    tagline: "Giao hoa toàn quốc trong ngày",
    hotline: "0900 365 365",
    zaloUrl: "https://zalo.me/0900365365",
    facebookUrl: "https://facebook.com",
    address: "Hệ thống giao hoa toàn quốc",
    email: "hello@happyflower.vn",
    heroTitle: "Happy Flower",
    heroSubtitle: "Đặt hoa online, giao tận nơi trên toàn quốc",
    heroDescription:
      "Nhận đặt hoa sinh nhật, hoa khai trương, hoa chia buồn và giỏ trái cây với mạng lưới giao hàng tại nhiều tỉnh thành.",
    ctaEyebrow: "Thiết kế riêng",
    ctaTitle: "Tạo bó hoa theo ngân sách và thông điệp của bạn",
    ctaDescription:
      "Chọn tỉnh thành, tone màu, dịp tặng và lời nhắn. Đội ngũ sẽ tư vấn mẫu phù hợp trước khi giao.",
    footerTitle: "Happy Flower",
    footerDescription:
      "Dịch vụ điện hoa toàn quốc với dữ liệu mẫu để bạn tiếp tục chỉnh sửa nội dung, sản phẩm và hình ảnh.",
    aboutTitle: "Giới thiệu Happy Flower",
    aboutContent:
      "Happy Flower là website mẫu cho dịch vụ điện hoa toàn quốc, tập trung vào trải nghiệm đặt hoa nhanh, xem sản phẩm rõ ràng và quản lý nội dung dễ dàng.",
    contactTitle: "Liên hệ",
    contactContent:
      "Bạn có thể liên hệ qua số điện thoại, Zalo hoặc Facebook để được tư vấn mẫu hoa và khu vực giao phù hợp."
  },
  categories: [
    { id: 1, name: "Bó hoa", image: img("2026/03/29-250x300.png") },
    { id: 2, name: "Giỏ trái cây", image: img("2026/03/23-2-250x300.png") },
    { id: 3, name: "Hoa khai trương", image: img("2025/10/28-4-250x409.png") },
    { id: 4, name: "Lan hồ điệp", image: img("2026/03/10-6-250x300.png") },
    { id: 5, name: "Hoa chia buồn", image: img("2025/10/9-3-250x409.png") }
  ],
  products: [
    {
      id: 101,
      name: "Bó hoa hồng pastel",
      category: "Bó hoa",
      price: 550000,
      image: img("2026/03/29-250x300.png"),
      badge: "Bán chạy",
      description: "Bó hoa hồng phối tone pastel nhẹ nhàng cho sinh nhật và kỷ niệm."
    },
    {
      id: 102,
      name: "Bó hoa hướng dương",
      category: "Bó hoa",
      price: 430000,
      image: img("2026/03/20-250x300.png"),
      badge: "Mẫu mới",
      description: "Bó hoa tươi sáng, phù hợp tặng chúc mừng và động viên."
    },
    {
      id: 103,
      name: "Bó hoa đỏ sang trọng",
      category: "Bó hoa",
      price: 799000,
      image: img("2026/03/26-250x300.png"),
      description: "Hoa đỏ chủ đạo, thiết kế nổi bật cho dịp đặc biệt."
    },
    {
      id: 104,
      name: "Giỏ trái cây TC23",
      category: "Giỏ trái cây",
      price: 1100000,
      image: img("2026/03/23-2-250x300.png"),
      badge: "Cao cấp",
      description: "Giỏ trái cây phối hoa nhỏ, lịch sự cho thăm hỏi và biếu tặng."
    },
    {
      id: 105,
      name: "Giỏ trái cây TC25",
      category: "Giỏ trái cây",
      price: 1890000,
      image: img("2026/03/25-2-250x300.png"),
      description: "Giỏ trái cây lớn với tone màu ấm, phù hợp quà doanh nghiệp."
    },
    {
      id: 106,
      name: "Lan hồ điệp vàng",
      category: "Lan hồ điệp",
      price: 1450000,
      image: img("2026/03/10-6-250x300.png"),
      description: "Chậu lan hồ điệp vàng trang nhã cho khai trương và trang trí."
    },
    {
      id: 107,
      name: "Kệ hoa khai trương",
      category: "Hoa khai trương",
      price: 1650000,
      image: img("2025/10/28-4-250x409.png"),
      description: "Kệ hoa chúc mừng nổi bật, phối màu rực rỡ."
    },
    {
      id: 108,
      name: "Vòng hoa chia buồn",
      category: "Hoa chia buồn",
      price: 1200000,
      image: img("2025/10/9-3-250x409.png"),
      description: "Thiết kế trang trọng, màu sắc nhã nhặn."
    }
  ],
  articles: [
    {
      id: 201,
      title: "Gợi ý chọn hoa sinh nhật theo tính cách",
      image: img("2026/03/21-250x300.png"),
      excerpt: "Mỗi tone hoa mang một cảm xúc riêng, từ nhẹ nhàng đến rực rỡ.",
      content: "Nên chọn hoa dựa trên màu sắc yêu thích, độ tuổi và thông điệp muốn gửi."
    },
    {
      id: 202,
      title: "Cách giữ hoa tươi lâu hơn sau khi nhận",
      image: img("2026/03/22-250x300.png"),
      excerpt: "Thay nước, cắt gốc và tránh nắng trực tiếp giúp hoa bền hơn.",
      content: "Bạn nên thay nước mỗi ngày và loại bỏ lá ngập trong nước để hoa tươi lâu."
    },
    {
      id: 203,
      title: "Khi nào nên tặng giỏ trái cây kèm hoa?",
      image: img("2026/03/24-2-250x300.png"),
      excerpt: "Giỏ trái cây kèm hoa phù hợp cho thăm hỏi, cảm ơn và chúc mừng.",
      content: "Sự kết hợp này tạo cảm giác lịch sự, tinh tế và dễ dùng cho nhiều dịp."
    }
  ]
};

export const navigationItems = [
  { label: "Trang chủ", href: "/" },
  { label: "Giới thiệu", href: "/gioi-thieu" },
  { label: "Bó hoa", href: "/bo-hoa" },
  { label: "Giỏ trái cây", href: "/gio-trai-cay" },
  { label: "Blog", href: "/blog" },
  { label: "Liên hệ", href: "/lien-he" }
];
