# Diagramas de secuencia

Diagramas basados en los casos de uso del documento "Copia de Proyecto Amelia Artefactosb.pdf".

> Nota: CU02 Recuperar contrasena se omite porque sera ajustado despues.

## CU01 - Iniciar Sesion

```mermaid
sequenceDiagram
    actor Usuario as Administrador/Empleado
    participant UI as LoginPage
    participant Auth as AuthController
    participant Service as AuthService
    participant Repo as EmpleadoRepository
    participant DB as Base de datos

    Usuario->>UI: Ingresa correo y contrasena
    UI->>Auth: POST /auth/login
    Auth->>Service: validarCredenciales(correo, contrasena)
    Service->>Repo: buscar empleado por correo
    Repo->>DB: SELECT empleado, rol y sucursal
    DB-->>Repo: Datos del empleado
    Repo-->>Service: Empleado encontrado
    Service->>Service: Validar contrasena, rol y estado activo
    Service-->>Auth: Sesion del usuario
    Auth-->>UI: AuthResponse
    UI-->>Usuario: Redirige al panel segun rol
```

## CU03 - Configurar perfil de la empresa

```mermaid
sequenceDiagram
    actor Admin as Administrador
    participant UI as ConfiguracionPage
    participant Ctrl as GlobalValueController
    participant Service as GlobalValueService
    participant Repo as GlobalValueRepository
    participant DB as global_values

    Admin->>UI: Abre Configuracion / Datos de Empresa
    UI->>Ctrl: GET /global-values
    Ctrl->>Service: listar()
    Service->>Repo: find activos
    Repo->>DB: SELECT global_values
    DB-->>Repo: Datos fiscales, contacto y logo
    Repo-->>UI: Valores actuales
    Admin->>UI: Presiona Editar y modifica datos
    UI->>UI: Valida RFC, telefono, correo y logo
    UI->>Ctrl: POST/PUT /global-values
    Ctrl->>Service: guardar o actualizar valores
    Service->>Repo: save(valor, updatedBy)
    Repo->>DB: INSERT/UPDATE
    DB-->>Repo: OK
    Ctrl-->>UI: Datos guardados
    UI-->>Admin: Mensaje de confirmacion
```

## CU04 - Registrar sucursal

```mermaid
sequenceDiagram
    actor Admin as Administrador
    participant UI as ConfiguracionPage
    participant Ctrl as SucursalController
    participant Service as SucursalService
    participant Repo as SucursalRepository
    participant DB as sucursal

    Admin->>UI: Selecciona Nueva Sucursal
    UI-->>Admin: Muestra formulario
    Admin->>UI: Captura nombre, direccion, CP, telefono y horario
    UI->>UI: Valida campos, CP, telefono y duplicidad
    UI->>Ctrl: POST /sucursales
    Ctrl->>Service: crearSucursal(request)
    Service->>Repo: validar nombre unico
    Repo->>DB: SELECT por nombre
    DB-->>Repo: Resultado
    Service->>Repo: save(sucursal)
    Repo->>DB: INSERT sucursal
    DB-->>Repo: Sucursal creada
    Ctrl-->>UI: SucursalResponse
    UI-->>Admin: Sucursal creada correctamente
```

## CU05 - Actualizar sucursal

```mermaid
sequenceDiagram
    actor Admin as Administrador
    participant UI as ConfiguracionPage
    participant Ctrl as SucursalController
    participant Service as SucursalService
    participant Repo as SucursalRepository
    participant DB as sucursal

    Admin->>UI: Selecciona Editar en una sucursal
    UI-->>Admin: Muestra datos actuales
    Admin->>UI: Modifica informacion
    UI->>UI: Valida campos y duplicidad de nombre
    UI->>Ctrl: PUT /sucursales/{id}
    Ctrl->>Service: actualizarSucursal(id, request)
    Service->>Repo: buscarPorId(id)
    Repo->>DB: SELECT sucursal
    DB-->>Repo: Sucursal
    Service->>Repo: save(sucursal actualizada)
    Repo->>DB: UPDATE sucursal
    Ctrl-->>UI: Sucursal actualizada
    UI-->>Admin: Mensaje de confirmacion
```

## CU06 - Registrar empleado

```mermaid
sequenceDiagram
    actor Admin as Administrador
    participant UI as ConfiguracionPage
    participant Ctrl as EmpleadoController
    participant Service as EmpleadoService
    participant Repo as EmpleadoRepository
    participant DB as empleado

    Admin->>UI: Selecciona sucursal y Nuevo Empleado
    UI-->>Admin: Muestra formulario
    Admin->>UI: Captura datos, rol, horario y contrasena
    UI->>UI: Valida campos, telefono y contrasena
    UI->>Ctrl: POST /empleados
    Ctrl->>Service: crearEmpleado(request)
    Service->>Repo: validar correo unico
    Repo->>DB: SELECT por correo
    DB-->>Repo: Resultado
    Service->>Service: Encriptar contrasena
    Service->>Repo: save(empleado)
    Repo->>DB: INSERT empleado
    Ctrl-->>UI: Empleado creado
    UI-->>Admin: Empleado guardado correctamente
```

## CU07 - Actualizar datos de empleado

```mermaid
sequenceDiagram
    actor Admin as Administrador
    participant UI as ConfiguracionPage
    participant Ctrl as EmpleadoController
    participant Service as EmpleadoService
    participant Repo as EmpleadoRepository
    participant DB as empleado

    Admin->>UI: Selecciona Editar empleado
    UI-->>Admin: Muestra formulario con datos actuales
    Admin->>UI: Actualiza datos, rol, sucursal o nueva contrasena
    UI->>UI: Valida datos obligatorios
    UI->>Ctrl: PUT /empleados/{id}
    Ctrl->>Service: actualizarEmpleado(id, request)
    Service->>Repo: buscarPorId(id)
    Repo->>DB: SELECT empleado
    DB-->>Repo: Empleado
    opt Nueva contrasena capturada
        Service->>Service: Encriptar nueva contrasena
    end
    Service->>Repo: save(empleado actualizado)
    Repo->>DB: UPDATE empleado
    Ctrl-->>UI: Empleado actualizado
    UI-->>Admin: Mensaje de confirmacion
```

## CU08 - Eliminar empleado

```mermaid
sequenceDiagram
    actor Admin as Administrador
    participant UI as ConfiguracionPage
    participant Ctrl as EmpleadoController
    participant Corte as CorteCajaController
    participant Service as EmpleadoService
    participant Repo as EmpleadoRepository
    participant DB as empleado

    Admin->>UI: Selecciona Eliminar en empleado
    alt Empleado ligado a varias sucursales
        UI-->>Admin: Modal Quitar empleado de sucursal
        Admin->>UI: Confirma
        UI->>UI: Quita relacion local con la sucursal seleccionada
        UI-->>Admin: Empleado quitado de esta sucursal
    else Empleado solo en una sucursal
        UI-->>Admin: Modal advierte que no se podra recuperar
        Admin->>UI: Confirma eliminacion
        UI->>Corte: GET cortes por empleado
        Corte-->>UI: Cajas del empleado
        UI->>Ctrl: DELETE /empleados/{id}
        Ctrl->>Service: eliminarEmpleado(id, deletedBy)
        Service->>Repo: buscarPorId(id)
        Repo->>DB: SELECT empleado
        Service->>Repo: baja logica
        Repo->>DB: UPDATE deleted_at, deleted_by
        Ctrl-->>UI: Eliminado
        UI-->>Admin: Empleado eliminado correctamente
    end
```

## CU09 - Registrar cliente

```mermaid
sequenceDiagram
    actor Admin as Administrador
    participant UI as ClientesPage
    participant Ctrl as ClienteController
    participant Service as ClienteService
    participant Repo as ClienteRepository
    participant DB as cliente

    Admin->>UI: Selecciona Nuevo Cliente
    UI-->>Admin: Muestra formulario
    Admin->>UI: Captura datos, tipo y credito
    UI->>UI: Valida campos, telefono, RFC y limite de credito
    UI->>Ctrl: POST /clientes
    Ctrl->>Service: crearCliente(request)
    Service->>Repo: validar RFC unico
    Repo->>DB: SELECT por RFC
    DB-->>Repo: Resultado
    Service->>Repo: save(cliente)
    Repo->>DB: INSERT cliente
    Ctrl-->>UI: Cliente creado
    UI-->>Admin: Cliente registrado correctamente
```

## CU10 - Actualizar datos del cliente

```mermaid
sequenceDiagram
    actor Admin as Administrador
    participant UI as ClientesPage
    participant Ctrl as ClienteController
    participant Service as ClienteService
    participant Repo as ClienteRepository
    participant DB as cliente

    Admin->>UI: Busca y selecciona Editar cliente
    UI-->>Admin: Muestra informacion del cliente
    Admin->>UI: Modifica datos
    UI->>UI: Valida campos y RFC
    UI->>Ctrl: PUT /clientes/{id}
    Ctrl->>Service: actualizarCliente(id, request)
    Service->>Repo: buscarPorId(id)
    Repo->>DB: SELECT cliente
    DB-->>Repo: Cliente
    Service->>Repo: save(cliente actualizado)
    Repo->>DB: UPDATE cliente
    Ctrl-->>UI: Cliente actualizado
    UI-->>Admin: Mensaje de confirmacion
```

## CU11 - Consultar catalogo de clientes

```mermaid
sequenceDiagram
    actor Usuario as Administrador/Empleado
    participant UI as ClientesPage
    participant Ctrl as ClienteController
    participant Service as ClienteService
    participant Repo as ClienteRepository
    participant DB as cliente

    Usuario->>UI: Abre modulo Clientes
    UI->>Ctrl: GET /clientes
    Ctrl->>Service: listarClientes()
    Service->>Repo: find activos
    Repo->>DB: SELECT clientes
    DB-->>Repo: Lista de clientes
    Repo-->>UI: Clientes
    Usuario->>UI: Busca o filtra por tipo/credito
    UI->>UI: Filtra resultados
    UI-->>Usuario: Muestra coincidencias y detalle
```

## CU12 - Alta de materiales

```mermaid
sequenceDiagram
    actor Admin as Administrador
    participant UI as InventarioPage
    participant MatCtrl as MaterialController
    participant InvCtrl as InventarioController
    participant Service as MaterialService
    participant Repo as MaterialRepository
    participant DB as material/inventario

    Admin->>UI: Selecciona Nuevo Material
    UI-->>Admin: Muestra modal
    Admin->>UI: Captura nombre, unidad, costo, categoria, stock
    UI->>UI: Valida campos, numeros positivos y duplicidad
    UI->>MatCtrl: POST /materiales
    MatCtrl->>Service: crearMaterial(request)
    Service->>Repo: validar nombre unico
    Repo->>DB: SELECT material
    Service->>Repo: save(material)
    Repo->>DB: INSERT material
    MatCtrl-->>UI: Material creado
    UI->>InvCtrl: POST /inventarios
    InvCtrl->>DB: INSERT inventario por sucursal activa
    UI-->>Admin: Material agregado al inventario
```

## CU13 - Baja de materiales

```mermaid
sequenceDiagram
    actor Admin as Administrador
    participant UI as InventarioPage
    participant Ctrl as MaterialController
    participant Service as MaterialService
    participant Repo as MaterialRepository
    participant DB as material

    Admin->>UI: Busca material y selecciona Editar
    UI-->>Admin: Muestra modal de material
    Admin->>UI: Cambia estado a No disponible/Inactivo
    UI->>Ctrl: PUT /materiales/{id}
    Ctrl->>Service: actualizarMaterial(id, request)
    Service->>Repo: validar que no este en pedidos activos
    Repo->>DB: Consultar dependencias activas
    alt Material en uso
        Service-->>Ctrl: Error de negocio
        Ctrl-->>UI: No se puede inactivar
        UI-->>Admin: Muestra error
    else Material disponible para baja
        Service->>Repo: save(material inactivo)
        Repo->>DB: UPDATE estado
        Ctrl-->>UI: Material actualizado
        UI-->>Admin: Mensaje de confirmacion
    end
```

## CU14 - Consultar inventario

```mermaid
sequenceDiagram
    actor Usuario as Administrador/Empleado
    participant UI as InventarioPage
    participant Ctrl as InventarioController
    participant Service as InventarioService
    participant Repo as InventarioRepository
    participant DB as inventario

    Usuario->>UI: Abre Inventario
    UI->>Ctrl: GET /inventarios
    Ctrl->>Service: listarInventario()
    Service->>Repo: buscar por sucursal activa
    Repo->>DB: SELECT inventario, material y categoria
    DB-->>Repo: Registros
    Repo-->>UI: Inventario
    Usuario->>UI: Busca o filtra material
    UI->>UI: Filtra en pantalla
    UI-->>Usuario: Muestra stock, estado y auditoria
```

## CU15 - Registrar movimientos

```mermaid
sequenceDiagram
    actor Admin as Administrador
    participant UI as InventarioPage
    participant Ctrl as MovimientoInventarioController
    participant Service as MovimientoInventarioService
    participant InvRepo as InventarioRepository
    participant MovRepo as MovimientoInventarioRepository
    participant DB as inventario/movimiento

    Admin->>UI: Abre Movimientos y selecciona Registrar Movimiento
    UI-->>Admin: Muestra modal
    Admin->>UI: Captura material, tipo, cantidad y motivo
    UI->>UI: Valida cantidad positiva y campos
    UI->>Ctrl: POST /movimientos-inventario
    Ctrl->>Service: registrarMovimiento(request)
    Service->>InvRepo: obtener inventario de sucursal activa
    InvRepo->>DB: SELECT inventario
    alt Salida mayor al stock
        Service-->>Ctrl: Error stock insuficiente
        Ctrl-->>UI: Error
    else Movimiento valido
        Service->>InvRepo: actualizar stock
        Service->>MovRepo: guardar movimiento
        DB-->>Service: OK
        Ctrl-->>UI: Movimiento registrado
        UI-->>Admin: Stock actualizado
    end
```

## CU16 - Crear servicios

```mermaid
sequenceDiagram
    actor Admin as Administrador
    participant UI as ServiciosPage
    participant Ctrl as ServicioController
    participant SM as ServicioMaterialController
    participant Service as ServicioService
    participant Repo as ServicioRepository
    participant DB as servicio/servicio_material

    Admin->>UI: Selecciona Nuevo Servicio
    UI-->>Admin: Muestra modal
    Admin->>UI: Captura nombre, descripcion, categoria, materiales y cantidad usada
    UI->>UI: Valida datos y materiales
    UI->>Ctrl: POST /servicios
    Ctrl->>Service: crearServicio(request)
    Service->>Repo: validar nombre unico
    Repo->>DB: INSERT servicio
    Ctrl-->>UI: Servicio creado
    loop Por cada material usado
        UI->>SM: POST /servicios-materiales
        SM->>DB: INSERT material y cantidad usada
    end
    UI-->>Admin: Servicio creado correctamente
```

## CU17 - Agregar materiales al servicio

```mermaid
sequenceDiagram
    actor Admin as Administrador
    participant UI as ServiciosPage
    participant Ctrl as ServicioMaterialController
    participant Service as ServicioMaterialService
    participant Repo as ServicioMaterialRepository
    participant DB as servicio_material

    Admin->>UI: Selecciona Agregar material en un servicio
    UI-->>Admin: Muestra modal de asignacion
    Admin->>UI: Selecciona material y cantidad usada
    UI->>UI: Valida material activo y cantidad mayor a cero
    UI->>Ctrl: POST /servicios-materiales
    Ctrl->>Service: crearRelacion(request)
    Service->>Repo: validar material no repetido
    Repo->>DB: SELECT relacion
    Service->>Repo: save(relacion)
    Repo->>DB: INSERT servicio_material
    Ctrl-->>UI: Relacion creada
    UI-->>Admin: Material asignado
```

## CU18 - Editar servicios

```mermaid
sequenceDiagram
    actor Admin as Administrador
    participant UI as ServiciosPage
    participant Ctrl as ServicioController
    participant SM as ServicioMaterialController
    participant Service as ServicioService
    participant DB as servicio/servicio_material

    Admin->>UI: Selecciona Editar servicio
    UI-->>Admin: Muestra servicio y materiales usados
    Admin->>UI: Modifica datos, categoria, materiales o cantidades
    UI->>UI: Valida duplicidad y campos
    UI->>Ctrl: PUT /servicios/{id}
    Ctrl->>Service: actualizarServicio(id, request)
    Service->>DB: UPDATE servicio
    loop Materiales editados
        UI->>SM: POST/PUT/DELETE /servicios-materiales
        SM->>DB: Sincroniza material usado
    end
    UI-->>Admin: Servicio actualizado correctamente
```

## CU19 - Activar y desactivar servicios

```mermaid
sequenceDiagram
    actor Admin as Administrador
    participant UI as ServiciosPage
    participant Ctrl as ServicioController
    participant Service as ServicioService
    participant Repo as ServicioRepository
    participant DB as servicio/detalle_pedido

    Admin->>UI: Cambia estado del servicio
    UI->>Ctrl: PUT /servicios/{id}
    Ctrl->>Service: actualizarEstado(id, estado)
    Service->>Repo: validar pedidos activos ligados
    Repo->>DB: SELECT detalles de pedidos activos
    alt Servicio en pedidos activos
        Service-->>Ctrl: Error de negocio
        Ctrl-->>UI: No se puede inactivar
        UI-->>Admin: Muestra error
    else Cambio permitido
        Service->>Repo: save(estado)
        Repo->>DB: UPDATE servicio
        UI-->>Admin: Estado actualizado
    end
```

## CU20 - Abrir caja

```mermaid
sequenceDiagram
    actor Admin as Administrador
    participant UI as CorteCajaPage
    participant Ctrl as CorteCajaController
    participant Service as CorteCajaService
    participant Repo as CorteCajaRepository
    participant DB as corte_caja

    Admin->>UI: Abre modulo Caja
    UI-->>Admin: Muestra formulario de apertura
    Admin->>UI: Selecciona empleado, saldo inicial y descripcion
    UI->>UI: Valida empleado y saldo
    UI->>Ctrl: POST /cortes-caja
    Ctrl->>Service: abrirCaja(request)
    Service->>Repo: validar caja abierta del empleado
    Repo->>DB: SELECT cajas abiertas
    alt Ya tiene caja abierta
        Service-->>Ctrl: Error
        Ctrl-->>UI: No puede abrir mas de una caja
    else Apertura valida
        Service->>Repo: save(corte abierto)
        Repo->>DB: INSERT corte_caja
        Ctrl-->>UI: Caja abierta
        UI-->>Admin: Corte abierto correctamente
    end
```

## CU21 - Generar corte de caja

```mermaid
sequenceDiagram
    actor Admin as Administrador
    participant UI as CorteCajaPage
    participant Ctrl as CorteCajaController
    participant PagoCtrl as PagoController
    participant Service as CorteCajaService
    participant DB as corte_caja/pago

    Admin->>UI: Abre Caja y revisa Cajas abiertas
    UI->>Ctrl: GET /cortes-caja
    Ctrl-->>UI: Cajas abiertas e historial
    Admin->>UI: Selecciona caja abierta
    UI->>PagoCtrl: GET /pagos del dia
    PagoCtrl-->>UI: Pagos recibidos
    UI-->>Admin: Muestra resumen esperado
    Admin->>UI: Ingresa saldo real y descripcion
    UI->>Ctrl: PUT /cortes-caja/{id}/cerrar
    Ctrl->>Service: cerrarCaja(id, saldoReal)
    Service->>Service: Calcular saldo esperado y diferencia
    Service->>DB: UPDATE hora_fin, saldo_real, diferencia
    Ctrl-->>UI: Corte cerrado
    UI-->>Admin: Corte cerrado correctamente
```

## CU22 - Generar reportes

```mermaid
sequenceDiagram
    actor Admin as Administrador
    participant UI as ReportesPage
    participant PedidoCtrl as PedidoController
    participant PagoCtrl as PagoController
    participant InvCtrl as InventarioController
    participant DB as Base de datos

    Admin->>UI: Abre Reportes
    Admin->>UI: Selecciona rango de fechas
    UI->>UI: Valida que desde no sea posterior a hasta
    UI->>PedidoCtrl: GET /pedidos
    PedidoCtrl->>DB: Consultar pedidos por sucursal activa
    UI->>PagoCtrl: GET /pagos
    PagoCtrl->>DB: Consultar pagos
    UI->>InvCtrl: GET /inventarios
    InvCtrl->>DB: Consultar inventario
    DB-->>UI: Datos para graficas y resumenes
    UI-->>Admin: Muestra reportes
```

## CU23 - Consultar pedido

```mermaid
sequenceDiagram
    actor Usuario as Administrador/Empleado
    participant UI as PedidosPage
    participant Ctrl as PedidoController
    participant DetCtrl as DetallePedidoController
    participant PagoCtrl as PagoController
    participant DB as pedido/detalle/pago

    Usuario->>UI: Abre Pedidos
    UI->>Ctrl: GET /pedidos
    Ctrl->>DB: SELECT pedidos por sucursal
    DB-->>UI: Lista de pedidos
    Usuario->>UI: Busca o filtra por estado/pago
    UI->>UI: Filtra pedidos
    Usuario->>UI: Expande pedido
    UI->>DetCtrl: GET /detalles-pedido
    UI->>PagoCtrl: GET /pagos
    DB-->>UI: Detalles y pagos realizados
    UI-->>Usuario: Muestra detalle, creador y pagos recibidos
```

## CU24 - Registrar pedido

```mermaid
sequenceDiagram
    actor Admin as Administrador
    participant UI as PuntoVentaPage
    participant PedCtrl as PedidoController
    participant DetCtrl as DetallePedidoController
    participant MovCtrl as MovimientoInventarioController
    participant DB as pedido/detalle/inventario

    Admin->>UI: Captura cliente, forma de pago, entrega y servicios
    UI->>UI: Valida cliente, servicios, precio y credito disponible
    UI->>PedCtrl: POST /pedidos
    PedCtrl->>DB: INSERT pedido con estado Pendiente
    PedCtrl-->>UI: Pedido creado
    loop Por cada servicio del resumen
        UI->>DetCtrl: POST /detalles-pedido
        DetCtrl->>DB: INSERT detalle
        UI->>MovCtrl: POST salida inventario
        MovCtrl->>DB: Descontar material usado una sola vez
    end
    UI-->>Admin: Pedido confirmado
```

## CU25 - Actualizar estado de pedido

```mermaid
sequenceDiagram
    actor Usuario as Administrador/Empleado
    participant UI as PedidosPage
    participant Ctrl as PedidoController
    participant Service as PedidoService
    participant DB as pedido

    Usuario->>UI: Cambia estado del pedido
    UI->>UI: Valida flujo permitido
    alt Cancelar pedido
        UI-->>Usuario: Solicita motivo de cancelacion
        Usuario->>UI: Ingresa motivo
    end
    UI->>Ctrl: PUT /pedidos/{id}
    Ctrl->>Service: actualizarEstado(id, estado, motivo)
    Service->>Service: Validar flujo Pendiente -> En proceso -> Terminado -> Entregado
    Service->>DB: UPDATE estado
    Ctrl-->>UI: Pedido actualizado
    UI-->>Usuario: Estado actualizado
```

## CU26 - Registrar pago

```mermaid
sequenceDiagram
    actor Usuario as Administrador/Empleado
    participant UI as PedidosPage
    participant PagoCtrl as PagoController
    participant PedidoCtrl as PedidoController
    participant Service as PagoService
    participant DB as pago/pedido/cliente

    Usuario->>UI: Selecciona Pago en un pedido
    UI-->>Usuario: Muestra modal de registro de pago
    Usuario->>UI: Captura monto, forma, concepto y referencia
    UI->>UI: Valida referencia obligatoria y monto pendiente
    UI->>PagoCtrl: POST /pagos
    PagoCtrl->>Service: registrarPago(request)
    Service->>DB: INSERT pago
    Service->>DB: Actualizar credito si aplica
    PagoCtrl-->>UI: Pago registrado
    UI->>PedidoCtrl: Refrescar pedido y pagos
    UI-->>Usuario: Muestra estado de pago actualizado
```

## CU27 - Aprobar/rechazar cotizacion

```mermaid
sequenceDiagram
    actor Admin as Administrador
    participant UI as PedidosPage
    participant Ctrl as PedidoController
    participant Service as PedidoService
    participant DB as pedido

    Admin->>UI: Selecciona cotizacion
    alt Aprobar
        Admin->>UI: Cambia de Borrador a Pendiente
        UI->>Ctrl: PUT /pedidos/{id}
        Ctrl->>Service: actualizar a Pendiente
        Service->>DB: UPDATE tipo/estado
        UI-->>Admin: Cotizacion convertida en pedido
    else Rechazar
        Admin->>UI: Selecciona Cancelar
        UI-->>Admin: Solicita motivo
        Admin->>UI: Captura motivo
        UI->>Ctrl: PUT /pedidos/{id}
        Ctrl->>Service: actualizar a Cancelado
        Service->>DB: UPDATE estado y motivo
        UI-->>Admin: Cotizacion cancelada
    end
```

## CU28 - Cerrar sesion

```mermaid
sequenceDiagram
    actor Usuario as Administrador/Empleado
    participant UI as AppLayout
    participant Auth as AuthContext
    participant Storage as LocalStorage

    Usuario->>UI: Selecciona Cerrar sesion
    UI->>Auth: logout()
    Auth->>Storage: Eliminar av_session
    Storage-->>Auth: Sesion eliminada
    Auth-->>UI: Usuario no autenticado
    UI-->>Usuario: Redirige a Login
```

## CU29 - Alta de categoria material

```mermaid
sequenceDiagram
    actor Admin as Administrador
    participant UI as InventarioPage
    participant Ctrl as CategoriaMaterialController
    participant Service as CategoriaMaterialService
    participant Repo as CategoriaMaterialRepository
    participant DB as categoria_material

    Admin->>UI: Abre tab Categorias y selecciona Nueva Categoria
    UI-->>Admin: Muestra modal
    Admin->>UI: Captura nombre, descripcion y estado
    UI->>UI: Valida campos y duplicidad
    UI->>Ctrl: POST /categorias-material
    Ctrl->>Service: crearCategoria(request)
    Service->>Repo: validar nombre unico
    Repo->>DB: SELECT categoria
    Service->>Repo: save(categoria)
    Repo->>DB: INSERT categoria_material
    UI-->>Admin: Categoria creada
```

## CU30 - Baja de categoria material

```mermaid
sequenceDiagram
    actor Admin as Administrador
    participant UI as InventarioPage
    participant Ctrl as CategoriaMaterialController
    participant Service as CategoriaMaterialService
    participant MatRepo as MaterialRepository
    participant DB as categoria_material/material

    Admin->>UI: Cambia categoria a Inactivo
    UI->>Ctrl: PUT /categorias-material/{id}
    Ctrl->>Service: actualizarCategoria(id, request)
    Service->>MatRepo: validar materiales ligados
    MatRepo->>DB: SELECT materiales por categoria
    alt Categoria ligada a materiales
        Service-->>Ctrl: Error de negocio
        Ctrl-->>UI: No se puede inactivar
        UI-->>Admin: Muestra mensaje
    else Sin materiales ligados
        Service->>DB: UPDATE estado Inactivo
        UI-->>Admin: Categoria actualizada
    end
```

## CU31 - Editar categoria material

```mermaid
sequenceDiagram
    actor Admin as Administrador
    participant UI as InventarioPage
    participant Ctrl as CategoriaMaterialController
    participant Service as CategoriaMaterialService
    participant Repo as CategoriaMaterialRepository
    participant DB as categoria_material

    Admin->>UI: Selecciona Editar categoria
    UI-->>Admin: Muestra modal con datos actuales
    Admin->>UI: Modifica nombre, descripcion o estado
    UI->>UI: Valida duplicidad
    UI->>Ctrl: PUT /categorias-material/{id}
    Ctrl->>Service: actualizarCategoria(id, request)
    Service->>Repo: save(categoria)
    Repo->>DB: UPDATE categoria_material
    Ctrl-->>UI: Categoria actualizada
    UI-->>Admin: Mensaje de confirmacion
```

## CU32 - Alta de categoria servicio

```mermaid
sequenceDiagram
    actor Admin as Administrador
    participant UI as ServiciosPage
    participant Ctrl as CategoriaServicioController
    participant Service as CategoriaServicioService
    participant Repo as CategoriaServicioRepository
    participant DB as categoria_servicio

    Admin->>UI: Abre tab Categorias y selecciona Nueva Categoria
    UI-->>Admin: Muestra modal
    Admin->>UI: Captura nombre, descripcion y estado
    UI->>UI: Valida campos y duplicidad
    UI->>Ctrl: POST /categorias-servicio
    Ctrl->>Service: crearCategoria(request)
    Service->>Repo: validar nombre unico
    Repo->>DB: SELECT categoria
    Service->>Repo: save(categoria)
    Repo->>DB: INSERT categoria_servicio
    UI-->>Admin: Categoria creada
```

## CU33 - Baja de categoria servicio

```mermaid
sequenceDiagram
    actor Admin as Administrador
    participant UI as ServiciosPage
    participant Ctrl as CategoriaServicioController
    participant Service as CategoriaServicioService
    participant ServRepo as ServicioRepository
    participant DB as categoria_servicio/servicio

    Admin->>UI: Cambia categoria a Inactivo
    UI->>Ctrl: PUT /categorias-servicio/{id}
    Ctrl->>Service: actualizarCategoria(id, request)
    Service->>ServRepo: validar servicios ligados
    ServRepo->>DB: SELECT servicios por categoria
    alt Categoria ligada a servicios
        Service-->>Ctrl: Error de negocio
        Ctrl-->>UI: No se puede inactivar
        UI-->>Admin: Muestra mensaje
    else Sin servicios ligados
        Service->>DB: UPDATE estado Inactivo
        UI-->>Admin: Categoria actualizada
    end
```

## CU34 - Editar categoria servicio

```mermaid
sequenceDiagram
    actor Admin as Administrador
    participant UI as ServiciosPage
    participant Ctrl as CategoriaServicioController
    participant Service as CategoriaServicioService
    participant Repo as CategoriaServicioRepository
    participant DB as categoria_servicio

    Admin->>UI: Selecciona Editar categoria
    UI-->>Admin: Muestra modal con datos actuales
    Admin->>UI: Modifica nombre, descripcion o estado
    UI->>UI: Valida duplicidad
    UI->>Ctrl: PUT /categorias-servicio/{id}
    Ctrl->>Service: actualizarCategoria(id, request)
    Service->>Repo: save(categoria)
    Repo->>DB: UPDATE categoria_servicio
    Ctrl-->>UI: Categoria actualizada
    UI-->>Admin: Mensaje de confirmacion
```
