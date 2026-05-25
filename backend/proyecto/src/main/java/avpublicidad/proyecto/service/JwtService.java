package avpublicidad.proyecto.service;

import avpublicidad.proyecto.model.Empleado;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.Map;

@Service
public class JwtService {

    private final Key key;
    private final long expirationMillis;

    public JwtService(
            @Value("${app.jwt.secret:AVPublicidadSecretKeyForJwtAuthChangeMe123456}") String secret,
            @Value("${app.jwt.expiration-millis:86400000}") long expirationMillis
    ) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMillis = expirationMillis;
    }

    public String generarToken(Empleado empleado, String rol) {
        Date now = new Date();
        Date expiration = new Date(now.getTime() + expirationMillis);

        return Jwts.builder()
                .setSubject(empleado.getCorreo())
                .addClaims(Map.of(
                        "empleadoId", empleado.getIdEmpleado(),
                        "rolId", empleado.getRolId(),
                        "rol", rol
                ))
                .setIssuedAt(now)
                .setExpiration(expiration)
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public String obtenerCorreo(String token) {
        return obtenerClaims(token).getSubject();
    }

    public boolean esTokenValido(String token, Empleado empleado) {
        String correo = obtenerCorreo(token);
        return correo.equals(empleado.getCorreo()) && !estaExpirado(token);
    }

    private boolean estaExpirado(String token) {
        return obtenerClaims(token).getExpiration().before(new Date());
    }

    private Claims obtenerClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}
