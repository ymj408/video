"use client";

import { useEffect, useRef, useState } from "react";
import { ApiError, errorMessage, isAbortError, uploadImage } from "@/lib/api";
import { formatBytes } from "@/lib/format";
import type { Template, UploadedAsset } from "@/lib/types";
import {
  AlertCircleIcon,
  CheckIcon,
  ImageIcon,
  UploadIcon,
  XIcon,
} from "@/components/icons";

type SlotStatus = "empty" | "uploading" | "ready" | "error";

interface UploadSlot {
  key: string;
  status: SlotStatus;
  asset?: UploadedAsset;
  previewUrl?: string;
  fileName?: string;
  error?: string;
}

interface UploaderProps {
  template: Template;
  userId: string;
  onSubmit: (assetIds: string[]) => Promise<void>;
}

function createSlots(count: number): UploadSlot[] {
  return Array.from({ length: count }, (_, index) => ({
    key: `slot-${index}`,
    status: "empty",
  }));
}

function randomToken(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function Uploader({ template, userId, onSubmit }: UploaderProps) {
  const [slots, setSlots] = useState<UploadSlot[]>(() => createSlots(template.requiredImageCount));
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const controllersRef = useRef(new Map<number, AbortController>());
  const tokensRef = useRef(new Map<number, string>());
  const previewsRef = useRef(new Set<string>());
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const controllers = controllersRef.current;
    const previews = previewsRef.current;
    return () => {
      mountedRef.current = false;
      controllers.forEach((controller) => controller.abort());
      previews.forEach((url) => URL.revokeObjectURL(url));
      previews.clear();
    };
  }, []);

  const readyCount = slots.filter((slot) => slot.status === "ready").length;
  const uploadingCount = slots.filter((slot) => slot.status === "uploading").length;
  const allReady = readyCount === template.requiredImageCount && uploadingCount === 0;

  const revokePreview = (url?: string) => {
    if (!url) return;
    URL.revokeObjectURL(url);
    previewsRef.current.delete(url);
  };

  const resetSlots = () => {
    controllersRef.current.forEach((controller) => controller.abort());
    controllersRef.current.clear();
    tokensRef.current.clear();
    previewsRef.current.forEach((url) => URL.revokeObjectURL(url));
    previewsRef.current.clear();
    setSlots(createSlots(template.requiredImageCount));
  };

  const selectFile = (index: number, file: File) => {
    setSubmitError(null);
    setSuccessMessage(null);
    const previous = slots[index];
    const previousPreview = previous?.previewUrl;

    if (!template.acceptedMimeTypes.includes(file.type)) {
      revokePreview(previousPreview);
      setSlots((current) =>
        current.map((slot, slotIndex) =>
          slotIndex === index
            ? {
                ...slot,
                status: "error",
                asset: undefined,
                previewUrl: undefined,
                fileName: file.name,
                error: "文件类型不支持，请选择 JPEG 或 PNG 图片。",
              }
            : slot,
        ),
      );
      return;
    }

    if (file.size > template.maxFileSizeBytes) {
      revokePreview(previousPreview);
      setSlots((current) =>
        current.map((slot, slotIndex) =>
          slotIndex === index
            ? {
                ...slot,
                status: "error",
                asset: undefined,
                previewUrl: undefined,
                fileName: file.name,
                error: `图片过大，单张不能超过 ${formatBytes(template.maxFileSizeBytes)}。`,
              }
            : slot,
        ),
      );
      return;
    }

    controllersRef.current.get(index)?.abort();
    revokePreview(previousPreview);

    const token = randomToken();
    tokensRef.current.set(index, token);
    const controller = new AbortController();
    controllersRef.current.set(index, controller);
    const previewUrl = URL.createObjectURL(file);
    previewsRef.current.add(previewUrl);

    setSlots((current) =>
      current.map((slot, slotIndex) =>
        slotIndex === index
          ? {
              ...slot,
              status: "uploading",
              asset: undefined,
              previewUrl,
              fileName: file.name,
              error: undefined,
            }
          : slot,
      ),
    );

    uploadImage(userId, file, controller.signal)
      .then((asset) => {
        if (!mountedRef.current || tokensRef.current.get(index) !== token) return;
        controllersRef.current.delete(index);
        setSlots((current) =>
          current.map((slot, slotIndex) =>
            slotIndex === index
              ? {
                  ...slot,
                  status: "ready",
                  asset,
                  fileName: file.name,
                  error: undefined,
                }
              : slot,
          ),
        );
      })
      .catch((error: unknown) => {
        if (!mountedRef.current || tokensRef.current.get(index) !== token) return;
        if (isAbortError(error)) return;
        controllersRef.current.delete(index);
        setSlots((current) =>
          current.map((slot, slotIndex) =>
            slotIndex === index
              ? {
                  ...slot,
                  status: "error",
                  asset: undefined,
                  error:
                    error instanceof ApiError
                      ? error.message
                      : errorMessage(error) || "上传失败，请重试。",
                }
              : slot,
          ),
        );
      });
  };

  const removeSlot = (index: number) => {
    controllersRef.current.get(index)?.abort();
    controllersRef.current.delete(index);
    tokensRef.current.delete(index);
    const preview = slots[index]?.previewUrl;
    revokePreview(preview);
    setSubmitError(null);
    setSlots((current) =>
      current.map((slot, slotIndex) =>
        slotIndex === index
          ? { key: slot.key, status: "empty" }
          : slot,
      ),
    );
  };

  const openPicker = (index: number) => {
    if (slots[index]?.status === "uploading") return;
    inputRefs.current[index]?.click();
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    setSuccessMessage(null);
    if (!allReady) {
      setSubmitError("请先完成所有图片的上传，再提交制作。");
      return;
    }
    if (submitting) return;

    const assetIds = slots
      .map((slot) => slot.asset?.id)
      .filter((id): id is string => Boolean(id));
    if (assetIds.length !== template.requiredImageCount) {
      setSubmitError("素材数量与模板要求不一致，请重新检查。");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(assetIds);
      if (!mountedRef.current) return;
      resetSlots();
      setSuccessMessage("任务已受理，后台正在处理。你可以在右侧继续查看进度，或去浏览其他模板。");
    } catch (error) {
      if (!mountedRef.current) return;
      setSubmitError(errorMessage(error));
    } finally {
      if (mountedRef.current) {
        setSubmitting(false);
      }
    }
  };

  return (
    <section className="upload-section" aria-labelledby="upload-heading">
      <div className="section-label-row">
        <div>
          <p className="eyebrow">YOUR MATERIALS</p>
          <h2 id="upload-heading">上传素材</h2>
        </div>
        <span className={`ready-counter ${allReady ? "is-ready" : ""}`}>
          {readyCount}/{template.requiredImageCount} 已就绪
        </span>
      </div>

      <p className="upload-help">
        支持 JPEG、PNG，单张不超过 {formatBytes(template.maxFileSizeBytes)}。上传后可预览、替换或移除。
      </p>

      <div className={`upload-grid upload-grid-${Math.min(template.requiredImageCount, 3)}`}>
        {slots.map((slot, index) => {
          const label = `第 ${index + 1} 张图片`;
          return (
            <div className={`upload-slot-shell ${slot.previewUrl ? "has-preview" : ""}`} key={slot.key}>
              <input
                ref={(element) => {
                  inputRefs.current[index] = element;
                }}
                type="file"
                accept={template.acceptedMimeTypes.join(",")}
                className="visually-hidden-input"
                tabIndex={-1}
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0];
                  event.currentTarget.value = "";
                  if (file) selectFile(index, file);
                }}
              />

              {slot.status === "empty" && (
                <button
                  type="button"
                  className="upload-slot empty"
                  onClick={() => openPicker(index)}
                  aria-label={`${label}：点击选择图片`}
                >
                  <span className="upload-slot-icon"><UploadIcon /></span>
                  <span className="upload-slot-title">添加图片 {index + 1}</span>
                  <span className="upload-slot-sub">点击选择文件</span>
                </button>
              )}

              {slot.status === "uploading" && (
                <div className="upload-slot uploading" aria-label={`${label}上传中`}>
                  {slot.previewUrl && (
                    <img src={slot.previewUrl} alt="" className="slot-preview" />
                  )}
                  <span className="slot-overlay">
                    <span className="orbit-loader light"><span /></span>
                    <span>正在上传…</span>
                  </span>
                  <button
                    type="button"
                    className="slot-remove floating"
                    onClick={() => removeSlot(index)}
                    aria-label={`取消上传${label}`}
                  >
                    <XIcon />
                  </button>
                </div>
              )}

              {slot.status === "ready" && slot.previewUrl && (
                <div className="upload-slot ready">
                  <img
                    src={slot.previewUrl}
                    alt={`已上传的${label}预览`}
                    className="slot-preview"
                  />
                  <span className="slot-ready-badge">
                    <CheckIcon />
                    已就绪
                  </span>
                  <div className="slot-actions">
                    <button
                      type="button"
                      className="slot-action"
                      onClick={() => openPicker(index)}
                      aria-label={`替换${label}`}
                    >
                      替换
                    </button>
                    <button
                      type="button"
                      className="slot-action danger"
                      onClick={() => removeSlot(index)}
                      aria-label={`移除${label}`}
                    >
                      移除
                    </button>
                  </div>
                </div>
              )}

              {slot.status === "error" && (
                <div className="upload-slot error" role="group" aria-label={`${label}上传失败`}>
                  <span className="upload-slot-icon error-icon"><AlertCircleIcon /></span>
                  <span className="upload-slot-title">上传失败</span>
                  {slot.fileName && <span className="upload-slot-file">{slot.fileName}</span>}
                  <span className="upload-slot-error" role="alert">{slot.error}</span>
                  <div className="slot-error-actions">
                    <button type="button" className="button tiny secondary" onClick={() => openPicker(index)}>
                      重新选择
                    </button>
                    <button type="button" className="button tiny ghost" onClick={() => removeSlot(index)}>
                      移除
                    </button>
                  </div>
                </div>
              )}

              {slot.status !== "error" && !slot.previewUrl && (
                <span className="slot-number" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="sr-only" aria-live="polite">
        {uploadingCount > 0
          ? `正在上传 ${uploadingCount} 张图片`
          : allReady
            ? "所有素材已上传完成，可以提交制作"
            : `已有 ${readyCount} 张图片就绪`}
      </div>

      {submitError && (
        <div className="inline-error" role="alert">
          <AlertCircleIcon />
          <span>{submitError}</span>
        </div>
      )}

      {successMessage && (
        <div className="inline-success" role="status">
          <CheckIcon />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="submit-area">
        <div className="submit-hint">
          <ImageIcon />
          <span>
            {allReady
              ? "素材已准备好，提交后会立即返回任务编号。"
              : uploadingCount > 0
                ? "图片上传中，请等待完成。"
                : `还需要上传 ${template.requiredImageCount - readyCount} 张图片。`}
          </span>
        </div>
        <button
          type="button"
          className="button primary submit-button"
          onClick={handleSubmit}
          disabled={!allReady || submitting}
          aria-busy={submitting}
        >
          {submitting ? (
            <>
              <span className="orbit-loader dark"><span /></span>
              提交中…
            </>
          ) : (
            <>
              <UploadIcon />
              开始制作
            </>
          )}
        </button>
      </div>
    </section>
  );
}
