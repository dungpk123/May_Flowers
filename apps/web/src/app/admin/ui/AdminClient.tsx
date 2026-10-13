"use client";

import { Plus, Save, Trash2 } from "lucide-react";
import { useState } from "react";
import type { Article, Category, Product, SiteData } from "@shop-flower/data";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "admin123";

export default function AdminClient({ initialData }: { initialData: SiteData }) {
  const [data, setData] = useState<SiteData>(initialData);
  const [status, setStatus] = useState("");
  const [password, setPassword] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [uploadingField, setUploadingField] = useState("");

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
    setStatus("Đã lưu. Quay lại trang chủ để xem thay đổi.");
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
      setStatus("Đã upload ảnh. Nhớ bấm Lưu thay đổi để ghi vào database.");
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
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoFocus
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
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <p>Quản trị website</p>
          <h1>Chỉnh sửa dữ liệu trang</h1>
        </div>
        <div className="admin-actions">
          <a href="/">Xem website</a>
          <button type="button" onClick={save}>
            <Save size={18} /> Lưu thay đổi
          </button>
        </div>
      </header>

      {status ? <p className="admin-status">{status}</p> : null}

      <section className="admin-panel">
        <h2>Logo, background, icon</h2>
        <div className="admin-grid">
          <Field
            label="Logo"
            value={data.assets.logo}
            onChange={(value) => setData({ ...data, assets: { ...data.assets, logo: value } })}
            uploadId="asset-logo"
            uploading={uploadingField === "asset-logo"}
            onUpload={(file) =>
              uploadImage(
                file,
                (value) => setData({ ...data, assets: { ...data.assets, logo: value } }),
                "asset-logo"
              )
            }
          />
          <Field
            label="Background"
            value={data.assets.background}
            onChange={(value) =>
              setData({ ...data, assets: { ...data.assets, background: value } })
            }
            uploadId="asset-background"
            uploading={uploadingField === "asset-background"}
            onUpload={(file) =>
              uploadImage(
                file,
                (value) => setData({ ...data, assets: { ...data.assets, background: value } }),
                "asset-background"
              )
            }
          />
          <Field
            label="Icon Zalo"
            value={data.assets.zaloIcon}
            onChange={(value) =>
              setData({ ...data, assets: { ...data.assets, zaloIcon: value } })
            }
          />
          <Field
            label="Icon Facebook"
            value={data.assets.facebookIcon}
            onChange={(value) =>
              setData({ ...data, assets: { ...data.assets, facebookIcon: value } })
            }
          />
          <Field
            label="Icon điện thoại"
            value={data.assets.phoneIcon}
            onChange={(value) =>
              setData({ ...data, assets: { ...data.assets, phoneIcon: value } })
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
              multiline={key.toLowerCase().includes("content") || key.toLowerCase().includes("description")}
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
            <Field
              label="Ảnh"
              value={item.image}
              onChange={(value) => updateCategory(data, setData, item.id, { image: value })}
              uploadId={`category-${item.id}`}
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
        title="Sản phẩm / hàng"
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
            <Field
              label="Ảnh"
              value={item.image}
              onChange={(value) => updateProduct(data, setData, item.id, { image: value })}
              uploadId={`product-${item.id}`}
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
            <Field
              label="Ảnh"
              value={item.image}
              onChange={(value) => updateArticle(data, setData, item.id, { image: value })}
              uploadId={`article-${item.id}`}
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
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  multiline = false,
  uploadId,
  uploading = false,
  onUpload
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  uploadId?: string;
  uploading?: boolean;
  onUpload?: (file: File) => void;
}) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      {multiline ? (
        <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={4} />
      ) : (
        <input value={value} onChange={(event) => onChange(event.target.value)} />
      )}
      {uploadId && onUpload ? (
        <span className="admin-upload-row">
          <input
            accept="image/*"
            disabled={uploading}
            id={uploadId}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onUpload(file);
              event.target.value = "";
            }}
            type="file"
          />
          <span>{uploading ? "Đang tải ảnh..." : "Tải ảnh lên Cloudinary"}</span>
        </span>
      ) : null}
    </label>
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
