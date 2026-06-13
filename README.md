# ELANPET.COM V7

Versión con:

- Catálogo y carrito
- Pago por transferencia
- Anticipo 60% o pago total 100%
- Pedido pendiente de pago como cliente potencial
- Envío de WhatsApp al cliente y copia a ELAN
- Código de seguimiento al confirmar pago
- Página pública de seguimiento
- Panel de producción
- Comisión veterinaria generada hasta pedido entregado
- CMS de identidad, banners, trabajos y cuentas bancarias

## Instalación

```bash
npm install
npm run dev
```

Abrir:

```txt
http://localhost:5173
```

## Usuarios demo

Admin:

```txt
admin@elanpet.com
cualquier contraseña
```

Veterinaria:

```txt
vet@elanpet.com
cualquier contraseña
```

## Flujo de prueba

1. Entrar a Catálogo.
2. Agregar productos al carrito.
3. Seleccionar Anticipo 60% o Pago total.
4. Escribir nombre y WhatsApp del cliente.
5. Presionar Enviar pedido.
6. Entrar como admin.
7. Ir a Pedidos y confirmar pago.
8. Se genera código EP-AAAA-XXXXXX.
9. Ir a Producción para cambiar estados.
10. Entrar a Seguimiento y consultar con código + WhatsApp.
