package avpublicidad.proyecto.security;

import avpublicidad.proyecto.model.Empleado;
import avpublicidad.proyecto.repository.EmpleadoRepository;
import avpublicidad.proyecto.service.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
@ConditionalOnBean({JwtService.class, EmpleadoRepository.class})
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final EmpleadoRepository empleadoRepository;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);

        try {
            String correo = jwtService.obtenerCorreo(token);
            if (correo != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                empleadoRepository.findByCorreo(correo)
                        .filter(empleado -> empleado.getDeletedAt() == null)
                        .filter(empleado -> jwtService.esTokenValido(token, empleado))
                        .ifPresent(empleado -> autenticar(request, empleado));
            }
        } catch (RuntimeException ignored) {
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }

    private void autenticar(HttpServletRequest request, Empleado empleado) {
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                empleado,
                null,
                List.of(new SimpleGrantedAuthority("ROLE_" + empleado.getRolId()))
        );
        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }
}
