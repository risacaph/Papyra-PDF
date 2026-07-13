package stirling.software.proprietary.security.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.mail.MessagingException;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import stirling.software.common.model.exception.UnsupportedProviderException;
import stirling.software.proprietary.security.database.repository.UserRepository;
import stirling.software.proprietary.security.model.PasswordResetToken;
import stirling.software.proprietary.security.model.User;
import stirling.software.proprietary.security.repository.PasswordResetTokenRepository;

/**
 * Self-service password reset for local (non-SSO) accounts. A logged-out user requests a reset for
 * their email; a single-use, short-lived token is emailed as a link, and following the link lets
 * them set a new password.
 *
 * <p>Security posture:
 *
 * <ul>
 *   <li>Only the SHA-256 hash of the token is stored; the raw token lives only in the emailed link.
 *   <li>Tokens are high-entropy ({@link SecureRandom}), single-use and expire quickly.
 *   <li>{@link #requestReset} never reveals whether an account exists (no user enumeration) and
 *       silently ignores SSO accounts and accounts without a local password.
 *   <li>All of the user's sessions are invalidated after a successful reset.
 * </ul>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final int TOKEN_BYTES = 32;
    private static final long TOKEN_EXPIRY_MINUTES = 60;
    private static final DateTimeFormatter EXPIRY_FORMAT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private final PasswordResetTokenRepository tokenRepository;
    private final UserRepository userRepository;
    private final UserService userService;
    private final Optional<EmailService> emailService;

    /**
     * Creates a single-use reset token for the account with the given email and emails a reset
     * link. Silently no-ops when email is unconfigured, the address is unknown, or the account is
     * SSO / has no local password — callers must not reveal which case occurred.
     */
    @Transactional
    public void requestReset(String email, String baseUrl) {
        if (email == null || email.isBlank() || emailService.isEmpty()) {
            return;
        }
        Optional<User> maybeUser = userRepository.findByEmail(email.trim());
        if (maybeUser.isEmpty()) {
            return;
        }
        User user = maybeUser.get();
        // Local-password accounts only; SSO/OAuth users reset via their identity provider.
        if (!user.hasPassword()
                || userService.isSsoAuthenticationTypeByUsername(user.getUsername())) {
            return;
        }

        // Invalidate any earlier outstanding tokens for this user.
        tokenRepository.deleteByUsername(user.getUsername());

        String rawToken = generateRawToken();
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(TOKEN_EXPIRY_MINUTES);

        PasswordResetToken token = new PasswordResetToken();
        token.setTokenHash(sha256Hex(rawToken));
        token.setUsername(user.getUsername());
        token.setExpiresAt(expiresAt);
        tokenRepository.save(token);

        String resetUrl = baseUrl + "/reset-password?token=" + rawToken;
        try {
            emailService
                    .get()
                    .sendPasswordResetEmail(
                            email.trim(), resetUrl, expiresAt.format(EXPIRY_FORMAT));
        } catch (MessagingException e) {
            log.warn("Failed to send password reset email", e);
        }
    }

    /** True if the raw token maps to a currently valid (unused, unexpired) reset token. */
    @Transactional(readOnly = true)
    public boolean isTokenValid(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            return false;
        }
        return tokenRepository
                .findByTokenHash(sha256Hex(rawToken))
                .map(PasswordResetToken::isValid)
                .orElse(false);
    }

    /**
     * Consumes the token and sets the new password. Returns {@code false} if the token is unknown,
     * expired or already used. On success the token is marked used and the user's sessions are
     * invalidated.
     */
    @Transactional
    public boolean resetPassword(String rawToken, String newPassword)
            throws SQLException, UnsupportedProviderException {
        if (rawToken == null
                || rawToken.isBlank()
                || newPassword == null
                || newPassword.isEmpty()) {
            return false;
        }
        Optional<PasswordResetToken> maybeToken =
                tokenRepository.findByTokenHash(sha256Hex(rawToken));
        if (maybeToken.isEmpty() || !maybeToken.get().isValid()) {
            return false;
        }
        PasswordResetToken token = maybeToken.get();
        Optional<User> maybeUser = userRepository.findByUsername(token.getUsername());
        if (maybeUser.isEmpty()) {
            return false;
        }
        User user = maybeUser.get();

        userService.changePassword(user, newPassword);
        token.setUsed(true);
        token.setUsedAt(LocalDateTime.now());
        tokenRepository.save(token);
        userService.invalidateUserSessions(user.getUsername());
        log.info("Password reset completed for user {}", user.getUsername());
        return true;
    }

    private String generateRawToken() {
        byte[] bytes = new byte[TOKEN_BYTES];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String sha256Hex(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(hash.length * 2);
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm not available", e);
        }
    }
}
