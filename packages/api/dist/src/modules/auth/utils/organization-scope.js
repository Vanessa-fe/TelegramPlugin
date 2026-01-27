"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveOrganizationScope = resolveOrganizationScope;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
function resolveOrganizationScope(user, requestedOrganizationId) {
    if (user.role === client_1.UserRole.SUPERADMIN) {
        return requestedOrganizationId ?? undefined;
    }
    if (!user.organizationId) {
        throw new common_1.ForbiddenException('Ce compte n’est associé à aucune organisation');
    }
    if (requestedOrganizationId &&
        requestedOrganizationId !== user.organizationId) {
        throw new common_1.ForbiddenException('Organisation non accessible pour cet utilisateur');
    }
    return user.organizationId;
}
//# sourceMappingURL=organization-scope.js.map