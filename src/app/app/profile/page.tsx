"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/store/session";
import { useT } from "@/components/i18n/useT";
import FileImage from "@/components/FileImage";
import { BusinessActorsService, EmployeesRolesService, FilesService, UsersService } from "@/lib";
import type { BusinessActor, BusinessActorRequest, OrganizationMember } from "@/lib";
import { formatRole, formatRoles } from "@/lib/formatRole";
import {
 MAX_IMAGE_UPLOAD_BYTES,
 imageFileUrl,
 isImageFile,
 parseJsonObject,
 userProfilePhotoFileId,
} from "@/lib/imageFiles";

function getErrorStatus(error: unknown): number | undefined {
 if (typeof error !== "object" || error === null || !("status" in error)) {
 return undefined;
 }
 return typeof error.status === "number" ? error.status : undefined;
}

export default function ProfilePage() {
 const { user, setUser } = useSession();
 const { t } = useT();
 const [actor, setActor] = useState<BusinessActor | null>(null);
 const [hasActorProfile, setHasActorProfile] = useState(false);
 const [actorLoading, setActorLoading] = useState(true);
 const [actorSaving, setActorSaving] = useState(false);
 const [actorSuccess, setActorSuccess] = useState("");
 const [actorError, setActorError] = useState("");
 const [photoUploading, setPhotoUploading] = useState(false);
 const [photoSuccess, setPhotoSuccess] = useState("");
 const [photoError, setPhotoError] = useState("");
 const [isEditingActor, setIsEditingActor] = useState(false);
 const [orgMember, setOrgMember] = useState<OrganizationMember | null>(null);
 const [orgRoleForbidden, setOrgRoleForbidden] = useState(false);
 const [actorForm, setActorForm] = useState<BusinessActorRequest>({
 name: "",
 niu: "",
 tradeRegistryNumber: "",
 website: "",
 contactPhone: "",
 privateAddress: "",
 businessAddress: "",
 businessProfile: "",
 });

 useEffect(() => {
 let mounted = true;
 (async () => {
 setActorLoading(true);
 setActorError("");
 try {
 const data = await BusinessActorsService.getMyProfile();
 if (!mounted) return;
 setActor(data || null);
 setHasActorProfile(!!data);
 } catch (err: unknown) {
 if (!mounted) return;
 if (getErrorStatus(err) === 404) {
 setHasActorProfile(false);
 } else {
 setActorError(t("app.profile.actor.error"));
 }
 } finally {
 if (mounted) setActorLoading(false);
 }
 })();
 return () => {
 mounted = false;
 };
 }, [t]);

 useEffect(() => {
 let mounted = true;
 (async () => {
 if (!user?.id && !user?.email) return;
 try {
 const list = await EmployeesRolesService.getEmployees();
 if (!mounted) return;
 const meMember = (list || []).find(
 (m) =>
 (!!user?.id && m.userId === user.id) ||
 (!!user?.email && !!m.userEmail && m.userEmail.toLowerCase() === user.email.toLowerCase())
 );
 setOrgMember(meMember || null);
 setOrgRoleForbidden(false);
 } catch (err: unknown) {
 if (!mounted) return;
 const status = getErrorStatus(err);
 if (status === 403) {
 setOrgRoleForbidden(true);
 }
 }
 })();
 return () => {
 mounted = false;
 };
 }, [user?.email, user?.id]);

 useEffect(() => {
 if (!actor) return;
 setActorForm({
 name: actor.name || "",
 niu: actor.niu || "",
 tradeRegistryNumber: actor.tradeRegistryNumber || "",
 website: actor.website || "",
 contactPhone: actor.contactPhone || "",
 privateAddress: actor.privateAddress || "",
 businessAddress: actor.businessAddress || "",
 businessProfile: actor.businessProfile || "",
 });
 }, [actor]);

 const updateActorField = (key: keyof BusinessActorRequest, value: string) => {
 setActorForm((prev) => ({ ...prev, [key]: value }));
 };

 const profilePhotoFileId = userProfilePhotoFileId(user);
 const profilePhotoUrl =
 user?.profilePhotoUrl || imageFileUrl(profilePhotoFileId);
 const profileInitials =
 [user?.firstName, user?.lastName]
 .filter(Boolean)
 .join(" ")
 .split(" ")
 .map((part) => part[0])
 .slice(0, 2)
 .join("")
 .toUpperCase() || "YS";

 const handleProfilePhotoUpload = async (file: File | null | undefined) => {
 if (!user || !file) return;
 setPhotoSuccess("");
 setPhotoError("");
 if (!isImageFile(file)) {
 setPhotoError(t("app.profile.photo.invalid"));
 return;
 }
 if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
 setPhotoError(t("app.profile.photo.tooLarge"));
 return;
 }

 setPhotoUploading(true);
 try {
 const storedFile = await FilesService.uploadFile({ file });
 if (!storedFile.id) {
 throw new Error("Missing uploaded file id.");
 }
 const existingPayload = parseJsonObject(user.onboardingPayload);
 const nextPayload = {
 ...existingPayload,
 profilePhotoFileId: storedFile.id,
 profilePhotoUpdatedAt: new Date().toISOString(),
 };
 const updatedUser = await UsersService.updateIdentityOnboarding({
 accountType: user.accountType || (user.organizationId ? "BUSINESS" : "PROSPECT"),
 businessType: user.businessType || undefined,
 step: user.onboardingStep ?? 0,
 status: user.onboardingStatus,
 data: nextPayload,
 });
 const nextPhotoUrl = imageFileUrl(storedFile.id);
 setUser({
 ...user,
 ...updatedUser,
 onboardingPayload: updatedUser.onboardingPayload || JSON.stringify(nextPayload),
 profilePhotoFileId: storedFile.id,
 profilePhotoUrl: nextPhotoUrl,
 });
 setPhotoSuccess(t("app.profile.photo.saved"));
 } catch {
 setPhotoError(t("app.profile.photo.error"));
 } finally {
 setPhotoUploading(false);
 }
 };

 const saveActorProfile = async () => {
 setActorSaving(true);
 setActorError("");
 setActorSuccess("");
 try {
 const payload: BusinessActorRequest = {
 name: actorForm.name?.trim() || undefined,
 niu: actorForm.niu?.trim() || undefined,
 tradeRegistryNumber: actorForm.tradeRegistryNumber?.trim() || undefined,
 website: actorForm.website?.trim() || undefined,
 contactPhone: actorForm.contactPhone?.trim() || undefined,
 privateAddress: actorForm.privateAddress?.trim() || undefined,
 businessAddress: actorForm.businessAddress?.trim() || undefined,
 businessProfile: actorForm.businessProfile?.trim() || undefined,
 };
 const saved = hasActorProfile
 ? await BusinessActorsService.updateProfile(payload)
 : await BusinessActorsService.onboardUser(payload);
 const fallbackActor = {
 ...(actor || {}),
 ...payload,
 } as BusinessActor;
 setActor({ ...fallbackActor, ...(saved || {}) });
 setHasActorProfile(true);
 setActorSuccess(t("app.profile.actor.success"));
 setIsEditingActor(false);
 } catch {
 setActorError(t("app.profile.actor.error"));
 } finally {
 setActorSaving(false);
 }
 };

 return (
 <main className="space-y-4 p-6">
 <div className="ys-header-card p-5">
 <div className="flex items-center gap-2">
 <span className="grid h-8 w-8 place-items-center rounded-xl border border-border bg-card text-muted-foreground">
 <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
 <path d="M12 4a4 4 0 1 1-4 4 4 4 0 0 1 4-4z" strokeLinecap="round" />
 <path d="M6 20v-1a6 6 0 0 1 12 0v1" strokeLinecap="round" />
 </svg>
 </span>
 <h2 className="text-lg font-semibold">{t("app.profile.title")}</h2>
 </div>
 <p className="mt-1 text-sm text-muted-foreground">
 {t("app.profile.subtitle")}
 </p>
 </div>

 <section className="ys-card p-5">
 <div className="ys-section-title">
 {t("app.profile.section.account")}
 </div>
 <div className="mt-4 flex flex-wrap items-center gap-4 rounded-lg border border-border bg-muted/30 p-4">
 <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-card text-lg font-semibold text-foreground">
 <FileImage
 fileId={profilePhotoFileId}
 src={profilePhotoUrl}
 alt={t("app.profile.photo.alt")}
 className="h-full w-full object-cover"
 fallback={profileInitials}
 />
 </div>
 <div className="min-w-0 flex-1">
 <div className="text-sm font-semibold text-foreground">{t("app.profile.photo.title")}</div>
 <p className="mt-1 text-sm text-muted-foreground">{t("app.profile.photo.subtitle")}</p>
 <div className="mt-3 flex flex-wrap items-center gap-3">
 <label
 className={`ys-btn-secondary px-3 py-2 text-sm ${
 photoUploading ? "cursor-not-allowed opacity-60" : "cursor-pointer"
 }`}
 >
 {photoUploading ? t("app.profile.photo.uploading") : t("app.profile.photo.upload")}
 <input
 type="file"
 accept="image/*"
 className="sr-only"
 disabled={photoUploading}
 onChange={(event) => {
 const input = event.currentTarget;
 const file = input.files?.[0];
 void handleProfilePhotoUpload(file);
 input.value = "";
 }}
 />
 </label>
 {photoSuccess ? <span className="text-sm text-emerald-600">{photoSuccess}</span> : null}
 {photoError ? <span className="text-sm text-red-600">{photoError}</span> : null}
 </div>
 </div>
 </div>
 <ul className="mt-3 divide-y divide-border text-sm text-foreground">
 <li className="flex items-center justify-between gap-6 py-2">
 <span className="text-muted-foreground">{t("app.profile.email")}</span>
 <span className="font-medium">{user?.email || "—"}</span>
 </li>
 <li className="flex items-center justify-between gap-6 py-2">
 <span className="text-muted-foreground">{t("app.profile.firstName")}</span>
 <span className="font-medium">{user?.firstName || "—"}</span>
 </li>
 <li className="flex items-center justify-between gap-6 py-2">
 <span className="text-muted-foreground">{t("app.profile.lastName")}</span>
 <span className="font-medium">{user?.lastName || "—"}</span>
 </li>
 </ul>

 <div className="mt-5 ys-section-title">
 {t("app.profile.section.access")}
 </div>
 <ul className="mt-3 divide-y divide-border text-sm text-foreground">
 <li className="flex items-center justify-between gap-6 py-2">
 <span className="text-muted-foreground">{t("app.profile.orgRole")}</span>
 <span className="font-medium">
 {orgRoleForbidden
 ? t("app.profile.orgRole.forbidden")
 : orgMember
 ? `${formatRole(orgMember.roleName)}${orgMember.agencyName ? ` • ${orgMember.agencyName}` : ""}`
 : formatRoles(user?.roles)}
 </span>
 </li>
 <li className="flex items-center justify-between gap-6 py-2">
 <span className="text-muted-foreground">{t("app.profile.roles")}</span>
 <span className="font-medium">{formatRoles(user?.roles)}</span>
 </li>
 </ul>

 <div className="mt-5 ys-section-title">
 {t("app.profile.section.business")}
 </div>
 <ul className="mt-3 divide-y divide-border text-sm text-foreground">
 <li className="flex items-center justify-between gap-6 py-2">
 <span className="text-muted-foreground">{t("app.profile.businessCreator")}</span>
 <span className="font-medium">
 {user?.firstName || user?.email
 ? `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || user?.email
 : t("app.profile.businessCreator.you")}
 </span>
 </li>
 </ul>
 </section>

 <section className="ys-card p-5">
 <div className="flex items-start justify-between gap-4">
 <div>
 <h3 className="text-lg font-semibold">{t("app.profile.actor.title")}</h3>
 <p className="mt-1 text-sm text-muted-foreground">
 {t("app.profile.actor.subtitle")}
 </p>
 </div>
 <div className="flex items-center gap-2">
 {isEditingActor && (
 <button
 type="button"
 onClick={() => {
 setIsEditingActor(false);
 setActorForm({
 name: actor?.name || "",
 niu: actor?.niu || "",
 tradeRegistryNumber: actor?.tradeRegistryNumber || "",
 website: actor?.website || "",
 contactPhone: actor?.contactPhone || "",
 privateAddress: actor?.privateAddress || "",
 businessAddress: actor?.businessAddress || "",
 businessProfile: actor?.businessProfile || "",
 });
 }}
 className="ys-btn-secondary px-3 py-1.5 text-xs"
 >
 {t("app.profile.actor.cancel")}
 </button>
 )}
 <button
 type="button"
 onClick={() => setIsEditingActor((prev) => !prev)}
 aria-label={t("app.profile.actor.edit")}
 className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card text-emerald-700 transition hover:border-emerald-300 hover:text-emerald-800 dark:text-emerald-300"
 >
 <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
 <path d="M4 20h4l11-11-4-4L4 16v4z" strokeLinecap="round" />
 <path d="M14 6l4 4" strokeLinecap="round" />
 </svg>
 </button>
 </div>
 </div>

 {actorLoading ? (
 <div className="mt-3 text-sm text-muted-foreground">{t("app.common.loading")}</div>
 ) : !isEditingActor ? (
 <div className="mt-4 space-y-3 text-sm text-foreground">
 <div className="flex items-center justify-between gap-4 border-b border-border pb-2">
 <span className="text-muted-foreground">{t("app.profile.actor.name")}</span>
 <span className="font-medium">{actor?.name || "—"}</span>
 </div>
 <div className="flex items-center justify-between gap-4 border-b border-border pb-2">
 <span className="text-muted-foreground">{t("app.profile.actor.niu")}</span>
 <span className="font-medium">{actor?.niu || "—"}</span>
 </div>
 <div className="flex items-center justify-between gap-4 border-b border-border pb-2">
 <span className="text-muted-foreground">{t("app.profile.actor.tradeRegistry")}</span>
 <span className="font-medium">{actor?.tradeRegistryNumber || "—"}</span>
 </div>
 <div className="flex items-center justify-between gap-4 border-b border-border pb-2">
 <span className="text-muted-foreground">{t("app.profile.actor.website")}</span>
 <span className="font-medium">{actor?.website || "—"}</span>
 </div>
 <div className="flex items-center justify-between gap-4 border-b border-border pb-2">
 <span className="text-muted-foreground">{t("app.profile.actor.phone")}</span>
 <span className="font-medium">{actor?.contactPhone || "—"}</span>
 </div>
 <div className="flex items-center justify-between gap-4 border-b border-border pb-2">
 <span className="text-muted-foreground">{t("app.profile.actor.privateAddress")}</span>
 <span className="font-medium">{actor?.privateAddress || "—"}</span>
 </div>
 <div className="flex items-center justify-between gap-4 border-b border-border pb-2">
 <span className="text-muted-foreground">{t("app.profile.actor.businessAddress")}</span>
 <span className="font-medium">{actor?.businessAddress || "—"}</span>
 </div>
 <div className="flex items-start justify-between gap-4">
 <span className="text-muted-foreground">{t("app.profile.actor.profile")}</span>
 <span className="max-w-[60%] text-right font-medium">{actor?.businessProfile || "—"}</span>
 </div>
 </div>
 ) : (
 <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
 <label className="text-sm text-muted-foreground">
 {t("app.profile.actor.name")}
 <input
 value={actorForm.name || ""}
 onChange={(e) => updateActorField("name", e.target.value)}
 className="ys-input mt-1"
 />
 </label>
 <label className="text-sm text-muted-foreground">
 {t("app.profile.actor.niu")}
 <input
 value={actorForm.niu || ""}
 onChange={(e) => updateActorField("niu", e.target.value)}
 className="ys-input mt-1"
 />
 </label>
 <label className="text-sm text-muted-foreground">
 {t("app.profile.actor.tradeRegistry")}
 <input
 value={actorForm.tradeRegistryNumber || ""}
 onChange={(e) => updateActorField("tradeRegistryNumber", e.target.value)}
 className="ys-input mt-1"
 />
 </label>
 <label className="text-sm text-muted-foreground">
 {t("app.profile.actor.website")}
 <input
 value={actorForm.website || ""}
 onChange={(e) => updateActorField("website", e.target.value)}
 className="ys-input mt-1"
 />
 </label>
 <label className="text-sm text-muted-foreground">
 {t("app.profile.actor.phone")}
 <input
 value={actorForm.contactPhone || ""}
 onChange={(e) => updateActorField("contactPhone", e.target.value)}
 className="ys-input mt-1"
 />
 </label>
 <label className="text-sm text-muted-foreground">
 {t("app.profile.actor.privateAddress")}
 <input
 value={actorForm.privateAddress || ""}
 onChange={(e) => updateActorField("privateAddress", e.target.value)}
 className="ys-input mt-1"
 />
 </label>
 <label className="text-sm text-muted-foreground md:col-span-2">
 {t("app.profile.actor.businessAddress")}
 <input
 value={actorForm.businessAddress || ""}
 onChange={(e) => updateActorField("businessAddress", e.target.value)}
 className="ys-input mt-1"
 />
 </label>
 <label className="text-sm text-muted-foreground md:col-span-2">
 {t("app.profile.actor.profile")}
 <textarea
 value={actorForm.businessProfile || ""}
 onChange={(e) => updateActorField("businessProfile", e.target.value)}
 rows={4}
 className="ys-input mt-1"
 />
 </label>
 </div>
 )}

 <div className="mt-4 flex flex-wrap items-center gap-3">
 {isEditingActor && (
 <button
 type="button"
 onClick={saveActorProfile}
 disabled={actorSaving}
 className="ys-btn-primary px-4 py-2 text-sm disabled:opacity-60"
 >
 {actorSaving ? t("app.profile.actor.saving") : t("app.profile.actor.save")}
 </button>
 )}
 {actorSuccess && <div className="text-sm text-emerald-600">{actorSuccess}</div>}
 {actorError && <div className="text-sm text-red-600">{actorError}</div>}
 </div>
 </section>
 </main>
 );
}
