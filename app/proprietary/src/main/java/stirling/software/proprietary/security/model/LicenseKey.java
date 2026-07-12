package stirling.software.proprietary.security.model;

import java.io.Serializable;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * A distributable license key an administrator generates and hands out. Redeeming a key grants the
 * redeeming user the key's {@link LicenseTier} and resets their access expiry.
 *
 * <p>The key carries the tier and an optional duration override ({@link #durationMonths}); a {@code
 * null} override falls back to the tier's configured plan duration (which may itself be unlimited).
 * The device cap is not stored on the key — it always follows the granted tier's plan, so a single
 * source of truth ({@code PlanDefinition}) governs device limits.
 *
 * <p>A key may be redeemed up to {@link #maxRedemptions} times (defaults to one, i.e. single-use),
 * which is how one code can be distributed to a batch of users.
 */
@Entity
@Table(name = "license_keys")
@NoArgsConstructor
@Getter
@Setter
public class LicenseKey implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    /** The redemption code shown to admins and entered by users (e.g. PAPYRA-XXXXX-XXXXX-XXXXX). */
    @Column(name = "code", nullable = false, unique = true, length = 64)
    private String code;

    /** The {@link LicenseTier} name this key grants (FREE / PRO / ULTIMATE). */
    @Column(name = "tier", nullable = false, length = 32)
    private String tier;

    /**
     * Access duration in months granted on redemption, or {@code null} to use the granted tier's
     * configured plan duration (which may itself be {@code null} = never expires).
     */
    @Column(name = "duration_months")
    private Integer durationMonths;

    /** How many times this key may be redeemed in total. */
    @Column(name = "max_redemptions", nullable = false)
    private int maxRedemptions;

    /** How many times this key has been redeemed so far. */
    @Column(name = "redemption_count", nullable = false)
    private int redemptionCount;

    /** Optional admin note describing the key's purpose. */
    @Column(name = "label", length = 256)
    private String label;

    /** Username of the admin who generated the key. */
    @Column(name = "created_by", length = 128)
    private String createdBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "last_redeemed_at")
    private LocalDateTime lastRedeemedAt;

    /** Whether every redemption slot has been used up. */
    public boolean isExhausted() {
        return redemptionCount >= maxRedemptions;
    }
}
