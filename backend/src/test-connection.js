console.log("TSX IS WORKING");
import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
console.log("PRISMA IMPORTED");
async function test() {
    const users = await p.user.count();
    console.log("USER COUNT:", users);
}
test().catch(console.error);
//# sourceMappingURL=test-connection.js.map