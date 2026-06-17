# Diagrama de clases actualizado

Archivo editable:

- `docs/diagrama-clases-actualizado.mmd`

Este diagrama se ajusto al backend actual del sistema:

- Las clases principales salen de `src/main/java/avpublicidad/proyecto/model`.
- Las relaciones se representan con los campos `...Id`, porque las entidades usan IDs enteros y no anotaciones `@ManyToOne` o `@OneToMany`.
- No se agregaron enums Java para `FormaPago`, `OrigenPedido`, `EstadoPedido` o `EstadoMaterial`, porque en el codigo actual esos valores se guardan como `String`.
- Los metodos de recuperacion de contrasena no pertenecen a `Empleado`; estan en `RecuperacionContrasenaService`.
- Los metodos de login/logout estan en `AuthService`.
- La generacion de nota PDF esta en `NotaPedidoPdfService`.

Para pasarlo a diagrams.net/draw.io:

1. Abrir diagrams.net.
2. Ir a `Insert > Advanced > Mermaid`.
3. Pegar el contenido de `diagrama-clases-actualizado.mmd`.
4. Ajustar posiciones visuales si hace falta y exportar a PNG/PDF.
