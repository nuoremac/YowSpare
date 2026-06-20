import { OpenAPI } from "@/lib-tiers/core/OpenAPI";
import { request } from "@/lib-tiers/core/request";
import type { Role } from "@/lib-tiers/models/Role";

export type EnterprisePermission = {
  code: string;
  name: string;
  description?: string;
  module: string;
  scope: string;
  system: boolean;
  assignable: boolean;
  deprecated: boolean;
};

type AdministrationRoleResponse = {
  id?: string;
  code?: string;
  name?: string;
  scopeType?: string;
  permissions?: string[];
};

export type CreateEnterpriseRoleInput = {
  code: string;
  name: string;
  permissions: string[];
};

export type UpdateEnterpriseRoleInput = {
  name: string;
  permissions: string[];
};

const SPARE_PERMISSION_CODES = new Set([
  "administration:roles:read",
  "administration:roles:write",
  "administration:permissions:read",
  "administration:assignments:write",
  "organizations:read",
  "organizations:write",
  "third-parties:read",
  "third-parties:write",
  "products:read",
  "products:write",
  "inventory:read",
  "inventory:write",
  "procurement:read",
  "procurement:write",
  "resources:read",
  "resources:write",
  "settings:read",
  "settings:write",
  "hrm:employee:create",
  "hrm:employee:read",
  "hrm:employee:update",
  "hrm:employee:terminate",
  "hrm:employee:suspend",
  "hrm:employee:reactivate",
]);

const toRole = (role: AdministrationRoleResponse): Role => ({
  id: role.id,
  name: role.name,
  description: role.code,
  permissions: (role.permissions || []).map((authority) => ({ authority })),
});

export class EnterpriseRolesService {
  static listPermissions() {
    return request<EnterprisePermission[]>(OpenAPI, {
      method: "GET",
      url: "/administration/permissions",
    }).then((permissions) =>
      (permissions || []).filter(
        (permission) =>
          permission.assignable &&
          !permission.system &&
          !permission.deprecated &&
          SPARE_PERMISSION_CODES.has(permission.code),
      ),
    );
  }

  static create(input: CreateEnterpriseRoleInput) {
    return request<AdministrationRoleResponse>(OpenAPI, {
      method: "POST",
      url: "/administration/roles",
      body: {
        code: input.code,
        name: input.name,
        scopeType: "ORGANIZATION",
        permissions: input.permissions,
      },
      mediaType: "application/json",
    }).then(toRole);
  }

  static async update(roleId: string, input: UpdateEnterpriseRoleInput) {
    await request<AdministrationRoleResponse>(OpenAPI, {
      method: "PATCH",
      url: "/administration/roles/{roleId}",
      path: { roleId },
      body: { name: input.name },
      mediaType: "application/json",
    });

    return request<AdministrationRoleResponse>(OpenAPI, {
      method: "PUT",
      url: "/administration/roles/{roleId}/permissions",
      path: { roleId },
      body: { permissions: input.permissions },
      mediaType: "application/json",
    }).then(toRole);
  }

  static delete(roleId: string) {
    return request<void>(OpenAPI, {
      method: "DELETE",
      url: "/administration/roles/{roleId}",
      path: { roleId },
    });
  }
}
