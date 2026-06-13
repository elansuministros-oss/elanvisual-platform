# BASE DE DATOS MAESTRA ELANKAV PLATFORM

## EMPRESAS

Representa cada unidad de negocio.

Campos:

* id
* nombre
* codigo
* descripcion
* logo
* color_principal
* dominio
* estado
* fecha_creacion

Ejemplos:

* ELANPET
* ELAN SUMINISTROS
* ELANKAV CENTER
* ELANKAV SOLAR
* ABADON

---

## ROLES

Campos:

* id
* nombre
* descripcion
* nivel

Roles:

* Administrador General
* Administrador Unidad
* Vendedor
* Veterinaria
* Afiliado
* Proveedor
* Cliente
* Operador IA

---

## USUARIOS

Campos:

* id
* empresa_id
* rol_id
* nombre
* correo
* telefono
* password_hash
* activo
* fecha_creacion

---

## CONTACTOS

Base única de CRM.

Campos:

* id
* tipo
* nombre
* empresa
* encargado
* telefono
* telefono_secundario
* correo
* direccion
* ciudad
* pais
* origen
* estado
* responsable_id
* fecha_registro

Tipos:

* Cliente
* Veterinaria
* Afiliado
* Vendedor
* Proveedor
* Aliado Comercial

---

## PRODUCTOS

Campos:

* id
* empresa_id
* categoria
* subcategoria
* familia
* producto
* variante
* descripcion
* precio
* estado

---

## PEDIDOS

Campos:

* id
* empresa_id
* cliente_id
* responsable_id
* fecha
* estado
* subtotal
* descuento
* total

---

## COTIZACIONES

Campos:

* id
* empresa_id
* cliente_id
* responsable_id
* fecha
* estado
* subtotal
* descuento
* total

---

## COMISIONES

Campos:

* id
* afiliado_id
* pedido_id
* porcentaje
* monto
* estado
* fecha

---

## PROVEEDORES

Campos:

* id
* nombre
* categoria
* telefono
* correo
* direccion
* estado

---

## SEGUIMIENTO

Campos:

* id
* contacto_id
* usuario_id
* tipo
* observacion
* fecha

---

## FINANZAS

Campos:

* id
* empresa_id
* tipo
* categoria
* descripcion
* monto
* fecha

Tipos:

* Ingreso
* Egreso
* Comisión
* Anticipo
* Pago
