import env from './src/config/env';
import  app  from './src/app'

const PORT = env.PORT || 3000;

app.listen(PORT, (): void => {
    console.log("server went live on port 3000 ");
})
