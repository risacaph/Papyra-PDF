package stirling.software.proprietary.security.model;

import java.io.Serializable;
import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.*;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * A single-use, expiring token backing the self-service password reset flow. Only the SHA-256 hash
 * of the token is stored; the raw token is sent once in the emailed reset link and never persisted.
 */
@Entity
@Table(name = "password_reset_tokens")
@NoArgsConstructor
@Getter
@Setter
public class PasswordResetToken implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // SHA-256 hex of the raw token. The raw token only ever exists in the emailed link.
    @Column(name = "token_hash", unique = true, nullable = false, length = 64)
    private String tokenHash;

    @Column(name = "username", nullable = false, length = 255)
    private String username;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "used", nullable = false)
    private boolean used = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "used_at")
    private LocalDateTime usedAt;

    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }

    public boolean isValid() {
        return !used && !isExpired();
    }
}
