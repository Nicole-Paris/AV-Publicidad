export function esEmpleado(session) {
  return (session?.rol || "").toLowerCase() === "empleado";
}

export function esAdministrador(session) {
  return (session?.rol || "").toLowerCase() === "administrador";
}

export function puedeAccederRuta(session, pathname) {
  if (!esEmpleado(session)) return true;
  const rutasPermitidas = [
    "/pedidos",
    "/clientes",
    "/inventario",
    "/configuracion"
  ];
  return rutasPermitidas.some(
    ruta => pathname === ruta || pathname.startsWith(`${ruta}/`)
  );
}
