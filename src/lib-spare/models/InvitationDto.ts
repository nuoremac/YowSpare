export type InvitationDto = {
    id?: string;
    organizationId?: string;
    organizationName?: string;
    agencyId?: string;
    email?: string;
    role?: 'AGENCY_MANAGER' | 'DEPARTMENT_CHIEF' | 'STAFF';
    token?: string;
    status?: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED';
    invitedBy?: string;
    expiresAt?: string;
    acceptedAt?: string;
    createdAt?: string;
};
