const UNIVERSITY_ID_PREFIXES = ['CE', 'EL', 'C', 'E', 'T', 'L', 'B', 'P'];

export const parseUniversityId = (universityId, role = '') => {
  const normalized = String(universityId || '').trim().toUpperCase();
  const normalizedRole = String(role || '').trim().toLowerCase();

  if (!normalized) {
    return { universityId: '', academicYear: null, departmentCode: null };
  }

  if (normalizedRole === 'teacher' || normalizedRole === 'librarian') {
    return { universityId: normalized, academicYear: null, departmentCode: null };
  }

  const departmentCode = UNIVERSITY_ID_PREFIXES.find((code) => normalized.startsWith(code)) || null;
  if (!departmentCode) {
    return { universityId: normalized, academicYear: null, departmentCode: null };
  }

  const yearDigits = normalized.slice(departmentCode.length, departmentCode.length + 2);
  const academicYear = /^\d{2}$/.test(yearDigits) ? `20${yearDigits}` : null;

  return {
    universityId: normalized,
    academicYear,
    departmentCode,
  };
};

export const formatAcademicYear = (universityId, role = '') => parseUniversityId(universityId, role).academicYear || 'N/A';