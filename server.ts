import { ENV } from './src/config/env';
import  app  from './src/app'

const PORT = ENV.PORT;

app.listen(PORT, (): void => {
    console.log("server went live on port 3000 ");
})
