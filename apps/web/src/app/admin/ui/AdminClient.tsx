"use client";

import { ImageUp, Plus, Save, Trash2 } from "lucide-react";
import { useState } from "react";
import type { Article, Category, Product, SiteData } from "@shop-flower/data";
import SitePage from "../../ui/SitePage";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "admin123";

type ContentKey = keyof SiteData["content"];

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

const otherFields: Array<{ key: ContentKey; label: string; multiline?: boolean }> = [
  { key: "aboutTitle", label: "Tiêu đề giới thiệu" },
  { key: "aboutContent", label: "Nội dung giới thiệu", multiline: true },
  { key: "contactTitle", label: "Tiêu đề liên hệ" },
  { key: "contactContent", label: "Nội dung liên hệ", multiline: true },
  { key: "footerTitle", label: "Tiêu đề footer" },
  { key: "footerDescription", label: "Mô tả footer", multiline: true }
];

export default function AdminClient({ initialData }: { initialData: SiteData }) {
  const [data, setData] = useState<SiteData>(initialData);
  const [status, setStatus] = useState("");
  const [password, setPassword] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [uploadingField, setUploadingField] = useState("");

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
      setStatus("");
      return;
    }

    setStatus("Mật khẩu không đúng.");
  }

  async function save() {
    setStatus("Đang lưu thay đổi...");
    const response = await fetch(`${apiUrl}/site-data`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      setStatus("Chưa lưu được. Kiểm tra server rồi thử lại.");
      return;
    }

    setData(await response.json());
    setStatus("Đã lưu thay đổi.");
  }

  async function uploadImage(
    file: File,
    previousUrl: string,
    onUploaded: (url: string) => void,
    fieldId: string
  ) {
    setUploadingField(fieldId);
    setStatus(previousUrl ? "Đang xóa ảnh cũ và thay ảnh mới..." : "Đang tải ảnh...");

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
        setStatus(result.message || result.error || "Chưa thay được ảnh.");
        return;
      }

      onUploaded(result.url);
      setStatus("Đã thay ảnh. Bấm Lưu để cập nhật website.");
    } catch {
      setStatus("Chưa thay được ảnh. Kiểm tra server rồi thử lại.");
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
          <div className="admin-grid compact">
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
          <div className="admin-panel-title">
            <div className="admin-panel-heading">
              <h2>Danh mục sản phẩm</h2>
              <p>Tạo nhóm như bó hoa, giỏ trái cây, hoa khai trương.</p>
            </div>
            <button
              type="button"
              onClick={() =>
                setData({
                  ...data,
                  categories: [...data.categories, { id: Date.now(), name: "", image: "" }]
                })
              }
            >
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
                  onClick={() =>
                    setData({
                      ...data,
                      categories: data.categories.filter((category) => category.id !== item.id)
                    })
                  }
                  title="Xóa danh mục"
                >
                  <Trash2 size={17} />
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="admin-panel">
          <div className="admin-panel-title">
            <div className="admin-panel-heading">
              <h2>Sản phẩm</h2>
              <p>Thêm tên, giá, danh mục và ảnh sản phẩm.</p>
            </div>
            <button
              type="button"
              onClick={() =>
                setData({
                  ...data,
                  products: [
                    ...data.products,
                    { id: Date.now(), name: "", category: "", image: "", price: undefined }
                  ]
                })
              }
            >
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
                      label="Nhãn"
                      value={item.badge ?? ""}
                      onChange={(value) => updateProduct(data, setData, item.id, { badge: value })}
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
                  onClick={() =>
                    setData({
                      ...data,
                      products: data.products.filter((product) => product.id !== item.id)
                    })
                  }
                  title="Xóa sản phẩm"
                >
                  <Trash2 size={17} />
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="admin-panel">
          <div className="admin-panel-title">
            <div className="admin-panel-heading">
              <h2>Blog</h2>
              <p>Bài viết sẽ hiển thị ở trang blog.</p>
            </div>
            <button
              type="button"
              onClick={() =>
                setData({
                  ...data,
                  articles: [
                    ...data.articles,
                    { id: Date.now(), title: "", image: "", excerpt: "", content: "" }
                  ]
                })
              }
            >
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
                  onClick={() =>
                    setData({
                      ...data,
                      articles: data.articles.filter((article) => article.id !== item.id)
                    })
                  }
                  title="Xóa bài viết"
                >
                  <Trash2 size={17} />
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="admin-panel">
          <div className="admin-panel-heading">
            <h2>Trang phụ</h2>
            <p>Nội dung giới thiệu, liên hệ và footer.</p>
          </div>
          <div className="admin-grid compact">
            {otherFields.map((field) => (
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
      </aside>

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
