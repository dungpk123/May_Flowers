"use client";

import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ImageUp,
  Info,
  LogOut,
  MapPin,
  Phone,
  Plus,
  RefreshCw,
  Save,
  Send,
  ShoppingBag,
  Trash2,
  User,
  X
} from "lucide-react";
import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import type { Article, Category, Order, OrderStatus, Product, SiteData } from "@shop-flower/data";
import SitePage from "../../ui/SitePage";
import { publicApiUrl } from "../../apiConfig";
import AdminPushControls from "./AdminPushControls";

const apiUrl = publicApiUrl;
const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "admin123";
const rememberedPasswordKey = "shop-flower-admin-password";

function isRemoteImageUrl(value: string) {
  return /^https?:\/\//i.test(value.trim());
}

type ContentKey = keyof SiteData["content"];

type AdminModal = {
  title: string;
  message: string;
  inputLabel?: string;
  initialValue?: string;
  confirmText?: string;
  cancelText?: string;
  secondaryText?: string;
  danger?: boolean;
  onConfirm: (value: string) => void | Promise<void>;
  onSecondary?: () => void;
};

type AdminToast = {
  message: string;
  tone: "success" | "error" | "info";
};

type SaveProgress = {
  current: number;
  message: string;
  total: number;
};

type PendingProductUpload = {
  file: File;
  previewUrl: string;
  previousUrl: string;
};

const homeFields: Array<{ key: ContentKey; label: string; multiline?: boolean }> = [
  { key: "siteTitle", label: "Tiêu đề trên tab trình duyệt" },
  { key: "brandName", label: "Tên thương hiệu" }
];

const contactFields: Array<{ key: ContentKey; label: string }> = [
  { key: "hotline", label: "Số điện thoại" },
  { key: "zaloUrl", label: "Link Zalo" },
  { key: "facebookUrl", label: "Link Facebook" },
  { key: "address", label: "Địa chỉ" },
  { key: "email", label: "Email" }
];

const footerFields: Array<{ key: ContentKey; label: string; multiline?: boolean }> = [
  { key: "footerTitle", label: "Tiêu đề footer" },
  { key: "footerDescription", label: "Mô tả footer", multiline: true }
];

export default function AdminClient({ initialData }: { initialData: SiteData }) {
  const [data, setData] = useState<SiteData>(initialData);
  const [savedData, setSavedData] = useState<SiteData>(initialData);
  const [toast, setToast] = useState<AdminToast | null>(null);
  const [password, setPassword] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const didLoadLiveData = useRef(false);
  const [uploadingField, setUploadingField] = useState("");
  const [activeSection, setActiveSection] = useState<"overview" | "orders" | "categories" | "products" | "blog">("overview");
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [productCategoryFilter, setProductCategoryFilter] = useState("");
  const [filteredProductIds, setFilteredProductIds] = useState<number[] | null>(null);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isLoadingLiveData, setIsLoadingLiveData] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState<SaveProgress | null>(null);
  const [pendingProductUploads, setPendingProductUploads] = useState<Record<number, PendingProductUpload[]>>({});
  const [modal, setModal] = useState<AdminModal | null>(null);
  const [imageModalProductId, setImageModalProductId] = useState<number | null>(null);
  const hasUnsavedChanges = useMemo(
    () =>
      JSON.stringify(data) !== JSON.stringify(savedData) ||
      Object.keys(pendingProductUploads).length > 0,
    [data, pendingProductUploads, savedData]
  );
  const categoryOptions = useMemo(
    () => sortAdminCategories(data.categories).map((category) => category.name).filter(Boolean),
    [data.categories]
  );
  const visibleAdminProducts = useMemo(() => {
    if (!productCategoryFilter || !filteredProductIds) return data.products;

    const ids = new Set(filteredProductIds);
    return data.products.filter((product) => ids.has(product.id));
  }, [data.products, filteredProductIds, productCategoryFilter]);

  useEffect(() => {
    const rememberedPassword = window.localStorage.getItem(rememberedPasswordKey);
    if (rememberedPassword === adminPassword) {
      setPassword(rememberedPassword);
      setIsUnlocked(true);
    }
  }, []);

  useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(() => setToast(null), 3400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function showToast(message: string, tone: AdminToast["tone"] = "info") {
    setToast({ message, tone });
  }

  async function loadLiveSiteData() {
    setIsLoadingLiveData(true);

    try {
      const response = await fetch(`${apiUrl}/site-data`, {
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error("Cannot load site data");
      }

      const nextData = (await response.json()) as SiteData;
      const cleanedData = {
        ...nextData,
        assets: {
          ...nextData.assets,
          background: isRemoteImageUrl(nextData.assets.background)
            ? nextData.assets.background
            : "",
          backgroundImages: (nextData.assets.backgroundImages ?? []).filter(isRemoteImageUrl)
        }
      };
      setData(cleanedData);
      setSavedData(cleanedData);
      setPendingProductUploads({});
      setFilteredProductIds(
        productCategoryFilter
          ? nextData.products
              .filter((product) => product.category === productCategoryFilter)
              .map((product) => product.id)
          : null
      );
      showToast(
        `Đã tải dữ liệu mới nhất từ server (${nextData.products.length} sản phẩm).`,
        "success"
      );
    } catch {
      showToast(
        "Chưa tải được dữ liệu mới nhất từ server. Đang dùng dữ liệu trong bản build.",
        "error"
      );
    } finally {
      setIsLoadingLiveData(false);
    }
  }

  useEffect(() => {
    if (!isUnlocked || didLoadLiveData.current) return;

    didLoadLiveData.current = true;
    void loadLiveSiteData();
  }, [isUnlocked]);

  function rememberPendingProductUpload(
    productId: number,
    file: File,
    previewUrl: string,
    previousUrl = ""
  ) {
    setPendingProductUploads((current) => ({
      ...current,
      [productId]: [
        ...(current[productId] ?? []).filter((item) => item.previewUrl !== previousUrl),
        { file, previewUrl, previousUrl }
      ]
    }));
  }

  function clearPendingProductUpload(productId: number, imageUrl: string) {
    setPendingProductUploads((current) => {
      const nextItems = (current[productId] ?? []).filter(
        (item) => item.previewUrl !== imageUrl
      );
      const next = { ...current };
      if (nextItems.length > 0) {
        next[productId] = nextItems;
      } else {
        delete next[productId];
      }
      return next;
    });
  }

  function queueProductImages(product: Product, files: File[], replaceIndex?: number) {
    if (files.length === 0) return;

    const currentImages = getProductImages(product);
    const nextImages = [...currentImages];

    files.forEach((file, fileIndex) => {
      const previewUrl = URL.createObjectURL(file);
      const targetIndex = replaceIndex === undefined ? nextImages.length : replaceIndex + fileIndex;
      const previousUrl = nextImages[targetIndex] ?? "";
      nextImages[targetIndex] = previewUrl;
      rememberPendingProductUpload(product.id, file, previewUrl, previousUrl);
    });

    updateProductImages(data, setData, product.id, nextImages);
    showToast(
      `Đã chọn ${files.length} ảnh. Ảnh sẽ được tải lên Cloudinary khi bấm Lưu.`,
      "success"
    );
  }

  function updateContent(key: ContentKey, value: string) {
    setData({
      ...data,
      content: { ...data.content, [key]: value }
    });
  }

  async function fetchOrders() {
    setIsLoadingOrders(true);
    let list: Order[] = [];
    try {
      const response = await fetch(`${apiUrl}/orders`);
      if (response.ok) {
        list = await response.json();
      }
    } catch {
      // offline
    }

    try {
      const local = window.localStorage.getItem("shop-flower-orders");
      if (local) {
        const localList: Order[] = JSON.parse(local);
        const map = new Map<string, Order>();
        list.forEach((o) => map.set(o.id, o));
        localList.forEach((o) => {
          if (!map.has(o.id)) map.set(o.id, o);
        });
        list = Array.from(map.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
    } catch {
      // ignore
    }

    setOrders(list);
    setIsLoadingOrders(false);
  }

  async function fetchProductsByCategory(category: string) {
    if (!category) {
      setFilteredProductIds(null);
      return;
    }

    setIsLoadingProducts(true);
    try {
      const params = new URLSearchParams({ category });
      const response = await fetch(`${apiUrl}/products?${params.toString()}`, {
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error("Cannot load products");
      }

      const products = (await response.json()) as Product[];
      setFilteredProductIds(products.map((product) => product.id));
    } catch {
      const fallbackIds = data.products
        .filter((product) => product.category === category)
        .map((product) => product.id);
      setFilteredProductIds(fallbackIds);
      showToast("Không gọi được BE để lọc sản phẩm, đang dùng dữ liệu tạm trên máy.", "error");
    } finally {
      setIsLoadingProducts(false);
    }
  }

  useEffect(() => {
    if (activeSection === "orders") {
      fetchOrders();
    }
  }, [activeSection]);

  useEffect(() => {
    if (activeSection !== "products") return;

    void fetchProductsByCategory(productCategoryFilter);
  }, [activeSection, productCategoryFilter]);

  async function updateOrderStatusHandler(orderId: string, status: OrderStatus) {
    try {
      await fetch(`${apiUrl}/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
    } catch {
      // ignore
    }

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );

    try {
      const local = window.localStorage.getItem("shop-flower-orders");
      if (local) {
        const localList: Order[] = JSON.parse(local);
        const nextLocal = localList.map((o) => (o.id === orderId ? { ...o, status } : o));
        window.localStorage.setItem("shop-flower-orders", JSON.stringify(nextLocal));
      }
    } catch {
      // ignore
    }

    showToast("Đã cập nhật trạng thái đơn hàng.", "success");
  }

  function unlock(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password === adminPassword) {
      window.localStorage.setItem(rememberedPasswordKey, password);
      setIsUnlocked(true);
      setToast(null);
      return;
    }

    showToast("Mật khẩu không đúng.", "error");
  }

  async function save() {
    if (isSaving) return false;

    const uploadTotal = countPendingUploads(pendingProductUploads);
    setIsSaving(true);
    showToast("Đang lưu thay đổi...", "info");
    setSaveProgress({ current: 0, total: uploadTotal, message: uploadTotal > 0 ? `Đang chuẩn bị tải ${uploadTotal} ảnh...` : "Đang chuẩn bị lưu..." });

    try {
      const dataToSave = await uploadPendingProductImages(uploadTotal);
      if (!dataToSave) return false;

      setSaveProgress({
        current: uploadTotal,
        total: uploadTotal,
        message: "Đang lưu dữ liệu website..."
      });

      const dataToPersist: SiteData = {
        ...dataToSave,
        assets: {
          ...dataToSave.assets,
          background: isRemoteImageUrl(dataToSave.assets.background)
            ? dataToSave.assets.background
            : "",
          backgroundImages: (dataToSave.assets.backgroundImages ?? []).filter(isRemoteImageUrl)
        }
      };

      const response = await fetch(`${apiUrl}/site-data`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToPersist)
      });

      if (!response.ok) {
        showToast("Chưa lưu được. Kiểm tra server rồi thử lại.", "error");
        return false;
      }

      const nextData = await response.json();
      setData(nextData);
      setSavedData(nextData);
      setPendingProductUploads({});
      showToast("Đã lưu thay đổi.", "success");
      return true;
    } finally {
      setIsSaving(false);
      setSaveProgress(null);
    }
  }

  async function uploadPendingProductImages(uploadTotal: number) {
    const pending = Object.entries(pendingProductUploads).flatMap(([productId, uploads]) =>
      uploads.map((upload) => ({ ...upload, productId: Number(productId) }))
    );

    if (pending.length === 0) return data;

    let nextData = data;
    for (let index = 0; index < pending.length; index += 1) {
      const upload = pending[index];
      setSaveProgress({
        current: index + 1,
        total: uploadTotal || pending.length,
        message: `Đang tải ảnh ${index + 1}/${pending.length} lên Cloudinary...`
      });
      showToast(`Đang tải ảnh ${index + 1}/${pending.length} lên Cloudinary...`, "info");
      const uploadedUrl = await uploadImageFile(
        upload.file,
        upload.previousUrl.startsWith("blob:") ? "" : upload.previousUrl,
        `product-${upload.productId}-save-${index}`
      );

      if (!uploadedUrl) {
        showToast(
          `Dừng lưu vì ảnh ${index + 1}/${pending.length} chưa tải lên được.`,
          "error"
        );
        return null;
      }

      nextData = {
        ...nextData,
        products: nextData.products.map((product) => {
          if (product.id !== upload.productId) return product;

          const images = getProductImages(product).map((image) =>
            image === upload.previewUrl ? uploadedUrl : image
          );

          return {
            ...product,
            image: images[0] ?? "",
            images
          };
        })
      };
      setData(nextData);

      if (index < pending.length - 1) {
        await wait(900);
      }
    }

    return nextData;
  }

  function exitAdmin() {
    if (!hasUnsavedChanges) {
      window.location.href = "/";
      return;
    }

    setModal({
      title: "Có thay đổi chưa lưu",
      message: "Bạn vừa chỉnh sửa nội dung. Bạn có muốn lưu trước khi thoát ra website không?",
      confirmText: "Lưu rồi thoát",
      secondaryText: "Thoát không lưu",
      cancelText: "Ở lại",
      onConfirm: async () => {
        const ok = await save();
        if (ok) window.location.href = "/";
      },
      onSecondary: () => {
        window.location.href = "/";
      }
    });
  }

  async function uploadImageFile(file: File, previousUrl: string, fieldId: string) {
    setUploadingField(fieldId);
    showToast(previousUrl ? "Đang xóa ảnh cũ và thay ảnh mới..." : "Đang tải ảnh...", "info");

    const formData = new FormData();
    formData.append("file", file);
    if (previousUrl) formData.append("previousUrl", previousUrl);

    try {
      const response = await fetch(`${apiUrl}/uploads/image`, {
        method: "POST",
        body: formData
      });
      const contentType = response.headers.get("content-type") ?? "";
      const result = contentType.includes("application/json")
        ? await response.json()
        : { message: await response.text() };

      if (!response.ok || !result.url) {
        showToast(
          result.message ||
            result.error ||
            `Chưa thay được ảnh. Server trả lỗi ${response.status}.`,
          "error"
        );
        return "";
      }

      return result.url as string;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không rõ lỗi";
      showToast(`Chưa thay được ảnh: ${message}.`, "error");
      return "";
    } finally {
      setUploadingField("");
    }
  }

  async function uploadImage(
    file: File,
    previousUrl: string,
    onUploaded: (url: string) => void,
    fieldId: string
  ) {
    const url = await uploadImageFile(file, previousUrl, fieldId);
    if (url) {
      onUploaded(url);
      showToast("Đã thay ảnh. Bấm Lưu để cập nhật website.", "success");
    }
  }

  function addCategory() {
    setData({
      ...data,
      categories: [
        ...data.categories,
        {
          id: Date.now(),
          name: "",
          displayTitle: "",
          sortOrder: data.categories.length + 1,
          image: ""
        }
      ]
    });
    showToast("Đã thêm dòng danh mục mới ở cuối danh sách.", "success");
  }

  function removeCategory(category: Category) {
    const hasProducts = data.products.some((product) => product.category === category.name);
    const message = hasProducts
      ? `Danh mục "${category.name}" đang có sản phẩm. Xóa danh mục này vẫn giữ sản phẩm, bạn cần chọn lại danh mục cho sản phẩm sau. Bạn chắc chắn muốn xóa?`
      : `Bạn chắc chắn muốn xóa danh mục "${category.name}"?`;

    setModal({
      title: "Xóa danh mục",
      message,
      confirmText: "Xóa danh mục",
      danger: true,
      onConfirm: () => {
        setData({
          ...data,
          categories: data.categories.filter((item) => item.id !== category.id)
        });
        showToast(`Đã xóa danh mục "${category.name}". Bấm Lưu để cập nhật website.`, "success");
      }
    });
  }

  function addProduct() {
    const newProductId = Date.now();
    const selectedCategory = productCategoryFilter || data.categories[0]?.name || "";

    setData({
      ...data,
      products: [
        {
          id: newProductId,
          name: "",
          category: selectedCategory,
          image: "",
          images: [],
          price: undefined
        },
        ...data.products
      ]
    });

    if (productCategoryFilter) {
      setFilteredProductIds((currentIds) => [newProductId, ...(currentIds ?? [])]);
    }

    showToast(
      selectedCategory
        ? `Đã thêm sản phẩm mới vào danh mục "${selectedCategory}".`
        : "Đã thêm dòng sản phẩm mới ở đầu danh sách.",
      "success"
    );
  }

  function addProductsFromImages(files: File[]) {
    if (files.length === 0) return;

    const selectedCategory = productCategoryFilter || data.categories[0]?.name || "";
    const categoryProductCount = data.products.filter(
      (product) => product.category === selectedCategory
    ).length;
    const productCode = getCategoryProductCode(selectedCategory);
    const now = Date.now();
    const newProducts = files.map((file, index) => {
      const previewUrl = URL.createObjectURL(file);
      const productId = now + index;
      const productNumber = categoryProductCount + index + 1;

      rememberPendingProductUpload(productId, file, previewUrl);

      return {
        id: productId,
        name: selectedCategory
          ? `${selectedCategory} - ${productCode}${productNumber}`
          : `Sản phẩm - SP${data.products.length + index + 1}`,
        category: selectedCategory,
        image: previewUrl,
        images: [previewUrl],
        price: undefined,
        badge: undefined
      } satisfies Product;
    });

    setData({
      ...data,
      products: [...newProducts, ...data.products]
    });

    if (productCategoryFilter) {
      setFilteredProductIds((currentIds) => [
        ...newProducts.map((product) => product.id),
        ...(currentIds ?? [])
      ]);
    }

    showToast(
      `Đã tạo ${newProducts.length} sản phẩm từ ảnh. Ảnh sẽ được tải lên khi bấm Lưu.`,
      "success"
    );
  }

  function removeProduct(product: Product) {
    const productName = product.name || "chưa đặt tên";
    setModal({
      title: "Xóa sản phẩm",
      message: `Bạn chắc chắn muốn xóa sản phẩm "${productName}"?`,
      confirmText: "Xóa sản phẩm",
      danger: true,
      onConfirm: () => {
        setData({
          ...data,
          products: data.products.filter((item) => item.id !== product.id)
        });
        setPendingProductUploads((current) => {
          const next = { ...current };
          delete next[product.id];
          return next;
        });
        showToast(`Đã xóa sản phẩm "${productName}". Bấm Lưu để cập nhật website.`, "success");
      }
    });
  }

  function addArticle() {
    setModal({
      title: "Thêm bài viết",
      message: "Nhập tiêu đề bài viết mới.",
      inputLabel: "Tiêu đề bài viết",
      confirmText: "Thêm bài viết",
      onConfirm: (value) => {
        const title = value.trim();
        if (!title) return;

        setData({
          ...data,
          articles: [
            ...data.articles,
            { id: Date.now(), title, image: "", excerpt: "", content: "" }
          ]
        });
        showToast(`Đã thêm bài viết "${title}". Bấm Lưu để cập nhật website.`, "success");
      }
    });
  }

  function removeArticle(article: Article) {
    const articleTitle = article.title || "chưa đặt tên";
    setModal({
      title: "Xóa bài viết",
      message: `Bạn chắc chắn muốn xóa bài viết "${articleTitle}"?`,
      confirmText: "Xóa bài viết",
      danger: true,
      onConfirm: () => {
        setData({
          ...data,
          articles: data.articles.filter((item) => item.id !== article.id)
        });
        showToast(`Đã xóa bài viết "${articleTitle}". Bấm Lưu để cập nhật website.`, "success");
      }
    });
  }

  if (!isUnlocked) {
    return (
      <main className="admin-login-page">
        {toast ? <AdminToastMessage toast={toast} onClose={() => setToast(null)} /> : null}
        <form className="admin-login-card" onSubmit={unlock}>
          <p>Quản trị website</p>
          <h1>Nhập mật khẩu</h1>
          <label className="admin-field">
            <span>Mật khẩu</span>
            <input
              autoFocus
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              value={password}
            />
          </label>
          <button type="submit">
            <Save size={18} /> Vào trang quản trị
          </button>
          <a href="/">Quay lại website</a>
        </form>
      </main>
    );
  }

  return (
    <main className={`admin-workspace ${activeSection === "overview" ? "" : "admin-wide"}`}>
      {toast ? <AdminToastMessage toast={toast} onClose={() => setToast(null)} /> : null}
      <aside className="admin-editor">
        <header className="admin-editor-header">
          <div>
            <p>Quản trị website</p>
            <h1>Chỉnh sửa nội dung</h1>
          </div>
          <div className="admin-header-actions">
            <button className="admin-exit-button" disabled={isSaving || isLoadingLiveData || Boolean(uploadingField)} type="button" onClick={exitAdmin}>
              <LogOut size={18} /> Thoát
            </button>
            <button className="admin-exit-button" disabled={isSaving || isLoadingLiveData || Boolean(uploadingField)} type="button" onClick={loadLiveSiteData}>
              <RefreshCw className={isLoadingLiveData ? "spinning" : ""} size={18} /> Tải lại
            </button>
            <button disabled={isSaving || isLoadingLiveData || Boolean(uploadingField)} type="button" onClick={save}>
              <Save size={18} /> {isSaving ? "Đang lưu..." : isLoadingLiveData ? "Đang tải..." : "Lưu"}
            </button>
          </div>
        </header>

        <div className="admin-push-toolbar">
          <AdminPushControls />
        </div>

        <nav className="admin-tabs" aria-label="Mục quản trị">
          <button className={activeSection === "overview" ? "active" : ""} onClick={() => setActiveSection("overview")} type="button">
            Tổng quan
          </button>
          <button className={activeSection === "orders" ? "active" : ""} onClick={() => setActiveSection("orders")} type="button">
            Đơn hàng {orders.length > 0 ? `(${orders.length})` : ""}
          </button>
          <button className={activeSection === "categories" ? "active" : ""} onClick={() => setActiveSection("categories")} type="button">
            Danh mục
          </button>
          <button className={activeSection === "products" ? "active" : ""} onClick={() => setActiveSection("products")} type="button">
            Sản phẩm
          </button>
          <button className={activeSection === "blog" ? "active" : ""} onClick={() => setActiveSection("blog")} type="button">
            Blog
          </button>
        </nav>

        {activeSection === "overview" ? (
          <>
            <section className="admin-panel">
              <div className="admin-panel-heading">
                <h2>Hình ảnh chính</h2>
                <p>Thêm nhiều ảnh nền để hiển thị ở phần đầu trang.</p>
              </div>
              <div className="admin-image-grid single">
                <ImageField
                  label="Logo"
                  value={data.assets.logo}
                  uploading={uploadingField === "asset-logo"}
                  onUpload={(file) =>
                    uploadImage(
                      file,
                      data.assets.logo,
                      (value) => setData({ ...data, assets: { ...data.assets, logo: value } }),
                      "asset-logo"
                    )
                  }
                />
              </div>
              <BackgroundManager
                images={(data.assets.backgroundImages?.length
                  ? data.assets.backgroundImages
                  : [data.assets.background]
                ).filter(isRemoteImageUrl)}
                uploadingField={uploadingField}
                onAdd={(file) =>
                  uploadImage(
                    file,
                    "",
                    (value) => {
                      const nextImages = [
                        ...(data.assets.backgroundImages?.length
                          ? data.assets.backgroundImages
                          : data.assets.background
                            ? [data.assets.background]
                            : []),
                        value
                      ];
                      setData({
                        ...data,
                        assets: {
                          ...data.assets,
                          background: nextImages[0] ?? "",
                          backgroundImages: nextImages
                        }
                      });
                    },
                    "asset-background-add"
                  )
                }
                onRemove={(index) => {
                  setModal({
                    title: "Xóa ảnh nền",
                    message: "Bạn chắc chắn muốn xóa ảnh nền này?",
                    confirmText: "Xóa ảnh",
                    danger: true,
                    onConfirm: () => {
                      const nextImages = (data.assets.backgroundImages?.length
                        ? data.assets.backgroundImages
                        : [data.assets.background]
                      ).filter((_, imageIndex) => imageIndex !== index);
                      setData({
                        ...data,
                        assets: {
                          ...data.assets,
                          background: nextImages[0] ?? "",
                          backgroundImages: nextImages
                        }
                      });
                      showToast("Đã xóa ảnh nền. Bấm Lưu để cập nhật website.", "success");
                    }
                  });
                }}
                onReplace={(file, index, previousUrl) =>
                  uploadImage(
                    file,
                    previousUrl,
                    (value) => {
                      const nextImages = [
                        ...(data.assets.backgroundImages?.length
                          ? data.assets.backgroundImages
                          : [data.assets.background])
                      ];
                      nextImages[index] = value;
                      setData({
                        ...data,
                        assets: {
                          ...data.assets,
                          background: nextImages[0] ?? "",
                          backgroundImages: nextImages
                        }
                      });
                    },
                    `asset-background-${index}`
                  )
                }
              />
          </section>

          <section className="admin-panel">
            <div className="admin-panel-heading">
              <h2>Nội dung trang chủ</h2>
              <p>Tên thương hiệu dùng cho footer và thông tin hệ thống.</p>
            </div>
            <div className="admin-grid compact">
              {homeFields.map((field) => (
                <Field
                  key={field.key}
                  label={field.label}
                  value={data.content[field.key]}
                  multiline={field.multiline}
                  onChange={(value) => updateContent(field.key, value)}
                />
              ))}
            </div>
          </section>

          <section className="admin-panel">
            <div className="admin-panel-heading">
              <h2>Liên hệ</h2>
              <p>Chỉ sửa link và số điện thoại.</p>
            </div>
            <div className="admin-grid compact one-column">
              {contactFields.map((field) => (
                <Field
                  key={field.key}
                  label={field.label}
                  value={data.content[field.key]}
                  onChange={(value) => updateContent(field.key, value)}
                />
              ))}
            </div>
          </section>

          <section className="admin-panel">
            <div className="admin-panel-heading">
              <h2>Footer</h2>
              <p>Nội dung hiển thị ở phần chân trang.</p>
            </div>
            <div className="admin-grid compact one-column">
              {footerFields.map((field) => (
                <Field
                  key={field.key}
                  label={field.label}
                  value={data.content[field.key]}
                  multiline={field.multiline}
                  onChange={(value) => updateContent(field.key, value)}
                />
              ))}
            </div>
          </section>
          </>
        ) : null}

        {activeSection === "orders" ? (
          <section className="admin-panel">
            <div className="admin-panel-title">
              <div className="admin-panel-heading">
                <h2>Đơn hàng ({orders.length})</h2>
                <p>Khách hàng đặt hàng nhanh qua form &ldquo;Đặt hàng ngay&rdquo; trên website.</p>
              </div>
              <button
                disabled={isLoadingOrders}
                onClick={fetchOrders}
                type="button"
              >
                <RefreshCw className={isLoadingOrders ? "spinning" : ""} size={16} /> Làm mới
              </button>
            </div>

            {orders.length === 0 ? (
              <p className="admin-empty">Chưa có đơn hàng nào.</p>
            ) : null}

            <div className="admin-order-list">
              {orders.map((order) => {
                const orderDigits = order.ordererPhone.replace(/\D/g, "");
                const recipientDigits = order.recipientPhone.replace(/\D/g, "");
                return (
                  <div className="admin-order-card" key={order.id}>
                    <div className="admin-order-card-header">
                      <div>
                        <span className="admin-order-code">#{order.orderCode}</span>
                        <span className="admin-order-time">
                          {new Date(order.createdAt).toLocaleString("vi-VN")}
                        </span>
                      </div>
                      <div className="admin-order-status-badge">
                        <select
                          className={`status-select status-${order.status}`}
                          value={order.status}
                          onChange={(e) => updateOrderStatusHandler(order.id, e.target.value as OrderStatus)}
                        >
                          <option value="pending">Chờ xác nhận</option>
                          <option value="confirmed">Đã xác nhận</option>
                          <option value="delivering">Đang giao hoa</option>
                          <option value="completed">Đã hoàn thành</option>
                          <option value="cancelled">Đã hủy</option>
                        </select>
                      </div>
                    </div>

                    <div className="admin-order-card-body">
                      <div className="admin-order-product-col">
                        <img
                          alt={order.productName}
                          className="admin-order-thumb"
                          src={order.productImage}
                        />
                        <div>
                          <strong>{order.productName}</strong>
                          <p>
                            Số lượng: <strong>{order.quantity}</strong> • Đơn giá:{" "}
                            {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(order.productPrice)}
                          </p>
                          <p className="admin-order-total">
                            Tổng tiền:{" "}
                            <strong>
                              {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(order.totalAmount)}
                            </strong>
                          </p>
                        </div>
                      </div>

                      <div className="admin-order-info-col">
                        <p>
                          <User size={14} /> <strong>Người đặt:</strong> {order.ordererName} -{" "}
                          <a href={`tel:${orderDigits}`}>{order.ordererPhone}</a>
                          {orderDigits ? (
                            <a
                              className="admin-action-zalo-inline"
                              href={`https://zalo.me/${orderDigits}`}
                              rel="noreferrer"
                              target="_blank"
                            >
                              Nhắn Zalo
                            </a>
                          ) : null}
                        </p>
                        {order.ordererEmail ? (
                          <p>
                            <strong>Email:</strong> {order.ordererEmail}
                          </p>
                        ) : null}
                        <p>
                          <User size={14} /> <strong>Người nhận:</strong> {order.recipientName} -{" "}
                          <a href={`tel:${recipientDigits}`}>{order.recipientPhone}</a>
                        </p>
                        <p>
                          <Clock size={14} /> <strong>Thời gian giao:</strong>{" "}
                          {order.deliveryTime} • {order.deliveryDate}
                        </p>
                        <p>
                          <MapPin size={14} /> <strong>Địa chỉ giao:</strong>{" "}
                          {order.deliveryAddress}
                        </p>
                        {order.message ? (
                          <p className="admin-order-message">
                            <strong>Lời chúc / Thiệp:</strong> &ldquo;{order.message}&rdquo;
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        {activeSection === "categories" ? (
        <section className="admin-panel">
          <div className="admin-panel-title">
            <div className="admin-panel-heading">
              <h2>Danh mục sản phẩm</h2>
              <p>Tạo nhóm như bó hoa, giỏ trái cây, hoa khai trương.</p>
            </div>
            <button type="button" onClick={addCategory}>
              <Plus size={17} /> Thêm
            </button>
          </div>
          {data.categories.length === 0 ? <p className="admin-empty">Chưa có danh mục.</p> : null}
          <div className="admin-list">
            {sortAdminCategories(data.categories).map((item, index) => (
              <article className="admin-row-card" key={item.id}>
                <strong>{index + 1}</strong>
                <div className="admin-category-fields">
                  <Field
                    label="Thứ tự hiển thị"
                    value={String(item.sortOrder || index + 1)}
                    onChange={(value) =>
                      updateCategory(data, setData, item.id, {
                        sortOrder: Number(value.replace(/\D/g, "")) || index + 1
                      })
                    }
                  />
                  <Field
                    label="Tên danh mục"
                    value={item.name}
                    onChange={(value) => updateCategory(data, setData, item.id, { name: value })}
                  />
                  <Field
                    label="Tiêu đề khi mở danh mục"
                    value={item.displayTitle || item.name}
                    onChange={(value) =>
                      updateCategory(data, setData, item.id, { displayTitle: value })
                    }
                  />
                </div>
                <ImageField
                  label="Ảnh"
                  value={item.image}
                  uploading={uploadingField === `category-${item.id}`}
                  compact
                  onUpload={(file) =>
                    uploadImage(
                      file,
                      item.image,
                      (value) => updateCategory(data, setData, item.id, { image: value }),
                      `category-${item.id}`
                    )
                  }
                />
                <button
                  className="delete-button icon-only"
                  type="button"
                  onClick={() => removeCategory(item)}
                  title="Xóa danh mục"
                >
                  <Trash2 size={17} />
                </button>
              </article>
            ))}
          </div>
        </section>
        ) : null}

        {activeSection === "products" ? (
        <section className="admin-panel">
          <div className="admin-panel-title">
            <div className="admin-panel-heading">
              <h2>Sản phẩm</h2>
              <p>Thêm tên, giá, danh mục và ảnh sản phẩm.</p>
            </div>
            <button type="button" onClick={addProduct}>
              <Plus size={17} /> Thêm
            </button>
          </div>
          <div className="admin-product-filter">
            <label className="admin-product-filter-select">
              <span>Lọc theo danh mục</span>
              <select
                disabled={isLoadingProducts}
                value={productCategoryFilter}
                onChange={(event) => setProductCategoryFilter(event.target.value)}
              >
                <option value="">Tất cả danh mục</option>
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-bulk-upload-button">
              <input
                accept="image/*"
                multiple
                onChange={(event) => {
                  addProductsFromImages(Array.from(event.target.files ?? []));
                  event.target.value = "";
                }}
                type="file"
              />
              <Plus size={16} />
              Thêm hàng loạt ảnh
            </label>
            <strong>
              {isLoadingProducts
                ? "Đang lọc từ BE..."
                : `${visibleAdminProducts.length}/${data.products.length} sản phẩm`}
            </strong>
          </div>
          {data.products.length === 0 ? <p className="admin-empty">Chưa có sản phẩm.</p> : null}
          {data.products.length > 0 && visibleAdminProducts.length === 0 ? (
            <p className="admin-empty">Danh mục này chưa có sản phẩm.</p>
          ) : null}
          <div className="admin-list">
            {visibleAdminProducts.map((item) => {
              const originalIndex = data.products.findIndex((product) => product.id === item.id);

              return (
              <article className="admin-product-editor" key={item.id}>
                <div className="admin-product-number">
                  {originalIndex >= 0 ? data.products.length - originalIndex : ""}
                </div>
                <ProductImageManager
                  product={item}
                  uploadingField={uploadingField}
                  onOpenManager={() => setImageModalProductId(item.id)}
                  onReplace={(file, imageIndex) =>
                    queueProductImages(item, [file], imageIndex)
                  }
                  onRemove={(imageIndex) => {
                    const nextImages = getProductImages(item).filter(
                      (_, currentIndex) => currentIndex !== imageIndex
                    );
                    const removedImage = getProductImages(item)[imageIndex];
                    if (removedImage) clearPendingProductUpload(item.id, removedImage);
                    updateProductImages(data, setData, item.id, nextImages);
                    showToast("Đã xóa ảnh khỏi sản phẩm. Bấm Lưu để cập nhật website.", "success");
                  }}
                />
                <div className="admin-product-fields">
                  <div className="admin-grid compact">
                    <Field
                      label="Tên sản phẩm"
                      value={item.name}
                      onChange={(value) => updateProduct(data, setData, item.id, { name: value })}
                    />
                    <SelectField
                      label="Danh mục"
                      options={sortAdminCategories(data.categories).map((category) => category.name).filter(Boolean)}
                      value={item.category}
                      onChange={(value) =>
                        updateProduct(data, setData, item.id, { category: value })
                      }
                    />
                    <PriceField
                      label="Giá"
                      value={item.price ? String(item.price) : ""}
                      onChange={(value) =>
                        updateProduct(data, setData, item.id, {
                          price: value ? Number(value) : undefined
                        })
                      }
                    />
                    <BadgeField
                      label="Nhãn"
                      value={item.badge ?? ""}
                      onChange={(value) =>
                        updateProduct(data, setData, item.id, { badge: value || undefined })
                      }
                    />
                  </div>
                  <Field
                    label="Mô tả"
                    value={item.description ?? ""}
                    multiline
                    onChange={(value) =>
                      updateProduct(data, setData, item.id, { description: value })
                    }
                  />
                </div>
                <button
                  className="delete-button icon-only"
                  type="button"
                  onClick={() => removeProduct(item)}
                  title="Xóa sản phẩm"
                >
                  <Trash2 size={17} />
                </button>
              </article>
              );
            })}
          </div>
        </section>
        ) : null}

        {activeSection === "blog" ? (
        <section className="admin-panel">
          <div className="admin-panel-title">
            <div className="admin-panel-heading">
              <h2>Blog</h2>
              <p>Bài viết sẽ hiển thị ở trang blog.</p>
            </div>
            <button type="button" onClick={addArticle}>
              <Plus size={17} /> Thêm
            </button>
          </div>
          {data.articles.length === 0 ? <p className="admin-empty">Chưa có bài viết.</p> : null}
          <div className="admin-list">
            {data.articles.map((item) => (
              <article className="admin-product-editor" key={item.id}>
                <ImageField
                  label="Ảnh"
                  value={item.image}
                  uploading={uploadingField === `article-${item.id}`}
                  compact
                  onUpload={(file) =>
                    uploadImage(
                      file,
                      item.image,
                      (value) => updateArticle(data, setData, item.id, { image: value }),
                      `article-${item.id}`
                    )
                  }
                />
                <div className="admin-product-fields">
                  <Field
                    label="Tiêu đề"
                    value={item.title}
                    onChange={(value) => updateArticle(data, setData, item.id, { title: value })}
                  />
                  <Field
                    label="Tóm tắt"
                    value={item.excerpt}
                    multiline
                    onChange={(value) => updateArticle(data, setData, item.id, { excerpt: value })}
                  />
                  <Field
                    label="Nội dung"
                    value={item.content ?? ""}
                    multiline
                    onChange={(value) => updateArticle(data, setData, item.id, { content: value })}
                  />
                </div>
                <button
                  className="delete-button icon-only"
                  type="button"
                  onClick={() => removeArticle(item)}
                  title="Xóa bài viết"
                >
                  <Trash2 size={17} />
                </button>
              </article>
            ))}
          </div>
        </section>
        ) : null}
      </aside>

      {saveProgress ? <SaveProgressDialog progress={saveProgress} /> : null}
      {activeSection === "overview" ? (
        <section className="admin-preview-pane">
          <header className="admin-preview-header">
            <div>
              <p>Preview trực tiếp</p>
              <h2>Trang chủ</h2>
            </div>
            <a href="/" target="_blank">
              Xem website
            </a>
          </header>

          <div className="admin-preview-card">
            <div className="admin-site-preview">
              <SitePage data={data} view="home" />
            </div>
          </div>
        </section>
      ) : null}
      {modal ? <AdminModalDialog modal={modal} onClose={() => setModal(null)} /> : null}
      {imageModalProductId ? (
        <ProductImagesDialog
          product={data.products.find((item) => item.id === imageModalProductId)}
          uploadingField={uploadingField}
          onClose={() => setImageModalProductId(null)}
          onAdd={async (files) => {
            const product = data.products.find((item) => item.id === imageModalProductId);
            if (!product || files.length === 0) return;

            queueProductImages(product, files);
          }}
          onReplace={(file, imageIndex, previousUrl) => {
            const product = data.products.find((item) => item.id === imageModalProductId);
            if (!product) return;

            queueProductImages(product, [file], imageIndex);
          }}
          onRemove={(imageIndex) => {
            const product = data.products.find((item) => item.id === imageModalProductId);
            if (!product) return;

            const removedImage = getProductImages(product)[imageIndex];
            updateProductImages(
              data,
              setData,
              product.id,
              getProductImages(product).filter((_, currentIndex) => currentIndex !== imageIndex)
            );
            if (removedImage) clearPendingProductUpload(product.id, removedImage);
            showToast("Đã xóa ảnh khỏi sản phẩm. Bấm Lưu để cập nhật website.", "success");
          }}
        />
      ) : null}
    </main>
  );
}

function AdminToastMessage({
  toast,
  onClose
}: {
  toast: AdminToast;
  onClose: () => void;
}) {
  const Icon =
    toast.tone === "success" ? CheckCircle2 : toast.tone === "error" ? AlertCircle : Info;

  return (
    <div className={`admin-toast ${toast.tone}`} role="status" aria-live="polite">
      <span className="admin-toast-icon">
        <Icon size={20} />
      </span>
      <p>{toast.message}</p>
      <button type="button" onClick={onClose} aria-label="Đóng thông báo">
        <X size={16} />
      </button>
    </div>
  );
}

function SaveProgressDialog({ progress }: { progress: SaveProgress }) {
  const percent =
    progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 100;

  return (
    <div className="admin-modal-backdrop admin-progress-backdrop" role="presentation">
      <div className="admin-modal admin-progress-modal" role="status" aria-live="polite">
        <div className="admin-progress-icon">
          <RefreshCw className="spinning" size={30} />
        </div>
        <div>
          <p>Đang xử lý</p>
          <h2>{progress.total > 0 ? "Đang tải ảnh lên" : "Đang lưu website"}</h2>
          <span>{progress.message}</span>
        </div>
        {progress.total > 0 ? (
          <>
            <div className="admin-progress-count">
              <strong>
                {progress.current}/{progress.total}
              </strong>
              <span>{percent}%</span>
            </div>
            <div className="admin-progress-bar" aria-hidden="true">
              <i style={{ width: `${percent}%` }} />
            </div>
            <small>Vui lòng không tắt trang trong lúc ảnh đang được tải từng cái một.</small>
          </>
        ) : (
          <small>Vui lòng chờ trong giây lát.</small>
        )}
      </div>
    </div>
  );
}

function AdminModalDialog({
  modal,
  onClose
}: {
  modal: AdminModal;
  onClose: () => void;
}) {
  const [value, setValue] = useState(modal.initialValue ?? "");

  useEffect(() => {
    setValue(modal.initialValue ?? "");
  }, [modal]);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void modal.onConfirm(value);
    onClose();
  }

  return (
    <div className="admin-modal-backdrop" role="presentation">
      <form className="admin-modal" onSubmit={submit}>
        <div>
          <p>Quản trị website</p>
          <h2>{modal.title}</h2>
          <span>{modal.message}</span>
        </div>
        {modal.inputLabel ? (
          <label className="admin-field">
            <span>{modal.inputLabel}</span>
            <input autoFocus value={value} onChange={(event) => setValue(event.target.value)} />
          </label>
        ) : null}
        <div className="admin-modal-actions">
          <button className="ghost-modal-button" onClick={onClose} type="button">
            {modal.cancelText ?? "Hủy"}
          </button>
          {modal.secondaryText && modal.onSecondary ? (
            <button
              className="ghost-modal-button"
              onClick={() => {
                modal.onSecondary?.();
                onClose();
              }}
              type="button"
            >
              {modal.secondaryText}
            </button>
          ) : null}
          <button className={modal.danger ? "danger-modal-button" : ""} type="submit">
            {modal.confirmText ?? "Xác nhận"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  multiline = false
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
}) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      {multiline ? (
        <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={3} />
      ) : (
        <input value={value} onChange={(event) => onChange(event.target.value)} />
      )}
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Chọn danh mục</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function PriceField({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      <div className="admin-input-suffix">
        <input
          inputMode="numeric"
          value={value}
          onChange={(event) => onChange(event.target.value.replace(/\D/g, ""))}
        />
        <b>VND</b>
      </div>
    </label>
  );
}

function BadgeField({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      <div className="admin-badge-picker">
        {["", "Hot", "Mới"].map((item) => (
          <button
            className={value === item ? "active" : ""}
            key={item || "none"}
            onClick={() => onChange(item)}
            type="button"
          >
            {item || "Không"}
          </button>
        ))}
      </div>
    </label>
  );
}

function ImageField({
  label,
  value,
  uploading,
  onUpload,
  compact = false
}: {
  label: string;
  value: string;
  uploading: boolean;
  onUpload: (file: File) => void;
  compact?: boolean;
}) {
  return (
    <div className={`admin-image-field ${compact ? "compact" : ""}`}>
      <span>{label}</span>
      <div className="admin-image-preview">
        {value ? <img src={value} alt="" /> : <p>Chưa có ảnh</p>}
      </div>
      <label className="admin-upload-button">
        <input
          accept="image/*"
          disabled={uploading}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onUpload(file);
            event.target.value = "";
          }}
          type="file"
        />
        <ImageUp size={16} />
        {uploading ? "Đang thay..." : "Chọn ảnh"}
      </label>
    </div>
  );
}

function ProductImageManager({
  product,
  uploadingField,
  onOpenManager,
  onReplace,
  onRemove
}: {
  product: Product;
  uploadingField: string;
  onOpenManager: () => void;
  onReplace: (file: File, index: number, previousUrl: string) => void;
  onRemove: (index: number) => void;
}) {
  const images = getProductImages(product);

  return (
    <div className="admin-product-images">
      <span>Ảnh sản phẩm</span>
      {images.length > 0 ? (
        <div className="admin-product-image-list">
          {images.map((image, index) => (
            <div className="admin-product-image-item" key={`${image}-${index}`}>
              <img src={image} alt="" />
              {index === 0 ? <em>Ảnh chính</em> : null}
              <div>
                <label className="admin-upload-button">
                  <input
                    accept="image/*"
                    disabled={uploadingField === `product-${product.id}-${index}`}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) onReplace(file, index, image);
                      event.target.value = "";
                    }}
                    type="file"
                  />
                  <ImageUp size={15} />
                  {uploadingField === `product-${product.id}-${index}` ? "Đang thay..." : "Thay"}
                </label>
                <button
                  className="delete-button icon-only"
                  onClick={() => onRemove(index)}
                  title="Xóa ảnh"
                  type="button"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="admin-image-preview admin-product-empty-image">
          <p>Chưa có ảnh</p>
        </div>
      )}

      <button
        className="admin-upload-button add-product-image"
        onClick={onOpenManager}
        type="button"
      >
        <Plus size={16} />
        Thêm ảnh
      </button>
    </div>
  );
}

function ProductImagesDialog({
  product,
  uploadingField,
  onAdd,
  onClose,
  onReplace,
  onRemove
}: {
  product?: Product;
  uploadingField: string;
  onAdd: (files: File[]) => void | Promise<void>;
  onClose: () => void;
  onReplace: (file: File, index: number, previousUrl: string) => void;
  onRemove: (index: number) => void;
}) {
  const images = product ? getProductImages(product) : [];
  const isUploading = uploadingField.includes("product-");
  const handleAddFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length > 0) void onAdd(files);
    event.target.value = "";
  };

  if (!product) return null;

  return (
    <div className="admin-modal-backdrop" role="presentation">
      <div className="admin-modal admin-image-modal" role="dialog" aria-modal="true">
        <div className="admin-image-modal-header">
          <div>
            <p>Quản trị website</p>
            <h2>Ảnh sản phẩm</h2>
            <span>{product.name || "Sản phẩm chưa đặt tên"}</span>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng">
            <X size={18} />
          </button>
        </div>

        {images.length > 0 ? (
          <div className="admin-image-modal-grid">
            {images.map((image, index) => (
              <div className="admin-product-image-item" key={`${image}-${index}`}>
                <img src={image} alt="" />
                {index === 0 ? <em>Ảnh chính</em> : null}
                <div>
                  <label className="admin-upload-button">
                    <input
                      accept="image/*"
                      disabled={uploadingField === `product-${product.id}-${index}`}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) onReplace(file, index, image);
                        event.target.value = "";
                      }}
                      type="file"
                    />
                    <ImageUp size={15} />
                    {uploadingField === `product-${product.id}-${index}` ? "Đang thay..." : "Thay"}
                  </label>
                  <button
                    className="delete-button icon-only"
                    onClick={() => onRemove(index)}
                    title="Xóa ảnh"
                    type="button"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
            <label className="admin-product-add-tile">
              <input
                accept="image/*"
                disabled={isUploading}
                multiple
                onChange={handleAddFiles}
                type="file"
              />
              <Plus size={22} />
              <strong>{isUploading ? "Đang thêm ảnh..." : "Thêm ảnh"}</strong>
              <span>Click để chọn nhiều ảnh</span>
            </label>
          </div>
        ) : (
          <label className="admin-image-preview admin-product-empty-image admin-image-dropzone">
            <input
              accept="image/*"
              disabled={isUploading}
              multiple
              onChange={handleAddFiles}
              type="file"
            />
            <ImageUp size={28} />
            <p>Chưa có ảnh</p>
            <strong>{isUploading ? "Đang thêm ảnh..." : "Click để chọn nhiều ảnh"}</strong>
          </label>
        )}

        <label className="admin-upload-button add-product-image">
          <input
            accept="image/*"
            disabled={isUploading}
            multiple
            onChange={handleAddFiles}
            type="file"
          />
          <Plus size={16} />
          {isUploading ? "Đang thêm ảnh..." : "Chọn nhiều ảnh"}
        </label>
        <div className="admin-modal-actions">
          <button className="ghost-modal-button" onClick={onClose} type="button">
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

function BackgroundManager({
  images,
  uploadingField,
  onAdd,
  onReplace,
  onRemove
}: {
  images: string[];
  uploadingField: string;
  onAdd: (file: File) => void;
  onReplace: (file: File, index: number, previousUrl: string) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="admin-background-manager">
      <div className="admin-background-list">
        {images.filter(Boolean).map((image, index) => (
          <div className="admin-background-item" key={`${image}-${index}`}>
            <img src={image} alt="" />
            <div>
              <label className="admin-upload-button">
                <input
                  accept="image/*"
                  disabled={uploadingField === `asset-background-${index}`}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) onReplace(file, index, image);
                    event.target.value = "";
                  }}
                  type="file"
                />
                <ImageUp size={16} />
                {uploadingField === `asset-background-${index}` ? "Đang thay..." : "Thay ảnh"}
              </label>
              <button className="delete-button" type="button" onClick={() => onRemove(index)}>
                <Trash2 size={16} /> Xóa
              </button>
            </div>
          </div>
        ))}
      </div>

      <label className="admin-upload-button add-background">
        <input
          accept="image/*"
          disabled={uploadingField === "asset-background-add"}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onAdd(file);
            event.target.value = "";
          }}
          type="file"
        />
        <Plus size={16} />
        {uploadingField === "asset-background-add" ? "Đang thêm..." : "Thêm ảnh nền"}
      </label>
    </div>
  );
}

function updateCategory(
  data: SiteData,
  setData: (data: SiteData) => void,
  id: number,
  patch: Partial<Category>
) {
  setData({
    ...data,
    categories: data.categories.map((item) =>
      item.id === id ? { ...item, ...patch } : item
    )
  });
}

function updateProduct(
  data: SiteData,
  setData: (data: SiteData) => void,
  id: number,
  patch: Partial<Product>
) {
  setData({
    ...data,
    products: data.products.map((item) => (item.id === id ? { ...item, ...patch } : item))
  });
}

function updateProductImages(
  data: SiteData,
  setData: (data: SiteData) => void,
  id: number,
  images: string[]
) {
  const cleanedImages = images.filter((image) => image.trim());

  updateProduct(data, setData, id, {
    image: cleanedImages[0] ?? "",
    images: cleanedImages
  });
}

function getProductImages(product: Product) {
  return [...(product.images ?? []), product.image].filter(
    (image, index, list): image is string =>
      typeof image === "string" && image.trim().length > 0 && list.indexOf(image) === index
  );
}

function updateArticle(
  data: SiteData,
  setData: (data: SiteData) => void,
  id: number,
  patch: Partial<Article>
) {
  setData({
    ...data,
    articles: data.articles.map((item) => (item.id === id ? { ...item, ...patch } : item))
  });
}

function sortAdminCategories(categories: Category[]) {
  return [...categories].sort(
    (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0) || a.id - b.id
  );
}

function countPendingUploads(pendingUploads: Record<number, PendingProductUpload[]>) {
  return Object.values(pendingUploads).reduce((total, uploads) => total + uploads.length, 0);
}

function getCategoryProductCode(categoryName: string) {
  const normalized = removeVietnameseTone(categoryName).toLowerCase();
  const codeMap: Array<[string, string]> = [
    ["gio trai cay", "TC"],
    ["hoa chia buon", "HCB"],
    ["hoa khai truong", "KT"],
    ["hoa tuoi bo", "BH"],
    ["bo hoa", "BH"],
    ["hoa kim tuyen", "HKT"],
    ["hoa sap", "HS"]
  ];
  const mappedCode = codeMap.find(([name]) => normalized.includes(name))?.[1];
  if (mappedCode) return mappedCode;

  const initials = removeVietnameseTone(categoryName)
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return initials || "SP";
}

function removeVietnameseTone(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .trim();
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
