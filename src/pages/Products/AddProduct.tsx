
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { TiptapEditor } from "@/components/ui/TiptapEditor";
import { ImageUpload } from "@/components/ui/ImageUpload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchsubCategories } from "@/features/subcategories/subcategoriesThunk";
import { fetchBrands } from "@/features/brands/brandsThunk";
import { fetchTypes } from "@/features/types/typesThunk";
import { useBasePath } from "@/hooks/useBasePath";
import { fetchProductLabels } from "@/features/productLabels/productLabelsThunk";
import {
  createProduct,
  duplicateProduct,
  fetchProducts,
  getProductById,
  updateProduct,
} from "@/features/products/productsThunk";

const generateSlug = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[()]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const SECTION_TYPES = [
  "Multi Step Selection",
  "Root Cause Section",
  "How Does It Do It Section",
  "Benefits Section",
  "Treatment Kit Section",
  "Treatment Journey Section",
  "Ingredients Section",
  "use and Others points",
  "Image Banner Section",

  "Why Choose Unity Hair",
  "Before & After",
  "FAQ 1",
  "FAQ 2",
];

const ITEM_LIST_SECTIONS = [
  "Multi Step Selection",
  "Root Cause Section",
  "Benefits Section",
  "Ingredients Section",
  "Treatment Kit Section",
  "Treatment Journey Section",
  "How Does It Do It Section",
  "use and Others points",
];

export default function ProductFormPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const basePath = useBasePath();

  const { categories: subCategories } = useSelector(
    (state: RootState) => state.subcategori,
  );
  const { brands } = useSelector((state: RootState) => state.brands);
  const { types } = useSelector((state: RootState) => state.types);
  const { products } = useSelector((state: RootState) => state.products);
  const { duplicating } = useSelector((state: RootState) => state.products);
  const { labels: productLabels } = useSelector(
    (state: RootState) => state.productLabels,
  );

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState("");
  const [categoryId, setCategoryId] = useState<string[]>([]);
  const [images, setImages] = useState<string>("");
  const [status, setStatus] = useState(true);
  const [variants, setVariants] = useState<any[]>([
    {
      brand_id: "",
      type_id: "",
      price: "",
      stock_quantity: "0",
      sku: "",
      offerprice: "",
      ProductHeight: "",
      ProductWeight: "",
      ProductWidth: "",
      ProductLength: "",
      Manufactured: "",
      CountryOrigin: "",
      Marketed: "",
      barcode: "",
      images: [],
      labels: [],
      status: "active",
      is_featured: false,
      is_best_seller: false,
      is_trending: false,
      description: "",
      steps: "",
    },
  ]);
  const [sections, setSections] = useState<{ type: string; data: any }[]>([]);
  const [showSectionDropdown, setShowSectionDropdown] = useState(false);

  useEffect(() => {
    dispatch(fetchsubCategories({ page: 1, limit: 100, status: "active" }));
    dispatch(fetchProducts({ page: 1, limit: 100, status: "active" }));
    dispatch(fetchBrands({ page: 1, limit: 100, status: "active" }));
    dispatch(fetchTypes({ page: 1, limit: 100, status: "active" }));
    dispatch(fetchProductLabels({ page: 1, limit: 100, status: "active" }));
  }, [dispatch]);

  useEffect(() => {
    if (subCategories.length > 0) {
      const validIds = categoryId.filter((cid) =>
        subCategories.some((c) => c._id === cid),
      );
      setCategoryId(validIds);
    }
  }, [subCategories]);

  useEffect(() => {
    if (isEditMode && id) {
      dispatch(getProductById(id)).then((res: any) => {
        if (res.payload) {
          const p = res.payload.data || res.payload;
          setName(p.name || "");
          setDescription(p.description || "");
          setSteps(p.steps || "");
          const catIds = Array.isArray(p.category_id)
            ? p.category_id.map((cat: any) => cat?._id || cat)
            : [];
          setCategoryId(catIds);
          setImages(p.images || "");
          setStatus(p.status === "active");

          if (Array.isArray(p.variants) && p.variants.length > 0) {
            setVariants(
              p.variants.map((v: any) => ({
                _id: v._id,
                brand_id: v.brand_id?._id || "",
                type_id: v.type_id?._id || "",
                price: v.price || "",
                stock_quantity: v.stock_quantity || "0",
                sku: v.sku || "",
                offerprice: v.offerprice || "",
                ProductWeight: v.ProductWeight || "",
                ProductHeight: v.ProductHeight || "",
                ProductWidth: v.ProductWidth || "",
                ProductLength: v.ProductLength || "",
                CountryOrigin: v.CountryOrigin || "",
                Manufactured: v.Manufactured || "",
                Marketed: v.Marketed || "",
                barcode: v.barcode || "",
                status: v.status || "active",
                images: v.images || [],
                labels: Array.isArray(v.labels) ? v.labels : [],
                is_featured: !!v.is_featured,
                is_best_seller: !!v.is_best_seller,
                is_trending: !!v.is_trending,
                steps: v.steps || "",
                description: v.description || "",
              })),
            );
          }
          if (Array.isArray(p.sections) && p.sections.length > 0) {
            setSections(p.sections);
          }
        }
      });
    }
  }, [dispatch, id, isEditMode]);

  useEffect(() => {
    const firstVariant = variants?.[0];
    if (!firstVariant) return;

    setSections((prevSections) => {
      const updatedSections = [...prevSections];
      let multiStepIndex = updatedSections.findIndex(
        (s) => s.type === "Multi Step Selection",
      );

      if (multiStepIndex === -1) {
        updatedSections.push({
          type: "Multi Step Selection",
          data: {
            status: true,
            title: "Pack Selection",
            description: "",
            steps: [
              {
                status: true,
                title: "Choose Pack",
                description: "",
                display_type: "Pack",
                variants: [],
              },
            ],
          },
        });
        multiStepIndex = updatedSections.length - 1;
      }

      const firstStep = updatedSections[multiStepIndex]?.data?.steps?.[0];
      if (!firstStep) return prevSections;

      firstStep.display_type = "Pack";
      if (!firstStep.variants) firstStep.variants = [];

      const packOneIndex = firstStep.variants.findIndex(
        (v: any) => Number(v.badge) === 1,
      );

      const packOneData = {
        badge: 1,
        price: firstVariant.price || "",
        offerprice: firstVariant.offerprice || "",
        image: firstVariant.images?.[0] || "",
        auto_created: true,
      };

      if (packOneIndex === -1) {
        firstStep.variants.unshift(packOneData);
      }

      return [...updatedSections];
    });
  }, []);

  const handleDuplicate = async () => {
    if (!id) return;
    const result = await dispatch(duplicateProduct(id));
    if (duplicateProduct.fulfilled.match(result)) {
      toast.success("Product duplicate successfully created!");
      const newProduct = result.payload?.product || result.payload;
      if (newProduct?._id) {
        navigate(`${basePath}/products/${newProduct._id}/edit`);
      } else {
        navigate(`${basePath}/products`);
      }
    } else {
      toast.error((result.payload as string) || "Duplicate failed");
    }
  };

  const handleVariantChange = (index: number, field: string, value: any) => {
    const updatedVariants = [...variants];
    if (field === "stock_quantity" && Number(value) < 0) return;
    updatedVariants[index][field] = value;
    setVariants(updatedVariants);

    if (index === 0 && (field === "price" || field === "offerprice" || field === "images")) {
      setSections((prevSections) => {
        const updatedSections = [...prevSections];
        const multiStepIndex = updatedSections.findIndex(
          (s) => s.type === "Multi Step Selection",
        );
        if (multiStepIndex === -1) return prevSections;

        const firstStep = updatedSections[multiStepIndex]?.data?.steps?.[0];
        if (!firstStep) return prevSections;

        const packOneIndex = firstStep.variants?.findIndex(
          (v: any) => Number(v.badge) === 1,
        );
        if (packOneIndex === -1) return prevSections;

        if (field === "price") firstStep.variants[packOneIndex].price = value;
        if (field === "offerprice") firstStep.variants[packOneIndex].offerprice = value;
        if (field === "images") firstStep.variants[packOneIndex].image = value?.[0] || "";

        return [...updatedSections];
      });
    }
  };

  const addVariant = () => {
    setVariants([
      ...variants,
      {
        brand_id: "", type_id: "", price: "", stock_quantity: "0",
        sku: "", offerprice: "", ProductWeight: "", ProductHeight: "",
        ProductLength: "", ProductWidth: "", Manufactured: "",
        CountryOrigin: "", Marketed: "", barcode: "", images: [],
        labels: [], status: "active", is_featured: false,
        is_best_seller: false, is_trending: false, description: "", steps: "",
      },
    ]);
  };

  const removeVariant = (index: number) => {
    const updated = [...variants];
    updated.splice(index, 1);
    setVariants(updated);
  };

 
  const addSection = (type: string) => {
    let sectionData: any = {
      status: true,
      title: "",
      description: "",
      display_type: "",
      items: [],
    };

    if (type === "Image Banner Section") {
      sectionData = {
        status: true,
        items: [],
      };
    }

    if (type === "Why Choose Unity Hair") {
      sectionData = {
        status: true,
        title: "",
        description: "",
        items: [
          {
            title: "",
            description: "",
            image: "",
          },
        ],
      };
    }

    if (type === "Before & After") {
      sectionData = {
        status: true,
        title: "",
        description: "",
        items: [
          {
            title: "",
            description: "",
            beforeImage: "",
            afterImage: "",
          },
        ],
      };
    }

    // FAQ 1 + FAQ 2
    if (type === "FAQ 1" || type === "FAQ 2") {
      sectionData = {
        status: true,
        title: "",
        description: "",
        questions: [
          {
            question: "",
            answer: "",
            image: "",
          },
        ],
      };
    }

    setSections([...sections, { type, data: sectionData }]);
    setShowSectionDropdown(false);
  };
  const removeSection = (idx: number) => {
    setSections(sections.filter((_, i) => i !== idx));
  };

  const updateSectionField = (idx: number, field: string, value: any) => {
    const updated = [...sections];
    updated[idx].data[field] = value;
    setSections(updated);
  };

  const addStep = (sectionIdx: number) => {
    const updated = [...sections];
    if (!updated[sectionIdx].data.steps) updated[sectionIdx].data.steps = [];
    updated[sectionIdx].data.steps.push({
      status: true, title: "", description: "", display_type: "Text", variants: [],
    });
    setSections(updated);
  };

  const removeStep = (sectionIdx: number, stepIdx: number) => {
    const updated = [...sections];
    updated[sectionIdx].data.steps.splice(stepIdx, 1);
    setSections(updated);
  };

  const updateStepField = (
    sectionIdx: number, stepIdx: number, field: string, value: any,
  ) => {
    setSections((prev) => {
      const updated = [...prev];
      updated[sectionIdx] = {
        ...updated[sectionIdx],
        data: {
          ...updated[sectionIdx].data,
          steps: updated[sectionIdx].data.steps.map((step: any, idx: number) =>
            idx === stepIdx ? { ...step, [field]: value } : step,
          ),
        },
      };
      return updated;
    });
  };

  const addVariantToStep = (sectionIdx: number, stepIdx: number) => {
    const updated = [...sections];
    const displayType = updated[sectionIdx]?.data?.steps?.[stepIdx]?.display_type;

    if (displayType === "Pack") {
      updated[sectionIdx].data.steps[stepIdx].variants.push({
        image: "", price: "", offerprice: "", badge: "",
      });
    } else {
      updated[sectionIdx].data.steps[stepIdx].variants.push({
        title: "",
        slug: "",
        description: "",
        image: "",
        product_id: null,
      });
    }
    setSections(updated);
  };

  const removeVariantFromStep = (
    sectionIdx: number, stepIdx: number, variantIdx: number,
  ) => {
    const updated = [...sections];
    updated[sectionIdx].data.steps[stepIdx].variants.splice(variantIdx, 1);
    setSections(updated);
  };

  const updateVariantField = (
    sectionIdx: number,
    stepIdx: number,
    variantIdx: number,
    field: string,
    value: any,
  ) => {
    const updated = [...sections];
    const step = updated[sectionIdx].data.steps[stepIdx];
    const variant = step.variants[variantIdx];

    variant[field] = value;

    if (step.display_type !== "Pack") {
      if (field === "title") {
        if (!variant._slugManuallyEdited) {
          variant.slug = generateSlug(value);
        }
      }
    }

    if (Number(variant.badge) === 1) {
      if (field === "price" || field === "offerprice" || field === "image") {
        setVariants((prev) => {
          const updatedVariants = [...prev];
          updatedVariants[0] = {
            ...updatedVariants[0],
            ...(field === "price" ? { price: value } : {}),
            ...(field === "offerprice" ? { offerprice: value } : {}),
            ...(field === "image" ? { images: [value] } : {}),
          };
          return updatedVariants;
        });
      }
    }

    setSections(updated);
  };

  const handleSlugManualEdit = (
    sectionIdx: number, stepIdx: number, variantIdx: number, value: string,
  ) => {
    const updated = [...sections];
    const variant = updated[sectionIdx].data.steps[stepIdx].variants[variantIdx];
    variant.slug = value;
    variant._slugManuallyEdited = value !== generateSlug(variant.title || "");
    setSections(updated);
  };

  const addSectionItem = (idx: number) => {
    const updated = [...sections];

    if (!Array.isArray(updated[idx].data.items)) {
      updated[idx].data.items = [];
    }

    const sectionType = updated[idx].type;

    if (sectionType === "Image Banner Section") {
      updated[idx].data.items.push({
        title: "",
        description: "",
        image: "",
      });
    }

    else if (sectionType === "Why Choose Unity Hair") {
      updated[idx].data.items.push({
        title: "",
        description: "",
        image: "",
      });
    }

    else if (sectionType === "Before & After") {
      updated[idx].data.items.push({
        title: "",
        description: "",
        beforeImage: "",
        afterImage: "",
      });
    }

    else if (sectionType === "use and Others points") {
      updated[idx].data.items.push({
        usPoint: "",
        otherPoint: "",
      });
    }

    else {
      updated[idx].data.items.push({
        name: "",
        description: "",
        image: "",
      });
    }

    setSections(updated);
  };

  const addFaqQuestion = (sectionIdx: number) => {
    const updated = [...sections];

    if (!updated[sectionIdx].data.questions) {
      updated[sectionIdx].data.questions = [];
    }

    updated[sectionIdx].data.questions.push({
      question: "",
      answer: "",
      image: "",
    });

    setSections(updated);
  };

  const removeFaqQuestion = (
    sectionIdx: number,
    questionIdx: number,
  ) => {
    const updated = [...sections];
    updated[sectionIdx].data.questions.splice(questionIdx, 1);
    setSections(updated);
  };

  const updateFaqQuestion = (
    sectionIdx: number,
    questionIdx: number,
    field: string,
    value: any,
  ) => {
    const updated = [...sections];

    updated[sectionIdx].data.questions[questionIdx][field] =
      value;

    setSections(updated);
  };

  const removeSectionItem = (sectionIdx: number, itemIdx: number) => {
    const updated = [...sections];
    updated[sectionIdx].data.items.splice(itemIdx, 1);
    setSections(updated);
  };

  const updateSectionItem = (
    sectionIdx: number, itemIdx: number, field: string, value: any,
  ) => {
    const updated = [...sections];
    updated[sectionIdx].data.items[itemIdx][field] = value;
    setSections(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Product Name is required");
    if (categoryId.length === 0) return toast.error("Category is required");
    if (variants.length === 0) return toast.error("Add at least one variant");

    for (let i = 0; i < variants.length; i++) {
      const v = variants[i];
      if (
        !v.brand_id || !v.price || !v.barcode || !v.ProductWidth ||
        !v.ProductWeight || !v.offerprice || !v.ProductHeight ||
        !v.ProductLength || !v.CountryOrigin || !v.Marketed ||
        !v.Manufactured || !v.stock_quantity || !v.sku
      ) {
        return toast.error(`All fields are required for variant ${i + 1}`);
      }
    }

    const cleanSections = sections.map((section) => {
      if (section.type !== "Multi Step Selection") return section;
      return {
        ...section,
        data: {
          ...section.data,
          steps: (section.data.steps || []).map((step: any) => {
            if (step.display_type === "Pack") {
              const packExists = (step.variants || []).some(
                (v: any) => Number(v.badge) === 1,
              );
              const finalVariants = packExists
                ? step.variants
                : [
                  {
                    badge: 1,
                    price: variants?.[0]?.price || 0,
                    offerprice: variants?.[0]?.offerprice || 0,
                    image: variants?.[0]?.images?.[0] || "",
                    auto_created: true,
                  },
                  ...(step.variants || []),
                ];
              return { ...step, variants: finalVariants };
            }

            return {
              ...step,
              variants: (step.variants || []).map((v: any) => {
                const { _slugManuallyEdited, ...cleanVariant } = v;
                return cleanVariant;
              }),
            };
          }),
        },
      };
    });

    const payload = {
      name, description, steps, category_id: categoryId, images,
      status: status ? "active" : "inactive",
      variants,
      sections: cleanSections,
    };

    try {
      let result;
      if (isEditMode && id) {
        result = await dispatch(updateProduct({ id, data: payload }));
      } else {
        result = await dispatch(createProduct(payload));
      }

      if (
        createProduct.fulfilled.match(result) ||
        updateProduct.fulfilled.match(result)
      ) {
        toast.success(
          isEditMode ? "Product updated successfully!" : "Product created successfully!",
        );
        navigate(`${basePath}/products`);
      } else {
        toast.error((result.payload as string) || "Something went wrong");
      }
    } catch (err) {
      toast.error("Server Error");
    }
  };

  return (
    <div className="p-6 mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link to={`${basePath}/products`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex justify-between items-center w-full">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEditMode ? "Edit Product" : "Add New Product"}
            </h1>
            <p className="text-gray-500 mt-1">
              {isEditMode ? "Update product details." : "Create a new product."}
            </p>
          </div>
          {isEditMode && (
            <Button
              type="button"
              variant="outline"
              onClick={handleDuplicate}
              disabled={duplicating}
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              {duplicating ? "Duplicating..." : "Duplicate Product"}
            </Button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="shadow-md border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Product Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <Label>Product Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Description</Label>
                <TiptapEditor value={description} onChange={(val) => setDescription(val)} />
              </div>
              <div>
                <Label>How To Use Steps</Label>
                <TiptapEditor value={steps} onChange={(val) => setSteps(val)} />
              </div>
            </div>
            <div>
              <Label>SubCategory *</Label>
              <div className="border rounded-md p-3 min-h-[50px]">
                <div className="flex flex-wrap gap-2 mb-3">
                  {categoryId.map((cid) => {
                    const category = subCategories.find((c) => c._id === cid);
                    return (
                      <div
                        key={cid}
                        className="bg-green-600 text-white px-3 py-1 rounded-md flex items-center gap-2 text-sm"
                      >
                        {category?.name}
                        <button
                          type="button"
                          onClick={() =>
                            setCategoryId(categoryId.filter((c) => c !== cid))
                          }
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
                <select
                  className="w-full bg-transparent border rounded-md p-2"
                  value=""
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    if (selectedId && !categoryId.includes(selectedId)) {
                      setCategoryId([...categoryId, selectedId]);
                    }
                  }}
                >
                  <option value="">Select SubCategory</option>
                  {subCategories
                    .filter((cat) => cat.parent_id)
                    .filter((cat) => !categoryId.includes(cat._id))
                    .map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                </select>
              </div>
            </div>

            <div>
              <Label>Product Images</Label>
              <ImageUpload
                value={images}
                onChange={(val) => {
                  const image =
                    typeof val === "string"
                      ? val
                      : Array.isArray(val)
                        ? val[0]
                        : "";
                  setImages(image);
                }}
                multiple={false}
              />
            </div>
            <div className="flex items-center justify-between mt-2">
              <Label htmlFor="status">Active</Label>
              <Switch id="status" checked={status} onCheckedChange={setStatus} />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md border border-gray-200">
          <CardHeader className="flex justify-between items-center">
            <CardTitle className="text-lg font-semibold">Variants</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {variants.map((v, idx) => (
              <div key={idx} className="p-4 border rounded space-y-3 relative">
                <div>
                  <CardTitle className="text-lg font-semibold">
                    Variant ({idx + 1})
                  </CardTitle>
                  <Button
                    type="button"
                    variant="destructive"
                    className="absolute top-2 right-2"
                    onClick={() => removeVariant(idx)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="col-span-2 flex items-center justify-between mt-2">
                  <Label htmlFor={`variant-status-${idx}`}>Status</Label>
                  <Switch
                    id={`variant-status-${idx}`}
                    checked={v.status === "active"}
                    onCheckedChange={(checked) =>
                      handleVariantChange(idx, "status", checked ? "active" : "inactive")
                    }
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>Brand *</Label>
                    <Select value={v.brand_id} onValueChange={(val) => handleVariantChange(idx, "brand_id", val)}>
                      <SelectTrigger><SelectValue placeholder="Select brand" /></SelectTrigger>
                      <SelectContent>
                        {brands.map((b) => (
                          <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Type</Label>
                    <Select value={v.type_id} onValueChange={(val) => handleVariantChange(idx, "type_id", val)}>
                      <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        {types.map((t) => (
                          <SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Price *</Label>
                    <Input type="number" value={v.price} onChange={(e) => handleVariantChange(idx, "price", e.target.value)} />
                  </div>
                  <div>
                    <Label>Stock *</Label>
                    <Input type="number" value={v.stock_quantity} min={0} onChange={(e) => handleVariantChange(idx, "stock_quantity", e.target.value)} />
                  </div>
                  <div>
                    <Label>SKU *</Label>
                    <Input value={v.sku} onChange={(e) => handleVariantChange(idx, "sku", e.target.value)} />
                  </div>
                  <div>
                    <Label>Offer Price *</Label>
                    <Input type="number" value={v.offerprice} onChange={(e) => handleVariantChange(idx, "offerprice", e.target.value)} />
                  </div>
                  <div>
                    <Label>Bar Code *</Label>
                    <Input value={v.barcode} onChange={(e) => handleVariantChange(idx, "barcode", e.target.value)} />
                  </div>
                  <div>
                    <Label>Manufactured By *</Label>
                    <Input value={v.Manufactured} onChange={(e) => handleVariantChange(idx, "Manufactured", e.target.value)} />
                  </div>
                  <div>
                    <Label>Marketed By *</Label>
                    <Input value={v.Marketed} onChange={(e) => handleVariantChange(idx, "Marketed", e.target.value)} />
                  </div>
                  <div>
                    <Label>Country Origin *</Label>
                    <Input value={v.CountryOrigin} onChange={(e) => handleVariantChange(idx, "CountryOrigin", e.target.value)} />
                  </div>
                  <div>
                    <Label>Product Length (cms) *</Label>
                    <Input type="number" value={v.ProductLength} onChange={(e) => handleVariantChange(idx, "ProductLength", e.target.value)} />
                  </div>
                  <div>
                    <Label>Product Width (cms) *</Label>
                    <Input type="number" value={v.ProductWidth} onChange={(e) => handleVariantChange(idx, "ProductWidth", e.target.value)} />
                  </div>
                  <div>
                    <Label>Product Height (cms) *</Label>
                    <Input type="number" value={v.ProductHeight} onChange={(e) => handleVariantChange(idx, "ProductHeight", e.target.value)} />
                  </div>
                  <div>
                    <Label>Product Weight (Kg) *</Label>
                    <Input type="number" value={v.ProductWeight} onChange={(e) => handleVariantChange(idx, "ProductWeight", e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-wrap gap-6 mt-4 col-span-2">
                    <div className="flex items-center gap-2">
                      <Label>Featured</Label>
                      <Switch checked={v.is_featured} onCheckedChange={(val) => handleVariantChange(idx, "is_featured", val)} />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label>Best Seller</Label>
                      <Switch checked={v.is_best_seller} onCheckedChange={(val) => handleVariantChange(idx, "is_best_seller", val)} />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label>Trending</Label>
                      <Switch checked={v.is_trending} onCheckedChange={(val) => handleVariantChange(idx, "is_trending", val)} />
                    </div>
                  </div>
                  <div className="col-span-2">
                    <Label>Variant Images</Label>
                    <ImageUpload value={v.images} onChange={(urls) => handleVariantChange(idx, "images", urls)} multiple />
                  </div>
                  <div className="col-span-2">
                    <Label>Variant Labels</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {productLabels.map((label) => (
                        <label key={label._id} className="inline-flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            value={label._id}
                            checked={v.labels.includes(label._id)}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              const updatedLabels = checked
                                ? [...v.labels, label._id]
                                : v.labels.filter((l: string) => l !== label._id);
                              handleVariantChange(idx, "labels", updatedLabels);
                            }}
                            className="form-checkbox h-4 w-4 text-blue-600"
                          />
                          <span>{label.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-md border border-gray-200">
          <CardHeader className="flex flex-col justify-center items-center">
            <CardTitle className="text-lg font-semibold">Page Section Builder</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {sections.map((section, idx) => (
              <div key={idx} className="p-4 border rounded-lg space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">⇅</span>
                    <h3 className="font-semibold text-gray-800">
                      {section.type} {idx + 1}
                    </h3>
                  </div>
                  <Button type="button" variant="destructive" size="sm" onClick={() => removeSection(idx)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <Label>{section.type} Status</Label>
                  <Switch
                    checked={section.data.status !== false}
                    onCheckedChange={(val) => updateSectionField(idx, "status", val)}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>Title</Label>
                    <Input
                      value={section.data.title || ""}
                      placeholder="Enter Title"
                      onChange={(e) => updateSectionField(idx, "title", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Input
                      placeholder="Enter Description"
                      value={section.data.description || ""}
                      onChange={(e) => updateSectionField(idx, "description", e.target.value)}
                    />
                  </div>
                </div>

                {section.type === "Multi Step Selection" && (
                  <div className="space-y-6">
                    {(section.data.steps || []).map((step: any, stepIdx: number) => (
                      <div key={stepIdx} className="border rounded-xl p-4 bg-slate-50">
                        <div className="flex justify-between mb-4">
                          <h3 className="font-bold text-lg">Step {stepIdx + 1}</h3>
                          <div className="flex items-center gap-3">
                            <Label>Step Status</Label>
                            <Switch
                              checked={step?.status !== false}
                              onCheckedChange={(checked) =>
                                updateStepField(idx, stepIdx, "status", checked)
                              }
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              onClick={() => removeStep(idx, stepIdx)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label>Step Title</Label>
                            <Input
                              value={step.title}
                              placeholder="e.g. Select your scalp type"
                              onChange={(e) => updateStepField(idx, stepIdx, "title", e.target.value)}
                            />
                          </div>
                          <div>
                            <Label>Description</Label>
                            <Input
                              value={step.description}
                              placeholder="description"
                              onChange={(e) => updateStepField(idx, stepIdx, "description", e.target.value)}
                            />
                          </div>
                          <div>
                            <Label>Display Type</Label>
                            <Select
                              value={step.display_type || "Text"}
                              onValueChange={(value) =>
                                updateStepField(idx, stepIdx, "display_type", value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select display type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Text">Text</SelectItem>
                                <SelectItem value="Text with img">Text with img</SelectItem>
                                <SelectItem value="Upgrade Product">Upgrade Product</SelectItem>
                                <SelectItem value="Pack">Pack</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-4 mt-4">
                          {(step.variants || []).map((variant: any, variantIdx: number) => (
                            <div key={variantIdx} className="border p-4 rounded-lg bg-white">
                              <div className="flex justify-between mb-3">
                                <h5 className="font-semibold">Variant {variantIdx + 1}</h5>
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => removeVariantFromStep(idx, stepIdx, variantIdx)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>

                              {step.display_type === "Pack" && (
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Original Price</Label>
                                    <Input
                                      type="number"
                                      value={variant.price || ""}
                                      placeholder="MRP"
                                      onChange={(e) =>
                                        updateVariantField(idx, stepIdx, variantIdx, "price", e.target.value)
                                      }
                                    />
                                  </div>
                                  <div>
                                    <Label>Offer Price</Label>
                                    <Input
                                      type="number"
                                      value={variant.offerprice || ""}
                                      placeholder="Offer Price"
                                      onChange={(e) =>
                                        updateVariantField(idx, stepIdx, variantIdx, "offerprice", e.target.value)
                                      }
                                    />
                                  </div>
                                  <div>
                                    <Label>Pack of</Label>
                                    <Input
                                      value={variant.badge || ""}
                                      placeholder="e.g 1, 2, 3"
                                      onChange={(e) =>
                                        updateVariantField(idx, stepIdx, variantIdx, "badge", e.target.value)
                                      }
                                    />
                                  </div>
                                  <div>
                                    <Label>Upload Image</Label>
                                    <ImageUpload
                                      value={variant.image}
                                      onChange={(val) => {
                                        const url = typeof val === "string" ? val : Array.isArray(val) ? val[0] : "";
                                        updateVariantField(idx, stepIdx, variantIdx, "image", url);
                                      }}
                                      multiple={false}
                                    />
                                  </div>
                                </div>
                              )}

                              {step.display_type !== "Pack" && (
                                <div className="grid grid-cols-3 gap-4">
                                  <div>
                                    <Label>Title</Label>
                                    <Input
                                      value={variant.title || ""}
                                      placeholder="e.g. Stage 1 (Receding Hairline)"
                                      onChange={(e) =>
                                        updateVariantField(idx, stepIdx, variantIdx, "title", e.target.value)
                                      }
                                    />
                                  </div>

                                  <div>
                                    <Label>Select Product</Label>
                                    <Select
                                      value={variant.product_id || ""}
                                      onValueChange={(val) =>
                                        updateVariantField(idx, stepIdx, variantIdx, "product_id", val)
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select Product" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {products
                                          .filter((p) => p._id !== id)
                                          .map((p) => (
                                            <SelectItem key={p._id} value={p._id}>
                                              {p.name}
                                            </SelectItem>
                                          ))}
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div>
                                    <Label className="flex items-center gap-2">
                                      Slug

                                    </Label>
                                    <Input
                                      value={variant.slug || ""}
                                      placeholder="auto-generated-slug"
                                      onChange={(e) =>
                                        handleSlugManualEdit(idx, stepIdx, variantIdx, e.target.value)
                                      }
                                    />
                                    {variant.slug && (
                                      <p className="text-xs text-gray-400 mt-1">
                                        /products/<span className="text-blue-500">{variant.slug}</span>
                                      </p>
                                    )}
                                  </div>


                                  {step.display_type !== "Text" && (
                                    <div className="col-span-3">
                                      <Label>Upload Image</Label>
                                      <ImageUpload
                                        value={variant.image}
                                        onChange={(val) => {
                                          const url = typeof val === "string" ? val : Array.isArray(val) ? val[0] : "";
                                          updateVariantField(idx, stepIdx, variantIdx, "image", url);
                                        }}
                                        multiple={false}
                                      />
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}

                          <div className="w-full flex justify-center">
                            <Button type="button" onClick={() => addVariantToStep(idx, stepIdx)}>
                              Add Option
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}

                    <Button type="button" onClick={() => addStep(idx)}>
                      Add Step
                    </Button>
                  </div>
                )}




       

                {section.type === "Why Choose Unity Hair" && (
                  <div className="space-y-4">
                    {section.data.items?.map(
                      (item: any, itemIdx: number) => (
                        <div
                          key={itemIdx}
                          className="border rounded-xl p-4 space-y-4 bg-white"
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400">
                                ⇅
                              </span>

                              <h4 className="font-semibold text-gray-700">
                                Item {itemIdx + 1}
                              </h4>
                            </div>

                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() =>
                                removeSectionItem(idx, itemIdx)
                              }
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <Label>Title</Label>

                              <Input
                                placeholder="Enter Title"
                                value={item.title || ""}
                                onChange={(e) =>
                                  updateSectionItem(
                                    idx,
                                    itemIdx,
                                    "title",
                                    e.target.value
                                  )
                                }
                              />
                            </div>

                            <div>
                              <Label>Description</Label>

                              <Input
                                placeholder="Enter Description"
                                value={item.description || ""}
                                onChange={(e) =>
                                  updateSectionItem(
                                    idx,
                                    itemIdx,
                                    "description",
                                    e.target.value
                                  )
                                }
                              />
                            </div>

                            <div>
                              <Label>Image</Label>

                              <ImageUpload
                                value={item.image || ""}
                                onChange={(val) => {
                                  const image =
                                    typeof val === "string"
                                      ? val
                                      : Array.isArray(val)
                                        ? val[0]
                                        : "";

                                  updateSectionItem(
                                    idx,
                                    itemIdx,
                                    "image",
                                    image
                                  );
                                }}
                                multiple={false}
                              />
                            </div>
                          </div>
                        </div>
                      ),
                    )}

                    <div className="flex justify-center w-full">
                      <Button
                        type="button"
                        onClick={() => addSectionItem(idx)}
                      >
                        Add to items
                      </Button>
                    </div>
                  </div>
                )}



                {section.type === "Before & After" && (
                  <div className="space-y-4">
                    {section.data.items?.map(
                      (item: any, itemIdx: number) => (
                        <div
                          key={itemIdx}
                          className="border rounded-xl p-4 space-y-4 bg-white"
                        >
                          {/* HEADER */}
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400">
                                ⇅
                              </span>

                              <h4 className="font-semibold text-gray-700">
                                Item {itemIdx + 1}
                              </h4>
                            </div>

                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() =>
                                removeSectionItem(idx, itemIdx)
                              }
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>

                          {/* FIELDS */}
                          <div className="grid grid-cols-4 gap-4">
                            <div>
                              <Label>Title</Label>

                              <Input
                                placeholder="Enter Title"
                                value={item.title || ""}
                                onChange={(e) =>
                                  updateSectionItem(
                                    idx,
                                    itemIdx,
                                    "title",
                                    e.target.value
                                  )
                                }
                              />
                            </div>

                            <div>
                              <Label>Description</Label>

                              <Input
                                placeholder="Enter Description"
                                value={item.description || ""}
                                onChange={(e) =>
                                  updateSectionItem(
                                    idx,
                                    itemIdx,
                                    "description",
                                    e.target.value
                                  )
                                }
                              />
                            </div>

                            <div>
                              <Label>Before Image</Label>

                              <ImageUpload
                                value={item.beforeImage || ""}
                                onChange={(val) => {
                                  const image =
                                    typeof val === "string"
                                      ? val
                                      : Array.isArray(val)
                                        ? val[0]
                                        : "";

                                  updateSectionItem(
                                    idx,
                                    itemIdx,
                                    "beforeImage",
                                    image
                                  );
                                }}
                                multiple={false}
                              />
                            </div>

                            <div>
                              <Label>After Image</Label>

                              <ImageUpload
                                value={item.afterImage || ""}
                                onChange={(val) => {
                                  const image =
                                    typeof val === "string"
                                      ? val
                                      : Array.isArray(val)
                                        ? val[0]
                                        : "";

                                  updateSectionItem(
                                    idx,
                                    itemIdx,
                                    "afterImage",
                                    image
                                  );
                                }}
                                multiple={false}
                              />
                            </div>
                          </div>
                        </div>
                      ),
                    )}

                    <div className="flex justify-center w-full">
                      <Button
                        type="button"
                        onClick={() => addSectionItem(idx)}
                      >
                        Add to items
                      </Button>
                    </div>
                  </div>
                )}


               

                {(section.type === "FAQ 1" ||
                  section.type === "FAQ 2") && (
                    <div className="space-y-4">

                      {section.data.questions?.map(
                        (faq: any, faqIdx: number) => (
                          <div
                            key={faqIdx}
                            className="border rounded-xl p-4 space-y-4 bg-white"
                          >
                            {/* HEADER */}
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400">
                                  ⇅
                                </span>

                                <h4 className="font-semibold text-gray-700">
                                  Question {faqIdx + 1}
                                </h4>
                              </div>

                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() =>
                                  removeFaqQuestion(idx, faqIdx)
                                }
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                              <div>
                                <Label>Question</Label>

                                <Input
                                  placeholder="Enter Question"
                                  value={faq.question || ""}
                                  onChange={(e) =>
                                    updateFaqQuestion(
                                      idx,
                                      faqIdx,
                                      "question",
                                      e.target.value
                                    )
                                  }
                                />
                              </div>

                              <div>
                                <Label>Answer</Label>

                                <Input
                                  placeholder="Enter Answer"
                                  value={faq.answer || ""}
                                  onChange={(e) =>
                                    updateFaqQuestion(
                                      idx,
                                      faqIdx,
                                      "answer",
                                      e.target.value
                                    )
                                  }
                                />
                              </div>

                              <div>
                                <Label>Image</Label>

                                <ImageUpload
                                  value={faq.image || ""}
                                  onChange={(val) => {
                                    const image =
                                      typeof val === "string"
                                        ? val
                                        : Array.isArray(val)
                                          ? val[0]
                                          : "";

                                    updateFaqQuestion(
                                      idx,
                                      faqIdx,
                                      "image",
                                      image
                                    );
                                  }}
                                  multiple={false}
                                />
                              </div>
                            </div>
                          </div>
                        ),
                      )}

                      <div className="flex justify-center w-full">
                        <Button
                          type="button"
                          onClick={() => addFaqQuestion(idx)}
                        >
                          Add to questions
                        </Button>
                      </div>
                    </div>
                  )}

                {ITEM_LIST_SECTIONS.includes(section.type) && (
                  <div className="space-y-3">
                    {(section.data.items || []).map((item: any, itemIdx: number) => (
                      <div key={itemIdx} className="p-3 border rounded-lg bg-white space-y-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">⇅</span>
                            <span className="text-sm font-medium text-gray-600">
                              {item.name || `Item ${itemIdx + 1}`}
                            </span>
                          </div>
                          <Button type="button" variant="destructive" size="sm" onClick={() => removeSectionItem(idx, itemIdx)}>
                            🗑
                          </Button>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          {section.type === "use and Others points" ? (
                            <>
                              <div>
                                <Label>Us (Point)</Label>
                                <Input value={item.name || ""} placeholder="Enter Us Point" onChange={(e) => updateSectionItem(idx, itemIdx, "name", e.target.value)} />
                              </div>
                              <div>
                                <Label>Others (Point)</Label>
                                <Input value={item.description || ""} placeholder="Enter Others Point" onChange={(e) => updateSectionItem(idx, itemIdx, "description", e.target.value)} />
                              </div>
                            </>
                          ) : (
                            <>
                              <div>
                                <Label>Name</Label>
                                <Input value={item.name || ""} placeholder="Enter Name" onChange={(e) => updateSectionItem(idx, itemIdx, "name", e.target.value)} />
                              </div>
                              <div>
                                <Label>Description</Label>
                                <Input value={item.description || ""} placeholder="Enter Description" onChange={(e) => updateSectionItem(idx, itemIdx, "description", e.target.value)} />
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-center pt-2">
                      <Button type="button" onClick={() => addSectionItem(idx)}>
                        Add to product Extra List
                      </Button>
                    </div>
                  </div>
                )}

                {section.type === "Image Banner Section" && (
                  <div className="space-y-4">
                    {(section.data.items || []).map((item: any, itemIdx: number) => (
                      <div key={itemIdx} className="border rounded-lg p-4 bg-white">
                        <div className="flex justify-between items-center mb-4">
                          <h4>Banner {itemIdx + 1}</h4>
                          <Button type="button" variant="destructive" size="sm" onClick={() => removeSectionItem(idx, itemIdx)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Title</Label>
                            <Input value={item.title || ""} placeholder="Enter title" onChange={(e) => updateSectionItem(idx, itemIdx, "title", e.target.value)} />
                          </div>
                          <div>
                            <Label>Description</Label>
                            <Input value={item.description || ""} placeholder="Enter description" onChange={(e) => updateSectionItem(idx, itemIdx, "description", e.target.value)} />
                          </div>
                        </div>
                        <div className="mt-4">
                          <Label>Banner Image</Label>
                          <ImageUpload
                            value={item.image || ""}
                            onChange={(val) => {
                              const image = typeof val === "string" ? val : Array.isArray(val) ? val[0] : "";
                              updateSectionItem(idx, itemIdx, "image", image);
                            }}
                            multiple={false}
                          />
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-center">
                      <Button type="button" onClick={() => addSectionItem(idx)}>
                        Add Banner
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            <div className="relative flex justify-center">
              <Button type="button" onClick={() => setShowSectionDropdown(!showSectionDropdown)}>
                Add to product Page Section Builder
              </Button>
              {showSectionDropdown && (
                <div className="absolute mt-12 w-72 bg-white border border-gray-200 rounded shadow-lg z-50 max-h-80 overflow-y-auto">
                  {SECTION_TYPES.map((sType) => (
                    <div
                      key={sType}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                      onClick={() => addSection(sType)}
                    >
                      {sType}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
            {isEditMode ? "Update Product" : "Create Product"}
          </Button>
          <Link to={`${basePath}/products`} className="flex-1">
            <Button type="button" variant="outline" className="w-full">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}