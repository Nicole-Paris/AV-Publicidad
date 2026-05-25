package avpublicidad.proyecto.config;

import avpublicidad.proyecto.constants.RolConstants;
import avpublicidad.proyecto.security.JwtAuthenticationFilter;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {

    private static final String AUTHORITY_ADMINISTRADOR = "ROLE_" + RolConstants.ADMINISTRADOR.toUpperCase();
    private static final String AUTHORITY_EMPLEADO = "ROLE_" + RolConstants.EMPLEADO.toUpperCase();

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            ObjectProvider<JwtAuthenticationFilter> jwtAuthenticationFilterProvider
    ) throws Exception {
        JwtAuthenticationFilter jwtAuthenticationFilter = jwtAuthenticationFilterProvider.getIfAvailable();

        http
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS));

        if (jwtAuthenticationFilter == null) {
            http.authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
            return http.build();
        }

        http.authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/auth/login").permitAll()
                .requestMatchers("/auth/logout").permitAll()
                .requestMatchers(HttpMethod.GET, "/**").hasAnyAuthority(AUTHORITY_ADMINISTRADOR, AUTHORITY_EMPLEADO)
                .requestMatchers(HttpMethod.POST, "/clientes").hasAnyAuthority(AUTHORITY_ADMINISTRADOR, AUTHORITY_EMPLEADO)
                .requestMatchers(HttpMethod.POST, "/pagos").hasAnyAuthority(AUTHORITY_ADMINISTRADOR, AUTHORITY_EMPLEADO)
                .anyRequest().hasAuthority(AUTHORITY_ADMINISTRADOR)
        );

        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
