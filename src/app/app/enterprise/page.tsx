"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
 BusinessActorsService,
 FilesService,
 OrganizationsService,
 SettingsService,
 UsersService,
 User,
} from "@/lib";
import type {
 AppBusinessSettings,
 AppBusinessSettingsRequest,
 BusinessActor,
 BusinessActorRequest,
 CreateOrganizationRequest,
 Organization,
} from "@/lib";
import { useSession } from "@/store/session";
import { useT } from "@/components/i18n/useT";
import type { TranslationKey } from "@/components/i18n/translation";
import {
 extractOrganizationLogoFileId,
 getOrganizationLogoBlobUrl,
 normalizeOrganizationLogoUri,
 notifyOrganizationLogoUpdated,
 readOrganizationLogoCache,
 writeOrganizationLogoCache,
} from "@/lib/organizationLogo";

type OrganizationForm = {
 name: string;
 longName: string;
 service: string;
 email: string;
 description: string;
 legalForm: string;
 taxNumber: string;
 businessRegistrationNumber: string;
 ceoName: string;
 yearFounded: string;
 numberOfEmployees: string;
 websiteUrl: string;
 socialNetwork: string;
};

type SettingsForm = {
 negotiateSellingPrice: boolean;
 sellingPriceIncludeVat: boolean;
 authorizeExceptionalDiscount: boolean;
 grantableDiscountRate: string;
 printLogo: boolean;
 paperFormat: string;
 lengthOfVatInvoiceNumber: string;
 prefixOfVatInvoiceNumber: string;
 lowStockAlert: boolean;
 preventiveMaintenanceAlert: boolean;
 defaultCurrency: string;
 legalIdentity: string;
 taxIdentifier: string;
 requireSalesOrderApproval: boolean;
 requireReturnApproval: boolean;
};

type BooleanSettingsKey =
 | "negotiateSellingPrice"
 | "sellingPriceIncludeVat"
 | "authorizeExceptionalDiscount"
 | "printLogo"
 | "lowStockAlert"
 | "preventiveMaintenanceAlert"
 | "requireSalesOrderApproval"
 | "requireReturnApproval";

const emptyOrganizationForm: OrganizationForm = {
 name: "",
 longName: "",
 service: "",
 email: "",
 description: "",
 legalForm: "",
 taxNumber: "",
 businessRegistrationNumber: "",
 ceoName: "",
 yearFounded: "",
 numberOfEmployees: "",
 websiteUrl: "",
 socialNetwork: "",
};

const defaultSettingsForm: SettingsForm = {
 negotiateSellingPrice: false,
 sellingPriceIncludeVat: false,
 authorizeExceptionalDiscount: false,
 grantableDiscountRate: "0",
 printLogo: true,
 paperFormat: "A4",
 lengthOfVatInvoiceNumber: "10",
 prefixOfVatInvoiceNumber: "FAC-",
 lowStockAlert: false,
 preventiveMaintenanceAlert: false,
 defaultCurrency: "XAF",
 legalIdentity: "",
 taxIdentifier: "",
 requireSalesOrderApproval: false,
 requireReturnApproval: false,
};

const organizationToForm = (organization?: Organization | null): OrganizationForm => {
 if (!organization) return { ...emptyOrganizationForm };
 return {
 name: organization.shortName || organization.displayName || organization.name || "",
 longName: organization.longName || organization.legalName || organization.name || "",
 service: organization.service || organization.organizationType || organization.serviceType || "",
 email: organization.email || "",
 description: organization.description || "",
 legalForm: organization.legalForm || "",
 taxNumber: organization.taxNumber || "",
 businessRegistrationNumber: organization.businessRegistrationNumber || "",
 ceoName: organization.ceoName || "",
 yearFounded: organization.yearFounded ? String(organization.yearFounded) : "",
 numberOfEmployees:
 organization.numberOfEmployees === undefined ? "" : String(organization.numberOfEmployees),
 websiteUrl: organization.websiteUrl || "",
 socialNetwork: organization.socialNetwork || "",
 };
};

const settingsToForm = (settings?: AppBusinessSettings | null): SettingsForm => {
 if (!settings) return { ...defaultSettingsForm };
 return {
 negotiateSellingPrice: !!settings.negotiateSellingPrice,
 sellingPriceIncludeVat: !!settings.sellingPriceIncludeVat,
 authorizeExceptionalDiscount: !!settings.authorizeExceptionalDiscount,
 grantableDiscountRate: String(settings.grantableDiscountRate ?? 0),
 printLogo: settings.printLogo ?? true,
 paperFormat: settings.paperFormat || "A4",
 lengthOfVatInvoiceNumber: String(settings.lengthOfVatInvoiceNumber ?? 10),
 prefixOfVatInvoiceNumber: settings.prefixOfVatInvoiceNumber || "FAC-",
 lowStockAlert: !!settings.lowStockAlert,
 preventiveMaintenanceAlert: !!settings.preventiveMaintenanceAlert,
 defaultCurrency: settings.defaultCurrency || "XAF",
 legalIdentity: settings.legalIdentity || "",
 taxIdentifier: settings.taxIdentifier || "",
 requireSalesOrderApproval: !!settings.requireSalesOrderApproval,
 requireReturnApproval: !!settings.requireReturnApproval,
 };
};

export default function EnterprisePage() {
 const router = useRouter();
 const { tenant, user, token, setTenant, setUser, setCurrency, logout } = useSession();
 const { t } = useT();
 const [org, setOrg] = useState<Organization | null>(tenant || null);
 const [orgDetail, setOrgDetail] = useState<Organization | null>(null);
 const [actor, setActor] = useState<BusinessActor | null>(null);
 const [hasActorProfile, setHasActorProfile] = useState(false);
 const [settings, setSettings] = useState<AppBusinessSettings | null>(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState("");

 const [isEditingOrganization, setIsEditingOrganization] = useState(false);
 const [organizationSaving, setOrganizationSaving] = useState(false);
 const [organizationSuccess, setOrganizationSuccess] = useState("");
 const [organizationError, setOrganizationError] = useState("");
 const [organizationForm, setOrganizationForm] = useState<OrganizationForm>(emptyOrganizationForm);

 const [isEditingSettings, setIsEditingSettings] = useState(false);
 const [settingsSaving, setSettingsSaving] = useState(false);
 const [settingsSuccess, setSettingsSuccess] = useState("");
 const [settingsError, setSettingsError] = useState("");
 const [settingsForm, setSettingsForm] = useState<SettingsForm>(defaultSettingsForm);

 const [isEditingActor, setIsEditingActor] = useState(false);
 const [actorSaving, setActorSaving] = useState(false);
 const [actorSuccess, setActorSuccess] = useState("");
 const [actorError, setActorError] = useState("");
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

 const [isEditingPlan, setIsEditingPlan] = useState(false);
 const [planSaving, setPlanSaving] = useState(false);
 const [planSuccess, setPlanSuccess] = useState("");
 const [planError, setPlanError] = useState("");
 const [planValue, setPlanValue] = useState<User.plan | "">("");

 const [logoUploading, setLogoUploading] = useState(false);
 const [logoSuccess, setLogoSuccess] = useState("");
 const [logoError, setLogoError] = useState("");
 const [localLogoUri, setLocalLogoUri] = useState("");
 const [localLogoId, setLocalLogoId] = useState("");
 const [blobLogoUri, setBlobLogoUri] = useState("");
 const [uploadPreviewUri, setUploadPreviewUri] = useState("");

 useEffect(() => {
 (async () => {
 setLoading(true);
 setError("");
 try {
 const [s, actorProfile] = await Promise.all([
 SettingsService.getGlobalOptions().catch(() => null),
 BusinessActorsService.getMyProfile().catch(() => null),
 ]);

 // `/organizations/my` returns organizations you OWN. For employees, it can be empty/forbidden.
 // We rely on the tenant selected at login (X-Tenant-ID) for a consistent experience.
 const baseOrg = tenant || null;
 setOrg(baseOrg);
 if (baseOrg?.id) {
 const detail = await OrganizationsService.getOrganizationById(baseOrg.id).catch(() => null);
 setOrgDetail(detail || baseOrg);
 } else {
 setOrgDetail(baseOrg);
 }
 setSettings(s || null);
 setActor(actorProfile || null);
 setHasActorProfile(!!actorProfile);
 } catch {
 setError(t("app.enterprise.error"));
 } finally {
 setLoading(false);
 }
 })();
 }, [tenant, t]);

 useEffect(() => {
 setPlanValue(user?.plan || "");
 }, [user?.plan]);

 const orgId = orgDetail?.id || org?.id || "";

 useEffect(() => {
 setOrganizationForm(organizationToForm(orgDetail || org));
 }, [org, orgDetail]);

 useEffect(() => {
 setSettingsForm(settingsToForm(settings));
 }, [settings]);

 useEffect(() => {
 if (!orgId) {
 setLocalLogoUri("");
 setLocalLogoId("");
 return;
 }
 const cachedLogo = readOrganizationLogoCache(orgId);
 setLocalLogoUri(cachedLogo.uri);
 setLocalLogoId(cachedLogo.fileId);
 }, [orgId]);

 useEffect(() => {
 const normalizedUri = normalizeOrganizationLogoUri(orgDetail?.logoUri || org?.logoUri || localLogoUri);
 const logoIdFromUri = extractOrganizationLogoFileId(normalizedUri);
 const logoId = orgDetail?.logoId || org?.logoId || logoIdFromUri || localLogoId;
 const canUseDirectImageUrl = !!normalizedUri && !logoIdFromUri;

 if (canUseDirectImageUrl) {
 setBlobLogoUri("");
 return;
 }
 if (!logoId || !token) {
 setBlobLogoUri("");
 return;
 }
 let cancelled = false;
 (async () => {
 try {
 const objectUrl = await getOrganizationLogoBlobUrl({
 fileId: logoId,
 organizationId: orgId || user?.organizationId || null,
 token,
 tenantId: user?.tenantId || null,
 });
 if (!cancelled) setBlobLogoUri(objectUrl);
 } catch {
 if (!cancelled) setBlobLogoUri("");
 }
 })();
 return () => {
 cancelled = true;
 };
 }, [localLogoId, localLogoUri, orgDetail?.logoId, orgDetail?.logoUri, org?.logoId, org?.logoUri, orgId, token, user?.organizationId, user?.tenantId]);

 useEffect(() => {
 return () => {
 if (uploadPreviewUri) URL.revokeObjectURL(uploadPreviewUri);
 };
 }, [uploadPreviewUri]);

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
 currency: actor.currency || "XAF",
 });
 if (actor.currency) setCurrency(actor.currency);
 }, [actor, setCurrency]);

 const planLabel = useMemo(() => {
 if (!planValue) return "—";
 if (planValue === User.plan.FREE_TIER) return t("app.enterprise.plan.freeTier");
 if (planValue === User.plan.FREELANCE) return t("app.enterprise.plan.freelance");
 if (planValue === User.plan.PROFESSIONAL) return t("app.enterprise.plan.professional");
 return String(planValue);
 }, [planValue, t]);

 const handleAuthenticationFailure = (requestError: unknown) => {
 const status =
 typeof requestError === "object" && requestError && "status" in requestError
 ? Number((requestError as { status?: unknown }).status)
 : 0;
 if (status !== 401) return false;
 logout();
 router.replace("/");
 return true;
 };

 const buildOrganizationPayload = (
 currentOrg: Organization,
 overrides: Partial<CreateOrganizationRequest> = {},
 ): CreateOrganizationRequest => ({
 code: currentOrg.code,
 service: currentOrg.service || currentOrg.organizationType || currentOrg.serviceType,
 isIndividualBusiness:
 currentOrg.isIndividualBusiness ?? currentOrg.individualBusiness ?? false,
 email: currentOrg.email,
 shortName: currentOrg.shortName || currentOrg.displayName || currentOrg.name,
 longName: currentOrg.longName || currentOrg.legalName || currentOrg.name,
 description: currentOrg.description,
 logoUri: currentOrg.logoUri,
 logoId: currentOrg.logoId,
 websiteUrl: currentOrg.websiteUrl,
 socialNetwork: currentOrg.socialNetwork,
 businessRegistrationNumber: currentOrg.businessRegistrationNumber,
 taxNumber: currentOrg.taxNumber,
 capitalShare: currentOrg.capitalShare,
 ceoName: currentOrg.ceoName,
 yearFounded: currentOrg.yearFounded,
 keywords: currentOrg.keywords || [],
 numberOfEmployees: currentOrg.numberOfEmployees,
 legalForm: currentOrg.legalForm,
 isActive: currentOrg.isActive ?? currentOrg.active ?? true,
 status: currentOrg.status,
 ...overrides,
 });

 const updateOrganizationField = (key: keyof OrganizationForm, value: string) => {
 setOrganizationForm((previous) => ({ ...previous, [key]: value }));
 };

 const saveOrganization = async () => {
 const currentOrg = orgDetail || org;
 if (!currentOrg?.id || !currentOrg.code || !organizationForm.name.trim() || !organizationForm.longName.trim()) {
 setOrganizationError(t("app.enterprise.org.required"));
 return;
 }
 const service = organizationForm.service.trim();
 if (!service) {
 setOrganizationError(t("app.enterprise.org.required"));
 return;
 }

 setOrganizationSaving(true);
 setOrganizationError("");
 setOrganizationSuccess("");
 try {
 const yearFounded = organizationForm.yearFounded
 ? Number(organizationForm.yearFounded)
 : undefined;
 const numberOfEmployees = organizationForm.numberOfEmployees
 ? Number(organizationForm.numberOfEmployees)
 : undefined;
 const payload = buildOrganizationPayload(currentOrg, {
 service,
 email: organizationForm.email.trim() || undefined,
 shortName: organizationForm.name.trim(),
 longName: organizationForm.longName.trim(),
 description: organizationForm.description.trim() || undefined,
 legalForm: organizationForm.legalForm.trim() || undefined,
 taxNumber: organizationForm.taxNumber.trim() || undefined,
 businessRegistrationNumber:
 organizationForm.businessRegistrationNumber.trim() || undefined,
 ceoName: organizationForm.ceoName.trim() || undefined,
 yearFounded:
 yearFounded && Number.isInteger(yearFounded) ? yearFounded : undefined,
 numberOfEmployees:
 numberOfEmployees !== undefined && Number.isInteger(numberOfEmployees)
 ? numberOfEmployees
 : undefined,
 websiteUrl: organizationForm.websiteUrl.trim() || undefined,
 socialNetwork: organizationForm.socialNetwork.trim() || undefined,
 });
 const updated = await OrganizationsService.updateOrganization(currentOrg.id, payload);
 setOrgDetail(updated);
 setOrg(updated);
 setTenant(updated);
 setOrganizationSuccess(t("app.enterprise.org.success"));
 setIsEditingOrganization(false);
 } catch (requestError) {
 if (!handleAuthenticationFailure(requestError)) {
 setOrganizationError(t("app.enterprise.org.error"));
 }
 } finally {
 setOrganizationSaving(false);
 }
 };

 const updateSettingsField = <K extends keyof SettingsForm>(
 key: K,
 value: SettingsForm[K],
 ) => {
 setSettingsForm((previous) => ({ ...previous, [key]: value }));
 };

 const saveSettings = async () => {
 const invoiceLength = Number(settingsForm.lengthOfVatInvoiceNumber);
 const discountRate = Number(settingsForm.grantableDiscountRate);
 if (
 !settingsForm.paperFormat.trim() ||
 !settingsForm.prefixOfVatInvoiceNumber.trim() ||
 !Number.isInteger(invoiceLength) ||
 invoiceLength < 1 ||
 invoiceLength > 32 ||
 !Number.isFinite(discountRate) ||
 discountRate < 0 ||
 discountRate > 100
 ) {
 setSettingsError(t("app.enterprise.settings.validation"));
 return;
 }

 setSettingsSaving(true);
 setSettingsError("");
 setSettingsSuccess("");
 try {
 const payload: AppBusinessSettingsRequest = {
 negotiateSellingPrice: settingsForm.negotiateSellingPrice,
 sellingPriceIncludeVat: settingsForm.sellingPriceIncludeVat,
 authorizeExceptionalDiscount: settingsForm.authorizeExceptionalDiscount,
 grantableDiscountRate: discountRate,
 printLogo: settingsForm.printLogo,
 paperFormat: settingsForm.paperFormat.trim().toUpperCase(),
 lengthOfVatInvoiceNumber: invoiceLength,
 prefixOfVatInvoiceNumber: settingsForm.prefixOfVatInvoiceNumber.trim().toUpperCase(),
 lowStockAlert: settingsForm.lowStockAlert,
 preventiveMaintenanceAlert: settingsForm.preventiveMaintenanceAlert,
 defaultCurrency: settingsForm.defaultCurrency.trim().toUpperCase() || "XAF",
 legalIdentity: settingsForm.legalIdentity.trim() || undefined,
 taxIdentifier: settingsForm.taxIdentifier.trim() || undefined,
 requireSalesOrderApproval: settingsForm.requireSalesOrderApproval,
 requireReturnApproval: settingsForm.requireReturnApproval,
 };
 const updated = await SettingsService.updateGlobalOptions(payload);
 setSettings(updated);
 if (updated.defaultCurrency) setCurrency(updated.defaultCurrency);
 setSettingsSuccess(t("app.enterprise.settings.success"));
 setIsEditingSettings(false);
 } catch (requestError) {
 if (!handleAuthenticationFailure(requestError)) {
 setSettingsError(t("app.enterprise.settings.error"));
 }
 } finally {
 setSettingsSaving(false);
 }
 };

 const updateActorField = (key: keyof BusinessActorRequest, value: string) => {
 setActorForm((prev) => ({ ...prev, [key]: value }));
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
 currency: actorForm.currency || "XAF",
 };
 const saved = hasActorProfile
 ? await BusinessActorsService.updateProfile(payload)
 : await BusinessActorsService.onboardUser(payload);
 const fallbackActor = {
 ...(actor || {}),
 ...payload,
 } as BusinessActor;
 setActor({ ...fallbackActor, ...(saved || {}) });
 if (payload.currency) setCurrency(payload.currency);
 setHasActorProfile(true);
 setActorSuccess(t("app.profile.actor.success"));
 setIsEditingActor(false);
 } catch {
 setActorError(t("app.profile.actor.error"));
 } finally {
 setActorSaving(false);
 }
 };

 const savePlan = async () => {
 if (!planValue) return;
 setPlanSaving(true);
 setPlanError("");
 setPlanSuccess("");
 try {
 const updated = await UsersService.updateMyPlan({ plan: planValue });
 setUser(updated || user);
 setPlanSuccess(t("app.enterprise.plan.success"));
 setIsEditingPlan(false);
 } catch {
 setPlanError(t("app.enterprise.plan.error"));
 } finally {
 setPlanSaving(false);
 }
 };

 const handleLogoUpload = async (file: File) => {
 if (!file.type.startsWith("image/")) {
 setLogoError(t("app.enterprise.logo.invalidType"));
 return;
 }
 if (file.size > 5 * 1024 * 1024) {
 setLogoError(t("app.enterprise.logo.tooLarge"));
 return;
 }

 setLogoUploading(true);
 setLogoError("");
 setLogoSuccess("");
 const previewUri = URL.createObjectURL(file);
 setUploadPreviewUri((previous) => {
 if (previous) URL.revokeObjectURL(previous);
 return previewUri;
 });
 try {
 const uploaded = await FilesService.uploadFile({ file });
 const nextLogoUri = normalizeOrganizationLogoUri(uploaded?.publicUrl);
 const nextLogoId = uploaded?.id || "";

 if (!nextLogoUri && !nextLogoId) {
 setLogoError(t("app.enterprise.logo.noPublicUrl"));
 return;
 }

 const currentOrg = orgDetail || org;
 if (!currentOrg?.id) {
 throw new Error("Cannot attach a logo without an organization.");
 }

 const updated = await OrganizationsService.updateOrganization(
 currentOrg.id,
 buildOrganizationPayload(currentOrg, {
 logoUri: nextLogoUri || undefined,
 logoId: nextLogoId || undefined,
 }),
 );
 setOrgDetail(updated);
 setOrg(updated);
 setTenant(updated);
 setLocalLogoUri(nextLogoUri);
 setLocalLogoId(nextLogoId);
 writeOrganizationLogoCache(orgId, { uri: nextLogoUri, fileId: nextLogoId });

 let synchronizedLogoSrc = nextLogoUri;
 if (nextLogoId) {
 try {
 const objectUrl = await getOrganizationLogoBlobUrl({
 fileId: nextLogoId,
 organizationId: currentOrg.id,
 token,
 tenantId: user?.tenantId || null,
 });
 setBlobLogoUri(objectUrl);
 synchronizedLogoSrc = objectUrl;
 } catch {
 setBlobLogoUri("");
 }
 } else {
 setBlobLogoUri("");
 }
 if (synchronizedLogoSrc) {
 notifyOrganizationLogoUpdated({
 organizationId: currentOrg.id,
 src: synchronizedLogoSrc,
 });
 }
 setLogoSuccess(t("app.enterprise.logo.saved"));
 } catch (uploadError) {
 if (!handleAuthenticationFailure(uploadError)) {
 setLogoError(t("app.enterprise.logo.error"));
 }
 setUploadPreviewUri((previous) => {
 if (previous) URL.revokeObjectURL(previous);
 return "";
 });
 } finally {
 setLogoUploading(false);
 }
 };

 const normalizedDisplayUri = normalizeOrganizationLogoUri(orgDetail?.logoUri || org?.logoUri || localLogoUri);
 const displayHasFileId = !!(
 extractOrganizationLogoFileId(normalizedDisplayUri) ||
 orgDetail?.logoId ||
 org?.logoId ||
 localLogoId
 );
 const displayLogoUri =
 uploadPreviewUri || (displayHasFileId ? blobLogoUri : normalizedDisplayUri || "");

 return (
 <main className="p-6 space-y-4">
 <div className=" ys-header-card p-5">
 <div className="flex items-start justify-between gap-4">
 <div>
 <div className="flex items-center gap-2">
 <span className="grid h-8 w-8 place-items-center rounded-xl border border-border bg-card text-muted-foreground">
 <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
 <path d="M4 20V4h8v16M12 8h8v12" strokeLinecap="round" />
 <path d="M7 8h2M7 12h2M7 16h2M15 12h2M15 16h2" strokeLinecap="round" />
 </svg>
 </span>
 <h2 className="text-lg font-semibold">{t("app.enterprise.title")}</h2>
 </div>
 <p className="mt-1 text-sm text-muted-foreground">
 {t("app.enterprise.subtitle")}
 </p>
 </div>
 <Link href="/app/admin" className="text-xs font-semibold text-blue-600 dark:text-blue-300">
 {t("app.enterprise.openAdmin")}
 </Link>
 </div>
 </div>

 {loading ? (
 <div className="text-sm text-muted-foreground">{t("app.enterprise.loading")}</div>
 ) : error ? (
 <div className="text-sm text-red-600">{error}</div>
 ) : (
 <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
 <section className="ys-card p-5">
 <div className="flex items-center justify-between gap-3">
 <div className="ys-section-title">{t("app.enterprise.org.title")}</div>
 <div className="flex items-center gap-2">
 {isEditingOrganization && (
 <button
 type="button"
 className="ys-btn-secondary px-3 py-1.5 text-xs"
 onClick={() => {
 setIsEditingOrganization(false);
 setOrganizationForm(organizationToForm(orgDetail || org));
 setOrganizationError("");
 }}
 >
 {t("app.enterprise.org.cancel")}
 </button>
 )}
 <button
 type="button"
 className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-card text-emerald-700 transition hover:border-emerald-300 hover:text-emerald-800 dark:text-emerald-300"
 aria-label={t("app.enterprise.org.edit")}
 onClick={() => {
 setIsEditingOrganization((previous) => !previous);
 setOrganizationError("");
 setOrganizationSuccess("");
 }}
 >
 <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
 <path d="M4 20h4l11-11-4-4L4 16v4z" strokeLinecap="round" />
 <path d="M14 6l4 4" strokeLinecap="round" />
 </svg>
 </button>
 </div>
 </div>
 <div className="mt-3 flex items-start gap-4 border border-border rounded-xl bg-muted/40 p-3">
 <div className="h-16 w-16 overflow-hidden border border-border bg-card rounded-xl">
 {displayLogoUri ? (
 <img src={displayLogoUri} alt={t("app.enterprise.logo.alt")} className="h-full w-full object-cover" />
 ) : (
 <div className="grid h-full w-full place-items-center text-xs font-semibold text-muted-foreground dark:text-muted-foreground">
 {t("app.enterprise.logo.empty")}
 </div>
 )}
 </div>
 <div className="min-w-0 flex-1">
 <div className="text-sm font-semibold text-foreground">
 {t("app.enterprise.logo.title")}
 </div>
 <div className="mt-1 text-xs text-muted-foreground">
 {t("app.enterprise.logo.hint")}
 </div>
 <div className="mt-2 flex flex-wrap items-center gap-3">
 <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-primary hover:text-primary">
 {logoUploading ? (
 <>
 <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 animate-spin" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" /></svg>
 {t("app.enterprise.logo.uploading")}
 </>
 ) : (
 <>
 <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round" /><polyline points="17 8 12 3 7 8" strokeLinecap="round" strokeLinejoin="round" /><line x1="12" y1="3" x2="12" y2="15" strokeLinecap="round" /></svg>
 {t("app.enterprise.logo.upload")}
 </>
 )}
 <input
 type="file"
 accept="image/png,image/jpeg,image/webp,image/gif"
 className="hidden"
 disabled={logoUploading}
 onChange={(e) => {
 const file = e.target.files?.[0];
 if (file) {
 void handleLogoUpload(file);
 }
 e.currentTarget.value = "";
 }}
 />
 </label>
 {logoSuccess && <span className="text-xs text-emerald-600">{logoSuccess}</span>}
 {logoError && <span className="text-xs text-red-600">{logoError}</span>}
 </div>
 </div>
 </div>
 {isEditingOrganization ? (
 <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
 {([
 ["name", "app.enterprise.org.name", "text"],
 ["longName", "app.enterprise.org.legalName", "text"],
 ["service", "app.enterprise.org.serviceType", "text"],
 ["email", "app.enterprise.org.email", "email"],
 ["legalForm", "app.enterprise.org.legalForm", "text"],
 ["taxNumber", "app.enterprise.org.taxNumber", "text"],
 ["businessRegistrationNumber", "app.enterprise.org.businessReg", "text"],
 ["ceoName", "app.enterprise.org.ceo", "text"],
 ["yearFounded", "app.enterprise.org.founded", "number"],
 ["numberOfEmployees", "app.enterprise.org.employees", "number"],
 ["websiteUrl", "app.enterprise.org.website", "url"],
 ["socialNetwork", "app.enterprise.org.socialNetwork", "text"],
 ] as const).map(([key, label, type]) => (
 <label key={key} className="space-y-1 text-xs font-medium text-muted-foreground">
 <span>{t(label)}</span>
 {key === "yearFounded" ? (
 <div className="relative">
 <input
 type="number"
 min={1000}
 max={new Date().getFullYear()}
 value={organizationForm[key]}
 onChange={(event) => updateOrganizationField(key, event.target.value)}
 className="w-full rounded-lg border border-border bg-background px-3 py-2 pr-11 text-sm text-foreground outline-none transition focus:border-primary"
 />
 <input
 type="date"
 aria-label={t("app.enterprise.org.founded")}
 max={new Date().toISOString().slice(0, 10)}
 value={
 /^\d{4}$/.test(organizationForm.yearFounded)
 ? `${organizationForm.yearFounded}-01-01`
 : ""
 }
 onChange={(event) => {
 if (event.target.value) {
 updateOrganizationField("yearFounded", event.target.value.slice(0, 4));
 }
 }}
 className="absolute inset-y-0 right-0 w-11 cursor-pointer opacity-0"
 />
 <svg
 viewBox="0 0 24 24"
 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
 fill="none"
 stroke="currentColor"
 strokeWidth="1.7"
 >
 <rect x="3" y="5" width="18" height="16" rx="2" />
 <path d="M8 3v4M16 3v4M3 10h18" strokeLinecap="round" />
 </svg>
 </div>
 ) : (
 <input
 type={type}
 value={organizationForm[key]}
 min={type === "number" ? 0 : undefined}
 onChange={(event) => updateOrganizationField(key, event.target.value)}
 className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary"
 />
 )}
 </label>
 ))}
 <label className="space-y-1 text-xs font-medium text-muted-foreground sm:col-span-2">
 <span>{t("app.enterprise.org.description")}</span>
 <textarea
 rows={3}
 value={organizationForm.description}
 onChange={(event) => updateOrganizationField("description", event.target.value)}
 className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary"
 />
 </label>
 <div className="flex items-center gap-3 sm:col-span-2">
 <button
 type="button"
 className="ys-btn-primary px-4 py-2 text-sm"
 disabled={organizationSaving}
 onClick={() => void saveOrganization()}
 >
 {organizationSaving
 ? t("app.enterprise.org.saving")
 : t("app.enterprise.org.save")}
 </button>
 {organizationError && <span className="text-xs text-red-600">{organizationError}</span>}
 </div>
 </div>
 ) : (
 <>
 <ul className="mt-3 divide-y divide-border text-sm text-foreground">
 <li className="flex items-center justify-between gap-6 py-2">
 <span className="inline-flex items-center gap-1.5 text-muted-foreground"><svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 20V4h8v16M12 8h8v12" strokeLinecap="round"/><path d="M7 8h2M7 12h2M7 16h2M15 12h2M15 16h2" strokeLinecap="round"/></svg>{t("app.enterprise.org.name")}</span>
 <span className="font-medium">{orgDetail?.shortName || orgDetail?.name || org?.name || "—"}</span>
 </li>
 <li className="flex items-center justify-between gap-6 py-2">
 <span className="inline-flex items-center gap-1.5 text-muted-foreground"><svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round"/></svg>{t("app.enterprise.org.serviceType")}</span>
 <span className="font-medium">{orgDetail?.service || orgDetail?.serviceType || org?.serviceType || "—"}</span>
 </li>
 <li className="flex items-center justify-between gap-6 py-2">
 <span className="inline-flex items-center gap-1.5 text-muted-foreground"><svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 7 10-7" strokeLinecap="round"/></svg>{t("app.enterprise.org.email")}</span>
 <span className="font-medium">{orgDetail?.email || org?.email || "—"}</span>
 </li>
 <li className="flex items-start justify-between gap-6 py-2">
 <span className="inline-flex items-start gap-1.5 pt-0.5 text-muted-foreground"><svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="9"/><path d="M12 8v1M12 12v4" strokeLinecap="round"/></svg>{t("app.enterprise.org.description")}</span>
 <span className="max-w-[60%] text-right font-medium">{orgDetail?.description || org?.description || "—"}</span>
 </li>
 <li className="flex items-center justify-between gap-6 py-2">
 <span className="inline-flex items-center gap-1.5 text-muted-foreground"><svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 10h8M8 14h5" strokeLinecap="round"/></svg>{t("app.enterprise.org.legalForm")}</span>
 <span className="font-medium">{orgDetail?.legalForm || org?.legalForm || "—"}</span>
 </li>
 <li className="flex items-center justify-between gap-6 py-2">
 <span className="inline-flex items-center gap-1.5 text-muted-foreground"><svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 9h16M4 15h16M10 3l-2 18M16 3l-2 18" strokeLinecap="round"/></svg>{t("app.enterprise.org.taxNumber")}</span>
 <span className="font-medium">{orgDetail?.taxNumber || org?.taxNumber || "—"}</span>
 </li>
 <li className="flex items-center justify-between gap-6 py-2">
 <span className="inline-flex items-center gap-1.5 text-muted-foreground"><svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" strokeLinecap="round"/></svg>{t("app.enterprise.org.businessReg")}</span>
 <span className="font-medium">{orgDetail?.businessRegistrationNumber || org?.businessRegistrationNumber || "—"}</span>
 </li>
 <li className="flex items-center justify-between gap-6 py-2">
 <span className="inline-flex items-center gap-1.5 text-muted-foreground"><svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8z" strokeLinecap="round"/><path d="M6 20v-1a6 6 0 0 1 12 0v1" strokeLinecap="round"/></svg>{t("app.enterprise.org.ceo")}</span>
 <span className="font-medium">{orgDetail?.ceoName || org?.ceoName || "—"}</span>
 </li>
 <li className="flex items-center justify-between gap-6 py-2">
 <span className="inline-flex items-center gap-1.5 text-muted-foreground"><svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round"/></svg>{t("app.enterprise.org.founded")}</span>
 <span className="font-medium">
 {orgDetail?.yearFounded ||
 org?.yearFounded ||
 "—"}
 </span>
 </li>
 <li className="flex items-center justify-between gap-6 py-2">
 <span className="inline-flex items-center gap-1.5 text-muted-foreground"><svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round"/></svg>{t("app.enterprise.org.employees")}</span>
 <span className="font-medium">{orgDetail?.numberOfEmployees ?? org?.numberOfEmployees ?? "—"}</span>
 </li>
 </ul>
 {organizationSuccess && <div className="mt-3 text-xs text-emerald-600">{organizationSuccess}</div>}
 {organizationError && <div className="mt-3 text-xs text-red-600">{organizationError}</div>}
 </>
 )}
 </section>

 <section className="ys-card p-5">
 <div className="flex items-center justify-between gap-3">
 <div className="ys-section-title">{t("app.enterprise.settings.title")}</div>
 <div className="flex items-center gap-2">
 {isEditingSettings && (
 <button
 type="button"
 className="ys-btn-secondary px-3 py-1.5 text-xs"
 onClick={() => {
 setIsEditingSettings(false);
 setSettingsForm(settingsToForm(settings));
 setSettingsError("");
 }}
 >
 {t("app.enterprise.settings.cancel")}
 </button>
 )}
 <button
 type="button"
 className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-card text-emerald-700 transition hover:border-emerald-300 hover:text-emerald-800 dark:text-emerald-300"
 aria-label={t("app.enterprise.settings.edit")}
 onClick={() => {
 setIsEditingSettings((previous) => !previous);
 setSettingsError("");
 setSettingsSuccess("");
 }}
 >
 <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
 <path d="M4 20h4l11-11-4-4L4 16v4z" strokeLinecap="round" />
 <path d="M14 6l4 4" strokeLinecap="round" />
 </svg>
 </button>
 </div>
 </div>
 {isEditingSettings ? (
 <div className="mt-4 space-y-4">
 <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
 <label className="space-y-1 text-xs font-medium text-muted-foreground">
 <span>{t("app.enterprise.settings.vatLength")}</span>
 <input
 type="number"
 min={1}
 max={32}
 value={settingsForm.lengthOfVatInvoiceNumber}
 onChange={(event) => updateSettingsField("lengthOfVatInvoiceNumber", event.target.value)}
 className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary"
 />
 </label>
 <label className="space-y-1 text-xs font-medium text-muted-foreground">
 <span>{t("app.enterprise.settings.vatPrefix")}</span>
 <input
 value={settingsForm.prefixOfVatInvoiceNumber}
 onChange={(event) => updateSettingsField("prefixOfVatInvoiceNumber", event.target.value)}
 className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary"
 />
 </label>
 <label className="space-y-1 text-xs font-medium text-muted-foreground">
 <span>{t("app.enterprise.settings.grantableDiscount")}</span>
 <input
 type="number"
 min={0}
 max={100}
 step="0.01"
 value={settingsForm.grantableDiscountRate}
 onChange={(event) => updateSettingsField("grantableDiscountRate", event.target.value)}
 className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary"
 />
 </label>
 <label className="space-y-1 text-xs font-medium text-muted-foreground">
 <span>{t("app.enterprise.settings.paperFormat")}</span>
 <select
 value={settingsForm.paperFormat}
 onChange={(event) => updateSettingsField("paperFormat", event.target.value)}
 className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary"
 >
 <option value="A4">A4</option>
 <option value="A5">A5</option>
 <option value="LETTER">Letter</option>
 </select>
 </label>
 <label className="space-y-1 text-xs font-medium text-muted-foreground">
 <span>{t("app.enterprise.settings.currency")}</span>
 <input
 maxLength={3}
 value={settingsForm.defaultCurrency}
 onChange={(event) => updateSettingsField("defaultCurrency", event.target.value)}
 className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm uppercase text-foreground outline-none transition focus:border-primary"
 />
 </label>
 <label className="space-y-1 text-xs font-medium text-muted-foreground">
 <span>{t("app.enterprise.settings.legalIdentity")}</span>
 <input
 value={settingsForm.legalIdentity}
 onChange={(event) => updateSettingsField("legalIdentity", event.target.value)}
 className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary"
 />
 </label>
 <label className="space-y-1 text-xs font-medium text-muted-foreground sm:col-span-2">
 <span>{t("app.enterprise.settings.taxIdentifier")}</span>
 <input
 value={settingsForm.taxIdentifier}
 onChange={(event) => updateSettingsField("taxIdentifier", event.target.value)}
 className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary"
 />
 </label>
 </div>
 <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
 {([
 ["authorizeExceptionalDiscount", "app.enterprise.settings.allowDiscounts"],
 ["negotiateSellingPrice", "app.enterprise.settings.negotiatePrice"],
 ["sellingPriceIncludeVat", "app.enterprise.settings.priceIncludesVat"],
 ["printLogo", "app.enterprise.settings.printLogo"],
 ["lowStockAlert", "app.enterprise.settings.lowStockAlerts"],
 ["preventiveMaintenanceAlert", "app.enterprise.settings.maintenanceAlerts"],
 ["requireSalesOrderApproval", "app.enterprise.settings.salesApproval"],
 ["requireReturnApproval", "app.enterprise.settings.returnApproval"],
 ] as const satisfies ReadonlyArray<readonly [BooleanSettingsKey, TranslationKey]>).map(([key, label]) => (
 <label
 key={key}
 className="flex min-h-10 items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-foreground"
 >
 <input
 type="checkbox"
 checked={Boolean(settingsForm[key])}
 onChange={(event) => updateSettingsField(key, event.target.checked)}
 className="h-4 w-4 accent-emerald-600"
 />
 <span>{t(label)}</span>
 </label>
 ))}
 </div>
 <div className="flex items-center gap-3">
 <button
 type="button"
 className="ys-btn-primary px-4 py-2 text-sm"
 disabled={settingsSaving}
 onClick={() => void saveSettings()}
 >
 {settingsSaving
 ? t("app.enterprise.settings.saving")
 : t("app.enterprise.settings.save")}
 </button>
 {settingsError && <span className="text-xs text-red-600">{settingsError}</span>}
 </div>
 </div>
 ) : settings ? (
 <>
 <ul className="mt-3 divide-y divide-border text-sm text-foreground">
 <li className="flex items-center justify-between gap-6 py-2">
 <span className="text-muted-foreground">{t("app.enterprise.settings.currency")}</span>
 <span className="font-medium">{settings.defaultCurrency || "XAF"}</span>
 </li>
 <li className="flex items-center justify-between gap-6 py-2">
 <span className="text-muted-foreground">{t("app.enterprise.settings.vatLength")}</span>
 <span className="font-medium">{settings.lengthOfVatInvoiceNumber ?? "—"}</span>
 </li>
 <li className="flex items-center justify-between gap-6 py-2">
 <span className="text-muted-foreground">{t("app.enterprise.settings.vatPrefix")}</span>
 <span className="font-medium">{settings.prefixOfVatInvoiceNumber || "—"}</span>
 </li>
 <li className="flex items-center justify-between gap-6 py-2">
 <span className="text-muted-foreground">{t("app.enterprise.settings.allowDiscounts")}</span>
 <span className="font-medium">
 {settings.authorizeExceptionalDiscount ? t("app.enterprise.settings.yes") : t("app.enterprise.settings.no")}
 </span>
 </li>
 <li className="flex items-center justify-between gap-6 py-2">
 <span className="text-muted-foreground">{t("app.enterprise.settings.grantableDiscount")}</span>
 <span className="font-medium">{settings.grantableDiscountRate ?? "—"}</span>
 </li>
 <li className="flex items-center justify-between gap-6 py-2">
 <span className="text-muted-foreground">{t("app.enterprise.settings.lowStockAlerts")}</span>
 <span className="font-medium">
 {settings.lowStockAlert ? t("app.enterprise.settings.yes") : t("app.enterprise.settings.no")}
 </span>
 </li>
 <li className="flex items-center justify-between gap-6 py-2">
 <span className="text-muted-foreground">{t("app.enterprise.settings.paperFormat")}</span>
 <span className="font-medium">{settings.paperFormat || "A4"}</span>
 </li>
 <li className="flex items-center justify-between gap-6 py-2">
 <span className="text-muted-foreground">{t("app.enterprise.settings.salesApproval")}</span>
 <span className="font-medium">
 {settings.requireSalesOrderApproval ? t("app.enterprise.settings.yes") : t("app.enterprise.settings.no")}
 </span>
 </li>
 <li className="flex items-center justify-between gap-6 py-2">
 <span className="text-muted-foreground">{t("app.enterprise.settings.returnApproval")}</span>
 <span className="font-medium">
 {settings.requireReturnApproval ? t("app.enterprise.settings.yes") : t("app.enterprise.settings.no")}
 </span>
 </li>
 </ul>
 {settingsSuccess && <div className="mt-3 text-xs text-emerald-600">{settingsSuccess}</div>}
 {settingsError && <div className="mt-3 text-xs text-red-600">{settingsError}</div>}
 </>
 ) : (
 <div className="mt-3 text-sm text-muted-foreground">
 {t("app.enterprise.settings.empty")}
 </div>
 )}
 </section>

 <section className="ys-card p-5">
 <div className="ys-section-title">
 {t("app.enterprise.businessActor.title")}
 </div>
 <div className="mt-3 flex items-center justify-between gap-3">
 <div className="text-xs text-muted-foreground">{t("app.profile.actor.subtitle")}</div>
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
 setActorError("");
 setActorSuccess("");
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

 {!isEditingActor ? (
 <ul className="mt-3 divide-y divide-border text-sm text-foreground">
 <li className="flex items-center justify-between gap-6 py-2">
 <span className="inline-flex items-center gap-1.5 text-muted-foreground"><svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 20V4h8v16M12 8h8v12" strokeLinecap="round"/><path d="M7 8h2M7 12h2M7 16h2M15 12h2M15 16h2" strokeLinecap="round"/></svg>{t("app.profile.actor.name")}</span>
 <span className="font-medium">{actor?.name || "—"}</span>
 </li>
 <li className="flex items-center justify-between gap-6 py-2">
 <span className="inline-flex items-center gap-1.5 text-muted-foreground"><svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M6 10h4M6 14h2" strokeLinecap="round"/><circle cx="15" cy="10" r="2"/><path d="M13 14h4" strokeLinecap="round"/></svg>{t("app.profile.actor.niu")}</span>
 <span className="font-medium">{actor?.niu || "—"}</span>
 </li>
 <li className="flex items-center justify-between gap-6 py-2">
 <span className="inline-flex items-center gap-1.5 text-muted-foreground"><svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 10h8M8 14h5" strokeLinecap="round"/></svg>{t("app.profile.actor.tradeRegistry")}</span>
 <span className="font-medium">{actor?.tradeRegistryNumber || "—"}</span>
 </li>
 <li className="flex items-center justify-between gap-6 py-2">
 <span className="inline-flex items-center gap-1.5 text-muted-foreground"><svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="9"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" strokeLinecap="round"/></svg>{t("app.profile.actor.website")}</span>
 <span className="font-medium">{actor?.website || "—"}</span>
 </li>
 <li className="flex items-center justify-between gap-6 py-2">
 <span className="inline-flex items-center gap-1.5 text-muted-foreground"><svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 2.07 4.18 2 2 0 0 1 4.07 2h3a2 2 0 0 1 2 1.72c.13 1 .37 1.97.71 2.9a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.18-1.18a2 2 0 0 1 2.11-.45c.93.34 1.9.58 2.9.71A2 2 0 0 1 22 16.92z" strokeLinecap="round"/></svg>{t("app.profile.actor.phone")}</span>
 <span className="font-medium">{actor?.contactPhone || "—"}</span>
 </li>
 <li className="flex items-start justify-between gap-6 py-2">
 <span className="inline-flex items-start gap-1.5 pt-0.5 text-muted-foreground"><svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 12L12 3l9 9" strokeLinecap="round"/><path d="M9 21V12h6v9" strokeLinecap="round"/><path d="M3 12v9h18v-9" strokeLinecap="round"/></svg>{t("app.profile.actor.privateAddress")}</span>
 <span className="max-w-[60%] text-right font-medium">{actor?.privateAddress || "—"}</span>
 </li>
 <li className="flex items-start justify-between gap-6 py-2">
 <span className="inline-flex items-start gap-1.5 pt-0.5 text-muted-foreground"><svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" strokeLinecap="round"/><circle cx="12" cy="10" r="3"/></svg>{t("app.profile.actor.businessAddress")}</span>
 <span className="max-w-[60%] text-right font-medium">{actor?.businessAddress || "—"}</span>
 </li>
 <li className="flex items-start justify-between gap-6 py-2">
 <span className="inline-flex items-start gap-1.5 pt-0.5 text-muted-foreground"><svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" strokeLinecap="round"/><line x1="7" y1="7" x2="7.01" y2="7" strokeLinecap="round"/></svg>{t("app.profile.actor.profile")}</span>
 <span className="max-w-[60%] text-right font-medium">{actor?.businessProfile || "—"}</span>
 </li>
 <li className="flex items-start justify-between gap-6 py-2">
 <span className="inline-flex items-center gap-1.5 text-muted-foreground">
 <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="9"/><path d="M9 9h1.5a1.5 1.5 0 0 1 0 3H9m0-3v6m0-3h3" strokeLinecap="round"/></svg>
 Currency
 </span>
 <span className="font-medium">{actor?.currency || "XAF"}</span>
 </li>
 </ul>
 ) : (
 <>
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
 <label className="text-sm text-muted-foreground">
 Currency
 <select
 value={actorForm.currency || "XAF"}
 onChange={(e) => updateActorField("currency", e.target.value)}
 className="ys-input mt-1"
 >
 <option value="XAF">XAF — CFA Franc (BEAC)</option>
 <option value="XOF">XOF — CFA Franc (BCEAO)</option>
 <option value="EUR">EUR — Euro</option>
 <option value="USD">USD — US Dollar</option>
 <option value="GBP">GBP — British Pound</option>
 <option value="NGN">NGN — Nigerian Naira</option>
 <option value="GHS">GHS — Ghanaian Cedi</option>
 <option value="MAD">MAD — Moroccan Dirham</option>
 <option value="EGP">EGP — Egyptian Pound</option>
 <option value="ZAR">ZAR — South African Rand</option>
 </select>
 </label>
 </div>

 <div className="mt-4 flex flex-wrap items-center gap-3">
 <button
 type="button"
 onClick={saveActorProfile}
 disabled={actorSaving}
 className="ys-btn-primary px-4 py-2 text-sm disabled:opacity-60"
 >
 {actorSaving ? t("app.profile.actor.saving") : t("app.profile.actor.save")}
 </button>
 {actorSuccess && <div className="text-sm text-emerald-600">{actorSuccess}</div>}
 {actorError && <div className="text-sm text-red-600">{actorError}</div>}
 </div>
 </>
 )}
 </section>

 <section className="ys-card p-5">
 <div className="ys-section-title">
 {t("app.enterprise.compliance.title")}
 </div>
 <p className="mt-3 text-sm text-muted-foreground">
 {t("app.enterprise.compliance.subtitle")}
 </p>
 <Link href="/app/admin" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-300">
 {t("app.enterprise.compliance.cta")}
 <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
 <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" />
 </svg>
 </Link>
 </section>

 <section className="ys-card p-5">
 <div className="ys-section-title">
 {t("app.enterprise.plan.title")}
 </div>
 <div className="mt-3 flex items-center justify-between gap-3">
 <div className="text-sm text-muted-foreground">
 {t("app.enterprise.plan.current")}: <span className="font-semibold">{planLabel}</span>
 </div>
 <div className="flex items-center gap-2">
 {isEditingPlan && (
 <button
 type="button"
 onClick={() => {
 setIsEditingPlan(false);
 setPlanValue(user?.plan || "");
 setPlanError("");
 setPlanSuccess("");
 }}
 className="ys-btn-secondary px-3 py-1.5 text-xs"
 >
 {t("app.enterprise.plan.cancel")}
 </button>
 )}
 <button
 type="button"
 onClick={() => setIsEditingPlan((prev) => !prev)}
 aria-label={t("app.enterprise.plan.edit")}
 className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card text-emerald-700 transition hover:border-emerald-300 hover:text-emerald-800 dark:text-emerald-300"
 >
 <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
 <path d="M4 20h4l11-11-4-4L4 16v4z" strokeLinecap="round" />
 <path d="M14 6l4 4" strokeLinecap="round" />
 </svg>
 </button>
 </div>
 </div>

 {isEditingPlan && (
 <>
 <div className="mt-4">
 <select
 value={planValue}
 onChange={(e) => setPlanValue(e.target.value as User.plan)}
 className="ys-input"
 >
 <option value={User.plan.FREE_TIER}>{t("app.enterprise.plan.freeTier")}</option>
 <option value={User.plan.FREELANCE}>{t("app.enterprise.plan.freelance")}</option>
 <option value={User.plan.PROFESSIONAL}>{t("app.enterprise.plan.professional")}</option>
 </select>
 </div>

 <div className="mt-4 flex flex-wrap items-center gap-3">
 <button
 type="button"
 onClick={savePlan}
 disabled={planSaving || !planValue || planValue === (user?.plan || "")}
 className="ys-btn-primary px-4 py-2 text-sm disabled:opacity-60"
 >
 {planSaving ? t("app.enterprise.plan.saving") : t("app.enterprise.plan.save")}
 </button>
 {planSuccess && <div className="text-sm text-emerald-600">{planSuccess}</div>}
 {planError && <div className="text-sm text-red-600">{planError}</div>}
 </div>
 </>
 )}
 </section>
 </div>
 )}
 </main>
 );
}
