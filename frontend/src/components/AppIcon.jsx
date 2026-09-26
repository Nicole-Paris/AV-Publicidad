import arrowLeftIcon from "../assets/icons/arrow-left.svg";
import ajustesIcon from "../assets/icons/ajustes.webp";
import carritoIcon from "../assets/icons/carrito.webp";
import clienteIcon from "../assets/icons/cliente.webp";
import corteIcon from "../assets/icons/corte.webp";
import eyeIcon from "../assets/icons/eye.svg";
import eyeOffIcon from "../assets/icons/eye-off.svg";
import inventarioIcon from "../assets/icons/inventario.webp";
import imprimirIcon from "../assets/icons/imprimir.webp";
import logoutIcon from "../assets/icons/logout.svg";
import pedidosIcon from "../assets/icons/pedidos.webp";
import reporteIcon from "../assets/icons/reporte.webp";
import searchIcon from "../assets/icons/search.svg";
import storeIcon from "../assets/icons/store.svg";
import userIcon from "../assets/icons/user.svg";

const iconFiles = {
  arrowLeft: arrowLeftIcon,
  box: inventarioIcon,
  cart: carritoIcon,
  chart: reporteIcon,
  doc: pedidosIcon,
  eye: eyeIcon,
  eyeOff: eyeOffIcon,
  gear: ajustesIcon,
  logout: logoutIcon,
  money: corteIcon,
  print: imprimirIcon,
  search: searchIcon,
  store: storeIcon,
  user: userIcon,
  users: clienteIcon
};

export function AppIcon({ name, className = "", size = 24 }) {
  const src = iconFiles[name];

  if (!src) {
    return null;
  }

  return (
    <img
      alt=""
      aria-hidden="true"
      className={`app-icon ${className}`.trim()}
      height={size}
      src={src}
      width={size}
    />
  );
}
