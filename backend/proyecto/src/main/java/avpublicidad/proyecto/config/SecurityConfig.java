package avpublicidad.proyecto.config;

import avpublicidad.proyecto.constants.RolConstants;
import avpublicidad.proyecto.repository.EmpleadoRepository;
import avpublicidad.proyecto.security.JwtAuthenticationFilter;
import avpublicidad.proyecto.service.JwtService;
import java.util.List;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
public class SecurityConfig {

    private static final String AUTHORITY_ADMINISTRADOR = "ROLE_" + RolConstants.ADMINISTRADOR.toUpperCase();
    private static final String AUTHORITY_EMPLEADO = "ROLE_" + RolConstants.EMPLEADO.toUpperCase();

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            ObjectProvider<JwtService> jwtServiceProvider,
            ObjectProvider<EmpleadoRepository> empleadoRepositoryProvider
    ) throws Exception {
        JwtService jwtService = jwtServiceProvider.getIfAvailable();
        EmpleadoRepository empleadoRepository = empleadoRepositoryProvider.getIfAvailable();

        http
                .cors(Customizer.withDefaults())
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS));

        if (jwtService == null || empleadoRepository == null) {
            http.authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
            return http.build();
        }

        JwtAuthenticationFilter jwtAuthenticationFilter =
                new JwtAuthenticationFilter(jwtService, empleadoRepository);

        http.authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/auth/login").permitAll()
                .requestMatchers("/auth/logout").permitAll()
                .requestMatchers("/auth/recuperacion/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/sucursales").permitAll()
                .requestMatchers(HttpMethod.GET, "/**").hasAnyAuthority(AUTHORITY_ADMINISTRADOR, AUTHORITY_EMPLEADO)
                .requestMatchers(HttpMethod.PUT, "/empleados/*/cuenta").hasAnyAuthority(AUTHORITY_ADMINISTRADOR, AUTHORITY_EMPLEADO)
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

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(
                "http://localhost:5173",
                "http://localhost:5180",
                "http://localhost:4180"
        ));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        configuration.setExposedHeaders(List.of("Authorization"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
