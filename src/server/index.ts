import { accountRouter } from './routers/account/account.router';
import { billRouter } from './routers/bill/bill.router';
import { closingRouter } from './routers/closing/closing.router';
import { dashboardRouter } from './routers/dashboard/dashboard.router';
import { helloWorldRouter } from './routers/hello-world/hello-world.router';
import { inventoryRouter } from './routers/inventory/inventory.router';
import { productRouter } from './routers/product/product.router';
import { transactionRouter } from './routers/transaction/transaction.router';
import { userRouter } from './routers/user/user.router';
import { router } from './trpc';
// import { procedureName } from './procedureFile'; // import procedure yang sudah didefinisikan di file lain

export const appRouter = router({
    // TODO: add router procedures here later
    // router:  routerName, // contoh penggunaan router yang sudah didefinisikan di file lain

    // api path nya akan menjadi /api/trpc/routerName.procedureName
    // contoh:  api/trpc/helloWorld.hello
    helloWorld: helloWorldRouter,

    user: userRouter,
    product: productRouter,
    inventory: inventoryRouter,
    transaction: transactionRouter,
    account: accountRouter,
    bill: billRouter,
    closing: closingRouter,
    dashboard: dashboardRouter,
});

// optional untuk standalone server
// export const server = createHTTPServer({
//   router: appRouter,
// });

// export type dari appRouter untuk digunakan di client
export type AppRouter = typeof appRouter;