/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type AppBusinessSettings = {
    id?: string;
    tenantId?: string;
    organizationId?: string;
    agencyId?: string;
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
