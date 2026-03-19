console.log("TSX IS WORKING");
import p from './utils/prisma.js';
console.log("PRISMA IMPORTED");
async function test() {
    const users = await p.user.count();
    console.log("USER COUNT:", users);
}
test().catch(console.error);
//# sourceMappingURL=test-connection.js.map