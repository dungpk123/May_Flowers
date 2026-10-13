"use client";

import { ImageUp, Plus, Save, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import type { Article, Category, Product, SiteData } from "@shop-flower/data";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "admin123";

export default function AdminClient({ initialData }: { initialData: SiteData }) {
  const [data, setData] = useState<SiteData>(initialData);
  const [status, setStatus] = useState("");
  const [password, setPassword] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [uploadingField, setUploadingField] = useState("");

  const featuredProducts = useMemo(() => data.products.slice(0, 4), [data.products]);

  function unlock(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password === adminPassword) {
      setIsUnlocked(true);
      setStatus("");
      return;
    }

    setStatus("Mật khẩu không đúng.");
  }

  async function save() {
    setStatus("Đang lưu...");
    const response = await fetch(`${apiUrl}/site-data`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      setStatus("Lưu thất bại. Kiểm tra API NestJS.");
      return;
    }

    setData(await response.json());
    setStatus("Đã lưu dữ liệu vào TiDB.");
  }

  async function uploadImage(file: File, onUploaded: (url: string) => void, fieldId: string) {
    setUploadingField(fieldId);
    setStatus("Đang tải ảnh lên Cloudinary...");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${apiUrl}/uploads/image`, {
        method: "POST",
        body: formData
      });

      const result = await response.json();
      if (!response.ok || !result.url) {
        setStatus(result.message || result.error || "Upload ảnh thất bại.");
        return;
      }

      onUploaded(result.url);
      setStatus("Đã upload ảnh. Bấm Lưu thay đổi để ghi vào TiDB.");
    } catch {
      setStatus("Upload ảnh thất bại. Kiểm tra API NestJS và Cloudinary.");
    } finally {
      setUploadingField("");
    }
  }

  if (!isUnlocked) {
    return (
      <main className="admin-login-page">
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
          {status ? <p className="admin-status">{status}</p> : null}
          <button type="submit">
            <Save size={18} /> Vào trang quản trị
          </button>
          <a href="/">Quay lại website</a>
        </form>
      </main>
    );
  }

  return (
    <main className="admin-workspace">
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

        {status ? <p className="admin-status">{status}</p> : null}

        <section className="admin-panel">
          <h2>Hình ảnh thương hiệu</h2>
          <div className="admin-image-grid">
            <ImageField
              label="Logo"
              value={data.assets.logo}
              uploading={uploadingField === "asset-logo"}
              onUpload={(file) =>
                uploadImage(
                  file,
                  (value) => setData({ ...data, assets: { ...data.assets, logo: value } }),
                  "asset-logo"
                )
              }
            />
            <ImageField
              label="Background"
              value={data.assets.background}
              uploading={uploadingField === "asset-background"}
              onUpload={(file) =>
                uploadImage(
                  file,
                  (value) =>
                    setData({ ...data, assets: { ...data.assets, background: value } }),
                  "asset-background"
                )
              }
            />
            <ImageField
              label="Icon Zalo"
              value={data.assets.zaloIcon}
              uploading={uploadingField === "asset-zalo"}
              compact
              onUpload={(file) =>
                uploadImage(
                  file,
                  (value) => setData({ ...data, assets: { ...data.assets, zaloIcon: value } }),
                  "asset-zalo"
                )
              }
            />
            <ImageField
              label="Icon Facebook"
              value={data.assets.facebookIcon}
              uploading={uploadingField === "asset-facebook"}
              compact
              onUpload={(file) =>
                uploadImage(
                  file,
                  (value) =>
                    setData({ ...data, assets: { ...data.assets, facebookIcon: value } }),
                  "asset-facebook"
                )
              }
            />
            <ImageField
              label="Icon điện thoại"
              value={data.assets.phoneIcon}
              uploading={uploadingField === "asset-phone"}
              compact
              onUpload={(file) =>
                uploadImage(
                  file,
                  (value) => setData({ ...data, assets: { ...data.assets, phoneIcon: value } }),
                  "asset-phone"
                )
              }
            />
          </div>
        </section>

        <section className="admin-panel">
          <h2>Nội dung chính</h2>
          <div className="admin-grid">
            {Object.entries(data.content).map(([key, value]) => (
              <Field
                key={key}
                label={labelForContent(key)}
                value={value}
                multiline={
                  key.toLowerCase().includes("content") ||
                  key.toLowerCase().includes("description")
                }
                onChange={(nextValue) =>
                  setData({
                    ...data,
                    content: { ...data.content, [key]: nextValue }
                  })
                }
              />
            ))}
          </div>
        </section>

        <CollectionPanel
          title="Danh mục"
          items={data.categories}
          addLabel="Thêm danh mục"
          onAdd={() =>
            setData({
              ...data,
              categories: [...data.categories, { id: Date.now(), name: "", image: "" }]
            })
          }
          onRemove={(id) =>
            setData({ ...data, categories: data.categories.filter((item) => item.id !== id) })
          }
          render={(item) => (
            <>
              <Field
                label="Tên danh mục"
                value={item.name}
                onChange={(value) => updateCategory(data, setData, item.id, { name: value })}
              />
              <ImageField
                label="Ảnh danh mục"
                value={item.image}
                uploading={uploadingField === `category-${item.id}`}
                onUpload={(file) =>
                  uploadImage(
                    file,
                    (value) => updateCategory(data, setData, item.id, { image: value }),
                    `category-${item.id}`
                  )
                }
              />
            </>
          )}
        />

        <CollectionPanel
          title="Sản phẩm"
          items={data.products}
          addLabel="Thêm sản phẩm"
          onAdd={() =>
            setData({
              ...data,
              products: [
                ...data.products,
                { id: Date.now(), name: "", category: "", image: "", price: undefined }
              ]
            })
          }
          onRemove={(id) =>
            setData({ ...data, products: data.products.filter((item) => item.id !== id) })
          }
          render={(item) => (
            <>
              <Field
                label="Tên sản phẩm"
                value={item.name}
                onChange={(value) => updateProduct(data, setData, item.id, { name: value })}
              />
              <Field
                label="Danh mục"
                value={item.category}
                onChange={(value) => updateProduct(data, setData, item.id, { category: value })}
              />
              <Field
                label="Giá"
                value={item.price ? String(item.price) : ""}
                onChange={(value) =>
                  updateProduct(data, setData, item.id, {
                    price: value ? Number(value) : undefined
                  })
                }
              />
              <ImageField
                label="Ảnh sản phẩm"
                value={item.image}
                uploading={uploadingField === `product-${item.id}`}
                onUpload={(file) =>
                  uploadImage(
                    file,
                    (value) => updateProduct(data, setData, item.id, { image: value }),
                    `product-${item.id}`
                  )
                }
              />
              <Field
                label="Nhãn"
                value={item.badge ?? ""}
                onChange={(value) => updateProduct(data, setData, item.id, { badge: value })}
              />
              <Field
                label="Mô tả"
                value={item.description ?? ""}
                multiline
                onChange={(value) =>
                  updateProduct(data, setData, item.id, { description: value })
                }
              />
            </>
          )}
        />

        <CollectionPanel
          title="Blog"
          items={data.articles}
          addLabel="Thêm bài viết"
          onAdd={() =>
            setData({
              ...data,
              articles: [
                ...data.articles,
                { id: Date.now(), title: "", image: "", excerpt: "", content: "" }
              ]
            })
          }
          onRemove={(id) =>
            setData({ ...data, articles: data.articles.filter((item) => item.id !== id) })
          }
          render={(item) => (
            <>
              <Field
                label="Tiêu đề"
                value={item.title}
                onChange={(value) => updateArticle(data, setData, item.id, { title: value })}
              />
              <ImageField
                label="Ảnh bài viết"
                value={item.image}
                uploading={uploadingField === `article-${item.id}`}
                onUpload={(file) =>
                  uploadImage(
                    file,
                    (value) => updateArticle(data, setData, item.id, { image: value }),
                    `article-${item.id}`
                  )
                }
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
            </>
          )}
        />
      </aside>

      <section className="admin-preview-pane">
        <header className="admin-preview-header">
          <div>
            <p>Preview</p>
            <h2>{data.content.brandName || "Website hoa"}</h2>
          </div>
          <a href="/" target="_blank">
            Xem website
          </a>
        </header>

        <div className="admin-preview-card">
          <div className="preview-topbar">
            {data.assets.logo ? <img src={data.assets.logo} alt="" /> : <span>Logo</span>}
            <div />
          </div>
          <div
            className="preview-hero"
            style={{
              backgroundImage: data.assets.background
                ? `linear-gradient(90deg, rgba(35,74,44,.86), rgba(73,137,73,.35)), url(${data.assets.background})`
                : undefined
            }}
          >
            <p>{data.content.tagline || "Dòng mô tả ngắn"}</p>
            <h3>{data.content.heroTitle || data.content.brandName || "Tên thương hiệu"}</h3>
            <strong>{data.content.heroSubtitle || "Phụ đề hero"}</strong>
          </div>
          <div className="preview-products">
            <div className="preview-section-title">Sản phẩm</div>
            {featuredProducts.length > 0 ? (
              <div className="preview-product-grid">
                {featuredProducts.map((product) => (
                  <article key={product.id}>
                    {product.image ? <img src={product.image} alt="" /> : <div />}
                    <h4>{product.name || "Tên sản phẩm"}</h4>
                    <p>{product.price ? `${product.price.toLocaleString("vi-VN")} đ` : "Liên hệ"}</p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="preview-empty">Chưa có sản phẩm. Thêm sản phẩm ở cột quản trị.</p>
            )}
          </div>
        </div>
      </section>
    </main>
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
        <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={4} />
      ) : (
        <input value={value} onChange={(event) => onChange(event.target.value)} />
      )}
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
        {uploading ? "Đang tải..." : "Chọn ảnh"}
      </label>
    </div>
  );
}

function CollectionPanel<T extends { id: number }>({
  title,
  items,
  addLabel,
  onAdd,
  onRemove,
  render
}: {
  title: string;
  items: T[];
  addLabel: string;
  onAdd: () => void;
  onRemove: (id: number) => void;
  render: (item: T) => React.ReactNode;
}) {
  return (
    <section className="admin-panel">
      <div className="admin-panel-title">
        <h2>{title}</h2>
        <button type="button" onClick={onAdd}>
          <Plus size={17} /> {addLabel}
        </button>
      </div>
      {items.length === 0 ? <p className="admin-empty">Chưa có dữ liệu.</p> : null}
      <div className="admin-list">
        {items.map((item) => (
          <article className="admin-item" key={item.id}>
            <div className="admin-grid">{render(item)}</div>
            <button className="delete-button" type="button" onClick={() => onRemove(item.id)}>
              <Trash2 size={17} /> Xóa
            </button>
          </article>
        ))}
      </div>
    </section>
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

function labelForContent(key: string) {
  const labels: Record<string, string> = {
    brandName: "Tên thương hiệu",
    tagline: "Dòng mô tả ngắn",
    hotline: "Số điện thoại",
    zaloUrl: "Link Zalo",
    facebookUrl: "Link Facebook",
    address: "Địa chỉ",
    email: "Email",
    heroTitle: "Tiêu đề hero",
    heroSubtitle: "Phụ đề hero",
    heroDescription: "Mô tả hero",
    ctaEyebrow: "CTA nhãn nhỏ",
    ctaTitle: "CTA tiêu đề",
    ctaDescription: "CTA mô tả",
    footerTitle: "Tiêu đề footer",
    footerDescription: "Mô tả footer",
    aboutTitle: "Tiêu đề giới thiệu",
    aboutContent: "Nội dung giới thiệu",
    contactTitle: "Tiêu đề liên hệ",
    contactContent: "Nội dung liên hệ"
  };

  return labels[key] ?? key;
}
