import { z } from "zod";
import { auth } from "./auth";
import { headers } from "next/headers";
import { ROLE_PERMISSIONS, PermissionString } from "./permissions";

export type ActionState<T> = {
  success?: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

type ServerActionOptions<TInput, TOutput> = {
  schema: z.Schema<TInput>;
  requiredPermission?: PermissionString;
  handler: (data: TInput, ctx: { userId: string; role: string }) => Promise<TOutput>;
};

/**
 * createSafeAction
 * Wraps a Next.js Server Action to enforce Authentication, Authorization, and Validation.
 * Usage:
 * export const updateDiscount = createSafeAction({
 *   schema: updateDiscountSchema,
 *   requiredPermission: PERMISSIONS.DISCOUNT_UPDATE,
 *   handler: async (data, ctx) => { ... }
 * });
 */
export function createSafeAction<TInput, TOutput>({
  schema,
  requiredPermission,
  handler,
}: ServerActionOptions<TInput, TOutput>) {
  return async (input: TInput): Promise<ActionState<TOutput>> => {
    try {
      // 1. Authenticate
      const session = await auth.api.getSession({
        headers: await headers(),
      });

      if (!session || !session.user) {
        return { error: "Unauthorized: Please log in." };
      }

      // User role comes from the database via Better Auth's additionalFields config
      const role = session.user.role || "User";

      // 2. Authorize
      if (requiredPermission) {
        const userPermissions = ROLE_PERMISSIONS[role] || [];
        if (!userPermissions.includes(requiredPermission)) {
          return { error: `Forbidden: Missing permission ${requiredPermission}` };
        }
      }

      // 3. Validate
      const validationResult = schema.safeParse(input);
      if (!validationResult.success) {
        const fieldErrors = validationResult.error.flatten().fieldErrors as Record<string, string[]>;
        const errorMessages = Object.values(fieldErrors).flat().join(", ");
        return {
          error: errorMessages || "Invalid input.",
          fieldErrors,
        };
      }

      // 4. Act (Handler is responsible for the actual operation and calling the audit logger)
      const result = await handler(validationResult.data, {
        userId: session.user.id,
        role: role,
      });

      return { success: true, data: result };
    } catch (error: any) {
      console.error("Action error:", error);
      return { error: error.message || "An unexpected error occurred." };
    }
  };
}
