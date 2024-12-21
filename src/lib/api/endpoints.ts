// Central place to store all API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    SIGNUP: "/auth/signup",
    VERIFY_OTP: "/auth/verify-otp",
    SIGNIN: "/auth/signin",
  },
  USER: {
    PROFILE: "/user/profile",
  },
  COMPANY: {
    MY_COMPANY: "/company/my-company",
  },
  MEMBER: {
    LIST: "/member",
    DELETE: "/member/delete",
    BULK_CREATE: "/member/bulk-create",
    GROUPS: "/member/groups",
    DELETE_GROUP: "/member/group/delete",
    GROUP_CREATE: "/member/group",
    REMOVE_FROM_GROUP: "/member/group/remove-members",
    ADD_TO_GROUP: "/member/group/members",
    RENAME_GROUP: "/member/group/rename",
  },
  FORMS: {
    LIST: "/forms",
    CREATE: "/forms",
    DETAIL: "/forms",
    UPDATE: "/forms",
    GET_BY_LINK: (linkId: string) => `/forms/link/${linkId}`,
    SUBMIT: "/forms/submit",
    SENT: (formId: string) => `/forms/${formId}/sent`,
    SUBMISSIONS: (formSentId: string) =>
      `/forms/sent/${formSentId}/submissions`,
    SEND: (formId: string) => `/forms/${formId}/send`,
  },
  OVERVIEW: {
    STATS: "/overview",
  },
  // Add more endpoints as needed
} as const;
