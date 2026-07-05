# Dominio PURCHASING

## Responsabilidad
System.Collections.Specialized.OrderedDictionary[purchasing]

## Que puede hacer
- Coordinar sus paginas, componentes, servicios, motores, resolvers, adapters y tipos internos.
- Consumir datos de otros dominios solo mediante servicios, resolvers o adapters aprobados.
- Exponer contratos claros para que otros dominios lo consuman sin depender de su UI.

## Que no puede hacer
- No debe contener logica de negocio de otro dominio.
- No debe modificar rutas globales ni reemplazar pantallas V1 durante esta etapa.
- No debe acceder a Supabase, Storage o CORE directamente desde componentes UI.
- No debe recalcular datos aprobados por otro motor propietario.

## Dominios que puede consumir
suppliers, inventory, orders, finance

## Dominios que nunca debe importar directamente
No debe importar UI de otros dominios, paginas legacy directas, App.jsx, clientes de infraestructura sin servicio del dominio, ni motores que pertenezcan a otro dominio sin resolver/adaptador aprobado.
