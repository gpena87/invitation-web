# Configuración CORS para Backend (API)

## ¿Por qué? 
En producción, el frontend estático NO puede usar proxy local. El navegador bloqueará llamadas a un dominio diferente a menos que el backend envíe headers CORS correctos.

## Para Express.js

```javascript
import cors from 'cors';

app.use(cors({
  origin: [
    'http://localhost:4200',           // desarrollo local
    'http://localhost:3000',           // si tienes otro puerto local
    'https://tudominio.com'            // reemplazar con tu dominio en producción
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

## Para NestJS

```typescript
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

// En main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: [
      'http://localhost:4200',
      'https://tudominio.com'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  });
  
  await app.listen(3000);
}
bootstrap();
```

## Para Fastify

```typescript
import fastifyCors from '@fastify/cors';

app.register(fastifyCors, {
  origin: [
    'http://localhost:4200',
    'https://tudominio.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
});
```

## Verificar que funciona

```bash
curl -i -X OPTIONS 'https://api.tudominio.com/api/users' \
  -H 'Origin: https://tudominio.com' \
  -H 'Access-Control-Request-Method: POST'
```

Debe retornar headers como:
```
Access-Control-Allow-Origin: https://tudominio.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

## Pasos en tu repo

1. **Accede a tu backend** en Railroad/Cloud donde está hosteada la API.
2. Busca donde importas/usas CORS en tu código.
3. Agrega la configuración anterior según tu framework.
4. Usa esta app en frontend con `npm run build`.
