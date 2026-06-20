export type SendInvitationRequest = {
    email: string;
    role: 'AGENCY_MANAGER' | 'DEPARTMENT_CHIEF' | 'STAFF';
    agencyId?: string;
};
