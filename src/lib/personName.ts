type PersonName = {
  firstName?: string;
  lastName?: string;
};

export const splitPersonName = (name?: string): PersonName => {
  const parts = name?.trim().split(/\s+/).filter(Boolean) || [];

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" ") || undefined,
  };
};

export const getPersonDisplayName = (person?: PersonName | null) =>
  [person?.firstName, person?.lastName].filter(Boolean).join(" ").trim();
