import type { UserRole } from '../../auth/models/auth.models';

export interface BusinessHours {
    [day: string]: {
        open: string;
        close: string;
        isClosed?: boolean;
    };
}

export interface SocialLink {
    name: string;
    url: string;
    icon: 'language' | 'instagram' | 'pinterest' | 'facebook' | 'twitter' | 'linkedin';
}

export interface VendorProfile {
    id?: string;
    userId?: string;
    businessName: string;
    description: string | null;
    logoUrl: string | null;
    coverImage: string | null;
    aboutMe: string | null;
    socialLinks: SocialLink[] | null;
    businessHours: BusinessHours | null;
    isVerified?: boolean;
}

export interface BusinessHoursItem {
    open: string;
    close: string;
    isClosed?: boolean;
}

export interface UpdateVendorProfilePayload {
    vendorProfile: {
        businessName?: string;
        description?: string;
        logoUrl?: string;
        coverImage?: string;
        aboutMe?: string;
        socialLinks?: SocialLink[];
        businessHours?: Record<string, BusinessHoursItem>;
    };
}

export interface VendorResponse {
    id: string;
    role: UserRole;
    createdAt: string;
    vendorProfile: VendorProfile;
}
