import { helloWorldRouter } from './routers/hello-world/hello-world.router';
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
});
  
// optional untuk standalone server
// export const server = createHTTPServer({
//   router: appRouter,
// });

// export type dari appRouter untuk digunakan di client
export type AppRouter = typeof appRouter;