package stirling.software.proprietary.security.service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

import stirling.software.proprietary.security.model.LicenseKey;
import stirling.software.proprietary.security.model.LicenseTier;
import stirling.software.proprietary.security.model.User;
import stirling.software.proprietary.security.repository.LicenseKeyRepository;

/**
 * Admin-generated, user-redeemable license keys. An administrator mints a key for a tier (with an
 * optional custom duration and a redemption count); a signed-in user later redeems the code to gain
 * that tier.
 *
 * <p>Redemption never downgrades: a key whose tier is lower than the user's current effective tier
 * is refused. Redeeming the same tier a user already holds extends their access rather than
 * shortening it. The device cap always follows the granted tier's plan (see {@link
 * PlanDefinitionService}); it is not carried on the key.
 */
@Service
@RequiredArgsConstructor
public class LicenseKeyService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    // Unambiguous alphabet: no I/O/0/1 so hand-typed codes are hard to mistype.
    private static final char[] CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789".toCharArray();
    private static final String CODE_PREFIX = "PAPYRA";
    private static final int CODE_SEGMENTS = 3;
    private static final int CODE_SEGMENT_LENGTH = 5;
    private static final int MAX_UNIQUE_ATTEMPTS = 20;

    private static final int MAX_DURATION_MONTHS = 1200; // 100 years, matches PlanDefinitionService
    private static final int MAX_REDEMPTIONS = 100_000;
    private static final int MAX_LABEL_LENGTH = 256;

    private final LicenseKeyRepository licenseKeyRepository;
    private final UserLicenseAccessService licenseAccessService;
    private final PlanDefinitionService planDefinitionService;

    /** All keys, most recently created first (admin view). */
    public List<LicenseKey> list() {
        return licenseKeyRepository.findAllByOrderByCreatedAtDesc();
    }

    /**
     * Mints a new key.
     *
     * @param tier the tier the key grants
     * @param durationMonths custom duration in months, or {@code null} to use the tier's plan
     *     default
     * @param maxRedemptions how many times the key may be redeemed (at least one)
     * @param label optional admin note
     * @param createdBy username of the admin minting the key
     * @throws IllegalArgumentException if the duration or redemption count is out of range
     */
    @Transactional
    public LicenseKey generate(
            LicenseTier tier,
            Integer durationMonths,
            int maxRedemptions,
            String label,
            String createdBy) {
        if (durationMonths != null
                && (durationMonths < 1 || durationMonths > MAX_DURATION_MONTHS)) {
            throw new IllegalArgumentException(
                    "Duration must be between 1 and " + MAX_DURATION_MONTHS + " months, or empty");
        }
        if (maxRedemptions < 1 || maxRedemptions > MAX_REDEMPTIONS) {
            throw new IllegalArgumentException(
                    "Redemptions must be between 1 and " + MAX_REDEMPTIONS);
        }
        LicenseKey key = new LicenseKey();
        key.setCode(generateUniqueCode());
        key.setTier(tier.name());
        key.setDurationMonths(durationMonths);
        key.setMaxRedemptions(maxRedemptions);
        key.setRedemptionCount(0);
        key.setLabel(truncateLabel(label));
        key.setCreatedBy(createdBy);
        key.setCreatedAt(LocalDateTime.now());
        return licenseKeyRepository.save(key);
    }

    /** Deletes a key. Returns whether a row was removed. */
    @Transactional
    public boolean revoke(long id) {
        Optional<LicenseKey> key = licenseKeyRepository.findById(id);
        if (key.isPresent()) {
            licenseKeyRepository.delete(key.get());
            return true;
        }
        return false;
    }

    /**
     * Redeems a key for the given user, applying its tier and expiry.
     *
     * @throws IllegalArgumentException if the code is unknown or fully redeemed, or if the key
     *     would downgrade the user's current plan
     */
    @Transactional
    public RedemptionOutcome redeem(User user, String rawCode) {
        String code = rawCode == null ? "" : rawCode.trim().toUpperCase(Locale.ROOT);
        LicenseKey key =
                licenseKeyRepository
                        .findByCode(code)
                        .orElseThrow(
                                () ->
                                        new IllegalArgumentException(
                                                "That license key is not valid."));
        if (key.isExhausted()) {
            throw new IllegalArgumentException("That license key has already been used up.");
        }

        LicenseTier grantedTier = LicenseTier.fromString(key.getTier());
        if (grantedTier.getRank() < licenseAccessService.effectiveTier(user).getRank()) {
            throw new IllegalArgumentException(
                    "Your current plan is already higher than this key grants.");
        }

        LocalDateTime expiresAt = computeExpiry(user, grantedTier, key.getDurationMonths());
        licenseAccessService.applyGrant(user, grantedTier, expiresAt);

        key.setRedemptionCount(key.getRedemptionCount() + 1);
        key.setLastRedeemedAt(LocalDateTime.now());
        licenseKeyRepository.save(key);

        return new RedemptionOutcome(grantedTier, expiresAt);
    }

    /**
     * The absolute expiry to grant. Renewing the tier a user already holds extends from their
     * current expiry (never shortens it); otherwise it counts from now. A duration that resolves to
     * {@code null} — no override and a plan that never expires — grants unlimited access.
     */
    private LocalDateTime computeExpiry(User user, LicenseTier tier, Integer durationOverride) {
        Integer months =
                durationOverride != null
                        ? durationOverride
                        : planDefinitionService.durationMonthsFor(tier);
        if (months == null) {
            return null;
        }
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime base = now;
        LocalDateTime currentExpiry = user.getLicenseExpiresAt();
        boolean sameTier = tier.name().equalsIgnoreCase(user.getLicenseTier());
        if (sameTier && currentExpiry != null && currentExpiry.isAfter(now)) {
            base = currentExpiry;
        }
        return base.plusMonths(months);
    }

    private String generateUniqueCode() {
        for (int attempt = 0; attempt < MAX_UNIQUE_ATTEMPTS; attempt++) {
            String candidate = buildCode();
            if (!licenseKeyRepository.existsByCode(candidate)) {
                return candidate;
            }
        }
        throw new IllegalStateException(
                "Could not generate a unique license key. Please try again.");
    }

    private static String buildCode() {
        StringBuilder builder = new StringBuilder(CODE_PREFIX);
        for (int segment = 0; segment < CODE_SEGMENTS; segment++) {
            builder.append('-');
            for (int i = 0; i < CODE_SEGMENT_LENGTH; i++) {
                builder.append(CODE_ALPHABET[SECURE_RANDOM.nextInt(CODE_ALPHABET.length)]);
            }
        }
        return builder.toString();
    }

    private static String truncateLabel(String rawLabel) {
        if (rawLabel == null) {
            return null;
        }
        String trimmed = rawLabel.trim();
        if (trimmed.isEmpty()) {
            return null;
        }
        return trimmed.length() > MAX_LABEL_LENGTH
                ? trimmed.substring(0, MAX_LABEL_LENGTH)
                : trimmed;
    }

    /** The tier and expiry applied to the user by a successful redemption. */
    public record RedemptionOutcome(LicenseTier tier, LocalDateTime expiresAt) {}
}
