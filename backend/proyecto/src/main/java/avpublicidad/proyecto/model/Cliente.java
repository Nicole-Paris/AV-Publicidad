package avpublicidad.proyecto.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "cliente")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Cliente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_cliente")
    private Integer idCliente;

    @Column(nullable = false, length = 50)
    private String nombre;

    @Column(name = "apellido_paterno", nullable = false, length = 45)
    private String apellidoPaterno;

    @Column(name = "apellido_materno", length = 45)
    private String apellidoMaterno;

    @Column(nullable = false, length = 15)
    private String telefono;

    @Column(nullable = false)
    private String tipo;

    @Column(name = "tiene_credito")
    private Boolean tieneCredito;

    @Column(name = "credito_actual", precision = 10, scale = 2)
    private BigDecimal creditoActual;

    @Column(name = "limite_credito", precision = 10, scale = 2)
    private BigDecimal limiteCredito;

    @Column(length = 60)
    private String direccion;

    @Column(length = 15, unique = true)
    private String rfc;

    @Column(name = "codigo_postal", length = 10)
    private String codigoPostal;

    @Column(name = "razon_social", length = 30)
    private String razonSocial;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Column(name = "created_by", nullable = false)
    private Integer createdBy;

    @Column(name = "updated_by")
    private Integer updatedBy;

    @Column(name = "deleted_by")
    private Integer deletedBy;
}
