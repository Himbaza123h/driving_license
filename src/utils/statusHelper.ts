export const LICENSE_STATUS = {
  DRAFT: 'DRAFT',
  PENDING: 'PENDING',
  UNDER_REVIEW: 'UNDER_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED'
} as const;

export type LicenseStatus = typeof LICENSE_STATUS[keyof typeof LICENSE_STATUS];

export const normalizeStatus = (status: string | null | undefined): LicenseStatus | null => {
  if (!status) return null;
  const upperStatus = status.toUpperCase() as LicenseStatus;
  
  // Validate against allowed values
  const allowedStatuses = Object.values(LICENSE_STATUS) as string[];
  if (!allowedStatuses.includes(upperStatus)) {
    throw new Error(`Invalid status: ${status}. Allowed values: ${allowedStatuses.join(', ')}`);
  }
  
  return upperStatus;
};

export const isValidStatus = (status: string | null | undefined): boolean => {
  try {
    normalizeStatus(status);
    return true;
  } catch {
    return false;
  }
}