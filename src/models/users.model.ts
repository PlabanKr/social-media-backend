import { z } from "zod";

export const UserSchemaCreate = z.object({
    first_name: z.string().min(2).max(255),
    middle_name: z.string().min(2).max(255).optional(),
    last_name: z.string().min(2).max(255),
    email: z.string(),
    password: z.string(),
    dob: z.string().optional(),
    bio: z.string().optional(),
    profile_pic: z.string().optional(),
    is_admin: z.boolean().optional(),
    usr_location: z.string().optional(),
    profile_status: z.enum(["public", "private", "banned"]).optional(),
    social_media_accounts: z.object({
        social_media: z.string(),
    }).optional(),
});