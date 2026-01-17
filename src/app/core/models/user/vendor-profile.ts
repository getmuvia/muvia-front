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
    description: string;
    logoUrl: string | null;
    coverImage: string | null;
    aboutMe: string | null;
    socialLinks: SocialLink[] | null;
    businessHours: BusinessHours | null;
    isVerified?: boolean;
}

export interface VendorResponse {
    id: string;
    role: string;
    createdAt: string;
    vendorProfile: VendorProfile;
}
