"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboardLayout";
import TrueSourceAPI from "@/lib/trueSourceApi";
import { motion, AnimatePresence } from "framer-motion";

// ---------- Types ----------
type ProductAsset = {
  id: string | number;
  url: string;
  view?: string; // e.g. DEFAULT, NFT
  type?: string; // image, video...
};

type ProductAttr = {
  id: string | number;
  name: string;
  value: string;
  type?: string; // string, number...
};

type ProductForm = {
  title: string;
  brand: string;
  category: string;
  sub_category: string;
  description: string;
  plain_description: string;
  price: string; // keep as string for input, convert on submit
  product_assets: ProductAsset[];
  product_attrs: ProductAttr[];
};

// ---------- Helpers ----------
const uid = (prefix = "id") =>
  `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

// Simple small form input component to reduce duplication
function Field({
  label,
  children,
  optional = false,
}: {
  label: string;
  children: any;
  optional?: boolean;
}) {
  return (
    <label className="block">
      <div className="text-sm font-medium text-gray-700 flex items-center justify-between">
        <span>{label}</span>
        {optional && <span className="text-xs text-gray-400">optional</span>}
      </div>
      <div className="mt-1">{children}</div>
    </label>
  );
}

// ---------- Main Component ----------
export default function CreateProductPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [step, setStep] = useState<number>(0);
  const [loadingUser, setLoadingUser] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState<ProductForm>({
    title: "",
    brand: "",
    category: "",
    sub_category: "",
    description: "",
    plain_description: "",
    price: "",
    product_assets: [
      { id: uid("asset"), url: "", view: "DEFAULT", type: "image" },
    ],
    product_attrs: [
      { id: uid("attr"), name: "Size", value: "", type: "string" },
    ],
  });

  // carousel state used in review step
  const [carouselIndex, setCarouselIndex] = useState(0);
  const carouselRef = useRef<number | null>(null);

  useEffect(() => {
    // load current user
    (async () => {
      try {
        const ud = await TrueSourceAPI.getCurrentUser();
        if (ud?.success) setUser(ud.result);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingUser(false);
      }
    })();
  }, []);

  // Carousel autoplay when on review step
  useEffect(() => {
    if (step !== 3) return;
    if (!form.product_assets?.length) return;
    clearInterval(carouselRef.current ?? undefined);
    carouselRef.current = window.setInterval(() => {
      setCarouselIndex((s) =>
        form.product_assets.length ? (s + 1) % form.product_assets.length : 0
      );
    }, 3000);
    return () => clearInterval(carouselRef.current ?? undefined);
  }, [step, form.product_assets]);

  // ---------- form helpers ----------
  const updateField = (key: keyof ProductForm, value: any) => {
    setForm((p) => ({ ...p, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  };

  const addAsset = () => {
    setForm((p) => ({
      ...p,
      product_assets: [
        ...p.product_assets,
        { id: uid("asset"), url: "", view: "DEFAULT", type: "image" },
      ],
    }));
  };
  const removeAsset = (id: string | number) => {
    setForm((p) => ({
      ...p,
      product_assets: p.product_assets.filter((a) => a.id !== id),
    }));
  };
  const updateAsset = (
    id: string | number,
    key: keyof ProductAsset,
    value: any
  ) => {
    setForm((p) => ({
      ...p,
      product_assets: p.product_assets.map((a) =>
        a.id === id ? { ...a, [key]: value } : a
      ),
    }));
  };

  const addAttr = () => {
    setForm((p) => ({
      ...p,
      product_attrs: [
        ...p.product_attrs,
        { id: uid("attr"), name: "", value: "", type: "string" },
      ],
    }));
  };
  const removeAttr = (id: string | number) => {
    setForm((p) => ({
      ...p,
      product_attrs: p.product_attrs.filter((a) => a.id !== id),
    }));
  };
  const updateAttr = (
    id: string | number,
    key: keyof ProductAttr,
    value: any
  ) => {
    setForm((p) => ({
      ...p,
      product_attrs: p.product_attrs.map((a) =>
        a.id === id ? { ...a, [key]: value } : a
      ),
    }));
  };

  // ---------- validation ----------
  const validateStep = (s: number) => {
    const newErrors: Record<string, string> = {};
    if (s === 0) {
      if (!form.title.trim()) newErrors.title = "Title is required";
      if (!form.brand.trim()) newErrors.brand = "Brand is required";
      if (!form.category.trim()) newErrors.category = "Category is required";
      if (!form.price.trim() || isNaN(Number(form.price)))
        newErrors.price = "Valid price is required";
    }
    if (s === 1) {
      if (!form.product_assets.length)
        newErrors.product_assets = "At least one asset is required";
      form.product_assets.forEach((a, idx) => {
        if (!a.url || !a.url.trim()) {
          newErrors[`asset_${idx}`] = "Image URL is required";
        }
      });
    }
    if (s === 2) {
      // require at least one attribute name
      if (!form.product_attrs.length)
        newErrors.product_attrs = "At least one attribute is required";
      form.product_attrs.forEach((attr, idx) => {
        if (!attr.name.trim()) newErrors[`attr_name_${idx}`] = "Name required";
        if (!attr.value.toString().trim())
          newErrors[`attr_value_${idx}`] = "Value required";
      });
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const next = () => {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(3, s + 1));
  };
  const prev = () => setStep((s) => Math.max(0, s - 1));

  const buildPayload = (form: any) => {
    const payload: any = {};

    if (form.title?.trim()) payload.title = form.title.trim();
    if (form.brand?.trim()) payload.brand = form.brand.trim();
    if (form.category?.trim()) payload.category = form.category.trim();
    if (form.sub_category?.trim())
      payload.sub_category = form.sub_category.trim();
    if (form.description?.trim()) {
      payload.description = form.description.trim();
      payload.plain_description = form.description.trim();
    }
    if (form.price && !isNaN(parseFloat(form.price))) {
      payload.price = Number(parseFloat(form.price));
    }

    if (Array.isArray(form.product_assets) && form.product_assets.length > 0) {
      payload.product_assets = form.product_assets
        .filter((a: any) => a.url?.trim())
        .map((a: any) => ({
          url: a.url.trim(),
          ...(a.view ? { view: a.view } : { view: "DEFAULT" }),
          ...(a.type ? { type: a.type } : { type: "image" }),
        }));
    }

    if (Array.isArray(form.product_attrs) && form.product_attrs.length > 0) {
      payload.product_attrs = form.product_attrs
        .filter((a: any) => a.name?.trim() && a.value?.trim())
        .map((a: any) => ({
          name: a.name.trim(),
          value: a.value.trim(),
          type: a.type || "string",
        }));
    }

    return payload;
  };

  // ---------- submit ----------
  const handleSubmit = async () => {
    if (!validateStep(0) || !validateStep(1) || !validateStep(2)) {
      setStep(0);
      return;
    }

    setSubmitting(true);
    try {
      const payload = buildPayload(form);

      const res = await TrueSourceAPI.createProduct(payload);

      console.log("res iss", res);
      if (res?.success) {
        // redirect to product page
        const newId = res.result?.id ?? res.result;
        router.push(`/products/${newId}`);
      } else {
        alert("Could not create product. " + (res?.message || ""));
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong while creating product.");
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- UI ----------
  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Product</h1>
          <p className="text-gray-600 mt-1">
            Add a new product in a few easy steps.
          </p>
        </div>

        {/* Stepper */}
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-4">
            {[
              { label: "Basic", desc: "Title, brand, price" },
              { label: "Media", desc: "Assets / Images" },
              { label: "Attributes", desc: "Size, Color, etc" },
              { label: "Review", desc: "Preview & submit" },
            ].map((s, i) => (
              <div key={i} className="flex-1">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-medium ${
                      i === step
                        ? "bg-emerald-600 text-white"
                        : i < step
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {i + 1}
                  </div>
                  <div>
                    <div
                      className={`text-sm font-semibold ${
                        i === step ? "text-gray-900" : "text-gray-600"
                      }`}
                    >
                      {s.label}
                    </div>
                    <div className="text-xs text-gray-400">{s.desc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="step-0"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.25 }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Title">
                    <input
                      className={`w-full rounded-md border p-2 ${
                        errors.title ? "border-red-400" : "border-gray-200"
                      }`}
                      value={form.title}
                      onChange={(e) => updateField("title", e.target.value)}
                      placeholder="e.g. Origins Hackathon Hoodie"
                    />
                    {errors.title && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.title}
                      </p>
                    )}
                  </Field>

                  <Field label="Brand">
                    <input
                      className={`w-full rounded-md border p-2 ${
                        errors.brand ? "border-red-400" : "border-gray-200"
                      }`}
                      value={form.brand}
                      onChange={(e) => updateField("brand", e.target.value)}
                      placeholder="e.g. Token 2049"
                    />
                    {errors.brand && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.brand}
                      </p>
                    )}
                  </Field>

                  <Field label="Category">
                    <input
                      className={`w-full rounded-md border p-2 ${
                        errors.category ? "border-red-400" : "border-gray-200"
                      }`}
                      value={form.category}
                      onChange={(e) => updateField("category", e.target.value)}
                      placeholder="Apparel"
                    />
                    {errors.category && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.category}
                      </p>
                    )}
                  </Field>

                  <Field label="Sub category (optional)" optional>
                    <input
                      className="w-full rounded-md border p-2 border-gray-200"
                      value={form.sub_category}
                      onChange={(e) =>
                        updateField("sub_category", e.target.value)
                      }
                      placeholder="Hoodie"
                    />
                  </Field>

                  <div className="md:col-span-2">
                    <Field label="Price">
                      <input
                        className={`w-48 rounded-md border p-2 ${
                          errors.price ? "border-red-400" : "border-gray-200"
                        }`}
                        value={form.price}
                        onChange={(e) => updateField("price", e.target.value)}
                        placeholder="20.00"
                      />
                      {errors.price && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.price}
                        </p>
                      )}
                    </Field>
                  </div>

                  <div className="md:col-span-2">
                    <Field label="Description">
                      <textarea
                        rows={4}
                        className="w-full rounded-md border p-2 border-gray-200"
                        value={form.description}
                        onChange={(e) =>
                          updateField("description", e.target.value)
                        }
                        placeholder="Full description shown to customers"
                      />
                    </Field>
                  </div>

                  <div className="md:col-span-2">
                    <Field label="Plain Description (for metadata / short)">
                      <input
                        className="w-full rounded-md border p-2 border-gray-200"
                        value={form.plain_description}
                        onChange={(e) =>
                          updateField("plain_description", e.target.value)
                        }
                        placeholder="Short description"
                      />
                    </Field>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.25 }}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">Assets</h3>
                      <p className="text-sm text-gray-500">
                        Add image URLs (we show previews). You can add multiple.
                      </p>
                    </div>
                    <div>
                      <button
                        onClick={addAsset}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-emerald-600 text-white text-sm"
                      >
                        + Add Asset
                      </button>
                    </div>
                  </div>

                  {errors.product_assets && (
                    <p className="text-xs text-red-500">
                      {errors.product_assets}
                    </p>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {form.product_assets.map((asset, idx) => (
                      <div key={asset.id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium text-gray-700">
                            Asset #{idx + 1}
                          </div>
                          <div className="flex items-center gap-2">
                            <select
                              value={asset.view}
                              onChange={(e) =>
                                updateAsset(asset.id, "view", e.target.value)
                              }
                              className="rounded-md border p-1 text-sm border-gray-200"
                            >
                              <option>DEFAULT</option>
                              <option>NFT</option>
                              <option>OTHER</option>
                            </select>

                            <button
                              onClick={() => removeAsset(asset.id)}
                              className="text-sm text-red-500"
                            >
                              Remove
                            </button>
                          </div>
                        </div>

                        <div className="mt-3">
                          <input
                            value={asset.url}
                            onChange={(e) =>
                              updateAsset(asset.id, "url", e.target.value)
                            }
                            placeholder="https://...jpg"
                            className={`w-full rounded-md border p-2 ${
                              errors[`asset_${idx}`]
                                ? "border-red-400"
                                : "border-gray-200"
                            }`}
                          />
                          {errors[`asset_${idx}`] && (
                            <p className="text-xs text-red-500 mt-1">
                              {errors[`asset_${idx}`]}
                            </p>
                          )}

                          {asset.url ? (
                            <div className="mt-3 w-full h-40 bg-gray-50 rounded overflow-hidden flex items-center justify-center border">
                              {/* simple preview - using img tag to avoid next/image domain config requirements */}
                              <img
                                src={asset.url}
                                alt={`asset-${idx}`}
                                className="object-contain max-h-full"
                              />
                            </div>
                          ) : (
                            <div className="mt-3 w-full h-40 bg-gray-50 rounded border flex items-center justify-center text-xs text-gray-400">
                              Image preview
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.25 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Attributes</h3>
                    <p className="text-sm text-gray-500">
                      Add any product attributes like Size, Color, Material,
                      etc.
                    </p>
                  </div>
                  <div>
                    <button
                      onClick={addAttr}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-emerald-600 text-white text-sm"
                    >
                      + Add Attribute
                    </button>
                  </div>
                </div>

                {errors.product_attrs && (
                  <p className="text-xs text-red-500">{errors.product_attrs}</p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {form.product_attrs.map((attr, idx) => (
                    <div key={attr.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-gray-700">
                          Attribute #{idx + 1}
                        </div>
                        <button
                          onClick={() => removeAttr(attr.id)}
                          className="text-sm text-red-500"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="mt-3 grid grid-cols-1 gap-2">
                        <input
                          value={attr.name}
                          onChange={(e) =>
                            updateAttr(attr.id, "name", e.target.value)
                          }
                          placeholder="e.g. Size"
                          className={`w-full rounded-md border p-2 ${
                            errors[`attr_name_${idx}`]
                              ? "border-red-400"
                              : "border-gray-200"
                          }`}
                        />
                        {errors[`attr_name_${idx}`] && (
                          <p className="text-xs text-red-500">
                            {errors[`attr_name_${idx}`]}
                          </p>
                        )}

                        <input
                          value={attr.value}
                          onChange={(e) =>
                            updateAttr(attr.id, "value", e.target.value)
                          }
                          placeholder="e.g. XL"
                          className={`w-full rounded-md border p-2 ${
                            errors[`attr_value_${idx}`]
                              ? "border-red-400"
                              : "border-gray-200"
                          }`}
                        />
                        {errors[`attr_value_${idx}`] && (
                          <p className="text-xs text-red-500">
                            {errors[`attr_value_${idx}`]}
                          </p>
                        )}

                        <select
                          value={attr.type}
                          onChange={(e) =>
                            updateAttr(attr.id, "type", e.target.value)
                          }
                          className="rounded-md border p-2 border-gray-200 text-sm"
                        >
                          <option value="string">string</option>
                          <option value="number">number</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.25 }}
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* left: carousel + images */}
                  <div>
                    <div className="w-full h-80 rounded-lg border overflow-hidden flex items-center justify-center bg-gray-50">
                      {form.product_assets.length ? (
                        <img
                          src={
                            form.product_assets[
                              carouselIndex % form.product_assets.length
                            ].url
                          }
                          className="object-contain max-h-full"
                          alt="preview"
                        />
                      ) : (
                        <div className="text-gray-400">No images</div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-3">
                      {form.product_assets.map((a, i) => (
                        <button
                          key={a.id}
                          onClick={() => setCarouselIndex(i)}
                          className={`w-16 h-16 rounded border overflow-hidden ${
                            i === carouselIndex ? "ring-2 ring-emerald-600" : ""
                          }`}
                        >
                          {a.url ? (
                            <img
                              src={a.url}
                              className="object-cover w-full h-full"
                              alt={`thumb-${i}`}
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-100 flex items-center justify-center text-xs text-gray-400">
                              No Image
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* right: summary */}
                  <div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-semibold">
                        {form.title || "Untitled product"}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {form.brand} • {form.category}{" "}
                        {form.sub_category ? `• ${form.sub_category}` : ""}
                      </p>

                      <div className="mt-4">
                        <div className="text-sm text-gray-500">Price</div>
                        <div className="text-2xl font-bold mt-1">
                          ${form.price || "0.00"}
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="text-sm text-gray-500">Description</div>
                        <div className="mt-1 text-gray-700 text-sm">
                          {form.description || "—"}
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="text-sm text-gray-500">Attributes</div>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          {form.product_attrs.map((a) => (
                            <div
                              key={a.id}
                              className="bg-white border rounded p-2 text-sm"
                            >
                              <div className="text-xs text-gray-400">
                                {a.name}
                              </div>
                              <div className="font-medium">{a.value}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-6 text-sm text-gray-500">
                        You can go back to edit any step. Click{" "}
                        <span className="font-medium text-gray-700">
                          Create Product
                        </span>{" "}
                        to save.
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-6">
            <div>
              <button
                onClick={prev}
                disabled={step === 0}
                className="px-4 py-2 rounded-md border border-gray-200 bg-white disabled:opacity-50"
              >
                Back
              </button>
            </div>

            <div className="flex items-center gap-3">
              {step < 3 ? (
                <button
                  onClick={next}
                  className="px-4 py-2 rounded-md bg-emerald-600 text-white"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-4 py-2 rounded-md bg-emerald-600 text-white flex items-center gap-2"
                >
                  {submitting ? (
                    <span className="h-4 w-4 rounded-full border-b-2 border-white animate-spin" />
                  ) : null}
                  Create Product
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
