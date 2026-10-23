
import { router } from '../../trpc';
import { helloWorldAction } from '../hello-world/hello-world.actions';

// berfungsi untuk grouping procedure yang sudah didefinisikan di file lain
// sifatnya tergantung, jika router ini hanya memiliki satu procedure 
// maka bisa langsung di export procedure tersebut tanpa perlu membuat router baru

export const helloWorldRouter = router({
    hello: helloWorldAction,
});