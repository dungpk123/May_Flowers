"use client";

import { AlertCircle, CheckCircle2, ImageUp, Info, Plus, Save, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { Article, Category, Product, SiteData } from "@shop-flower/data";
import SitePage from "../../ui/SitePage";
import { publicApiUrl } from "../../apiConfig";

const apiUrl = publicApiUrl;
const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "admin123";

type ContentKey = keyof SiteData["content"];

type AdminModal = {
  title: string;
  message: string;
  inputLabel?: string;
  initialValue?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: (value: string) => void;
};

type AdminToast = {
  message: string;
  tone: "success" | "error" | "info";
};

const homeFields: Array<{ key: ContentKey; label: string; multiline?: boolean }> = [
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
  const [toast, setToast] = useState<AdminToast | null>(null);
  const [password, setPassword] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [uploadingField, setUploadingField] = useState("");
  const [activeSection, setActiveSection] = useState<"overview" | "categories" | "products" | "blog">("overview");
  const [modal, setModal] = useState<AdminModal | null>(null);

  useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(() => setToast(null), 3400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function showToast(message: string, tone: AdminToast["tone"] = "info") {
    setToast({ message, tone });
  }

  function updateContent(key: ContentKey, value: string) {
    setData({
      ...data,
      content: { ...data.content, [key]: value }
    });
  }

  function unlock(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password === adminPassword) {
      setIsUnlocked(true);
      setToast(null);
      return;
    }

    showToast("Mật khẩu không đúng.", "error");
  }

  async function save() {
    showToast("Đang lưu thay đổi...", "info");
    const response = await fetch(`${apiUrl}/site-data`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      showToast("Chưa lưu được. Kiểm tra server rồi thử lại.", "error");
      return;
    }

    setData(await response.json());
    showToast("Đã lưu thay đổi.", "success");
  }

  async function uploadImage(
    file: File,
    previousUrl: string,
    onUploaded: (url: string) => void,
    fieldId: string
  ) {
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

      const result = await response.json();
      if (!response.ok || !result.url) {
        showToast(result.message || result.error || "Chưa thay được ảnh.", "error");
        return;
      }

      onUploaded(result.url);
      showToast("Đã thay ảnh. Bấm Lưu để cập nhật website.", "success");
    } catch {
      showToast("Chưa thay được ảnh. Kiểm tra server rồi thử lại.", "error");
    } finally {
      setUploadingField("");
    }
  }

  function addCategory() {
    setModal({
      title: "Thêm danh mục",
      message: "Nhập tên danh mục mới.",
      inputLabel: "Tên danh mục",
      confirmText: "Thêm danh mục",
      onConfirm: (value) => {
        const name = value.trim();
        if (!name) return;

        setData({
          ...data,
          categories: [...data.categories, { id: Date.now(), name, image: "" }]
        });
        showToast(`Đã thêm danh mục "${name}". Bấm Lưu để cập nhật website.`, "success");
      }
    });
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
    setModal({
      title: "Thêm sản phẩm",
      message: "Nhập tên sản phẩm mới.",
      inputLabel: "Tên sản phẩm",
      confirmText: "Thêm sản phẩm",
      onConfirm: (value) => {
        const name = value.trim();
        if (!name) return;

        setData({
          ...data,
          products: [
            ...data.products,
            {
              id: Date.now(),
              name,
              category: data.categories[0]?.name ?? "",
              image: "",
              price: undefined
            }
          ]
        });
        showToast(`Đã thêm sản phẩm "${name}". Bấm Lưu để cập nhật website.`, "success");
      }
    });
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
          <button type="button" onClick={save}>
            <Save size={18} /> Lưu
          </button>
        </header>

        <nav className="admin-tabs" aria-label="Mục quản trị">
          <button className={activeSection === "overview" ? "active" : ""} onClick={() => setActiveSection("overview")} type="button">
            Tổng quan
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
                images={data.assets.backgroundImages?.length ? data.assets.backgroundImages : [data.assets.background]}
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
            {data.categories.map((item, index) => (
              <article className="admin-row-card" key={item.id}>
                <strong>{index + 1}</strong>
                <Field
                  label="Tên danh mục"
                  value={item.name}
                  onChange={(value) => updateCategory(data, setData, item.id, { name: value })}
                />
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
          {data.products.length === 0 ? <p className="admin-empty">Chưa có sản phẩm.</p> : null}
          <div className="admin-list">
            {data.products.map((item, index) => (
              <article className="admin-product-editor" key={item.id}>
                <div className="admin-product-number">{index + 1}</div>
                <ImageField
                  label="Ảnh"
                  value={item.image}
                  uploading={uploadingField === `product-${item.id}`}
                  compact
                  onUpload={(file) =>
                    uploadImage(
                      file,
                      item.image,
                      (value) => updateProduct(data, setData, item.id, { image: value }),
                      `product-${item.id}`
                    )
                  }
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
                      options={data.categories.map((category) => category.name).filter(Boolean)}
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
            ))}
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
    modal.onConfirm(value);
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
