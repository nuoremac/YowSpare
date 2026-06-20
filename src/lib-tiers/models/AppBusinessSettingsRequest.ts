/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Champs modifiables pour les paramètres globaux de l'organisation
 */
export type AppBusinessSettingsRequest = {
    organizationPrefix?: string;
    negotiateSellingPrice?: boolean;
    sellingPriceIncludeVat?: boolean;
    authorizeExceptionalDiscount?: boolean;
    grantableDiscountRate?: number;
    printLogo?: boolean;
    paperFormat?: string;
    lengthOfVatInvoiceNumber?: number;
    prefixOfVatInvoiceNumber?: string;
    lowStockAlert?: boolean;
    preventiveMaintenanceAlert?: boolean;
    defaultCurrency?: string;
    legalIdentity?: string;
    taxIdentifier?: string;
    requireSalesOrderApproval?: boolean;
    requireReturnApproval?: boolean;
};
