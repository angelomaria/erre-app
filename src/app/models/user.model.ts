import {Timestamp} from "@angular/fire/firestore";

export interface User {
    id?: string;
    roles: string;
    firstname: string;
    lastname: string;
    email: string;
    phone_number?: string;
    job_position?: string;
    job_address?: string;
    init_date?: Timestamp | null;
    dismiss_date?: Timestamp | null;
    enabled: boolean;
    createdAt: Timestamp;
    photoUrl?: string;
    proroga_date1?: Timestamp | null;
    proroga_date2?: Timestamp | null;
    proroga_date3?: Timestamp | null;
    fine_proroga_date1?: Timestamp | null;
    fine_proroga_date2?: Timestamp | null;
    fine_proroga_date3?: Timestamp | null;
    company_id: string[];
    actual_company_id?: string;
    end_user: boolean;
    terms_accepted?: boolean;
    marketing_consent?: boolean;
}
