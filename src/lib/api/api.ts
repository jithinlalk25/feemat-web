import axiosInstance from "./axios";
import { API_ENDPOINTS } from "./endpoints";

interface UserProfile {
  _id: string;
  email: string;
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

interface Company {
  _id: string;
  name: string;
  timezone: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

interface Member {
  _id: string;
  email: string;
  companyId: string;
  createdAt: string;
  updatedAt: string;
  groups: Group[];
}

interface Group {
  _id: string;
  name: string;
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

interface GroupWithMembers extends Group {
  members: Member[];
}

interface BulkCreateMemberResponse {
  created: Member[];
  skipped: string[];
}

interface FormField {
  label: string;
  type: string;
  isRequired: boolean;
  options?: FormOption[];
}

interface FormMembers {
  groupIds: string[];
  memberIds: string[];
  _id?: string;
}

interface FormSchedule {
  type: string;
  date?: string;
  time?: string;
  recurringTime?: string;
  weekDays?: number[];
  monthDays?: number[];
  frequency?: string;
  endCondition?: string;
  endDate?: string;
  occurrences?: number;
}

interface FormOption {
  id: string;
  value: string;
}

interface Form {
  _id: string;
  title: string;
  fields: FormField[];
  isActive: boolean;
  companyId: string;
  members: FormMembers;
  schedule: FormSchedule;
  createdAt: string;
  updatedAt: string;
}

interface CreateFormResponse extends Form {
  schedule: {
    type: string;
  };
}

interface UpdateFormData {
  title?: string;
  fields?: FormField[];
  isActive?: boolean;
  members?: FormMembers;
  schedule?: FormSchedule;
}

interface FormResponse {
  id: string;
  title: string;
  fields: {
    id: string;
    label: string;
    type: string;
    isRequired: boolean;
    options?: {
      id: string;
      value: string;
    }[];
  }[];
  formSentId: string;
  memberId: string;
  companyName: string;
  isAnonymous: boolean;
  memberEmail: string;
}

interface FormSubmissionResponse {
  message: string;
  submissionId: string;
}

interface FormSent {
  _id: string;
  formId: string;
  submissionCount: number;
  createdAt: string;
  updatedAt: string;
}

interface FormSubmission {
  _id: string;
  data: Record<
    string,
    {
      type: string;
      value: string | number | string[];
    }
  >;
  isAnonymous: boolean;
  member: {
    _id: string;
    email: string;
  };
}

interface OverviewStats {
  _id: string;
  companyId: string;
  formCount: number;
  formSentCount: number;
  submissionCount: number;
  groupCount: number;
  memberCount: number;
}

class ApiService {
  // GET request
  static async get<T>(endpoint: string): Promise<T> {
    const response = await axiosInstance.get<T>(endpoint);
    return response.data;
  }

  // POST request
  static async post<T>(endpoint: string, data: any): Promise<T> {
    const response = await axiosInstance.post<T>(endpoint, data);
    return response.data;
  }

  // PUT request
  static async put<T>(endpoint: string, data: any): Promise<T> {
    const response = await axiosInstance.put<T>(endpoint, data);
    return response.data;
  }

  // DELETE request
  static async delete<T>(endpoint: string): Promise<T> {
    const response = await axiosInstance.delete<T>(endpoint);
    return response.data;
  }

  // PATCH request
  static async patch<T>(endpoint: string, data: any): Promise<T> {
    const response = await axiosInstance.patch<T>(endpoint, data);
    return response.data;
  }

  static async signup(data: any) {
    return this.post(API_ENDPOINTS.AUTH.SIGNUP, data);
  }

  static async verifyOTP(data: any) {
    return this.post(API_ENDPOINTS.AUTH.VERIFY_OTP, data);
  }

  static async signin(data: any) {
    const response: any = await this.post(API_ENDPOINTS.AUTH.SIGNIN, data);
    if (response.access_token) {
      localStorage.setItem("token", response.access_token);
    }
    if (response.timezone) {
      localStorage.setItem("timezone", response.timezone);
    }
    return response;
  }

  static async getUserProfile(): Promise<UserProfile> {
    return this.get<UserProfile>(API_ENDPOINTS.USER.PROFILE);
  }

  static async getMyCompany(): Promise<Company> {
    return this.get<Company>(API_ENDPOINTS.COMPANY.MY_COMPANY);
  }

  static async signOut() {
    // await this.post("/auth/signout", {});
    localStorage.removeItem("token");
    localStorage.removeItem("timezone");
  }

  static async getMembers(): Promise<Member[]> {
    return this.get<Member[]>(API_ENDPOINTS.MEMBER.LIST);
  }

  static async deleteMembers(
    memberIds: string[]
  ): Promise<{ deletedMembers: number; deletedGroupAssociations: number }> {
    return this.post(API_ENDPOINTS.MEMBER.DELETE, { memberIds });
  }

  static async bulkCreateMembers(
    emails: string[]
  ): Promise<BulkCreateMemberResponse> {
    return this.post<BulkCreateMemberResponse>(
      API_ENDPOINTS.MEMBER.BULK_CREATE,
      { emails }
    );
  }

  static async getGroups(): Promise<GroupWithMembers[]> {
    return this.get<GroupWithMembers[]>(API_ENDPOINTS.MEMBER.GROUPS);
  }

  static async removeFromGroup(groupId: string, memberIds: string[]) {
    return this.post(API_ENDPOINTS.MEMBER.REMOVE_FROM_GROUP, {
      groupId,
      memberIds,
    });
  }

  static async deleteGroup(groupId: string) {
    return this.post(API_ENDPOINTS.MEMBER.DELETE_GROUP, { groupId });
  }

  static async createGroup(name: string, emails: string[] = []) {
    return this.post(API_ENDPOINTS.MEMBER.GROUP_CREATE, { name, emails });
  }

  static async addToGroup(groupId: string, emails: string[]) {
    return this.post(API_ENDPOINTS.MEMBER.ADD_TO_GROUP, {
      groupId,
      emails,
    });
  }

  static async renameGroup(groupId: string, name: string) {
    return this.post(API_ENDPOINTS.MEMBER.RENAME_GROUP, { groupId, name });
  }

  static async getForms(): Promise<Form[]> {
    return this.get<Form[]>(API_ENDPOINTS.FORMS.LIST);
  }

  static async createForm(title: string): Promise<CreateFormResponse> {
    return this.post<CreateFormResponse>(API_ENDPOINTS.FORMS.CREATE, { title });
  }

  static async getFormById(formId: string): Promise<Form> {
    return this.get<Form>(`${API_ENDPOINTS.FORMS.DETAIL}/${formId}`);
  }

  static async updateForm(formId: string, data: UpdateFormData): Promise<Form> {
    return this.patch<Form>(`${API_ENDPOINTS.FORMS.UPDATE}/${formId}`, data);
  }

  static async getFormByLink(linkId: string): Promise<FormResponse> {
    return this.get<FormResponse>(`${API_ENDPOINTS.FORMS.GET_BY_LINK(linkId)}`);
  }

  static async submitForm(
    linkId: string,
    isAnonymous: boolean,
    data: Record<string, any>
  ): Promise<FormSubmissionResponse> {
    return this.post<FormSubmissionResponse>(API_ENDPOINTS.FORMS.SUBMIT, {
      linkId,
      isAnonymous,
      data,
    });
  }

  static async getFormsSent(formId: string): Promise<FormSent[]> {
    return this.get<FormSent[]>(`${API_ENDPOINTS.FORMS.SENT(formId)}`);
  }

  static async getFormSubmissions(
    formSentId: string
  ): Promise<FormSubmission[]> {
    return this.get<FormSubmission[]>(
      `${API_ENDPOINTS.FORMS.SUBMISSIONS(formSentId)}`
    );
  }

  static async getOverviewStats(): Promise<OverviewStats> {
    return this.get<OverviewStats>(API_ENDPOINTS.OVERVIEW.STATS);
  }

  static async sendForm(formId: string): Promise<any> {
    return this.post(`${API_ENDPOINTS.FORMS.SEND(formId)}`, {});
  }
}

export default ApiService;
