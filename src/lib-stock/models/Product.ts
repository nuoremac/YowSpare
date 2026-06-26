/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MediaAsset } from './MediaAsset';
export type Product = {
    id?: string;
    organizationId?: string;
    sku?: string;
    name?: string;
    description?: string;
    categoryId?: string;
    categoryName?: string;
    unit?: string;
    defaultSalePrice?: number;
    defaultCostPrice?: number;
    minStockLevel?: number;
    maxStockLevel?: number;
    createdAt?: string;
    updatedAt?: string;
    stockable?: boolean;
    perishable?: boolean;
    mediaAssets?: Array<MediaAsset>;
    imageFileId?: string;
    imageUrl?: string;
};
